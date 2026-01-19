import { createClient } from '@libsql/client';

// Create Turso client
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database tables
async function initializeDatabase() {
    await db.batch([
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            device_id TEXT UNIQUE,
            email TEXT,
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
        )`
    ]);
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).json({ ok: true });
        return;
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    try {
        // Ensure tables exist
        await initializeDatabase();

        const { method } = req;

        if (method === 'GET') {
            // Fetch user data
            const { userId, since, courseId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // Ensure user exists
            await db.execute({
                sql: `INSERT OR IGNORE INTO users (id, device_id, created_at) VALUES (?, ?, datetime('now'))`,
                args: [userId, userId]
            });

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
            // Push changes
            const { userId, changes } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // Ensure user exists
            await db.execute({
                sql: `INSERT OR IGNORE INTO users (id, device_id, created_at) VALUES (?, ?, datetime('now'))`,
                args: [userId, userId]
            });

            const results = { created: 0, updated: 0, deleted: 0 };

            // Helper to handle undefined values
            const val = (v) => v === undefined ? null : v;

            // Process highlights
            if (changes?.highlights) {
                // Created/Updated
                for (const h of changes.highlights.upsert || []) {
                    await db.execute({
                        sql: `INSERT OR REPLACE INTO highlights 
                              (id, user_id, course_id, page_id, text, color, element_path, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [val(h.id), userId, val(h.courseId), val(h.pageId), val(h.text), val(h.color), val(h.elementPath), val(h.createdAt)]
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
                              (id, user_id, course_id, page_id, element_path, selected_text, note_content, color, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [val(n.id), userId, val(n.courseId), val(n.pageId), val(n.elementPath), val(n.selectedText), val(n.noteContent), val(n.color), val(n.createdAt)]
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
            // Hard delete all user data (for testing/reset)
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
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
