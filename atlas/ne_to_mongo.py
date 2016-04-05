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
points = db['ne_110m_admin_0_countries']

FILE = os.path.join(BASE_DIR, '..', 'atlas_web', 'static', 'json', 'ne_110m_admin_0_countries.geojson')
with open(FILE) as f:

    data = json.loads(f.read())
    points.insert_many(data['features'])