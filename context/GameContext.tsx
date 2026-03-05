import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { GameState, StoryBeat, AppStatus, StoryTheme, SaveData } from '../types';
import { generateInitialState, generateNextBeat, generateSceneImage, generateSpeech } from '../services/geminiService';
import { useMonetization } from './MonetizationContext';

interface GameContextType {
  gameState: GameState | null;
  currentBeat: StoryBeat | null;
  currentImage: string | null;
  appStatus: AppStatus;
  isLoading: boolean;
  selectedTheme: StoryTheme;
  hasSave: boolean;
  isNarrationEnabled: boolean;
  isPlayingAudio: boolean;
  isAudioLoading: boolean;
  enterThemeSelection: () => void;
  startGame: (theme: StoryTheme) => void;
  makeChoice: (choice: string) => void;
  resetGame: () => void;
  saveGame: () => void;
  loadGame: () => void;
  toggleNarration: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPremium } = useMonetization();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentBeat, setCurrentBeat] = useState<StoryBeat | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.SPLASH);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<StoryTheme>('scifi');
  const [hasSave, setHasSave] = useState(false);
  
  // Narration State
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Check for existing save and settings on mount
  useEffect(() => {
    const saveExists = !!localStorage.getItem('chronos_save');
    setHasSave(saveExists);
    
    const savedNarration = localStorage.getItem('chronos_narration');
    if (savedNarration) {
        setIsNarrationEnabled(JSON.parse(savedNarration));
    }
  }, []);

  // Cleanup Audio on Unmount
  useEffect(() => {
    return () => {
        stopAudio();
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const stopAudio = () => {
      if (audioSourceRef.current) {
          try {
              audioSourceRef.current.stop();
          } catch (e) { /* ignore if already stopped */ }
          audioSourceRef.current = null;
      }
      setIsPlayingAudio(false);
  };

  // Handle Narration Logic
  useEffect(() => {
    // If disabled or no text, stop audio
    if (!currentBeat || !isNarrationEnabled) {
        stopAudio();
        return;
    }

    // Stop previous audio before starting new
    stopAudio();

    const playNarration = async () => {
        if (!isNarrationEnabled || !currentBeat.narrative_text) return;
        if (!isPremium) return; // Enforce premium check

        setIsAudioLoading(true);
        try {
            const audioDataURI = await generateSpeech(currentBeat.narrative_text);
            if (!audioDataURI || !isNarrationEnabled) {
                setIsAudioLoading(false);
                return;
            }

            // Initialize AudioContext if needed
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
            }

            const ctx = audioContextRef.current;
            
            // Resume context if suspended (browser autoplay policy)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // Fetch and decode
            const response = await fetch(audioDataURI);
            const arrayBuffer = await response.arrayBuffer();
            
            // Clone buffer because decodeAudioData detaches it
            const fallbackBuffer = arrayBuffer.slice(0);
            
            let audioBuffer: AudioBuffer;

            try {
                // Try standard decoding (WAV/MP3)
                audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            } catch (decodeError) {
                console.warn("Standard decode failed, attempting raw PCM decode (24kHz 16-bit mono)", decodeError);
                // Fallback: Assume raw PCM 24kHz 16-bit mono (Gemini default)
                // Use the fallback buffer since the original might be detached
                const dataView = new DataView(fallbackBuffer);
                const numSamples = fallbackBuffer.byteLength / 2;
                audioBuffer = ctx.createBuffer(1, numSamples, 24000);
                const channelData = audioBuffer.getChannelData(0);
                
                for (let i = 0; i < numSamples; i++) {
                    // Convert Int16 to Float32 [-1.0, 1.0]
                    const int16 = dataView.getInt16(i * 2, true); // Little endian
                    channelData[i] = int16 / 32768;
                }
            }

            // Play
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            source.onended = () => setIsPlayingAudio(false);
            
            source.start(0);
            audioSourceRef.current = source;
            setIsPlayingAudio(true);

        } catch (e) {
            console.error("Audio playback error", e);
            setIsPlayingAudio(false);
        } finally {
            setIsAudioLoading(false);
        }
    };

    playNarration();

  }, [currentBeat, isNarrationEnabled]);

  const toggleNarration = () => {
      setIsNarrationEnabled(prev => {
          const newState = !prev;
          localStorage.setItem('chronos_narration', JSON.stringify(newState));
          
          // If enabling, ensure AudioContext is ready (user gesture)
          if (newState && !audioContextRef.current) {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              audioContextRef.current = new AudioContextClass();
          }
          
          return newState;
      });
  };

  const enterThemeSelection = () => {
    setAppStatus(AppStatus.THEME_SELECT);
  };

  const startGame = async (theme: StoryTheme) => {
    setSelectedTheme(theme);
    setIsLoading(true);
    setCurrentImage(null); // Clear image for initial load
    // Do NOT transition to playing immediately. Wait for generation.
    // setAppStatus(AppStatus.PLAYING); 

    try {
      const beat = await generateInitialState(theme);
      setGameState(beat.new_state);
      setCurrentBeat(beat);
      
      // Async load image without blocking UI text
      generateSceneImage(beat.image_prompt).then(img => {
        if (img) setCurrentImage(img);
      });

      // Now transition to playing
      setAppStatus(AppStatus.PLAYING);
    } catch (e) {
      console.error(e);
      setAppStatus(AppStatus.THEME_SELECT); // Go back if error
    } finally {
      setIsLoading(false);
    }
  };

  const makeChoice = async (choice: string) => {
    if (!gameState) return;

    setIsLoading(true);
    setCurrentImage(null); // Clear image to show shimmer during transition
    
    stopAudio(); // Stop audio immediately on choice

    try {
      const nextBeat = await generateNextBeat(choice, gameState, selectedTheme);
      
      setGameState(nextBeat.new_state);
      setCurrentBeat(nextBeat);
      
      // Check for Game Over logic immediately after state update
      if (nextBeat.new_state.health <= 0) {
        setAppStatus(AppStatus.GAME_OVER);
        // We do NOT fetch the image for the death scene to save tokens/time, or we could. 
        // Let's skip image generation on death to emphasize the text and "Fade to black".
      } else {
        // Fetch image in background only if alive
        generateSceneImage(nextBeat.image_prompt).then(img => {
          if (img) setCurrentImage(img);
        });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGame = () => {
    if (!gameState || !currentBeat) return;
    
    const saveData: SaveData = {
      gameState,
      currentBeat,
      currentImage,
      selectedTheme,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('chronos_save', JSON.stringify(saveData));
      setHasSave(true);
    } catch (e) {
      console.error("Failed to save game", e);
    }
  };

  const loadGame = () => {
    try {
      const json = localStorage.getItem('chronos_save');
      if (!json) return;

      const data = JSON.parse(json) as SaveData;
      setGameState(data.gameState);
      setCurrentBeat(data.currentBeat);
      setCurrentImage(data.currentImage);
      setSelectedTheme(data.selectedTheme);
      setAppStatus(AppStatus.PLAYING);
    } catch (e) {
      console.error("Failed to load save", e);
      setHasSave(false);
      localStorage.removeItem('chronos_save');
    }
  };

  const resetGame = () => {
    setGameState(null);
    setCurrentBeat(null);
    setCurrentImage(null);
    setAppStatus(AppStatus.MENU);
    stopAudio();
  };

  return (
    <GameContext.Provider value={{
      gameState,
      currentBeat,
      currentImage,
      appStatus,
      isLoading,
      selectedTheme,
      hasSave,
      isNarrationEnabled,
      isPlayingAudio,
      isAudioLoading,
      enterThemeSelection,
      startGame,
      makeChoice,
      resetGame,
      saveGame,
      loadGame,
      toggleNarration
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};