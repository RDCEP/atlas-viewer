#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import json
from pymongo import MongoClient
from atlas.constants import BASE_DIR, MONGO


uri = "mongodb://{}:{}@{}/{}?authMechanism=SCRAM-SHA-1".format(
    MONGO['user'], MONGO['password'], MONGO['domain'], MONGO['database']
)
client = MongoClient(uri) if not MONGO['local'] \
    else MongoClient('localhost', MONGO['port'])
db = client['atlas']
points = db['grid_meta']

points.insert({
    'dataset': 'default_firr_aet_whe',
    'crop': 'whe',
    'var': 'aet',
    'irrigation': 'firr',
    'harms': 'default',
    'ag_model': 'papsim',
    'climate_model': 'wfdei.cru',
})
points.insert({
    'dataset': 'default_firr_biom_whe',
    'crop': 'whe',
    'var': 'biom',
    'irrigation': 'firr',
    'harms': 'default',
    'ag_model': 'papsim',
    'climate_model': 'wfdei.cru',
})
points.insert({
    'dataset': 'default_firr_yield_whe',
    'crop': 'whe',
    'var': 'yield',
    'irrigation': 'firr',
    'harms': 'default',
    'ag_model': 'papsim',
    'climate_model': 'wfdei.cru',
})