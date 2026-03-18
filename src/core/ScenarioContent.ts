import type { StateElectionData } from './CampaignDataParser';
import type { CampaignEvent, ScenarioRivalProfile, VPCandidate } from './CampaignTypes';

type Party = 'Democrat' | 'Republican';
type ScenarioTone = 'positive' | 'negative';
type ScenarioEventPhase = 'primary' | 'general';

interface VPStateEffect {
  scoreMultiplier: number;
  turnoutBonus: number;
  narrative: string;
}

type ScenarioRivalOverrides = Partial<Omit<ScenarioRivalProfile, 'ideology' | 'issueBrands' | 'strengths' | 'vulnerabilities' | 'donorLanes' | 'mediaLanes'>> & {
  ideology?: Partial<ScenarioRivalProfile['ideology']>;
  issueBrands?: string[];
  strengths?: string[];
  vulnerabilities?: string[];
  donorLanes?: ScenarioRivalProfile['donorLanes'];
  mediaLanes?: ScenarioRivalProfile['mediaLanes'];
};

function cloneProfile(profile: ScenarioRivalProfile): ScenarioRivalProfile {
  return {
    ...profile,
    ideology: { ...profile.ideology },
    issueBrands: [...profile.issueBrands],
    strengths: [...profile.strengths],
    vulnerabilities: [...profile.vulnerabilities],
    donorLanes: [...profile.donorLanes],
    mediaLanes: [...profile.mediaLanes]
  };
}

function remixProfile(base: ScenarioRivalProfile, overrides: ScenarioRivalOverrides): ScenarioRivalProfile {
  return {
    ...cloneProfile(base),
    ...overrides,
    ideology: { ...base.ideology, ...(overrides.ideology ?? {}) },
    issueBrands: [...(overrides.issueBrands ?? base.issueBrands)],
    strengths: [...(overrides.strengths ?? base.strengths)],
    vulnerabilities: [...(overrides.vulnerabilities ?? base.vulnerabilities)],
    donorLanes: [...(overrides.donorLanes ?? base.donorLanes)],
    mediaLanes: [...(overrides.mediaLanes ?? base.mediaLanes)]
  };
}

function cloneVP(candidate: VPCandidate): VPCandidate {
  return {
    ...candidate,
    homeStates: [...candidate.homeStates],
    issueFocus: [...candidate.issueFocus],
    strengths: [...candidate.strengths],
    liabilities: [...candidate.liabilities],
    bonuses: { ...candidate.bonuses },
    donorLanes: [...candidate.donorLanes],
    mediaLanes: [...candidate.mediaLanes]
  };
}

function remixVP(base: VPCandidate, overrides: Partial<VPCandidate>): VPCandidate {
  return {
    ...cloneVP(base),
    ...overrides,
    homeStates: [...(overrides.homeStates ?? base.homeStates)],
    issueFocus: [...(overrides.issueFocus ?? base.issueFocus)],
    strengths: [...(overrides.strengths ?? base.strengths)],
    liabilities: [...(overrides.liabilities ?? base.liabilities)],
    bonuses: { ...base.bonuses, ...(overrides.bonuses ?? {}) },
    donorLanes: [...(overrides.donorLanes ?? base.donorLanes)],
    mediaLanes: [...(overrides.mediaLanes ?? base.mediaLanes)]
  };
}

