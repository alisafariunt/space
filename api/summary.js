import jwt from 'jsonwebtoken';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

function getCorsHeaders(req) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS || 'https://alisafari.space,https://www.alisafari.space').split(',')
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        };
    }

    return {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

function verifyAccessToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('MISSING_TOKEN');
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'study-guide-secret-key-2024';

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

export default async function handler(req, res) {
    const corsHeaders = getCorsHeaders(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        verifyAccessToken(req);
    } catch (error) {
        if (error.message === 'MISSING_TOKEN' || error.message === 'TOKEN_EXPIRED' || error.message === 'INVALID_TOKEN') {
            return res.status(401).json({ error: 'Authentication required' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(400).json({ error: 'AI not configured' });
    }

    const { highlights, pageId, courseId } = req.body || {};
    if (!Array.isArray(highlights) || highlights.length === 0) {
        return res.status(400).json({ error: 'No highlights provided' });
    }

    const model = process.env.OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';
    const rawLines = highlights.map((item, idx) => {
        const text = (item?.text || '').trim();
        const note = (item?.note || '').trim();
        if (!text) return null;
        return `- ${text}${note ? ` (note: ${note})` : ''}`;
    }).filter(Boolean);

    const content = rawLines.join('\n').slice(0, 12000);
    const userPrompt = [
        `Course: ${courseId || 'general'}`,
        `Page: ${pageId || 'unknown'}`,
        '',
        'Highlights:',
        content
    ].join('\n');

    const siteUrl = process.env.OPENROUTER_SITE_URL || '';
    const appName = process.env.OPENROUTER_APP_NAME || 'study-guide';

    const response = await fetch(OPENROUTER_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(siteUrl ? { 'HTTP-Referer': siteUrl } : {}),
            ...(appName ? { 'X-Title': appName } : {})
        },
        body: JSON.stringify({
            model,
            temperature: 0.3,
            max_tokens: 450,
            messages: [
                {
                    role: 'system',
                    content: [
                        'You are a strict study summarizer.',
                        'Use ONLY the provided highlights/notes; never add external facts.',
                        'Match the language of the input (Persian if most of the input is Persian, otherwise English).',
                        'Write a concise essay-style summary in 1–3 short paragraphs.',
                        'No bullet points, no headings, no lists.',
                        'End with one short concluding sentence.'
                    ].join('\n')
                },
                { role: 'user', content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(500).json({
            error: errorData?.error?.message || 'Summary generation failed'
        });
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ summary });
}
