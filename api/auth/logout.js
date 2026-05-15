import {
    db,
    jwt,
    JWT_SECRET,
    initializeDatabase,
    getRefreshTokenFromCookie,
    clearRefreshTokenCookie,
    applyCors,
} from '../_lib/auth-core.js';

export default async function handler(req, res) {
    applyCors(req, res, 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'METHOD_NOT_ALLOWED',
            message: 'Only POST method is allowed'
        });
    }

    try {
        await initializeDatabase();

        const refreshToken = getRefreshTokenFromCookie(req);

        if (refreshToken) {
            try {
                const { tokenId } = jwt.verify(refreshToken, JWT_SECRET);
                await db.execute({
                    sql: `DELETE FROM refresh_tokens WHERE id = ?`,
                    args: [tokenId]
                });
            } catch (_) {
                // Token invalid or expired — clear cookie anyway.
            }
        }

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
