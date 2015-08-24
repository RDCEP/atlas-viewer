__author__ = 'ricardo'
# 2015-08-19 - Initial commit
# coding: utf-8

from netCDF4 import Dataset

# Timestamp for testing
import datetime

try:
    import ogr
except ImportError:
    from osgeo import ogr

try:
    import osr
except ImportError:
    from osgeo import osr

try:
    import pymongo
except ImportError:
    print 'MongoDB API not available.'

# input location of the netCDF file
nc_file = "/home/ricardo/estagio/papsim_wfdei.cru_hist_default_firr_aet_whe_annual_1979_2012.nc4"

# open the netCDF file
nc_dataset = Dataset(nc_file, 'r')

# netCDF variables
longitude = 'lon'
latitude = 'lat'
time = 'time'
value = 'aet_whe'

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
                try:
                    for tyme in range(len(count_time)):
                        # TODO: Needs to write commit on mongodb collection (still to define database model)
                        print '*** Beginning ***'
                        print datetime.datetime.now().isoformat()
                        print 'Lat: ', lats[lat], ', Long: ', lons[lon], ', Time: ', tims[tyme]
                        print str(vals[tyme, lats[lat], lons[lon]])
                        print '*** End ***'
                except Exception:
                    print 'Error while reading time'
                    print Exception
        except Exception:
            print 'Error while reading longitudes'
            print Exception
except Exception:
    print 'Error while reading latitudes'
    print Exception
