import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
    // Configuration
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '30m';
    const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

    // CORS headers
    function getCorsHeaders(req) {
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

        return {
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        const corsHeaders = getCorsHeaders(req);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.status(200).json({ ok: true });
    }

    // Set CORS headers
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method is allowed'
        });
    }

    try {
        // Create Turso client
        const db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // Initialize database tables
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

        const { username, password } = req.body;

        // Simple validation
        if (!username || username.length < 3) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Username must be at least 3 characters'
            });
        }

        if (!password || password.length < 3) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Password must be at least 3 characters'
            });
        }

        // Check if user exists
        const userResult = await db.execute({
            sql: `SELECT id, password_hash FROM users WHERE id = ?`,
            args: [username]
        });

        const user = userResult.rows[0];

        if (user && user.password_hash) {
            // Existing user - verify password
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return res.status(401).json({
                    error: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password'
                });
            }
        } else {
            // New user - create account
            const passwordHash = await bcrypt.hash(password, 10);

            await db.execute({
                sql: `INSERT INTO users (id, device_id, password_hash, password_reset_required, created_at)
                      VALUES (?, ?, ?, 0, datetime('now'))`,
                args: [username, username, passwordHash]
            });
        }

        // Generate tokens
        const accessToken = jwt.sign({ userId: username }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
        const tokenId = randomUUID();
        const refreshToken = jwt.sign({ userId: username, tokenId }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

        // Store refresh token
        const tokenHash = await bcrypt.hash(refreshToken, 10);
        const expiryMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        const expiresAt = new Date(Date.now() + expiryMs).toISOString();

        await db.execute({
            sql: `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
                  VALUES (?, ?, ?, ?, datetime('now'))`,
            args: [tokenId, username, tokenHash, expiresAt]
        });

        // Set refresh token cookie
        const maxAge = Math.floor(expiryMs / 1000);
        res.setHeader('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/api/auth`);

        // Return access token
        return res.status(200).json({
            accessToken,
            user: {
                id: username,
                username
            }
        });

    } catch (error) {
        console.error('[Login Error]', error);
        console.error('[Login Error Stack]', error.stack);
        console.error('[Login Error - ENV Check]', {
            hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
            hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
            hasJwtSecret: !!process.env.JWT_SECRET
        });

        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An error occurred during login',
            details: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
    }
}
