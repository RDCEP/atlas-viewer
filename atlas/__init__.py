from flask import Flask


app = Flask(__name__)
app.config.from_object('config')


from atlas.views import mod as atlas_mod
app.register_blueprint(atlas_mod)