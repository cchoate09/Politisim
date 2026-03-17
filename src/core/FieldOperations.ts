import type { StateElectionData } from './CampaignDataParser';
import type { ActiveEndorsement } from './EndorsementData';

export interface StateFieldOperation {
  officeLevel: number;
  officeReadiness: number;
  volunteerStrength: number;
  surrogatePower: number;
  assignedSurrogates: string[];
  lastOfficeWeek: number | null;
}

export interface FieldOperationEffect {
  scoreMultiplier: number;
  turnoutBonus: number;
  stabilityBonus: number;
}

export interface SurrogateProfile {
  id: string;
  name: string;
  kind: 'vp' | 'staff' | 'endorsement';
  summary: string;
  regionFocus: string[];
  homeStates: string[];
  basePower: number;
  turnoutBoost: number;
  trustBoost: number;
}

export interface FieldNetworkSummary {
  officeStates: number;
  officeLevelTotal: number;
  volunteerStrength: number;
  activeSurrogates: number;
  averageReadiness: number;
}

const OFFICE_CAPACITY_BY_LEVEL = [0, 140, 300, 500];
const VP_METADATA: Record<string, { regionFocus: string[]; homeStates: string[]; power: number; turnoutBoost: number; trustBoost: number }> = {
  'Sen. Maria Torres': {
    regionFocus: ['West', 'South'],
    homeStates: ['New Mexico', 'Arizona', 'Nevada'],
    power: 1.9,
    turnoutBoost: 2.2,
    trustBoost: 0.7
  },
  'Gov. James Mitchell': {
    regionFocus: ['South'],
    homeStates: ['Georgia', 'North Carolina', 'Virginia'],
    power: 1.8,
    turnoutBoost: 1.5,
    trustBoost: 1
  },
  'Fmr. Gen. Sarah Chen': {
    regionFocus: ['West', 'Northeast'],
    homeStates: ['California', 'Virginia'],
    power: 1.7,
    turnoutBoost: 1.2,
    trustBoost: 1.4
  },
  'Rep. David Park': {
    regionFocus: ['West', 'Midwest'],
    homeStates: ['Colorado', 'Washington', 'Illinois'],
    power: 1.7,
    turnoutBoost: 1.9,
    trustBoost: 0.4
  }
};

const STAFF_SURROGATES: Record<string, SurrogateProfile> = {
  field_organizer: {
    id: 'staff-field-organizer',
    name: 'Regional Organizing Corps',
    kind: 'staff',
    summary: 'Senior organizers who can parachute into a state, stabilize volunteer shifts, and keep a field office from drifting.',
    regionFocus: ['South', 'Midwest', 'West', 'Northeast'],
    homeStates: [],
    basePower: 1.15,
    turnoutBoost: 1.3,
    trustBoost: 0.2
  },
  pr_manager: {
    id: 'staff-pr-manager',
    name: 'Rapid Response Principal',
    kind: 'staff',
    summary: 'A disciplined media surrogate who can calm a rough week and steady local earned media.',
    regionFocus: ['South', 'Midwest', 'West', 'Northeast'],
    homeStates: [],
    basePower: 0.95,
    turnoutBoost: 0.5,
    trustBoost: 1.1
  }
};

const ENDORSEMENT_CATEGORY_POWER: Record<ActiveEndorsement['category'], { basePower: number; turnoutBoost: number; trustBoost: number }> = {
  labor: { basePower: 1.1, turnoutBoost: 1.4, trustBoost: 0.4 },
  activist: { basePower: 1.05, turnoutBoost: 1.1, trustBoost: 0.2 },
  caucus: { basePower: 1.25, turnoutBoost: 1.2, trustBoost: 0.8 },
  governor: { basePower: 1.3, turnoutBoost: 0.9, trustBoost: 0.9 },
  former_president: { basePower: 1.55, turnoutBoost: 1.1, trustBoost: 1.2 },
  machine: { basePower: 1.2, turnoutBoost: 1.35, trustBoost: 0.5 },
  media: { basePower: 0.95, turnoutBoost: 0.55, trustBoost: 0.75 },
  faith: { basePower: 1.15, turnoutBoost: 1.25, trustBoost: 0.4 },
  business: { basePower: 1.2, turnoutBoost: 0.65, trustBoost: 0.7 },
  security: { basePower: 1.15, turnoutBoost: 0.7, trustBoost: 1 }
};

