import type { ModManifestEntry, StateElectionData } from './CampaignDataParser';

export type ScenarioValidationSeverity = 'error' | 'warning' | 'info';
export type ScenarioCatalogStatus = 'valid' | 'warning' | 'invalid';

export interface ScenarioValidationFinding {
  severity: ScenarioValidationSeverity;
  code: string;
  message: string;
  scope?: string;
}

export interface ScenarioValidationStats {
  jurisdictionCount: number;
  totalEV: number;
  hasDistrictOfColumbia: boolean;
  earliestPrimaryDate: string | null;
  latestPrimaryDate: string | null;
  averageTurnout: number;
}

export interface ScenarioValidationSummary {
  isValid: boolean;
  status: ScenarioCatalogStatus;
  errors: number;
  warnings: number;
  infos: number;
  findings: ScenarioValidationFinding[];
  stats: ScenarioValidationStats;
}

export interface ScenarioCatalogEntry extends ModManifestEntry {
  states: StateElectionData[];
  validation: ScenarioValidationSummary;
}

const VALID_CHALLENGES = new Set<ModManifestEntry['challenge']>(['Accessible', 'Competitive', 'Hardcore']);
const STATE_FIELDS: Array<keyof StateElectionData> = [
  'stateName',
  'delegatesOrEV',
  'demDelegates',
  'repDelegates',
  'liberal',
  'libertarian',
  'owner',
  'worker',
  'religious',
  'immigrant',
  'region',
  'date',
  'baseTurnout',
  'topIssues',
  'partisanLean'
];

function addFinding(
  findings: ScenarioValidationFinding[],
  severity: ScenarioValidationSeverity,
  code: string,
  message: string,
  scope?: string
) {
  findings.push({ severity, code, message, scope });
}

function toStatus(errors: number, warnings: number): ScenarioCatalogStatus {
  if (errors > 0) return 'invalid';
  if (warnings > 0) return 'warning';
  return 'valid';
}

function computeStats(states: StateElectionData[]): ScenarioValidationStats {
  const sortedDates = states
    .map((state) => state.date)
    .filter((date) => !Number.isNaN(Date.parse(date)))
    .sort((left, right) => Date.parse(left) - Date.parse(right));
  const totalTurnout = states.reduce((sum, state) => sum + (typeof state.baseTurnout === 'number' ? state.baseTurnout : 0), 0);

  return {
    jurisdictionCount: states.length,
    totalEV: states.reduce((sum, state) => sum + (typeof state.delegatesOrEV === 'number' ? state.delegatesOrEV : 0), 0),
    hasDistrictOfColumbia: states.some((state) => state.stateName === 'District of Columbia'),
    earliestPrimaryDate: sortedDates[0] ?? null,
    latestPrimaryDate: sortedDates.at(-1) ?? null,
    averageTurnout: states.length > 0 ? Math.round((totalTurnout / states.length) * 10) / 10 : 0
  };
}

