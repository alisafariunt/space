import {
    db,
    initializeDatabase,
    generateAccessToken,
    getRefreshTokenFromCookie,
    clearRefreshTokenCookie,
    getCorsHeaders,
    jwt,
    JWT_SECRET,
    bcrypt
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
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                error: 'INVALID_TOKEN',
                message: 'Invalid or expired refresh token'
            });
        }

        const { userId, tokenId } = decoded;

        // Verify token exists in database and is not expired
        const tokenResult = await db.execute({
            sql: `SELECT id, token_hash, expires_at FROM refresh_tokens
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

        // Verify token hash matches
        const storedHash = tokenResult.rows[0].token_hash;
        const isValid = await bcrypt.compare(refreshToken, storedHash);

        if (!isValid) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({
                error: 'INVALID_TOKEN',
                message: 'Invalid refresh token'
            });
        }

        // Generate new access token
        const accessToken = generateAccessToken(userId);

        // Return new access token
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
