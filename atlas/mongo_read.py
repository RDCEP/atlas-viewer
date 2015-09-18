__author__ = 'rblourenco@uchicago.edu'


# Class for geospatial information retrieval on MongoDB
# 2015-09-04 - Initial commit
# Importing MongoDB Client Library
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# MongoDB Setup
# Local run
# client = MongoClient('localhost', 27017)

# Remote run
uri = "mongodb://user:password@example.com/the_database?authMechanism=SCRAM-SHA-1"
client = MongoClient(uri)

db = client['atlas']
collection = db['simulation']

class MongoRead:
    def __init__(self, a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y, dpmm):
        self.a_x = a_x  # Coordinate point A, x axis
        self.a_y = a_y  # Coordinate point A, y axis
        self.b_x = b_x  # Coordinate point B, x axis
        self.b_y = b_y  # Coordinate point B, y axis
        self.c_x = c_x  # Coordinate point C, x axis
        self.c_y = c_y  # Coordinate point C, y axis
        self.d_x = d_x  # Coordinate point D, x axis
        self.d_y = d_y  # Coordinate point D, y axis

        self.dpmm = dpmm  # Dot per milimeter rate extracted from browser

    @property
    def quadrilateral(self): # Returns the GeoJSON documents within it
        geojsonfiles = []
        cursor = collection.find({"geometry": {"$geoIntersects": {"$geometry": {"type": "Polygon", "coordinates": [
            [[self.a_x, self.a_y], [self.b_x, self.b_y], [self.c_x, self.c_y],
             [self.d_x, self.d_y], [self.a_x, self.a_y]]]}}}})
        for document in cursor:
            document['properties']['_id'] = document['_id']
            del(document['_id'])
            geojsonfiles.append(document)

        return geojsonfiles

    @property
    def multiscale(self):
        geojsonfiles = []
        return geojsonfiles

if __name__ == '__main__':
    import pprint
    pp = pprint.PrettyPrinter(indent=2)
    try:                                                      # When reading always include exception for MongoDB
        mr = MongoRead(46., 10, 48, 10, 48, 8, 46, 8, 1)
        # print json.dumps(mr.quadrilateral)
        pp.pprint(mr.quadrilateral)
    except PyMongoError:
        print 'Error while reading on MongoDB.'