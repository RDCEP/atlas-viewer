from __future__ import division
import os
import sys
import datetime
import itertools
import ntpath
try:
    import simplejson as json
except ImportError:
    import json
from numpy import ma
from pymongo.errors import PyMongoError
from pymongo import MongoClient
from netCDF4 import Dataset
import geojson
from atlas.constants import BASE_DIR, MONGO


__author__ = "rblourenco@uchicago.edu"
# 2015-08-19 - Initial commit


uri = "mongodb://{}:{}@{}/{}?authMechanism=SCRAM-SHA-1".format(
    MONGO['user'], MONGO['password'], MONGO['domain'], MONGO['database']
)
client = MongoClient(uri) if not MONGO['local'] \
    else MongoClient('localhost', MONGO['port'])
db = client['atlas']
points = db.simulation


class NetCDFToMongo(object):
    def __init__(self, file):
        """Class for writing geospatial information to Mongo from netCDF files

        :param file: Path to netCDF input file
        :type file: str
        :return: None
        :rtype: None
        """
        self.file = file
        self.nc_dataset = Dataset(self.file, 'r')
        self._lon_var = None
        self._lat_var = None
        self._time_var = None
        self._sim_context = None
        self._vals = None
        self._lats = None
        self._lons = None
        self._tims = None

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
        if self._lats is None:
            self._lats = self.nc_dataset.variables[self.lat_var][:]
        return self._lats[:5]

    @property
    def lons(self):
        if self._lons is None:
            self._lons = self.nc_dataset.variables[self.lon_var][:]
        return self._lons[:5]

    @property
    def vals(self):
        if self._vals is None:
            self._vals = self.nc_dataset.variables[self.sim_context][:, :, :]
        return self._vals

    @property
    def tims(self):
        if self._tims is None:
            self._tims = self.nc_dataset.variables[self.time_var][:]
        return self._tims

    @property
    def pixel_side_length(self):
        """

        Using degree decimals - if zero, states a point

        :return:
        :rtype: float
        """
        return 0.

    def num_or_null(self, value):
        """Represent null values from netCDF as '--' and numeric values
        as floats.
        """
        if value is ma.masked:
            return None
        try:
            return float(value)
        except ValueError:
            print('*** Encountered uncoercible non-numeric ***\n{}'.format(
                value
            ))
            pass

    def ingest(self):
        start_time = datetime.datetime.now()
        print('*** Start Run ***\n{}'.format(start_time))

        try:
            for lat, lon in itertools.product(self.lats, self.lons):
                new_points = list()
                try:
                    for i, _ in enumerate(self.tims):
                        print('Time: {} Lon: {} Lat: {}').format(i, lon, lat)
                        xx = self.num_or_null(self.vals[i, lat, lon])
                        print('NetCDF: {}'.format(xx))
                        tile = geojson.dumps((
                            GenerateDocument(lon, lat, self.sim_context, i, xx,
                                             self.pixel_side_length, self.file)))
                        new_points.append(tile)
                        print('Tile: {}'.format(tile))
                        tile = {}
                except:
                    print('Unexpected error:', sys.exc_info()[0])
                    raise
                new_points = [json.loads(coords) for coords in new_points]
                result = points.insert_many(new_points)
                # print '*** Inserted {} Points ***'.format(len(new_points))
                # print result.inserted_ids
                # print '*** End Points ***'
                new_points = []
        except PyMongoError:
            print('Error while committing on MongoDB')
            raise
        except:
            print('Unexpected error:', sys.exc_info()[0])
            raise

        end_time = datetime.datetime.now()
        print('*** End Run ***\n{}'.format(end_time))
        elapsed_time = end_time - start_time
        print('*** Elapsed ***\n{}'.format(elapsed_time))


# Define GeoJSON standard for ATLAS
class GenerateDocument(object):
    def __init__(self, x, y, simulation_variable, time_calc, valor,
                 side, filename):
        self.x = x
        self.y = y
        self.sim = simulation_variable
        self.time = time_calc
        self.valor = valor
        self.side = side
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
        point_ax = self.x - (self.side / 2)
        point_ay = self.y + (self.side / 2)
        point_bx = self.x + (self.side / 2)
        point_by = self.y + (self.side / 2)
        point_cx = self.x + (self.side / 2)
        point_cy = self.y - (self.side / 2)
        point_dx = self.x - (self.side / 2)
        point_dy = self.y - (self.side / 2)

        varOutput = {
            'type': 'Feature', 'centroid_x': self.x, 'centroid_y': self.y,
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
    try:
        nc_file = os.path.join(
            BASE_DIR, 'data', 'netcdf', 'full_global',
            'papsim_wfdei.cru_hist_default_firr_aet_whe_annual_1979_2012.nc4')
        mi = NetCDFToMongo(nc_file)
        mi.ingest()
    except:
        raise
