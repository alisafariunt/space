// Text-to-Speech API using Google Cloud TTS
// Free tier: 1M characters/month for WaveNet voices

const GOOGLE_TTS_API = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// Available high-quality voices (Journey = best, Neural2 = great, WaveNet = good)
const VOICES = {
    // Journey voices - BEST quality, most natural
    'en-US-Journey-F': { name: 'Journey Female (US)', gender: 'FEMALE', lang: 'en-US' },
    'en-US-Journey-D': { name: 'Journey Male (US)', gender: 'MALE', lang: 'en-US' },
    'en-US-Journey-O': { name: 'Journey Natural (US)', gender: 'FEMALE', lang: 'en-US' },
    // Studio voices - Professional quality
    'en-US-Studio-Q': { name: 'Studio Male (US)', gender: 'MALE', lang: 'en-US' },
    'en-US-Studio-O': { name: 'Studio Female (US)', gender: 'FEMALE', lang: 'en-US' },
    // Neural2 voices - Very natural
    'en-US-Neural2-F': { name: 'Neural Female (US)', gender: 'FEMALE', lang: 'en-US' },
    'en-US-Neural2-D': { name: 'Neural Male (US)', gender: 'MALE', lang: 'en-US' },
    'en-US-Neural2-J': { name: 'Neural Male 2 (US)', gender: 'MALE', lang: 'en-US' },
    // WaveNet voices - Good quality
    'en-US-Wavenet-F': { name: 'WaveNet Female (US)', gender: 'FEMALE', lang: 'en-US' },
    'en-US-Wavenet-D': { name: 'WaveNet Male (US)', gender: 'MALE', lang: 'en-US' },
    // UK voices
    'en-GB-Neural2-A': { name: 'Neural Female (UK)', gender: 'FEMALE', lang: 'en-GB' },
    'en-GB-Neural2-B': { name: 'Neural Male (UK)', gender: 'MALE', lang: 'en-GB' },
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
        let { text, voice = 'en-US-Wavenet-F', speed = 1.0 } = req.body;

        // Validate voice - must be a valid Google TTS voice
        if (!VOICES[voice]) {
            console.log(`Invalid voice "${voice}", falling back to default`);
            voice = 'en-US-Wavenet-F';
        }

        if (!text || text.length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
        }

        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_TTS_API_KEY not configured');
            return res.status(500).json({ error: 'TTS not configured' });
        }

        // Get voice config
        const voiceConfig = VOICES[voice] || VOICES['en-US-Wavenet-F'];

        // Build request body
        const requestBody = {
            input: { text: text },
            voice: {
                languageCode: voiceConfig.lang,
                name: voice,
                ssmlGender: voiceConfig.gender
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: speed,
                pitch: 0,
                volumeGainDb: 0
            }
        };

        // Call Google TTS API
        const response = await fetch(`${GOOGLE_TTS_API}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Google TTS API error:', error);
            return res.status(500).json({ error: 'TTS generation failed', details: error.error?.message });
        }

        const data = await response.json();

        // audioContent is base64 encoded
        const audioBuffer = Buffer.from(data.audioContent, 'base64');

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
        return res.send(audioBuffer);

    } catch (error) {
        console.error('TTS API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
