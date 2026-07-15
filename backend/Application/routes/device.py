from Application import app
from flask import jsonify, request # type: ignore
from ..database.models import Device


@app.route('/devices', methods=['GET'])
def get_devices():
    try:
        devices = Device.objects().to_json()
        return devices, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/device', methods=['POST'])
def add_device():
    try:
        device_data = request.get_json()
        new_device = Device(**device_data)
        new_device.save()
        return jsonify({'message': 'Device added successfully'}), 201
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400


UPDATABLE_DEVICE_FIELDS = {
    'deviceSlNo', 'deviceType', 'hwType', 'group', 'site', 'owner',
    'connectivityType', 'ip', 'port', 'loginUser', 'password',
    'readCommunity', 'writeCommunity', 'powerOnTime', 'powerOffTime',
    'count', 'consumptionPerHour',
}


@app.route('/device/<device_name>', methods=['PUT'])
def update_device(device_name):
    try:
        device = Device.objects(deviceName=device_name).first()
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        body = request.get_json() or {}
        for key, value in body.items():
            if key in UPDATABLE_DEVICE_FIELDS:
                setattr(device, key, value)
        device.save()
        return device.to_json(), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400


@app.route('/device/<device_name>', methods=['DELETE'])
def delete_device(device_name):
    try:
        device = Device.objects(deviceName=device_name).first()
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        device.delete()
        return jsonify({'message': 'Device deleted successfully'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400