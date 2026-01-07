import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from config import config
from models import db, User, Song, Verification

app = Flask(__name__)

# Load configuration
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# Initialize extensions
db.init_app(app)
CORS(app, origins=app.config['CORS_ORIGINS'])

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})


@app.route('/api/songs', methods=['GET'])
def get_songs():
    """Get all songs"""
    try:
        songs = Song.query.order_by(Song.total_stream_count.desc()).all()
        return jsonify([song.to_dict() for song in songs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/songs/<int:song_id>', methods=['GET'])
def get_song(song_id):
    """Get a specific song"""
    try:
        song = Song.query.get_or_404(song_id)
        return jsonify(song.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get leaderboard with optional time and song filters"""
    try:
        time_filter = request.args.get('filter', 'all')  # all, today, week, month
        song_id = request.args.get('songId')  # optional song filter

        query = db.session.query(
            Verification.id,
            User.username,
            Song.title.label('song_title'),
            Song.id.label('song_id'),
            Verification.stream_count,
            Verification.verified_at,
            Verification.created_at
        ).join(User, Verification.user_id == User.id) \
         .join(Song, Verification.song_id == Song.id) \
         .filter(Verification.status == 'approved')

        # Apply song filter
        if song_id:
            query = query.filter(Song.id == int(song_id))

        # Apply time filter
        now = datetime.utcnow()
        if time_filter == 'today':
            query = query.filter(db.func.date(Verification.created_at) == now.date())
        elif time_filter == 'week':
            week_ago = now - timedelta(days=7)
            query = query.filter(Verification.created_at >= week_ago)
        elif time_filter == 'month':
            month_ago = now - timedelta(days=30)
            query = query.filter(Verification.created_at >= month_ago)

        # Order by stream count and creation date
        results = query.order_by(
            Verification.stream_count.desc(),
            Verification.created_at.asc()
        ).all()

        # Add rank
        leaderboard = []
        for rank, result in enumerate(results, start=1):
            leaderboard.append({
                'id': result.id,
                'rank': rank,
                'username': result.username,
                'songTitle': result.song_title,
                'songId': result.song_id,
                'streamCount': result.stream_count,
                'verifiedAt': result.verified_at.isoformat() if result.verified_at else None,
                'createdAt': result.created_at.isoformat() if result.created_at else None
            })

        return jsonify(leaderboard)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/verifications', methods=['POST'])
def create_verification():
    """Create or update verification (streaming proof) with PIN authentication"""
    try:
        # Validate request
        if 'proof' not in request.files:
            return jsonify({'error': 'No proof image provided'}), 400

        proof_file = request.files['proof']
        if proof_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(proof_file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Get form data
        username = request.form.get('username')
        pin = request.form.get('pin')
        song_id = request.form.get('songId')
        stream_count = request.form.get('streamCount')

        if not all([username, pin, song_id, stream_count]):
            return jsonify({'error': 'Missing required fields (username, pin, songId, streamCount)'}), 400

        # Validate PIN format (4 digits)
        if not pin.isdigit() or len(pin) != 4:
            return jsonify({'error': 'PIN must be exactly 4 digits'}), 400

        # Validate song_id and stream count
        try:
            song_id = int(song_id)
            stream_count = int(stream_count)
            if stream_count <= 0:
                raise ValueError()
        except ValueError:
            return jsonify({'error': 'Invalid song_id or stream count'}), 400

        # Check if song exists
        song = Song.query.get(song_id)
        if not song:
            return jsonify({'error': 'Song not found'}), 404

        # Get or create user with PIN
        user = User.query.filter_by(username=username).first()
        if user:
            # User exists - verify PIN
            if not user.verify_pin(pin):
                return jsonify({'error': 'Invalid PIN for this username'}), 401
        else:
            # Create new user with PIN
            user = User(username=username, pin_hash=User.hash_pin(pin))
            db.session.add(user)
            db.session.flush()

        # Save proof image
        filename = secure_filename(proof_file.filename)
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{user.id}_{song_id}_{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        proof_file.save(filepath)

        # Check if verification already exists for this user and song
        verification = Verification.query.filter_by(
            user_id=user.id,
            song_id=song_id
        ).first()

        if verification:
            # Update existing verification
            verification.stream_count = stream_count
            verification.proof_image = filename
            verification.verified_at = datetime.utcnow()
            verification.updated_at = datetime.utcnow()
            message = 'Verification updated successfully'
        else:
            # Create new verification
            verification = Verification(
                user_id=user.id,
                song_id=song_id,
                stream_count=stream_count,
                proof_image=filename,
                status='approved',
                verified_at=datetime.utcnow()
            )
            db.session.add(verification)
            message = 'Verification created successfully'

        db.session.commit()

        return jsonify({
            'message': message,
            'verification': verification.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/verifications/<int:verification_id>', methods=['GET'])
def get_verification(verification_id):
    """Get a specific verification"""
    try:
        verification = Verification.query.get_or_404(verification_id)
        return jsonify(verification.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@app.route('/api/verifications/<int:verification_id>/approve', methods=['PUT'])
def approve_verification(verification_id):
    """Approve a verification (admin endpoint)"""
    try:
        verification = Verification.query.get_or_404(verification_id)
        verification.status = 'approved'
        verification.verified_at = datetime.utcnow()
        db.session.commit()
        return jsonify(verification.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/verifications/<int:verification_id>/reject', methods=['PUT'])
def reject_verification(verification_id):
    """Reject a verification (admin endpoint)"""
    try:
        verification = Verification.query.get_or_404(verification_id)
        verification.status = 'rejected'
        db.session.commit()
        return jsonify(verification.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/users/<username>', methods=['GET'])
def get_user(username):
    """Get user profile with their verifications"""
    try:
        user = User.query.filter_by(username=username).first_or_404()
        verifications = [v.to_dict() for v in user.verifications]

        return jsonify({
            **user.to_dict(),
            'verifications': verifications,
            'totalStreams': sum(v.stream_count for v in user.verifications if v.status == 'approved')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics"""
    try:
        total_verifications = Verification.query.filter_by(status='approved').count()
        total_streams = db.session.query(
            db.func.sum(Verification.stream_count)
        ).filter(Verification.status == 'approved').scalar() or 0
        active_users = db.session.query(Verification.user_id).distinct().count()
        total_songs = Song.query.count()

        return jsonify({
            'totalVerifications': total_verifications,
            'totalStreams': total_streams,
            'activeUsers': active_users,
            'totalSongs': total_songs
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
