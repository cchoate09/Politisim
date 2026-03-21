import type { ModManifestEntry, StateElectionData } from './CampaignDataParser';

const COMMUNITY_SCENARIO_STORAGE_KEY = 'politisim_imported_scenarios_v1';

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface ImportedScenarioRecord {
  manifest: ModManifestEntry;
  states: StateElectionData[];
  importedAt: string;
  importSource: string;
  importNotes: string[];
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function sanitizeScenarioId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/_{2,}/g, '_');
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildUniqueScenarioId(
  requestedId: string,
  fallbackName: string,
  existingIds: Iterable<string>
) {
  const normalizedExisting = new Set(Array.from(existingIds, (id) => id.toLowerCase()));
  const preferredBase = sanitizeScenarioId(requestedId);
  const fallbackBase = sanitizeScenarioId(fallbackName);
  const base = preferredBase || fallbackBase || 'community_scenario';

  if (!normalizedExisting.has(base.toLowerCase())) {
    return base;
  }

  let suffix = 2;
  while (normalizedExisting.has(`${base}_${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${base}_${suffix}`;
}

function normalizeManifestShape(rawManifest: unknown): Partial<ModManifestEntry> {
  if (!rawManifest || typeof rawManifest !== 'object') {
    return {};
  }

  return rawManifest as Partial<ModManifestEntry>;
}

export function normalizeImportedScenario(
  rawManifest: unknown,
  states: StateElectionData[],
  existingIds: Iterable<string>,
  importSource: string
): ImportedScenarioRecord {
  const normalizedManifest = normalizeManifestShape(rawManifest);
  const importNotes: string[] = [];
  const rawId = typeof normalizedManifest.id === 'string' ? normalizedManifest.id : '';
  const rawName = typeof normalizedManifest.name === 'string' ? normalizedManifest.name : 'Imported Scenario';
  const stableId = buildUniqueScenarioId(rawId, rawName, existingIds);

  if (!rawId.trim()) {
    importNotes.push('Scenario id was missing, so the importer generated one from the scenario name.');
  } else if (sanitizeScenarioId(rawId) !== rawId) {
    importNotes.push(`Scenario id "${rawId}" was normalized to "${stableId}" for compatibility.`);
  } else if (stableId !== rawId) {
    importNotes.push(`Scenario id "${rawId}" was already in use, so the importer saved this copy as "${stableId}".`);
  }

  const importedAt = new Date().toISOString();
  const manifest: ModManifestEntry = {
    id: stableId,
    name: typeof normalizedManifest.name === 'string' && normalizedManifest.name.trim()
      ? normalizedManifest.name.trim()
      : 'Imported Scenario',
    yearLabel: typeof normalizedManifest.yearLabel === 'string' && normalizedManifest.yearLabel.trim()
      ? normalizedManifest.yearLabel.trim()
      : `${typeof normalizedManifest.electionYear === 'number' ? normalizedManifest.electionYear : 'Custom'}`,
    electionYear: Number.isInteger(normalizedManifest.electionYear)
      ? normalizedManifest.electionYear as number
      : new Date().getUTCFullYear(),
    tagline: typeof normalizedManifest.tagline === 'string' && normalizedManifest.tagline.trim()
      ? normalizedManifest.tagline.trim()
      : 'Community-made presidential campaign scenario.',
    description: typeof normalizedManifest.description === 'string' && normalizedManifest.description.trim()
      ? normalizedManifest.description.trim()
      : 'Imported community scenario. Open the browser details to review validation and metadata.',
    challenge: normalizedManifest.challenge === 'Accessible' || normalizedManifest.challenge === 'Competitive' || normalizedManifest.challenge === 'Hardcore'
      ? normalizedManifest.challenge
      : 'Competitive',
    focus: normalizeStringArray(normalizedManifest.focus).slice(0, 6),
    featuredStates: normalizeStringArray(normalizedManifest.featuredStates).slice(0, 8),
    specialRules: normalizeStringArray(normalizedManifest.specialRules).slice(0, 8),
    official: false,
    author: typeof normalizedManifest.author === 'string' && normalizedManifest.author.trim()
      ? normalizedManifest.author.trim()
      : 'Community Creator',
    version: typeof normalizedManifest.version === 'string' && normalizedManifest.version.trim()
      ? normalizedManifest.version.trim()
      : '1.0.0',
    minGameVersion: typeof normalizedManifest.minGameVersion === 'string' && normalizedManifest.minGameVersion.trim()
      ? normalizedManifest.minGameVersion.trim()
      : '0.4.0',
    workshopTitle: typeof normalizedManifest.workshopTitle === 'string' && normalizedManifest.workshopTitle.trim()
      ? normalizedManifest.workshopTitle.trim()
      : undefined,
    workshopSummary: typeof normalizedManifest.workshopSummary === 'string' && normalizedManifest.workshopSummary.trim()
      ? normalizedManifest.workshopSummary.trim()
      : undefined,
    workshopTags: normalizeStringArray(normalizedManifest.workshopTags).slice(0, 8),
    workshopVisibility: normalizedManifest.workshopVisibility === 'public'
      || normalizedManifest.workshopVisibility === 'unlisted'
      || normalizedManifest.workshopVisibility === 'friends_only'
      ? normalizedManifest.workshopVisibility
      : undefined,
    importSource,
    importedAt,
    importNotes
  };

  return {
    manifest,
    states,
    importedAt,
    importSource,
    importNotes
  };
}

function readRegistry(storage?: StorageLike): ImportedScenarioRecord[] {
  const target = getStorage(storage);
  if (!target) {
    return [];
  }

  try {
    const raw = target.getItem(COMMUNITY_SCENARIO_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ImportedScenarioRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read imported scenario registry:', error);
    return [];
  }
}

function writeRegistry(records: ImportedScenarioRecord[], storage?: StorageLike) {
  const target = getStorage(storage);
  if (!target) {
    return;
  }

  target.setItem(COMMUNITY_SCENARIO_STORAGE_KEY, JSON.stringify(records));
}

export function listImportedScenarios(storage?: StorageLike) {
  return readRegistry(storage);
}

export function saveImportedScenario(record: ImportedScenarioRecord, storage?: StorageLike) {
  const existing = readRegistry(storage).filter((entry) => entry.manifest.id !== record.manifest.id);
  writeRegistry([record, ...existing].sort((left, right) => right.importedAt.localeCompare(left.importedAt)), storage);
}

export function removeImportedScenario(scenarioId: string, storage?: StorageLike) {
  const remaining = readRegistry(storage).filter((entry) => entry.manifest.id !== scenarioId);
  writeRegistry(remaining, storage);
}

export function clearImportedScenarios(storage?: StorageLike) {
  const target = getStorage(storage);
  target?.removeItem(COMMUNITY_SCENARIO_STORAGE_KEY);
}

export function parseImportedScenarioBundle(raw: string) {
  return JSON.parse(raw) as unknown;
}
