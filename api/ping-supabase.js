// Daily Vercel cron — keeps the Supabase free-tier project alive.
// Vercel cron requests carry `Authorization: Bearer <CRON_SECRET>` when
// CRON_SECRET is set in env; we reject anything else so a public URL hit
// can't trigger this endpoint.

export default async function handler(req, res) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const expected = `Bearer ${cronSecret}`;
        if (req.headers.authorization !== expected) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } else {
        // If the operator forgot to set CRON_SECRET, fail closed rather than
        // exposing this endpoint publicly.
        console.error('CRON_SECRET is not set; refusing to run.');
        return res.status(503).json({ error: 'Cron not configured' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
        console.error('SUPABASE_URL or SUPABASE_ANON_KEY not configured');
        return res.status(503).json({ error: 'Supabase not configured' });
    }

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/projects?select=id&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`
            }
        });

        if (response.ok) {
            return res.status(200).json({ success: true, message: 'Supabase pinged successfully to prevent pause.' });
        }
        const body = await response.text().catch(() => '');
        console.error('Supabase ping failed:', response.status, body.slice(0, 500));
        return res.status(502).json({ success: false, message: 'Ping failed' });
    } catch (e) {
        console.error('Ping error:', e);
        return res.status(500).json({ success: false, message: 'Internal error' });
    }
}
