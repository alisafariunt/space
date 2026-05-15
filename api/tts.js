import { verifyAccessToken, applyCors, AuthError } from './_lib/auth-core.js';

// Text-to-Speech API using Murf.ai
// Premium natural voices with narration style

const MURF_API = 'https://api.murf.ai/v1/speech/generate';

// Best-effort per-process rate limit. Vercel runs many instances,
// so this only catches abusive bursts that hit the same warm container.
// For real abuse protection, move counters to Turso or rely on Murf's quota.
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '60', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const requestCounts = new Map();
const RATE_LIMIT_GC_INTERVAL = 5 * 60 * 1000;
let lastGc = Date.now();

function gcRateMap(now) {
    if (now - lastGc < RATE_LIMIT_GC_INTERVAL) return;
    for (const [key, times] of requestCounts) {
        const fresh = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
        if (fresh.length === 0) requestCounts.delete(key);
        else requestCounts.set(key, fresh);
    }
    lastGc = now;
}

function rateLimit(userId) {
    const now = Date.now();
    gcRateMap(now);
    const userRequests = requestCounts.get(userId) || [];
    const recent = userRequests.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) {
        throw new Error('RATE_LIMIT_EXCEEDED');
    }
    recent.push(now);
    requestCounts.set(userId, recent);
}

// Available Murf voices (correct voice IDs from API)
const VOICES = {
    'en-US-terrell': { name: 'Terrell', lang: 'en-US' },
    'en-US-ryan': { name: 'Ryan', lang: 'en-US' },
    'en-US-miles': { name: 'Miles', lang: 'en-US' },
    'en-US-denzel': { name: 'Denzel', lang: 'en-US' },
    'en-US-natalie': { name: 'Natalie', lang: 'en-US' },
    'en-US-samantha': { name: 'Samantha', lang: 'en-US' },
    'en-US-charlotte': { name: 'Charlotte', lang: 'en-US' },
    'en-UK-peter': { name: 'Peter (UK)', lang: 'en-UK' },
};

// SSRF guard: only fetch from known Murf CDN/API hostnames.
const MURF_AUDIO_HOST_ALLOWLIST = new Set([
    'murf.ai',
    'api.murf.ai',
    'cdn.murf.ai',
    'murfaicdn.b-cdn.net',
    'murf-cdn.murf.ai',
]);

function isAllowedAudioUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch (_) {
        return false;
    }
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (MURF_AUDIO_HOST_ALLOWLIST.has(host)) return true;
    // Allow any subdomain of murf.ai
    if (host.endsWith('.murf.ai')) return true;
    return false;
}

export default async function handler(req, res) {
    applyCors(req, res, 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET request returns available voices
    if (req.method === 'GET') {
        return res.status(200).json({ voices: VOICES });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let { text, voice = 'en-US-terrell' } = req.body || {};

        let userId;
        try {
            userId = verifyAccessToken(req);
        } catch (error) {
            if (error instanceof AuthError) {
                if (error.code === 'TOKEN_EXPIRED') {
                    return res.status(401).json({ error: 'Token expired' });
                }
                return res.status(401).json({ error: 'Authentication required' });
            }
            throw error;
        }

        try {
            rateLimit(userId);
        } catch (error) {
            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                return res.status(429).json({ error: 'Too many requests. Please try again later.' });
            }
            throw error;
        }

        if (!text || typeof text !== 'string' || text.length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
        }

        const apiKey = process.env.MURF_API_KEY;
        if (!apiKey) {
            console.error('MURF_API_KEY not configured');
            return res.status(503).json({ error: 'TTS not configured' });
        }

        const voiceId = VOICES[voice] ? voice : 'en-US-terrell';

        const requestBody = {
            text: text,
            voice_id: voiceId,
            format: 'MP3',
            sample_rate: 24000
        };

        const response = await fetch(MURF_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Murf API error:', response.status, errorText.slice(0, 500));
            return res.status(502).json({ error: 'TTS generation failed' });
        }

        const data = await response.json().catch(() => ({}));

        if (!data.audioFile) {
            console.error('No audio file in response');
            return res.status(502).json({ error: 'No audio generated' });
        }

        if (!isAllowedAudioUrl(data.audioFile)) {
            // Murf must never return a URL outside its own CDN. If it does,
            // refuse to fetch — protects against SSRF via a compromised upstream.
            console.error('Refusing to fetch audio from disallowed host:', data.audioFile);
            return res.status(502).json({ error: 'Invalid audio source' });
        }

        const audioResponse = await fetch(data.audioFile);
        if (!audioResponse.ok) {
            console.error('Audio fetch failed:', audioResponse.status);
            return res.status(502).json({ error: 'Audio retrieval failed' });
        }

        const audioBuffer = await audioResponse.arrayBuffer();

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.byteLength);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error('TTS API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
