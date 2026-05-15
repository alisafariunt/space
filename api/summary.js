import { verifyAccessToken, applyCors, AuthError } from './_lib/auth-core.js';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req, res) {
    applyCors(req, res, 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        verifyAccessToken(req);
    } catch (err) {
        if (err instanceof AuthError) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        return res.status(401).json({ error: 'Authentication required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: 'AI not configured' });
    }

    const { highlights, pageId, courseId } = req.body || {};
    if (!Array.isArray(highlights) || highlights.length === 0) {
        return res.status(400).json({ error: 'No highlights provided' });
    }

    const model = process.env.OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';
    const rawLines = highlights.map(item => {
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

    let response;
    try {
        response = await fetch(OPENROUTER_API, {
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
    } catch (err) {
        console.error('[Summary] Upstream fetch failed:', err);
        return res.status(502).json({ error: 'Summary generation failed' });
    }

    if (!response.ok) {
        const upstreamText = await response.text().catch(() => '');
        console.error('[Summary] OpenRouter error', response.status, upstreamText.slice(0, 500));
        return res.status(502).json({ error: 'Summary generation failed' });
    }

    const data = await response.json().catch(() => ({}));
    const summary = data?.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ summary });
}
