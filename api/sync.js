import { db, applyCors, getOrCreateUserId } from './_lib/auth-core.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

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
            sr_due_at DATETIME,
            sr_interval REAL,
            sr_ease REAL,
            sr_reps INTEGER,
            sr_last_reviewed DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            deleted_at DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS progress (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            page_id TEXT NOT NULL,
            last_percent INTEGER,
            time_spent_sec INTEGER,
            completed INTEGER,
            last_visited_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            deleted_at DATETIME
        )`,
        `CREATE TABLE IF NOT EXISTS daily_stats (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            course_id TEXT NOT NULL,
            stat_date TEXT NOT NULL,
            time_spent_sec INTEGER,
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
            updated_at DATETIME,
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
        `CREATE INDEX IF NOT EXISTS idx_progress_user_course ON progress(user_id, course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_progress_user_deleted ON progress(user_id, deleted_at)`,
        `CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, stat_date)`,
        `CREATE INDEX IF NOT EXISTS idx_daily_stats_user_deleted ON daily_stats(user_id, deleted_at)`,
        `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_course ON bookmarks(user_id, course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_deleted ON bookmarks(user_id, deleted_at)`,
        `CREATE INDEX IF NOT EXISTS idx_notes_user_course ON notes(user_id, course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_notes_user_deleted ON notes(user_id, deleted_at)`
    ]);
}

