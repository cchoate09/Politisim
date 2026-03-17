import { ElectionMath, type PlayerDemographics } from './ElectionMath';
import type { CampaignSpendingData, StateElectionData } from './CampaignDataParser';
import type { CandidateStateEndorsementEffect } from './EndorsementData';
import type { CampaignMediaEffect, DonorBlocId, MediaChannelId } from './CampaignStrategy';
import {
  applyWeeklyFieldOperationDecay,
  createInitialFieldOperations,
  getFieldOfficeBuildCost,
  getOfficeCapacity,
  getTotalOfficeUpkeep,
  getVolunteerDeployCost,
  getVolunteerRecruitmentGain,
  normalizeFieldOperations,
  type FieldOperationEffect,
  type StateFieldOperation
} from './FieldOperations';

export interface PollingData {
  player: number;
  rival: number;
  undecided: number;
  turnout: number;
}

export type RivalStatus = 'active' | 'withdrawn' | 'nominee';

export interface RivalAI {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  party: 'Democrat' | 'Republican';
  budget: number;
  difficulty: 'easy' | 'normal' | 'hard';
  momentum: number;
  trust: number;
  delegates: number;
  spending: Record<string, CampaignSpendingData>;
  ideology: PlayerDemographics;
  homeRegion: string;
  supportBase: number;
  status: RivalStatus;
  endorsedCandidateId: string | null;
  fieldOperations: Record<string, StateFieldOperation>;
  volunteerReserve: number;
  fieldStrategy: 'regional' | 'delegate' | 'turnout' | 'battleground' | 'airwar' | 'insurgent';
  issueBrands: string[];
  strengths: string[];
  vulnerabilities: string[];
  debateStyle: 'attacker' | 'reassurer' | 'wonk' | 'outsider' | 'dodger';
  temperament: 'disciplined' | 'charismatic' | 'volatile' | 'technocrat' | 'retail';
  donorLanes: DonorBlocId[];
  mediaLanes: MediaChannelId[];
  attackPower: number;
  organizationPower: number;
  messageDiscipline: number;
  scandalRisk: number;
  earnedMediaSkill: number;
}

export interface PrimaryFieldShare {
  candidateId: string;
  name: string;
  share: number;
  delegates: number;
  status: RivalStatus | 'player';
}

export interface PrimaryStateProjection extends PollingData {
  leaderId: string;
  leaderName: string;
  fieldShares: PrimaryFieldShare[];
  allFieldShares: PrimaryFieldShare[];
}

interface RivalProfile {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  homeRegion: string;
  supportBase: number;
  momentum: number;
  trust: number;
  ideology: PlayerDemographics;
  fieldStrategy: RivalAI['fieldStrategy'];
  issueBrands: string[];
  strengths: string[];
  vulnerabilities: string[];
  debateStyle: RivalAI['debateStyle'];
  temperament: RivalAI['temperament'];
  donorLanes: DonorBlocId[];
  mediaLanes: MediaChannelId[];
  attackPower: number;
  organizationPower: number;
  messageDiscipline: number;
  scandalRisk: number;
  earnedMediaSkill: number;
}

const EMPTY_SPENDING: CampaignSpendingData = {
  intAds: 0,
  tvAds: 0,
  mailers: 0,
  staff1: 0,
  staff2: 0,
  staff3: 0,
  visits: 0,
  groundGame: 0,
  socialMedia: 0,
  research: 0
};

const DEMOCRAT_PRIMARY_PROFILES: RivalProfile[] = [
  {
    id: 'dem-sloan',
    name: 'Gov. Rebecca Sloan',
    shortName: 'Sloan',
    tagline: 'Establishment favorite',
    homeRegion: 'South',
    supportBase: 10,
    momentum: 30,
    trust: 58,
    ideology: { liberal: 60, libertarian: 35, owner: 55, worker: 62, religious: 42, immigrant: 68 },
    fieldStrategy: 'regional',
    issueBrands: ['Healthcare', 'Education', 'Governance'],
    strengths: ['Governor record', 'Suburban donors', 'Southern validators'],
    vulnerabilities: ['Feels too managerial', 'Base excitement can sag'],
    debateStyle: 'reassurer',
    temperament: 'disciplined',
    donorLanes: ['business', 'tech'],
    mediaLanes: ['local_tv', 'cable', 'direct_mail'],
    attackPower: 55,
    organizationPower: 76,
    messageDiscipline: 84,
    scandalRisk: 24,
    earnedMediaSkill: 52
  },
  {
    id: 'dem-reed',
    name: 'Sen. Marcus Reed',
    shortName: 'Reed',
    tagline: 'Union-backed populist',
    homeRegion: 'Midwest',
    supportBase: 12,
    momentum: 36,
    trust: 56,
    ideology: { liberal: 55, libertarian: 28, owner: 35, worker: 84, religious: 46, immigrant: 48 },
    fieldStrategy: 'turnout',
    issueBrands: ['Jobs', 'Trade', 'Healthcare'],
    strengths: ['Union floor game', 'Rust Belt authenticity', 'Working-class trust'],
    vulnerabilities: ['Business backlash', 'Coastal donor weakness'],
    debateStyle: 'attacker',
    temperament: 'retail',
    donorLanes: ['labor', 'small_donors'],
    mediaLanes: ['earned_media', 'local_tv', 'direct_mail'],
    attackPower: 78,
    organizationPower: 72,
    messageDiscipline: 63,
    scandalRisk: 34,
    earnedMediaSkill: 68
  },
  {
    id: 'dem-mercer',
    name: 'Sec. Daniel Mercer',
    shortName: 'Mercer',
    tagline: 'National security moderate',
    homeRegion: 'Northeast',
    supportBase: 9,
    momentum: 40,
    trust: 52,
    ideology: { liberal: 48, libertarian: 42, owner: 58, worker: 51, religious: 40, immigrant: 55 },
    fieldStrategy: 'airwar',
    issueBrands: ['Foreign Policy', 'Deficit', 'Security'],
    strengths: ['Cable command', 'Donor confidence', 'Security profile'],
    vulnerabilities: ['Thin grassroots energy', 'Can sound bloodless'],
    debateStyle: 'wonk',
    temperament: 'technocrat',
    donorLanes: ['business', 'tech'],
    mediaLanes: ['cable', 'local_tv', 'rapid_response'],
    attackPower: 49,
    organizationPower: 58,
    messageDiscipline: 88,
    scandalRisk: 18,
    earnedMediaSkill: 46
  },
  {
    id: 'dem-cho',
    name: 'Mayor Elena Cho',
    shortName: 'Cho',
    tagline: 'Movement reformer',
    homeRegion: 'West',
    supportBase: 11,
    momentum: 34,
    trust: 54,
    ideology: { liberal: 82, libertarian: 34, owner: 42, worker: 64, religious: 30, immigrant: 78 },
    fieldStrategy: 'insurgent',
    issueBrands: ['Climate Change', 'Civil Rights', 'Housing'],
    strengths: ['Movement enthusiasm', 'Youth turnout', 'Digital reach'],
    vulnerabilities: ['Elite skepticism', 'Message overreach'],
    debateStyle: 'outsider',
    temperament: 'charismatic',
    donorLanes: ['activists', 'small_donors', 'tech'],
    mediaLanes: ['digital', 'earned_media', 'rapid_response'],
    attackPower: 66,
    organizationPower: 61,
    messageDiscipline: 57,
    scandalRisk: 42,
    earnedMediaSkill: 81
  }
];

