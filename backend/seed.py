"""Seed script (no sample accounts created by default per request)."""
from backend.app import create_app, db


def run():
    app = create_app()
    with app.app_context():
        # Alembic migrations for schema
        print('App context ready (apply migrations via: flask db upgrade)')

if __name__ == '__main__':
    run()
