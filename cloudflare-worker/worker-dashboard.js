/**
 * Chronos API — Cloudflare Worker (Plain JavaScript for Dashboard Deploy)
 *
 * HOW TO DEPLOY (no CLI, no Node.js needed):
 *
 * 1. Go to https://dash.cloudflare.com
 * 2. Click "Workers & Pages" in the left sidebar
 * 3. Click "Create" → "Create Worker"
 * 4. Give it a name: "chronos-api"
 * 5. Click "Deploy" (deploys the default hello-world, that's fine)
 * 6. Click "Edit code" on the next screen
 * 7. DELETE everything in the editor and PASTE this entire file
 * 8. Click "Deploy" (top right)
 * 9. Copy the Worker URL shown (e.g. https://chronos-api.YOUR-NAME.workers.dev)
 *
 * THEN SET YOUR GEMINI API KEY AS A SECRET:
 * 10. Go back to your Worker → click "Settings" tab → "Variables"
 * 11. Under "Environment Variables" → click "Add variable"
 * 12. Name: GEMINI_API_KEY   Value: (paste your key starting with AIza...)
 * 13. Click "Encrypt" (makes it a secret) → "Save and deploy"
 *
 * That's it — your worker is live!
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model names — update here if Google changes them
const STORY_MODEL = 'gemini-2.0-flash';
const IMAGE_MODEL = 'gemini-2.0-flash-preview-image-generation';
const TTS_MODEL   = 'gemini-2.5-flash-preview-tts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

// ── Story Generation ──────────────────────────────────────────────────────────

async function handleStory(request, env) {
  const { prompt, theme } = await request.json();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          narrative_text: { type: 'STRING' },
          image_prompt:   { type: 'STRING' },
          new_state: {
            type: 'OBJECT',
            properties: {
              playerInventory:    { type: 'ARRAY', items: { type: 'STRING' } },
              npcRelationships: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name:  { type: 'STRING' },
                    score: { type: 'NUMBER' },
                  },
                  required: ['name', 'score'],
                },
              },
              currentLocation:  { type: 'STRING' },
              narrativeHistory: { type: 'ARRAY', items: { type: 'STRING' } },
              health:           { type: 'NUMBER' },
            },
            required: ['playerInventory', 'npcRelationships', 'currentLocation', 'narrativeHistory', 'health'],
          },
          tension_score: { type: 'NUMBER' },
          options: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                label:  { type: 'STRING' },
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
    `${GEMINI_BASE}/${STORY_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    return errorResponse(`Gemini story error: ${msg}`, res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return errorResponse('Empty story response from Gemini');

  return jsonResponse(JSON.parse(text));
}

// ── Image Generation ──────────────────────────────────────────────────────────

async function handleImage(request, env) {
  const { prompt } = await request.json();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };

  const res = await fetch(
    `${GEMINI_BASE}/${IMAGE_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    return errorResponse(`Gemini image error: ${msg}`, res.status);
  }

  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return jsonResponse({ imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType });
    }
  }

  return errorResponse('No image data in Gemini response', 204);
}

// ── Text-to-Speech ────────────────────────────────────────────────────────────

async function handleTTS(request, env) {
  const { text, voice = 'Kore' } = await request.json();

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
    `${GEMINI_BASE}/${TTS_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    return errorResponse(`Gemini TTS error: ${msg}`, res.status);
  }

  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData?.data) {
    return jsonResponse({
      audioBase64: part.inlineData.data,
      mimeType: part.inlineData.mimeType ?? 'audio/wav',
    });
  }

  return errorResponse('No audio data in Gemini response', 204);
}

// ── Main Router ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // Handle CORS preflight (browsers send this before POST)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/story') return handleStory(request, env);
      if (url.pathname === '/image') return handleImage(request, env);
      if (url.pathname === '/tts')   return handleTTS(request, env);
      return errorResponse('Not found', 404);
    } catch (e) {
      console.error('Unhandled Worker error:', e);
      return errorResponse(e?.message ?? 'Internal server error');
    }
  },
};