const VANILLA_DEM_PRIMARY: ScenarioRivalProfile[] = [
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

const VANILLA_REP_PRIMARY: ScenarioRivalProfile[] = [
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

const VANILLA_GENERAL_OPPONENTS: Record<Party, ScenarioRivalProfile[]> = {
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

const DEM_VP_BENCH: VPCandidate[] = [
  {
    id: 'vp-dem-torres',
    name: 'Sen. Maria Torres',
    title: 'Sun Belt progressive closer',
    description: 'A western senator who electrifies immigrant-heavy metros and sharpens the ticket on rights, housing, and generational change.',
    party: 'Democrat',
    homeRegion: 'West',
    homeStates: ['Arizona', 'Nevada', 'New Mexico'],
    issueFocus: ['Immigration', 'Housing', 'Civil Rights'],
    strengths: ['Sun Belt turnout', 'Debate heat', 'Young activist energy'],
    liabilities: ['Business donor unease', 'Can spook cautious suburbanites'],
    bonuses: { liberal: 14, immigrant: 20, worker: 4 },
    momentumBonus: 7,
    trustBonus: 2,
    budgetBonus: 55000,
    volunteerBonus: 60,
    turnoutBonus: 1.8,
    debateBonus: 6,
    regionalLift: 7,
    battlegroundLift: 4,
    donorLanes: ['small_donors', 'activists', 'labor'],
    mediaLanes: ['digital', 'earned_media', 'rapid_response'],
    surrogatePower: 2.05
  },
  {
    id: 'vp-dem-rowe',
    name: 'Gov. Elias Rowe',
    title: 'Midwestern reassurance governor',
    description: 'A careful governor with labor roots who steadies industrial states and softens trust decay with moderates.',
    party: 'Democrat',
    homeRegion: 'Midwest',
    homeStates: ['Michigan', 'Wisconsin', 'Minnesota'],
    issueFocus: ['Jobs', 'Infrastructure', 'Healthcare'],
    strengths: ['Rust Belt trust', 'Union households', 'Low-drama rollout'],
    liabilities: ['Lower activist enthusiasm', 'Little viral upside'],
    bonuses: { worker: 16, owner: 4, religious: 4 },
    momentumBonus: 3,
    trustBonus: 9,
    budgetBonus: 85000,
    volunteerBonus: 35,
    turnoutBonus: 1.3,
    debateBonus: 2,
    regionalLift: 8,
    battlegroundLift: 5,
    donorLanes: ['labor', 'business'],
    mediaLanes: ['local_tv', 'direct_mail', 'cable'],
    surrogatePower: 1.9
  },
  {
    id: 'vp-dem-chen',
    name: 'Adm. Sarah Chen',
    title: 'Security-and-competence validator',
    description: 'A retired admiral whose appeal is less ideological than atmospheric: competence, order, and calm under pressure.',
    party: 'Democrat',
    homeRegion: 'Northeast',
    homeStates: ['Virginia', 'Massachusetts'],
    issueFocus: ['National Security', 'Democracy', 'Veterans'],
    strengths: ['Trust jolt', 'Swing-voter reassurance', 'Sharp debate frame'],
    liabilities: ['Libertarian drag', 'Can flatten an insurgent brand'],
    bonuses: { worker: 10, religious: 4, libertarian: -10 },
    momentumBonus: 4,
    trustBonus: 13,
    budgetBonus: 65000,
    volunteerBonus: 20,
    turnoutBonus: 0.8,
    debateBonus: 5,
    regionalLift: 4,
    battlegroundLift: 7,
    donorLanes: ['business', 'small_donors'],
    mediaLanes: ['cable', 'local_tv', 'rapid_response'],
    surrogatePower: 1.82
  },
  {
    id: 'vp-dem-baptiste',
    name: 'Mayor Simone Baptiste',
    title: 'Grassroots turnout engine',
    description: 'A charismatic mayor built for campuses, church basements, and volunteer-heavy turnout operations.',
    party: 'Democrat',
    homeRegion: 'South',
    homeStates: ['Georgia', 'North Carolina', 'Louisiana'],
    issueFocus: ['Voting Rights', 'Education', 'Healthcare'],
    strengths: ['Volunteer surge', 'Black turnout', 'Town-hall charisma'],
    liabilities: ['Thin donor-class support', 'High attack exposure'],
    bonuses: { liberal: 8, worker: 10, immigrant: 6 },
    momentumBonus: 8,
    trustBonus: 3,
    budgetBonus: 30000,
    volunteerBonus: 95,
    turnoutBonus: 2.2,
    debateBonus: 4,
    regionalLift: 6,
    battlegroundLift: 6,
    donorLanes: ['small_donors', 'activists', 'labor'],
    mediaLanes: ['earned_media', 'digital', 'rapid_response'],
    surrogatePower: 2.1
  },
  {
    id: 'vp-dem-kim',
    name: 'Rep. Adrian Kim',
    title: 'Digital futurist and donor magnet',
    description: 'A policy-heavy younger member who raises money fast and excels in tech-forward metros.',
    party: 'Democrat',
    homeRegion: 'West',
    homeStates: ['California', 'Colorado', 'Washington'],
    issueFocus: ['Technology', 'Climate Change', 'Housing'],
    strengths: ['Fundraising spike', 'Tech donors', 'Digital discipline'],
    liabilities: ['Can feel too online', 'Older voters may tune out'],
    bonuses: { liberal: 10, libertarian: 10, immigrant: 5 },
    momentumBonus: 6,
    trustBonus: 1,
    budgetBonus: 120000,
    volunteerBonus: 28,
    turnoutBonus: 1.1,
    debateBonus: 3,
    regionalLift: 5,
    battlegroundLift: 3,
    donorLanes: ['tech', 'small_donors'],
    mediaLanes: ['digital', 'rapid_response', 'cable'],
    surrogatePower: 1.78
  }
];

const REP_VP_BENCH: VPCandidate[] = [
  {
    id: 'vp-rep-mitchell',
    name: 'Gov. James Mitchell',
    title: 'Southern executive balancer',
    description: 'A cautious southern governor who broadens business comfort and steadies faith voters in the suburban South.',
    party: 'Republican',
    homeRegion: 'South',
    homeStates: ['Georgia', 'North Carolina', 'Virginia'],
    issueFocus: ['Economy', 'Faith', 'Education'],
    strengths: ['Southern governors lane', 'High-trust rollout', 'Business reassurance'],
    liabilities: ['Limited populist energy', 'Can feel too careful'],
    bonuses: { religious: 15, owner: 15, libertarian: 5 },
    momentumBonus: 4,
    trustBonus: 10,
    budgetBonus: 90000,
    volunteerBonus: 30,
    turnoutBonus: 1.2,
    debateBonus: 2,
    regionalLift: 7,
    battlegroundLift: 5,
    donorLanes: ['business', 'faith'],
    mediaLanes: ['local_tv', 'cable', 'direct_mail'],
    surrogatePower: 1.92
  },
  {
    id: 'vp-rep-cortez',
    name: 'Sen. Helena Cortez',
    title: 'Sun Belt border hammer',
    description: 'A hard-edged senator who turns every interview into a contrast message on border control and public safety.',
    party: 'Republican',
    homeRegion: 'West',
    homeStates: ['Arizona', 'Nevada', 'Texas'],
    issueFocus: ['Immigration', 'National Security', 'Public Safety'],
    strengths: ['Attack power', 'Border message clarity', 'Cable heat'],
    liabilities: ['High backlash ceiling', 'Suburban trust risk'],
    bonuses: { libertarian: 6, religious: 10, immigrant: -6 },
    momentumBonus: 8,
    trustBonus: -1,
    budgetBonus: 60000,
    volunteerBonus: 40,
    turnoutBonus: 1.4,
    debateBonus: 7,
    regionalLift: 6,
    battlegroundLift: 4,
    donorLanes: ['small_donors', 'faith'],
    mediaLanes: ['cable', 'rapid_response', 'earned_media'],
    surrogatePower: 2.03
  },
  {
    id: 'vp-rep-hale',
    name: 'Gen. Warren Hale',
    title: 'Order-and-readiness validator',
    description: 'A retired general whose value is competence, order, and stability under pressure.',
    party: 'Republican',
    homeRegion: 'Midwest',
    homeStates: ['Ohio', 'Pennsylvania', 'Virginia'],
    issueFocus: ['National Security', 'Veterans', 'Order'],
    strengths: ['Trust swing', 'General-election reassurance', 'Low-scandal rollout'],
    liabilities: ['Base libertarians bristle', 'Minimal turnout excitement'],
    bonuses: { worker: 8, religious: 4, libertarian: -9 },
    momentumBonus: 2,
    trustBonus: 14,
    budgetBonus: 50000,
    volunteerBonus: 12,
    turnoutBonus: 0.7,
    debateBonus: 4,
    regionalLift: 5,
    battlegroundLift: 7,
    donorLanes: ['business', 'faith'],
    mediaLanes: ['cable', 'local_tv', 'rapid_response'],
    surrogatePower: 1.8
  },
  {
    id: 'vp-rep-crane',
    name: 'Rep. Mason Crane',
    title: 'Liberty movement closer',
    description: 'A younger libertarian insurgent who expands the online base and drives small-dollar money.',
    party: 'Republican',
    homeRegion: 'West',
    homeStates: ['Utah', 'Colorado', 'Montana'],
    issueFocus: ['Spending', 'Civil Liberties', 'Technology'],
    strengths: ['Digital money', 'Youth-right turnout', 'Ideological intensity'],
    liabilities: ['Coalition ceiling', 'General-election warmth problem'],
    bonuses: { libertarian: 18, owner: 6, worker: 4 },
    momentumBonus: 7,
    trustBonus: -1,
    budgetBonus: 110000,
    volunteerBonus: 36,
    turnoutBonus: 1.1,
    debateBonus: 5,
    regionalLift: 5,
    battlegroundLift: 2,
    donorLanes: ['small_donors', 'tech'],
    mediaLanes: ['digital', 'earned_media', 'rapid_response'],
    surrogatePower: 1.86
  },
  {
    id: 'vp-rep-dawes',
    name: 'Lt. Gov. Abigail Dawes',
    title: 'Midwestern church-and-kitchen-table bridge',
    description: 'A retail politician built for county fairs, local TV, and persuadable churchgoing households.',
    party: 'Republican',
    homeRegion: 'Midwest',
    homeStates: ['Iowa', 'Wisconsin', 'Michigan'],
    issueFocus: ['Faith', 'Education', 'Cost of Living'],
    strengths: ['Retail politics', 'Turnout steadiness', 'Homey trust bump'],
    liabilities: ['Weak big-money pull', 'Less useful in the Sun Belt'],
    bonuses: { religious: 12, worker: 8, owner: 3 },
    momentumBonus: 4,
    trustBonus: 8,
    budgetBonus: 25000,
    volunteerBonus: 70,
    turnoutBonus: 1.9,
    debateBonus: 2,
    regionalLift: 7,
    battlegroundLift: 6,
    donorLanes: ['faith', 'small_donors'],
    mediaLanes: ['local_tv', 'direct_mail', 'earned_media'],
    surrogatePower: 2
  }
];

export function getScenarioIntro(scenarioId: string): string {
  switch (scenarioId) {
    case 'sunbelt_surge':
      return 'Fast-growing metros, immigration pressure, and turnout volatility push the race toward the South and interior West.';
    case 'heartland_reckoning':
      return 'Economic pain and institutional distrust collapse the race inward toward industrial and Appalachian states.';
    case 'restoration_2012':
      return 'A recovery-era race shaped by post-crisis economics, healthcare fights, and the contest between stability and rebellion.';
    case 'fractured_republic_2032':
      return 'A future campaign shaped by climate migration, AI disruption, and collapsing faith in older political institutions.';
    default:
      return 'A modern national presidential race where primaries, coalition management, and the Electoral College all matter.';
  }
}

export function getScenarioStrategicNotes(scenarioId: string): string[] {
  switch (scenarioId) {
    case 'sunbelt_surge':
      return [
        'The best map often runs through Arizona, Georgia, Nevada, North Carolina, and Texas.',
        'Housing, migration, and turnout operations matter more than old industrial playbooks.',
        'Scenario rivals are tuned to metro growth politics and Sun Belt media markets.'
      ];
    case 'heartland_reckoning':
      return [
        'Trust and labor credibility decay faster here than in the default map.',
        'The best runs pair economic message discipline with a durable Midwest organization.',
        'Primary rivals fight over industry, trade, and cultural trust rather than generic vibes.'
      ];
    case 'restoration_2012':
      return [
        'This map is more persuasion-heavy and less digitally dominated than the modern scenarios.',
        'Institutional endorsements and recession-era economic credibility matter more here.',
        'The primary fields reflect older party coalitions and a softer partisan environment.'
      ];
    case 'fractured_republic_2032':
      return [
        'The map rewards future-facing issue ownership but punishes candidates who sound synthetic.',
        'Housing, AI layoffs, and climate resilience create sharper regional contrasts.',
        'The best tickets balance trust and modernity instead of choosing only one.'
      ];
    default:
      return [
        'The map is balanced enough that either party can win with disciplined coalition management.',
        'Primary rosters are broad enough to force you to pick a lane early.',
        'General-election battlegrounds reward both field strength and media discipline.'
      ];
  }
}

export function getScenarioPrimaryProfiles(scenarioId: string, party: Party): ScenarioRivalProfile[] {
  if (scenarioId === 'sunbelt_surge') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_DEM_PRIMARY[0], {
            id: 'sun-dem-ortega',
            name: 'Gov. Lina Ortega',
            shortName: 'Ortega',
            tagline: 'Migration-era coalition builder',
            homeRegion: 'West',
            supportBase: 12,
            momentum: 34,
            ideology: { immigrant: 80, liberal: 68 },
            issueBrands: ['Housing', 'Immigration', 'Economic Growth'],
            strengths: ['Metro coalition', 'Sun Belt validators', 'Arizona donors'],
            vulnerabilities: ['Rust Belt softness', 'Can look too growth-first']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[1], {
            id: 'sun-dem-boone',
            name: 'Mayor Tyrell Boone',
            shortName: 'Boone',
            tagline: 'Turnout-first southern reformer',
            homeRegion: 'South',
            issueBrands: ['Voting Rights', 'Education', 'Healthcare'],
            strengths: ['Southern field energy', 'Retail charisma', 'Black turnout networks'],
            vulnerabilities: ['Thin donor safety net', 'Policy edges can blur']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[2], {
            id: 'sun-dem-castillo',
            name: 'Sec. Ana Castillo',
            shortName: 'Castillo',
            tagline: 'Economic-growth pragmatist',
            homeRegion: 'South',
            issueBrands: ['Supply Chains', 'Business Growth', 'Infrastructure'],
            strengths: ['Latino business donors', 'Cable confidence', 'Executive framing'],
            vulnerabilities: ['Movement suspicion', 'Feels too consultant-built']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[3], {
            id: 'sun-dem-kwan',
            name: 'Rep. Naomi Kwan',
            shortName: 'Kwan',
            tagline: 'Climate-and-housing insurgent',
            issueBrands: ['Climate Change', 'Housing', 'Civil Rights'],
            strengths: ['Young metro organizers', 'Digital agility', 'Climate credibility'],
            vulnerabilities: ['Older homeowners recoil', 'Overpromises under scrutiny']
          })
        ]
      : [
          remixProfile(VANILLA_REP_PRIMARY[0], {
            id: 'sun-rep-trask',
            name: 'Gov. Holden Trask',
            shortName: 'Trask',
            tagline: 'Growth-state executive conservative',
            issueBrands: ['Business Growth', 'Border', 'Energy'],
            strengths: ['Developer money', 'Statehouse record', 'Suburban donor comfort'],
            vulnerabilities: ['Base enthusiasm gap', 'Feels transactional']
          }),
          remixProfile(VANILLA_REP_PRIMARY[1], {
            id: 'sun-rep-roman',
            name: 'Sen. Isabel Roman',
            shortName: 'Roman',
            tagline: 'Security-first Sun Belt hawk',
            homeRegion: 'West',
            issueBrands: ['Border', 'Public Safety', 'National Security'],
            strengths: ['Attack sharpness', 'Media-market strength', 'Hardline clarity'],
            vulnerabilities: ['Suburban softness', 'Backlash ceiling']
          }),
          remixProfile(VANILLA_REP_PRIMARY[2], {
            id: 'sun-rep-hale',
            name: 'Rev. Micah Hale',
            shortName: 'Hale',
            tagline: 'Family-values movement pastor',
            issueBrands: ['Faith', 'Education', 'Family'],
            strengths: ['Church turnout machine', 'Volunteer discipline', 'Base intensity'],
            vulnerabilities: ['Corporate donor limits', 'Can alienate moderates']
          }),
          remixProfile(VANILLA_REP_PRIMARY[3], {
            id: 'sun-rep-reeves',
            name: 'Rep. Colin Reeves',
            shortName: 'Reeves',
            tagline: 'Anti-system growth libertarian',
            issueBrands: ['Technology', 'Spending', 'Anti-Establishment'],
            strengths: ['Crypto donors', 'Online energy', 'Earned-media spikes'],
            vulnerabilities: ['Scandal prone', 'Thin county-level organization']
          })
        ]).map(cloneProfile);
  }

  if (scenarioId === 'heartland_reckoning') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_DEM_PRIMARY[0], {
            id: 'heart-dem-voss',
            name: 'Gov. Mara Voss',
            shortName: 'Voss',
            tagline: 'Blue-collar governance moderate',
            homeRegion: 'Midwest',
            supportBase: 13,
            trust: 60,
            issueBrands: ['Jobs', 'Manufacturing', 'Healthcare'],
            strengths: ['Industrial-state comfort', 'Governor credibility', 'Donor stability'],
            vulnerabilities: ['Lower youth enthusiasm', 'Can feel overly cautious']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[1], {
            id: 'heart-dem-hollis',
            name: 'Sen. Grant Hollis',
            shortName: 'Hollis',
            tagline: 'Economic patriot populist',
            supportBase: 13,
            momentum: 38,
            issueBrands: ['Trade', 'Jobs', 'Industrial Policy'],
            strengths: ['Union depth', 'Anti-offshoring pitch', 'Rust Belt retail politics'],
            vulnerabilities: ['Business money hostility', 'Sun Belt weakness']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[2], {
            id: 'heart-dem-keane',
            name: 'Treas. Olivia Keane',
            shortName: 'Keane',
            tagline: 'Deficit-minded technocrat',
            issueBrands: ['Deficit', 'Inflation', 'Stability'],
            strengths: ['Credibility with anxious moderates', 'Cable composure', 'Elite confidence'],
            vulnerabilities: ['No room for charisma', 'Cold on the stump']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[3], {
            id: 'heart-dem-sawyer',
            name: 'Lt. Gov. Aisha Sawyer',
            shortName: 'Sawyer',
            tagline: 'Labor-left organizer',
            homeRegion: 'Midwest',
            issueBrands: ['Labor Rights', 'Healthcare', 'Democracy'],
            strengths: ['Volunteer intensity', 'Factory-town energy', 'Issue clarity'],
            vulnerabilities: ['Regional ceiling', 'Smaller donor class']
          })
        ]
      : [
          remixProfile(VANILLA_REP_PRIMARY[0], {
            id: 'heart-rep-iverson',
            name: 'Gov. Dean Iverson',
            shortName: 'Iverson',
            tagline: 'Managerial tax-cutter',
            homeRegion: 'Midwest',
            issueBrands: ['Taxes', 'Manufacturing', 'Competence'],
            strengths: ['Executive calm', 'Midwest chamber donors', 'Low-drama message'],
            vulnerabilities: ['Base suspicion', 'Weak earned media']
          }),
          remixProfile(VANILLA_REP_PRIMARY[1], {
            id: 'heart-rep-caldwell',
            name: 'Sen. Ruth Caldwell',
            shortName: 'Caldwell',
            tagline: 'Cultural grievance closer',
            supportBase: 13,
            issueBrands: ['Public Safety', 'Border', 'Anti-Elite'],
            strengths: ['Talk-radio dominance', 'Blue-collar right lane', 'Aggressive contrast'],
            vulnerabilities: ['Suburban blowback', 'Trust swings']
          }),
          remixProfile(VANILLA_REP_PRIMARY[2], {
            id: 'heart-rep-stone',
            name: 'Pastor Nate Stone',
            shortName: 'Stone',
            tagline: 'Values-first movement preacher',
            issueBrands: ['Faith', 'Family', 'Education'],
            strengths: ['Evangelical turnout', 'Small-dollar intensity', 'County-fair charisma'],
            vulnerabilities: ['Moderate ceiling', 'Fundraising volatility']
          }),
          remixProfile(VANILLA_REP_PRIMARY[3], {
            id: 'heart-rep-greer',
            name: 'Rep. Miles Greer',
            shortName: 'Greer',
            tagline: 'Anti-spending iconoclast',
            homeRegion: 'Midwest',
            issueBrands: ['Spending', 'Civil Liberties', 'Anti-Washington'],
            strengths: ['Online outsider lane', 'Earned-media chaos', 'Anti-establishment donors'],
            vulnerabilities: ['Low discipline', 'Can implode under scrutiny']
          })
        ]).map(cloneProfile);
  }

  if (scenarioId === 'restoration_2012') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_DEM_PRIMARY[0], {
            id: 'rest-dem-calloway',
            name: 'Gov. Helen Calloway',
            shortName: 'Calloway',
            tagline: 'Recovery-era incumbent ally',
            issueBrands: ['Healthcare', 'Recovery', 'Governance'],
            strengths: ['Stability argument', 'Institutional backers', 'Suburban women'],
            vulnerabilities: ['Represents the status quo', 'Base hunger for sharper change']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[1], {
            id: 'rest-dem-shepard',
            name: 'Sen. Daniel Shepard',
            shortName: 'Shepard',
            tagline: 'Manufacturing populist',
            momentum: 34,
            issueBrands: ['Jobs', 'Trade', 'Medicare'],
            strengths: ['Union loyalty', 'Rust Belt resonance', 'Straight-talk style'],
            vulnerabilities: ['Sun Belt weakness', 'Business donor hostility']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[2], {
            id: 'rest-dem-marin',
            name: 'Sec. Alicia Marin',
            shortName: 'Marin',
            tagline: 'Foreign-policy competence voice',
            issueBrands: ['National Security', 'Budget', 'Diplomacy'],
            strengths: ['Security gravitas', 'Policy depth', 'Affluent professionals'],
            vulnerabilities: ['Little movement energy', 'Can feel over-scripted']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[3], {
            id: 'rest-dem-benton',
            name: 'Mayor Isaiah Benton',
            shortName: 'Benton',
            tagline: 'Grassroots anti-poverty reformer',
            homeRegion: 'South',
            issueBrands: ['Healthcare', 'Civil Rights', 'Education'],
            strengths: ['Urban turnout', 'Volunteer enthusiasm', 'Moral urgency'],
            vulnerabilities: ['Thin donor class', 'Tough sell in affluent suburbs']
          })
        ]
      : [
          remixProfile(VANILLA_REP_PRIMARY[0], {
            id: 'rest-rep-whitaker',
            name: 'Gov. Thomas Whitaker',
            shortName: 'Whitaker',
            tagline: 'Boardroom-ready governor',
            issueBrands: ['Taxes', 'Deficit', 'Competence'],
            strengths: ['Donor class favorite', 'Executive record', 'Calm contrast'],
            vulnerabilities: ['Tea Party distrust', 'Muted base enthusiasm']
          }),
          remixProfile(VANILLA_REP_PRIMARY[1], {
            id: 'rest-rep-barrett',
            name: 'Sen. June Barrett',
            shortName: 'Barrett',
            tagline: 'Tea Party attack specialist',
            issueBrands: ['Deficit', 'Public Safety', 'Judges'],
            strengths: ['Primary debate edge', 'Movement enthusiasm', 'Sharp ideological lane'],
            vulnerabilities: ['General-election drag', 'Press combat fallout']
          }),
          remixProfile(VANILLA_REP_PRIMARY[2], {
            id: 'rest-rep-maddox',
            name: 'Gov. Caleb Maddox',
            shortName: 'Maddox',
            tagline: 'Religious-right executive',
            issueBrands: ['Faith', 'Family', 'Judges'],
            strengths: ['Church network', 'Trust with activists', 'Solid field work'],
            vulnerabilities: ['Limited crossover appeal', 'Donor breadth issues']
          }),
          remixProfile(VANILLA_REP_PRIMARY[3], {
            id: 'rest-rep-fairchild',
            name: 'Rep. Peter Fairchild',
            shortName: 'Fairchild',
            tagline: 'Liberty caucus insurgent',
            issueBrands: ['Spending', 'Civil Liberties', 'Anti-Washington'],
            strengths: ['Online money', 'Young-right energy', 'Earned-media spark'],
            vulnerabilities: ['Coalition ceiling', 'High volatility']
          })
        ]).map(cloneProfile);
  }

  if (scenarioId === 'fractured_republic_2032') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_DEM_PRIMARY[0], {
            id: 'fract-dem-solis',
            name: 'Gov. Eva Solis',
            shortName: 'Solis',
            tagline: 'Climate migration manager',
            homeRegion: 'West',
            issueBrands: ['Housing', 'Climate Change', 'Water'],
            strengths: ['Governor competence', 'Western metro coalition', 'Crisis-management brand'],
            vulnerabilities: ['Rural suspicion', 'Movement impatience']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[1], {
            id: 'fract-dem-griggs',
            name: 'Sen. Nolan Griggs',
            shortName: 'Griggs',
            tagline: 'AI layoff populist',
            issueBrands: ['Jobs', 'Technology', 'Trade'],
            strengths: ['Worker empathy', 'Union discipline', 'Earned media'],
            vulnerabilities: ['Executive-donor panic', 'Can sound punitive']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[2], {
            id: 'fract-dem-suri',
            name: 'Sec. Priya Suri',
            shortName: 'Suri',
            tagline: 'Future-growth technocrat',
            homeRegion: 'West',
            issueBrands: ['Technology', 'Infrastructure', 'Education'],
            strengths: ['Tech donors', 'Policy depth', 'Calm under pressure'],
            vulnerabilities: ['Too elite-coded', 'Volunteer enthusiasm can lag']
          }),
          remixProfile(VANILLA_DEM_PRIMARY[3], {
            id: 'fract-dem-lambert',
            name: 'Mayor Tessa Lambert',
            shortName: 'Lambert',
            tagline: 'Housing-and-rights insurgent',
            issueBrands: ['Housing', 'Civil Rights', 'Democracy'],
            strengths: ['Young organizers', 'Digital storytelling', 'Movement intensity'],
            vulnerabilities: ['Overpromising risk', 'Donor skepticism']
          })
        ]
      : [
          remixProfile(VANILLA_REP_PRIMARY[0], {
            id: 'fract-rep-wolfe',
            name: 'Gov. Garrett Wolfe',
            shortName: 'Wolfe',
            tagline: 'Sun Belt executive nationalist',
            issueBrands: ['Energy', 'Border', 'Manufacturing'],
            strengths: ['Executive record', 'Donor resilience', 'Growth-state frame'],
            vulnerabilities: ['Authenticity questions', 'Warmth gap']
          }),
          remixProfile(VANILLA_REP_PRIMARY[1], {
            id: 'fract-rep-sorrell',
            name: 'Sen. Maeve Sorrell',
            shortName: 'Sorrell',
            tagline: 'Anti-chaos law-and-order hawk',
            issueBrands: ['Public Safety', 'Border', 'Judges'],
            strengths: ['Attack discipline', 'TV command', 'Base trust'],
            vulnerabilities: ['Suburban backlash risk', 'Cultural overreach']
          }),
          remixProfile(VANILLA_REP_PRIMARY[2], {
            id: 'fract-rep-roark',
            name: 'Pastor Gideon Roark',
            shortName: 'Roark',
            tagline: 'Values-war revivalist',
            issueBrands: ['Faith', 'Education', 'Family'],
            strengths: ['Base intensity', 'Volunteer loyalty', 'Pulpit charisma'],
            vulnerabilities: ['General-election ceiling', 'Weak donor range']
          }),
          remixProfile(VANILLA_REP_PRIMARY[3], {
            id: 'fract-rep-mercer',
            name: 'Rep. Luke Mercer',
            shortName: 'Mercer',
            tagline: 'AI-economy libertarian disruptor',
            issueBrands: ['Technology', 'Spending', 'Civil Liberties'],
            strengths: ['Online money', 'Future-economy message', 'Earned media'],
            vulnerabilities: ['High scandal exposure', 'Thin machine politics']
          })
        ]).map(cloneProfile);
  }

  return (party === 'Democrat' ? VANILLA_DEM_PRIMARY : VANILLA_REP_PRIMARY).map(cloneProfile);
}

