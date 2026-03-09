export interface GameState {
  playerInventory: string[];
  npcRelationships: { name: string; score: number }[];
  currentLocation: string;
  narrativeHistory: string[];
  health: number;
}

export type StoryTheme = 'scifi' | 'fantasy' | 'horror' | 'cyberpunk' | 'postapocalyptic';

export interface StoryBeat {
  narrative_text: string;
  image_prompt: string;
  new_state: GameState;
  tension_score: number;
  options: { label: string; action: string }[];
}

export interface SaveData {
  gameState: GameState;
  currentBeat: StoryBeat;
  currentImage: string | null;
  selectedTheme: StoryTheme;
  timestamp: number;
}

export enum AppStatus {
  SPLASH,
  MENU,
  THEME_SELECT,
  PLAYING,
  GAME_OVER,
}
