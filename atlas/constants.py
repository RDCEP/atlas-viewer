import os
import urllib
from ConfigParser import ConfigParser


BASE_DIR = os.path.abspath(os.path.dirname(__file__))

cf = ConfigParser()
cf.read(os.path.join(
    BASE_DIR, 'static', 'config.ini'
))

_filename = 'papsim_wfdei.cru_hist_{}_{}_{}_{}_annual_1979_2012.nc4'.format(
    cf.get('nc4', 'harms'), cf.get('nc4', 'irrigation'),
    cf.get('nc4', 'variable'), cf.get('nc4', 'crop'), )

NC_FILE = os.path.join(BASE_DIR, 'data', 'netcdf', 'full_global', _filename)

MONGO = dict(
    local=True,
    user=cf.get('user', 'username'),
    password=cf.get('user', 'password'),
    domain=cf.get('server', 'domain'),
    database=cf.get('server', 'database'),
    collection='{}_{}_{}_{}'.format(
        cf.get('nc4', 'harms'), cf.get('nc4', 'irrigation'),
        cf.get('nc4', 'variable'), cf.get('nc4', 'crop'), ),
    port=int(cf.get('server', 'port')),
    variable_name='{}_{}'.format(cf.get('nc4', 'variable'), cf.get('nc4', 'crop')))

ELASTICSEARCH = dict(
    meta_index='atlas_meta',
    meta_type='gridmeta',
    grid_index='atlas_grid',
    grid_type='griddata',
)