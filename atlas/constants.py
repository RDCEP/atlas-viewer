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
             
SCENARIOS = [
  (0, 'default', 'Default', ),
  (1, 'fullharm', 'Full harm', ),
]
IRRIGATION = [
  (0, 'firr', 'Full', ),
  (1, 'noirr', 'Rainfed', ),
  (1, 'sum', 'Sum', ),
]
MODELS = [
  (0, 'papsim', 'pAPSIM', ),
  (1, 'pdssat', 'pDSSAT', ),
]
DATASETS = [
  (0, 'wfdei.cru', 'WFDEI.CRU', 1979, 2012),
  (1, 'agmerra', 'AgMERRA', 1980, 2010),
  (2, 'hadgem', 'HADGEM', 1950, 2099),
]
CROPS = [
  (0, 'mai', 'Maize', ),
  (1, 'mil', 'Millet', ),
  (2, 'ric', 'Rice', ),
  (3, 'sor', 'Sorghum', ),
  (4, 'soy', 'Soybean', ),
  (5, 'whe', 'Wheat', ),
]
VARIABLES = [
    (0, 'aet', 'aet', ),
    (1, 'anth-day', 'anth-day', ),
    (2, 'gsprcp', 'gsprcp', ),
    (3, 'initr', 'initr', ),
    (4, 'leach', 'leach', ),
    (5, 'maty-day', 'maty-day', ),
    (6, 'pirrww', 'pirrww', ),
    (7, 'plant-day', 'plant-day', ),
    (8, 'sco2', 'sco2', ),
    (9, 'sn2o', 'sn2o', ),
    (10, 'sumt', 'sumt', ),
    (11, 'yield', 'yield', ),
]
MODEL_OPTS = {
    'papsim': {
        'variables': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        'crops': [0, 3, 4, 5],
    },
}