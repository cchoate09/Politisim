import type { StateElectionData } from './CampaignDataParser';
import type { PlayerDemographics } from './ElectionMath';

export type EndorsementCategory =
  | 'labor'
  | 'governor'
  | 'activist'
  | 'former_president'
  | 'media'
  | 'faith'
  | 'business'
  | 'security'
  | 'machine'
  | 'caucus';

export interface EndorsementEffects {
  scoreBoost: number;
  regionBoost: number;
  homeStateBoost: number;
  turnoutBoost: number;
  weeklyFundraising: number;
  momentumBoost: number;
  trustBoost: number;
  conventionWeight: number;
  demographicFocus: Partial<PlayerDemographics>;
}

export interface EndorsementProfile {
  id: string;
  name: string;
  title: string;
  category: EndorsementCategory;
  party: 'Democrat' | 'Republican';
  description: string;
  availableWeek: number;
  courtingCost: number;
  staminaCost: number;
  baseThreshold: number;
  icon: string;
  homeStates: string[];
  regions: string[];
  priorities: Partial<PlayerDemographics>;
  effects: EndorsementEffects;
}

export interface ActiveEndorsement extends EndorsementProfile {
  endorsedCandidateId: string | null;
  playerRelationship: number;
  rivalRelationships: Record<string, number>;
  lastContactWeek: number | null;
  lockedWeek: number | null;
}

export interface CandidateEndorsementSnapshot {
  id: string;
  name: string;
  ideology: PlayerDemographics;
  momentum: number;
  trust: number;
  delegates: number;
  delegateTarget: number;
  stateWins: number;
  recentWins: number;
  homeRegion: string;
  supportBase: number;
  status: 'player' | 'active' | 'withdrawn' | 'nominee';
}

export interface EndorsementStanding {
  candidateId: string;
  name: string;
  score: number;
}

export interface EndorsementEvaluation {
  standings: EndorsementStanding[];
  threshold: number;
  playerGap: number;
  playerLean: 'strong' | 'lean' | 'competitive' | 'cold';
  readyToDecide: boolean;
}

export interface CandidateEndorsementSummary {
  count: number;
  prestige: number;
  weeklyFundraising: number;
  conventionWeight: number;
}

export interface CandidateStateEndorsementEffect {
  scoreMultiplier: number;
  turnoutBonus: number;
}

export interface CourtshipResult {
  updated: ActiveEndorsement;
  relationshipGain: number;
  reaction: string;
}

type EndorsementTemplate = EndorsementProfile;

