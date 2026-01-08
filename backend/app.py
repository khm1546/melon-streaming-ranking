import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from config import config
from models import db, User, Song, Verification, kst_now

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
    return jsonify({'status': 'healthy', 'timestamp': kst_now().isoformat()})


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Verify username and PIN for login"""
    try:
        data = request.get_json()
        username = data.get('username')
        pin = data.get('pin')

        if not username or not pin:
            return jsonify({'error': '닉네임과 PIN을 입력해주세요'}), 400

        # Validate PIN format (4 digits)
        if not pin.isdigit() or len(pin) != 4:
            return jsonify({'error': 'PIN은 정확히 4자리 숫자여야 합니다'}), 400

        # Check if user exists
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({'error': '등록되지 않은 닉네임입니다. 먼저 스트리밍 인증을 제출해주세요.'}), 404

        # Verify PIN
        if not user.verify_pin(pin):
            return jsonify({'error': 'PIN이 일치하지 않습니다'}), 401

        # Login successful
        return jsonify({
            'success': True,
            'username': user.username,
            'message': '로그인 성공!'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


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

        # Apply time filter condition
        now = kst_now()
        time_condition = Verification.status == 'approved'
        if time_filter == 'today':
            time_condition = db.and_(time_condition, db.func.date(Verification.created_at) == now.date())
        elif time_filter == 'week':
            week_ago = now - timedelta(days=7)
            time_condition = db.and_(time_condition, Verification.created_at >= week_ago)
        elif time_filter == 'month':
            month_ago = now - timedelta(days=30)
            time_condition = db.and_(time_condition, Verification.created_at >= month_ago)

        if song_id:
            # Specific song selected - show individual verifications
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
             .filter(time_condition) \
             .filter(Song.id == int(song_id))

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
        else:
            # All Songs - aggregate by user
            query = db.session.query(
                User.id.label('user_id'),
                User.username,
                db.func.sum(Verification.stream_count).label('total_stream_count'),
                db.func.max(Verification.verified_at).label('latest_verified_at'),
                db.func.max(Verification.created_at).label('latest_created_at')
            ).join(Verification, User.id == Verification.user_id) \
             .filter(time_condition) \
             .group_by(User.id, User.username)

            # Order by total stream count
            results = query.order_by(
                db.desc('total_stream_count'),
                db.desc('latest_created_at')
            ).all()

            # Add rank
            leaderboard = []
            for rank, result in enumerate(results, start=1):
                leaderboard.append({
                    'id': result.user_id,  # Use user_id as identifier for All Songs
                    'rank': rank,
                    'username': result.username,
                    'songTitle': 'All Songs',
                    'songId': None,
                    'streamCount': result.total_stream_count,
                    'verifiedAt': result.latest_verified_at.isoformat() if result.latest_verified_at else None,
                    'createdAt': result.latest_created_at.isoformat() if result.latest_created_at else None
                })

        return jsonify(leaderboard)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/verifications', methods=['POST'])
def create_verification():
    """Create or update verification (streaming proof) with PIN authentication"""
    try:
        # Check if this is an update without a new file
        proof_file = request.files.get('proof')
        existing_proof_image = request.form.get('existingProofImage')

        # Validate: must have either a new file or existing proof image
        if not proof_file and not existing_proof_image:
            return jsonify({'error': '인증 이미지를 업로드해주세요'}), 400

        # If new file provided, validate it
        if proof_file:
            if proof_file.filename == '':
                return jsonify({'error': '파일이 선택되지 않았습니다'}), 400

            if not allowed_file(proof_file.filename):
                return jsonify({'error': '지원하지 않는 파일 형식입니다. PNG, JPG, JPEG, GIF, WEBP 파일만 업로드 가능합니다'}), 400

        # Get form data
        username = request.form.get('username')
        pin = request.form.get('pin')
        song_id = request.form.get('songId')
        stream_count = request.form.get('streamCount')

        if not all([username, pin, song_id, stream_count]):
            return jsonify({'error': '모든 필수 항목을 입력해주세요 (닉네임, PIN, 곡, 스트리밍 횟수)'}), 400

        # Validate PIN format (4 digits)
        if not pin.isdigit() or len(pin) != 4:
            return jsonify({'error': 'PIN은 정확히 4자리 숫자여야 합니다'}), 400

        # Validate song_id and stream count
        try:
            song_id = int(song_id)
            stream_count = int(stream_count)
            if stream_count <= 0:
                raise ValueError()
        except ValueError:
            return jsonify({'error': '잘못된 곡 ID 또는 스트리밍 횟수입니다'}), 400

        # Check if song exists
        song = Song.query.get(song_id)
        if not song:
            return jsonify({'error': '해당 곡을 찾을 수 없습니다'}), 404

        # Get or create user with PIN
        user = User.query.filter_by(username=username).first()
        if user:
            # User exists - verify PIN
            if not user.verify_pin(pin):
                return jsonify({'error': '이 닉네임의 PIN이 일치하지 않습니다'}), 401
        else:
            # Create new user with PIN
            user = User(username=username, pin_hash=User.hash_pin(pin))
            db.session.add(user)
            db.session.flush()

        # Check if verification already exists for this user and song
        verification = Verification.query.filter_by(
            user_id=user.id,
            song_id=song_id
        ).first()

        # Save new proof image if provided, otherwise keep existing
        if proof_file:
            filename = secure_filename(proof_file.filename)
            timestamp = kst_now().strftime('%Y%m%d_%H%M%S')
            filename = f"{user.id}_{song_id}_{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            proof_file.save(filepath)
        elif existing_proof_image:
            # Keep existing filename
            filename = existing_proof_image
        else:
            # This shouldn't happen due to earlier validation
            return jsonify({'error': '인증 이미지를 업로드해주세요'}), 400

        if verification:
            # Update existing verification
            verification.stream_count = stream_count
            verification.proof_image = filename
            verification.verified_at = kst_now()
            verification.updated_at = kst_now()
            message = '스트리밍 인증이 업데이트되었습니다!'
        else:
            # Create new verification
            verification = Verification(
                user_id=user.id,
                song_id=song_id,
                stream_count=stream_count,
                proof_image=filename,
                status='approved',
                verified_at=kst_now()
            )
            db.session.add(verification)
            message = '스트리밍 인증이 성공적으로 제출되었습니다!'

        db.session.commit()

        return jsonify({
            'message': message,
            'verification': verification.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'서버 오류가 발생했습니다: {str(e)}'}), 500


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
        verification.verified_at = kst_now()
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


@app.route('/api/users/id/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    """Get user profile by ID with their verifications"""
    try:
        user = User.query.get_or_404(user_id)

        # Get all approved verifications with song details
        verifications_data = db.session.query(
            Verification,
            Song
        ).join(Song, Verification.song_id == Song.id) \
         .filter(Verification.user_id == user_id) \
         .filter(Verification.status == 'approved') \
         .order_by(Verification.stream_count.desc()) \
         .all()

        verifications = []
        for verification, song in verifications_data:
            verifications.append({
                'id': verification.id,
                'songId': song.id,
                'songTitle': song.title,
                'streamCount': verification.stream_count,
                'proofImage': verification.proof_image,
                'status': verification.status,
                'verifiedAt': verification.verified_at.isoformat() if verification.verified_at else None,
                'createdAt': verification.created_at.isoformat() if verification.created_at else None
            })

        total_streams = sum(v['streamCount'] for v in verifications)

        return jsonify({
            'id': user.id,
            'username': user.username,
            'verifications': verifications,
            'totalStreams': total_streams
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
