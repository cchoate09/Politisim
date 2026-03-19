import type { ModManifestEntry, StateElectionData } from './CampaignDataParser';
import { normalizeImportedScenario, parseImportedScenarioBundle, type ImportedScenarioRecord } from './CommunityScenarioRegistry';

interface FileLike {
  name: string;
  webkitRelativePath?: string;
  text: () => Promise<string>;
}

interface ScenarioFolderFiles {
  folderName: string;
  manifestFile: FileLike;
  statesFile: FileLike;
}

function getDirectorySegments(file: FileLike) {
  const relativePath = file.webkitRelativePath || file.name;
  const parts = relativePath.split('/').filter(Boolean);
  return parts.slice(0, -1);
}

function pickScenarioFolder(files: FileLike[]): ScenarioFolderFiles {
  const manifestCandidates = files.filter((file) => file.name.toLowerCase() === 'manifest.json');
  const statesCandidates = files.filter((file) => file.name.toLowerCase() === 'states.json');

  if (manifestCandidates.length === 0 || statesCandidates.length === 0) {
    throw new Error('The selected folder must include both a manifest.json file and a states.json file.');
  }

  for (const manifestFile of manifestCandidates) {
    const manifestDir = getDirectorySegments(manifestFile).join('/');
    const matchingStates = statesCandidates.find((candidate) => getDirectorySegments(candidate).join('/') === manifestDir);
    if (matchingStates) {
      const folderName = manifestDir.split('/').filter(Boolean).at(-1) || 'community_scenario';
      return {
        folderName,
        manifestFile,
        statesFile: matchingStates
      };
    }
  }

  const fallbackManifest = manifestCandidates[0];
  const fallbackStates = statesCandidates[0];
  const folderName = getDirectorySegments(fallbackStates).join('/').split('/').filter(Boolean).at(-1) || 'community_scenario';

  return {
    folderName,
    manifestFile: fallbackManifest,
    statesFile: fallbackStates
  };
}

function normalizeManifestPayload(rawManifest: unknown, folderName: string) {
  if (Array.isArray(rawManifest)) {
    if (rawManifest.length !== 1) {
      throw new Error('Import one scenario folder at a time. The selected manifest contains multiple scenario entries.');
    }

    return rawManifest[0];
  }

  if (!rawManifest || typeof rawManifest !== 'object') {
    throw new Error('manifest.json must contain a single scenario object.');
  }

  const manifestObject = rawManifest as Partial<ModManifestEntry>;
  if (!manifestObject.id && !manifestObject.name) {
    return {
      ...manifestObject,
      id: folderName,
      name: folderName.replace(/[_-]+/g, ' ')
    };
  }

  return manifestObject;
}

export async function importScenarioFromFiles(
  files: FileLike[],
  existingIds: string[]
): Promise<ImportedScenarioRecord> {
  if (files.length === 0) {
    throw new Error('No files were selected for import.');
  }

  const { folderName, manifestFile, statesFile } = pickScenarioFolder(files);
  const [manifestRaw, statesRaw] = await Promise.all([
    manifestFile.text(),
    statesFile.text()
  ]);

  const manifestPayload = normalizeManifestPayload(parseImportedScenarioBundle(manifestRaw), folderName);
  const states = parseImportedScenarioBundle(statesRaw) as StateElectionData[];

  if (!Array.isArray(states)) {
    throw new Error('states.json must contain an array of jurisdiction records.');
  }

  return normalizeImportedScenario(manifestPayload, states, existingIds, `folder:${folderName}`);
}
