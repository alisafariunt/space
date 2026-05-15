import {
    db,
    bcrypt,
    jwt,
    JWT_SECRET,
    initializeDatabase,
    generateAccessToken,
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
        if (!refreshToken) {
            return res.status(401).json({
                error: 'NO_REFRESH_TOKEN',
                message: 'Refresh token not found'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch (_) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                error: 'INVALID_TOKEN',
                message: 'Invalid or expired refresh token'
            });
        }

        const { userId, tokenId } = decoded;

        const tokenResult = await db.execute({
            sql: `SELECT id, token_hash FROM refresh_tokens
                  WHERE id = ? AND user_id = ? AND expires_at > datetime('now')`,
            args: [tokenId, userId]
        });

        if (tokenResult.rows.length === 0) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                error: 'TOKEN_REVOKED',
                message: 'Refresh token has been revoked or expired'
            });
        }

        const isValid = await bcrypt.compare(refreshToken, tokenResult.rows[0].token_hash);
        if (!isValid) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                error: 'INVALID_TOKEN',
                message: 'Invalid refresh token'
            });
        }

        const accessToken = generateAccessToken(userId);

        return res.status(200).json({
            accessToken,
            user: { id: userId, username: userId }
        });

    } catch (error) {
        console.error('[Refresh Error]', error);
        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An error occurred while refreshing token'
        });
    }
}
