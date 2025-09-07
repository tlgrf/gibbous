from backend.app import db
from flask_login import UserMixin
from datetime import datetime


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    queues = db.relationship('Queue', backref='owner', lazy=True)
    media_items = db.relationship('MediaItem', backref='owner', lazy=True)

    def to_dict(self):
        return dict(id=self.id, username=self.username, email=self.email)


class Queue(db.Model):
    __tablename__ = 'queues'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Delete items when the queue goes away
    media_items = db.relationship('MediaItem', backref='queue', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return dict(id=self.id, title=self.title, description=self.description, user_id=self.user_id)


class MediaItem(db.Model):
    __tablename__ = 'media_items'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    kind = db.Column(db.String(50))
    notes = db.Column(db.Text)
    sort_key = db.Column(db.Float, default=0.0)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    queue_id = db.Column(db.Integer, db.ForeignKey('queues.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # MVP extensions
    status = db.Column(db.String(20), nullable=False, default='queued')  # queued | in_progress | dropped | finished
    vibes = db.Column(db.Text)  # CSV string of vibes (e.g., "cozy,wholesome")
    rating = db.Column(db.Integer, nullable=True)  # 1-10

    def to_dict(self):
        return dict(
            id=self.id,
            title=self.title,
            kind=self.kind,
            notes=self.notes,
            user_id=self.user_id,
            queue_id=self.queue_id,
            sort_key=self.sort_key,
            status=self.status,
            vibes=self.vibes,
            rating=self.rating,
        )