/**
 * Chronos API — Cloudflare Worker
 *
 * Acts as a secure proxy between the mobile app and Google Gemini API.
 * The GEMINI_API_KEY is only stored in Cloudflare's encrypted secret store
 * and is never exposed in the app binary.
 *
 * Routes:
 *   POST /story  — Generate a story beat (JSON)
 *   POST /image  — Generate a scene image (base64)
 *   POST /tts    — Generate TTS audio (base64)
 *
 * Deploy:
 *   npm install -g wrangler
 *   wrangler secret put GEMINI_API_KEY
 *   wrangler deploy
 */

export interface Env {
  GEMINI_API_KEY: string;
  STORY_MODEL: string;
  IMAGE_MODEL: string;
  TTS_MODEL: string;
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 500): Response {
  return json({ error: message }, status);
}

// ─── Gemini Story Generation ──────────────────────────────────────────────────

async function handleStory(request: Request, env: Env): Promise<Response> {
  const { prompt, theme } = (await request.json()) as { prompt: string; theme: string };

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          narrative_text: { type: 'STRING' },
          image_prompt: { type: 'STRING' },
          new_state: {
            type: 'OBJECT',
            properties: {
              playerInventory: { type: 'ARRAY', items: { type: 'STRING' } },
              npcRelationships: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    score: { type: 'NUMBER' },
                  },
                  required: ['name', 'score'],
                },
              },
              currentLocation: { type: 'STRING' },
              narrativeHistory: { type: 'ARRAY', items: { type: 'STRING' } },
              health: { type: 'NUMBER' },
            },
            required: ['playerInventory', 'npcRelationships', 'currentLocation', 'narrativeHistory', 'health'],
          },
          tension_score: { type: 'NUMBER' },
          options: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                label: { type: 'STRING' },
                action: { type: 'STRING' },
              },
              required: ['label', 'action'],
            },
          },
        },
        required: ['narrative_text', 'image_prompt', 'new_state', 'tension_score', 'options'],
      },
    },
  };

  const res = await fetch(
    `${GEMINI_BASE}/${env.STORY_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const msg = await res.text();
    return err(`Gemini story error: ${msg}`, res.status);
  }

  const data = (await res.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return err('Empty story response from Gemini');

  return json(JSON.parse(text));
}

// ─── Gemini Image Generation ──────────────────────────────────────────────────

async function handleImage(request: Request, env: Env): Promise<Response> {
  const { prompt } = (await request.json()) as { prompt: string };

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };

  const res = await fetch(
    `${GEMINI_BASE}/${env.IMAGE_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const msg = await res.text();
    return err(`Gemini image error: ${msg}`, res.status);
  }

  const data = (await res.json()) as any;
  for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return json({ imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType });
    }
  }

  return err('No image data in Gemini response', 204);
}

// ─── Gemini TTS ───────────────────────────────────────────────────────────────

async function handleTTS(request: Request, env: Env): Promise<Response> {
  const { text, voice = 'Kore' } = (await request.json()) as { text: string; voice?: string };

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  };

  const res = await fetch(
    `${GEMINI_BASE}/${env.TTS_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const msg = await res.text();
    return err(`Gemini TTS error: ${msg}`, res.status);
  }

  const data = (await res.json()) as any;
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData?.data) {
    return json({ audioBase64: part.inlineData.data, mimeType: part.inlineData.mimeType ?? 'audio/wav' });
  }

  return err('No audio data in Gemini response', 204);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return err('Method not allowed', 405);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/story') return handleStory(request, env);
      if (url.pathname === '/image') return handleImage(request, env);
      if (url.pathname === '/tts') return handleTTS(request, env);
      return err('Not found', 404);
    } catch (e: any) {
      console.error('[Worker] Unhandled error:', e);
      return err(e?.message ?? 'Internal server error');
    }
  },
};
