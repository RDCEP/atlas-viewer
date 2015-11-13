# -*- coding: utf-8 -*-
import json

from flask import Blueprint, render_template, session, jsonify, Response
import numpy as np
from bson import json_util

from atlas.constants import MODELS, DATASETS, SCENARIOS, IRRIGATION, \
    CROPS, VARIABLES


mod = Blueprint('atlas', __name__,)


def initial_session(var=None):
    for k in ['scenario', 'irrigation', 'time']:
        try:
            session[k] = 0 if not session[k] else session[k]
        except KeyError:
            session[k] = 0


@mod.route('/api/<tlx>/<tly>/<brx>/<bry>')
def mongo_test(tlx, tly, brx, bry):
    from atlas.mongo_read import MongoRead
    initial_session()
    mr = MongoRead(float(tlx), float(tly),
                   float(brx), float(tly),
                   float(brx), float(bry),
                   float(tlx), float(bry), 4,
                   )
    return Response(
        json_util.dumps(mr.quadrilateral),
        mimetype='application/json',
    )



@mod.route('/',
           defaults={'lon': 80, 'lat': 20, 'model': 'papsim', 'dataset': 'wfdei.cru',
                     'scenario': 'fullharm', 'irrigation': 'firr',
                     'crop': 'whe', 'var': 'yield', 'compare': None})
def index(lon, lat, model, dataset, scenario, irrigation, crop, var, compare):
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
        'grid/grid.html',
        map_type='grid',
        var=session['var'],
        model=session['model'],
        dataset=session['dataset'],
        irrigation=session['irrigation'],
        scenario=session['scenario'],
        compare=session['compare'],
        crop=session['crop'],
        lon=session['lon'],
        lat=session['lat'],
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
# This is used in atlas_001.js
def update(_data_type, _adm, _var, _type, _value):
    with open('./atlas/static/json/{}/gadm{}/{}_gadm{}.json'.format(_data_type, _adm, _var, _adm), 'r') as f:
        data = json.loads(f.read())
    session[_type] = _value
    data['data'] = {
        k: np.array(v)[:, session['scenario'], session['irrigation']].tolist()
        for k, v in data['data'].iteritems()
    }
    return jsonify(data)