export function getScenarioGeneralOpponentProfiles(scenarioId: string, party: Party): ScenarioRivalProfile[] {
  if (scenarioId === 'sunbelt_surge') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[0], {
            id: 'sun-gen-dem-lucero',
            name: 'Gov. Elena Lucero',
            shortName: 'Lucero',
            tagline: 'Sun Belt coalition closer',
            issueBrands: ['Immigration', 'Housing', 'Abortion Rights'],
            strengths: ['Metro turnout bench', 'Latino coalition', 'Sharp battleground instincts'],
            vulnerabilities: ['Rust Belt softness', 'Donor class tension']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[1], {
            id: 'sun-gen-dem-ford',
            name: 'Gov. Preston Ford',
            shortName: 'Ford',
            tagline: 'Growth-economy moderate',
            issueBrands: ['Business Growth', 'Infrastructure', 'Competence'],
            strengths: ['Suburban reassurance', 'Executive calm', 'Business crossover'],
            vulnerabilities: ['Activist impatience', 'Turnout ceiling']
          })
        ]
      : [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[0], {
            id: 'sun-gen-rep-cardenas',
            name: 'Gov. Victor Cardenas',
            shortName: 'Cardenas',
            tagline: 'Border-and-growth conservative',
            issueBrands: ['Border', 'Economy', 'Energy'],
            strengths: ['Texas donor machine', 'Growth-state frame', 'Stable operation'],
            vulnerabilities: ['Warmth gap', 'Metropolitan softness']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[1], {
            id: 'sun-gen-rep-voss',
            name: 'Sen. Caroline Voss',
            shortName: 'Voss',
            tagline: 'Sun Belt populist messenger',
            issueBrands: ['Border', 'Public Safety', 'Anti-Elite'],
            strengths: ['Cable heat', 'Cultural contrast', 'Base energy'],
            vulnerabilities: ['Trust volatility', 'Suburban backlash']
          })
        ]).map(cloneProfile);
  }

  if (scenarioId === 'heartland_reckoning') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[0], {
            id: 'heart-gen-dem-voss',
            name: 'Gov. Mara Voss',
            shortName: 'Voss',
            tagline: 'Midwest rebuild Democrat',
            issueBrands: ['Jobs', 'Healthcare', 'Manufacturing'],
            strengths: ['Industrial-state comfort', 'Trust with moderates', 'Low-drama operation'],
            vulnerabilities: ['Sun Belt ceiling', 'Lower activist heat']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[1], {
            id: 'heart-gen-dem-hollis',
            name: 'Sen. Grant Hollis',
            shortName: 'Hollis',
            tagline: 'Economic populist challenger',
            issueBrands: ['Trade', 'Jobs', 'Cost of Living'],
            strengths: ['Union households', 'Blue-collar pitch', 'Sharp contrast'],
            vulnerabilities: ['Donor class hostility', 'Culture-war crossfire']
          })
        ]
      : [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[0], {
            id: 'heart-gen-rep-caldwell',
            name: 'Sen. Ruth Caldwell',
            shortName: 'Caldwell',
            tagline: 'Working-class grievance conservative',
            issueBrands: ['Trade', 'Public Safety', 'Anti-Elite'],
            strengths: ['Talk-radio dominance', 'Blue-collar right lane', 'Contrast discipline'],
            vulnerabilities: ['Trust volatility', 'Suburban slippage']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[1], {
            id: 'heart-gen-rep-iverson',
            name: 'Gov. Dean Iverson',
            shortName: 'Iverson',
            tagline: 'Managerial Midwest conservative',
            issueBrands: ['Taxes', 'Inflation', 'Competence'],
            strengths: ['Executive record', 'Chamber donors', 'Moderate reassurance'],
            vulnerabilities: ['Base energy ceiling', 'Earned-media weakness']
          })
        ]).map(cloneProfile);
  }

  if (scenarioId === 'restoration_2012') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[1], {
            id: 'rest-gen-dem-calloway',
            name: 'Gov. Helen Calloway',
            shortName: 'Calloway',
            tagline: 'Recovery-era governing Democrat',
            issueBrands: ['Healthcare', 'Recovery', 'Governance'],
            strengths: ['Institutional confidence', 'Suburban calm', 'Validator-heavy coalition'],
            vulnerabilities: ['Status-quo baggage', 'Base heat ceiling']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[0], {
            id: 'rest-gen-dem-benton',
            name: 'Mayor Isaiah Benton',
            shortName: 'Benton',
            tagline: 'Grassroots reform Democrat',
            issueBrands: ['Healthcare', 'Jobs', 'Civil Rights'],
            strengths: ['Urban enthusiasm', 'Volunteer energy', 'Moral clarity'],
            vulnerabilities: ['Donor skepticism', 'Suburban trust wobble']
          })
        ]
      : [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[0], {
            id: 'rest-gen-rep-whitaker',
            name: 'Gov. Thomas Whitaker',
            shortName: 'Whitaker',
            tagline: 'Boardroom conservative nominee',
            issueBrands: ['Deficit', 'Taxes', 'Competence'],
            strengths: ['Executive polish', 'Donor confidence', 'Suburban reassurance'],
            vulnerabilities: ['Base intensity shortfall', 'Retail stiffness']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[1], {
            id: 'rest-gen-rep-barrett',
            name: 'Sen. June Barrett',
            shortName: 'Barrett',
            tagline: 'Tea Party-era populist closer',
            issueBrands: ['Deficit', 'Judges', 'Anti-Washington'],
            strengths: ['Movement energy', 'Cable contrast', 'Blue-collar anger'],
            vulnerabilities: ['Moderate recoil', 'Trust volatility']
          })
        ]).map(cloneProfile);
  }

  if (scenarioId === 'fractured_republic_2032') {
    return (party === 'Democrat'
      ? [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[0], {
            id: 'fract-gen-dem-solis',
            name: 'Gov. Eva Solis',
            shortName: 'Solis',
            tagline: 'Future-proofing Democrat',
            issueBrands: ['Climate Change', 'Housing', 'Technology'],
            strengths: ['Western coalition', 'Crisis-management brand', 'Urban trust'],
            vulnerabilities: ['Feels technocratic', 'Rural ceiling']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Democrat[1], {
            id: 'fract-gen-dem-griggs',
            name: 'Sen. Nolan Griggs',
            shortName: 'Griggs',
            tagline: 'AI-economy populist',
            issueBrands: ['Jobs', 'Technology', 'Trade'],
            strengths: ['Worker empathy', 'Earned media', 'Sharp contrast'],
            vulnerabilities: ['Donor resistance', 'Overheated rhetoric risk']
          })
        ]
      : [
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[0], {
            id: 'fract-gen-rep-wolfe',
            name: 'Gov. Garrett Wolfe',
            shortName: 'Wolfe',
            tagline: 'Nationalist growth-state conservative',
            issueBrands: ['Energy', 'Border', 'Manufacturing'],
            strengths: ['Sun Belt money', 'Executive record', 'Stable machine'],
            vulnerabilities: ['Warmth gap', 'Metropolitan softness']
          }),
          remixProfile(VANILLA_GENERAL_OPPONENTS.Republican[1], {
            id: 'fract-gen-rep-sorrell',
            name: 'Sen. Maeve Sorrell',
            shortName: 'Sorrell',
            tagline: 'Anti-chaos conservative closer',
            issueBrands: ['Public Safety', 'Border', 'Anti-Elite'],
            strengths: ['Contrast message', 'Cable command', 'Base trust'],
            vulnerabilities: ['Suburban backlash', 'Overexposure risk']
          })
        ]).map(cloneProfile);
  }

  return VANILLA_GENERAL_OPPONENTS[party].map(cloneProfile);
}

