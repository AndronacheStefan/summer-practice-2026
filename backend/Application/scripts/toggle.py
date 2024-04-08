from datetime import datetime
from ..database.models import Device

def power_off_devices():
    current_time = datetime.now()
    current_hour = current_time.hour
    devices_to_toggle = Device.objects(powerOffTime=current_hour)
    for device in devices_to_toggle:
        # add entry in saving collection with power off time 
        # update device collection with midCycle: true
        continue

def power_on_devices():
    current_time = datetime.now()
    current_hour = current_time.hour
    devices_to_toggle = Device.objects(powerOnTime=current_hour)
    for device in devices_to_toggle:
        # add entry in saving collection with power on time
        # get the latest power off time and compute saving
        # formula for computing saving: seconds powered off * consumption per sec
        # update device collection with midCycle: false
        continue