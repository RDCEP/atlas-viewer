import netCDF4
import os
import math
import yajl as json
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
        self._var = VARIABLES[var]

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
                self._model[1], self._dataset[1], self._crop[1], self._dataset[3],
                self._dataset[4]
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

    def grid_to_np(self, lon, lat, var2=False, op=np.divide):

        def lonlat_index(l, axis='lon'):
            l = math.floor(float(l * 2)) / 2 + .25
            larr = d.variables[axis][:]
            lix = np.where(larr == l)[0][0]
            lix = int(math.floor(lix - tile_size / 2))
            # if tile_size / 2 < lix < len(larr)- tile_size / 2:
            #     return lix
            # else:
            #     return -lix
            return lix

        tile_size = 80
        file_path = os.path.join(
            # '..', 'data', 'netcdf', 'full_global',
            'atlas', 'data', 'netcdf', 'full_global',
            '{}_{}_hist_{}_{}_{}_{}_annual_{}_{}.nc4'.format(
                self._model[1], self._dataset[1], self._scenario[1],
                self._irrigation[1], self._var[1], self._crop[1],
                self._dataset[3], self._dataset[4]))
        d = netCDF4.Dataset(file_path)
        lonix = lonlat_index(lon)
        latix = lonlat_index(lat, axis='lat')
        print(lonix, latix)
        _v = d.variables['{}_{}'.format(self._var[1], self._crop[1])][:].filled(np.nan)
        _v = _v.transpose(2, 1, 0)
        # _v = _v.take(xrange(lonix, lonix+tile_size), axis=0, mode='wrap').take(xrange(latix, latix+tile_size), axis=1, mode='wrap')
        _v = np.roll(np.roll(_v, -lonix, axis=0), -latix, axis=1)[:tile_size, :tile_size, :]
        if var2:
            _v2 = self.grid_to_np(lon, lat, var2=False, op=op)[0]
            _v = op(_v, _v2)
        return (
            _v,
            # np.roll(d.variables['lon'][:], -lonix)[:tile_size],
            # np.roll(d.variables['lat'][:], -latix)[:tile_size],
            d.variables['lon'][:].take(range(lonix, lonix+tile_size), axis=0, mode='wrap'),
            d.variables['lat'][:].take(range(latix, latix+tile_size), axis=0, mode='wrap'),
        )

    def grid_to_json(self, lon, lat, var2=None, op=np.divide):
        _v, lon, lat = self.grid_to_np(float(lon), float(lat), var2=var2, op=op)
        new_data = []
        south = lat[-1]
        west = lon[0]
        north = lat[0]
        east = lon[-1]
        lon_offset = 360 if east < west else 180
        lat_offset = 180 if south > north else 90
        center = [
            (east + west + 360) / 2 - lon_offset,
            (north + south + 180) / 2 - lat_offset,
        ]
        min_var = np.nanmin(_v)
        max_var = np.nanmax(_v)
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
        return json.dumps({
            'data': new_data,
            'min': float(min_var),
            'max': float(max_var),
            'min_lat': south,
            'min_lon': west,
            'max_lat': north,
            'max_lon': east,
            'center': center,
        })


if __name__ == '__main__':
    import cProfile
    damn = DataMunger(model=0, dataset=0, scenario=0, irr=1, crop=5, var=11)
    damn._adm = 1
    os.chdir('../..')
    cProfile.run('damn.grid_to_json(80, 20)', 'profile_stats')