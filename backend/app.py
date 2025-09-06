from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()


def create_app():
    app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')

    # --- Robust SQLite config: make sure instance/ exists and use an absolute path ---
    os.makedirs(app.instance_path, exist_ok=True)
    default_db = f"sqlite:///{os.path.join(app.instance_path, 'gibbous.db')}"
    env_url = os.getenv('DATABASE_URL')
    # If a relative SQLite URL was provided (e.g., sqlite:///instance/gibbous.db), ignore it to avoid "unable to open database file"
    if env_url and env_url.startswith('sqlite:///') and not env_url.startswith('sqlite:////'):
        # Relative path -> let’s fall back to a known-good absolute default in instance/
        env_url = None
    app.config['SQLALCHEMY_DATABASE_URI'] = env_url or default_db
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Session cookie hardening (set SECURE=True in production with HTTPS)
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False
    
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    # import models registered with SQLAlchemy
    from backend import models

    # CSRF: verify on mutating API routes
    from backend.security import ensure_csrf
    @app.before_request
    def _csrf_guard():
        if request.path.startswith('/api/'):
            ensure_csrf()

    # API blueprint
    from backend.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # serve frontend index.html for other routes (single origin)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return app.send_static_file('index.html')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
