try:
    import simplejson as json
except ImportError:
    import json
import numpy as np
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from constants import MONGO


__author__ = 'rblourenco@uchicago.edu'
# 2015-09-04 - Initial commit


class MongoRead(object):
    def __init__(self, dpmm, collection=None):
        """Class for geospatial information retrieval on MongoDB

        :param a_x: Top left decimal longitude
        :type a_x: float
        :param a_y: Top left decimal latitude
        :type a_y: float
        :param b_x: Top right decimal longitude
        :type b_x: float
        :param b_y: Top right decimal latitude
        :type b_y: float
        :param c_x: Bottom right decimal longitude
        :type c_x: float
        :param c_y: Bottom right decimal latitude
        :type c_y: float
        :param d_x: Bottom left decimal longitude
        :type d_x: float
        :param d_y: Bottom left decimal latitude
        :type d_y: float
        :param dpmm: Dots per millimeter
        :type dpmm: float
        """
        self.dpmm = dpmm

        uri = "mongodb://{}:{}@{}/{}?authMechanism=SCRAM-SHA-1".format(
            MONGO['user'], MONGO['password'], MONGO['domain'], MONGO['database']
        )
        client = MongoClient(uri) if not MONGO['local'] \
            else MongoClient('localhost', MONGO['port'])

        self.db = client['atlas']

        if collection is None:
            collection = self.db[MONGO['collection']]
        else:
            collection = self.db[collection]
        self._collection = collection

    @property
    def collection(self):
        return self._collection

    @collection.setter
    def collection(self, value):
        if value in self.collections:
            self._collection = self.db[value]

    @property
    def collections(self):
        return self.db.collection_names()

    @property
    def multiscale(self):
        geojsonfiles = []
        return geojsonfiles

    def quadrilateral(self, a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y, ):
        """Returns the GeoJSON documents within a quadrilateral

        :return: List of GeoJSON files
        :rtype: list
        """
        cursor = self.collection.find(
            {'geometry': {'$geoIntersects': {
                '$geometry': {'type': 'Polygon', 'coordinates': [
                    [[a_x, a_y], [b_x, b_y],
                     [c_x, c_y], [d_x, d_y],
                     [a_x, a_y]]]}}}},
            projection={'_id': False, 'type': True,
                        'properties.centroid': True,
                        'properties.value': True, })

        return list(cursor)

    def polygon(self, coords, geotype='Polygon'):
        cursor = self.collection.find(
            {'geometry': {'$geoIntersects': {
                '$geometry': {'type': geotype, 'coordinates': coords}}}},
            projection={'_id': False, 'type': True,
                        'properties.centroid': True,
                        'properties.value': True, })

        return list(cursor)

    def all_metadata(self):
        self.collection = self.db['grid_meta']
        cursor = self.collection.find({}, projection={'_id': False})
        return list(cursor)

    def regions(self, a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y):
        cursor = self.collection.find(
            {'geometry': {'$geoIntersects': {
                '$geometry': {'type': 'Polygon', 'coordinates': [
                    [[a_x, a_y], [b_x, b_y],
                     [c_x, c_y], [d_x, d_y],
                     [a_x, a_y]]]}}}},
            projection={'_id': False, 'type': True,
                        'geometry.coordinates': True,
                        'geometry.type': True,
                        'properties.name_long': True,})
        return list(cursor)

    def aggregate_grid_to_regions(self, a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y,
                                  grid_collection, region_collection):
        self.collection = region_collection
        regions = self.regions(a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y)
        self.collection = grid_collection
        n = 0

        for region in regions:
            try:
                a = []
                grids = self.polygon(region['geometry']['coordinates'],
                                     geotype=region['geometry']['type'])
                if len(grids) > 0:
                    if not n: n = len(grids[0]['properties']['value']['values'])
                    for grid in grids:
                        a.append(grid['properties']['value']['values'])
                    a = np.array(a, dtype=np.float)
                    if np.all(np.isnan(a)):
                        region['properties']['value'] = dict(values=[None for i in range(n)])
                    else:
                        a = np.nanmean(a, axis=0)
                        # print('a:', a)
                        region['properties']['value'] = dict(values=a.tolist())
                else:
                    region['properties']['value'] = dict(values=[None for i in range(n)])
            except:
                print('fail:', region['properties'])
        return regions



if __name__ == '__main__':
    import pprint
    pp = pprint.PrettyPrinter(indent=2)
    try:
        mr = MongoRead(1)
        mr.aggregate_grid_to_regions(
            0., 10., 10, 10, 10, 0, 0, 0,
            'default_firr_aet_whe',
            'ne_50m_admin_0_countries',)
    except PyMongoError, error:
        print 'Error while reading on MongoDB.'
        raise error
