import type { ModManifestEntry, StateElectionData } from './CampaignDataParser';
import {
  buildUniqueScenarioId,
  normalizeImportedScenario,
  type ImportedScenarioRecord
} from './CommunityScenarioRegistry';
import type { ScenarioCatalogEntry } from './ScenarioValidation';

const APP_NAME = 'PolitiSim';
const GAME_VERSION = '0.4.0';

export const SCENARIO_SHARE_BUNDLE_FORMAT = 'politisim-scenario-bundle';
export const SCENARIO_SHARE_BUNDLE_SCHEMA_VERSION = 1;
export const SCENARIO_SHARE_BUNDLE_EXTENSION = '.politisim-scenario.json';

export type ScenarioShareBundleType = 'scenario' | 'template';

export interface ScenarioShareBundle {
  format: typeof SCENARIO_SHARE_BUNDLE_FORMAT;
  schemaVersion: typeof SCENARIO_SHARE_BUNDLE_SCHEMA_VERSION;
  bundleType: ScenarioShareBundleType;
  exportedAt: string;
  exportSource: {
    appName: string;
    gameVersion: string;
    scenarioId: string;
    scenarioName: string;
    official: boolean;
  };
  manifest: ModManifestEntry;
  states: StateElectionData[];
  shareNotes: string[];
}

export interface ScenarioShareBundleDownload {
  fileName: string;
  content: string;
  bundle: ScenarioShareBundle;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(
    values
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
  ));
}

function buildBundleFileName(scenario: ScenarioCatalogEntry, bundleType: ScenarioShareBundleType) {
  const base = slugify(scenario.name) || scenario.id || 'scenario';
  const suffix = bundleType === 'template' ? '-template' : '-share';
  return `${base}${suffix}${SCENARIO_SHARE_BUNDLE_EXTENSION}`;
}

function buildTemplateManifest(scenario: ScenarioCatalogEntry): ModManifestEntry {
  const templateId = buildUniqueScenarioId(
    `my-${scenario.id}-template`,
    `my-${scenario.name}-template`,
    []
  );

  return {
    id: templateId,
    name: `My ${scenario.name} Remix`,
    yearLabel: `${scenario.electionYear} Template`,
    tagline: `Editable starter template inspired by ${scenario.name}.`,
    description: `A creator-ready scenario bundle based on ${scenario.name}. Replace the placeholder metadata, retune the map, and re-export it as your own community scenario.`,
    electionYear: scenario.electionYear,
    challenge: scenario.challenge,
    official: false,
    author: 'Your Name Here',
    version: '0.1.0',
    minGameVersion: GAME_VERSION,
    workshopTitle: `My ${scenario.name} Remix`,
    workshopSummary: `Community remix of ${scenario.name}. Replace this with a short publish-ready summary before sharing.`,
    workshopTags: uniqueStrings([
      'Campaign Sim',
      'Political Strategy',
      scenario.yearLabel,
      ...scenario.focus.slice(0, 3)
    ]).slice(0, 8),
    workshopVisibility: 'unlisted',
    focus: uniqueStrings([
      'Custom scenario',
      'Editable template',
      ...scenario.focus.slice(0, 3)
    ]).slice(0, 6),
    featuredStates: scenario.featuredStates?.slice(0, 6) ?? [],
    specialRules: uniqueStrings([
      'Replace the placeholder metadata before sharing',
      'Retune state leans, delegates, and turnout for your scenario premise',
      ...(scenario.specialRules ?? []).slice(0, 3)
    ]).slice(0, 6),
    importSource: undefined,
    importedAt: undefined,
    importNotes: undefined
  };
}

function buildShareNotes(scenario: ScenarioCatalogEntry, bundleType: ScenarioShareBundleType) {
  const bundleLabel = bundleType === 'template' ? 'creator template' : 'shared scenario';
  const validationNote = scenario.validation.warnings > 0
    ? `Validation note: this source scenario currently has ${scenario.validation.warnings} browser warning${scenario.validation.warnings === 1 ? '' : 's'}.`
    : 'Validation note: this source scenario exported without browser warnings.';

  return uniqueStrings([
    `Import this ${bundleLabel} from the Scenario Browser with the "Import Shared Bundle" action.`,
    bundleType === 'template'
      ? 'Update the manifest metadata, author, version, and special rules before redistributing your remix.'
      : 'This single file includes both manifest metadata and full state data for easier sharing.',
    validationNote
  ]);
}

