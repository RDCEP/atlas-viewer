# -*- coding: utf-8 -*-
from flask import Flask
from flask.ext.compress import Compress
from flask_assets import Bundle, Environment
from atlas_web.filters import safe_markdown, format_currency, smartypants, \
    nbsp, nowrap

app = Flask(__name__)
Compress(app)
app.config.from_object('config')
app.jinja_env.filters['markdown'] = safe_markdown
app.jinja_env.filters['format_currency'] = format_currency
app.jinja_env.filters['smartypants'] = smartypants
app.jinja_env.filters['nbsp'] = nbsp
app.jinja_env.filters['nowrap'] = nowrap

from atlas_web.views import mod as atlas_mod
app.register_blueprint(atlas_mod)

assets = Environment(app)

js = Bundle('js/app/atlas.globals.v0.js',
            'js/app/atlas.map.v0.js',
            'js/app/atlas.data.v0.js',
            'js/app/atlas.ui.v0.js',
            # 'js/app/atlas.panzoom.v0.js',
            'js/main.js',
            filters='jsmin', output='gen/atlas.app.v0.js')
assets.register('js_app', js)

js = Bundle('js/vendor/d3/d3-selection.v1.min.js',
            'js/vendor/d3/d3-array.v1.min.js',
            'js/vendor/d3/d3-geo.v1.min.js',
            'js/vendor/d3/d3-collection.v1.min.js',
            'js/vendor/d3/d3-color.v1.min.js',
            'js/vendor/d3/d3-format.v1.min.js',
            'js/vendor/d3/d3-interpolate.v1.min.js',
            'js/vendor/d3/d3-scale-chromatic.v1.min.js',
            'js/vendor/d3/d3-time.v1.min.js',
            'js/vendor/d3/d3-time-format.v1.min.js',
            'js/vendor/d3/d3-scale.v1.min.js',
            'js/vendor/d3/d3-ease.v1.min.js',
            'js/vendor/d3/d3-dispatch.v1.min.js',
            'js/vendor/d3/d3-timer.v1.min.js',
            'js/vendor/d3/d3-transition.v1.min.js',
            'js/vendor/d3/d3-drag.v1.min.js',
            'js/vendor/d3/d3-zoom.v1.min.js',
            'js/vendor/d3/d3-dsv.v1.min.js',
            'js/vendor/d3/d3-request.v1.min.js',
            'js/vendor/d3/d3-selection-multi.v0.4.min.js',
            filters='jsmin', output='gen/atlas.d3.v0.js')
assets.register('js_d3', js)
