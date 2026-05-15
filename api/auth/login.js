import {
    db,
    bcrypt,
    randomUUID,
    BCRYPT_ROUNDS,
    JWT_REFRESH_EXPIRY,
    parseExpiry,
    initializeDatabase,
    validateUsername,
    validatePassword,
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    setRefreshTokenCookie,
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

        const { username, password } = req.body || {};

        try {
            validateUsername(username);
            validatePassword(password);
        } catch (err) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: err.message,
            });
        }

        const userResult = await db.execute({
            sql: `SELECT id, password_hash FROM users WHERE id = ?`,
            args: [username]
        });

        const user = userResult.rows[0];

        if (user && user.password_hash) {
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({
                    error: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password'
                });
            }
        } else {
            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            await db.execute({
                sql: `INSERT INTO users (id, device_id, password_hash, password_reset_required, created_at)
                      VALUES (?, ?, ?, 0, datetime('now'))`,
                args: [username, username, passwordHash]
            });
        }

        const accessToken = generateAccessToken(username);
        const tokenId = randomUUID();
        const refreshToken = generateRefreshToken(username, tokenId);
        const tokenHashed = await hashToken(refreshToken);
        const expiryMs = parseExpiry(JWT_REFRESH_EXPIRY);
        const expiresAt = new Date(Date.now() + expiryMs).toISOString();

        await db.execute({
            sql: `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
                  VALUES (?, ?, ?, ?, datetime('now'))`,
            args: [tokenId, username, tokenHashed, expiresAt]
        });

        setRefreshTokenCookie(res, refreshToken);

        return res.status(200).json({
            accessToken,
            user: { id: username, username }
        });

    } catch (error) {
        console.error('[Login Error]', error);
        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An error occurred during login'
        });
    }
}
