const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('path');
const electronIsDev = require('electron-is-dev');
const steamManager = require('./steam.cjs');

const isDev = electronIsDev?.default ?? electronIsDev;

function getCliFlag(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

const PRELOAD_PATH = path.join(__dirname, 'preload.cjs');
const isSmokeTest = process.env.POLITISIM_SMOKE_TEST === '1' || process.argv.includes('--smoke-test');
const smokeReportPath = process.env.POLITISIM_SMOKE_REPORT_PATH || getCliFlag('smoke-report');
const smokeTracePath = smokeReportPath ? `${smokeReportPath}.trace.log` : null;
const smokeTimeoutMs = Number(process.env.POLITISIM_SMOKE_TIMEOUT_MS || getCliFlag('smoke-timeout-ms') || 45000);
const smokeUserDataPath = process.env.POLITISIM_SMOKE_USER_DATA || getCliFlag('smoke-user-data');
const packagedRuntimeOverride = process.env.POLITISIM_PACKAGED_RUNTIME === '1';

if (isSmokeTest) {
  app.disableHardwareAcceleration();

  if (smokeUserDataPath) {
    app.setPath('userData', smokeUserDataPath);
  }
}

function getRendererEntry() {
  return path.join(app.getAppPath(), 'dist', 'index.html');
}

function getWindowIconPath() {
  if (isBundledRuntime()) {
    return path.join(process.resourcesPath, 'icon.ico');
  }

  return path.join(app.getAppPath(), 'build', 'icon.ico');
}

function isBundledRuntime() {
  return packagedRuntimeOverride || app.isPackaged;
}

function getModsRoot() {
  return isBundledRuntime()
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

function formatSmokeError(error) {
  if (!error) return 'Unknown smoke test error';
  if (typeof error === 'string') return error;
  return error.stack || error.message || JSON.stringify(error);
}

async function writeSmokeReport(payload) {
  if (!smokeReportPath) {
    return;
  }

  await fs.mkdir(path.dirname(smokeReportPath), { recursive: true });
  await fs.writeFile(smokeReportPath, JSON.stringify(payload, null, 2), 'utf8');
}

async function appendSmokeTrace(message) {
  if (!smokeTracePath) {
    return;
  }

  await fs.mkdir(path.dirname(smokeTracePath), { recursive: true });
  await fs.appendFile(smokeTracePath, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 576,
    show: false,
    title: 'PolitiSim',
    backgroundColor: '#07111e',
    icon: getWindowIconPath(),
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true
    },
    // Hide default menu bar for a cleaner game feel
    autoHideMenuBar: true, 
  });

  win.once('ready-to-show', () => {
    if (!isSmokeTest) {
      win.show();
    }
  });

  // Load from localhost if in Vite Dev Mode, otherwise load the built production index.html
  if (isDev) {
    void win.loadURL('http://localhost:5173');
    return win;
  }

  void win.loadFile(getRendererEntry());

  return win;
}

