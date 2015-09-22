from __future__ import division
import os
import sys
import datetime
import itertools
try:
    import simplejson as json
except ImportError:
    import json
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
        self.file = file
        self.nc_dataset = Dataset(self.file, 'r')
        # netCDF variables
        self._lon_var = None
        self._lat_var = None
        self._time_var = None
        self._sim_context = None
        # Using degree decimals - if zero, states a point
        self.pixel_side_length = 0.001

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
        return self.nc_dataset.variables[self.lat_var][:]

    @property
    def lons(self):
        return self.nc_dataset.variables[self.lon_var][:]

    @property
    def vals(self):
        return self.nc_dataset.variables[self.sim_context][:, :, :]

    @property
    def tims(self):
        return self.nc_dataset.variables[self.time_var][:]

    @property
    def count_lat(self):
        return [int(i) for i in self.lats]

    @property
    def count_lon(self):
        return [int(i) for i in self.lons]

    @property
    def count_time(self):
        return [int(i) for i in self.tims]

    def ingest(self):
        start_time = datetime.datetime.now()
        print('*** Start Run ***')
        print(str(start_time))

        try:
            for lat, lon in itertools.product(self.lats, self.lons):
                new_points = list()
                try:
                    for i, t in enumerate(self.tims):
                        xx = str(self.vals[i, lat, lon])
                        tile = geojson.dumps((
                            GenerateDocument(lon, lat, self.sim_context, i, xx,
                                             self.pixel_side_length)
                        ), sort_keys=True)
                        new_points.append(tile)
                        tile = {}
                except:
                    print('Unexpected error:', sys.exc_info()[0])
                    raise
                new_points = [json.loads(coords) for coords in new_points]
                result = points.insert_many(new_points)
                # print '*** Inserted Points ***'
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
        elapsed_time = end_time - start_time
        print('*** End Run ***')
        print('Elapsed time:', str(elapsed_time))


# Define GeoJSON standard for ATLAS
class GenerateDocument(object):
    def __init__(self, x, y, simulation_variable, time_calc, valor, side):
        self.x = x
        self.y = y
        self.sim = simulation_variable
        self.time = time_calc
        self.valor = valor
        self.side = side

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
                'simulation': self.sim,
                'timestamp': datetime.datetime.now().isoformat(),
                'time': self.time,
                'value': self.valor,
            }}

        return varOutput


if __name__ == '__main__':
    nc_file = os.path.join(
        BASE_DIR, 'data', 'netcdf', 'full_global',
        'papsim_wfdei.cru_hist_default_firr_aet_whe_annual_1979_2012.nc4')
    mi = NetCDFToMongo(nc_file)
    mi.ingest()