function validateManifestEntry(
  entry: ModManifestEntry,
  allEntries: ModManifestEntry[]
): ScenarioValidationFinding[] {
  const findings: ScenarioValidationFinding[] = [];
  const duplicateCount = allEntries.filter((candidate) => candidate.id === entry.id).length;

  if (!entry.id || !/^[a-z0-9][a-z0-9_-]*$/i.test(entry.id)) {
    addFinding(findings, 'error', 'manifest.id', 'Scenario id must be a stable slug using letters, numbers, dashes, or underscores.', 'manifest');
  }
  if (duplicateCount > 1) {
    addFinding(findings, 'error', 'manifest.duplicate_id', `Scenario id "${entry.id}" appears more than once in manifest.json.`, 'manifest');
  }
  if (!entry.name?.trim()) {
    addFinding(findings, 'error', 'manifest.name', 'Scenario name is required.', 'manifest');
  }
  if (!entry.yearLabel?.trim()) {
    addFinding(findings, 'warning', 'manifest.year_label', 'Scenario year label is missing; the browser will look unfinished.', 'manifest');
  }
  if (!Number.isInteger(entry.electionYear) || entry.electionYear < 1900 || entry.electionYear > 2100) {
    addFinding(findings, 'error', 'manifest.election_year', 'Election year must be an integer between 1900 and 2100.', 'manifest');
  }
  if (!VALID_CHALLENGES.has(entry.challenge)) {
    addFinding(findings, 'error', 'manifest.challenge', 'Challenge must be Accessible, Competitive, or Hardcore.', 'manifest');
  }
  if (!entry.tagline?.trim()) {
    addFinding(findings, 'warning', 'manifest.tagline', 'Tagline is missing; scenario cards should have a one-line identity.', 'manifest');
  }
  if (!entry.description?.trim()) {
    addFinding(findings, 'error', 'manifest.description', 'Description is required so the scenario browser can explain the run.', 'manifest');
  }
  if (!entry.author?.trim()) {
    addFinding(findings, 'warning', 'manifest.author', 'Author metadata is missing; community scenarios are easier to trust when they name a creator.', 'manifest');
  }
  if (!entry.version?.trim()) {
    addFinding(findings, 'warning', 'manifest.version', 'Version metadata is missing; Workshop-ready scenarios should report a visible version.', 'manifest');
  }
  if (entry.version?.trim() && !/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(entry.version.trim())) {
    addFinding(findings, 'warning', 'manifest.version_format', 'Version should use a semver-style format such as 1.0.0.', 'manifest');
  }
  if (!entry.minGameVersion?.trim()) {
    addFinding(findings, 'info', 'manifest.min_game_version', 'Minimum compatible game version is missing.', 'manifest');
  }
  if (entry.workshopTitle?.trim() && entry.workshopTitle.trim().length > 70) {
    addFinding(findings, 'warning', 'manifest.workshop_title_length', 'Workshop title should stay under about 70 characters for cleaner listing cards.', 'manifest');
  }
  if (entry.workshopSummary?.trim() && entry.workshopSummary.trim().length > 180) {
    addFinding(findings, 'warning', 'manifest.workshop_summary_length', 'Workshop summary should stay concise enough for a store-style short description.', 'manifest');
  }
  if (entry.workshopTags && entry.workshopTags.length > 8) {
    addFinding(findings, 'warning', 'manifest.workshop_tags', 'Workshop tags should stay concise; aim for 8 or fewer.', 'manifest');
  }
  if (!Array.isArray(entry.focus) || entry.focus.length === 0) {
    addFinding(findings, 'warning', 'manifest.focus', 'Focus tags are missing; the browser will not be able to explain the scenario lane.', 'manifest');
  }
  if (entry.featuredStates && entry.featuredStates.length > 8) {
    addFinding(findings, 'warning', 'manifest.featured_states', 'Featured states should stay concise so the browser remains readable.', 'manifest');
  }
  if (entry.specialRules && entry.specialRules.length > 6) {
    addFinding(findings, 'warning', 'manifest.special_rules', 'Special rules should stay concise so the browser does not become a wall of text.', 'manifest');
  }

  return findings;
}

