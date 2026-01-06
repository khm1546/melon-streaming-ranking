-- NMIXX Streaming Ranking Database Schema
-- PostgreSQL DDL

-- Drop existing tables if they exist
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs table
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    album VARCHAR(100) NOT NULL,
    release_date DATE NOT NULL,
    cover_image VARCHAR(255),
    total_stream_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifications table (streaming proofs)
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    stream_count INTEGER NOT NULL CHECK (stream_count > 0),
    proof_image VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, song_id)
);

-- Indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_verifications_user_id ON verifications(user_id);
CREATE INDEX idx_verifications_song_id ON verifications(song_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_created_at ON verifications(created_at DESC);
CREATE INDEX idx_songs_title ON songs(title);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifications_updated_at BEFORE UPDATE ON verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update song total stream count
CREATE OR REPLACE FUNCTION update_song_stream_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE songs
        SET total_stream_count = total_stream_count + NEW.stream_count
        WHERE id = NEW.song_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE songs
            SET total_stream_count = total_stream_count + NEW.stream_count
            WHERE id = NEW.song_id;
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
            UPDATE songs
            SET total_stream_count = total_stream_count - OLD.stream_count
            WHERE id = NEW.song_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE songs
        SET total_stream_count = total_stream_count - OLD.stream_count
        WHERE id = OLD.song_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to maintain song stream counts
CREATE TRIGGER update_song_count_on_verification
AFTER INSERT OR UPDATE OR DELETE ON verifications
FOR EACH ROW EXECUTE FUNCTION update_song_stream_count();

-- Insert sample NMIXX songs
INSERT INTO songs (title, album, release_date, cover_image) VALUES
('O.O', 'AD MARE', '2022-02-22', 'https://via.placeholder.com/300x300/ff006e/ffffff?text=O.O'),
('DICE', 'ENTWURF', '2022-09-19', 'https://via.placeholder.com/300x300/8338ec/ffffff?text=DICE'),
('Love Me Like This', 'expérgo', '2023-03-20', 'https://via.placeholder.com/300x300/00f5ff/000000?text=LMLT'),
('Roller Coaster', 'expérgo', '2023-03-20', 'https://via.placeholder.com/300x300/ffbe0b/000000?text=RC'),
('Party O''Clock', 'expérgo', '2023-03-20', 'https://via.placeholder.com/300x300/06ffa5/000000?text=POC'),
('TANK', 'Fe3O4: STICK OUT', '2023-08-28', 'https://via.placeholder.com/300x300/ff006e/ffffff?text=TANK'),
('Young, Dumb, Stupid', 'Fe3O4: STICK OUT', '2023-08-28', 'https://via.placeholder.com/300x300/8338ec/ffffff?text=YDS'),
('Run For Roses', 'Fe3O4: STICK OUT', '2023-08-28', 'https://via.placeholder.com/300x300/00f5ff/000000?text=RFR'),
('Dash', 'Fe3O4: BREAK', '2024-01-15', 'https://via.placeholder.com/300x300/ffbe0b/000000?text=DASH'),
('Soñar (Breaker)', 'Fe3O4: BREAK', '2024-01-15', 'https://via.placeholder.com/300x300/06ffa5/000000?text=SONAR');

-- Insert sample users for testing
-- PIN: 1234 for all test users (hashed with sha256)
INSERT INTO users (username, pin_hash) VALUES
('NSWER_Supreme', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
('StreamQueen', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
('NMIXX_Forever', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
('MixItUp', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'),
('StreamMaster', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');

-- Insert sample verifications for testing
INSERT INTO verifications (user_id, song_id, stream_count, proof_image, status, verified_at) VALUES
(1, 3, 15234, '/uploads/proof1.jpg', 'approved', CURRENT_TIMESTAMP),
(2, 1, 12456, '/uploads/proof2.jpg', 'approved', CURRENT_TIMESTAMP),
(3, 2, 11234, '/uploads/proof3.jpg', 'approved', CURRENT_TIMESTAMP),
(4, 6, 9876, '/uploads/proof4.jpg', 'approved', CURRENT_TIMESTAMP),
(5, 3, 8765, '/uploads/proof5.jpg', 'approved', CURRENT_TIMESTAMP),
(1, 1, 7654, '/uploads/proof6.jpg', 'pending', NULL),
(2, 4, 6543, '/uploads/proof7.jpg', 'approved', CURRENT_TIMESTAMP);

-- View for leaderboard (all time)
CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
    ROW_NUMBER() OVER (ORDER BY v.stream_count DESC, v.created_at ASC) as rank,
    v.id,
    u.username,
    u.profile_image,
    s.title as song_title,
    s.id as song_id,
    v.stream_count,
    v.verified_at,
    v.created_at
FROM verifications v
JOIN users u ON v.user_id = u.id
JOIN songs s ON v.song_id = s.id
WHERE v.status = 'approved'
ORDER BY v.stream_count DESC, v.created_at ASC;

-- View for leaderboard (today)
CREATE OR REPLACE VIEW leaderboard_today AS
SELECT
    ROW_NUMBER() OVER (ORDER BY v.stream_count DESC, v.created_at ASC) as rank,
    v.id,
    u.username,
    u.profile_image,
    s.title as song_title,
    s.id as song_id,
    v.stream_count,
    v.verified_at,
    v.created_at
FROM verifications v
JOIN users u ON v.user_id = u.id
JOIN songs s ON v.song_id = s.id
WHERE v.status = 'approved'
    AND DATE(v.created_at) = CURRENT_DATE
ORDER BY v.stream_count DESC, v.created_at ASC;

-- View for leaderboard (this week)
CREATE OR REPLACE VIEW leaderboard_week AS
SELECT
    ROW_NUMBER() OVER (ORDER BY v.stream_count DESC, v.created_at ASC) as rank,
    v.id,
    u.username,
    u.profile_image,
    s.title as song_title,
    s.id as song_id,
    v.stream_count,
    v.verified_at,
    v.created_at
FROM verifications v
JOIN users u ON v.user_id = u.id
JOIN songs s ON v.song_id = s.id
WHERE v.status = 'approved'
    AND v.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY v.stream_count DESC, v.created_at ASC;

-- View for leaderboard (this month)
CREATE OR REPLACE VIEW leaderboard_month AS
SELECT
    ROW_NUMBER() OVER (ORDER BY v.stream_count DESC, v.created_at ASC) as rank,
    v.id,
    u.username,
    u.profile_image,
    s.title as song_title,
    s.id as song_id,
    v.stream_count,
    v.verified_at,
    v.created_at
FROM verifications v
JOIN users u ON v.user_id = u.id
JOIN songs s ON v.song_id = s.id
WHERE v.status = 'approved'
    AND v.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY v.stream_count DESC, v.created_at ASC;

-- View for song statistics
CREATE OR REPLACE VIEW song_statistics AS
SELECT
    s.id,
    s.title,
    s.album,
    s.release_date,
    s.cover_image,
    s.total_stream_count,
    COUNT(v.id) as verification_count,
    COUNT(DISTINCT v.user_id) as unique_streamers
FROM songs s
LEFT JOIN verifications v ON s.id = v.song_id AND v.status = 'approved'
GROUP BY s.id, s.title, s.album, s.release_date, s.cover_image, s.total_stream_count
ORDER BY s.total_stream_count DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
