__author__ = 'ricardo'
# 2015-08-19 - Initial commit

from netCDF4 import Dataset

try:
    import ogr
except ImportError:
    from osgeo import ogr

try:
    import osr
except ImportError:
    from osgeo import osr

# input location of the netCDF file
nc_file = "/home/ricardo/estagio/papsim_wfdei.cru_hist_default_firr_aet_whe_annual_1979_2012.nc4"

# open the netCDF file
nc_dataset = Dataset(nc_file, 'r')

# netCDF variables
latitude = 'lat'
longitude = 'lon'
time = 'time'
value = 'aet_whe'

# get number of time (time dimension)
num_time = len(nc_dataset.dimensions[time])

# get netCDF variable objects
latitudes = nc_dataset.variables[latitude]
longitudes = nc_dataset.variables[longitude]
values = nc_dataset.variables[value]

# get netCDF variable values
lats = latitudes[:]
lons = longitudes[:]
vals = values[:, :, :, :]

# make a list of latitudes and longitudes
latitudes = [int(i) for i in lats]
longitudes = [int(i) for i in lons]

# populating the database
try:
    for lat in range(len(latitudes)):
        try:
            for lon in range(len(longitudes)):
                try:
                    for time in range(num_time):
                # TODO: Needs to write commit on mongodb collection (still to define)
                except Exception:
                    print 'Error while reading time'
        except Exception:
            print 'Error while reading longitudes'

except Exception:
    print 'Error while reading latitudes'
