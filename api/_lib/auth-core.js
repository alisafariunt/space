import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Create Turso client
export const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Configuration — JWT_SECRET must be set in env. No fallback.
export const JWT_SECRET = (() => {
    const s = process.env.JWT_SECRET;
    if (!s || s.length < 32) {
        throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters');
    }
    return s;
})();
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '30m';
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';
export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.alisafari.space';
const ANON_COOKIE_NAME = 'anonId';
const REFRESH_COOKIE_NAME = 'refreshToken';
const ANON_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

// Parse expiry time to milliseconds
export function parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    return value * multipliers[unit];
}

// Initialize database tables
export async function initializeDatabase() {
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

    try {
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
        await db.execute(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)`);
    } catch (e) {
        // Indexes might already exist
    }

    try {
        await db.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
    } catch (e) { /* column likely exists */ }

    try {
        await db.execute("ALTER TABLE users ADD COLUMN password_reset_required INTEGER DEFAULT 1");
    } catch (e) { /* column likely exists */ }
}

// Validation
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
    if (password.length < 12) {
        throw new Error('Password must be at least 12 characters');
    }
    if (password.length > 200) {
        throw new Error('Password must be at most 200 characters');
    }
    // Require at least three of: lowercase, uppercase, digit, symbol
    const classes = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^a-zA-Z0-9]/.test(password)
    ].filter(Boolean).length;
    if (classes < 3) {
        throw new Error('Password must contain at least three of: lowercase, uppercase, digits, symbols');
    }
    return true;
}

// Token generation
export function generateAccessToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

export function generateRefreshToken(userId, tokenId) {
    return jwt.sign({ userId, tokenId }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

export async function hashToken(token) {
    return bcrypt.hash(token, BCRYPT_ROUNDS);
}

// Auth errors
export class AuthError extends Error {
    constructor(code, status = 401) {
        super(code);
        this.code = code;
        this.status = status;
    }
}

// Verify access token from Authorization header. Throws AuthError on failure.
export function verifyAccessToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError('MISSING_TOKEN');
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        if (error.name === 'TokenExpiredError') throw new AuthError('TOKEN_EXPIRED');
        throw new AuthError('INVALID_TOKEN');
    }
}

// Strict auth — endpoints call this for authenticated-only operations.
export function requireAuth(req) {
    return verifyAccessToken(req);
}

// CORS — strict allowlist with trimmed origins.
export function getAllowedOrigins() {
    if (process.env.NODE_ENV === 'production') {
        return (process.env.ALLOWED_ORIGINS || 'https://alisafari.space,https://www.alisafari.space,https://flow.alisafari.space')
            .split(',')
            .map(o => o.trim())
            .filter(Boolean);
    }
    return ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'];
}

export function getCorsHeaders(req, methods = 'GET, POST, DELETE, OPTIONS') {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': methods,
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Vary': 'Origin',
        };
    }

    // Non-matching origin: do NOT echo the origin or set credentials.
    return {
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
    };
}

export function applyCors(req, res, methods) {
    const headers = getCorsHeaders(req, methods);
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return headers;
}

// ---------- Cookie helpers ----------

function buildCookie(name, value, { maxAge, isProduction = process.env.NODE_ENV === 'production', sameSite = 'Lax' } = {}) {
    const attrs = ['HttpOnly', `SameSite=${sameSite}`, 'Path=/'];
    if (typeof maxAge === 'number') attrs.push(`Max-Age=${maxAge}`);
    if (isProduction) {
        attrs.push('Secure');
        attrs.push(`Domain=${COOKIE_DOMAIN}`);
    }
    return `${name}=${value}; ${attrs.join('; ')}`;
}

function appendSetCookie(res, cookie) {
    const existing = res.getHeader('Set-Cookie');
    if (!existing) {
        res.setHeader('Set-Cookie', cookie);
    } else if (Array.isArray(existing)) {
        res.setHeader('Set-Cookie', [...existing, cookie]);
    } else {
        res.setHeader('Set-Cookie', [existing, cookie]);
    }
}

function getCookie(req, name) {
    const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
    const c = cookies.find(c => c.startsWith(`${name}=`));
    return c ? c.substring(name.length + 1) : null;
}

// Refresh token cookie
export function setRefreshTokenCookie(res, refreshToken) {
    const expiryMs = parseExpiry(JWT_REFRESH_EXPIRY);
    const maxAge = Math.floor(expiryMs / 1000);
    appendSetCookie(res, buildCookie(REFRESH_COOKIE_NAME, refreshToken, { maxAge }));
}

export function clearRefreshTokenCookie(res) {
    appendSetCookie(res, buildCookie(REFRESH_COOKIE_NAME, '', { maxAge: 0 }));
}

export function getRefreshTokenFromCookie(req) {
    return getCookie(req, REFRESH_COOKIE_NAME);
}

// Anonymous-session cookie — server-issued, httpOnly, scoped to apex.
function setAnonIdCookie(res, anonId) {
    appendSetCookie(res, buildCookie(ANON_COOKIE_NAME, anonId, { maxAge: ANON_COOKIE_MAX_AGE }));
}

export function getAnonIdFromCookie(req) {
    const v = getCookie(req, ANON_COOKIE_NAME);
    if (!v) return null;
    // Validate format to prevent cookie tampering causing weird IDs
    if (!/^anon_[A-Za-z0-9-]{8,}$/.test(v) && !/^anonymous_\d+_[a-z0-9]+$/.test(v)) {
        return null;
    }
    return v;
}

// Resolve userId for an endpoint that allows both authenticated and anonymous users.
// Authenticated: trust JWT.
// Anonymous: use the server-set httpOnly cookie. Issue one if missing.
// On first visit, accept a legacy `anonymous_…` ID from the client body/query for migration,
// then immediately bind it to the cookie. After that, the cookie is the only source of truth.
export function getOrCreateUserId(req, res) {
    try {
        const userId = verifyAccessToken(req);
        return { userId, authenticated: true };
    } catch (_) {
        // fall through to anonymous
    }

    let anonId = getAnonIdFromCookie(req);
    if (!anonId) {
        const claimed = (
            (req.query && req.query.userId) ||
            (req.body && req.body.userId) ||
            ''
        ).toString();
        if (/^anonymous_\d+_[a-z0-9]+$/.test(claimed)) {
            anonId = claimed; // one-time legacy migration
        } else {
            anonId = `anon_${randomUUID()}`;
        }
        setAnonIdCookie(res, anonId);
    }
    return { userId: anonId, authenticated: false };
}

export async function cleanExpiredTokens() {
    await db.execute(`DELETE FROM refresh_tokens WHERE expires_at < datetime('now')`);
}

export { bcrypt, jwt, randomUUID };
