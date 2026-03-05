import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GameState, StoryBeat, StoryTheme } from "../types";

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing. Please set it in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

const STORY_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const THEME_PROMPTS: Record<StoryTheme, string> = {
  scifi: "Genre: Hard Sci-Fi / Mystery. Setting: A cold, abandoned orbital facility or spaceship. Atmosphere: Sterile, tense, technological. Starting scenario: Waking up from cryosleep with memory loss.",
  fantasy: "Genre: Dark Fantasy. Setting: Ancient ruins, a misty forest, or a crumbling stone keep. Atmosphere: Magical, gritty, mythical. Starting scenario: Waking up near a dying campfire with a rusted sword.",
  horror: "Genre: Cosmic / Psychological Horror. Setting: An isolated modern house, a fog-covered town, or a derelict lighthouse. Atmosphere: Oppressive, shadows, paranoia. Starting scenario: Waking up to the sound of scratching inside the walls.",
  cyberpunk: "Genre: Cyberpunk / Noir. Setting: A rain-slicked neon metropolis, low-life high-tech. Atmosphere: Grime, neon lights, corporate oppression. Starting scenario: Waking up in a back-alley clinic with a headache and a stolen data chip.",
  postapocalyptic: "Genre: Post-Apocalyptic Survival. Setting: A wasteland, overgrown city ruins. Atmosphere: Desolate, resource-scarce, dusty. Starting scenario: Waking up in a makeshift shelter as a dust storm approaches."
};

// Helper for exponential backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check for rate limit / quota errors based on GoogleGenAI error structure
    const isQuotaError = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.message?.includes('429') || 
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.status === 'RESOURCE_EXHAUSTED';

    if (retries > 0 && isQuotaError) {
      console.warn(`Quota hit or Rate Limited. Retrying in ${initialDelay}ms... (${retries} attempts remaining)`);
      await wait(initialDelay);
      return callWithRetry(fn, retries - 1, initialDelay * 2);
    }
    throw error;
  }
}

export const generateInitialState = async (theme: StoryTheme): Promise<StoryBeat> => {
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

  return await generateStoryBeat(prompt, {
    playerInventory: [],
    npcRelationships: [],
    currentLocation: "Unknown Start",
    narrativeHistory: [],
    health: 100
  }, theme); // Pass theme to generateStoryBeat
};

export const generateNextBeat = async (
  choice: string,
  currentState: GameState,
  theme: StoryTheme
): Promise<StoryBeat> => {
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

  return await generateStoryBeat(prompt, currentState, theme);
};

const generateStoryBeat = async (prompt: string, currentState: GameState, theme: StoryTheme): Promise<StoryBeat> => {
  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model: STORY_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrative_text: { type: Type.STRING, description: "The main story text to display. Be atmospheric and cinematic." },
              image_prompt: { type: Type.STRING, description: `A detailed visual description of the current scene for an image generator. Style: ${theme}. No text in image.` },
              new_state: {
                type: Type.OBJECT,
                properties: {
                  playerInventory: { type: Type.ARRAY, items: { type: Type.STRING } },
                  npcRelationships: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER }
                      },
                      required: ["name", "score"]
                    } 
                  },
                  currentLocation: { type: Type.STRING },
                  narrativeHistory: { type: Type.ARRAY, items: { type: Type.STRING } },
                  health: { type: Type.NUMBER }
                },
                required: ["playerInventory", "currentLocation", "narrativeHistory", "health", "npcRelationships"],
              },
              tension_score: { type: Type.NUMBER, description: "1 to 10 score indicating dramatic tension." },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ["label", "action"]
                }
              }
            },
            required: ["narrative_text", "image_prompt", "new_state", "tension_score", "options"]
          }
        }
      });
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");
    
    return JSON.parse(text) as StoryBeat;

  } catch (error) {
    console.error("Error generating story beat:", error);
    // Fallback in case of error to prevent app crash
    return {
      narrative_text: "The Chronos signal is weak. High interference from the timeline. The reality is unstable. Please wait a moment and try to reconnect.",
      image_prompt: "Static interference on a digital screen, glitch art, dark atmosphere",
      new_state: currentState,
      tension_score: 1,
      options: [{ label: "Attempt Reconnection", action: "retry" }]
    };
  }
};

export const generateSceneImage = async (imagePrompt: string): Promise<string | null> => {
  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [{ text: imagePrompt + " cinematic lighting, 8k resolution, photorealistic, highly detailed, atmospheric, no text" }]
        },
        config: {
          // Nano Banana / Flash Image doesn't support responseMimeType in the same way, 
          // but returns inlineData or we just extract it.
        }
      });
    });

    // Check for inline data in the response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.warn("Failed to generate image:", error);
    // Silent fail for images is acceptable
    return null;
  }
};

export const generateSpeech = async (text: string, voice: string = 'Kore'): Promise<string | null> => {
  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
        return `data:${part.inlineData.mimeType || 'audio/wav'};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error) {
    console.error("Failed to generate speech:", error);
    return null;
  }
};