function seededFloat(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const DEMOCRAT_ENDORSEMENTS: EndorsementTemplate[] = [
  {
    id: 'dem-afl-cio',
    name: 'AFL-CIO Federation',
    title: 'Labor umbrella backing',
    category: 'labor',
    party: 'Democrat',
    description: 'Industrial unions, freight locals, and building trades are looking for a nominee who can carry the working-class argument into the Midwest.',
    availableWeek: 18,
    courtingCost: 60000,
    staminaCost: 8,
    baseThreshold: 92,
    icon: 'LU',
    homeStates: ['Michigan', 'Pennsylvania', 'Wisconsin'],
    regions: ['Midwest', 'Northeast'],
    priorities: { worker: 88, liberal: 56, owner: 24, religious: 48 },
    effects: {
      scoreBoost: 0.016,
      regionBoost: 0.022,
      homeStateBoost: 0.03,
      turnoutBoost: 0.8,
      weeklyFundraising: 34000,
      momentumBoost: 4,
      trustBoost: 3,
      conventionWeight: 3,
      demographicFocus: { worker: 88, religious: 28 }
    }
  },
  {
    id: 'dem-climate-action',
    name: 'Climate Action Alliance',
    title: 'Movement activist network',
    category: 'activist',
    party: 'Democrat',
    description: 'Young activists and green donors want a nominee willing to go big on climate and generational urgency.',
    availableWeek: 14,
    courtingCost: 45000,
    staminaCost: 7,
    baseThreshold: 88,
    icon: 'CA',
    homeStates: ['Colorado', 'Nevada', 'Oregon'],
    regions: ['West'],
    priorities: { liberal: 86, immigrant: 60, owner: 28 },
    effects: {
      scoreBoost: 0.013,
      regionBoost: 0.02,
      homeStateBoost: 0.024,
      turnoutBoost: 0.7,
      weeklyFundraising: 26000,
      momentumBoost: 5,
      trustBoost: 1,
      conventionWeight: 2,
      demographicFocus: { liberal: 90, immigrant: 34 }
    }
  },
  {
    id: 'dem-black-caucus',
    name: 'Congressional Black Leadership PAC',
    title: 'Black elected official network',
    category: 'caucus',
    party: 'Democrat',
    description: 'A powerful bloc of mayors, members, and clergy-aligned operatives is watching for campaigns with trust, discipline, and real turnout potential.',
    availableWeek: 22,
    courtingCost: 55000,
    staminaCost: 8,
    baseThreshold: 94,
    icon: 'CB',
    homeStates: ['Georgia', 'South Carolina', 'Alabama'],
    regions: ['South'],
    priorities: { worker: 72, religious: 70, liberal: 64, immigrant: 44 },
    effects: {
      scoreBoost: 0.015,
      regionBoost: 0.024,
      homeStateBoost: 0.028,
      turnoutBoost: 1,
      weeklyFundraising: 28000,
      momentumBoost: 3,
      trustBoost: 4,
      conventionWeight: 3,
      demographicFocus: { worker: 66, religious: 74, liberal: 48 }
    }
  },
  {
    id: 'dem-governors',
    name: 'New Democrats Governors Forum',
    title: 'Governor donor and surrogate lane',
    category: 'governor',
    party: 'Democrat',
    description: 'Pragmatic governors want a nominee who can hold suburbs, reassure donors, and look electable in a difficult November map.',
    availableWeek: 20,
    courtingCost: 50000,
    staminaCost: 7,
    baseThreshold: 90,
    icon: 'GF',
    homeStates: ['Virginia', 'Colorado', 'North Carolina'],
    regions: ['South', 'West', 'Northeast'],
    priorities: { owner: 52, liberal: 58, worker: 54, immigrant: 46 },
    effects: {
      scoreBoost: 0.014,
      regionBoost: 0.018,
      homeStateBoost: 0.024,
      turnoutBoost: 0.5,
      weeklyFundraising: 32000,
      momentumBoost: 3,
      trustBoost: 3,
      conventionWeight: 2,
      demographicFocus: { owner: 40, worker: 42, immigrant: 28 }
    }
  },
  {
    id: 'dem-halbrook',
    name: 'Former President Halbrook',
    title: 'National party validator',
    category: 'former_president',
    party: 'Democrat',
    description: 'The former president can stabilize establishment nerves, unlock donors, and signal that the party should consolidate around one nominee.',
    availableWeek: 28,
    courtingCost: 85000,
    staminaCost: 10,
    baseThreshold: 98,
    icon: 'FP',
    homeStates: ['Illinois'],
    regions: ['Midwest', 'South', 'Northeast', 'West'],
    priorities: { liberal: 66, worker: 60, owner: 46, immigrant: 62 },
    effects: {
      scoreBoost: 0.02,
      regionBoost: 0.014,
      homeStateBoost: 0.02,
      turnoutBoost: 0.9,
      weeklyFundraising: 42000,
      momentumBoost: 6,
      trustBoost: 5,
      conventionWeight: 4,
      demographicFocus: { liberal: 58, worker: 52, immigrant: 54 }
    }
  },
  {
    id: 'dem-teachers',
    name: 'Teachers for Opportunity',
    title: 'Education and suburban volunteer base',
    category: 'labor',
    party: 'Democrat',
    description: 'Teachers and school-board activists care about trust, message discipline, and whether the campaign can survive suburban scrutiny.',
    availableWeek: 16,
    courtingCost: 35000,
    staminaCost: 6,
    baseThreshold: 82,
    icon: 'ED',
    homeStates: ['Minnesota', 'Pennsylvania', 'Virginia'],
    regions: ['Midwest', 'Northeast'],
    priorities: { liberal: 68, worker: 60, immigrant: 48, religious: 42 },
    effects: {
      scoreBoost: 0.011,
      regionBoost: 0.016,
      homeStateBoost: 0.022,
      turnoutBoost: 0.6,
      weeklyFundraising: 18000,
      momentumBoost: 2,
      trustBoost: 3,
      conventionWeight: 2,
      demographicFocus: { liberal: 62, worker: 46, immigrant: 36 }
    }
  },
  {
    id: 'dem-latino-network',
    name: 'Latino Civic Network',
    title: 'Southwest and Sun Belt machine',
    category: 'machine',
    party: 'Democrat',
    description: 'Local electeds and civic organizers across the Southwest want proof that the campaign can grow turnout beyond the old coalition map.',
    availableWeek: 18,
    courtingCost: 48000,
    staminaCost: 7,
    baseThreshold: 86,
    icon: 'LC',
    homeStates: ['Arizona', 'Nevada', 'Texas', 'New Mexico', 'Florida'],
    regions: ['South', 'West'],
    priorities: { immigrant: 90, worker: 58, liberal: 52, owner: 34 },
    effects: {
      scoreBoost: 0.014,
      regionBoost: 0.022,
      homeStateBoost: 0.032,
      turnoutBoost: 0.9,
      weeklyFundraising: 24000,
      momentumBoost: 4,
      trustBoost: 2,
      conventionWeight: 2,
      demographicFocus: { immigrant: 92, worker: 38 }
    }
  },
  {
    id: 'dem-mayors',
    name: 'Sun Belt Mayors Coalition',
    title: 'Urban growth coalition',
    category: 'machine',
    party: 'Democrat',
    description: 'Fast-growth metro mayors reward campaigns that can connect urban turnout with business confidence and immigrant outreach.',
    availableWeek: 20,
    courtingCost: 40000,
    staminaCost: 6,
    baseThreshold: 84,
    icon: 'MB',
    homeStates: ['Georgia', 'North Carolina', 'Arizona', 'Nevada'],
    regions: ['South', 'West'],
    priorities: { immigrant: 72, owner: 48, liberal: 60, worker: 44 },
    effects: {
      scoreBoost: 0.012,
      regionBoost: 0.018,
      homeStateBoost: 0.024,
      turnoutBoost: 0.6,
      weeklyFundraising: 21000,
      momentumBoost: 3,
      trustBoost: 2,
      conventionWeight: 2,
      demographicFocus: { immigrant: 70, owner: 30, liberal: 42 }
    }
  },
  {
    id: 'dem-reform-roundtable',
    name: 'Reform Roundtable',
    title: 'Cable, columnist, and think-tank lane',
    category: 'media',
    party: 'Democrat',
    description: 'Editorial boards and party reform voices reward campaigns that look disciplined, modern, and capable of winning on television.',
    availableWeek: 12,
    courtingCost: 30000,
    staminaCost: 5,
    baseThreshold: 80,
    icon: 'MR',
    homeStates: ['New York', 'Massachusetts', 'California'],
    regions: ['Northeast', 'West'],
    priorities: { liberal: 64, owner: 44, libertarian: 46, immigrant: 52 },
    effects: {
      scoreBoost: 0.01,
      regionBoost: 0.014,
      homeStateBoost: 0.018,
      turnoutBoost: 0.4,
      weeklyFundraising: 14000,
      momentumBoost: 3,
      trustBoost: 2,
      conventionWeight: 1,
      demographicFocus: { liberal: 50, owner: 28, libertarian: 26 }
    }
  }
];

const REPUBLICAN_ENDORSEMENTS: EndorsementTemplate[] = [
  {
    id: 'rep-faith-family',
    name: 'Faith and Family Council',
    title: 'Evangelical turnout network',
    category: 'faith',
    party: 'Republican',
    description: 'Pastors, family-policy activists, and church organizers want a nominee with social-issue credibility and discipline under scrutiny.',
    availableWeek: 16,
    courtingCost: 50000,
    staminaCost: 7,
    baseThreshold: 88,
    icon: 'FF',
    homeStates: ['Iowa', 'South Carolina', 'Oklahoma', 'Tennessee'],
    regions: ['South', 'Midwest'],
    priorities: { religious: 92, worker: 48, owner: 42, immigrant: 12 },
    effects: {
      scoreBoost: 0.015,
      regionBoost: 0.022,
      homeStateBoost: 0.028,
      turnoutBoost: 0.9,
      weeklyFundraising: 26000,
      momentumBoost: 4,
      trustBoost: 3,
      conventionWeight: 3,
      demographicFocus: { religious: 92, worker: 24 }
    }
  },
  {
    id: 'rep-business-roundtable',
    name: 'Business Growth Roundtable',
    title: 'Chamber and donor class lane',
    category: 'business',
    party: 'Republican',
    description: 'Growth conservatives and donor bundlers prioritize competence, tax-cut credibility, and a nominee who will not spook capital.',
    availableWeek: 18,
    courtingCost: 70000,
    staminaCost: 8,
    baseThreshold: 92,
    icon: 'BG',
    homeStates: ['Texas', 'Florida', 'North Carolina'],
    regions: ['South', 'West'],
    priorities: { owner: 90, libertarian: 60, religious: 44, worker: 36 },
    effects: {
      scoreBoost: 0.016,
      regionBoost: 0.018,
      homeStateBoost: 0.026,
      turnoutBoost: 0.4,
      weeklyFundraising: 38000,
      momentumBoost: 3,
      trustBoost: 2,
      conventionWeight: 3,
      demographicFocus: { owner: 88, libertarian: 26 }
    }
  },
  {
    id: 'rep-border-coalition',
    name: 'Border Security Coalition',
    title: 'Immigration and sovereignty hawks',
    category: 'activist',
    party: 'Republican',
    description: 'Border sheriffs, activist attorneys, and security committees want a nominee who treats immigration as a defining issue.',
    availableWeek: 14,
    courtingCost: 45000,
    staminaCost: 7,
    baseThreshold: 86,
    icon: 'BS',
    homeStates: ['Arizona', 'Texas', 'New Mexico'],
    regions: ['South', 'West'],
    priorities: { immigrant: 10, religious: 52, worker: 46, owner: 40 },
    effects: {
      scoreBoost: 0.014,
      regionBoost: 0.02,
      homeStateBoost: 0.03,
      turnoutBoost: 0.7,
      weeklyFundraising: 22000,
      momentumBoost: 4,
      trustBoost: 1,
      conventionWeight: 2,
      demographicFocus: { religious: 40, worker: 30 }
    }
  },
  {
    id: 'rep-freedom-network',
    name: 'Freedom Network Caucus',
    title: 'Liberty movement validator',
    category: 'activist',
    party: 'Republican',
    description: 'Liberty groups reward campaigns that look ideologically committed and suspicious of party insiders.',
    availableWeek: 12,
    courtingCost: 35000,
    staminaCost: 6,
    baseThreshold: 80,
    icon: 'LN',
    homeStates: ['Nevada', 'Utah', 'New Hampshire'],
    regions: ['West', 'Midwest'],
    priorities: { libertarian: 94, owner: 66, religious: 34, immigrant: 18 },
    effects: {
      scoreBoost: 0.012,
      regionBoost: 0.018,
      homeStateBoost: 0.024,
      turnoutBoost: 0.6,
      weeklyFundraising: 18000,
      momentumBoost: 5,
      trustBoost: 1,
      conventionWeight: 2,
      demographicFocus: { libertarian: 92, owner: 24 }
    }
  },
  {
    id: 'rep-sheriffs',
    name: 'Heartland Sheriffs Association',
    title: 'Law-and-order county lane',
    category: 'machine',
    party: 'Republican',
    description: 'County sheriffs and courthouse networks care about public order, local credibility, and a candidate who can own small-town media cycles.',
    availableWeek: 20,
    courtingCost: 45000,
    staminaCost: 7,
    baseThreshold: 84,
    icon: 'HS',
    homeStates: ['Iowa', 'Ohio', 'Pennsylvania', 'Michigan'],
    regions: ['Midwest', 'South'],
    priorities: { religious: 68, worker: 60, immigrant: 12, owner: 42 },
    effects: {
      scoreBoost: 0.013,
      regionBoost: 0.02,
      homeStateBoost: 0.026,
      turnoutBoost: 0.8,
      weeklyFundraising: 20000,
      momentumBoost: 3,
      trustBoost: 2,
      conventionWeight: 2,
      demographicFocus: { worker: 54, religious: 46 }
    }
  },
  {
    id: 'rep-whitaker',
    name: 'Former President Whitaker',
    title: 'National conservative kingmaker',
    category: 'former_president',
    party: 'Republican',
    description: 'The former president still controls donors, loyalists, and a large share of the party base. His blessing can reorder a fractured field.',
    availableWeek: 28,
    courtingCost: 90000,
    staminaCost: 10,
    baseThreshold: 99,
    icon: 'FP',
    homeStates: ['Florida'],
    regions: ['South', 'Midwest', 'West', 'Northeast'],
    priorities: { religious: 78, owner: 68, worker: 54, immigrant: 16 },
    effects: {
      scoreBoost: 0.02,
      regionBoost: 0.014,
      homeStateBoost: 0.02,
      turnoutBoost: 1,
      weeklyFundraising: 44000,
      momentumBoost: 6,
      trustBoost: 4,
      conventionWeight: 4,
      demographicFocus: { religious: 62, owner: 44, worker: 40 }
    }
  },
  {
    id: 'rep-veterans',
    name: 'Veterans for Resolve',
    title: 'National security validator',
    category: 'security',
    party: 'Republican',
    description: 'Retired officers and veterans groups reward steadiness, command presence, and a nominee who looks ready for crisis.',
    availableWeek: 22,
    courtingCost: 50000,
    staminaCost: 7,
    baseThreshold: 89,
    icon: 'VR',
    homeStates: ['Virginia', 'North Carolina', 'Florida'],
    regions: ['South', 'Northeast'],
    priorities: { religious: 62, owner: 56, worker: 54, libertarian: 44 },
    effects: {
      scoreBoost: 0.014,
      regionBoost: 0.016,
      homeStateBoost: 0.022,
      turnoutBoost: 0.5,
      weeklyFundraising: 23000,
      momentumBoost: 3,
      trustBoost: 4,
      conventionWeight: 2,
      demographicFocus: { worker: 34, religious: 36, owner: 24 }
    }
  },
  {
    id: 'rep-broadcast-alliance',
    name: 'Christian Broadcast Alliance',
    title: 'Talk and faith media reach',
    category: 'media',
    party: 'Republican',
    description: 'Faith broadcasters and movement hosts can amplify or bury a campaign with a few disciplined news cycles.',
    availableWeek: 12,
    courtingCost: 30000,
    staminaCost: 5,
    baseThreshold: 82,
    icon: 'CB',
    homeStates: ['South Carolina', 'Tennessee', 'Texas'],
    regions: ['South'],
    priorities: { religious: 88, owner: 42, worker: 42, immigrant: 14 },
    effects: {
      scoreBoost: 0.01,
      regionBoost: 0.016,
      homeStateBoost: 0.02,
      turnoutBoost: 0.4,
      weeklyFundraising: 12000,
      momentumBoost: 3,
      trustBoost: 2,
      conventionWeight: 1,
      demographicFocus: { religious: 80, worker: 20 }
    }
  },
  {
    id: 'rep-sunbelt-governors',
    name: 'Sunbelt Governors Conference',
    title: 'Executive wing of the party',
    category: 'governor',
    party: 'Republican',
    description: 'A bloc of governors values executive competence, donor confidence, and the ability to grow the map in the Sun Belt.',
    availableWeek: 20,
    courtingCost: 55000,
    staminaCost: 8,
    baseThreshold: 90,
    icon: 'SG',
    homeStates: ['Georgia', 'Florida', 'Texas', 'Arizona'],
    regions: ['South', 'West'],
    priorities: { owner: 64, religious: 60, libertarian: 48, worker: 46 },
    effects: {
      scoreBoost: 0.015,
      regionBoost: 0.02,
      homeStateBoost: 0.028,
      turnoutBoost: 0.5,
      weeklyFundraising: 30000,
      momentumBoost: 3,
      trustBoost: 3,
      conventionWeight: 3,
      demographicFocus: { owner: 56, religious: 34, worker: 22 }
    }
  }
];

function getTemplatesForParty(party: 'Democrat' | 'Republican'): EndorsementTemplate[] {
  return party === 'Democrat' ? DEMOCRAT_ENDORSEMENTS : REPUBLICAN_ENDORSEMENTS;
}

function getCandidateRelationship(endorsement: ActiveEndorsement, candidateId: string): number {
  return candidateId === 'player'
    ? endorsement.playerRelationship
    : endorsement.rivalRelationships[candidateId] ?? 0;
}

function getIdeologyAlignment(
  candidateIdeology: PlayerDemographics,
  priorities: Partial<PlayerDemographics>
): number {
  const entries = Object.entries(priorities) as Array<[keyof PlayerDemographics, number]>;
  if (entries.length === 0) return 60;

  const total = entries.reduce((sum, [key, target]) => {
    return sum + (100 - Math.abs(candidateIdeology[key] - target));
  }, 0);

  return total / entries.length;
}

function getPhasePressure(currentWeek: number): number {
  if (currentWeek >= 48) return 16;
  if (currentWeek >= 40) return 10;
  if (currentWeek >= 30) return 6;
  if (currentWeek >= 20) return 2;
  return -6;
}

function getDecisionThreshold(endorsement: ActiveEndorsement, currentWeek: number): number {
  return endorsement.baseThreshold - getPhasePressure(currentWeek);
}

function getCandidateEndorsementScore(
  endorsement: ActiveEndorsement,
  candidate: CandidateEndorsementSnapshot
): number {
  if (candidate.status === 'withdrawn') return -999;

  const ideologyScore = getIdeologyAlignment(candidate.ideology, endorsement.priorities) * 0.46;
  const trustScore = candidate.trust * 0.22;
  const momentumScore = candidate.momentum * 0.2;
  const delegateProgress = candidate.delegateTarget > 0
    ? (candidate.delegates / candidate.delegateTarget) * 100
    : 0;
  const delegateScore = delegateProgress * 0.34;
  const winScore = (candidate.stateWins * 2.4) + (candidate.recentWins * 3.4);
  const relationshipScore = getCandidateRelationship(endorsement, candidate.id);
  const regionScore = endorsement.regions.includes(candidate.homeRegion) ? 8 : 0;
  const supportScore = candidate.supportBase * 0.9;
  const statusScore = candidate.status === 'nominee' ? 12 : 0;

  return ideologyScore + trustScore + momentumScore + delegateScore + winScore + relationshipScore + regionScore + supportScore + statusScore;
}

export function createEndorsementRoster(party: 'Democrat' | 'Republican'): ActiveEndorsement[] {
  return getTemplatesForParty(party).map((template) => ({
    ...template,
    homeStates: [...template.homeStates],
    regions: [...template.regions],
    priorities: { ...template.priorities },
    effects: {
      ...template.effects,
      demographicFocus: { ...template.effects.demographicFocus }
    },
    endorsedCandidateId: null,
    playerRelationship: 0,
    rivalRelationships: {},
    lastContactWeek: null,
    lockedWeek: null
  }));
}

export function reopenDormantEndorsements(
  endorsements: ActiveEndorsement[],
  activeCandidateIds: string[]
): ActiveEndorsement[] {
  return endorsements.map((endorsement) => {
    if (!endorsement.endorsedCandidateId) return endorsement;
    if (activeCandidateIds.includes(endorsement.endorsedCandidateId)) return endorsement;

    return {
      ...endorsement,
      endorsedCandidateId: null,
      lockedWeek: null
    };
  });
}

export function evaluateEndorsement(
  endorsement: ActiveEndorsement,
  candidates: CandidateEndorsementSnapshot[],
  currentWeek: number
): EndorsementEvaluation {
  const standings = candidates
    .map((candidate) => ({
      candidateId: candidate.id,
      name: candidate.name,
      score: getCandidateEndorsementScore(endorsement, candidate)
    }))
    .sort((left, right) => right.score - left.score);

  const threshold = getDecisionThreshold(endorsement, currentWeek);
  const leaderScore = standings[0]?.score ?? 0;
  const runnerUpScore = standings[1]?.score ?? 0;
  const playerScore = standings.find((standing) => standing.candidateId === 'player')?.score ?? 0;
  const playerGap = playerScore - leaderScore;
  const readyToDecide = leaderScore >= threshold && (leaderScore - runnerUpScore >= 5 || currentWeek >= 44);
  const playerLean = playerGap >= -2
    ? playerScore >= threshold - 2 ? 'strong' : 'lean'
    : playerGap >= -8
      ? 'competitive'
      : 'cold';

  return {
    standings,
    threshold,
    playerGap,
    playerLean,
    readyToDecide
  };
}

export function applyPlayerCourtship(
  endorsement: ActiveEndorsement,
  player: CandidateEndorsementSnapshot,
  currentWeek: number
): CourtshipResult {
  const fit = getIdeologyAlignment(player.ideology, endorsement.priorities);
  const baseGain = 8 + (fit / 12) + (player.trust / 18) + (player.stateWins * 0.35);
  const weekPressure = currentWeek >= 36 ? 3 : currentWeek >= 22 ? 1 : 0;
  const variation = (seededFloat(`${endorsement.id}-${currentWeek}-${player.name}`) - 0.5) * 4;
  const relationshipGain = Math.round(clampNumber(baseGain + weekPressure + variation, 7, 18));
  const updated = {
    ...endorsement,
    playerRelationship: endorsement.playerRelationship + relationshipGain,
    lastContactWeek: currentWeek
  };

  let reaction = `${endorsement.name} is still watching the field.`;
  if (fit >= 76 && player.trust >= 55) {
    reaction = `${endorsement.name} liked the meeting and is taking your campaign more seriously.`;
  } else if (fit >= 62) {
    reaction = `${endorsement.name} saw enough to keep talking, but they want more proof on the trail.`;
  } else {
    reaction = `${endorsement.name} heard you out, but your coalition is not a natural fit yet.`;
  }

  return { updated, relationshipGain, reaction };
}

export function applyAICourtshipPressure(
  endorsements: ActiveEndorsement[],
  candidates: CandidateEndorsementSnapshot[],
  currentWeek: number
): ActiveEndorsement[] {
  const activeRivals = candidates.filter((candidate) => candidate.id !== 'player' && candidate.status !== 'withdrawn');

  return endorsements.map((endorsement) => {
    if (endorsement.endorsedCandidateId || currentWeek < endorsement.availableWeek || activeRivals.length === 0) {
      return endorsement;
    }

    const sortedRivals = activeRivals
      .map((candidate) => ({
        candidate,
        score: getCandidateEndorsementScore(endorsement, candidate)
      }))
      .sort((left, right) => right.score - left.score);

    const topRival = sortedRivals[0];
    if (!topRival || topRival.score < endorsement.baseThreshold - 12) {
      return endorsement;
    }

    const pressureGain = Math.round(clampNumber(
      4 + (topRival.candidate.momentum / 20) + (topRival.candidate.stateWins * 0.2),
      4,
      13
    ));

    return {
      ...endorsement,
      rivalRelationships: {
        ...endorsement.rivalRelationships,
        [topRival.candidate.id]: (endorsement.rivalRelationships[topRival.candidate.id] ?? 0) + pressureGain
      }
    };
  });
}

export function resolveWeeklyEndorsements(
  endorsements: ActiveEndorsement[],
  candidates: CandidateEndorsementSnapshot[],
  currentWeek: number
): { endorsements: ActiveEndorsement[]; newlyEndorsed: Array<{ endorsement: ActiveEndorsement; candidateId: string }> } {
  const newlyEndorsed: Array<{ endorsement: ActiveEndorsement; candidateId: string }> = [];

  const nextEndorsements = endorsements.map((endorsement) => {
    if (endorsement.endorsedCandidateId || currentWeek < endorsement.availableWeek) {
      return endorsement;
    }

    const evaluation = evaluateEndorsement(endorsement, candidates, currentWeek);
    const leader = evaluation.standings[0];
    if (!leader || !evaluation.readyToDecide) {
      return endorsement;
    }

    const updated = {
      ...endorsement,
      endorsedCandidateId: leader.candidateId,
      lockedWeek: currentWeek
    };
    newlyEndorsed.push({ endorsement: updated, candidateId: leader.candidateId });
    return updated;
  });

  return {
    endorsements: nextEndorsements,
    newlyEndorsed
  };
}

export function getCandidateEndorsementSummary(
  endorsements: ActiveEndorsement[],
  candidateId: string
): CandidateEndorsementSummary {
  return endorsements.reduce((summary, endorsement) => {
    if (endorsement.endorsedCandidateId !== candidateId) {
      return summary;
    }

    return {
      count: summary.count + 1,
      prestige: summary.prestige + endorsement.effects.conventionWeight,
      weeklyFundraising: summary.weeklyFundraising + endorsement.effects.weeklyFundraising,
      conventionWeight: summary.conventionWeight + endorsement.effects.conventionWeight
    };
  }, {
    count: 0,
    prestige: 0,
    weeklyFundraising: 0,
    conventionWeight: 0
  });
}

export function getCandidateStateEndorsementEffect(
  endorsements: ActiveEndorsement[],
  candidateId: string,
  stateData: StateElectionData
): CandidateStateEndorsementEffect {
  let scoreBoost = 0;
  let turnoutBonus = 0;

  endorsements.forEach((endorsement) => {
    if (endorsement.endorsedCandidateId !== candidateId) {
      return;
    }

    scoreBoost += endorsement.effects.scoreBoost;
    turnoutBonus += endorsement.effects.turnoutBoost;

    if (endorsement.regions.includes(stateData.region)) {
      scoreBoost += endorsement.effects.regionBoost;
    }
    if (endorsement.homeStates.includes(stateData.stateName)) {
      scoreBoost += endorsement.effects.homeStateBoost;
    }

    const demographicReach = Object.entries(endorsement.effects.demographicFocus) as Array<[keyof PlayerDemographics, number]>;
    demographicReach.forEach(([group, weight]) => {
      scoreBoost += ((stateData[group] / 100) * (weight / 100)) * 0.03;
    });
  });

  return {
    scoreMultiplier: 1 + scoreBoost,
    turnoutBonus
  };
}
