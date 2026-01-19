import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const JWT_SECRET = process.env.JWT_SECRET || 'study-guide-secret-key-2024';
    const JWT_ACCESS_EXPIRY = '30m';

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

    if (req.method === 'OPTIONS') {
        const corsHeaders = getCorsHeaders(req);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.status(200).json({ ok: true });
    }

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
        const db = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });

        // Get refresh token from cookie
        const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || [];
        const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
        const refreshToken = refreshTokenCookie?.split('=')[1];

        if (!refreshToken) {
            return res.status(401).json({
                error: 'NO_REFRESH_TOKEN',
                message: 'Refresh token not found'
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch (error) {
            res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
            return res.status(401).json({
                error: 'INVALID_TOKEN',
                message: 'Invalid or expired refresh token'
            });
        }

        const { userId, tokenId } = decoded;

        // Verify token exists in database
        const tokenResult = await db.execute({
            sql: `SELECT id, token_hash FROM refresh_tokens
                  WHERE id = ? AND user_id = ? AND expires_at > datetime('now')`,
            args: [tokenId, userId]
        });

        if (tokenResult.rows.length === 0) {
            res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
            return res.status(401).json({
                error: 'TOKEN_REVOKED',
                message: 'Refresh token has been revoked or expired'
            });
        }

        // Verify token hash
        const storedHash = tokenResult.rows[0].token_hash;
        const isValid = await bcrypt.compare(refreshToken, storedHash);

        if (!isValid) {
            res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');
            return res.status(401).json({
                error: 'INVALID_TOKEN',
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

        return res.status(200).json({
            accessToken
        });

    } catch (error) {
        console.error('[Refresh Error]', error);

        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An error occurred while refreshing token'
        });
    }
}