function createBundle(
  scenario: ScenarioCatalogEntry,
  bundleType: ScenarioShareBundleType
): ScenarioShareBundle {
  const manifest: ModManifestEntry = bundleType === 'template'
    ? buildTemplateManifest(scenario)
    : {
        id: scenario.id,
        name: scenario.name,
        yearLabel: scenario.yearLabel,
        electionYear: scenario.electionYear,
        tagline: scenario.tagline,
        description: scenario.description,
        challenge: scenario.challenge,
        focus: [...scenario.focus],
        featuredStates: scenario.featuredStates ? [...scenario.featuredStates] : undefined,
        specialRules: scenario.specialRules ? [...scenario.specialRules] : undefined,
        official: Boolean(scenario.official),
        author: scenario.author,
        version: scenario.version,
        minGameVersion: scenario.minGameVersion,
        workshopTitle: scenario.workshopTitle,
        workshopSummary: scenario.workshopSummary,
        workshopTags: scenario.workshopTags ? [...scenario.workshopTags] : undefined,
        workshopVisibility: scenario.workshopVisibility
      };

  return {
    format: SCENARIO_SHARE_BUNDLE_FORMAT,
    schemaVersion: SCENARIO_SHARE_BUNDLE_SCHEMA_VERSION,
    bundleType,
    exportedAt: new Date().toISOString(),
    exportSource: {
      appName: APP_NAME,
      gameVersion: GAME_VERSION,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      official: Boolean(scenario.official)
    },
    manifest,
    states: scenario.states.map((state) => ({ ...state })),
    shareNotes: buildShareNotes(scenario, bundleType)
  };
}

function createDownload(bundle: ScenarioShareBundle, scenario: ScenarioCatalogEntry): ScenarioShareBundleDownload {
  return {
    fileName: buildBundleFileName(scenario, bundle.bundleType),
    content: JSON.stringify(bundle, null, 2),
    bundle
  };
}

export function buildScenarioShareBundleDownload(scenario: ScenarioCatalogEntry) {
  return createDownload(createBundle(scenario, 'scenario'), scenario);
}

export function buildScenarioTemplateBundleDownload(scenario: ScenarioCatalogEntry) {
  return createDownload(createBundle(scenario, 'template'), scenario);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseScenarioShareBundle(raw: string): ScenarioShareBundle {
  const parsed = JSON.parse(raw) as unknown;
  if (!isPlainObject(parsed)) {
    throw new Error('Scenario bundle must be a JSON object.');
  }

  if (parsed.format !== SCENARIO_SHARE_BUNDLE_FORMAT) {
    throw new Error('File is not a PolitiSim scenario share bundle.');
  }

  if (parsed.schemaVersion !== SCENARIO_SHARE_BUNDLE_SCHEMA_VERSION) {
    throw new Error(`Unsupported scenario bundle schema version: ${String(parsed.schemaVersion)}.`);
  }

  if (parsed.bundleType !== 'scenario' && parsed.bundleType !== 'template') {
    throw new Error('Scenario bundle is missing a valid bundle type.');
  }

  if (!isPlainObject(parsed.manifest)) {
    throw new Error('Scenario bundle is missing manifest metadata.');
  }

  if (!Array.isArray(parsed.states)) {
    throw new Error('Scenario bundle is missing state data.');
  }

  return {
    ...parsed,
    manifest: parsed.manifest as unknown as ModManifestEntry,
    states: parsed.states as unknown as StateElectionData[],
    shareNotes: Array.isArray(parsed.shareNotes)
      ? parsed.shareNotes.filter((note): note is string => typeof note === 'string')
      : []
  } as ScenarioShareBundle;
}

export function importScenarioRecordFromBundle(
  raw: string,
  existingIds: string[],
  sourceFileName: string
): ImportedScenarioRecord {
  const bundle = parseScenarioShareBundle(raw);
  const record = normalizeImportedScenario(
    bundle.manifest,
    bundle.states,
    existingIds,
    `bundle:${sourceFileName}`
  );

  const bundleNotes = uniqueStrings([
    bundle.bundleType === 'template'
      ? 'Imported from a creator template bundle.'
      : 'Imported from a shared scenario bundle.',
    bundle.exportSource.official
      ? `Original source: built-in scenario "${bundle.exportSource.scenarioName}".`
      : `Original source: community scenario "${bundle.exportSource.scenarioName}".`,
    `Bundle exported from ${bundle.exportSource.appName} ${bundle.exportSource.gameVersion}.`,
    ...bundle.shareNotes
  ]);

  record.importNotes = [...bundleNotes, ...record.importNotes];
  record.manifest.importNotes = record.importNotes;

  return record;
}
