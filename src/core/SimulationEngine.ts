import { ElectionMath, type PlayerDemographics } from './ElectionMath';
import type { CampaignSpendingData, StateElectionData } from './CampaignDataParser';

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
  delegates: number;
  spending: Record<string, CampaignSpendingData>;
  ideology: PlayerDemographics;
  homeRegion: string;
  supportBase: number;
  status: RivalStatus;
  endorsedCandidateId: string | null;
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
}

interface RivalProfile {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  homeRegion: string;
  supportBase: number;
  momentum: number;
  ideology: PlayerDemographics;
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
    ideology: { liberal: 60, libertarian: 35, owner: 55, worker: 62, religious: 42, immigrant: 68 }
  },
  {
    id: 'dem-reed',
    name: 'Sen. Marcus Reed',
    shortName: 'Reed',
    tagline: 'Union-backed populist',
    homeRegion: 'Midwest',
    supportBase: 12,
    momentum: 36,
    ideology: { liberal: 55, libertarian: 28, owner: 35, worker: 84, religious: 46, immigrant: 48 }
  },
  {
    id: 'dem-mercer',
    name: 'Sec. Daniel Mercer',
    shortName: 'Mercer',
    tagline: 'National security moderate',
    homeRegion: 'Northeast',
    supportBase: 9,
    momentum: 40,
    ideology: { liberal: 48, libertarian: 42, owner: 58, worker: 51, religious: 40, immigrant: 55 }
  },
  {
    id: 'dem-cho',
    name: 'Mayor Elena Cho',
    shortName: 'Cho',
    tagline: 'Movement reformer',
    homeRegion: 'West',
    supportBase: 11,
    momentum: 34,
    ideology: { liberal: 82, libertarian: 34, owner: 42, worker: 64, religious: 30, immigrant: 78 }
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
    ideology: { liberal: 18, libertarian: 66, owner: 84, worker: 42, religious: 70, immigrant: 18 }
  },
  {
    id: 'rep-kincaid',
    name: 'Sen. Lydia Kincaid',
    shortName: 'Kincaid',
    tagline: 'Law-and-order hawk',
    homeRegion: 'Midwest',
    supportBase: 12,
    momentum: 38,
    ideology: { liberal: 14, libertarian: 44, owner: 62, worker: 58, religious: 82, immigrant: 14 }
  },
  {
    id: 'rep-bishop',
    name: 'Sec. Owen Bishop',
    shortName: 'Bishop',
    tagline: 'Evangelical firebrand',
    homeRegion: 'South',
    supportBase: 11,
    momentum: 42,
    ideology: { liberal: 10, libertarian: 36, owner: 54, worker: 56, religious: 90, immigrant: 10 }
  },
  {
    id: 'rep-vale',
    name: 'Rep. Jonah Vale',
    shortName: 'Vale',
    tagline: 'Liberty movement insurgent',
    homeRegion: 'West',
    supportBase: 9,
    momentum: 35,
    ideology: { liberal: 20, libertarian: 88, owner: 72, worker: 40, religious: 50, immigrant: 16 }
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
      ideology: { liberal: 76, libertarian: 32, owner: 42, worker: 68, religious: 34, immigrant: 80 }
    },
    {
      id: 'gen-dem-brooks',
      name: 'Gov. Aaron Brooks',
      shortName: 'Brooks',
      tagline: 'Centrist blue-state governor',
      homeRegion: 'Northeast',
      supportBase: 12,
      momentum: 50,
      ideology: { liberal: 58, libertarian: 38, owner: 56, worker: 54, religious: 44, immigrant: 62 }
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
      ideology: { liberal: 18, libertarian: 68, owner: 82, worker: 46, religious: 78, immigrant: 18 }
    },
    {
      id: 'gen-rep-rutledge',
      name: 'Sen. Claire Rutledge',
      shortName: 'Rutledge',
      tagline: 'Populist Republican closer',
      homeRegion: 'Midwest',
      supportBase: 13,
      momentum: 52,
      ideology: { liberal: 16, libertarian: 50, owner: 64, worker: 60, religious: 74, immigrant: 14 }
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

function getRegionalBonus(stateData: StateElectionData, homeRegion: string): number {
  return stateData.region === homeRegion ? 18 : 0;
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

export class SimulationEngine {
  static createRivalAI(level: 'easy' | 'normal' | 'hard'): RivalAI {
    return {
      id: 'generic-rival',
      name: 'Rival Candidate',
      shortName: 'Rival',
      tagline: 'Opposition candidate',
      party: 'Republican',
      budget: getBudgetByDifficulty(level),
      difficulty: level,
      momentum: 26,
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
      endorsedCandidateId: null
    };
  }

  static createPrimaryRivals(
    level: 'easy' | 'normal' | 'hard',
    party: 'Democrat' | 'Republican'
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
      delegates: 0,
      spending: {},
      ideology: { ...profile.ideology },
      homeRegion: profile.homeRegion,
      supportBase: profile.supportBase,
      status: 'active',
      endorsedCandidateId: null
    }));
  }

  static createGeneralOpponentAI(
    level: 'easy' | 'normal' | 'hard',
    playerParty: 'Democrat' | 'Republican'
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
      delegates: 0,
      spending: {},
      ideology: { ...profile.ideology },
      homeRegion: profile.homeRegion,
      supportBase: profile.supportBase + 4,
      status: 'nominee',
      endorsedCandidateId: null
    };
  }

  static runRivalAITurn(
    rival: RivalAI,
    states: StateElectionData[],
    currentPolling: Record<string, PollingData>,
    difficulty: 'easy' | 'normal' | 'hard'
  ): RivalAI {
    if (rival.status === 'withdrawn') {
      return {
        ...rival,
        budget: Math.max(0, rival.budget + Math.floor(getWeeklyIncomeByDifficulty(rival.difficulty) * 0.15)),
        momentum: Math.max(0, rival.momentum - 1)
      };
    }

    const weeklyIncome = getWeeklyIncomeByDifficulty(rival.difficulty);
    const nextBudgetPool = rival.budget + weeklyIncome;
    let newBudget = nextBudgetPool;

    const targetStates = [...states].sort((a, b) => {
      const pA = currentPolling[a.stateName];
      const pB = currentPolling[b.stateName];
      if (!pA || !pB) return 0;
      const marginA = Math.abs(pA.player - pA.rival);
      const marginB = Math.abs(pB.player - pB.rival);
      if (difficulty === 'hard') {
        const playerLeadA = pA.player > pA.rival ? (pA.player - pA.rival) : 0;
        const playerLeadB = pB.player > pB.rival ? (pB.player - pB.rival) : 0;
        return playerLeadB - playerLeadA;
      }
      return marginA - marginB;
    });

    const newSpending: Record<string, CampaignSpendingData> = {};
    for (const [key, val] of Object.entries(rival.spending)) {
      newSpending[key] = { ...val };
    }

    const numTargets = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 5 : 3;
    const spendPerState = Math.floor((newBudget * 0.6) / Math.max(1, numTargets));
    const maxPerField = difficulty === 'hard' ? 500000 : 300000;

    for (let i = 0; i < Math.min(numTargets, targetStates.length); i++) {
      const state = targetStates[i];
      const stateName = state.stateName;
      const current = { ...(newSpending[stateName] || cloneEmptySpending()) };
      const stateScale = Math.sqrt(state.delegatesOrEV || 1) / 3.0;
      const scaledSpend = spendPerState * stateScale;

      current.tvAds = Math.min(maxPerField, current.tvAds + scaledSpend * 0.4);
      current.intAds = Math.min(maxPerField, current.intAds + scaledSpend * 0.25);
      current.mailers = Math.min(maxPerField, current.mailers + scaledSpend * 0.15);
      current.groundGame = Math.min(maxPerField, current.groundGame + scaledSpend * 0.15);
      current.socialMedia = Math.min(maxPerField, current.socialMedia + scaledSpend * 0.05);
      current.visits += 1;
      newSpending[stateName] = current;
      newBudget -= scaledSpend;
    }

    const momentumGain = difficulty === 'hard' ? 3 : difficulty === 'normal' ? 1 : 0;

    return {
      ...rival,
      budget: Math.max(0, newBudget),
      momentum: Math.min(100, rival.momentum + momentumGain),
      spending: newSpending
    };
  }

  static generatePrimaryFieldProjection(
    playerIdeology: PlayerDemographics,
    stateData: StateElectionData,
    playerSpending: CampaignSpendingData,
    playerMomentum: number,
    publicTrust: number,
    rivals: RivalAI[],
    globalStaffDiv = 2.0,
    globalVisitMult = 1.0,
    playerIssues: string[] = [],
    playerParty: 'Democrat' | 'Republican' = 'Democrat'
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
      stateData.region
    );

    const rivalScores = activeRivals.map((rival) => {
      const statusPenalty = rival.status === 'withdrawn' ? 0.18 : 1;
      const score = buildCandidateScore(
        rival.ideology,
        stateData,
        rival.spending[stateData.stateName] || cloneEmptySpending(),
        2.0,
        1.0,
        [],
        rival.party,
        0.85,
        rival.momentum,
        rival.supportBase,
        rival.homeRegion,
        statusPenalty
      );

      return { rival, score };
    });

    const totalGroundGame = (playerSpending.groundGame || 0) +
      rivalScores.reduce((sum, entry) => sum + (entry.rival.spending[stateData.stateName]?.groundGame || 0), 0);
    const totalMomentum = playerMomentum + rivalScores.reduce((sum, entry) => sum + entry.rival.momentum, 0);
    const turnout = ElectionMath.calculateTurnout(stateData, totalGroundGame, totalMomentum);

    const undecided = Math.max(4, Math.min(12, 12 - Math.floor(totalMomentum / 45)));
    const scoreSum = playerScore + rivalScores.reduce((sum, entry) => sum + entry.score, 0);

    if (scoreSum <= 0) {
      return {
        player: 25,
        rival: 25,
        undecided: 50,
        turnout,
        leaderId: activeRivals[0].id,
        leaderName: activeRivals[0].name,
        fieldShares: activeRivals.map((rival) => ({
          candidateId: rival.id,
          name: rival.name,
          share: 25,
          delegates: 0,
          status: rival.status
        }))
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

    return {
      player: clampPercentage(playerShare),
      rival: clampPercentage(leadRival?.share ?? 0),
      undecided: clampPercentage(undecided),
      turnout,
      leaderId: leadRival?.candidateId ?? activeRivals[0].id,
      leaderName: leadRival?.name ?? activeRivals[0].name,
      fieldShares
    };
  }

  static generateStatePolling(
    playerIdeology: PlayerDemographics,
    stateData: StateElectionData,
    playerSpending: CampaignSpendingData,
    playerMomentum: number,
    publicTrust: number,
    rivalAI: RivalAI,
    globalStaffDiv = 2.0,
    globalVisitMult = 1.0,
    playerIssues: string[] = [],
    playerParty: 'Democrat' | 'Republican' = 'Democrat'
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
      stateData.region
    );

    const rivalScore = buildCandidateScore(
      rivalAI.ideology,
      stateData,
      rivalAI.spending[stateData.stateName] || cloneEmptySpending(),
      2.0,
      1.0,
      [],
      rivalAI.party,
      0.92,
      rivalAI.momentum,
      rivalAI.supportBase,
      rivalAI.homeRegion
    );

    const stateTurnout = ElectionMath.calculateTurnout(
      stateData,
      (playerSpending.groundGame || 0) + (rivalAI.spending[stateData.stateName]?.groundGame || 0),
      playerMomentum + rivalAI.momentum
    );

    const totalScore = playerScore + rivalScore;
    if (totalScore <= 0) {
      return { player: 33, rival: 33, undecided: 34, turnout: stateTurnout };
    }

    let undecided = 15;
    let playerPct = (playerScore / totalScore) * (100 - undecided);
    let rivalPct = (rivalScore / totalScore) * (100 - undecided);

    playerPct += Math.floor(playerMomentum / 25) + (playerMomentum >= 75 ? 2 : playerMomentum >= 55 ? 1 : 0);
    rivalPct += Math.floor(rivalAI.momentum / 25);

    const noise = (Math.random() - 0.5) * 6;
    playerPct += noise;
    rivalPct -= noise * 0.7;

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
