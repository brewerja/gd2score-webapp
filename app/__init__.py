from flask import Flask
from flask_sslify import SSLify
from flask_compress import Compress

app = Flask(__name__)
sslify = SSLify(app, permanent=True)
Compress(app)

from app import routes