export function getScenarioVPCandidates(scenarioId: string, party: Party): VPCandidate[] {
  const baseBench = (party === 'Democrat' ? DEM_VP_BENCH : REP_VP_BENCH).map(cloneVP);

  const tunedBench = baseBench.map((candidate) => {
    if (scenarioId === 'sunbelt_surge') {
      return remixVP(candidate, {
        regionalLift: candidate.homeRegion === 'West' || candidate.homeRegion === 'South' ? candidate.regionalLift + 1 : candidate.regionalLift,
        battlegroundLift: candidate.battlegroundLift + 1
      });
    }
    if (scenarioId === 'heartland_reckoning') {
      return remixVP(candidate, {
        trustBonus: candidate.homeRegion === 'Midwest' ? candidate.trustBonus + 2 : candidate.trustBonus,
        turnoutBonus: candidate.homeRegion === 'Midwest' ? candidate.turnoutBonus + 0.4 : candidate.turnoutBonus
      });
    }
    if (scenarioId === 'restoration_2012') {
      return remixVP(candidate, {
        budgetBonus: Math.floor(candidate.budgetBonus * 0.8),
        mediaLanes: candidate.mediaLanes.filter((lane) => lane !== 'digital')
      });
    }
    if (scenarioId === 'fractured_republic_2032') {
      return remixVP(candidate, {
        budgetBonus: Math.floor(candidate.budgetBonus * 1.1),
        issueFocus: candidate.issueFocus.includes('Technology') ? candidate.issueFocus : [...candidate.issueFocus, 'Technology']
      });
    }
    return candidate;
  });

  return tunedBench.sort((left, right) => {
    const leftScore = left.regionalLift + left.battlegroundLift + left.debateBonus + (left.turnoutBonus * 2);
    const rightScore = right.regionalLift + right.battlegroundLift + right.debateBonus + (right.turnoutBonus * 2);
    return rightScore - leftScore;
  });
}