const REPUBLICAN_PRIMARY_PROFILES: RivalProfile[] = [
  {
    id: 'rep-hawthorne',
    name: 'Gov. Caleb Hawthorne',
    shortName: 'Hawthorne',
    tagline: 'Donor-class conservative',
    homeRegion: 'South',
    supportBase: 10,
    momentum: 32,
    trust: 56,
    ideology: { liberal: 18, libertarian: 66, owner: 84, worker: 42, religious: 70, immigrant: 18 },
    fieldStrategy: 'airwar',
    issueBrands: ['Taxes', 'Business Growth', 'Border'],
    strengths: ['Finance network', 'Southern donor bundlers', 'Disciplined ad war'],
    vulnerabilities: ['Base authenticity questions', 'Too polished in town halls'],
    debateStyle: 'reassurer',
    temperament: 'disciplined',
    donorLanes: ['business', 'tech'],
    mediaLanes: ['cable', 'local_tv', 'direct_mail'],
    attackPower: 52,
    organizationPower: 74,
    messageDiscipline: 83,
    scandalRisk: 20,
    earnedMediaSkill: 43
  },
  {
    id: 'rep-kincaid',
    name: 'Sen. Lydia Kincaid',
    shortName: 'Kincaid',
    tagline: 'Law-and-order hawk',
    homeRegion: 'Midwest',
    supportBase: 12,
    momentum: 38,
    trust: 58,
    ideology: { liberal: 14, libertarian: 44, owner: 62, worker: 58, religious: 82, immigrant: 14 },
    fieldStrategy: 'delegate',
    issueBrands: ['Border', 'Public Safety', 'Judges'],
    strengths: ['Attack discipline', 'Evangelical loyalty', 'Midwest message'],
    vulnerabilities: ['Hard edges in suburbs', 'Press combat can backfire'],
    debateStyle: 'attacker',
    temperament: 'disciplined',
    donorLanes: ['faith', 'business'],
    mediaLanes: ['cable', 'rapid_response', 'direct_mail'],
    attackPower: 82,
    organizationPower: 66,
    messageDiscipline: 78,
    scandalRisk: 28,
    earnedMediaSkill: 58
  },
  {
    id: 'rep-bishop',
    name: 'Sec. Owen Bishop',
    shortName: 'Bishop',
    tagline: 'Evangelical firebrand',
    homeRegion: 'South',
    supportBase: 11,
    momentum: 42,
    trust: 54,
    ideology: { liberal: 10, libertarian: 36, owner: 54, worker: 56, religious: 90, immigrant: 10 },
    fieldStrategy: 'turnout',
    issueBrands: ['Faith', 'Judges', 'Family'],
    strengths: ['Church turnout machine', 'Base intensity', 'Values messaging'],
    vulnerabilities: ['General election drag', 'Limited donor breadth'],
    debateStyle: 'outsider',
    temperament: 'retail',
    donorLanes: ['faith', 'small_donors'],
    mediaLanes: ['earned_media', 'direct_mail', 'cable'],
    attackPower: 70,
    organizationPower: 69,
    messageDiscipline: 54,
    scandalRisk: 39,
    earnedMediaSkill: 75
  },
  {
    id: 'rep-vale',
    name: 'Rep. Jonah Vale',
    shortName: 'Vale',
    tagline: 'Liberty movement insurgent',
    homeRegion: 'West',
    supportBase: 9,
    momentum: 35,
    trust: 50,
    ideology: { liberal: 20, libertarian: 88, owner: 72, worker: 40, religious: 50, immigrant: 16 },
    fieldStrategy: 'insurgent',
    issueBrands: ['Spending', 'Civil Liberties', 'Anti-Establishment'],
    strengths: ['Online libertarian base', 'Earned media spikes', 'Donor outsider pitch'],
    vulnerabilities: ['Coalition ceiling', 'Volatility under scrutiny'],
    debateStyle: 'dodger',
    temperament: 'volatile',
    donorLanes: ['small_donors', 'tech'],
    mediaLanes: ['digital', 'earned_media', 'rapid_response'],
    attackPower: 61,
    organizationPower: 52,
    messageDiscipline: 42,
    scandalRisk: 49,
    earnedMediaSkill: 79
  }
];