export function createInitialFieldOperations(states: StateElectionData[]): Record<string, StateFieldOperation> {
  return Object.fromEntries(states.map((state) => ([
    state.stateName,
    {
      officeLevel: 0,
      officeReadiness: 0,
      volunteerStrength: 0,
      surrogatePower: 0,
      assignedSurrogates: [],
      lastOfficeWeek: null
    }
  ])));
}

export function normalizeFieldOperations(
  states: StateElectionData[],
  saved: Record<string, Partial<StateFieldOperation>> | undefined
): Record<string, StateFieldOperation> {
  const base = createInitialFieldOperations(states);

  for (const state of states) {
    const existing = saved?.[state.stateName];
    if (!existing) continue;
    base[state.stateName] = {
      officeLevel: existing.officeLevel ?? 0,
      officeReadiness: existing.officeReadiness ?? 0,
      volunteerStrength: existing.volunteerStrength ?? 0,
      surrogatePower: existing.surrogatePower ?? 0,
      assignedSurrogates: existing.assignedSurrogates ?? [],
      lastOfficeWeek: existing.lastOfficeWeek ?? null
    };
  }

  return base;
}

export function getOfficeCapacity(officeLevel: number, officeReadiness: number): number {
  const base = OFFICE_CAPACITY_BY_LEVEL[Math.max(0, Math.min(OFFICE_CAPACITY_BY_LEVEL.length - 1, officeLevel))];
  return Math.round(base * (0.55 + (officeReadiness / 180)));
}

export function getFieldOfficeBuildCost(stateData: StateElectionData, currentLevel: number): number {
  const normalizedLevel = Math.max(0, currentLevel);
  return Math.round(70000 + (stateData.delegatesOrEV * 2800) + (normalizedLevel * 85000));
}

export function getFieldOfficeUpkeep(operation: StateFieldOperation, stateData: StateElectionData): number {
  if (operation.officeLevel <= 0) return 0;
  return Math.round((9000 + stateData.delegatesOrEV * 180) * operation.officeLevel);
}

export function getVolunteerDeployCost(stateData: StateElectionData, amount: number): number {
  return Math.round(amount * (140 + stateData.delegatesOrEV * 3));
}

export function getVolunteerWithdrawalReturn(amount: number): number {
  return Math.max(0, Math.floor(amount * 0.45));
}

export function getVolunteerRecruitmentGain(
  operations: Record<string, StateFieldOperation>,
  trust: number,
  momentum: number,
  endorsementCount: number,
  hasFieldOrganizer: boolean
): number {
  const officeNetwork = Object.values(operations).reduce((sum, operation) => {
    return sum + (operation.officeLevel * 10) + Math.floor(operation.officeReadiness / 12);
  }, 0);

  const base = 18 + Math.floor(trust / 7) + Math.floor(momentum / 7) + (endorsementCount * 7) + officeNetwork;
  return base + (hasFieldOrganizer ? 28 : 0);
}

export function applyWeeklyFieldOperationDecay(
  operations: Record<string, StateFieldOperation>
): Record<string, StateFieldOperation> {
  const next: Record<string, StateFieldOperation> = {};

  for (const [stateName, operation] of Object.entries(operations)) {
    const nextReadiness = operation.officeLevel > 0
      ? Math.min(100, operation.officeReadiness + 18 + (operation.officeLevel * 4))
      : 0;
    const retention = Math.min(0.96, 0.74 + (operation.officeLevel * 0.06) + (nextReadiness / 1000));
    const nextVolunteerStrength = Math.max(0, Math.floor(operation.volunteerStrength * retention));
    next[stateName] = {
      ...operation,
      officeReadiness: nextReadiness,
      volunteerStrength: nextVolunteerStrength,
      surrogatePower: 0,
      assignedSurrogates: []
    };
  }

  return next;
}

export function getSurrogatePower(profile: SurrogateProfile, stateData: StateElectionData): number {
  let power = profile.basePower;
  if (profile.regionFocus.includes(stateData.region)) {
    power += 0.45;
  }
  if (profile.homeStates.includes(stateData.stateName)) {
    power += 0.75;
  }
  return power;
}

