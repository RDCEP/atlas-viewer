# -*- coding: utf-8 -*-
try:
    import simplejson as json
except ImportError:
    import json
from flask import Blueprint, render_template, session, jsonify, Response
from atlas.constants import MODELS, DATASETS, SCENARIOS, IRRIGATION, \
    CROPS, VARIABLES
from atlas.mongo_read import MongoRead


mod = Blueprint('atlas', __name__,)


def initial_session(var=None):
    for k in ['scenario', 'irrigation', 'time']:
        try:
            session[k] = 0 if not session[k] else session[k]
        except KeyError:
            session[k] = 0


@mod.route('/api/<tlx>/<tly>/<brx>/<bry>/<collection>')
def mongo_test(tlx, tly, brx, bry, collection):
    initial_session()
    mr = MongoRead(4, str(collection))
    return Response(
        json.dumps(mr.quadrilateral(float(tlx), float(tly), float(brx),
                                    float(tly), float(brx), float(bry),
                                    float(tlx), float(bry),)),
        mimetype='application/json',
    )


@mod.route('/', defaults={'lon': 80, 'lat': 20, 'var': 'biom'})
@mod.route('/map/<lon>/<lat>/', defaults={'var': 'biom'})
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
        gridded='false',
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


@mod.route('/api/datasets')
def datasets():
    pass


@mod.route('/api/<tlx>/<tly>/<brx>/<bry>/<collection>/<regions>')
def ne_admin0(tlx, tly, brx, bry, collection, regions):
    initial_session()
    mr = MongoRead(4, str(collection))
    # r =
    return Response(
        json.dumps(mr.aggregate_grid_to_regions(
            float(tlx), float(tly), float(brx), float(tly),
            float(brx), float(bry), float(tlx), float(bry),
            collection, regions)),
        mimetype='application/json',
    )