export default async function handler(req, res) {
    // Apply CORS (preflight + actual response).
    applyCors(req, res, 'GET, POST, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

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
        // Migration: Add updated_at to bookmarks if missing
        try {
            await db.execute("ALTER TABLE bookmarks ADD COLUMN updated_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        // Migration: Add updated_at to notes if missing
        try {
            await db.execute("ALTER TABLE notes ADD COLUMN updated_at DATETIME");
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
        // Migration: Add spaced repetition fields if missing
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN sr_due_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN sr_interval REAL");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN sr_ease REAL");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN sr_reps INTEGER");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE highlights ADD COLUMN sr_last_reviewed DATETIME");
        } catch (e) {
            // Column likely exists
        }
        // Migration: Add progress columns if missing
        try {
            await db.execute("ALTER TABLE progress ADD COLUMN last_percent INTEGER");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE progress ADD COLUMN time_spent_sec INTEGER");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE progress ADD COLUMN completed INTEGER");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE progress ADD COLUMN last_visited_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE progress ADD COLUMN updated_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE progress ADD COLUMN deleted_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        // Migration: Add daily stats columns if missing
        try {
            await db.execute("ALTER TABLE daily_stats ADD COLUMN course_id TEXT");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE daily_stats ADD COLUMN stat_date TEXT");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE daily_stats ADD COLUMN time_spent_sec INTEGER");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE daily_stats ADD COLUMN updated_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.execute("ALTER TABLE daily_stats ADD COLUMN deleted_at DATETIME");
        } catch (e) {
            // Column likely exists
        }
        try {
            await db.batch([
                `CREATE INDEX IF NOT EXISTS idx_highlights_user_updated ON highlights(user_id, updated_at)`,
                `CREATE INDEX IF NOT EXISTS idx_progress_user_updated ON progress(user_id, updated_at)`,
                `CREATE INDEX IF NOT EXISTS idx_daily_stats_user_updated ON daily_stats(user_id, updated_at)`,
                `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_updated ON bookmarks(user_id, updated_at)`,
                `CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at)`,
                `CREATE TRIGGER IF NOT EXISTS highlights_set_updated_at
                    AFTER UPDATE ON highlights
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at
                    BEGIN
                        UPDATE highlights SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS highlights_set_updated_at_insert
                    AFTER INSERT ON highlights
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL
                    BEGIN
                        UPDATE highlights SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS progress_set_updated_at
                    AFTER UPDATE ON progress
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at
                    BEGIN
                        UPDATE progress SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS progress_set_updated_at_insert
                    AFTER INSERT ON progress
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL
                    BEGIN
                        UPDATE progress SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS daily_stats_set_updated_at
                    AFTER UPDATE ON daily_stats
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at
                    BEGIN
                        UPDATE daily_stats SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS daily_stats_set_updated_at_insert
                    AFTER INSERT ON daily_stats
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL
                    BEGIN
                        UPDATE daily_stats SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS bookmarks_set_updated_at
                    AFTER UPDATE ON bookmarks
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at
                    BEGIN
                        UPDATE bookmarks SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS bookmarks_set_updated_at_insert
                    AFTER INSERT ON bookmarks
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL
                    BEGIN
                        UPDATE bookmarks SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS notes_set_updated_at
                    AFTER UPDATE ON notes
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL OR NEW.updated_at = OLD.updated_at
                    BEGIN
                        UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`,
                `CREATE TRIGGER IF NOT EXISTS notes_set_updated_at_insert
                    AFTER INSERT ON notes
                    FOR EACH ROW
                    WHEN NEW.updated_at IS NULL
                    BEGIN
                        UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
                    END`
            ]);
        } catch (e) {
            // Trigger creation is best-effort
        }

        const { method } = req;

        // Resolve userId: JWT for authenticated users, server-set httpOnly cookie for anon users.
        // Never trust client-supplied userId from query/body (legacy migration only on first visit).
        const { userId } = getOrCreateUserId(req, res);

        if (method === 'GET') {
            // Fetch user data
            const { since, courseId } = req.query;
            if (since !== undefined && !ISO_DATE_RE.test(String(since))) {
                return res.status(400).json({ error: 'Invalid `since` parameter; expected ISO-8601' });
            }

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
                bookmarksQuery += ` AND (updated_at > ? OR created_at > ? OR deleted_at > ?)`;
                bookmarksArgs.push(since, since, since);
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

            // Fetch progress
            let progressQuery = `SELECT * FROM progress WHERE user_id = ?`;
            const progressArgs = [userId];

            if (courseId) {
                progressQuery += ` AND course_id = ?`;
                progressArgs.push(courseId);
            }
            if (since) {
                progressQuery += ` AND (updated_at > ? OR created_at > ? OR deleted_at > ?)`;
                progressArgs.push(since, since, since);
            } else {
                progressQuery += ` AND deleted_at IS NULL`;
            }

            const progress = await db.execute({ sql: progressQuery, args: progressArgs });

            // Fetch daily stats
            let dailyStatsQuery = `SELECT * FROM daily_stats WHERE user_id = ?`;
            const dailyStatsArgs = [userId];

            if (courseId) {
                dailyStatsQuery += ` AND course_id = ?`;
                dailyStatsArgs.push(courseId);
            }
            if (since) {
                dailyStatsQuery += ` AND (updated_at > ? OR created_at > ? OR deleted_at > ?)`;
                dailyStatsArgs.push(since, since, since);
            } else {
                dailyStatsQuery += ` AND deleted_at IS NULL`;
            }

            const dailyStats = await db.execute({ sql: dailyStatsQuery, args: dailyStatsArgs });

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
                progress: progress.rows,
                dailyStats: dailyStats.rows,
                preferences: preferences.rows[0] || null,
                serverTime: new Date().toISOString()
            });

        } else if (method === 'POST') {
            // Push changes (userId from request body)
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
                              (id, user_id, course_id, page_id, text, color, element_path, start_offset, end_offset, sr_due_at, sr_interval, sr_ease, sr_reps, sr_last_reviewed, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
                            val(h.srDueAt),
                            val(h.srInterval),
                            val(h.srEase),
                            val(h.srReps),
                            val(h.srLastReviewed),
                            val(h.createdAt)
                        ]
                    });
                    results.created++;
                }
                // Deleted (soft delete)
                for (const id of changes.highlights.deleted || []) {
                    await db.execute({
                        sql: `UPDATE highlights SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
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
                              (id, user_id, course_id, page_id, section_id, title, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                        args: [val(b.id), userId, val(b.courseId), val(b.pageId), val(b.sectionId), val(b.title), val(b.createdAt)]
                    });
                    results.created++;
                }
                for (const id of changes.bookmarks.deleted || []) {
                    await db.execute({
                        sql: `UPDATE bookmarks SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
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
                        sql: `UPDATE notes SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
                        args: [id, userId]
                    });
                    results.deleted++;
                }
            }

            // Process progress
            if (changes?.progress) {
                for (const p of changes.progress.upsert || []) {
                    await db.execute({
                        sql: `INSERT OR REPLACE INTO progress
                              (id, user_id, course_id, page_id, last_percent, time_spent_sec, completed, last_visited_at, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                        args: [
                            val(p.id),
                            userId,
                            val(p.courseId),
                            val(p.pageId),
                            val(p.lastPercent),
                            val(p.timeSpentSec),
                            val(p.completed ? 1 : 0),
                            val(p.lastVisitedAt)
                        ]
                    });
                    results.updated++;
                }
                for (const id of changes.progress.deleted || []) {
                    await db.execute({
                        sql: `UPDATE progress SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
                        args: [id, userId]
                    });
                    results.deleted++;
                }
            }

            // Process daily stats
            if (changes?.dailyStats) {
                for (const d of changes.dailyStats.upsert || []) {
                    await db.execute({
                        sql: `INSERT OR REPLACE INTO daily_stats
                              (id, user_id, course_id, stat_date, time_spent_sec, created_at, updated_at)
                              VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                        args: [
                            val(d.id),
                            userId,
                            val(d.courseId),
                            val(d.statDate),
                            val(d.timeSpentSec)
                        ]
                    });
                    results.updated++;
                }
                for (const id of changes.dailyStats.deleted || []) {
                    await db.execute({
                        sql: `UPDATE daily_stats SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
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
            // Hard delete the caller's own data only. userId comes from auth/cookie, never query.
            await db.batch([
                { sql: `DELETE FROM highlights WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM progress WHERE user_id = ?`, args: [userId] },
                { sql: `DELETE FROM daily_stats WHERE user_id = ?`, args: [userId] },
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
        return res.status(500).json({ error: 'Internal server error' });
    }
}
