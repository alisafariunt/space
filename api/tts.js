// Text-to-Speech API using Microsoft Edge TTS
// Free, natural-sounding neural voices

import WebSocket from 'ws';

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WSS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const VOICE_LIST_URL = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list";

// Generate UUID for request IDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).replace(/-/g, '');
}

// Format date for Edge TTS
function formatDate() {
    return new Date().toISOString().replace('T', ' ').split('.')[0] + ' GMT+0000 (Coordinated Universal Time)';
}

// Escape SSML special characters
function escapeSSML(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Build SSML request
function buildSSML(text, voice = 'en-US-AriaNeural', rate = 1.0, pitch = 0) {
    const ratePercent = Math.round((rate - 1) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;

    return `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
            <voice name="${voice}">
                <prosody rate="${rateStr}" pitch="${pitchStr}">
                    ${escapeSSML(text)}
                </prosody>
            </voice>
        </speak>
    `.trim();
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, voice = 'en-US-AriaNeural', rate = 1.0 } = req.body;

        if (!text || text.length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ error: 'Text too long (max 5000 characters)' });
        }

        // Generate request IDs
        const requestId = generateUUID();

        // Build WebSocket URL
        const wsUrl = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&ConnectionId=${requestId}`;

        // Create WebSocket connection
        const ws = new WebSocket(wsUrl, {
            headers: {
                'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
            }
        });

        // Collect audio chunks
        const audioChunks = [];
        let audioStarted = false;

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                ws.close();
                res.status(504).json({ error: 'TTS generation timeout' });
                resolve();
            }, 30000);

            ws.on('open', () => {
                // Send configuration
                const configMessage = `X-Timestamp:${formatDate()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
                ws.send(configMessage);

                // Send SSML
                const ssml = buildSSML(text, voice, rate);
                const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${formatDate()}\r\nPath:ssml\r\n\r\n${ssml}`;
                ws.send(ssmlMessage);
            });

            ws.on('message', (data) => {
                if (typeof data === 'string') {
                    // Text message - check for end of audio
                    if (data.includes('Path:turn.end')) {
                        clearTimeout(timeout);
                        ws.close();

                        // Combine audio chunks
                        const audioBuffer = Buffer.concat(audioChunks);

                        res.setHeader('Content-Type', 'audio/mpeg');
                        res.setHeader('Content-Length', audioBuffer.length);
                        res.send(audioBuffer);
                        resolve();
                    }
                } else {
                    // Binary message - audio data
                    const headerLength = data.indexOf('\r\n\r\n'.charCodeAt(0));
                    if (headerLength === -1) {
                        // Find the header separator
                        const separator = Buffer.from('\r\n\r\n');
                        let separatorIndex = -1;
                        for (let i = 0; i < data.length - 3; i++) {
                            if (data[i] === 0x0D && data[i + 1] === 0x0A &&
                                data[i + 2] === 0x0D && data[i + 3] === 0x0A) {
                                separatorIndex = i;
                                break;
                            }
                        }

                        if (separatorIndex > 0) {
                            // Extract audio data after header
                            const audioData = data.slice(separatorIndex + 4);
                            if (audioData.length > 0) {
                                audioChunks.push(audioData);
                                audioStarted = true;
                            }
                        }
                    }
                }
            });

            ws.on('error', (err) => {
                clearTimeout(timeout);
                console.error('WebSocket error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'TTS generation failed' });
                }
                resolve();
            });

            ws.on('close', () => {
                clearTimeout(timeout);
                if (!res.headersSent && audioChunks.length > 0) {
                    const audioBuffer = Buffer.concat(audioChunks);
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.setHeader('Content-Length', audioBuffer.length);
                    res.send(audioBuffer);
                }
                resolve();
            });
        });

    } catch (error) {
        console.error('TTS API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
