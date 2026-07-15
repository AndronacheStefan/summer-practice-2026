
from flask import Flask
from .database.db import initialize_db
from flask_cors import CORS
import configparser
import os
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import time
from .scripts.toggle import power_off_devices, power_on_devices
from .scripts.utils import ensure_default_dev_user

secret = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(__file__), 'scripts', 'config.ini')
secret.read(config_path)


app = Flask("__name__", static_folder='Application/static')
app.config['MONGODB_SETTINGS'] = {
    'host': secret['db']['MONGO_URL']
}
initialize_db(app)
CORS(app)

if os.environ.get('FLASK_ENV') == 'development' or os.environ.get('FLASK_DEBUG') == '1' or app.debug:
    ensure_default_dev_user()


sched = BackgroundScheduler(daemon=True)
sched.add_job(power_off_devices,'interval',hours=1)
next_run_time = datetime.now() + timedelta(hours=1, minutes=5)
sched.add_job(power_on_devices,'interval',hours=1, next_run_time=next_run_time)

sched.start()

from .routes.users import app
from .routes.auth import app
from .routes.device import app
from .routes.scheduler import app
