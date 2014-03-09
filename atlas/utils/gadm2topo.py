import os
import pandas as pd
import urllib2
import json


class GadmTopo(object):
    def __init__(self):
        pass

    @property
    def gadm1_meta(self):
        d = pd.DataFrame.from_csv('gadm1.meta.csv', index_col=4)
        return d

    @property
    def gadm0_codes(self):
        return self.gadm1_meta.drop_duplicates(cols='ISO')['ISO']

    def download_gadm_shapefiles(self):
        for r in self.gadm0_codes.values:
            url = 'http://biogeo.ucdavis.edu/data/gadm2/shp/{}_adm.zip'.format(r)
            file_name = url.split('/')[-1]
            u = urllib2.urlopen(url)
            f = open('../data/gadm_shp/{}'.format(file_name), 'wb')
            meta = u.info()
            file_size = int(meta.getheaders("Content-Length")[0])
            print "Downloading: %s Bytes: %s" % (file_name, file_size)

            file_size_dl = 0
            block_sz = 8192
            while True:
                buffer = u.read(block_sz)
                if not buffer:
                    break

                file_size_dl += len(buffer)
                f.write(buffer)
                status = r"%10d  [%3.2f%%]" % (file_size_dl, file_size_dl * 100. / file_size)
                status = status + chr(8)*(len(status)+1)
                print status,

            f.close()

    def unzip_file(self, filename):
        import zipfile
        import os
        basedir = '../data/gadm_shp'
        z_file = zipfile.ZipFile('{}/{}_adm.zip'.format(basedir, filename))
        for name in z_file.namelist():
            # dirname = '{}/{}'.format(basedir, filename)
            dirname = '{}/{}'.format(basedir, 'gadm_012')
            print 'Decompressing ' + filename + ' on ' + dirname
            if not os.path.exists(dirname):
                os.makedirs(dirname)
            z_file.extract(name, dirname)

    def unzip_shapefiles(self):
        for r in self.gadm0_codes.values:
            self.unzip_file(r)

    def write_topojson_cmd(self):
        with open('topojson_options', 'wa') as f:
            f.write('  -o gadm0_s01.json \\\n  -s .01 -- \\\n')
            for r in self.gadm0_codes.values:
                f.write('  /Users/njmattes/Documents/code/ggcmi_atlas/atlas/static/gadm_shapefiles/gadm_012/{}_adm0.shp \\\n'.format(r))

    def merge_shp(self):
        basedir = '../data/gadm_shp/'
        # os.chdir(basedir)
        # os.system('/usr/local/bin/ogr2ogr {}_bejeezus.shp {}{}_adm1.shp'.format(basedir, basedir, self.gadm0_codes[0]))
        for iso in self.gadm0_codes:
            try:
                os.system('/usr/local/bin/ogr2ogr -update -append {}_bejeezus.shp {}{}_adm1.shp -nln _bejeezus'.format(basedir, basedir, iso))
            except:
                os.system('/usr/local/bin/ogr2ogr -update -append {}_bejeezus.shp {}{}_adm0.shp -nln _bejeezus'.format(basedir, basedir, iso))

    def show_properties(self):
        with open('../data/gadm_shp/gadm1_map.json') as f:
            map = json.loads(f.read())
        print(map['objects']['_bejeezus']['geometries'][0]['properties'])



if __name__ == '__main__':
    gt = GadmTopo()
    # gt.download_gadm_shapefiles()
    # gt.write_topojson_cmd()
    gt.show_properties()

    import json

    # with open('../static/js/gadm_codes.json', 'w') as f:
    #     f.write(
    #         json.dumps(
    #             gt.gadm0_codes.tolist()
    #         )
    #     )
