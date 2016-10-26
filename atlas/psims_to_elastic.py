#!/usr/bin/env python
# -*- coding: utf-8 -*-
from atlas.nc4_to_elastic import NetCDFToElastic


class pSIMSToElastic(NetCDFToElastic):
    def __init__(self, nc_file, sigfigs=3):
        super(pSIMSToElastic, self).__init__(nc_file, sigfigs)
        self.name = ''.join(self.nc_file.split('/')[-1].split('.')[:-1])
        params = ['agricultural_model', 'climate_model', None, 'harms',
                  'irrigation', 'variable', 'crop']
        self.parameters = {
            params[i]: v for i, v in enumerate(self.name.split('_'))
            if i in [0, 1, 2, 3, 4, 5, 6]}
        # self.name = '_'.join(self.name.split('_')[3:5])
        self.human_name = 'pSIMS: {0} {1} {2}'.format(
            self.parameters['agricultural_model'],
            self.parameters['climate_model'],
            self.parameters['irrigation'])


if __name__ == '__main__':
    from constants import NC_FILE

    try:
        mi = pSIMSToElastic(NC_FILE)
        mi.parallel_ingest()
    except:
        raise
