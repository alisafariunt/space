// Text-to-Speech API using Murf.ai
// Premium natural voices with narration style

const MURF_API = 'https://api.murf.ai/v1/speech/generate';

// Available Murf voices
const VOICES = {
    'en-US-peter': { name: 'Peter', style: 'Narration', lang: 'en-US' },
    'en-US-marcus': { name: 'Marcus', style: 'Narration', lang: 'en-US' },
    'en-US-ken': { name: 'Ken', style: 'Narration', lang: 'en-US' },
    'en-US-natalie': { name: 'Natalie', style: 'Narration', lang: 'en-US' },
    'en-US-julia': { name: 'Julia', style: 'Narration', lang: 'en-US' },
    'en-US-alicia': { name: 'Alicia', style: 'Narration', lang: 'en-US' },
    'en-GB-iris': { name: 'Iris (UK)', style: 'Narration', lang: 'en-GB' },
    'en-GB-george': { name: 'George (UK)', style: 'Narration', lang: 'en-GB' },
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        let { text, voice = 'en-US-peter', speed = 1.0 } = req.body;

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
        const voiceId = VOICES[voice] ? voice : 'en-US-peter';

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