export function getScenarioEventDeck(
  scenarioId: string,
  phase: ScenarioEventPhase,
  tone: ScenarioTone
): CampaignEvent[] {
  if (scenarioId === 'sunbelt_surge' && tone === 'positive') {
    return phase === 'primary'
      ? [{
          title: 'Metro Coalition Surge',
          description: 'Fast-growth county organizers report that your message is suddenly sticking in outer-ring suburbs and exurbs at the same time.',
          phase: 'primary',
          choices: [
            { text: 'Scale the suburban field push', moneyEffect: -70000, momentumEffect: 10, trustEffect: 4, tags: ['Suburban push', 'Turnout math', 'Growth counties'] },
            { text: 'Pair it with a housing affordability speech', moneyEffect: -30000, momentumEffect: 7, trustEffect: 6, tags: ['Housing lane', 'Message fit', 'Metro appeal'] }
          ]
        }]
      : [{
          title: 'Border-State Tour Breaks Through',
          description: 'A carefully staged swing through border and migration states lands as credible rather than opportunistic.',
          phase: 'general',
          choices: [
            { text: 'Keep the issue at center stage', moneyEffect: -65000, momentumEffect: 9, trustEffect: 3, tags: ['Issue ownership', 'Targeted contrast', 'Sun Belt expansion'] },
            { text: 'Broaden the message to cost of living', moneyEffect: -35000, momentumEffect: 6, trustEffect: 5, tags: ['Pocketbook pivot', 'Suburban reassurance', 'Map broadening'] }
          ]
        }];
  }
  if (scenarioId === 'sunbelt_surge' && tone === 'negative') {
    return phase === 'primary'
      ? [{
          title: 'Growth-County Blowback',
          description: 'Your campaign gets tagged as too cozy with developers just as housing anger spikes in the suburbs.',
          phase: 'primary',
          choices: [
            { text: 'Distance yourself from local donors', moneyEffect: -85000, momentumEffect: -4, trustEffect: 7, tags: ['Clean break', 'Trust repair', 'Donor pain'] },
            { text: 'Defend the growth agenda', moneyEffect: 25000, momentumEffect: 2, trustEffect: -8, tags: ['Growth defense', 'Suburban risk', 'Money lane'] }
          ]
        }]
      : [{
          title: 'Heatwave Infrastructure Failure',
          description: 'Rolling blackouts and a failed local appearance make the race suddenly about competence under climate pressure.',
          phase: 'general',
          choices: [
            { text: 'Treat it as a management crisis', moneyEffect: -80000, momentumEffect: -2, trustEffect: 6, tags: ['Competence frame', 'Crisis management', 'Low flash'] },
            { text: 'Exploit it as proof your rival is unserious', moneyEffect: -20000, momentumEffect: 4, trustEffect: -5, tags: ['Attack line', 'Risky contrast', 'Media heat'] }
          ]
        }];
  }

  if (scenarioId === 'heartland_reckoning' && tone === 'positive') {
    return phase === 'primary'
      ? [{
          title: 'Plant Closure Response Resonates',
          description: 'A hard-edged response to a plant closure breaks through with local TV, union households, and anxious independents.',
          phase: 'primary',
          choices: [
            { text: 'Keep hammering the jobs argument', moneyEffect: -50000, momentumEffect: 11, trustEffect: 5, tags: ['Jobs message', 'Local TV', 'Blue-collar resonance'] },
            { text: 'Pair it with an industrial policy plan', moneyEffect: -40000, momentumEffect: 7, trustEffect: 8, tags: ['Policy depth', 'Economic seriousness', 'Trust lift'] }
          ]
        }]
      : [{
          title: 'Union Hall Tour Rebuilds the Narrative',
          description: 'A week of disciplined labor appearances gives the ticket a grounded, human scale the race badly needed.',
          phase: 'general',
          choices: [
            { text: 'Keep the tour small and authentic', moneyEffect: -30000, momentumEffect: 6, trustEffect: 7, tags: ['Authenticity', 'Labor lane', 'Trust repair'] },
            { text: 'Scale it with paid media immediately', moneyEffect: -95000, momentumEffect: 9, trustEffect: 4, tags: ['Amplification', 'Ad spend', 'Industrial map'] }
          ]
        }];
  }
  if (scenarioId === 'heartland_reckoning' && tone === 'negative') {
    return phase === 'primary'
      ? [{
          title: 'Trade Message Backfires',
          description: 'A trade attack line lands as glib in counties that have already heard every version of it for decades.',
          phase: 'primary',
          choices: [
            { text: 'Admit the line missed and recalibrate', moneyEffect: -25000, momentumEffect: -5, trustEffect: 5, tags: ['Reset', 'Humility', 'Message repair'] },
            { text: 'Double down on economic anger', moneyEffect: 0, momentumEffect: 3, trustEffect: -9, tags: ['Anger play', 'Backlash risk', 'Short-term pop'] }
          ]
        }]
      : [{
          title: 'Factory-County Rumor Mill',
          description: 'A local rumor campaign turns your national message into a regional trust problem almost overnight.',
          phase: 'general',
          choices: [
            { text: 'Flood the counties with local validators', moneyEffect: -85000, momentumEffect: -2, trustEffect: 6, tags: ['Validator blitz', 'County repair', 'Trust defense'] },
            { text: 'Ignore it and stay national', moneyEffect: 0, momentumEffect: -7, trustEffect: -6, tags: ['National message', 'Local drift', 'Risky hold'] }
          ]
        }];
  }

  if (scenarioId === 'restoration_2012' && tone === 'positive') {
    return phase === 'primary'
      ? [{
          title: 'Recovery Tour Finds Its Frame',
          description: 'A week of factory-floor stops and middle-class economics messaging finally clicks into a coherent narrative.',
          phase: 'primary',
          choices: [
            { text: 'Lean into kitchen-table economics', moneyEffect: -45000, momentumEffect: 10, trustEffect: 6, tags: ['Middle-class frame', 'Trust gain', 'Economic discipline'] },
            { text: 'Sell competence over emotion', moneyEffect: -15000, momentumEffect: 5, trustEffect: 7, tags: ['Competence', 'Moderate appeal', 'Low drama'] }
          ]
        }]
      : [{
          title: 'Convention Bounce Holds',
          description: 'Your party emerges unusually unified, giving the ticket a calm, confident opening stretch in the general election.',
          phase: 'general',
          choices: [
            { text: 'Translate unity into a donor sprint', moneyEffect: 110000, momentumEffect: 7, trustEffect: 2, tags: ['Unity money', 'Post-convention surge', 'Low-risk boost'] },
            { text: 'Translate unity into a trust tour', moneyEffect: -30000, momentumEffect: 5, trustEffect: 6, tags: ['Validator tour', 'Trust lift', 'Grounded message'] }
          ]
        }];
  }
  if (scenarioId === 'restoration_2012' && tone === 'negative') {
    return phase === 'primary'
      ? [{
          title: 'Primary Electability Panic',
          description: 'Party insiders start whispering that your coalition may be too narrow for the general election.',
          phase: 'primary',
          choices: [
            { text: 'Answer it with validators and donors', moneyEffect: -95000, momentumEffect: 1, trustEffect: 5, tags: ['Insider repair', 'Elite signaling', 'Expensive calm'] },
            { text: 'Attack the elites and base up', moneyEffect: 20000, momentumEffect: 6, trustEffect: -8, tags: ['Base-up move', 'Electability backlash', 'Risky anger'] }
          ]
        }]
      : [{
          title: 'Cable News Horse-Race Spiral',
          description: 'A rough week of cable chatter narrows the race everywhere at once and pressures nervous donors.',
          phase: 'general',
          choices: [
            { text: 'Buy calm and saturate local TV', moneyEffect: -130000, momentumEffect: -2, trustEffect: 5, tags: ['Local TV wall', 'Donor calming', 'Defensive posture'] },
            { text: 'Try to punch through with a single big speech', moneyEffect: -40000, momentumEffect: 4, trustEffect: -4, tags: ['High-risk reset', 'National speech', 'Narrative gamble'] }
          ]
        }];
  }

  if (scenarioId === 'fractured_republic_2032' && tone === 'positive') {
    return phase === 'primary'
      ? [{
          title: 'AI Layoff Message Breaks Through',
          description: 'A speech linking technological disruption to dignity, retraining, and local investment suddenly becomes the campaign’s clearest message.',
          phase: 'primary',
          choices: [
            { text: 'Nationalize the message immediately', moneyEffect: -70000, momentumEffect: 11, trustEffect: 4, tags: ['National frame', 'Future economy', 'Earned media'] },
            { text: 'Target it to the most disrupted states', moneyEffect: -45000, momentumEffect: 7, trustEffect: 7, tags: ['Targeted rollout', 'Trust-building', 'Industrial pockets'] }
          ]
        }]
      : [{
          title: 'Climate Resilience Tour Lands',
          description: 'What looked like a risky future-focused message now feels concrete and competent after a run of credible local appearances.',
          phase: 'general',
          choices: [
            { text: 'Pair it with a jobs guarantee pitch', moneyEffect: -60000, momentumEffect: 9, trustEffect: 5, tags: ['Jobs + resilience', 'Policy synthesis', 'Trust lift'] },
            { text: 'Keep the message managerial and calm', moneyEffect: -25000, momentumEffect: 5, trustEffect: 7, tags: ['Competence frame', 'Calm leadership', 'Moderate reach'] }
          ]
        }];
  }
  if (scenarioId === 'fractured_republic_2032' && tone === 'negative') {
    return phase === 'primary'
      ? [{
          title: 'Synthetic Campaign Narrative',
          description: 'Commentators start describing your campaign as algorithmic, over-optimized, and emotionally hollow.',
          phase: 'primary',
          choices: [
            { text: 'Slow down and do more retail stops', moneyEffect: -50000, momentumEffect: -3, trustEffect: 6, tags: ['Retail politics', 'Human reset', 'Lower burn'] },
            { text: 'Fight on the terrain you know best', moneyEffect: -20000, momentumEffect: 3, trustEffect: -7, tags: ['Digital heavy', 'Narrative risk', 'Confidence play'] }
          ]
        }]
      : [{
          title: 'Water Crisis Visit Goes Sideways',
          description: 'A highly visible trip to a water-stressed region turns into a symbol of overpromising and under-preparing.',
          phase: 'general',
          choices: [
            { text: 'Admit the miss and reset the plan', moneyEffect: -35000, momentumEffect: -4, trustEffect: 6, tags: ['Reset', 'Trust salvage', 'Pragmatic repair'] },
            { text: 'Turn it into a broad attack on the system', moneyEffect: -15000, momentumEffect: 4, trustEffect: -8, tags: ['System blame', 'Heat play', 'Volatile gamble'] }
          ]
        }];
  }

  if (tone === 'positive') {
    return phase === 'primary'
      ? [{
          title: 'Governor Bloc Quietly Breaks Your Way',
          description: 'A cluster of governors begins signaling that your campaign has become the serious governing option in the race.',
          phase: 'primary',
          choices: [
            { text: 'Roll out the validators together', moneyEffect: -60000, momentumEffect: 10, trustEffect: 6, tags: ['Validator blitz', 'Executive competence', 'Suburban signal'] },
            { text: 'Bank the quiet support and save the money', moneyEffect: 0, momentumEffect: 5, trustEffect: 4, tags: ['Quiet coalition', 'Insider confidence', 'Patience'] }
          ]
        }]
      : [{
          title: 'Ticket Reboot Tour Lands Cleanly',
          description: 'Your general-election bus tour produces a clean week of local TV, strong crowds, and no self-inflicted wounds.',
          phase: 'general',
          choices: [
            { text: 'Buy more local follow-up ads', moneyEffect: -90000, momentumEffect: 8, trustEffect: 4, tags: ['Local TV', 'Momentum extension', 'Field follow-up'] },
            { text: 'Keep the itinerary lean and disciplined', moneyEffect: 0, momentumEffect: 4, trustEffect: 5, tags: ['Discipline', 'Trust play', 'Low burn'] }
          ]
        }];
  }

  return phase === 'primary'
    ? [{
        title: 'County Chairs Revolt',
        description: 'A group of county party chairs complains that your campaign is treating local leaders like props instead of partners.',
        phase: 'primary',
        choices: [
          { text: 'Hold listening sessions and absorb the hit', moneyEffect: -40000, momentumEffect: -6, trustEffect: 5, tags: ['Local repair', 'Trust reset', 'Time cost'] },
          { text: 'Push past them with a digital turnout play', moneyEffect: -50000, momentumEffect: -2, trustEffect: -6, tags: ['Bypass machine', 'Digital gamble', 'Elite backlash'] }
        ]
      }]
    : [{
        title: 'Swing-State Narrative Turns Sour',
        description: 'A week of cable chatter frames your campaign as overconfident in the wrong part of the map.',
        phase: 'general',
        choices: [
          { text: 'Recenter on the nearest battlegrounds', moneyEffect: -75000, momentumEffect: -3, trustEffect: 3, tags: ['Map correction', 'Defensive buy', 'Message discipline'] },
          { text: 'Double down on the existing route', moneyEffect: -30000, momentumEffect: 2, trustEffect: -7, tags: ['Bravado', 'Risky hold', 'Media gamble'] }
        ]
      }];
}

