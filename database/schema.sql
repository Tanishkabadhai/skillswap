CREATE DATABASE IF NOT EXISTS skillswap;
USE skillswap;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  bio TEXT,
  location VARCHAR(140),
  availability VARCHAR(140),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(140) NOT NULL,
  description TEXT,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_skills_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS exchange_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  skill_id INT NOT NULL,
  note TEXT,
  status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_skill FOREIGN KEY (skill_id) REFERENCES user_skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_request FOREIGN KEY (request_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  rated_user_id INT NOT NULL,
  score INT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_rating_per_reviewer (request_id, reviewer_id),
  CONSTRAINT fk_ratings_request FOREIGN KEY (request_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_id INT NOT NULL,
  reported_user_id INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status ENUM('open', 'reviewed', 'resolved') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reported FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL,
  favorite_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, favorite_user_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_target FOREIGN KEY (favorite_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  skill_topic VARCHAR(140) NOT NULL,
  current_level VARCHAR(80) NOT NULL,
  goal TEXT NOT NULL,
  roadmap_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_roadmaps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  request_id INT NULL,
  note_title VARCHAR(180) NOT NULL,
  note_body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_request FOREIGN KEY (request_id) REFERENCES exchange_requests(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS skill_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  portfolio_url VARCHAR(255) NOT NULL,
  proof_text TEXT,
  status ENUM('pending', 'reviewed', 'approved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_circles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  category_id INT NOT NULL,
  description TEXT,
  creator_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_circles_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_circles_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (circle_id, user_id),
  CONSTRAINT fk_circle_members_circle FOREIGN KEY (circle_id) REFERENCES learning_circles(id) ON DELETE CASCADE,
  CONSTRAINT fk_circle_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO categories (name, description) VALUES
('Programming', 'Web, mobile, and software development skills'),
('Design', 'UI, UX, graphics, and branding'),
('Languages', 'Spoken and written language exchange'),
('Music', 'Instruments, singing, and production'),
('Academics', 'School and university subjects')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Optional admin seed:
-- Replace the password hash with one generated by bcrypt if needed.
-- INSERT INTO users (name, email, password_hash, role, is_active)
-- VALUES ('Admin', 'admin@skillswap.com', '$2a$10$abcdefghijklmnopqrstuv', 'admin', 1);
