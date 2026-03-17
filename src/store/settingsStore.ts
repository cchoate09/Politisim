import { create } from 'zustand';

export type MapPalette = 'standard' | 'colorblind' | 'high_contrast';
export type AnimationLevel = 'full' | 'reduced' | 'minimal';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  uiScale: number;
  mapPalette: MapPalette;
  animationLevel: AnimationLevel;
  gameplayHints: boolean;
  highContrast: boolean;
}

interface SettingsState extends GameSettings {
  updateSettings: (patch: Partial<GameSettings>) => void;
  resetSettings: () => void;
}

const SETTINGS_STORAGE_KEY = 'politisim_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 72,
  musicVolume: 58,
  sfxVolume: 72,
  musicEnabled: true,
  sfxEnabled: true,
  uiScale: 100,
  mapPalette: 'standard',
  animationLevel: 'full',
  gameplayHints: true,
  highContrast: false
};

function loadStoredSettings(): GameSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: GameSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadStoredSettings(),
  updateSettings: (patch) => {
    const next = { ...get(), ...patch };
    const persistable: GameSettings = {
      masterVolume: next.masterVolume,
      musicVolume: next.musicVolume,
      sfxVolume: next.sfxVolume,
      musicEnabled: next.musicEnabled,
      sfxEnabled: next.sfxEnabled,
      uiScale: next.uiScale,
      mapPalette: next.mapPalette,
      animationLevel: next.animationLevel,
      gameplayHints: next.gameplayHints,
      highContrast: next.highContrast
    };
    persistSettings(persistable);
    set(patch);
  },
  resetSettings: () => {
    persistSettings(DEFAULT_SETTINGS);
    set({ ...DEFAULT_SETTINGS });
  }
}));
