import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Create Turso client
export const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'study-guide-secret-key-2024';
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '30m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';
export const BCRYPT_ROUNDS = 10;

// Parse expiry time to milliseconds
export function parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 60 * 1000; // default 30 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return value * multipliers[unit];
}

// Initialize database tables
export async function initializeDatabase() {
    // Create users table if not exists (with new auth columns)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            device_id TEXT UNIQUE,
            email TEXT,
            password_hash TEXT,
            password_reset_required INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_sync DATETIME
        )
    `);

    // Create refresh tokens table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Create indexes for performance
    try {
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)`);
    } catch (e) {
        // Indexes might already exist
    }

    // Migration: Add password columns if missing
    try {
        await db.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
    } catch (e) {
        // Column likely exists
    }

    try {
        await db.execute("ALTER TABLE users ADD COLUMN password_reset_required INTEGER DEFAULT 1");
    } catch (e) {
        // Column likely exists
    }
}

// Validation functions
export function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        throw new Error('Username is required');
    }
    if (username.length < 3 || username.length > 50) {
        throw new Error('Username must be 3-50 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
    }
    return true;
}

export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password is required');
    }
    if (password.length < 3) {
        throw new Error('Password must be at least 3 characters');
    }
    return true;
}

// Generate JWT access token
export function generateAccessToken(userId) {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRY }
    );
}

// Generate refresh token
export function generateRefreshToken(userId, tokenId) {
    return jwt.sign(
        { userId, tokenId },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY }
    );
}

// Hash refresh token for storage
export async function hashToken(token) {
    return bcrypt.hash(token, BCRYPT_ROUNDS);
}

// CORS headers
export function getCorsHeaders(req) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || 'https://alisafari.space,https://www.alisafari.space').split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        };
    }

    // Default headers for non-matching origins (will be blocked by browser)
    return {
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// Set refresh token cookie
export function setRefreshTokenCookie(res, refreshToken) {
    const expiryMs = parseExpiry(JWT_REFRESH_EXPIRY);
    const maxAge = Math.floor(expiryMs / 1000); // Convert to seconds

    const isProduction = process.env.NODE_ENV === 'production';
    const attrs = ['HttpOnly', 'SameSite=Lax', 'Path=/', `Max-Age=${maxAge}`];
    if (isProduction) {
        attrs.push('Secure', 'Domain=alisafari.space');
    }

    res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; ${attrs.join('; ')}`);
}

// Clear refresh token cookie
export function clearRefreshTokenCookie(res) {
    const isProduction = process.env.NODE_ENV === 'production';
    const attrs = ['HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0'];
    if (isProduction) {
        attrs.push('Secure', 'Domain=alisafari.space');
    }

    res.setHeader('Set-Cookie', `refreshToken=; ${attrs.join('; ')}`);
}

// Get refresh token from cookie
export function getRefreshTokenFromCookie(req) {
    const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
    return refreshTokenCookie?.split('=')[1];
}

// Clean expired refresh tokens
export async function cleanExpiredTokens() {
    await db.execute(`DELETE FROM refresh_tokens WHERE expires_at < datetime('now')`);
}

// Export bcrypt and other needed dependencies
export { bcrypt, jwt, randomUUID };
