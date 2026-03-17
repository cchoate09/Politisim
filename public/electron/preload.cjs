const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  unlockAchievement: (achievementId) => ipcRenderer.invoke('unlock-achievement', achievementId),
  loadModData: (modName) => ipcRenderer.invoke('load-mod-data', modName),
  listMods: () => ipcRenderer.invoke('list-mods'),
});
