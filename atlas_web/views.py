# -*- coding: utf-8 -*-
try:
    import simplejson as json
except ImportError:
    import json
from flask import Blueprint, render_template, session, jsonify, Response
import numpy as np
from atlas.constants import MODELS, DATASETS, SCENARIOS, IRRIGATION, \
    CROPS, VARIABLES


mod = Blueprint('atlas', __name__,)


def initial_session(var=None):
    for k in ['scenario', 'irrigation', 'time']:
        try:
            session[k] = 0 if not session[k] else session[k]
        except KeyError:
            session[k] = 0


@mod.route('/api/<tlx>/<tly>/<brx>/<bry>/<collection>')
def mongo_test(tlx, tly, brx, bry, collection):
    from atlas.mongo_read import MongoRead
    initial_session()
    mr = MongoRead(float(tlx), float(tly), float(brx), float(tly),
                   float(brx), float(bry), float(tlx), float(bry),
                   4, str(collection))
    return Response(
        json.dumps(mr.quadrilateral),
        mimetype='application/json',
    )


@mod.route('/', defaults={'lon': 80, 'lat': 20, 'var': 'yield'})
@mod.route('/map/<lon>/<lat>/', defaults={'var': 'yield'})
@mod.route('/map/<lon>/<lat>/<var>')
def index(lon, lat, var):
    initial_session()
    session['lon'] = lon
    session['lat'] = lat
    session['var'] = var
    return render_template(
        'grid/grid.html',
        map_type='grid',
        lon=session['lon'],
        lat=session['lat'],
        var=session['var'],
        crop='whe',
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