export function getFieldOperationEffect(
  stateData: StateElectionData,
  operation: StateFieldOperation | undefined
): FieldOperationEffect {
  if (!operation) {
    return { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 };
  }

  const readinessFactor = operation.officeReadiness / 100;
  const officeBoost = operation.officeLevel * (0.018 + readinessFactor * 0.009);
  const volunteerBoost = Math.log(operation.volunteerStrength + 1) * (0.009 + operation.officeLevel * 0.0012);
  const surrogateBoost = operation.surrogatePower * 0.015;
  const battlegroundBonus = Math.abs(stateData.partisanLean ?? 0) <= 5
    ? (operation.officeLevel * 0.004)
    : 0;

  return {
    scoreMultiplier: 1 + officeBoost + volunteerBoost + surrogateBoost + battlegroundBonus,
    turnoutBonus: Math.min(6.5, (operation.officeLevel * 0.75) + (operation.volunteerStrength / 85) + (operation.surrogatePower * 0.85)),
    stabilityBonus: Math.min(6, (operation.officeLevel * 1.1) + (operation.volunteerStrength / 130) + (operation.surrogatePower * 0.7))
  };
}

export function getTotalOfficeUpkeep(
  operations: Record<string, StateFieldOperation>,
  states: StateElectionData[]
): number {
  return states.reduce((sum, state) => {
    return sum + getFieldOfficeUpkeep(operations[state.stateName] ?? {
      officeLevel: 0,
      officeReadiness: 0,
      volunteerStrength: 0,
      surrogatePower: 0,
      assignedSurrogates: [],
      lastOfficeWeek: null
    }, state);
  }, 0);
}

export function buildPlayerSurrogateRoster(
  vpPick: { name: string } | null,
  hiredStaff: string[],
  endorsements: ActiveEndorsement[]
): SurrogateProfile[] {
  const roster: SurrogateProfile[] = [];

  if (vpPick) {
    const metadata = VP_METADATA[vpPick.name] ?? {
      regionFocus: ['South', 'Midwest', 'West', 'Northeast'],
      homeStates: [],
      power: 1.75,
      turnoutBoost: 1.4,
      trustBoost: 0.8
    };
    roster.push({
      id: `vp-${vpPick.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: vpPick.name,
      kind: 'vp',
      summary: 'Your running mate can headline local media, energize the ticket, and keep coalition partners visible when you are elsewhere.',
      regionFocus: metadata.regionFocus,
      homeStates: metadata.homeStates,
      basePower: metadata.power,
      turnoutBoost: metadata.turnoutBoost,
      trustBoost: metadata.trustBoost
    });
  }

  hiredStaff.forEach((staffId) => {
    const surrogate = STAFF_SURROGATES[staffId];
    if (surrogate) {
      roster.push(surrogate);
    }
  });

  endorsements
    .filter((endorsement) => endorsement.endorsedCandidateId === 'player')
    .forEach((endorsement) => {
      const categoryPower = ENDORSEMENT_CATEGORY_POWER[endorsement.category];
      roster.push({
        id: `endorsement-${endorsement.id}`,
        name: endorsement.name,
        kind: 'endorsement',
        summary: endorsement.title,
        regionFocus: endorsement.regions,
        homeStates: endorsement.homeStates,
        basePower: categoryPower.basePower + (endorsement.effects.conventionWeight * 0.08),
        turnoutBoost: categoryPower.turnoutBoost + (endorsement.effects.turnoutBoost * 0.4),
        trustBoost: categoryPower.trustBoost + (endorsement.effects.trustBoost * 0.18)
      });
    });

  return roster;
}

export function getAssignedStateForSurrogate(
  operations: Record<string, StateFieldOperation>,
  surrogateId: string
): string | null {
  for (const [stateName, operation] of Object.entries(operations)) {
    if (operation.assignedSurrogates.includes(surrogateId)) {
      return stateName;
    }
  }

  return null;
}

export function getAvailableSurrogates(
  roster: SurrogateProfile[],
  operations: Record<string, StateFieldOperation>
): SurrogateProfile[] {
  return roster.filter((surrogate) => !getAssignedStateForSurrogate(operations, surrogate.id));
}

export function getFieldNetworkSummary(
  operations: Record<string, StateFieldOperation>
): FieldNetworkSummary {
  const states = Object.values(operations);
  const officeStates = states.filter((operation) => operation.officeLevel > 0).length;
  const officeLevelTotal = states.reduce((sum, operation) => sum + operation.officeLevel, 0);
  const volunteerStrength = states.reduce((sum, operation) => sum + operation.volunteerStrength, 0);
  const activeSurrogates = states.reduce((sum, operation) => sum + operation.assignedSurrogates.length, 0);
  const averageReadiness = officeStates > 0
    ? Math.round(states.filter((operation) => operation.officeLevel > 0).reduce((sum, operation) => sum + operation.officeReadiness, 0) / officeStates)
    : 0;

  return {
    officeStates,
    officeLevelTotal,
    volunteerStrength,
    activeSurrogates,
    averageReadiness
  };
}
