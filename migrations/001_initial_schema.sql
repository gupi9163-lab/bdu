-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    degree VARCHAR(50) NOT NULL,
    course INTEGER NOT NULL,
    avatar INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session table for express-session
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

-- Faculties table (16 fakultə)
CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    building VARCHAR(50) NOT NULL
);

-- Insert faculties
INSERT INTO faculties (name, building) VALUES
('Mexanika-riyaziyyat fakültəsi', '3'),
('Tətbiqi riyaziyyat və kibernetika fakültəsi', '3'),
('Fizika fakültəsi', 'əsas'),
('Kimya fakültəsi', 'əsas'),
('Biologiya fakültəsi', 'əsas'),
('Ekologiya və torpaqşünaslıq fakültəsi', 'əsas'),
('Coğrafiya fakültəsi', 'əsas'),
('Geologiya fakültəsi', 'əsas'),
('Filologiya fakültəsi', '1'),
('Tarix fakültəsi', '3'),
('Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi', '1'),
('Hüquq fakültəsi', '1'),
('Jurnalistika fakültəsi', '2'),
('İnformasiya və sənəd menecmenti fakültəsi', '2'),
('Şərqşünaslıq fakültəsi', '2'),
('Sosial elmlər və psixologiya fakültəsi', '2')
ON CONFLICT (name) DO NOTHING;

-- Chat rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES faculties(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table (group chat)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES chat_rooms(id),
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Private messages table
CREATE TABLE IF NOT EXISTS private_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER REFERENCES users(id),
    blocked_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_id, blocked_id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id),
    reported_id INTEGER REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES
('rules', ''),
('about', ''),
('topic_of_day', ''),
('filter_words', ''),
('group_message_expiry_minutes', '0'),
('private_message_expiry_minutes', '0')
ON CONFLICT (setting_key) DO NOTHING;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_super BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert super admin
INSERT INTO admins (username, password, is_super) 
VALUES ('618ursamajor618major', '$2a$10$rdMcj10ckR2Lg9DA5lGk4udYMrxgY2YoWjUlavDdtBwd.pbq9Vypi', true)
ON CONFLICT (username) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created ON private_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
