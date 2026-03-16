const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const steamManager = require('./steam.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Temporary for easy port migration, can secure later
    },
    // Hide default menu bar for a cleaner game feel
    autoHideMenuBar: true, 
  });

  // Load from localhost if in Vite Dev Mode, otherwise load the built production index.html
  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '../dist/index.html')}`
  );
}

app.whenReady().then(() => {
  // Initialize Steam API Bridge
  steamManager.initializeSteam();

  // Handle IPC requests from React to unlock achievements
  ipcMain.handle('unlock-achievement', (event, achievementId) => {
    return steamManager.unlockAchievement(achievementId);
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
