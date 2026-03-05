/**
 * Gemini Service — React Native
 *
 * All requests go through your Cloudflare Worker proxy so the API key
 * stays server-side and is never bundled into the app binary.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in your .env.local to point at the Worker.
 */
import { GameState, StoryBeat, StoryTheme } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

if (!API_BASE) {
  console.warn('[geminiService] EXPO_PUBLIC_API_BASE_URL is not set. API calls will fail.');
}

const THEME_PROMPTS: Record<StoryTheme, string> = {
  scifi:
    'Genre: Hard Sci-Fi / Mystery. Setting: A cold, abandoned orbital facility or spaceship. Atmosphere: Sterile, tense, technological. Starting scenario: Waking up from cryosleep with memory loss.',
  fantasy:
    'Genre: Dark Fantasy. Setting: Ancient ruins, a misty forest, or a crumbling stone keep. Atmosphere: Magical, gritty, mythical. Starting scenario: Waking up near a dying campfire with a rusted sword.',
  horror:
    'Genre: Cosmic / Psychological Horror. Setting: An isolated modern house, a fog-covered town, or a derelict lighthouse. Atmosphere: Oppressive, shadows, paranoia. Starting scenario: Waking up to the sound of scratching inside the walls.',
  cyberpunk:
    'Genre: Cyberpunk / Noir. Setting: A rain-slicked neon metropolis, low-life high-tech. Atmosphere: Grime, neon lights, corporate oppression. Starting scenario: Waking up in a back-alley clinic with a headache and a stolen data chip.',
  postapocalyptic:
    'Genre: Post-Apocalyptic Survival. Setting: A wasteland, overgrown city ruins. Atmosphere: Desolate, resource-scarce, dusty. Starting scenario: Waking up in a makeshift shelter as a dust storm approaches.',
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isQuota =
      err?.status === 429 ||
      String(err?.message).includes('429') ||
      String(err?.message).includes('quota') ||
      String(err?.message).includes('RESOURCE_EXHAUSTED');

    if (retries > 0 && isQuota) {
      console.warn(`[geminiService] Rate limit hit — retrying in ${delay}ms (${retries} left)`);
      await wait(delay);
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

// ─── Story Generation ────────────────────────────────────────────────────────

export async function generateInitialState(theme: StoryTheme): Promise<StoryBeat> {
  const themeContext = THEME_PROMPTS[theme];
  const prompt = `
    You are the 'Chronos' engine, an infinite text adventure generator.
    Initialize a new adventure based on this theme:
    ${themeContext}

    Output strictly in JSON format matching the schema.
    The narrative should be immersive and set the scene immediately.
    The tension_score should be low (1-3) for the start.
    Provide 2-3 initial options for the player.
  `;

  return generateStoryBeat(prompt, {
    playerInventory: [],
    npcRelationships: [],
    currentLocation: 'Unknown Start',
    narrativeHistory: [],
    health: 100,
  }, theme);
}

export async function generateNextBeat(
  choice: string,
  currentState: GameState,
  theme: StoryTheme
): Promise<StoryBeat> {
  const themeContext = THEME_PROMPTS[theme];
  const prompt = `
    You are the 'Chronos' engine.
    Theme Context: ${themeContext}
    Current State: ${JSON.stringify(currentState)}
    Player Choice: "${choice}"

    Generate the next narrative beat based on the choice and current state.
    Keep the tone consistent with the ${theme} genre.
    Update the inventory, relationships, and location as logical consequences of the action.
    Update narrativeHistory by appending a 1-sentence summary of the PREVIOUS event, keeping only the last 5.

    The 'tension_score' (1-10) is CRITICAL.
    1-4: Calm, exploration.
    5-7: Unease, rising action, minor conflict.
    8-10: Immediate danger, cliffhanger, major revelation.

    Provide 2-4 distinct options for the user to proceed.
  `;

  return generateStoryBeat(prompt, currentState, theme);
}

async function generateStoryBeat(
  prompt: string,
  currentState: GameState,
  theme: StoryTheme
): Promise<StoryBeat> {
  try {
    const beat = await callWithRetry<StoryBeat>(async () => {
      const res = await fetch(`${API_BASE}/story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, theme }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw Object.assign(new Error(msg), { status: res.status });
      }
      return res.json() as Promise<StoryBeat>;
    });

    return beat;
  } catch (err) {
    console.error('[geminiService] generateStoryBeat error:', err);
    return {
      narrative_text:
        'The Chronos signal is weak. High interference from the timeline. Reality is unstable. Please wait a moment and try to reconnect.',
      image_prompt: 'Static interference on a digital screen, glitch art, dark atmosphere',
      new_state: currentState,
      tension_score: 1,
      options: [{ label: 'Attempt Reconnection', action: 'retry' }],
    };
  }
}

// ─── Image Generation ─────────────────────────────────────────────────────────

export async function generateSceneImage(imagePrompt: string): Promise<string | null> {
  try {
    const result = await callWithRetry<{ imageBase64: string; mimeType: string } | null>(async () => {
      const res = await fetch(`${API_BASE}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${imagePrompt} cinematic lighting, 8k resolution, photorealistic, highly detailed, atmospheric, no text`,
        }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      return res.json();
    });

    if (!result?.imageBase64) return null;
    return `data:${result.mimeType ?? 'image/jpeg'};base64,${result.imageBase64}`;
  } catch (err) {
    console.warn('[geminiService] generateSceneImage failed (silent):', err);
    return null;
  }
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────────

export async function generateSpeech(text: string, voice = 'Kore'): Promise<string | null> {
  try {
    const result = await callWithRetry<{ audioBase64: string; mimeType: string } | null>(async () => {
      const res = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      return res.json();
    });

    if (!result?.audioBase64) return null;
    return `data:${result.mimeType ?? 'audio/wav'};base64,${result.audioBase64}`;
  } catch (err) {
    console.error('[geminiService] generateSpeech error:', err);
    return null;
  }
}