async function runSmokeTest(win) {
  const consoleErrors = [];
  let finalized = false;
  await appendSmokeTrace('Smoke test runner started.');

  const finalize = async (success, payload, exitCode = success ? 0 : 1) => {
    if (finalized) {
      return;
    }

    finalized = true;
    await appendSmokeTrace(`Finalizing smoke test. success=${success} exitCode=${exitCode}`);
    await writeSmokeReport({
      success,
      timestamp: new Date().toISOString(),
      appVersion: app.getVersion(),
      packaged: app.isPackaged,
      rendererEntry: getRendererEntry(),
      modsRoot: getModsRoot(),
      consoleErrors,
      ...payload
    });

    setTimeout(() => {
      app.exit(exitCode);
    }, 150);
  };

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      consoleErrors.push({
        level,
        message,
        line,
        sourceId
      });
      void appendSmokeTrace(`Renderer console level ${level}: ${message}`);
    }
  });

  win.webContents.once('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    void appendSmokeTrace(`did-fail-load: ${errorCode} ${errorDescription} ${validatedURL}`);
    void finalize(false, {
      error: `Renderer failed to load (${errorCode}): ${errorDescription}`,
      validatedURL
    }, 1);
  });

  win.webContents.once('render-process-gone', (_event, details) => {
    void appendSmokeTrace(`render-process-gone: ${details.reason}`);
    void finalize(false, {
      error: `Renderer process exited unexpectedly: ${details.reason}`,
      details
    }, 1);
  });

  const timeout = setTimeout(() => {
    void appendSmokeTrace(`Smoke test timeout fired after ${smokeTimeoutMs}ms.`);
    void finalize(false, {
      error: `Smoke test timed out after ${smokeTimeoutMs}ms`
    }, 1);
  }, smokeTimeoutMs);

  try {
    if (win.webContents.isLoadingMainFrame()) {
      await appendSmokeTrace('Waiting for did-finish-load.');
      await new Promise((resolve) => win.webContents.once('did-finish-load', resolve));
    }

    await appendSmokeTrace('Renderer finished loading. Starting renderer-side checks.');

    const resetToFreshSession = await win.webContents.executeJavaScript(`(() => {
      const text = document.body?.innerText ?? '';
      const needsReset = text.includes('PolitiSim Command');
      if (needsReset) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
      }
      return needsReset;
    })()`, true);

    if (resetToFreshSession) {
      await appendSmokeTrace('Existing campaign state detected. Reloading into a clean candidate-creator session.');
      await new Promise((resolve) => win.webContents.once('did-finish-load', resolve));
    }

    const smokeResult = await win.webContents.executeJavaScript(`(async () => {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const visibleText = () => document.body?.innerText ?? '';
      const waitFor = async (predicate, label, timeoutMs = 12000) => {
        const started = Date.now();
        while (Date.now() - started < timeoutMs) {
          if (predicate()) {
            return;
          }
          await sleep(100);
        }
        throw new Error(\`Timed out waiting for \${label}. Current text: \${visibleText().slice(0, 900)}\`);
      };

      const clickButton = (labelFragment) => {
        const button = Array.from(document.querySelectorAll('button'))
          .find((entry) => entry.innerText.includes(labelFragment));
        if (!button) {
          return false;
        }
        button.click();
        return true;
      };

      const fillInput = (placeholderFragment, value) => {
        const input = Array.from(document.querySelectorAll('input'))
          .find((entry) => (entry.placeholder ?? '').includes(placeholderFragment));
        if (!input) {
          return false;
        }
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };

      const getStartCampaignState = () => {
        const launchButton = document.querySelector('.start-campaign-btn');
        if (!launchButton) {
          return 'missing';
        }

        if (launchButton.disabled) {
          return launchButton.innerText.trim() || 'disabled';
        }

        return 'ready';
      };

      const clickStartCampaign = () => {
        const launchButton = document.querySelector('.start-campaign-btn');
        if (!launchButton || launchButton.disabled) {
          return false;
        }

        launchButton.click();
        return true;
      };

      const clickFirstSlotSave = () => {
        const firstSaveButton = document.querySelector('.save-slot-card .save-slot-actions button');
        if (!firstSaveButton) {
          return false;
        }
        firstSaveButton.click();
        return true;
      };

      await waitFor(() => visibleText().includes('Establish Your Platform'), 'candidate creator');

      if (!window.electron) {
        throw new Error('window.electron was not exposed to the renderer');
      }

      const requiredMethods = [
        'unlockAchievement',
        'getSteamStatus',
        'readCloudFile',
        'writeCloudFile',
        'listCloudFiles',
        'loadModData',
        'listMods'
      ];
      const missingMethods = requiredMethods.filter((methodName) => typeof window.electron[methodName] !== 'function');
      if (missingMethods.length > 0) {
        throw new Error(\`Missing preload methods: \${missingMethods.join(', ')}\`);
      }

      const mods = await window.electron.listMods();
      if (!Array.isArray(mods) || mods.length < 1) {
        throw new Error('No scenarios were returned from listMods()');
      }

      const vanillaStates = await window.electron.loadModData('vanilla');
      if (!Array.isArray(vanillaStates) || vanillaStates.length < 51) {
        throw new Error(\`Vanilla scenario load returned \${Array.isArray(vanillaStates) ? vanillaStates.length : 'invalid'} states\`);
      }

      const steamStatus = await window.electron.getSteamStatus();
      const cloudListing = await window.electron.listCloudFiles();

      localStorage.setItem('politisim_tutorial_complete', 'true');
      fillInput('Enter your name', 'Smoke Test Candidate');

      for (const issue of ['Economy', 'Healthcare', 'Education']) {
        if (!clickButton(issue)) {
          throw new Error(\`Could not select issue button: \${issue}\`);
        }
        await sleep(75);
      }

      await waitFor(() => getStartCampaignState() !== 'missing', 'launch button');
      await sleep(150);
      const launchState = getStartCampaignState();
      if (launchState !== 'ready') {
        throw new Error(\`Launch button was not ready. Current state: \${launchState}. Screen text: \${visibleText().slice(0, 1400)}\`);
      }

      if (!clickStartCampaign()) {
        throw new Error(\`Launch button click failed unexpectedly. Screen text: \${visibleText().slice(0, 1400)}\`);
      }

      await waitFor(() => visibleText().includes('National Dashboard') && visibleText().includes('PolitiSim Command'), 'command center');

      if (!clickButton('Save / Load')) {
        throw new Error('Could not open save slots');
      }

      await waitFor(() => visibleText().includes('Slot 1'), 'save slots');
      if (!clickFirstSlotSave()) {
        throw new Error('Could not save into slot 1');
      }

      await waitFor(() => !document.querySelector('.save-slot-list'), 'save drawer close', 4000);
      if (!clickButton('Save / Load')) {
        throw new Error('Could not reopen save slots');
      }
      await waitFor(() => visibleText().includes('Slot 1'), 'save slots reopened');

      const firstSlotText = document.querySelector('.save-slot-card')?.innerText ?? '';
      if (firstSlotText.includes('Empty')) {
        throw new Error('Slot 1 still reports empty after saving');
      }
      clickButton('Close');

      if (!clickButton('Primary Election')) {
        throw new Error('Could not open Primary Election tab');
      }
      await waitFor(() => visibleText().includes('Primary Election Tracker'), 'primary tracker');

      const rivalCandidates = [
        'Sec. Daniel Mercer',
        'Sen. Marcus Reed',
        'Mayor Elena Cho',
        'Gov. Rebecca Sloan'
      ];
      const rivalsPresent = rivalCandidates.filter((candidateName) => visibleText().includes(candidateName));
      const playerPresent = visibleText().includes('Smoke Test Candidate') || visibleText().includes('Candidate');
      if (!playerPresent || rivalsPresent.length < rivalCandidates.length) {
        throw new Error(\`Primary field did not render the full field. Player visible: \${playerPresent}. Rivals: \${rivalsPresent.join(', ')}\`);
      }

      if (!clickButton('Analytics & Polling')) {
        throw new Error('Could not open Analytics & Polling tab');
      }
      await waitFor(() => visibleText().includes('Campaign Data Center') && visibleText().includes('National Primary Field'), 'analytics dashboard');

      if (!clickButton('Campaign HQ & Staff')) {
        throw new Error('Could not open Campaign HQ tab');
      }
      await waitFor(() => visibleText().includes('Campaign HQ & Coalition') && visibleText().includes('Field Operations Network'), 'campaign HQ');

      return {
        steps: [
          'candidate_creator_loaded',
          'preload_ipc_verified',
          'scenario_assets_loaded',
          'campaign_started',
          'save_slot_written',
          'primary_view_rendered',
          'analytics_rendered',
          'campaign_hq_rendered'
        ],
        modCount: mods.length,
        scenarioIds: mods.map((entry) => entry.id),
        vanillaStateCount: vanillaStates.length,
        playerPresent,
        rivalsPresent,
        steamStatus,
        cloudListingCount: Array.isArray(cloudListing) ? cloudListing.length : -1
      };
    })()`, true);

    clearTimeout(timeout);
    await appendSmokeTrace('Renderer-side smoke checks completed successfully.');
    await finalize(true, smokeResult, 0);
  } catch (error) {
    clearTimeout(timeout);
    await appendSmokeTrace(`Smoke test failed in try/catch: ${formatSmokeError(error)}`);
    await finalize(false, {
      error: formatSmokeError(error)
    }, 1);
  }
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

  const win = createWindow();

  if (isSmokeTest) {
    void runSmokeTest(win);
  }
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
