# -*- coding: utf-8 -*-
try:
    import simplejson as json
except ImportError:
    import json
from flask import Blueprint, render_template, session, jsonify, Response, \
    request
from atlas.mongo_read import MongoRead


# FIXME: Don't raturn array of data, return dict with status, request, data, etc.


mod = Blueprint('atlas', __name__,)


def initial_session(var=None):
    for k in ['scenario', 'irrigation', 'time']:
        try:
            session[k] = 0 if not session[k] else session[k]
        except KeyError:
            session[k] = 0


@mod.route('/', defaults={'lon': 80, 'lat': 20, 'var': 'biom'})
def index(lon, lat, var):
    initial_session()
    session['lon'] = lon
    session['lat'] = lat
    session['var'] = var
    mr = MongoRead(4, str('grid_meta'))
    metadata = mr.all_metadata()
    return render_template(
        'index.html',
        map_type='grid',
        lon=session['lon'],
        lat=session['lat'],
        var=session['var'],
        crop='whe',
        datatype='null',
        metadata=metadata,
    )


@mod.route('/map/<dataset>/', defaults={'lon': 80, 'lat': 20})
@mod.route('/map/<dataset>/<lon>/<lat>/')
def gridmap(dataset, lon, lat):
    initial_session()
    session['lon'] = lon
    session['lat'] = lat
    session['dataset'] = dataset
    return render_template(
        'index.html',
        map_type='grid',
        lon=session['lon'],
        lat=session['lat'],
        var=session['var'],
        crop='whe',
        datatype='raster',
        dataset=dataset,
        regions='ne_110m_admin_0_countries',
    )


@mod.route('/agg/<dataset>/<regions>', defaults={'lon': 80, 'lat': 20})
@mod.route('/agg/<dataset>/<regions>/<lon>/<lat>/')
def aggmap(dataset, regions, lon, lat):
    initial_session()
    session['lon'] = lon
    session['lat'] = lat
    session['dataset'] = dataset
    return render_template(
        'index.html',
        map_type='agg',
        lon=session['lon'],
        lat=session['lat'],
        var=session['var'],
        crop='whe',
        datatype='polygon',
        regions=regions,
        dataset=dataset,
    )


# @mod.route('/api/<tlx>/<tly>/<brx>/<bry>/<collection>')
@mod.route('/api/griddata', methods=['POST'])
def mongo_test():
    initial_session()
    data = json.loads(request.data)
    collection = data['dataset']
    if 'bbox' not in data.keys():
        tlx = -180
        tly = 90
        brx = 180
        bry = -90
    else:
        tlx, tly, brx, bry = data['bbox']
    mr = MongoRead(4, str(collection))
    data = mr.quadrilateral(float(tlx), float(tly), float(brx),
                                       float(tly), float(brx), float(bry),
                                       float(tlx), float(bry),)
    data[0]['properties']['data_type'] = 'grid'
    return Response(
        json.dumps(data),
        mimetype='application/json',
    )


@mod.route('/api/aggregate', methods=['POST',])
def get_dataset():
    initial_session()
    data = json.loads(request.data)
    collection = data['dataset']
    regions = data['regions']
    if not 'bbox' in data.keys():
        tlx = -180
        tly = 90
        brx = 180
        bry = -90
    else:
        tlx, tly, brx, bry = data['bbox']
    mr = MongoRead(4, str(collection))
    data = mr.aggregate_grid_to_regions(
        float(tlx), float(tly), float(brx), float(tly), float(brx),
        float(bry), float(tlx), float(bry), collection, regions)
    return Response(
        json.dumps(data),
        mimetype='application/json',
    )


@mod.route('/api/map', methods=['POST',])
def get_map():
    initial_session()
    data = json.loads(request.data)
    collection = data['regions']
    if not 'bbox' in data.keys():
        tlx = -180
        tly = 90
        brx = 180
        bry = -90
    else:
        tlx, tly, brx, bry = data['bbox']
    mr = MongoRead(4, str(collection))
    data = mr.regions(
        float(tlx), float(tly), float(brx), float(tly), float(brx),
        float(bry), float(tlx), float(bry))
    return Response(
        json.dumps(data),
        mimetype='application/json',
    )


@mod.route('/api/metadata/map', methods=['POST', ])
def metadata_map():
    initial_session()
    data = json.loads(request.data)
    collection = 'grid_meta'
    dataset = data['dataset']
    mr = MongoRead(4, str(collection))
    data = mr.metadata(dataset)
    return Response(
        json.dumps(data),
        mimetype='application/json',
    )


@mod.route('/api/datasets')
def datasets():
    pass


@mod.route('/api/op/<op>')
def ace_operate(op):
    op = op.replace(' ', '')
