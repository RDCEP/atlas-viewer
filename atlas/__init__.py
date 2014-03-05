from flask import Flask
from atlas.filters import safe_markdown, format_currency, smartypants, nbsp

app = Flask(__name__)
app.config.from_object('config')
app.jinja_env.filters['markdown'] = safe_markdown
app.jinja_env.filters['format_currency'] = format_currency
app.jinja_env.filters['smartypants'] = smartypants
app.jinja_env.filters['nbsp'] = nbsp

from atlas.views import mod as atlas_mod
app.register_blueprint(atlas_mod)