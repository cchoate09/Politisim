import type { ModManifestEntry } from './CampaignDataParser';
import {
  buildScenarioShareBundleDownload,
  type ScenarioShareBundle
} from './ScenarioExchange';
import type { ScenarioCatalogEntry, ScenarioValidationFinding } from './ScenarioValidation';

export const SCENARIO_WORKSHOP_KIT_FORMAT = 'politisim-workshop-publish-kit';
export const SCENARIO_WORKSHOP_KIT_SCHEMA_VERSION = 1;
export const SCENARIO_WORKSHOP_KIT_EXTENSION = '.politisim-workshop.json';

export type ScenarioWorkshopStatus = 'launch_ready' | 'needs_polish' | 'blocked';
export type ScenarioWorkshopVisibility = 'public' | 'unlisted' | 'friends_only';

export interface ScenarioWorkshopChecklistItem {
  label: string;
  met: boolean;
  severity: 'blocker' | 'warning' | 'info';
}

export interface ScenarioWorkshopReadiness {
  score: number;
  status: ScenarioWorkshopStatus;
  summary: string;
  checklist: ScenarioWorkshopChecklistItem[];
  blockers: string[];
  cautions: string[];
  highlights: string[];
}

export interface ScenarioWorkshopMetadata {
  title: string;
  shortDescription: string;
  longDescription: string;
  tags: string[];
  visibility: ScenarioWorkshopVisibility;
  compatibilityLine: string;
  releaseNotesTemplate: string[];
  previewChecklist: string[];
  creatorChecklist: string[];
}

export interface ScenarioWorkshopPreview {
  readiness: ScenarioWorkshopReadiness;
  metadata: ScenarioWorkshopMetadata;
}

export interface ScenarioWorkshopPublishKit {
  format: typeof SCENARIO_WORKSHOP_KIT_FORMAT;
  schemaVersion: typeof SCENARIO_WORKSHOP_KIT_SCHEMA_VERSION;
  exportedAt: string;
  scenarioId: string;
  scenarioName: string;
  official: boolean;
  metadata: ScenarioWorkshopMetadata;
  readiness: ScenarioWorkshopReadiness;
  manifest: ModManifestEntry;
  validationFindings: ScenarioValidationFinding[];
  shareBundleFileName: string;
  shareBundle: ScenarioShareBundle;
}

export interface ScenarioWorkshopDownload {
  fileName: string;
  content: string;
  kit: ScenarioWorkshopPublishKit;
}

export interface ScenarioWorkshopBriefDownload {
  fileName: string;
  content: string;
  preview: ScenarioWorkshopPreview;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return Array.from(new Set(
    values
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
  ));
}

