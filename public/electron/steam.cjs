const steamworks = require('steamworks.js');

let client = null;
let currentAppId = null;
let overlayEnabled = false;

function resolveSteamAppId() {
  const configuredAppId = Number(process.env.POLITISIM_STEAM_APP_ID);

  if (Number.isInteger(configuredAppId) && configuredAppId > 0) {
    return configuredAppId;
  }

  if (process.env.NODE_ENV === 'development') {
    return 480;
  }

  return null;
}

function initializeSteam() {
  const appId = resolveSteamAppId();
  currentAppId = appId;

  if (!appId) {
    console.warn('[Steamworks] Skipping Steam initialization because POLITISIM_STEAM_APP_ID is not configured.');
    return false;
  }

  try {
    client = steamworks.init(appId);
    console.log("[Steamworks] Successfully initialized Steam API.");
    return true;
  } catch (err) {
    console.error(`[Steamworks] Error initializing Steam API. Is Steam running?`, err);
    return false;
  }
}

function unlockAchievement(achievementId) {
  if (!client) return false;
  try {
    if (!client.achievement.isActivated(achievementId)) {
      client.achievement.activate(achievementId);
      console.log(`[Steamworks] Achievement Unlocked: ${achievementId}`);
      return true;
    }
  } catch (err) {
    console.error(`[Steamworks] Error unlocking achievement ${achievementId}:`, err);
  }
  return false;
}

function enableOverlay() {
  if (overlayEnabled) {
    return true;
  }

  try {
    if (typeof steamworks.electronEnableSteamOverlay === 'function') {
      steamworks.electronEnableSteamOverlay();
      overlayEnabled = true;
      return true;
    }
  } catch (err) {
    console.error('[Steamworks] Error enabling Steam overlay integration:', err);
  }

  return false;
}

function canUseCloud() {
  return Boolean(
    client
    && client.cloud
    && client.cloud.isEnabledForApp()
    && client.cloud.isEnabledForAccount()
  );
}

function getSteamStatus() {
  return {
    available: true,
    initialized: Boolean(client),
    appId: currentAppId,
    cloudAvailable: Boolean(client?.cloud),
    cloudEnabledForAccount: Boolean(client?.cloud?.isEnabledForAccount?.()),
    cloudEnabledForApp: Boolean(client?.cloud?.isEnabledForApp?.()),
    playerName: client?.localplayer?.getName?.() ?? null
  };
}

function readCloudFile(name) {
  if (!canUseCloud()) {
    return null;
  }

  try {
    if (!client.cloud.fileExists(name)) {
      return null;
    }
    return client.cloud.readFile(name);
  } catch (err) {
    console.error(`[Steamworks] Error reading cloud file ${name}:`, err);
    return null;
  }
}

function writeCloudFile(name, content) {
  if (!canUseCloud()) {
    return false;
  }

  try {
    return client.cloud.writeFile(name, content);
  } catch (err) {
    console.error(`[Steamworks] Error writing cloud file ${name}:`, err);
    return false;
  }
}

function listCloudFiles() {
  if (!canUseCloud()) {
    return [];
  }

  try {
    return client.cloud.listFiles().map((entry) => ({
      name: entry.name,
      size: Number(entry.size)
    }));
  } catch (err) {
    console.error('[Steamworks] Error listing cloud files:', err);
    return [];
  }
}

module.exports = {
  enableOverlay,
  getSteamStatus,
  initializeSteam,
  unlockAchievement,
  readCloudFile,
  writeCloudFile,
  listCloudFiles
};
