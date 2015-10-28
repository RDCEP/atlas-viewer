from __future__ import division
import sys
import datetime
import itertools
import ntpath
import multiprocessing as mp
try:
    import simplejson as json
except ImportError:
    import json
import numpy as np
from pymongo.errors import PyMongoError
from pymongo import MongoClient, GEOSPHERE
from netCDF4 import Dataset
import geojson
from atlas.constants import MONGO


__author__ = "rblourenco@uchicago.edu"
# 2015-08-19 - Initial commit


uri = "mongodb://{}:{}@{}/{}?authMechanism=SCRAM-SHA-1".format(
    MONGO['user'], MONGO['password'], MONGO['domain'], MONGO['database']
)


class NetCDFToMongo(object):
    def __init__(self, nc_file):
        """Class for writing geospatial information to Mongo from netCDF files

        :param nc_file: Path to netCDF input file
        :type nc_file: str
        :return: None
        :rtype: None
        """
        self.nc_file = nc_file
        self.nc_dataset = Dataset(self.nc_file, 'r')
        self._lon_var = None
        self._lat_var = None
        self._time_var = None
        self._sim_context = None
        self._vals = self.nc_dataset.variables[self.sim_context][:, :, :]
        self._lats = self.nc_dataset.variables[self.lat_var][:]
        self._lons = self.nc_dataset.variables[self.lon_var][:]
        self._tims = self.nc_dataset.variables[self.time_var][:]

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
    def time_var(self):
        if self._time_var is None:
            self._time_var = 'time'
        return self._time_var

    @property
    def sim_context(self):
        if self._sim_context is None:
            self._sim_context = 'aet_whe'
        return self._sim_context

    @property
    def lats(self):
        return self._lats

    @property
    def lons(self):
        return self._lons

    @property
    def vals(self):
        return self._vals

    @property
    def tims(self):
        return self._tims

    @property
    def pixel_side_length(self):
        """

        Using degree decimals - if zero, states a point

        :return:
        :rtype: tuple
        """
        return abs(np.diff(self.lons[:2])[0]), abs(np.diff(self.lats[:2])[0])

    def num_or_null(self, value):
        """Represent null values from netCDF as '--' and numeric values
        as floats.
        """
        if value is np.ma.masked:
            return None
        try:
            return float(value)
        except ValueError:
            print('\n*** Encountered uncoercible non-numeric ***\n{}\n\n'.format(
                value
            ))
            pass

    def parallel_ingest(self):
        jobs = []
        n = mp.cpu_count()
        for i in range(n):
            p = mp.Process(target=self.ingest, args=(n, i))
            jobs.append(p)
            p.start()

    def ingest(self, sectors=1, sector=0):

        client = MongoClient(uri) if not MONGO['local'] \
            else MongoClient('localhost', MONGO['port'])
        db = client['atlas']
        points = db.simulation

        start_time = datetime.datetime.now()
        print('*** Start Run ***\n{}\n\n'.format(start_time))

        _tims = np.array_split(np.arange(len(self.tims)), sectors)[sector]

        try:
            for (lat_idx, lat), (lon_idx, lon) in itertools.product(
                    enumerate(self.lats), enumerate(self.lons)):
                new_points = list()
                try:
                    for i in _tims:
                        xx = self.num_or_null(self.vals[i, lat_idx, lon_idx])
                        tile = geojson.dumps((
                            GenerateDocument(lon, lat, self.sim_context, i,
                                             xx, self.pixel_side_length[0],
                                             self.pixel_side_length[1],
                                             self.nc_file)))
                        new_points.append(tile)
                        tile = {}
                except:
                    print('Unexpected error:', sys.exc_info()[0])
                    raise
                new_points = [json.loads(coords) for coords in new_points]
                result = points.insert_many(new_points)
                # print '*** Inserted {} Points ***'.format(len(new_points))
                # print result.inserted_ids
                # print '*** End Points ***'
                new_points[:] = []

        except PyMongoError:
            print('Error while committing on MongoDB')
            raise
        except:
            print('Unexpected error:', sys.exc_info()[0])
            raise

        end_time = datetime.datetime.now()
        print('\n*** End Run ***\n{}\n'.format(end_time))
        elapsed_time = end_time - start_time
        print('\n*** Elapsed ***\n{}\n'.format(elapsed_time))


# Define GeoJSON standard for ATLAS
class GenerateDocument(object):
    def __init__(self, x, y, simulation_variable, time_calc, valor,
                 side_x, side_y, filename):
        self.x = x
        self.y = y
        self.sim = simulation_variable
        self.time = time_calc
        self.valor = valor
        self.side_x = side_x
        self.side_y = side_y
        self.filename = filename

    @property
    def __geo_interface__(self):
        """Define polygon based on centroid (x, y) and side

         ATTENTION: When referring to MongoDB user reference,
         GeoJSON standard 'geometry' should be used instead of 'loc',
         for geoindexing.

        :return: GeoJSON object representing data point
        :rtype: dict
        """
        point_ax = self.x - (self.side_x / 2)
        point_ay = self.y + (self.side_y / 2)
        point_bx = self.x + (self.side_x / 2)
        point_by = self.y + (self.side_y / 2)
        point_cx = self.x + (self.side_x / 2)
        point_cy = self.y - (self.side_y / 2)
        point_dx = self.x - (self.side_x / 2)
        point_dy = self.y - (self.side_y / 2)

        varOutput = {
            'type': 'Feature', 'centroid': [self.x, self.y],
            'geometry': {'type': 'Polygon', 'coordinates': [
                [[point_ax, point_ay], [point_bx, point_by],
                 [point_cx, point_cy], [point_dx, point_dy],
                 [point_ax, point_ay]]]},
            'properties': {
                'nc4filename': ntpath.basename(self.filename),
                'simulation': self.sim,
                'timestamp': datetime.datetime.now().isoformat(),
                'time': self.time,
                'value': self.valor,
            }}

        return varOutput


if __name__ == '__main__':
    from atlas.constants import NC_FILE
    try:
        mi = NetCDFToMongo(NC_FILE)
        mi.parallel_ingest()
    except:
        raise
