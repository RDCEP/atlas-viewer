import netCDF4
import os
import json
import numpy as np
import pandas as pd
import pycountry
from atlas.constants import MODELS, DATASETS, SCENARIOS, IRRIGATION, \
        CROPS, VARIABLES


class DataMunger():
    def __init__(self, model=0, dataset=0, scenario=0, irr=0, crop=5,
                 var=0, adm=0):
        self.time = 0
        self._adm = adm
        self._crop= CROPS[crop]
        self._model = MODELS[model]
        self._dataset= DATASETS[dataset]
        self._scenario = SCENARIOS[scenario]
        self._irrigation = IRRIGATION[irr]
        self._var = VARIABLES[self._model[1]][var]

    @property
    def gadm0_meta(self):
        """
        Return gadm0 codes as DataFrame
        """
        d = pd.DataFrame.from_csv(os.path.join('gadm0.meta.csv'), index_col=3)
        d.index = np.arange(len(d))
        return d

    @property
    def gadm1_meta(self):
        """
        Return gadm1 codes as DataFrame
        """
        d = pd.DataFrame.from_csv(os.path.join('gadm1.meta.csv'), index_col=4)
        return d

    @property
    def gadm0_codes(self):
        """
        Return gadm0 codes as list of iso_a3
        """
        return self.gadm0_meta.drop_duplicates(cols='ISO')['ISO']

    @property
    def gadm1_codes(self):
        """
        Return gadm1 codes as list of 2 < n < 6 length strings
        (gadm0 id + zero-padded gadm1 id)
        """
        df = self.gadm1_meta
        return ['{}{}'.format(df['ID_0'].values[i], str(df['ID_1'].values[i]).zfill(2))
                for i in range(len(df))]

    def add_gadm1_codes_to_ne1_json(self):
        """
        Add GADM level 1 information to level 1 map outlines from Natural Earth.
        """
        gadm = pd.DataFrame.from_csv('./gadm1.meta.csv', index_col=4)
        gadm.index = np.arange(len(gadm))
        with open('../static/topojson/ne1_s0001.json') as f:
            ne = json.loads(f.read())
        for region in ne['objects']['regions']['geometries']:
            props = region['properties']
            try:
                country = pycountry.countries.get(alpha2=props['iso_a2'])
                region['properties']['iso'] = country.alpha3
                id0 = gadm.ix[gadm['ISO'] == country.alpha3].\
                    ix[gadm['NAME'] == props['name'].encode('latin_1')].ID_0.values[0]
                id1 = gadm.ix[gadm['ISO'] == country.alpha3].\
                    ix[gadm['NAME'] == props['name'].encode('latin_1')].ID_1.values[0]
                region['properties']['adm1'] = '{0:02d}'.format(id1)
                region['properties']['adm0'] = '{0}'.format(id0)
                region['properties']['adm'] = '{0}{1:02d}'.format(id0, id1)
            except:
                pass
        with open('../static/topojson/atlas_gadm1.json', 'w') as f:
            f.write(json.dumps(ne))
        return ne

    def add_gadm0_codes_to_ne0_json(self):
        """
        Add GADM level 0 information to level 0 map outlines from Natural Earth.
        """
        gadm = self.gadm0_meta
        with open('../static/topojson/ne0_s0001.json', 'r') as f:
            ne = json.loads(f.read())
        for region in ne['objects']['regions']['geometries']:
            props = region['properties']
            try:
                country = pycountry.countries.get(alpha2=props['iso_a2'])
                region['properties']['iso'] = country.alpha3
                id0 = gadm.ix[gadm['ISO'] == country.alpha3].ID_0.values[0]
                region['properties']['adm0'] = '{0}'.format(id0)
                region['properties']['adm'] = '{0}'.format(id0)
            except:
                pass
                # print(props)
        with open('../static/topojson/atlas_gadm0.json', 'w') as f:
            f.write(json.dumps(ne))
        return ne

    def trim_aggr_data(self, var):
        """
        Trim extra scenarios and irrigations from json file (for initial
        loading of page).
        """
        with open('../static/json/aggr/{}_gadm{}.json'.format(var, self._adm), 'r') as f:
            data = json.loads(f.read())
        data['data'] = {k: np.array(v)[:, 0, 0].tolist() for k, v in data['data'].iteritems()}
        with open('../static/json/aggr/{}_gadm{}_home.json'.format(var, self._adm), 'w') as f:
            f.write(json.dumps(data))

    def aggr_to_np(self, var):
        d = netCDF4.Dataset(os.path.join(
            '..', 'data', 'netcdf', 'gadm01_aggr',
            '{}_{}_hist_{}_annual_{}_{}.nc4'.format(
                self._model[1], self._dataset[1], self._crop, self._dataset[2],
                self._dataset[3]
            )
        ))
        _v = d.variables['{}_gadm{}'.format(var, self._adm)][:]
        _gi = d.variables['gadm{}_index'.format(self._adm)][:]
        return _v, _gi

    def aggr_to_json(self, var):
        _v, _gi = self.aggr_to_np(var)
        new_data = {}
        for i in range(len(_gi)):
            new_data[str(_gi[i])] = _v[i].data.tolist()
        with open('../static/json/aggr/{}_gadm{}.json'.format(
                var, self._adm), 'w') as f:
            f.write(
                json.dumps(
                    {
                        'data': new_data,
                        'min': round(np.min(_v[:]), 1),
                        'max': round(np.max(_v[:]), 1),
                    }
                )
            )
        self.trim_aggr_data(var)

    def grid_to_np(self, var, directory=None, prefix=''):
        filepath = os.path.join(
            '..', 'data', 'netcdf', directory,
            '{}{}_{}_hist_{}_{}_{}_{}_annual_{}_{}.nc4'.format(
                prefix,
                self._model[1], self._dataset[1], self._scenario[1],
                self._irrigation[1], var, self._crop[2],
                self._dataset[2], self._dataset[3]))
        d = netCDF4.Dataset(filepath)
        lat = d.variables['lat'][:]
        lon = d.variables['lon'][:]
        _v = d.variables['{}_{}'.format(var, self._crop[2])][:]
        _v = _v.transpose(2, 1, 0)
        return _v, lat, lon

    def grid_to_tile_json(self, var, var2=None, directory='full_global',
                          prefix='', op=np.divide):
        _v, lat, lon = self.grid_to_np(var, directory=directory, prefix=prefix)
        step = 40
        la0 = 0
        lo0 = 0
        while la0 < 360 and lo0 < 720:
            la1 = la0 + step
            lo1 = lo0 + step
            new_data = []
            min_lat = lat[la1 - 1] - .25
            min_lon = lon[lo0] - .25
            max_lat = lat[la0] + .25
            max_lon = lon[lo1 - 1] + .25
            min_var = np.min(_v)
            max_var = np.max(_v)
            for lo_ in range(len(_v[lo0:lo1])):
                for la_ in range(len(_v[lo_,la0:la1])):
                    if _v[lo_+lo0, la_+la0].any():
                        _lon = lon[lo_+lo0]
                        _lat = lat[la_+la0]
                        new_data.append({
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Polygon',
                                'coordinates': [[
                                    [_lon + .25, _lat - .25],
                                    [_lon - .25, _lat - .25],
                                    [_lon - .25, _lat],
                                    [_lon - .25, _lat + .25],
                                    [_lon + .25, _lat + .25],
                                    [_lon + .25, _lat],
                                    [_lon + .25, _lat - .25],
                                ]],
                            },
                            'properties': {
                                'lat': _lat,
                                'lon': _lon,
                                'crds': '{}-{}'.format(_lat, _lon).replace('.', '_'),
                                'var': _v[lo_+lo0, la_+la0].tolist(),
                            },
                        })
            var = '{}_{}'.format(var, var2) if var2 is not None else var
            with open('../static/json/grid/{}/{}{}.{}_{}_{}.json'.format(
                    # directory, prefix, lo0, la0, var, self._crop[2]), 'w') as f:
                    directory, prefix,
                    str(int(min_lon)).replace('-', 'w') if min_lon < 0 else 'e{}'.format(int(min_lon)),
                    str(int(min_lat)).replace('-', 's') if min_lat < 0 else 'n{}'.format(int(min_lat)),
                    var, self._crop[2]), 'w') as f:
                f.write(
                    json.dumps(
                        {
                            'data': new_data,
                            'min': float(min_var),
                            'max': float(max_var),
                            'min_lat': min_lat,
                            'min_lon': min_lon,
                            'max_lat': max_lat,
                            'max_lon': max_lon,
                        }
                    )
                )
            lo0 += step
            if lo0 == 720:
                lo0 = 0
                la0 += step

    def grid_to_json(self, var, var2=None, directory=None, prefix=None,
                     op=np.divide):
        _v, lat, lon = self.grid_to_np(var, directory=directory, prefix=prefix)
        if var2:
            _v2 = self.grid_to_np(var2, directory=directory, prefix=prefix)[0]
            _v /= _v2
        new_data = []
        min_lat = np.min(lat)
        min_lon = np.min(lon)
        max_lat = np.max(lat)
        max_lon = np.max(lon)
        min_var = np.min(_v)
        max_var = np.max(_v)
        for lo_ in range(len(_v[:])):
            for la_ in range(len(_v[:][lo_])):
                if _v[:][lo_][la_].any():
                    _lon = lon[lo_]
                    _lat = lat[la_]
                    new_data.append({
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [[
                                [_lon + .25, _lat - .25],
                                [_lon - .25, _lat - .25],
                                [_lon - .25, _lat],
                                [_lon - .25, _lat + .25],
                                [_lon + .25, _lat + .25],
                                [_lon + .25, _lat],
                                [_lon + .25, _lat - .25],
                            ]],
                        },
                        'properties': {
                            'lat': _lat,
                            'lon': _lon,
                            'crds': '{}-{}'.format(_lat, _lon).replace('.', '_'),
                            'var': _v[:][lo_][la_].tolist(),
                        },
                    })
        print(max_var, min_var)
        var = '{}_{}'.format(var, var2) if var2 is not None else var
        with open('../static/json/grid/{}{}_{}.json'.format(
                prefix, var, self._crop[2]), 'w') as f:
            f.write(
                json.dumps(
                    {
                        'data': new_data,
                        'min': float(min_var),
                        'max': float(max_var),
                        'min_lat': min_lat,
                        'min_lon': min_lon,
                        'max_lat': max_lat,
                        'max_lon': max_lon,
                    }
                )
            )


if __name__ == '__main__':
        damn = DataMunger(model=0, dataset=0, scenario=1, irr=0, crop=5, var=11)
        damn._adm = 1
        damn.grid_to_tile_json('yield', directory='full_global')
        # print(damn.__class__.__name__)
        # print(damn.add_gadm0_codes_to_ne0_json())