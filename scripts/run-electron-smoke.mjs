import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const projectRoot = process.cwd();

function parseArg(flag) {
  const entry = process.argv.find((argument) => argument.startsWith(`${flag}=`));
  return entry ? entry.slice(flag.length + 1) : null;
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function loadPackageJson() {
  const raw = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8');
  return JSON.parse(raw);
}

function getExecutableName(productName) {
  if (process.platform === 'win32') {
    return `${productName}.exe`;
  }

  if (process.platform === 'darwin') {
    return `${productName}.app`;
  }

  return productName;
}

async function resolveExecutablePath() {
  const packageJson = await loadPackageJson();
  const productName = packageJson.build?.productName ?? packageJson.name;
  const releaseRoot = parseArg('--release-root')
    ?? path.join(projectRoot, packageJson.build?.directories?.output ?? 'release');
  const explicitApp = parseArg('--app');

  if (explicitApp) {
    return path.resolve(projectRoot, explicitApp);
  }

  const executableName = getExecutableName(productName);
  const candidates = [
    path.join(releaseRoot, 'win-unpacked', executableName),
    path.join(releaseRoot, executableName)
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find a packaged executable. Looked for: ${candidates.join(', ')}`
  );
}

function getElectronBinaryPath() {
  if (process.platform === 'win32') {
    return path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
  }

  if (process.platform === 'darwin') {
    return path.join(projectRoot, 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
  }

  return path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron');
}

async function run() {
  const executablePath = await resolveExecutablePath();
  const launchMode = parseArg('--launcher') ?? 'electron';
  const releaseArtifactsDir = path.join(projectRoot, 'release', 'smoke');
  const reportPath = parseArg('--report') ?? path.join(releaseArtifactsDir, 'packaged-smoke-report.json');
  const logPath = path.join(releaseArtifactsDir, 'packaged-smoke.log');
  const tracePath = `${reportPath}.trace.log`;
  const smokeUserDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'politisim-smoke-'));
  const timeoutMs = Number(parseArg('--timeout-ms') ?? 90000);

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.rm(reportPath, { force: true });
  await fs.rm(logPath, { force: true });
  await fs.rm(tracePath, { force: true });

  const childArgs = [
    '--smoke-test',
    `--smoke-report=${reportPath}`,
    `--smoke-timeout-ms=45000`,
    `--smoke-user-data=${smokeUserDataDir}`
  ];

  const packagedAsarPath = path.join(path.dirname(executablePath), 'resources', 'app.asar');
  const electronBinaryPath = getElectronBinaryPath();
  const command = launchMode === 'exe' ? executablePath : electronBinaryPath;
  const args = launchMode === 'exe' ? childArgs : [packagedAsarPath, ...childArgs];

  if (launchMode === 'electron' && !(await exists(packagedAsarPath))) {
    throw new Error(`Could not find packaged app.asar at ${packagedAsarPath}`);
  }

  if (launchMode === 'electron' && !(await exists(electronBinaryPath))) {
    throw new Error(`Could not find Electron runtime at ${electronBinaryPath}`);
  }

  const child = spawn(command, args, {
    cwd: launchMode === 'exe' ? path.dirname(executablePath) : projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ELECTRON_IS_DEV: '0',
      POLITISIM_PACKAGED_RUNTIME: '1',
      POLITISIM_SMOKE_TEST: '1',
      POLITISIM_SMOKE_REPORT_PATH: reportPath,
      POLITISIM_SMOKE_TIMEOUT_MS: '45000',
      POLITISIM_SMOKE_USER_DATA: smokeUserDataDir
    },
    windowsHide: true
  });

  let combinedLog = '';
  child.stdout.on('data', (chunk) => {
    combinedLog += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    combinedLog += chunk.toString();
  });

  const exitCode = await new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      child.kill();
      reject(new Error(`Packaged Electron smoke test timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timeoutHandle);
      resolve(code ?? 0);
    });
  });

  await fs.writeFile(logPath, combinedLog, 'utf8');

  if (!(await exists(reportPath))) {
    throw new Error(`Packaged app exited without writing a smoke report. See ${logPath} and ${tracePath}`);
  }

  const rawReport = await fs.readFile(reportPath, 'utf8');
  const report = JSON.parse(rawReport);

  if (exitCode !== 0 || !report.success) {
    throw new Error(
      [
        `Packaged Electron smoke test failed with exit code ${exitCode}.`,
        report.error ? `Error: ${report.error}` : null,
        report.consoleErrors?.length ? `Console errors: ${report.consoleErrors.map((entry) => entry.message).join(' | ')}` : null,
        `Report: ${reportPath}`,
        `Log: ${logPath}`,
        `Trace: ${tracePath}`
      ].filter(Boolean).join('\n')
    );
  }

  console.log('[electron-smoke] Packaged app booted successfully.');
  console.log(`[electron-smoke] Launcher: ${launchMode}`);
  console.log(`[electron-smoke] Renderer: ${report.rendererEntry}`);
  console.log(`[electron-smoke] Scenarios: ${report.modCount} (${report.scenarioIds.join(', ')})`);
  console.log(`[electron-smoke] Vanilla states: ${report.vanillaStateCount}`);
  console.log(`[electron-smoke] Verified steps: ${report.steps.join(', ')}`);
  console.log(`[electron-smoke] Report written to ${reportPath}`);

  await fs.rm(smokeUserDataDir, { recursive: true, force: true });
}

run().catch(async (error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
