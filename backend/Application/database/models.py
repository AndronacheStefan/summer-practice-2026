from bson.objectid import ObjectId
from mongoengine import *
from .db import db


class User(Document):
    username = StringField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(required=True)
    group = StringField(required=True)
    site = StringField(required=True)



class Device(Document):
    deviceName = StringField(required=True, unique=True)
    deviceSlNo = StringField(required=True, unique=True)
    deviceType = StringField(required=True)
    hwType = StringField(required=True)
    site = StringField(required=True)
    group = StringField(required=True)
    owner = StringField(required=True)
    # connectivity details
    connectivityType = StringField(required=True) # ssh or snmp
    ip = StringField(required=True)
    port = StringField(required=True)
    # ssh
    loginUser = StringField(required=True) 
    password =  StringField(required=True)
    # snmp
    readCommunity = db.StringField(Required=True)
    writeCommunity = db.StringField(Required=True)
    powerOffTime = StringField(required=True)
    powerOnTime = StringField(required=True)
    midCycle = db.BooleanField() # true if awaits power on

class Scheduler(Document):
    deviceSlNo = StringField(required=True, unique=True)
    powerOffDays = db.ListField(Required=True)
    powerOnDays = db.ListField(Required=True)

class DailySaving(db.EmbeddedDocument):
    subId = db.ObjectIdField(required=True, default=lambda: ObjectId())
    powerOffEndTime = db.IntField()
    powerOffStatus = db.StringField()
    powerOnEndTime = db.IntField()
    powerOnStatus = db.StringField()
    secondsMachinePoweredOff = db.IntField()
    date = db.StringField()
    week = db.IntField()
    month = db.StringField()
    year = db.IntField()
    savings = db.FloatField()

class Saving(Document):
    deviceSlNo = StringField(required=True, unique=True)
    log = db.EmbeddedDocumentListField(DailySaving)
