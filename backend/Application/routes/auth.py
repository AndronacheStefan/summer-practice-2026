import configparser
import os

from bcrypt import hashpw # type: ignore
from Application import app
from flask import jsonify, make_response, request # type: ignore

from Application.database.models import User
from datetime import datetime, timedelta
from flask_jwt_extended import JWTManager, create_access_token # type: ignore
import bcrypt # type: ignore
from Application.scripts.utils import insert_user

secret = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(__file__), '..', 'scripts', 'config.ini')
secret.read(config_path)

app.config['JWT_SECRET_KEY'] = secret['db']['SECRET_KEY']
app.config['SECRET_KEY'] = secret['db']['SECRET_KEY']
jwt = JWTManager(app)


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.objects(username=username).first()
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        access_token = create_access_token(identity=str(username))
        return {
            'access_token': access_token,
            'message': 'Login Successfull',
            'loggedinUser': username,
            'name': user.name or username,
            'role': user.role,
            'group': user.group,
        }
    else:
        return {'message': 'Invalid credentials'}, 401
    

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'user')
    site = data.get('site')
    group = data.get('group')
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    user = {
        "name": name or username,
        "username": username,
        "password": hashed_password,
        "role": role,
        "site": site,
        "group": group,
    }
    action = insert_user(user)
    if 'error' not in action:
        return {"message": "User succesfully added"}
    return action