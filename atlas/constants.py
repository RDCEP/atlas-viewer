SCENARIOS = [
  (0, 'default', ),
  (1, 'fullharm', ),
]
IRRIGATION = [
  (0, 'firr', ),
  (1, 'noirr', ),
]
MODELS = [
  (0, 'papsim', ),
]
DATASETS = [
  (0, 'wfdei.cru', 1979, 2012),
  (1, 'agmerra', 1980, 2010),
]
CROPS = [
  (0, 'Maize', 'mai', ),
  (1, 'Millet', 'mil', ),
  (2, 'Rice', 'ric', ),
  (3, 'Sorghum', 'sor', ),
  (4, 'Soybean', 'soy', ),
  (5, 'Wheat', 'whe', ),
]
VARIABLES = {
  'papsim': ['aet', 'anth-day', 'gsprcp', 'initr', 'leach', 'maty-day',
    'pirrww', 'plant-day', 'sco2', 'sn2o', 'sumt', 'yield'],
}