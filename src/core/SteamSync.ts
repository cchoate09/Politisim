export interface SteamStatus {
  available: boolean;
  initialized: boolean;
  appId: number | null;
  cloudAvailable: boolean;
  cloudEnabledForAccount: boolean;
  cloudEnabledForApp: boolean;
  playerName: string | null;
}

export interface CloudSyncSummary {
  pulledSlots: number[];
  pushedSlots: number[];
  skippedSlots: number[];
}

export interface CloudFileInfo {
  name: string;
  size: number;
}

export interface ElectronSteamBridge {
  getSteamStatus: () => Promise<SteamStatus>;
  readCloudFile: (name: string) => Promise<string | null>;
  writeCloudFile: (name: string, content: string) => Promise<boolean>;
  listCloudFiles: () => Promise<CloudFileInfo[]>;
}

export const SAVE_SLOT_COUNT = 3;

export function getSaveStorageKey(slot: number) {
  return `politisim_save_${slot}`;
}

export function getCloudSaveFileName(slot: number) {
  return `politisim_slot_${slot}.json`;
}

export function parseSaveTimestamp(rawContent: string | null) {
  if (!rawContent) return 0;

  try {
    const parsed = JSON.parse(rawContent) as { savedAt?: string };
    const savedAt = parsed.savedAt ? Date.parse(parsed.savedAt) : 0;
    return Number.isFinite(savedAt) ? savedAt : 0;
  } catch {
    return 0;
  }
}

export function pickPreferredSaveSource(localContent: string | null, cloudContent: string | null) {
  if (!localContent && !cloudContent) return 'none';
  if (!localContent) return 'cloud';
  if (!cloudContent) return 'local';

  const localTimestamp = parseSaveTimestamp(localContent);
  const cloudTimestamp = parseSaveTimestamp(cloudContent);

  return cloudTimestamp > localTimestamp ? 'cloud' : 'local';
}

export async function syncCloudSaves(
  electron: ElectronSteamBridge,
  slotCount = SAVE_SLOT_COUNT
): Promise<CloudSyncSummary> {
  const summary: CloudSyncSummary = {
    pulledSlots: [],
    pushedSlots: [],
    skippedSlots: []
  };

  const status = await electron.getSteamStatus();
  if (!status.initialized || !status.cloudAvailable || !status.cloudEnabledForAccount || !status.cloudEnabledForApp) {
    summary.skippedSlots = Array.from({ length: slotCount }, (_unused, index) => index);
    return summary;
  }

  for (let slot = 0; slot < slotCount; slot += 1) {
    const localKey = getSaveStorageKey(slot);
    const cloudFile = getCloudSaveFileName(slot);
    const localContent = typeof localStorage === 'undefined' ? null : localStorage.getItem(localKey);
    const cloudContent = await electron.readCloudFile(cloudFile);
    const preferred = pickPreferredSaveSource(localContent, cloudContent);

    if (preferred === 'cloud' && cloudContent && typeof localStorage !== 'undefined') {
      localStorage.setItem(localKey, cloudContent);
      summary.pulledSlots.push(slot);
      continue;
    }

    if (preferred === 'local' && localContent) {
      const wrote = await electron.writeCloudFile(cloudFile, localContent);
      if (wrote) {
        summary.pushedSlots.push(slot);
      } else {
        summary.skippedSlots.push(slot);
      }
      continue;
    }

    summary.skippedSlots.push(slot);
  }

  return summary;
}