export function getVPCandidateStateEffect(
  vp: VPCandidate | null,
  stateData: StateElectionData,
  phase: 'primary' | 'general',
  playerIssues: string[] = []
): VPStateEffect {
  if (!vp || phase !== 'general') {
    return { scoreMultiplier: 1, turnoutBonus: 0, narrative: 'No active running-mate bonus in this phase.' };
  }

  const issueOverlap = vp.issueFocus.filter((issue) => playerIssues.includes(issue) || stateData.topIssues.includes(issue)).length;
  const homeStateHit = vp.homeStates.includes(stateData.stateName);
  const regionHit = stateData.region === vp.homeRegion;
  const battlegroundHit = Math.abs(stateData.partisanLean ?? 0) <= 5;

  return {
    scoreMultiplier: 1
      + (homeStateHit ? vp.regionalLift / 70 : 0)
      + (regionHit ? vp.regionalLift / 140 : 0)
      + (issueOverlap * 0.018)
      + (battlegroundHit ? vp.battlegroundLift / 180 : 0),
    turnoutBonus: vp.turnoutBonus
      + (homeStateHit ? 0.9 : 0)
      + (regionHit ? 0.45 : 0)
      + (issueOverlap * 0.2),
    narrative: [
      homeStateHit ? 'home-state pull' : null,
      regionHit ? 'regional familiarity' : null,
      issueOverlap > 0 ? `${issueOverlap} aligned issue lane${issueOverlap === 1 ? '' : 's'}` : null,
      battlegroundHit ? 'battleground sharpen' : null
    ].filter(Boolean).join(' | ') || 'Limited direct map effect in this state'
  };
}
