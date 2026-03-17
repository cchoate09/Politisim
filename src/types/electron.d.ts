import type { ModManifestEntry, StateElectionData } from '../core/CampaignDataParser';
import type { CloudFileInfo, SteamStatus } from '../core/SteamSync';

declare global {
  interface Window {
    electron?: {
      unlockAchievement: (achievementId: string) => Promise<boolean>;
      getSteamStatus: () => Promise<SteamStatus>;
      readCloudFile: (fileName: string) => Promise<string | null>;
      writeCloudFile: (fileName: string, content: string) => Promise<boolean>;
      listCloudFiles: () => Promise<CloudFileInfo[]>;
      loadModData: (modName: string) => Promise<StateElectionData[]>;
      listMods: () => Promise<ModManifestEntry[]>;
    };
  }
}

export {};
