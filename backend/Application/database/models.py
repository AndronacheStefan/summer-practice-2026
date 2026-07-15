try:
    # preferred import
    from bson.objectid import ObjectId  # type: ignore
except Exception:
    try:
        # alternative location
        from bson import ObjectId  # type: ignore
    except Exception:
        # fallback to pymongo's ObjectId if bson isn't available
        from pymongo import ObjectId  # type: ignore
from mongoengine import (  # type: ignore[import]
    Document,
    EmbeddedDocument,
    StringField,
    IntField,
    FloatField,
    EmbeddedDocumentListField,
    ObjectIdField,
)

class User(Document):
    name = StringField(required=True)
    username = StringField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(required=True, choices=['admin', 'user'])
    site = StringField(required=False)
    group = StringField(required=False)

class Device(Document):
    deviceName = StringField(required=True, unique=True)
    deviceSlNo = StringField(required=False)
    deviceType = StringField(required=False)
    hwType = StringField(required=False)
    group = StringField(required=True)
    site = StringField(required=False)
    owner = StringField(required=False)
    connectivityType = StringField(required=False)
    ip = StringField(required=False)
    port = StringField(required=False)
    loginUser = StringField(required=False)
    password = StringField(required=False)
    readCommunity = StringField(required=False)
    writeCommunity = StringField(required=False)
    powerOnTime = StringField(required=False)  # format: "HH:MM"
    powerOffTime = StringField(required=False)  # format: "HH:MM"
    count = IntField(required=False, default=1)  # câte dispozitive de acest tip
    consumptionPerHour = FloatField(required=False)  # kWh per hour
    

class DailySaving(EmbeddedDocument):
    subId = ObjectIdField(required=True, default=lambda: ObjectId())
    date = StringField(required=True)  # "2025-07-17"
    hoursOff = FloatField(required=True)  # ore cât a fost oprit
    energySaved = FloatField(required=True)  # kWh economisiti

class Saving(Document):
    deviceName = StringField(required=True, unique=True)
    log = EmbeddedDocumentListField(DailySaving)

class Schedule(Document):
    deviceName = StringField(required=True)
    action = StringField(required=True, choices=['on', 'off'])
    startTime = StringField(required=True)  # ISO 8601, e.g. "2026-07-14T18:30"
    recurrence = StringField(required=True, choices=['once', 'daily', 'weekly'], default='once')