function titleCaseTag(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getVisibilityForScenario(scenario: ScenarioCatalogEntry): ScenarioWorkshopVisibility {
  if (scenario.validation.errors > 0) {
    return 'friends_only';
  }

  if (scenario.validation.warnings > 2) {
    return 'unlisted';
  }

  if (scenario.official) {
    return 'unlisted';
  }

  return 'public';
}

function buildWorkshopTags(scenario: ScenarioCatalogEntry) {
  const phaseTag = scenario.challenge === 'Hardcore'
    ? 'Hardcore Challenge'
    : scenario.challenge === 'Accessible'
      ? 'Accessible Start'
      : 'Competitive Run';

  return uniqueStrings([
    'Campaign Sim',
    'Political Strategy',
    scenario.yearLabel,
    phaseTag,
    scenario.official ? 'Official Scenario' : 'Community Scenario',
    ...scenario.focus.slice(0, 4).map(titleCaseTag)
  ]).slice(0, 8);
}

function buildShortDescription(scenario: ScenarioCatalogEntry) {
  const summary = scenario.workshopSummary?.trim() || scenario.tagline?.trim() || scenario.description?.trim() || scenario.name;
  return summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary;
}

function buildLongDescription(scenario: ScenarioCatalogEntry, visibility: ScenarioWorkshopVisibility) {
  const focusLine = scenario.focus.length > 0
    ? `Strategic focus: ${scenario.focus.join(', ')}.`
    : 'Strategic focus: broad modern presidential campaign play.';
  const featuredLine = scenario.featuredStates && scenario.featuredStates.length > 0
    ? `Featured battlegrounds: ${scenario.featuredStates.join(', ')}.`
    : 'Featured battlegrounds: none declared, so the map plays as a broader national test.';
  const rulesLine = scenario.specialRules && scenario.specialRules.length > 0
    ? `Special rules: ${scenario.specialRules.join(' | ')}.`
    : 'Special rules: standard national ruleset with scenario-specific demographics and calendar data.';
  const visibilityLine = visibility === 'public'
    ? 'Publishing lane: suitable for a public Workshop launch once art and copy are ready.'
    : visibility === 'unlisted'
      ? 'Publishing lane: best shared unlisted first while you gather notes, screenshots, and patch feedback.'
      : 'Publishing lane: keep this to private/friends-only circulation until blocking validation issues are fixed.';

  return [
    scenario.description.trim(),
    focusLine,
    featuredLine,
    rulesLine,
    visibilityLine
  ].filter(Boolean).join('\n\n');
}

function buildReadiness(scenario: ScenarioCatalogEntry, metadata: ScenarioWorkshopMetadata): ScenarioWorkshopReadiness {
  const checklist: ScenarioWorkshopChecklistItem[] = [
    { label: 'No blocking validation errors', met: scenario.validation.errors === 0, severity: 'blocker' },
    { label: 'Warning count is under control', met: scenario.validation.warnings <= 2, severity: 'warning' },
    { label: 'Author metadata is present', met: Boolean(scenario.author?.trim()), severity: 'warning' },
    { label: 'Version metadata is present', met: Boolean(scenario.version?.trim()), severity: 'warning' },
    { label: 'Compatibility target is declared', met: Boolean(scenario.minGameVersion?.trim()), severity: 'info' },
    { label: 'Workshop copy is presentation-ready', met: metadata.shortDescription.length >= 24 && metadata.longDescription.length >= 140, severity: 'warning' },
    { label: 'Scenario tags explain the lane', met: scenario.focus.length >= 2, severity: 'info' },
    { label: 'Marquee states or special rules are named', met: Boolean(scenario.featuredStates?.length) || Boolean(scenario.specialRules?.length), severity: 'info' }
  ];

  const metBlockers = checklist.filter((item) => item.severity === 'blocker' && item.met).length;
  const totalBlockers = checklist.filter((item) => item.severity === 'blocker').length;
  const metWarnings = checklist.filter((item) => item.severity === 'warning' && item.met).length;
  const totalWarnings = checklist.filter((item) => item.severity === 'warning').length;
  const metInfos = checklist.filter((item) => item.severity === 'info' && item.met).length;
  const totalInfos = checklist.filter((item) => item.severity === 'info').length;
  const weightedScore = Math.round(
    ((metBlockers / Math.max(1, totalBlockers)) * 50)
    + ((metWarnings / Math.max(1, totalWarnings)) * 30)
    + ((metInfos / Math.max(1, totalInfos)) * 20)
  );

  const status: ScenarioWorkshopStatus = scenario.validation.errors > 0
    ? 'blocked'
    : scenario.validation.warnings > 2
      ? 'needs_polish'
      : 'launch_ready';

  const blockers = checklist
    .filter((item) => !item.met && item.severity === 'blocker')
    .map((item) => item.label);
  const cautions = checklist
    .filter((item) => !item.met && item.severity !== 'blocker')
    .map((item) => item.label);
  const highlights = checklist
    .filter((item) => item.met)
    .slice(0, 4)
    .map((item) => item.label);

  const summary = status === 'blocked'
    ? 'Fix blocking validation problems before publishing or distributing this scenario widely.'
    : status === 'needs_polish'
      ? 'The scenario is shareable, but it still wants metadata or polish before a broad Workshop-style release.'
      : 'The scenario clears the Workshop-prep checklist and is ready for a public-facing package once screenshots are prepared.';

  return {
    score: clamp(weightedScore),
    status,
    summary,
    checklist,
    blockers,
    cautions,
    highlights
  };
}

export function buildScenarioWorkshopPreview(scenario: ScenarioCatalogEntry): ScenarioWorkshopPreview {
  const visibility = getVisibilityForScenario(scenario);
  const metadata: ScenarioWorkshopMetadata = {
    title: scenario.workshopTitle?.trim() || `${scenario.name} (${scenario.yearLabel})`,
    shortDescription: buildShortDescription(scenario),
    longDescription: buildLongDescription(scenario, visibility),
    tags: scenario.workshopTags && scenario.workshopTags.length > 0
      ? uniqueStrings(scenario.workshopTags).slice(0, 8)
      : buildWorkshopTags(scenario),
    visibility,
    compatibilityLine: `Built for PolitiSim ${scenario.minGameVersion ?? '0.4.0+'} | Scenario version ${scenario.version ?? '1.0.0'} | ${scenario.validation.stats.totalEV} EV across ${scenario.validation.stats.jurisdictionCount} jurisdictions`,
    releaseNotesTemplate: [
      `Version ${scenario.version ?? '1.0.0'}: initial Workshop-style package for ${scenario.name}.`,
      'Retuned battleground balance, delegate pacing, and scenario metadata for shareable release.',
      'Recommended next patch note: describe any state-map edits, event-pool changes, or rival-roster changes here.'
    ],
    previewChecklist: [
      '1 capsule or cover image showing the scenario title and year',
      '1 map screenshot showing the featured battleground lane',
      '1 candidate setup screenshot highlighting the scenario briefing and special rules',
      '1 campaign screenshot from debates, convention, or election night to show the tone of the run'
    ],
    creatorChecklist: [
      'Re-run browser validation and confirm the scenario launches cleanly.',
      'Proofread the title, short description, and long description for Steam-facing clarity.',
      'Add a clean screenshot set before you publish the scenario publicly.',
      'Increment the scenario version after every balance or content revision.'
    ]
  };

  return {
    metadata,
    readiness: buildReadiness(scenario, metadata)
  };
}

function buildPublishKitFileName(scenario: ScenarioCatalogEntry) {
  const base = slugify(scenario.name) || scenario.id || 'scenario';
  return `${base}-workshop-kit${SCENARIO_WORKSHOP_KIT_EXTENSION}`;
}

function buildBriefFileName(scenario: ScenarioCatalogEntry) {
  const base = slugify(scenario.name) || scenario.id || 'scenario';
  return `${base}-publish-brief.md`;
}

export function buildScenarioWorkshopPublishKitDownload(scenario: ScenarioCatalogEntry): ScenarioWorkshopDownload {
  const shareDownload = buildScenarioShareBundleDownload(scenario);
  const preview = buildScenarioWorkshopPreview(scenario);
  const kit: ScenarioWorkshopPublishKit = {
    format: SCENARIO_WORKSHOP_KIT_FORMAT,
    schemaVersion: SCENARIO_WORKSHOP_KIT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    official: Boolean(scenario.official),
    metadata: preview.metadata,
    readiness: preview.readiness,
    manifest: {
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
    },
    validationFindings: scenario.validation.findings.map((finding) => ({ ...finding })),
    shareBundleFileName: shareDownload.fileName,
    shareBundle: shareDownload.bundle
  };

  return {
    fileName: buildPublishKitFileName(scenario),
    content: JSON.stringify(kit, null, 2),
    kit
  };
}

export function buildScenarioWorkshopBriefDownload(scenario: ScenarioCatalogEntry): ScenarioWorkshopBriefDownload {
  const preview = buildScenarioWorkshopPreview(scenario);
  const content = [
    `# ${preview.metadata.title}`,
    '',
    `Status: ${preview.readiness.status}`,
    `Readiness score: ${preview.readiness.score}%`,
    `Visibility recommendation: ${preview.metadata.visibility}`,
    '',
    '## Short Description',
    preview.metadata.shortDescription,
    '',
    '## Long Description',
    preview.metadata.longDescription,
    '',
    '## Suggested Tags',
    preview.metadata.tags.map((tag) => `- ${tag}`).join('\n'),
    '',
    '## Compatibility',
    preview.metadata.compatibilityLine,
    '',
    '## Release Notes Template',
    preview.metadata.releaseNotesTemplate.map((line) => `- ${line}`).join('\n'),
    '',
    '## Preview Checklist',
    preview.metadata.previewChecklist.map((line) => `- ${line}`).join('\n'),
    '',
    '## Creator Checklist',
    preview.metadata.creatorChecklist.map((line) => `- ${line}`).join('\n'),
    '',
    '## Browser Diagnostics To Watch',
    preview.readiness.blockers.length > 0
      ? preview.readiness.blockers.map((line) => `- Blocker: ${line}`).join('\n')
      : '- No blocking issues detected.',
    preview.readiness.cautions.length > 0
      ? preview.readiness.cautions.map((line) => `- Polish: ${line}`).join('\n')
      : '- No major polish warnings beyond the current checklist.'
  ].join('\n');

  return {
    fileName: buildBriefFileName(scenario),
    content,
    preview
  };
}
