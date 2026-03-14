/**
 * GameContext — React Native
 *
 * Adaptations vs the web version:
 * - localStorage → AsyncStorage
 * - Web AudioContext → expo-audio (AudioPlayer)
 * - Writes TTS audio to a temp file via expo-file-system for reliable playback
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { GameState, StoryBeat, AppStatus, StoryTheme, SaveData } from '../types';
import {
  generateInitialState,
  generateNextBeat,
  generateSceneImage,
  generateSpeech,
} from '../services/geminiService';
import { useMonetization } from './MonetizationContext';

const SAVE_KEY = '@chronos_save';
const NARRATION_KEY = '@chronos_narration';

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
  startGame: (theme: StoryTheme) => Promise<void>;
  makeChoice: (choice: string) => Promise<void>;
  resetGame: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
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

  const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const soundRef = useRef<AudioPlayer | null>(null);
  const tempAudioUriRef = useRef<string | null>(null);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [saveRaw, narrationRaw] = await Promise.all([
        AsyncStorage.getItem(SAVE_KEY).catch(() => null),
        AsyncStorage.getItem(NARRATION_KEY).catch(() => null),
      ]);
      setHasSave(!!saveRaw);
      if (narrationRaw !== null) setIsNarrationEnabled(JSON.parse(narrationRaw));

      // Configure audio session for background/speaker playback
      await setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    })();
  }, []);

  // ── Audio cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Narration playback when beat changes ────────────────────────────────────
  useEffect(() => {
    if (!currentBeat || !isNarrationEnabled || !isPremium) {
      stopAudio();
      return;
    }

    stopAudio();
    playNarration(currentBeat.narrative_text);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBeat, isNarrationEnabled]);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        soundRef.current.remove();
      } catch {
        /* ignore */
      }
      soundRef.current = null;
    }
    // Clean up temp file
    if (tempAudioUriRef.current) {
      FileSystem.deleteAsync(tempAudioUriRef.current, { idempotent: true }).catch(() => {});
      tempAudioUriRef.current = null;
    }
    setIsPlayingAudio(false);
  }, []);

  const playNarration = useCallback(async (text: string) => {
    if (!text) return;
    setIsAudioLoading(true);

    try {
      const dataUri = await generateSpeech(text);
      if (!dataUri) return;

      // expo-av plays local file URIs most reliably.
      // Extract base64 payload and write to a temp .wav file.
      const base64 = dataUri.split(',')[1];
      if (!base64) return;

      const tempUri = `${FileSystem.cacheDirectory}chronos_narration_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      tempAudioUriRef.current = tempUri;

      const player = createAudioPlayer({ uri: tempUri });
      soundRef.current = player;
      player.play();
      setIsPlayingAudio(true);

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (err) {
      console.error('[GameContext] playNarration error:', err);
    } finally {
      setIsAudioLoading(false);
    }
  }, []);

  // ── Public actions ──────────────────────────────────────────────────────────
  const toggleNarration = useCallback(() => {
    setIsNarrationEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem(NARRATION_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const enterThemeSelection = useCallback(() => {
    setAppStatus(AppStatus.THEME_SELECT);
  }, []);

  const startGame = useCallback(async (theme: StoryTheme) => {
    setSelectedTheme(theme);
    setIsLoading(true);
    setCurrentImage(null);

    try {
      const beat = await generateInitialState(theme);
      setGameState(beat.new_state);
      setCurrentBeat(beat);
      setAppStatus(AppStatus.PLAYING);

      // Load image in background — non-blocking
      generateSceneImage(beat.image_prompt).then((img) => {
        if (img) setCurrentImage(img);
      });
    } catch (err) {
      console.error('[GameContext] startGame error:', err);
      setAppStatus(AppStatus.THEME_SELECT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const makeChoice = useCallback(async (choice: string) => {
    if (!gameState) return;

    setIsLoading(true);
    setCurrentImage(null);
    stopAudio();

    try {
      const nextBeat = await generateNextBeat(choice, gameState, selectedTheme);
      setGameState(nextBeat.new_state);
      setCurrentBeat(nextBeat);

      if (nextBeat.new_state.health <= 0) {
        setAppStatus(AppStatus.GAME_OVER);
      } else {
        generateSceneImage(nextBeat.image_prompt).then((img) => {
          if (img) setCurrentImage(img);
        });
      }
    } catch (err) {
      console.error('[GameContext] makeChoice error:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, selectedTheme]);

  const saveGame = useCallback(async () => {
    if (!gameState || !currentBeat) return;

    const data: SaveData = {
      gameState,
      currentBeat,
      currentImage,
      selectedTheme,
      timestamp: Date.now(),
    };

    try {
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setHasSave(true);
    } catch (err) {
      console.error('[GameContext] saveGame error:', err);
    }
  }, [gameState, currentBeat, currentImage, selectedTheme]);

  const loadGame = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(SAVE_KEY);
      if (!json) return;

      const data = JSON.parse(json) as SaveData;
      setGameState(data.gameState);
      setCurrentBeat(data.currentBeat);
      setCurrentImage(data.currentImage);
      setSelectedTheme(data.selectedTheme);
      setAppStatus(AppStatus.PLAYING);
    } catch (err) {
      console.error('[GameContext] loadGame error:', err);
      setHasSave(false);
      AsyncStorage.removeItem(SAVE_KEY).catch(() => {});
    }
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
    setCurrentBeat(null);
    setCurrentImage(null);
    setAppStatus(AppStatus.MENU);
    stopAudio();
  }, [stopAudio]);

  return (
    <GameContext.Provider
      value={{
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
        toggleNarration,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
