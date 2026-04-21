-- Database schema for Bible App
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS bible_app;
USE bible_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Saved Verses table
CREATE TABLE IF NOT EXISTS saved_verses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book VARCHAR(100) NOT NULL,
  chapter INT NOT NULL,
  verse_number INT NOT NULL,
  verse_text TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_book_chapter (book, chapter)
);

-- Insert sample data (optional)
-- INSERT INTO saved_verses (user_id, book, chapter, verse_number, verse_text, note) VALUES
-- (1, 'John', 3, 16, 'For God so loved the world...', 'My favorite verse');
