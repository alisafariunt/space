import {
    db,
    initializeDatabase,
    validateUsername,
    validatePassword,
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    setRefreshTokenCookie,
    cleanExpiredTokens,
    getCorsHeaders,
    parseExpiry,
    JWT_REFRESH_EXPIRY,
    bcrypt,
    randomUUID
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

        const { username, password } = req.body;

        // Validate inputs
        validateUsername(username);
        validatePassword(password);

        // Check if user exists
        const userResult = await db.execute({
            sql: `SELECT id, password_hash, password_reset_required FROM users WHERE id = ?`,
            args: [username]
        });

        const user = userResult.rows[0];

        if (user) {
            // Existing user - verify password
            if (!user.password_hash) {
                // Legacy user without password - require password reset
                return res.status(403).json({
                    error: 'PASSWORD_RESET_REQUIRED',
                    message: 'This account requires a password reset. Please create a new password.'
                });
            }

            // Verify password
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
        const accessToken = generateAccessToken(username);
        const tokenId = randomUUID();
        const refreshToken = generateRefreshToken(username, tokenId);

        // Store refresh token in database
        const tokenHash = await hashToken(refreshToken);
        const expiryMs = parseExpiry(JWT_REFRESH_EXPIRY);
        const expiresAt = new Date(Date.now() + expiryMs).toISOString();

        await db.execute({
            sql: `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
                  VALUES (?, ?, ?, ?, datetime('now'))`,
            args: [tokenId, username, tokenHash, expiresAt]
        });

        // Set refresh token cookie
        setRefreshTokenCookie(res, refreshToken);

        // Clean up expired tokens (async, don't wait)
        cleanExpiredTokens().catch(console.error);

        // Return access token and user info
        return res.status(200).json({
            accessToken,
            user: {
                id: username,
                username
            }
        });

    } catch (error) {
        console.error('[Login Error]', error);

        // Handle validation errors
        if (error.message.includes('Username') || error.message.includes('Password')) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: error.message
            });
        }

        // Generic error
        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An error occurred during login'
        });
    }
}
