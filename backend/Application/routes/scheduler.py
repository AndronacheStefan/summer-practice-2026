from Application import app
from flask import jsonify, request  # type: ignore
try:
    from bson.objectid import ObjectId  # type: ignore
except Exception:  # fallback if bson package is unavailable to linters
    from bson import ObjectId  # type: ignore
try:
    from bson.errors import InvalidId  # type: ignore
except Exception:
    # fallback if bson.errors is unavailable to linters or environment
    # Use a generic Exception as InvalidId so the except InvalidId: blocks still work
    InvalidId = Exception
from ..database.models import Device, Schedule


@app.route('/device/<device_name>/schedules', methods=['GET'])
def list_device_schedules(device_name):
    try:
        schedules = Schedule.objects(deviceName=device_name).to_json()
        return schedules, 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500


@app.route('/device/<device_name>/schedules', methods=['POST'])
def create_device_schedule(device_name):
    try:
        device = Device.objects(deviceName=device_name).first()
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        body = request.get_json() or {}
        schedule = Schedule(
            deviceName=device_name,
            action=body.get('action'),
            startTime=body.get('startTime'),
            recurrence=body.get('recurrence', 'once'),
        )
        schedule.save()
        return schedule.to_json(), 201
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400


@app.route('/schedule/<schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    try:
        try:
            oid = ObjectId(schedule_id)
        except InvalidId:
            return jsonify({'error': 'Invalid schedule id'}), 400
        schedule = Schedule.objects(id=oid).first()
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
        schedule.delete()
        return jsonify({'message': 'Schedule deleted successfully'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 400
