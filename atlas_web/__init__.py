# -*- coding: utf-8 -*-
from flask import Flask
from atlas_web.filters import safe_markdown, format_currency, smartypants, \
    nbsp, nowrap

app = Flask(__name__)
app.config.from_object('config')
app.jinja_env.filters['markdown'] = safe_markdown
app.jinja_env.filters['format_currency'] = format_currency
app.jinja_env.filters['smartypants'] = smartypants
app.jinja_env.filters['nbsp'] = nbsp
app.jinja_env.filters['nowrap'] = nowrap

from atlas_web.views import mod as atlas_mod
app.register_blueprint(atlas_mod)