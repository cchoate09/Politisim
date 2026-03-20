const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  runtimeFlags: {
    isSmokeTest: process.env.POLITISIM_SMOKE_TEST === '1'
  },
  unlockAchievement: (achievementId) => ipcRenderer.invoke('unlock-achievement', achievementId),
  getSteamStatus: () => ipcRenderer.invoke('steam-status'),
  readCloudFile: (fileName) => ipcRenderer.invoke('cloud-read-file', fileName),
  writeCloudFile: (fileName, content) => ipcRenderer.invoke('cloud-write-file', fileName, content),
  listCloudFiles: () => ipcRenderer.invoke('cloud-list-files'),
  loadModData: (modName) => ipcRenderer.invoke('load-mod-data', modName),
  listMods: () => ipcRenderer.invoke('list-mods'),
});
