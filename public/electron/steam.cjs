const steamworks = require('steamworks.js');

let client = null;

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

module.exports = {
  initializeSteam,
  unlockAchievement
};