const GENERAL_OPPONENTS: Record<'Democrat' | 'Republican', RivalProfile[]> = {
  Democrat: [
    {
      id: 'gen-dem-ortega',
      name: 'Sen. Valeria Ortega',
      shortName: 'Ortega',
      tagline: 'Experienced national Democrat',
      homeRegion: 'West',
      supportBase: 14,
      momentum: 54,
      trust: 60,
      ideology: { liberal: 76, libertarian: 32, owner: 42, worker: 68, religious: 34, immigrant: 80 },
      fieldStrategy: 'battleground',
      issueBrands: ['Abortion Rights', 'Healthcare', 'Democracy'],
      strengths: ['Battleground coalition', 'Disciplined ticket', 'Strong validator bench'],
      vulnerabilities: ['Activist impatience', 'Business donor skepticism'],
      debateStyle: 'reassurer',
      temperament: 'disciplined',
      donorLanes: ['small_donors', 'labor', 'activists'],
      mediaLanes: ['local_tv', 'digital', 'rapid_response'],
      attackPower: 66,
      organizationPower: 82,
      messageDiscipline: 86,
      scandalRisk: 18,
      earnedMediaSkill: 62
    },
    {
      id: 'gen-dem-brooks',
      name: 'Gov. Aaron Brooks',
      shortName: 'Brooks',
      tagline: 'Centrist blue-state governor',
      homeRegion: 'Northeast',
      supportBase: 12,
      momentum: 50,
      trust: 58,
      ideology: { liberal: 58, libertarian: 38, owner: 56, worker: 54, religious: 44, immigrant: 62 },
      fieldStrategy: 'regional',
      issueBrands: ['Economy', 'Infrastructure', 'Competence'],
      strengths: ['Executive competence', 'Suburban reassurance', 'Business crossover'],
      vulnerabilities: ['Lower movement intensity', 'Can be too cautious'],
      debateStyle: 'wonk',
      temperament: 'technocrat',
      donorLanes: ['business', 'tech', 'small_donors'],
      mediaLanes: ['cable', 'local_tv', 'rapid_response'],
      attackPower: 48,
      organizationPower: 74,
      messageDiscipline: 90,
      scandalRisk: 16,
      earnedMediaSkill: 49
    }
  ],
  Republican: [
    {
      id: 'gen-rep-sullivan',
      name: 'Gov. Matthew Sullivan',
      shortName: 'Sullivan',
      tagline: 'Disciplined conservative nominee',
      homeRegion: 'South',
      supportBase: 14,
      momentum: 54,
      trust: 60,
      ideology: { liberal: 18, libertarian: 68, owner: 82, worker: 46, religious: 78, immigrant: 18 },
      fieldStrategy: 'battleground',
      issueBrands: ['Economy', 'Border', 'Order'],
      strengths: ['Disciplined battleground message', 'Heavy donor support', 'Stable operation'],
      vulnerabilities: ['Warmth gap', 'Base mistrust if under pressure'],
      debateStyle: 'reassurer',
      temperament: 'disciplined',
      donorLanes: ['business', 'faith'],
      mediaLanes: ['local_tv', 'cable', 'direct_mail'],
      attackPower: 62,
      organizationPower: 82,
      messageDiscipline: 87,
      scandalRisk: 19,
      earnedMediaSkill: 46
    },
    {
      id: 'gen-rep-rutledge',
      name: 'Sen. Claire Rutledge',
      shortName: 'Rutledge',
      tagline: 'Populist Republican closer',
      homeRegion: 'Midwest',
      supportBase: 13,
      momentum: 52,
      trust: 57,
      ideology: { liberal: 16, libertarian: 50, owner: 64, worker: 60, religious: 74, immigrant: 14 },
      fieldStrategy: 'delegate',
      issueBrands: ['Border', 'Trade', 'Anti-Elite'],
      strengths: ['Populist contrast', 'Media attention', 'Blue-collar right lane'],
      vulnerabilities: ['Trust volatility', 'Overexposure risk'],
      debateStyle: 'attacker',
      temperament: 'charismatic',
      donorLanes: ['small_donors', 'faith', 'business'],
      mediaLanes: ['earned_media', 'cable', 'rapid_response'],
      attackPower: 84,
      organizationPower: 68,
      messageDiscipline: 61,
      scandalRisk: 36,
      earnedMediaSkill: 77
    }
  ]
};

