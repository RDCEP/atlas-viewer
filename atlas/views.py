from flask import request, redirect, url_for, Blueprint, render_template, \
    session, jsonify
import netCDF4
import pandas as pd
import numpy as np
import json

mod = Blueprint('atlas', __name__,)


def initial_session(var=None):
    try:
        session['scenario'] = 0 if not session['scenario'] else session['scenario']
        session['irrigation'] = 0 if not session['irrigation'] else session['irrigation']
        session['time'] = 0 if not session['time'] else session['time']
    except KeyError:
        session['scenario'] = 0
        session['irrigation'] = 0
        session['time'] = 0


@mod.route('/<var>')
@mod.route('/', defaults={'var': 'yield'})
def index(var):
    initial_session()
    session['var'] = var
    return render_template(
        'index.html',
        var=session['var'],
    )

@mod.route('/gadm1/globe')
def gadm1_globe():
    initial_session()
    return render_template(
        'gadm1_globe.html',
    )

@mod.route('/south_asia/aggr/<var>')
@mod.route('/south_asia/aggr/', defaults={'var': 'yield'})
@mod.route('/south_asia/aggr', defaults={'var': 'yield'})
def gadm1_south_asia(var):
    initial_session()
    session['var'] = var
    return render_template(
        'aggr/south_asia.html',
        var=session['var'],
    )

@mod.route('/south_asia/grid/<var>')
@mod.route('/south_asia/grid/', defaults={'var': 'yield'})
@mod.route('/south_asia/grid', defaults={'var': 'yield'})
def south_asia_grid(var):
    initial_session()
    session['var'] = var
    return render_template(
        'grid/south_asia.html',
        var=session['var'],
    )

@mod.route('/grid/<lon>/<lat>/<var>')
@mod.route('/grid/<lon>/<lat>/', defaults={'var': 'yield'})
@mod.route('/grid/<lon>/', defaults={'var': 'yield', 'lat': 0})
@mod.route('/grid/', defaults={'var': 'yield', 'lon': 0, 'lat':0, })
def grid_view(lon, lat, var):
    initial_session()
    session['var'] = var
    session['lon'] = lon
    session['lat'] = lat
    return render_template(
        'grid/grid.html',
            var=session['var'],
            lon=session['lon'],
            lat=session['lat'],
    )

@mod.route('/update/<_data_type>/adm/<_adm>/var/<_var>/type/<_type>/value/<_value>', methods=['POST',])
def update(_data_type, _adm, _var, _type, _value):
    with open('./atlas/static/json/{}/gadm{}/{}_gadm{}.json'.format(_data_type, _adm, _var, _adm), 'r') as f:
        data = json.loads(f.read())
    session[_type] = _value
    data['data'] = {
        k: np.array(v)[:, session['scenario'], session['irrigation']].tolist()
        for k, v in data['data'].iteritems()
    }
    return jsonify(data)


