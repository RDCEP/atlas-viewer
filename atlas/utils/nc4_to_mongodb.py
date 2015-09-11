__author__ = "rblourenco@uchicago.edu"
# 2015-08-19 - Initial commit
import os
import sys
import datetime
import json
from pymongo.errors import PyMongoError
from pymongo import MongoClient
from netCDF4 import Dataset
import geojson
from atlas.constants import BASE_DIR

# In case of being a local client
# client = MongoClient('localhost', 27017)

uri = "mongodb://user:password@example.com/the_database?authMechanism=SCRAM-SHA-1"
client = MongoClient(uri)

start_time = datetime.datetime.now()
print(' *** Start ***')
print(str(start_time))

# input location of the netCDF file
nc_file = os.path.join(
    BASE_DIR, 'data', 'netcdf', 'full_global',
    'papsim_wfdei.cru_hist_default_firr_aet_whe_annual_1979_2012.nc4')

# open the netCDF file
nc_dataset = Dataset(nc_file, 'r')

# netCDF variables
longitude = 'lon'
latitude = 'lat'
time = 'time'
sim_context = 'aet_whe'
pixel_side_length = 0.001  # Using degree decimals - if zero, states a point

# Defining MongoDB instance
db = client['atlas']
points = db.simulation


# Define GeoJSON standard for ATLAS
class GenerateDocument(object):
    def __init__(self, x, y, simulation_variable, time_calc, valor, side):
        self.x = x
        self.y = y
        self.sim = simulation_variable
        self.time = time_calc
        self.valor = valor
        self.side = side

    @property  # Attention: When referring to MongoDB User Reference, GeoJSON Standard 'geometry' should be used instead
    # of 'loc', for geoindexing
    def __geo_interface__(self):
        # Define polygon based on centroid x,y and side
        point_ax = self.x - (self.side / 2)
        point_ay = self.y + (self.side / 2)
        point_bx = self.x + (self.side / 2)
        point_by = self.y + (self.side / 2)
        point_cx = self.x + (self.side / 2)
        point_cy = self.y - (self.side / 2)
        point_dx = self.x - (self.side / 2)
        point_dy = self.y - (self.side / 2)

        varOutput = {'type': 'Feature', 'centroid_x': self.x, 'centroid_y': self.y, 'geometry': {
            'type': 'Polygon',
            'coordinates': [
                [[point_ax, point_ay], [point_bx, point_by], [point_cx, point_cy], [point_dx, point_dy],
                 [point_ax, point_ay]]
            ]
        }, 'properties': {
            'simulation': self.sim,
            'timestamp': datetime.datetime.now().isoformat(),
            'time': self.time,
            'value': self.valor
        }}
        return varOutput


# get netCDF variable objects
latitudes = nc_dataset.variables[latitude]
longitudes = nc_dataset.variables[longitude]
values = nc_dataset.variables[sim_context]
times = nc_dataset.variables[time]

# get netCDF variable values
lats = latitudes[:]
lons = longitudes[:]
vals = values[:, :, :]  # Sequence: Time, Latitude, Long
tims = times[:]

# make a list of latitudes and longitudes
count_lat = [int(i) for i in lats]
count_long = [int(i) for i in lons]
count_time = [int(i) for i in tims]


# populating the database
try:
    for lat in xrange(len(count_lat)):
        try:
            for lon in xrange(len(count_long)):
                new_points = []
                try:
                    for tyme in xrange(len(count_time)):  # Loop in time: Fills time values on the GeoJSON
                        xx = str(vals[tyme, lats[lat], lons[lon]])
                        tile = geojson.dumps(
                            (GenerateDocument(lons[lon], lats[lat], sim_context, tyme, xx, pixel_side_length)),
                            sort_keys=True)
                        new_points.append(tile)
                        tile = {}  # Clear buffer                        
                except:
                    print('Unexpected error:', sys.exc_info()[0])
                    raise
                # commit new_points
                new_points = [json.loads(coords) for coords in new_points]
                result = points.insert_many(new_points)
                # print '*** Inserted Points ***'
                #print result.inserted_ids  # Give output of inserted values for a point on all times
                # print '*** End ***'
                new_points = []  # Clear Buffer
        except PyMongoError:
            print('Error while commiting on MongoDB')
        except:
            print('Unexpected error:', sys.exc_info()[0])
            raise
except:
    print('Unexpected error:', sys.exc_info()[0])
    raise
end_time = datetime.datetime.now()
elapsed_time = end_time - start_time
print('**** End Run ********')
print('Elapsed time')
print(str(elapsed_time))
