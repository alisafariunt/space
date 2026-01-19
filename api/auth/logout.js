import {
    db,
    initializeDatabase,
    getRefreshTokenFromCookie,
    clearRefreshTokenCookie,
    getCorsHeaders,
    jwt,
    JWT_SECRET
} from '../_lib/auth-core.js';

export default async function handler(req, res) {
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
        // Initialize database
        await initializeDatabase();

        const refreshToken = getRefreshTokenFromCookie(req);

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
        clearRefreshTokenCookie(res);

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