function cloneEmptySpending(): CampaignSpendingData {
  return { ...EMPTY_SPENDING };
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getBudgetByDifficulty(level: 'easy' | 'normal' | 'hard'): number {
  return level === 'hard' ? 3000000 : level === 'normal' ? 1500000 : 750000;
}

function getWeeklyIncomeByDifficulty(level: 'easy' | 'normal' | 'hard'): number {
  return level === 'hard' ? 420000 : level === 'normal' ? 160000 : 70000;
}

function emptyMediaEffect(): CampaignMediaEffect {
  return {
    scoreMultiplier: 1,
    turnoutBonus: 0,
    stabilityBonus: 0,
    trustLift: 0,
    momentumLift: 0,
    rivalPenalty: 0,
    scandalShield: 0
  };
}

function getRivalPassiveFinance(rival: RivalAI) {
  const donorWeight = rival.donorLanes.reduce((sum, lane) => {
    if (lane === 'business') return sum + 1.25;
    if (lane === 'faith') return sum + 0.95;
    if (lane === 'labor') return sum + 0.85;
    if (lane === 'tech') return sum + 1.05;
    return sum + 0.78;
  }, 0);
  return Math.round((donorWeight * 42000) + (rival.supportBase * 6500) + (rival.earnedMediaSkill * 420));
}

function getRegionalBonus(stateData: StateElectionData, homeRegion: string): number {
  if (!homeRegion || homeRegion === 'National') {
    return 0;
  }
  return stateData.region === homeRegion ? 18 : 0;
}

function getStyleLabel(style: RivalAI['debateStyle']) {
  if (style === 'attacker') return 'attack dog';
  if (style === 'reassurer') return 'steady closer';
  if (style === 'wonk') return 'policy technician';
  if (style === 'outsider') return 'outsider insurgent';
  return 'slippery counterpuncher';
}

export function getRivalPersonaLine(rival: Pick<RivalAI, 'homeRegion' | 'issueBrands' | 'debateStyle' | 'strengths'>) {
  const issueLine = rival.issueBrands.slice(0, 2).join(', ');
  const strengthLine = rival.strengths[0] ?? 'message discipline';
  return `${rival.homeRegion} base | ${getStyleLabel(rival.debateStyle)} | ${issueLine} | ${strengthLine}`;
}

export function getRivalDebateTagline(rival: Pick<RivalAI, 'debateStyle' | 'issueBrands' | 'tagline'>) {
  const issueLead = rival.issueBrands[0] ?? 'campaign discipline';
  return `${getStyleLabel(rival.debateStyle)} on ${issueLead.toLowerCase()}`;
}

function getPartyLeanAdjustment(stateData: StateElectionData, party: 'Democrat' | 'Republican'): number {
  const lean = stateData.partisanLean ?? 0;
  return party === 'Democrat' ? lean : -lean;
}

function buildCandidateScore(
  ideology: PlayerDemographics,
  stateData: StateElectionData,
  spending: CampaignSpendingData,
  staffDiv: number,
  visitMult: number,
  issues: string[],
  party: 'Democrat' | 'Republican',
  trustMultiplier: number,
  momentum: number,
  supportBase: number,
  homeRegion: string,
  statusPenalty = 1
): number {
  const base = ElectionMath.calculateBaseScore(ideology, stateData, issues);
  const campaignScore = ElectionMath.applyCampaignBonuses(base, stateData, spending, staffDiv, visitMult);
  const partyLean = getPartyLeanAdjustment(stateData, party);
  const momentumWeight = 1 + (momentum / 240);
  const supportWeight = 1 + (supportBase / 180);
  const leanWeight = 1 + (Math.max(-22, Math.min(22, partyLean)) / 120);
  const regionalWeight = 1 + (getRegionalBonus(stateData, homeRegion) / 120);

  return Math.max(1, campaignScore * trustMultiplier * momentumWeight * supportWeight * leanWeight * regionalWeight * statusPenalty);
}

function getContestValue(stateData: StateElectionData, rival: RivalAI): number {
  if (rival.status === 'nominee') return stateData.delegatesOrEV;
  return rival.party === 'Democrat' ? stateData.demDelegates : stateData.repDelegates;
}

function getRivalTargetScore(
  rival: RivalAI,
  stateData: StateElectionData,
  poll: PollingData | undefined
): number {
  const contestValue = getContestValue(stateData, rival);
  const closeness = poll ? 30 - Math.min(30, Math.abs(poll.player - poll.rival)) : 12;
  const regionalBonus = stateData.region === rival.homeRegion ? 12 : 0;
  const battlegroundBonus = Math.abs(stateData.partisanLean ?? 0) <= 5 ? 9 : 0;
  const turnoutBonus = stateData.baseTurnout >= 62 ? 6 : 0;
  const officeLevel = rival.fieldOperations[stateData.stateName]?.officeLevel ?? 0;
  const readiness = rival.fieldOperations[stateData.stateName]?.officeReadiness ?? 0;
  const existingNetworkBonus = officeLevel * 4 + Math.floor(readiness / 15);

  let strategyBonus = 0;
  switch (rival.fieldStrategy) {
    case 'regional':
      strategyBonus = regionalBonus + Math.max(0, contestValue - 8) * 0.35;
      break;
    case 'delegate':
      strategyBonus = contestValue * 0.8;
      break;
    case 'turnout':
      strategyBonus = turnoutBonus + officeLevel * 3 + contestValue * 0.25;
      break;
    case 'battleground':
      strategyBonus = battlegroundBonus + closeness * 0.6;
      break;
    case 'airwar':
      strategyBonus = closeness * 0.45 + contestValue * 0.3;
      break;
    case 'insurgent':
      strategyBonus = regionalBonus * 0.4 + closeness * 0.55 + Math.max(0, 14 - contestValue);
      break;
  }

  return contestValue + closeness + regionalBonus + battlegroundBonus + strategyBonus + existingNetworkBonus;
}

export class SimulationEngine {
  static createRivalAI(level: 'easy' | 'normal' | 'hard', states: StateElectionData[] = []): RivalAI {
    return {
      id: 'generic-rival',
      name: 'Rival Candidate',
      shortName: 'Rival',
      tagline: 'Opposition candidate',
      party: 'Republican',
      budget: getBudgetByDifficulty(level),
      difficulty: level,
      momentum: 26,
      trust: 50,
      delegates: 0,
      spending: {},
      ideology: {
        liberal: level === 'hard' ? 20 : 30,
        libertarian: level === 'hard' ? 80 : 70,
        owner: 85,
        worker: 40,
        religious: 70,
        immigrant: 20
      },
      homeRegion: 'South',
      supportBase: 8,
      status: 'active',
      endorsedCandidateId: null,
      fieldOperations: createInitialFieldOperations(states),
      volunteerReserve: 160,
      fieldStrategy: 'regional',
      issueBrands: ['Economy', 'Security'],
      strengths: ['Baseline party loyalty', 'Competent national operation'],
      vulnerabilities: ['Little distinct identity', 'Can be out-organized'],
      debateStyle: 'reassurer',
      temperament: 'disciplined',
      donorLanes: ['business', 'small_donors'],
      mediaLanes: ['local_tv', 'cable'],
      attackPower: 55,
      organizationPower: 60,
      messageDiscipline: 68,
      scandalRisk: 28,
      earnedMediaSkill: 45
    };
  }

  static createPrimaryRivals(
    level: 'easy' | 'normal' | 'hard',
    party: 'Democrat' | 'Republican',
    states: StateElectionData[] = []
  ): RivalAI[] {
    const profiles = party === 'Democrat' ? DEMOCRAT_PRIMARY_PROFILES : REPUBLICAN_PRIMARY_PROFILES;

    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      shortName: profile.shortName,
      tagline: profile.tagline,
      party,
      budget: getBudgetByDifficulty(level),
      difficulty: level,
      momentum: profile.momentum + (level === 'hard' ? 4 : level === 'easy' ? -3 : 0),
      trust: profile.trust + (level === 'easy' ? -3 : 0),
      delegates: 0,
      spending: {},
      ideology: { ...profile.ideology },
      homeRegion: profile.homeRegion,
      supportBase: profile.supportBase,
      status: 'active',
      endorsedCandidateId: null,
      fieldOperations: createInitialFieldOperations(states),
      volunteerReserve: 180 + (profile.supportBase * 6),
      fieldStrategy: profile.fieldStrategy,
      issueBrands: [...profile.issueBrands],
      strengths: [...profile.strengths],
      vulnerabilities: [...profile.vulnerabilities],
      debateStyle: profile.debateStyle,
      temperament: profile.temperament,
      donorLanes: [...profile.donorLanes],
      mediaLanes: [...profile.mediaLanes],
      attackPower: profile.attackPower + (level === 'hard' ? 4 : 0),
      organizationPower: profile.organizationPower + (level === 'hard' ? 5 : level === 'easy' ? -4 : 0),
      messageDiscipline: profile.messageDiscipline + (level === 'easy' ? -4 : 0),
      scandalRisk: profile.scandalRisk + (level === 'easy' ? 4 : 0),
      earnedMediaSkill: profile.earnedMediaSkill + (level === 'hard' ? 3 : 0)
    }));
  }

  static createGeneralOpponentAI(
    level: 'easy' | 'normal' | 'hard',
    playerParty: 'Democrat' | 'Republican',
    states: StateElectionData[] = []
  ): RivalAI {
    const opponentParty = playerParty === 'Democrat' ? 'Republican' : 'Democrat';
    const profiles = GENERAL_OPPONENTS[opponentParty];
    const profile = level === 'hard' ? profiles[0] : profiles[1] ?? profiles[0];

    return {
      id: profile.id,
      name: profile.name,
      shortName: profile.shortName,
      tagline: profile.tagline,
      party: opponentParty,
      budget: getBudgetByDifficulty(level) + (level === 'hard' ? 600000 : 250000),
      difficulty: level,
      momentum: profile.momentum + (level === 'hard' ? 6 : 0),
      trust: profile.trust + (level === 'easy' ? -2 : 0),
      delegates: 0,
      spending: {},
      ideology: { ...profile.ideology },
      homeRegion: profile.homeRegion,
      supportBase: profile.supportBase + 4,
      status: 'nominee',
      endorsedCandidateId: null,
      fieldOperations: createInitialFieldOperations(states),
      volunteerReserve: 260,
      fieldStrategy: profile.fieldStrategy,
      issueBrands: [...profile.issueBrands],
      strengths: [...profile.strengths],
      vulnerabilities: [...profile.vulnerabilities],
      debateStyle: profile.debateStyle,
      temperament: profile.temperament,
      donorLanes: [...profile.donorLanes],
      mediaLanes: [...profile.mediaLanes],
      attackPower: profile.attackPower + (level === 'hard' ? 4 : 0),
      organizationPower: profile.organizationPower + (level === 'hard' ? 5 : 0),
      messageDiscipline: profile.messageDiscipline,
      scandalRisk: profile.scandalRisk,
      earnedMediaSkill: profile.earnedMediaSkill + (level === 'hard' ? 4 : 0)
    };
  }

  static getRivalMediaEffect(
    rival: RivalAI,
    stateData: StateElectionData,
    phase: 'primary' | 'general'
  ): CampaignMediaEffect {
    const localTv = rival.mediaLanes.includes('local_tv') ? 0.08 : 0.02;
    const cable = rival.mediaLanes.includes('cable') ? 0.06 : 0.02;
    const digital = rival.mediaLanes.includes('digital') ? 0.06 : 0.015;
    const earned = rival.mediaLanes.includes('earned_media') ? rival.earnedMediaSkill / 650 : rival.earnedMediaSkill / 1200;
    const rapid = rival.mediaLanes.includes('rapid_response') ? rival.messageDiscipline / 420 : rival.messageDiscipline / 900;
    const mail = rival.mediaLanes.includes('direct_mail') ? 0.05 : 0.01;
    const battlegroundFactor = phase === 'general'
      ? Math.max(0.45, 1.1 - (Math.abs(stateData.partisanLean ?? 0) / 22))
      : Math.max(0.55, stateData.delegatesOrEV / 28);
    const baseCoalition = (stateData.owner + stateData.worker + stateData.religious) / 300;

    return {
      scoreMultiplier: 1
        + (localTv * battlegroundFactor)
        + (cable * baseCoalition)
        + (digital * ((stateData.liberal + stateData.libertarian + stateData.immigrant) / 320))
        + (mail * baseCoalition),
      turnoutBonus: (digital * 2.3) + (mail * 1.4) + (localTv * 0.7),
      stabilityBonus: (rapid * 7) + (mail * 3),
      trustLift: cable * 1.2,
      momentumLift: earned * 3.6,
      rivalPenalty: rapid * 0.04,
      scandalShield: rapid * 0.3
    };
  }

  static resolveRivalCampaignBeat(
    rival: RivalAI,
    phase: 'primary' | 'general',
    playerTrust: number
  ): { rival: RivalAI; message: string; type: 'positive' | 'negative' | 'info' } | null {
    if (rival.status === 'withdrawn') return null;

    const scandalChance = 0.04 + (rival.scandalRisk / 260) - (rival.messageDiscipline / 1200);
    const surgeChance = 0.05 + (rival.earnedMediaSkill / 450) + (rival.attackPower / 900);
    const organizationChance = 0.03 + (rival.organizationPower / 1300);
    const roll = Math.random();

    if (roll < scandalChance) {
      const trustHit = 5 + Math.round(rival.scandalRisk / 18);
      const momentumHit = 4 + (rival.temperament === 'volatile' ? 3 : 0);
      const vulnerability = rival.vulnerabilities[0] ?? 'message discipline';
      return {
        rival: {
          ...rival,
          trust: clampPercentage(rival.trust - trustHit),
          momentum: clampPercentage(rival.momentum - momentumHit),
          budget: Math.max(0, rival.budget - Math.round(45000 + (rival.scandalRisk * 1800)))
        },
        message: `${rival.name} hit turbulence after a ${vulnerability.toLowerCase()} problem turned into a damaging ${phase} news cycle.`,
        type: 'negative'
      };
    }

    if (roll < scandalChance + surgeChance) {
      const momentumBoost = 4 + Math.round(rival.earnedMediaSkill / 24);
      const trustBoost = rival.debateStyle === 'reassurer' ? 3 : 1;
      const messageBase = rival.strengths[0] ?? 'media lane';
      return {
        rival: {
          ...rival,
          momentum: clampPercentage(rival.momentum + momentumBoost),
          trust: clampPercentage(rival.trust + trustBoost),
          budget: rival.budget + Math.round(getRivalPassiveFinance(rival) * 0.2)
        },
        message: `${rival.name} broke through this week on ${messageBase.toLowerCase()}, giving the campaign a fresh burst of coverage.`,
        type: playerTrust < 46 ? 'negative' : 'info'
      };
    }

    if (roll < scandalChance + surgeChance + organizationChance) {
      return {
        rival: {
          ...rival,
          momentum: clampPercentage(rival.momentum + 2),
          trust: clampPercentage(rival.trust + 1)
        },
        message: `${rival.name} quietly tightened their ${rival.homeRegion.toLowerCase()} organization and kept the campaign stable.`,
        type: 'info'
      };
    }

    return null;
  }

  static runRivalAITurn(
    rival: RivalAI,
    states: StateElectionData[],
    currentPolling: Record<string, PollingData>,
    difficulty: 'easy' | 'normal' | 'hard',
    coalitionFundraisingBonus = 0
  ): RivalAI {
    const normalizedOperations = normalizeFieldOperations(states, rival.fieldOperations);
    const decayedOperations = applyWeeklyFieldOperationDecay(normalizedOperations);

    if (rival.status === 'withdrawn') {
      return {
        ...rival,
        budget: Math.max(0, rival.budget + Math.floor((getWeeklyIncomeByDifficulty(rival.difficulty) + coalitionFundraisingBonus + getRivalPassiveFinance(rival)) * 0.15)),
        momentum: Math.max(0, rival.momentum - 1),
        fieldOperations: decayedOperations,
        volunteerReserve: Math.max(0, Math.floor(rival.volunteerReserve * 0.7))
      };
    }

    const weeklyIncome = getWeeklyIncomeByDifficulty(rival.difficulty) + coalitionFundraisingBonus + getRivalPassiveFinance(rival);
    const officeUpkeep = getTotalOfficeUpkeep(decayedOperations, states);
    const nextBudgetPool = Math.max(0, rival.budget + weeklyIncome - officeUpkeep);
    let newBudget = nextBudgetPool;
    const recruitmentGain = Math.floor(getVolunteerRecruitmentGain(
      decayedOperations,
      rival.trust,
      rival.momentum,
      Math.max(1, Math.round(coalitionFundraisingBonus / 18000)),
      difficulty === 'hard' || rival.fieldStrategy === 'turnout'
    ) * (rival.status === 'nominee' ? 1.18 : 0.92));
    let volunteerReserve = rival.volunteerReserve + recruitmentGain;

    const targetStates = [...states].sort((a, b) => {
      return getRivalTargetScore(rival, b, currentPolling[b.stateName]) - getRivalTargetScore(rival, a, currentPolling[a.stateName]);
    });

    const newSpending: Record<string, CampaignSpendingData> = {};
    for (const [key, val] of Object.entries(rival.spending)) {
      newSpending[key] = { ...val };
    }

    const operations = { ...decayedOperations };
    const officeTargetCount = difficulty === 'hard' ? 4 : difficulty === 'normal' ? 3 : 2;
    for (const state of targetStates.slice(0, officeTargetCount)) {
      const operation = { ...(operations[state.stateName] ?? {
        officeLevel: 0,
        officeReadiness: 0,
        volunteerStrength: 0,
        surrogatePower: 0,
        assignedSurrogates: [],
        lastOfficeWeek: null
      }) };
      const maxOfficeLevel = rival.status === 'nominee' ? 3 : 2;
      const buildCost = getFieldOfficeBuildCost(state, operation.officeLevel);
      const shouldBuild = operation.officeLevel < maxOfficeLevel && newBudget >= buildCost &&
        (operation.officeLevel === 0 || (difficulty !== 'easy' && operation.officeReadiness >= 45));

      if (shouldBuild) {
        operation.officeLevel += 1;
        operation.officeReadiness = Math.max(18, operation.officeReadiness);
        operation.lastOfficeWeek = null;
        operations[state.stateName] = operation;
        newBudget -= buildCost;
      } else {
        operations[state.stateName] = operation;
      }
    }

    const numTargets = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 5 : 3;
    const spendPerState = Math.floor((newBudget * 0.6) / Math.max(1, numTargets));
    const maxPerField = difficulty === 'hard' ? 500000 : 300000;

    for (let i = 0; i < Math.min(numTargets, targetStates.length); i++) {
      const state = targetStates[i];
      const stateName = state.stateName;
      const current = { ...(newSpending[stateName] || cloneEmptySpending()) };
      const operation = { ...(operations[stateName] ?? {
        officeLevel: 0,
        officeReadiness: 0,
        volunteerStrength: 0,
        surrogatePower: 0,
        assignedSurrogates: [],
        lastOfficeWeek: null
      }) };
      const stateScale = Math.sqrt(state.delegatesOrEV || 1) / 3.0;
      const scaledSpend = spendPerState * stateScale;
      const groundBias = rival.fieldStrategy === 'turnout'
        ? 0.28
        : rival.fieldStrategy === 'insurgent'
          ? 0.22
          : 0.18;
      const socialBias = rival.mediaLanes.includes('digital')
        ? 0.16
        : rival.fieldStrategy === 'insurgent'
          ? 0.13
          : 0.06;
      const tvBias = rival.mediaLanes.includes('local_tv')
        ? 0.46
        : rival.fieldStrategy === 'airwar'
          ? 0.48
          : rival.fieldStrategy === 'battleground'
            ? 0.38
            : 0.34;
      const cableBias = rival.mediaLanes.includes('cable') ? 0.06 : 0;
      const mailBias = rival.mediaLanes.includes('direct_mail') ? 0.08 : 0.04;
      const fieldBias = operation.officeLevel > 0 ? 0.08 + (operation.officeLevel * 0.03) : 0;

      current.tvAds = Math.min(maxPerField, current.tvAds + scaledSpend * Math.max(0.18, tvBias - cableBias));
      current.intAds = Math.min(maxPerField, current.intAds + scaledSpend * (0.18 + socialBias * 0.35 + cableBias));
      current.mailers = Math.min(maxPerField, current.mailers + scaledSpend * mailBias);
      current.groundGame = Math.min(maxPerField, current.groundGame + scaledSpend * (groundBias + fieldBias));
      current.socialMedia = Math.min(maxPerField, current.socialMedia + scaledSpend * socialBias);
      current.research = Math.min(maxPerField, current.research + scaledSpend * (rival.mediaLanes.includes('rapid_response') ? 0.08 : 0.03));
      current.visits += rival.temperament === 'retail' ? 2 : 1;
      newSpending[stateName] = current;
      newBudget -= scaledSpend;

      const officeCapacity = getOfficeCapacity(operation.officeLevel, operation.officeReadiness);
      const desiredVolunteerStrength = Math.min(
        officeCapacity,
        Math.round((getContestValue(state, rival) * 7) + (difficulty === 'hard' ? 90 : 50) + (operation.officeLevel * 40))
      );
      const volunteersNeeded = Math.max(0, desiredVolunteerStrength - operation.volunteerStrength);
      const volunteerDeploy = Math.min(
        volunteerReserve,
        volunteersNeeded,
        difficulty === 'hard' ? 180 : difficulty === 'normal' ? 130 : 90
      );
      const volunteerCost = volunteerDeploy > 0 ? getVolunteerDeployCost(state, volunteerDeploy) : 0;

      if (volunteerDeploy > 0 && newBudget >= volunteerCost * 0.55) {
        operation.volunteerStrength += volunteerDeploy;
        volunteerReserve -= volunteerDeploy;
        newBudget -= Math.round(volunteerCost * 0.55);
      }

      operations[stateName] = operation;
    }

    const surrogateTargets = targetStates.slice(0, rival.status === 'nominee' ? 3 : 2);
    surrogateTargets.forEach((state, index) => {
      const operation = operations[state.stateName];
      if (!operation) return;
      const baseSurrogatePower = 1.05
        + (difficulty === 'hard' ? 0.32 : difficulty === 'normal' ? 0.16 : 0)
        + (state.region === rival.homeRegion ? 0.28 : 0)
        + (Math.abs(state.partisanLean ?? 0) <= 5 ? 0.18 : 0);
      operation.surrogatePower = baseSurrogatePower;
      operation.assignedSurrogates = [`${rival.id}-surrogate-${index + 1}`];
      operations[state.stateName] = operation;
    });

    const fieldPresence = Object.values(operations).reduce((sum, operation) => {
      return sum + (operation.officeLevel * 8) + Math.floor(operation.volunteerStrength / 30) + Math.round(operation.surrogatePower * 4);
    }, 0);
    const mediaMomentum = rival.mediaLanes.includes('earned_media')
      ? Math.round(rival.earnedMediaSkill / 35)
      : rival.mediaLanes.includes('cable')
        ? 1
        : 0;
    const momentumGain = (difficulty === 'hard' ? 3 : difficulty === 'normal' ? 1 : 0) + (fieldPresence >= 65 ? 1 : 0) + mediaMomentum;
    const trustShift = newBudget > rival.budget
      ? 1 + Math.round(rival.messageDiscipline / 120)
      : officeUpkeep > weeklyIncome * 0.4
        ? -1
        : rival.mediaLanes.includes('rapid_response')
          ? 1
          : 0;

    return {
      ...rival,
      budget: Math.max(0, newBudget),
      momentum: Math.min(100, rival.momentum + momentumGain),
      trust: clampPercentage(rival.trust + trustShift),
      spending: newSpending,
      fieldOperations: operations,
      volunteerReserve
    };
  }

  static generatePrimaryFieldProjection(
    playerIdeology: PlayerDemographics,
    stateData: StateElectionData,
    playerSpending: CampaignSpendingData,
    playerMomentum: number,
    publicTrust: number,
    rivals: RivalAI[],
    playerEndorsementEffect: CandidateStateEndorsementEffect = { scoreMultiplier: 1, turnoutBonus: 0 },
    rivalEndorsementEffects: Record<string, CandidateStateEndorsementEffect> = {},
    playerFieldEffect: FieldOperationEffect = { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 },
    rivalFieldEffects: Record<string, FieldOperationEffect> = {},
    playerMediaEffect: CampaignMediaEffect = emptyMediaEffect(),
    rivalMediaEffects: Record<string, CampaignMediaEffect> = {},
    globalStaffDiv = 2.0,
    globalVisitMult = 1.0,
    playerIssues: string[] = [],
    playerParty: 'Democrat' | 'Republican' = 'Democrat',
    playerName = 'Player',
    playerHomeRegion = 'National'
  ): PrimaryStateProjection {
    const activeRivals = rivals.length > 0 ? rivals : [SimulationEngine.createRivalAI('normal')];
    const trustMultiplier = 0.45 + (publicTrust / 100) * 0.85;
    const playerScore = buildCandidateScore(
      playerIdeology,
      stateData,
      playerSpending,
      globalStaffDiv,
      globalVisitMult,
      playerIssues,
      playerParty,
      trustMultiplier,
      playerMomentum,
      12,
      playerHomeRegion
    ) * playerEndorsementEffect.scoreMultiplier * playerFieldEffect.scoreMultiplier * playerMediaEffect.scoreMultiplier;

    const rivalScores = activeRivals.map((rival) => {
      const statusPenalty = rival.status === 'withdrawn' ? 0.18 : 1;
      const endorsementEffect = rivalEndorsementEffects[rival.id] ?? { scoreMultiplier: 1, turnoutBonus: 0 };
      const fieldEffect = rivalFieldEffects[rival.id] ?? { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 };
      const mediaEffect = rivalMediaEffects[rival.id] ?? emptyMediaEffect();
      const score = buildCandidateScore(
        rival.ideology,
        stateData,
        rival.spending[stateData.stateName] || cloneEmptySpending(),
        2.0,
        1.0,
        [],
        rival.party,
        0.4 + (rival.trust / 100) * 0.9,
        rival.momentum,
        rival.supportBase,
        rival.homeRegion,
        statusPenalty
      ) * endorsementEffect.scoreMultiplier * fieldEffect.scoreMultiplier * mediaEffect.scoreMultiplier;

      return { rival, score };
    });

    const totalGroundGame = (playerSpending.groundGame || 0) +
      rivalScores.reduce((sum, entry) => sum + (entry.rival.spending[stateData.stateName]?.groundGame || 0), 0);
    const totalMomentum = playerMomentum + rivalScores.reduce((sum, entry) => sum + entry.rival.momentum, 0);
    const rivalTurnoutBoost = activeRivals.reduce((sum, rival) => {
      return sum
        + (rivalEndorsementEffects[rival.id]?.turnoutBonus ?? 0)
        + (rivalFieldEffects[rival.id]?.turnoutBonus ?? 0)
        + (rivalMediaEffects[rival.id]?.turnoutBonus ?? 0);
    }, 0);
    const turnout = clampPercentage(
      ElectionMath.calculateTurnout(stateData, totalGroundGame, totalMomentum)
      + playerEndorsementEffect.turnoutBonus
      + playerFieldEffect.turnoutBonus
      + playerMediaEffect.turnoutBonus
      + Math.min(4.5, rivalTurnoutBoost * 0.42)
    );

    const organizationalCertainty = playerFieldEffect.stabilityBonus
      + playerMediaEffect.stabilityBonus
      + activeRivals.reduce((sum, rival) => {
          return sum + (rivalFieldEffects[rival.id]?.stabilityBonus ?? 0) + (rivalMediaEffects[rival.id]?.stabilityBonus ?? 0);
        }, 0);
    const undecided = Math.max(3, Math.min(12, 12 - Math.floor(totalMomentum / 45) - Math.floor(organizationalCertainty / 10)));
    const scoreSum = playerScore + rivalScores.reduce((sum, entry) => sum + entry.score, 0);

    if (scoreSum <= 0) {
      const rivalFallbackShares = activeRivals.map((rival) => ({
        candidateId: rival.id,
        name: rival.name,
        share: 25,
        delegates: 0,
        status: rival.status
      }));
      const fallbackPlayer = {
        candidateId: 'player',
        name: playerName,
        share: 25,
        delegates: 0,
        status: 'player' as const
      };
      return {
        player: 25,
        rival: 25,
        undecided: 50,
        turnout,
        leaderId: activeRivals[0].id,
        leaderName: activeRivals[0].name,
        fieldShares: rivalFallbackShares,
        allFieldShares: [fallbackPlayer, ...rivalFallbackShares]
      };
    }

    const sharePool = 100 - undecided;
    const playerShare = (playerScore / scoreSum) * sharePool;
    const fieldShares = rivalScores.map(({ rival, score }) => ({
      candidateId: rival.id,
      name: rival.name,
      share: (score / scoreSum) * sharePool,
      delegates: 0,
      status: rival.status
    }));
    fieldShares.sort((a, b) => b.share - a.share);
    const leadRival = fieldShares[0];
    const allFieldShares = [
      {
        candidateId: 'player',
        name: playerName,
        share: clampPercentage(playerShare),
        delegates: 0,
        status: 'player' as const
      },
      ...fieldShares
    ].sort((a, b) => b.share - a.share);

    return {
      player: clampPercentage(playerShare),
      rival: clampPercentage(leadRival?.share ?? 0),
      undecided: clampPercentage(undecided),
      turnout,
      leaderId: leadRival?.candidateId ?? activeRivals[0].id,
      leaderName: leadRival?.name ?? activeRivals[0].name,
      fieldShares,
      allFieldShares
    };
  }

  static generateStatePolling(
    playerIdeology: PlayerDemographics,
    stateData: StateElectionData,
    playerSpending: CampaignSpendingData,
    playerMomentum: number,
    publicTrust: number,
    rivalAI: RivalAI,
    playerEndorsementEffect: CandidateStateEndorsementEffect = { scoreMultiplier: 1, turnoutBonus: 0 },
    rivalEndorsementEffect: CandidateStateEndorsementEffect = { scoreMultiplier: 1, turnoutBonus: 0 },
    playerFieldEffect: FieldOperationEffect = { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 },
    rivalFieldEffect: FieldOperationEffect = { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 },
    playerMediaEffect: CampaignMediaEffect = emptyMediaEffect(),
    rivalMediaEffect: CampaignMediaEffect = emptyMediaEffect(),
    globalStaffDiv = 2.0,
    globalVisitMult = 1.0,
    playerIssues: string[] = [],
    playerParty: 'Democrat' | 'Republican' = 'Democrat',
    playerHomeRegion = 'National'
  ): PollingData & { turnout: number } {
    const playerTrustMultiplier = 0.4 + (publicTrust / 100) * 0.9;
    const playerScore = buildCandidateScore(
      playerIdeology,
      stateData,
      playerSpending,
      globalStaffDiv,
      globalVisitMult,
      playerIssues,
      playerParty,
      playerTrustMultiplier,
      playerMomentum,
      12,
      playerHomeRegion
    ) * playerEndorsementEffect.scoreMultiplier * playerFieldEffect.scoreMultiplier * playerMediaEffect.scoreMultiplier;

    const rivalScore = buildCandidateScore(
      rivalAI.ideology,
      stateData,
      rivalAI.spending[stateData.stateName] || cloneEmptySpending(),
      2.0,
      1.0,
      [],
      rivalAI.party,
      0.42 + (rivalAI.trust / 100) * 0.88,
      rivalAI.momentum,
      rivalAI.supportBase,
      rivalAI.homeRegion
    ) * rivalEndorsementEffect.scoreMultiplier * rivalFieldEffect.scoreMultiplier * rivalMediaEffect.scoreMultiplier;

    const stateTurnout = clampPercentage(ElectionMath.calculateTurnout(
      stateData,
      (playerSpending.groundGame || 0) + (rivalAI.spending[stateData.stateName]?.groundGame || 0),
      playerMomentum + rivalAI.momentum
    ) + playerEndorsementEffect.turnoutBonus + playerFieldEffect.turnoutBonus + playerMediaEffect.turnoutBonus + (rivalEndorsementEffect.turnoutBonus * 0.7) + (rivalFieldEffect.turnoutBonus * 0.85) + (rivalMediaEffect.turnoutBonus * 0.75));

    const totalScore = playerScore + rivalScore;
    if (totalScore <= 0) {
      return { player: 33, rival: 33, undecided: 34, turnout: stateTurnout };
    }

    let undecided = 15;
    let playerPct = (playerScore / totalScore) * (100 - undecided);
    let rivalPct = (rivalScore / totalScore) * (100 - undecided);

    playerPct += Math.floor(playerMomentum / 25) + (playerMomentum >= 75 ? 2 : playerMomentum >= 55 ? 1 : 0) + playerMediaEffect.momentumLift + playerMediaEffect.trustLift;
    rivalPct += Math.floor(rivalAI.momentum / 25) + rivalMediaEffect.momentumLift + rivalMediaEffect.trustLift;

    const stabilityNoiseFactor = Math.max(1.9, 6 - (playerFieldEffect.stabilityBonus * 0.35) - (playerMediaEffect.stabilityBonus * 0.24) - (rivalFieldEffect.stabilityBonus * 0.3) - (rivalMediaEffect.stabilityBonus * 0.22));
    const noise = (Math.random() - 0.5) * stabilityNoiseFactor;
    playerPct += noise;
    rivalPct -= noise * 0.7;

    playerPct += playerFieldEffect.stabilityBonus * 0.18;
    playerPct += playerMediaEffect.stabilityBonus * 0.12;
    playerPct -= rivalMediaEffect.rivalPenalty;
    rivalPct += rivalFieldEffect.stabilityBonus * 0.18;
    rivalPct += rivalMediaEffect.stabilityBonus * 0.12;
    rivalPct -= playerMediaEffect.rivalPenalty;

    if (playerPct + rivalPct > 100) {
      const scale = 100 / (playerPct + rivalPct);
      playerPct *= scale;
      rivalPct *= scale;
      undecided = 0;
    } else {
      undecided = 100 - playerPct - rivalPct;
    }

    return {
      player: clampPercentage(playerPct),
      rival: clampPercentage(rivalPct),
      undecided: clampPercentage(undecided),
      turnout: stateTurnout
    };
  }
}
