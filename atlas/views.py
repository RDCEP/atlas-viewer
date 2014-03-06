from flask import request, redirect, url_for, Blueprint, render_template, \
    session, jsonify
import netCDF4
import pandas as pd
import numpy as np
import json
from atlas.utils.data_munger import DataMunger
from atlas.constants import MODELS, DATASETS, SCENARIOS, IRRIGATION, \
    CROPS, VARIABLES

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


@mod.route('/',
           defaults={'model': 'papsim', 'dataset': 'wfdei.cru',
                     'scenario': 'fullharm', 'irrigation': 'firr',
                     'crop': 'whe', 'var': 'yield', 'compare': None})
def index(model, dataset, scenario, irrigation, crop, var, compare):
    initial_session()
    session['var'] = var
    session['model'] = model
    session['dataset'] = dataset
    session['irrigation'] = irrigation
    session['scenario'] = scenario
    session['crop'] = crop
    session['compare'] = compare
    return render_template(
        'index.html',
        map_type = 'grid',
        var=session['var'],
        model=session['model'],
        dataset=session['dataset'],
        irrigation=session['irrigation'],
        scenario=session['scenario'],
        compare=session['compare'],
        crop=session['crop'],
    )


@mod.route('/aggr/<lon>/<lat>/<model>/<dataset>/<scenario>/<irrigation>' +
           '/<crop>/<var>/<compare>')
@mod.route('/aggr/<lon>/<lat>/<model>/<dataset>/<scenario>/<irrigation>' +
           '/<crop>/<var>', defaults={'compare': None, })
@mod.route('/aggr/<lon>/<lat>',
           defaults={'model': 'papsim', 'dataset': 'wfdei.cru',
                     'scenario': 'fullharm', 'irrigation': 'firr',
                     'crop': 'whe', 'var': 'yield', 'compare': None})
def aggr_view(lon, lat, model, dataset, scenario, irrigation, crop, var, compare):
    initial_session()
    session['var'] = var
    session['lon'] = lon
    session['lat'] = lat
    session['model'] = model
    session['dataset'] = dataset
    session['irrigation'] = irrigation
    session['scenario'] = scenario
    session['crop'] = crop
    session['compare'] = compare
    return render_template(
        'aggr/aggr.html',
        map_type = 'grid',
        var=session['var'],
        lon=session['lon'],
        lat=session['lat'],
        model=session['model'],
        dataset=session['dataset'],
        irrigation=session['irrigation'],
        scenario=session['scenario'],
        compare=session['compare'],
        crop=session['crop'],
    )


@mod.route('/grid/<lon>/<lat>/<model>/<dataset>/<scenario>/<irrigation>' +
           '/<crop>/<var>/<compare>')
@mod.route('/grid/<lon>/<lat>/<model>/<dataset>/<scenario>/<irrigation>' +
           '/<crop>/<var>',
           defaults={'compare': None, })
@mod.route('/grid/<lon>/<lat>',
           defaults={'model': 'papsim', 'dataset': 'wfdei.cru',
                     'scenario': 'fullharm', 'irrigation': 'firr',
                     'crop': 'whe', 'var': 'yield', 'compare': None})
def grid_view(lon, lat, model, dataset, scenario, irrigation, crop, var, compare):
    initial_session()
    session['var'] = var
    session['lon'] = lon
    session['lat'] = lat
    session['model'] = model
    session['dataset'] = dataset
    session['irrigation'] = irrigation
    session['scenario'] = scenario
    session['crop'] = crop
    session['compare'] = compare
    damn = DataMunger(
        model=[a for a, b, c in MODELS if b == model][0],
        dataset=[a for a, b, c, d, e in DATASETS if b == dataset][0],
        scenario=[a for a, b, c in SCENARIOS if b == scenario][0],
        irr=[a for a, b, c in IRRIGATION if b == irrigation][0],
        crop=[a for a, b, c in CROPS if b == crop][0],
        var=[a for a, b, c in VARIABLES if b == var][0],
        adm=1,
    )
    return render_template(
        'grid/grid.html',
        map_type = 'grid',
        var=session['var'],
        lon=session['lon'],
        lat=session['lat'],
        model=session['model'],
        dataset=session['dataset'],
        irrigation=session['irrigation'],
        scenario=session['scenario'],
        compare=session['compare'],
        crop=session['crop'],
        json=damn.grid_to_json(lon, lat),
    )


@mod.context_processor
def menu_options():
    return dict(
        models=MODELS,
        datasets=DATASETS,
        scenarios=SCENARIOS,
        irrigations=IRRIGATION,
        crops=CROPS,
        vars=VARIABLES,
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


