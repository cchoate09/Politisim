import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function record(results, status, message) {
  results.push({ status, message });
}

async function run() {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = await readJson(packageJsonPath);
  const releaseRoot = path.join(projectRoot, packageJson.build?.directories?.output ?? 'release');
  const smokeReportPath = path.join(releaseRoot, 'smoke', 'packaged-smoke-report.json');
  const readinessReportPath = path.join(releaseRoot, 'smoke', 'release-readiness.json');
  const executablePath = path.join(releaseRoot, 'win-unpacked', `${packageJson.build?.productName ?? 'PolitiSim'}.exe`);
  const results = [];
  let blockingFailures = 0;

  const requirePath = async (relativePath, message) => {
    const fullPath = path.join(projectRoot, relativePath);
    if (await exists(fullPath)) {
      record(results, 'pass', message);
      return fullPath;
    }

    blockingFailures += 1;
    record(results, 'fail', `${message} Missing: ${fullPath}`);
    return null;
  };

  if (packageJson.build?.appId && packageJson.build?.productName) {
    record(results, 'pass', `Electron builder metadata is set for ${packageJson.build.productName} (${packageJson.build.appId}).`);
  } else {
    blockingFailures += 1;
    record(results, 'fail', 'Electron builder metadata is incomplete. productName and appId must both be set.');
  }

  if (packageJson.build?.directories?.output === 'release') {
    record(results, 'pass', 'Packaged builds are routed to the dedicated release directory.');
  } else {
    blockingFailures += 1;
    record(results, 'fail', 'Packaged builds are not isolated from the renderer dist output. Set build.directories.output to release.');
  }

  await requirePath('dist/index.html', 'Renderer build exists.');
  await requirePath('dist/mods/manifest.json', 'Scenario manifest is present in the packaged renderer assets.');
  await requirePath('dist/geo/us-states-10m.json', 'Offline geo asset is present in the packaged renderer assets.');
  await requirePath('public/electron/main.cjs', 'Electron main process entry exists.');
  await requirePath('public/electron/preload.cjs', 'Electron preload bridge exists.');
  await requirePath('public/electron/steam.cjs', 'Steam bridge exists.');
  await requirePath('.github/workflows/ci.yml', 'CI workflow is present.');
  await requirePath('docs/STEAM_RELEASE_CHECKLIST.md', 'Steam release checklist doc is present.');

  if (await exists(executablePath)) {
    record(results, 'pass', `Packaged executable exists at ${executablePath}.`);
  } else {
    blockingFailures += 1;
    record(results, 'fail', `Packaged executable was not found at ${executablePath}.`);
  }

  if (await exists(smokeReportPath)) {
    const smokeReport = await readJson(smokeReportPath);
    if (smokeReport.success) {
      record(results, 'pass', `Packaged smoke test passed with ${smokeReport.steps?.length ?? 0} verified steps.`);
    } else {
      blockingFailures += 1;
      record(results, 'fail', `Packaged smoke report exists but failed: ${smokeReport.error ?? 'unknown error'}`);
    }
  } else {
    blockingFailures += 1;
    record(results, 'fail', `Packaged smoke report is missing: ${smokeReportPath}`);
  }

  const windowsIconCandidates = [
    path.join(projectRoot, 'build', 'icon.ico'),
    path.join(projectRoot, 'public', 'electron', 'icon.ico'),
    path.join(projectRoot, 'public', 'icon.ico')
  ];
  const hasWindowsIcon = await Promise.all(windowsIconCandidates.map(exists)).then((values) => values.some(Boolean));
  if (hasWindowsIcon) {
    record(results, 'pass', 'A Windows .ico asset is present for branded installers.');
  } else {
    record(results, 'warn', 'No Windows .ico asset was found. The build will package, but it will not look release-grade on Steam until a branded icon is added.');
  }

  const configuredSteamAppId = Number(process.env.POLITISIM_STEAM_APP_ID);
  if (Number.isInteger(configuredSteamAppId) && configuredSteamAppId > 0) {
    record(results, 'pass', `POLITISIM_STEAM_APP_ID is set to ${configuredSteamAppId} for release validation.`);
  } else {
    record(results, 'warn', 'POLITISIM_STEAM_APP_ID is not set for this verification run. Local smoke is valid, but production Steam overlay/cloud validation still needs a real app id pass.');
  }

  await fs.mkdir(path.dirname(readinessReportPath), { recursive: true });
  await fs.writeFile(readinessReportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    blockingFailures,
    results
  }, null, 2), 'utf8');

  results.forEach((entry) => {
    const prefix = entry.status === 'pass' ? '[pass]' : entry.status === 'warn' ? '[warn]' : '[fail]';
    console.log(`${prefix} ${entry.message}`);
  });

  console.log(`Release readiness report written to ${readinessReportPath}`);

  if (blockingFailures > 0) {
    throw new Error(`Release readiness verification found ${blockingFailures} blocking issue(s).`);
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
