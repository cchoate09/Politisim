const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('path');
const isDev = require('electron-is-dev');
const steamManager = require('./steam.cjs');

const PRELOAD_PATH = path.join(__dirname, 'preload.cjs');

function getRendererEntry() {
  return path.join(app.getAppPath(), 'dist', 'index.html');
}

function getModsRoot() {
  return app.isPackaged
    ? path.join(app.getAppPath(), 'dist', 'mods')
    : path.join(app.getAppPath(), 'public', 'mods');
}

function getModDataPath(modName) {
  const requestedName = typeof modName === 'string' && modName.trim() ? modName.trim() : 'vanilla';
  const safeModName = path.basename(requestedName);

  if (safeModName !== requestedName) {
    throw new Error(`Invalid mod name: ${modName}`);
  }

  return path.join(getModsRoot(), safeModName, 'states.json');
}

function getModManifestPath() {
  return path.join(getModsRoot(), 'manifest.json');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true
    },
    // Hide default menu bar for a cleaner game feel
    autoHideMenuBar: true, 
  });

  // Load from localhost if in Vite Dev Mode, otherwise load the built production index.html
  if (isDev) {
    void win.loadURL('http://localhost:5173');
    return;
  }

  void win.loadFile(getRendererEntry());
}

app.whenReady().then(() => {
  // Initialize Steam API Bridge
  steamManager.initializeSteam();
  steamManager.enableOverlay();

  // Handle IPC requests from React to unlock achievements
  ipcMain.handle('unlock-achievement', (_event, achievementId) => {
    return steamManager.unlockAchievement(achievementId);
  });

  ipcMain.handle('steam-status', () => {
    return steamManager.getSteamStatus();
  });

  ipcMain.handle('cloud-read-file', (_event, fileName) => {
    return steamManager.readCloudFile(fileName);
  });

  ipcMain.handle('cloud-write-file', (_event, fileName, content) => {
    return steamManager.writeCloudFile(fileName, content);
  });

  ipcMain.handle('cloud-list-files', () => {
    return steamManager.listCloudFiles();
  });

  ipcMain.handle('load-mod-data', async (_event, modName) => {
    const filePath = getModDataPath(modName);
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  });

  ipcMain.handle('list-mods', async () => {
    const manifestPath = getModManifestPath();
    const raw = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
