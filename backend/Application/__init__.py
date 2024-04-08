
from flask import Flask
from .database.db import initialize_db
from flask_cors import CORS
import configparser
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import time
from .scripts.toggle import power_off_devices, power_on_devices

secret = configparser.ConfigParser()
secret.read('Application/scripts/config.ini') 


app = Flask("__name__", static_folder='Application/static')
app.config['MONGODB_SETTINGS'] = {
    'host': secret['db']['MONGO_URL']
}
initialize_db(app)
CORS(app)


sched = BackgroundScheduler(daemon=True)
sched.add_job(power_off_devices,'interval',hours=1)
next_run_time = datetime.now() + timedelta(hours=1, minutes=5)
sched.add_job(power_on_devices,'interval',hours=1, next_run_time=next_run_time)

sched.start()

from .routes.users import app
from .routes.auth import app
from .routes.device import app



  








