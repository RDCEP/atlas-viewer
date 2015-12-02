try:
    import simplejson as json
except ImportError:
    import json
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from atlas.constants import MONGO


__author__ = 'rblourenco@uchicago.edu'
# 2015-09-04 - Initial commit


class MongoRead(object):
    def __init__(self, a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y, dpmm,
                 collection=None):
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
        self.a_x = a_x
        self.a_y = a_y
        self.b_x = b_x
        self.b_y = b_y
        self.c_x = c_x
        self.c_y = c_y
        self.d_x = d_x
        self.d_y = d_y
        self.dpmm = dpmm
        if collection is None:
            uri = "mongodb://{}:{}@{}/{}?authMechanism=SCRAM-SHA-1".format(
                MONGO['user'], MONGO['password'], MONGO['domain'], MONGO['database']
            )
            client = MongoClient(uri) if not MONGO['local'] \
                else MongoClient('localhost', MONGO['port'])

            db = client['atlas']
            collection = db['simulation_poly']
        self.collection = collection

    @property
    def quadrilateral(self):
        """Returns the GeoJSON documents within a quadrilateral

        :return: List of GeoJSON files
        :rtype: list
        """
        cursor = self.collection.find(
            {'geometry': {'$geoIntersects': {
                '$geometry': {'type': 'Polygon', 'coordinates': [
                    [[self.a_x, self.a_y], [self.b_x, self.b_y],
                     [self.c_x, self.c_y], [self.d_x, self.d_y],
                     [self.a_x, self.a_y]]]}}}},
            projection={'_id': False, 'type': True, 'geometry': True,
                        'properties.value': True, })

        return list(cursor)

    @property
    def multiscale(self):
        geojsonfiles = []
        return geojsonfiles


if __name__ == '__main__':
    import pprint
    pp = pprint.PrettyPrinter(indent=2)
    try:
        mr = MongoRead(46., 10., 48., 10., 48., 8., 46., 8., 1)
        pp.pprint(mr.quadrilateral)
    except PyMongoError, error:
        print 'Error while reading on MongoDB.'
        raise error
