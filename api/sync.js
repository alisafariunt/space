import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

// Create Turso client
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'study-guide-secret-key-2024';

// Rate limiting (in-memory, upgrade to Redis for production)
const requestCounts = new Map();

// Initialize database tables
async function initializeDatabase() {
    await db.batch([
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            device_id TEXT UNIQUE,
            email TEXT,
            password_hash TEXT,
            password_reset_required INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_sync DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS highlights (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            page_id TEXT NOT NULL,
            text TEXT NOT NULL,
            color TEXT NOT NULL,
            element_path TEXT,
            start_offset INTEGER,
            end_offset INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            deleted_at DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            page_id TEXT NOT NULL,
            section_id TEXT,
            title TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            page_id TEXT NOT NULL,
            element_path TEXT,
            selected_text TEXT,
            note_content TEXT NOT NULL,
            color TEXT DEFAULT 'yellow',
            highlight_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            deleted_at DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT PRIMARY KEY,
            tts_speed REAL DEFAULT 1.0,
            tts_volume REAL DEFAULT 0.8,
            tts_voice TEXT,
            tts_autoscroll INTEGER DEFAULT 1,
            theme TEXT DEFAULT 'light',
            updated_at DATETIME
        )`,
        `CREATE INDEX IF NOT EXISTS idx_highlights_user_course ON highlights(user_id, course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_highlights_user_deleted ON highlights(user_id, deleted_at)`,
        `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_course ON bookmarks(user_id, course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_deleted ON bookmarks(user_id, deleted_at)`,
        `CREATE INDEX IF NOT EXISTS idx_notes_user_course ON notes(user_id, course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_notes_user_deleted ON notes(user_id, deleted_at)`
    ]);
}

// CORS configuration
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

    // Default headers for non-matching origins
    return {
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

// JWT verification middleware
function verifyAccessToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('MISSING_TOKEN');
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.userId;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('TOKEN_EXPIRED');
        }
        throw new Error('INVALID_TOKEN');
    }
}

// Rate limiting function
function rateLimit(userId) {
    const limit = parseInt(process.env.RATE_LIMIT_MAX || '60');
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
    const now = Date.now();

    const userRequests = requestCounts.get(userId) || [];

    // Clean old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= limit) {
        throw new Error('RATE_LIMIT_EXCEEDED');
    }

    recentRequests.push(now);
    requestCounts.set(userId, recentRequests);

    return true;
}

// Clean up rate limit map periodically
setInterval(() => {
    const now = Date.now();
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');

    for (const [userId, requests] of requestCounts.entries()) {
        const recent = requests.filter(time => now - time < windowMs);
        if (recent.length === 0) {
            requestCounts.delete(userId);
        } else {
            requestCounts.set(userId, recent);
        }
    }
}, 60000); // Clean every minute

export default async function handler(req, res) {
    // Get CORS headers
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.status(200).json({ ok: true });
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    try {
        // Ensure tables exist
        await initializeDatabase();

        // Migration: Add auth columns if missing
        try {
            await db.execute("ALTER TABLE users ADD COLUMN password_hash TEXT");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE users ADD COLUMN password_reset_required INTEGER DEFAULT 1");
        } catch (e) {
            // Column likely exists
        }

        // Migration: Add highlight_id column to notes if missing
        try {
            await db.execute("ALTER TABLE notes ADD COLUMN highlight_id TEXT");
        } catch (e) {
            // Column likely exists
        }
        // Migration: Add highlight offsets if missing
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN start_offset INTEGER");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN end_offset INTEGER");
        } catch (e) {
            // Column likely exists
        }

        const { method } = req;

        // Verify JWT and extract userId
        let userId;
        try {
            userId = verifyAccessToken(req);
        } catch (error) {
            if (error.message === 'MISSING_TOKEN') {
                return res.status(401).json({ error: 'Authentication required' });
            }
            if (error.message === 'TOKEN_EXPIRED') {
                return res.status(401).json({ error: 'Token expired' });
            }
            if (error.message === 'INVALID_TOKEN') {
                return res.status(401).json({ error: 'Invalid token' });
            }
            throw error;
        }

        // Apply rate limiting
        try {
            rateLimit(userId);
        } catch (error) {
            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                return res.status(429).json({ error: 'Too many requests. Please try again later.' });
            }
            throw error;
        }

        if (method === 'GET') {
            // Fetch user data (userId already extracted from JWT)
            const { since, courseId } = req.query;

            // Fetch highlights
            let highlightsQuery = `SELECT * FROM highlights WHERE user_id = ?`;
            const highlightsArgs = [userId];

            if (courseId) {
                highlightsQuery += ` AND course_id = ?`;
                highlightsArgs.push(courseId);
            }
            if (since) {
                highlightsQuery += ` AND (updated_at > ? OR created_at > ? OR deleted_at > ?)`;
                highlightsArgs.push(since, since, since);
            } else {
                highlightsQuery += ` AND deleted_at IS NULL`;
            }

            const highlights = await db.execute({ sql: highlightsQuery, args: highlightsArgs });

            // Fetch bookmarks
            let bookmarksQuery = `SELECT * FROM bookmarks WHERE user_id = ?`;
            const bookmarksArgs = [userId];

            if (courseId) {
                bookmarksQuery += ` AND course_id = ?`;
                bookmarksArgs.push(courseId);
            }
            if (since) {
                bookmarksQuery += ` AND (created_at > ? OR deleted_at > ?)`;
                bookmarksArgs.push(since, since);
            } else {
                bookmarksQuery += ` AND deleted_at IS NULL`;
            }

            const bookmarks = await db.execute({ sql: bookmarksQuery, args: bookmarksArgs });

            // Fetch notes
            let notesQuery = `SELECT * FROM notes WHERE user_id = ?`;
            const notesArgs = [userId];

            if (courseId) {
                notesQuery += ` AND course_id = ?`;
                notesArgs.push(courseId);
            }
            if (since) {
                notesQuery += ` AND (updated_at > ? OR created_at > ? OR deleted_at > ?)`;
                notesArgs.push(since, since, since);
            } else {
                notesQuery += ` AND deleted_at IS NULL`;
            }

            const notes = await db.execute({ sql: notesQuery, args: notesArgs });

            // Fetch preferences
            const preferences = await db.execute({
                sql: `SELECT * FROM preferences WHERE user_id = ?`,
                args: [userId]
            });

            // Update last sync
            await db.execute({
                sql: `UPDATE users SET last_sync = datetime('now') WHERE id = ?`,
                args: [userId]
            });

            return res.status(200).json({
                highlights: highlights.rows,
                bookmarks: bookmarks.rows,
                notes: notes.rows,
                preferences: preferences.rows[0] || null,
                serverTime: new Date().toISOString()
            });

        } else if (method === 'POST') {
            // Push changes (userId already extracted from JWT)
            const { changes } = req.body;

            const results = { created: 0, updated: 0, deleted: 0 };

            // Helper to handle undefined values
            const val = (v) => v === undefined ? null : v;

            // Process highlights
            if (changes?.highlights) {
                // Created/Updated
                for (const h of changes.highlights.upsert || []) {
                    await db.execute({
                        sql: `INSERT OR REPLACE INTO highlights 
                              (id, user_id, course_id, page_id, text, color, element_path, start_offset, end_offset, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [
                            val(h.id),
                            userId,
                            val(h.courseId),
                            val(h.pageId),
                            val(h.text),
                            val(h.color),
                            val(h.elementPath),
                            val(h.startOffset),
                            val(h.endOffset),
                            val(h.createdAt)
                        ]
                    });
                    results.created++;
                }
                // Deleted (soft delete)
                for (const id of changes.highlights.deleted || []) {
                    await db.execute({
                        sql: `UPDATE highlights SET deleted_at = datetime('now') WHERE id = ? AND user_id = ?`,
                        args: [id, userId]
                    });
                    results.deleted++;
                }
            }

            // Process bookmarks
            if (changes?.bookmarks) {
                for (const b of changes.bookmarks.upsert || []) {
                    await db.execute({
                        sql: `INSERT OR REPLACE INTO bookmarks 
                              (id, user_id, course_id, page_id, section_id, title, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        args: [val(b.id), userId, val(b.courseId), val(b.pageId), val(b.sectionId), val(b.title), val(b.createdAt)]
                    });
                    results.created++;
                }
                for (const id of changes.bookmarks.deleted || []) {
                    await db.execute({
                        sql: `UPDATE bookmarks SET deleted_at = datetime('now') WHERE id = ? AND user_id = ?`,
                        args: [id, userId]
                    });
                    results.deleted++;
                }
            }

            // Process notes
            if (changes?.notes) {
                for (const n of changes.notes.upsert || []) {
                    await db.execute({
                        sql: `INSERT OR REPLACE INTO notes
                              (id, user_id, course_id, page_id, element_path, selected_text, note_content, color, created_at, updated_at, highlight_id)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
                        args: [val(n.id), userId, val(n.courseId), val(n.pageId), val(n.elementPath), val(n.selectedText), val(n.noteContent), val(n.color), val(n.createdAt), val(n.highlightId)]
                    });
                    results.created++;
                }
                for (const id of changes.notes.deleted || []) {
                    await db.execute({
                        sql: `UPDATE notes SET deleted_at = datetime('now') WHERE id = ? AND user_id = ?`,
                        args: [id, userId]
                    });
                    results.deleted++;
                }
            }

            // Process preferences
            if (changes?.preferences) {
                const p = changes.preferences;
                await db.execute({
                    sql: `INSERT OR REPLACE INTO preferences 
                          (user_id, tts_speed, tts_volume, tts_voice, tts_autoscroll, theme, updated_at)
                          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
                    args: [userId, p.ttsSpeed, p.ttsVolume, p.ttsVoice, p.ttsAutoscroll ? 1 : 0, p.theme]
                });
            }

            // Update last sync
            await db.execute({
                sql: `UPDATE users SET last_sync = datetime('now') WHERE id = ?`,
                args: [userId]
            });

            return res.status(200).json({
                success: true,
                results,
                serverTime: new Date().toISOString()
            });

        } else if (method === 'DELETE') {
            // Hard delete all data for the authenticated user (for testing/reset)
            const requestedUserId = Array.isArray(req.query.userId)
                ? req.query.userId[0]
                : req.query.userId;

            if (requestedUserId && requestedUserId !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            await db.batch([
                { sql: `DELETE FROM highlights WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM bookmarks WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM notes WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM preferences WHERE user_id = ?`, args: [userId] },
            ]);

            return res.status(200).json({ success: true, message: 'All user data deleted' });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Sync API Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
