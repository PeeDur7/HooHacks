from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
mongoClient = MongoClient(os.getenv("MONGO_URI"))
db = mongoClient[os.getenv("DB_NAME")]
app.config["db"] = db

from auth.auth import authBlueprint
from model.user import userBluePrint

app.register_blueprint(authBlueprint, url_prefix="/auth")
app.register_blueprint(userBluePrint, url_prefix="/user")