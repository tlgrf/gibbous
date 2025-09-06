from flask import Blueprint, request, jsonify
from backend.app import db, login_manager
from backend.models import User, Queue, MediaItem
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from backend.security import issue_csrf

api_bp = Blueprint('api', __name__)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'unauthorized'}), 401

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not username or not email or not password:
        return jsonify({'error': 'username, email and password required'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': 'user with that username or email exists'}), 400

    u = User(username=username, email=email, password_hash=generate_password_hash(password))
    db.session.add(u)
    db.session.commit()
    login_user(u)
    return jsonify({'user': u.to_dict()})


@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_field = data.get('login')
    password = data.get('password')
    if not login_field or not password:
        return jsonify({'error': 'login and password required'}), 400

    # username/email login 
    user = User.query.filter((User.username == login_field) | (User.email == login_field)).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'invalid credentials'}), 401

    login_user(user)
    return jsonify({'user': user.to_dict()})


@api_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'ok': True})


@api_bp.route('/me', methods=['GET'])
def me():
    if not current_user.is_authenticated:
        return jsonify({'user': None, 'csrf': None})
    # also issue CSRF token for client to attach on mutations
    token = issue_csrf()
    return jsonify({'user': current_user.to_dict(), 'csrf': token})


#queues
@api_bp.route('/queues', methods=['GET'])
@login_required
def list_queues():
    qs = Queue.query.filter_by(user_id=current_user.id).all()
    return jsonify([q.to_dict() for q in qs])


@api_bp.route('/queues', methods=['POST'])
@login_required
def create_queue():
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    if not title:
        return jsonify({'error': 'title required'}), 400
    q = Queue(title=title, description=description, user_id=current_user.id)
    db.session.add(q)
    db.session.commit()
    return jsonify(q.to_dict()), 201


#media items (that we're going to add in the queue)
@api_bp.route('/media-items', methods=['GET'])
@login_required
def list_media():
    items = MediaItem.query.filter_by(user_id=current_user.id).all()
    return jsonify([i.to_dict() for i in items])


@api_bp.route('/media-items', methods=['POST'])
@login_required
def create_media():
    data = request.get_json() or {}
    title = data.get('title')
    kind = data.get('kind')
    notes = data.get('notes')
    queue_id = data.get('queue_id')
    if not title:
        return jsonify({'error': 'title required'}), 400
    m = MediaItem(title=title, kind=kind, notes=notes, user_id=current_user.id, queue_id=queue_id)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201

@api_bp.route('/media-items/<int:item_id>', methods=['PATCH'])
@login_required
def update_media(item_id):
   m = MediaItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
   data = request.get_json() or {}
   for field in ('title', 'kind', 'notes', 'queue_id', 'sort_key'):
       if field in data:
           setattr(m, field, data[field])
   db.session.commit()
   return jsonify(m.to_dict())

@api_bp.route('/media-items/<int:item_id>', methods=['DELETE'])
@login_required
def delete_media(item_id):
   m = MediaItem.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
   db.session.delete(m)
   db.session.commit()
   return jsonify({'ok': True})


@api_bp.route('/queues/<int:queue_id>/tonight', methods=['GET'])
@login_required
def tonight_trio(queue_id):
        # Optional constraints (aligns with pitch): ?max_minutes=120&vibe=cozy
    max_minutes = request.args.get('max_minutes', type=int)
    requested_vibe = request.args.get('vibe', type=str)

    items = MediaItem.query.filter_by(queue_id=queue_id).all()
    # simple scoring
    scored = []
    from datetime import datetime
    now = datetime.utcnow()
    for it in items:
        age = (now - it.created_at).total_seconds()
        recency = 1.0 / (1.0 + age / (60*60*24))
        vibe_score = (it.id % 7) / 7.0
        rating = 0.5
        score = rating*0.6 + recency*0.2 + vibe_score*0.2
        scored.append((score, it))

    scored.sort(key=lambda x: x[0], reverse=True)
    trio = [it.to_dict() for _, it in scored[:3]]
    why = []
    for s, it in scored[:3]:
        parts = []
        if max_minutes:
            parts.append(f"≤{max_minutes}m")
        if requested_vibe:
            parts.append(f"vibe:{requested_vibe}")
        parts.append(f"recency/rating mix {s:.3f}")
        why.append({'id': it.id, 'why': " | ".join(parts)})
    return jsonify({'trio': trio, 'why': why})


@api_bp.route('/queues/<int:queue_id>/reorder', methods=['POST'])
@login_required
def reorder_queue(queue_id):
    q = Queue.query.get_or_404(queue_id)
    if q.user_id != current_user.id:
        return jsonify({'error': 'not authorized to access this queue'}), 403

    data = request.get_json() or {}
    items = data.get('items')  # expected: [{id: int, sort_key: float}, ...]
    if not isinstance(items, list):
        return jsonify({'error': 'items array required'}), 400

    # update inside a transaction
    try:
        for it in items:
            mid = it.get('id')
            sk = it.get('sort_key')
            if mid is None or sk is None:
                continue
            mi = MediaItem.query.filter_by(id=mid, queue_id=queue_id, user_id=current_user.id).first()
            if mi:
                mi.sort_key = float(sk)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'failed to reorder', 'detail': str(e)}), 500

    return jsonify({'ok': True})
