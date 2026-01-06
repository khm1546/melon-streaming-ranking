from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import hashlib

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    pin_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    verifications = db.relationship('Verification', back_populates='user', cascade='all, delete-orphan')

    @staticmethod
    def hash_pin(pin):
        """Hash a PIN using SHA-256"""
        return hashlib.sha256(pin.encode()).hexdigest()

    def verify_pin(self, pin):
        """Verify a PIN against the stored hash"""
        return self.pin_hash == User.hash_pin(pin)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Song(db.Model):
    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    album = db.Column(db.String(100), nullable=False)
    release_date = db.Column(db.Date, nullable=False)
    cover_image = db.Column(db.String(255))
    total_stream_count = db.Column(db.BigInteger, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    verifications = db.relationship('Verification', back_populates='song', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'album': self.album,
            'releaseDate': self.release_date.isoformat() if self.release_date else None,
            'coverImage': self.cover_image,
            'streamCount': self.total_stream_count,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }


class Verification(db.Model):
    __tablename__ = 'verifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id', ondelete='CASCADE'), nullable=False)
    stream_count = db.Column(db.Integer, nullable=False)
    proof_image = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='pending')
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', back_populates='verifications')
    song = db.relationship('Song', back_populates='verifications')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'username': self.user.username if self.user else None,
            'songId': self.song_id,
            'songTitle': self.song.title if self.song else None,
            'streamCount': self.stream_count,
            'proofImage': self.proof_image,
            'status': self.status,
            'verifiedAt': self.verified_at.isoformat() if self.verified_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
