import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const JWT_SECRET = process.env.JWT_SECRET || 'study-guide-secret-key-2024';

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

        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, JWT_SECRET);
                const { tokenId } = decoded;

                // Delete refresh token from database
                await db.execute({
                    sql: `DELETE FROM refresh_tokens WHERE id = ?`,
                    args: [tokenId]
                });
            } catch (error) {
                // Token invalid or expired, just clear cookie
            }
        }

        // Clear refresh token cookie
        res.setHeader('Set-Cookie', 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth');

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('[Logout Error]', error);

        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An error occurred during logout'
        });
    }
}
