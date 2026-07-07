from mongoengine.errors import NotUniqueError # type: ignore
import bcrypt # type: ignore
from Application.database.models import User

def insert_user(body):
    try:
        return User(**body).save()
    except NotUniqueError as e:
        print(e, "insert_user", body)
        return {'message': "User Already Exists"}
    except Exception as e:
        print(e, "insert_user", body)
        return {'error': True, 'message': "Exception when trying to insert user"}


def ensure_default_dev_user(username='admin', password='testuser'):
    existing_user = User.objects(username=username).first()
    if existing_user:
        return False

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    User(username=username, password=hashed_password, role='admin', site='global', group='default').save()
    print(f"Default development user '{username}' created.")
    return True