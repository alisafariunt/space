-- ============================================
-- Authentication System Database Migration
-- ============================================
-- This script migrates the database to support JWT authentication
-- Run this BEFORE deploying the new authentication system

-- Step 1: Add new columns to users table
-- ============================================

-- Add password_hash column (replaces plaintext password)
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Add password_reset_required flag
-- All existing users will be marked for password reset
ALTER TABLE users ADD COLUMN password_reset_required INTEGER DEFAULT 1;

-- Step 2: Mark all existing users for password reset
-- ============================================

-- Force password reset for all existing users
-- They will need to set a new password on next login
UPDATE users SET password_reset_required = 1;

-- Step 3: Create refresh_tokens table
-- ============================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,                    -- UUID for the token
    user_id TEXT NOT NULL,                  -- Reference to users.id
    token_hash TEXT NOT NULL,               -- Hashed refresh token
    expires_at DATETIME NOT NULL,           -- Expiration timestamp
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Step 4: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
    ON refresh_tokens(expires_at);

-- Step 5: Clean up expired refresh tokens (maintenance)
-- ============================================

-- This should be run periodically (e.g., via cron job or scheduled function)
DELETE FROM refresh_tokens WHERE expires_at < datetime('now');

-- Step 6: Optional - Drop old plaintext password column
-- ============================================

-- WARNING: Only run this AFTER confirming the new auth system works
-- and all users have reset their passwords!

-- Uncomment the line below when ready:
-- ALTER TABLE users DROP COLUMN password;

-- ============================================
-- Migration Complete
-- ============================================

-- Verification queries:

-- 1. Check users table structure:
-- PRAGMA table_info(users);

-- 2. Check refresh_tokens table structure:
-- PRAGMA table_info(refresh_tokens);

-- 3. Count users requiring password reset:
-- SELECT COUNT(*) FROM users WHERE password_reset_required = 1;

-- 4. Check indexes:
-- SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='refresh_tokens';
