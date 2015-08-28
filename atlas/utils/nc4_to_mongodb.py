__author__ = "rblourenco@uchicago.edu"
# 2015-08-19 - Initial commit

# Timestamp for testing
# import datetime

from pymongo.errors import PyMongoError
import sys
from netCDF4 import Dataset
from pymongo import MongoClient

client = MongoClient('localhost', 27017)
import geojson
import json

# input location of the netCDF file
nc_file = "/home/ricardo/estagio/papsim_wfdei.cru_hist_default_firr_aet_whe_annual_1979_2012.nc4"

# open the netCDF file
nc_dataset = Dataset(nc_file, 'r')

# netCDF variables
longitude = 'lon'
latitude = 'lat'
time = 'time'
value = 'aet_whe'

# Defining MongoDB instance
db = client['atlas']
points = db.simulation


# Define GeoJSON standard for ATLAS
class GenerateDocument:
    def __init__(self, x, y, simulation_variable):
        self.x = x
        self.y = y
        self.sim = simulation_variable

    @property
    def __geo_interface__(self):
        return {'type': 'Point', 'coordinates': (self.x, self.y), 'simulation': self.sim}


# get netCDF variable objects
latitudes = nc_dataset.variables[latitude]
longitudes = nc_dataset.variables[longitude]
values = nc_dataset.variables[value]
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
    for lat in range(len(count_lat)):
        try:
            for lon in range(len(count_long)):
                # TODO: Needs to write commit on mongodb collection (still to define database model)
                # Loop in time: Fills time values on the GeoJSON
                new_points = []
                try:
                    for tyme in range(len(count_time)):
                        # TODO: Write loop that constantly fills values of a JSON year - look into geojson notation
                        # print '*** Beginning ***'
                        # print datetime.datetime.now().isoformat()
                        # print 'Lat: ', lats[lat], ', Long: ', lons[lon], ', Time: ', tims[tyme]
                        # print str(vals[tyme, lats[lat], lons[lon]])
                        tile = geojson.dumps((GenerateDocument(lons[lon], lats[lat], value)), sort_keys=True)
                        new_points.append(tile)
                        tile = {}  # Clear buffer
                        # print '*** End ***'
                except:
                    print "Unexpected error:", sys.exc_info()[0]
                    raise
                print '*** Start ***'
                print new_points
                new_points = [json.loads(coords) for coords in new_points]
                result = points.insert_many(new_points)
                print '*** Inserted Points ***'
                print result.inserted_ids  # Give output of inserted values for a point on all times
                print '*** End ***'
                new_points = []  # Clear Buffer
        except PyMongoError:
            print 'Error while commiting on MongoDB'
        except:
            print "Unexpected error:", sys.exc_info()[0]
            raise
except:
    print "Unexpected error:", sys.exc_info()[0]
    raise
