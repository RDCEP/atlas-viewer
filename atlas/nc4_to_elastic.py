from __future__ import division
import sys
from datetime import datetime
import itertools
import ntpath
import multiprocessing as mp
try:
    import simplejson as json
except ImportError:
    import json
import numpy as np
from elasticsearch import Elasticsearch, ElasticsearchException
from elasticsearch import helpers
from netCDF4 import Dataset
from constants import ELASTICSEARCH as ES


__author__ = "rblourenco@uchicago.edu"
# 2015-08-19 - Initial commit


db = Elasticsearch()


class NetCDFToElastic(object):
    def __init__(self, nc_file, sigfigs=3):
        """Class for writing geospatial information to Mongo from netCDF files

        :param nc_file: Path to netCDF input file
        :type nc_file: str
        :return: None
        :rtype: None
        """
        self.nc_file = nc_file
        self.nc_dataset = Dataset(self.nc_file, 'r')
        self.sigfigs = sigfigs
        self.name = None
        self.human_name = None
        self._lon_var = None
        self._lat_var = None
        self._variables = None
        self._dimensions = None
        self._parameters = None
        try:
            self._lats = self.nc_dataset.variables[self.lat_var][:]
        except KeyError:
            raise Exception('Dataset must have a latitude dimension.')
        try:
            self._lons = self.nc_dataset.variables[self.lon_var][:]
        except KeyError:
            raise Exception('Dataset must have a longitude dimension.')

    @property
    def parameters(self):
        return self._parameters

    @parameters.setter
    def parameters(self, value):
        self._parameters = value

    @property
    def dimensions(self):
        """List of dimensions other than longitude and latitude.

        :return: List of dimensions in NetCDF file (excluding lonlat)
         :rtype: list
        """
        if self._dimensions is None:
            self._dimensions = [d for d in self.nc_dataset.dimensions.keys()
                                if d not in [self.lon_var, self.lat_var]]
        return self._dimensions

    @property
    def variables(self):
        """List of variables in NetCDF, other than dimensions in NetCDF.

        :return: List of variables in NetCDF file (excluding dimensions)
         :rtype: list
        """
        if self._variables is None:
            self._variables = [v for v in self.nc_dataset.variables.keys()
                               if v not in self.nc_dataset.dimensions.keys()]
        return self._variables

    @property
    def lat_var(self):
        if self._lat_var is None:
            self._lat_var = 'lat'
        return self._lat_var

    @property
    def lon_var(self):
        if self._lon_var is None:
            self._lon_var = 'lon'
        return self._lon_var

    @property
    def lats(self):
        return self._lats

    @property
    def lons(self):
        return self._lons

    @property
    def pixel_side_length(self):
        """

        Using degree decimals - if zero, states a point

        :return:
        :rtype: tuple
        """
        return abs(np.diff(self.lons[:2])[0]), abs(np.diff(self.lats[:2])[0])

    @property
    def metadata(self):
        return {
            'name': self.name,
            'human_name': self.human_name,
            'date_created': datetime.now(),
            'date_inserted': datetime.now(),
            'dimensions': [
                {'name': self.nc_dataset.variables[d].name,
                 'human_name': self.nc_dataset.variables[d].long_name,
                 'min': np.min(self.nc_dataset.variables[d][:]),
                 'max': np.max(self.nc_dataset.variables[d][:]),
                 'size': self.nc_dataset.variables[d].size,
                 'unit': self.nc_dataset.variables[d].units,
                 } for d in self.dimensions],
            'variables': [
                {'name': self.nc_dataset.variables[v].name,
                 'human_name': self.nc_dataset.variables[v].long_name,
                 'min': float(np.min(self.nc_dataset.variables[v][:])),
                 'max': float(np.max(self.nc_dataset.variables[v][:])),
                 'unit': self.nc_dataset.variables[v].units,
                 'dimension_idxs': [i for i, d in enumerate(self.dimensions)
                                    if d in self.nc_dataset.variables[v].dimensions],
                 'dimensions': [d for i, d in enumerate(self.dimensions)
                                if d in self.nc_dataset.variables[v].dimensions],
                 } for v in self.variables],
            'parameters': self.parameters,
        }

    def num_or_null(self, arr):
        """Represent null values from netCDF as '--' and numeric values
        as floats.
        """
        try:
            if np.ma.getmask(arr).any():
                if arr.count() == 0:
                    return None
                return np.ma.filled(arr, np.nan)
        except ValueError:
            print(
            '\n*** Encountered uncoercible non-numeric ***\n{}\n\n'.format(
                arr
            ))
            pass

    def create_indices(self):
        r = db.indices.delete(index=ES['meta_index'], ignore=[400, 404])
        r = db.indices.delete(index=ES['grid_index'], ignore=[400, 404])

        db.indices.create(index=ES['meta_index'], body={
            'settings': {
                'number_of_shards': 1,
                'number_of_replicas': 0,
            }})

        db.indices.create(index=ES['grid_index'], body={
            'mappings': {
                'griddata': {
                    'properties': {
                        'location': {
                            'type': 'geo_point'
                        }}}},
            'settings': {
                'number_of_shards': 1,
                'number_of_replicas': 0,
            }})

    def parallel_ingest(self):
        self.create_indices()

        self.ingest_metadata()

        for variable in self.variables:
            values = self.nc_dataset[variable][:]
            jobs = []
            n = 1
            for i in range(n):
                p = mp.Process(target=self.ingest_data, args=(values, variable, n, i))
                jobs.append(p)
                p.start()
            for j in jobs:
                j.join()

            # start_index = datetime.now()
            # print('\n*** Start Indexing ***\n{}\n'.format(start_index))
            # points = db['{}_{}'.format(self.name, variable)]
            # points.create_index([('geometry', GEOSPHERE)])
            # end_index = datetime.now()
            # print('\n*** Elapsed ***\n{}\n'.format(end_index - start_index))

    def ingest_metadata(self):
        db.index(
            index=ES['meta_index'], doc_type=ES['meta_type'],
            body=self.metadata)

    def ingest_data(self, values, variable, sectors=1, sector=0):

        start_time = datetime.now()
        print('*** Start Run ***\n{}\n\n'.format(start_time))

        lons_lats = itertools.product(
            enumerate(self.lats), enumerate(self.lons))
        lons_lats = np.array_split(
            np.array([x for x in lons_lats]), sectors)[sector]

        try:

            values = np.swapaxes(
                values, self.nc_dataset.variables[variable].dimensions.index(
                    self.lat_var), 0)

            values = np.swapaxes(
                values, self.nc_dataset.variables[variable].dimensions.index(
                    self.lon_var), 1)

            idx = 1
            bulk = []

            for (lat_idx, lat), (lon_idx, lon) in lons_lats:

                try:
                    val = self.num_or_null(
                        values[lat_idx, lon_idx])
                    if val is None:
                        continue

                    tile = GenerateDocument(
                        lon, lat, val,
                        self.pixel_side_length[0],
                        self.pixel_side_length[1],
                        self.dimensions,
                    ).as_dict

                    bulk.append({
                        '_index': ES['grid_index'],
                        '_type': ES['grid_type'],
                        '_source': tile,
                    })

                    if idx % 500 == 0 or idx == len(lons_lats):

                        helpers.bulk(db, bulk,
                            index=ES['grid_index'], doc_type=ES['grid_type'],)

                        bulk = []

                except:
                    print('Unexpected error:', sys.exc_info()[0])
                    raise
                # print '*** Inserted {} Points ***'.format(len(new_points))
                # print result.inserted_ids
                # print '*** End Points ***'
                idx += 1
                tile = {}
                val = None

        except ElasticsearchException:
            print('Error while committing on Elasticsearch')
            raise
        except:
            print('Unexpected error:', sys.exc_info()[0])
            raise

        end_time = datetime.now()
        print('\n*** End Run ***\n{}\n'.format(end_time))
        elapsed_time = end_time - start_time
        print('\n*** Elapsed ***\n{}\n'.format(elapsed_time))


# Define GeoJSON standard for ATLAS
class GenerateDocument(object):
    def __init__(self, x, y, value, side_x, side_y, dimensions):
        self.x = x
        self.y = y
        self.value = [None if np.isnan(x) else float(x) for x in value]
        self.side_x = side_x
        self.side_y = side_y
        self.dimensions = dimensions

    @property
    def __geo_interface__(self):
        """Define polygon based on centroid (x, y) and side

         ATTENTION: When referring to MongoDB user reference,
         GeoJSON standard 'geometry' should be used instead of 'loc',
         for geoindexing.

        :return: GeoJSON object representing data point
        :rtype: dict
        """

        document = {
            'location': [self.x, self.y],
            'values': self.value,
            'dimensions': self.dimensions,
        }

        return document

    @property
    def as_dict(self):
        return self.__geo_interface__


if __name__ == '__main__':
    from constants import NC_FILE
    try:
        mi = NetCDFToMongo(NC_FILE)
        mi.parallel_ingest()
    except:
        raise