function validateStateRows(entry: ModManifestEntry, states: StateElectionData[]): ScenarioValidationFinding[] {
  const findings: ScenarioValidationFinding[] = [];
  const seenNames = new Set<string>();

  if (!Array.isArray(states) || states.length === 0) {
    addFinding(findings, 'error', 'states.missing', 'No state data could be loaded for this scenario.', 'states');
    return findings;
  }

  states.forEach((state, index) => {
    const scope = state?.stateName ? `states:${state.stateName}` : `states:${index + 1}`;

    for (const field of STATE_FIELDS) {
      if (!(field in state)) {
        addFinding(findings, 'error', 'states.missing_field', `Missing required field "${field}" in a jurisdiction row.`, scope);
      }
    }

    if (typeof state.stateName !== 'string' || !state.stateName.trim()) {
      addFinding(findings, 'error', 'states.name', 'Jurisdiction name must be a non-empty string.', scope);
    } else if (seenNames.has(state.stateName)) {
      addFinding(findings, 'error', 'states.duplicate_name', `Duplicate jurisdiction "${state.stateName}" found in states.json.`, scope);
    } else {
      seenNames.add(state.stateName);
    }

    const numericFields: Array<keyof Pick<StateElectionData, 'delegatesOrEV' | 'demDelegates' | 'repDelegates' | 'liberal' | 'libertarian' | 'owner' | 'worker' | 'religious' | 'immigrant' | 'baseTurnout' | 'partisanLean'>> = [
      'delegatesOrEV',
      'demDelegates',
      'repDelegates',
      'liberal',
      'libertarian',
      'owner',
      'worker',
      'religious',
      'immigrant',
      'baseTurnout',
      'partisanLean'
    ];

    numericFields.forEach((field) => {
      if (typeof state[field] !== 'number' || Number.isNaN(state[field])) {
        addFinding(findings, 'error', 'states.invalid_number', `"${field}" must be a number.`, scope);
      }
    });

    ['liberal', 'libertarian', 'owner', 'worker', 'religious', 'immigrant'].forEach((field) => {
      const value = state[field as keyof StateElectionData];
      if (typeof value === 'number' && (value < 0 || value > 100)) {
        addFinding(findings, 'error', 'states.demographic_range', `"${field}" must stay between 0 and 100.`, scope);
      }
    });

    if (typeof state.baseTurnout === 'number' && (state.baseTurnout <= 0 || state.baseTurnout > 100)) {
      addFinding(findings, 'error', 'states.turnout_range', 'Base turnout must stay between 0 and 100.', scope);
    }
    if (typeof state.delegatesOrEV === 'number' && state.delegatesOrEV <= 0) {
      addFinding(findings, 'error', 'states.ev_range', 'Electoral votes must be positive.', scope);
    }
    if (typeof state.demDelegates === 'number' && state.demDelegates < 0) {
      addFinding(findings, 'error', 'states.dem_delegate_range', 'Democratic delegates cannot be negative.', scope);
    }
    if (typeof state.repDelegates === 'number' && state.repDelegates < 0) {
      addFinding(findings, 'error', 'states.rep_delegate_range', 'Republican delegates cannot be negative.', scope);
    }

    if (!Array.isArray(state.topIssues) || state.topIssues.length === 0) {
      addFinding(findings, 'error', 'states.top_issues', 'Each jurisdiction needs at least one top issue.', scope);
    }

    if (typeof state.date !== 'string' || Number.isNaN(Date.parse(state.date))) {
      addFinding(findings, 'error', 'states.date', 'Primary date must be a valid YYYY-MM-DD string.', scope);
    } else {
      const year = new Date(state.date).getUTCFullYear();
      if (year !== entry.electionYear) {
        addFinding(findings, 'warning', 'states.date_year', `Primary date year ${year} does not match manifest election year ${entry.electionYear}.`, scope);
      }
    }
  });

  const stats = computeStats(states);
  if (stats.jurisdictionCount !== 51) {
    addFinding(findings, 'warning', 'states.jurisdiction_count', `Scenario has ${stats.jurisdictionCount} jurisdictions; a full national map usually has 51 including DC.`, 'states');
  }
  if (!stats.hasDistrictOfColumbia) {
    addFinding(findings, 'warning', 'states.missing_dc', 'District of Columbia is missing from the map.', 'states');
  }
  if (stats.totalEV !== 538) {
    addFinding(findings, 'warning', 'states.ev_total', `Scenario totals ${stats.totalEV} electoral votes instead of 538.`, 'states');
  }
  if (entry.featuredStates?.length) {
    const missingFeatured = entry.featuredStates.filter((stateName) => !seenNames.has(stateName));
    if (missingFeatured.length > 0) {
      addFinding(findings, 'warning', 'manifest.featured_state_missing', `Featured states not found in states.json: ${missingFeatured.join(', ')}.`, 'manifest');
    }
  }
  if (stats.averageTurnout < 45 || stats.averageTurnout > 85) {
    addFinding(findings, 'warning', 'states.average_turnout', `Average turnout ${stats.averageTurnout}% is outside the normal campaign range.`, 'states');
  } else {
    addFinding(findings, 'info', 'states.average_turnout', `Average turnout is ${stats.averageTurnout}%.`, 'states');
  }

  return findings;
}

export function validateScenarioDefinition(
  entry: ModManifestEntry,
  states: StateElectionData[],
  allEntries: ModManifestEntry[] = [entry]
): ScenarioValidationSummary {
  const findings = [
    ...validateManifestEntry(entry, allEntries),
    ...validateStateRows(entry, states)
  ];
  const errors = findings.filter((finding) => finding.severity === 'error').length;
  const warnings = findings.filter((finding) => finding.severity === 'warning').length;
  const infos = findings.filter((finding) => finding.severity === 'info').length;

  return {
    isValid: errors === 0,
    status: toStatus(errors, warnings),
    errors,
    warnings,
    infos,
    findings,
    stats: computeStats(states)
  };
}

export function buildScenarioCatalogEntry(
  entry: ModManifestEntry,
  states: StateElectionData[],
  allEntries: ModManifestEntry[]
): ScenarioCatalogEntry {
  return {
    ...entry,
    states,
    validation: validateScenarioDefinition(entry, states, allEntries)
  };
}
