import type { ModManifestEntry, StateElectionData } from '../core/CampaignDataParser';

declare global {
  interface Window {
    electron?: {
      unlockAchievement: (achievementId: string) => Promise<boolean>;
      loadModData: (modName: string) => Promise<StateElectionData[]>;
      listMods: () => Promise<ModManifestEntry[]>;
    };
  }
}

export {};
