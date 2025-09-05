"""Seed script (no sample accounts created by default per request)."""
from backend.app import create_app, db


def run():
    app = create_app()
    with app.app_context():
        db.create_all()
        print('DB ensured')


if __name__ == '__main__':
    run()
