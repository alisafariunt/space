import jwt from 'jsonwebtoken';

// Text-to-Speech API using Murf.ai
// Premium natural voices with narration style

const MURF_API = 'https://api.murf.ai/v1/speech/generate';
const JWT_SECRET = process.env.JWT_SECRET || 'study-guide-secret-key-2024';

// Rate limiting (in-memory, upgrade to Redis for production)
const requestCounts = new Map();

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

function getCorsHeaders(req) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || 'https://alisafari.space,https://www.alisafari.space').split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        };
    }

    return {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

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

function rateLimit(userId) {
    const limit = parseInt(process.env.RATE_LIMIT_MAX || '60');
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
    const now = Date.now();

    const userRequests = requestCounts.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= limit) {
        throw new Error('RATE_LIMIT_EXCEEDED');
    }

    recentRequests.push(now);
    requestCounts.set(userId, recentRequests);
}

export default async function handler(req, res) {
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

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
        let { text, voice = 'en-US-terrell' } = req.body;

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

        try {
            rateLimit(userId);
        } catch (error) {
            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                return res.status(429).json({ error: 'Too many requests. Please try again later.' });
            }
            throw error;
        }

        if (!text || text.length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
        }

        const apiKey = process.env.MURF_API_KEY;
        if (!apiKey) {
            console.error('MURF_API_KEY not configured');
            return res.status(500).json({ error: 'TTS not configured' });
        }

        // Get voice ID - Murf uses format like "en-US-peter" (lowercase name)
        // The voice parameter is already in this format from frontend
        const voiceId = VOICES[voice] ? voice : 'en-US-terrell';

        // Build request body for Murf API (using snake_case as per docs)
        const requestBody = {
            text: text,
            voice_id: voiceId,
            format: 'MP3',
            sample_rate: 24000
        };

        // Call Murf API
        const response = await fetch(MURF_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Murf API error:', response.status, errorText);
            return res.status(500).json({ error: 'TTS generation failed', details: errorText });
        }

        const data = await response.json();

        // Murf returns a URL to the audio file
        if (data.audioFile) {
            // Fetch the audio file
            const audioResponse = await fetch(data.audioFile);
            if (!audioResponse.ok) {
                throw new Error('Failed to fetch audio file');
            }

            const audioBuffer = await audioResponse.arrayBuffer();

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', audioBuffer.byteLength);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.send(Buffer.from(audioBuffer));
        } else {
            console.error('No audio file in response:', data);
            return res.status(500).json({ error: 'No audio generated' });
        }

    } catch (error) {
        console.error('TTS API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
