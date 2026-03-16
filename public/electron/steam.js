const steamworks = require('steamworks.js');

let client = null;

function initializeSteam() {
  try {
    // 480 is the "Spacewar" app ID used for Steamworks testing globally.
    // Replace with the actual Politisim App ID before launch.
    client = steamworks.init(480);
    console.log("[Steamworks] Successfully initialized Steam API.");
  } catch (err) {
    console.error(`[Steamworks] Error initializing Steam API. Is Steam running?`, err);
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
