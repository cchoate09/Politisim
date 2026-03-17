import type { StateElectionData } from './CampaignDataParser';
import type { PlayerDemographics } from './ElectionMath';
import type { PrimaryFieldShare, PrimaryStateProjection, RivalAI } from './SimulationEngine';

export type PrimaryRulePreset =
  | 'dem_proportional'
  | 'rep_early_proportional'
  | 'rep_hybrid'
  | 'rep_winner_take_most'
  | 'rep_winner_take_all';

export interface PrimaryRuleProfile {
  stateName: string;
  party: 'Democrat' | 'Republican';
  preset: PrimaryRulePreset;
  threshold: number;
  districtDelegates: number;
  statewideDelegates: number;
  winnerTakeAllTrigger?: number;
  summary: string;
}

interface AllocationCandidate {
  candidateId: string;
  name: string;
  share: number;
  ideology: PlayerDemographics;
  status: PrimaryFieldShare['status'];
}

export interface PrimaryAllocationResult {
  rule: PrimaryRuleProfile;
  allocatedShares: PrimaryFieldShare[];
  districtWins: Record<string, number>;
}

const REPUBLICAN_WINNER_TAKE_ALL_STATES = new Set([
  'Arizona',
  'Delaware',
  'Florida',
  'Nebraska',
  'New Jersey',
  'Ohio',
  'South Dakota'
]);

const REPUBLICAN_HYBRID_STATES = new Set([
  'California',
  'Georgia',
  'Illinois',
  'Maryland',
  'Michigan',
  'New York',
  'North Carolina',
  'South Carolina',
  'Texas',
  'Washington',
  'Wisconsin'
]);

function clampShare(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function seededFloat(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return ((hash >>> 0) % 1000) / 1000;
}

function allocateProportional(totalDelegates: number, shares: AllocationCandidate[], threshold: number): Map<string, number> {
  const viable = shares.filter((share) => share.share >= threshold && share.status !== 'withdrawn');
  const allocationPool = viable.length > 0 ? viable : shares.filter((share) => share.status !== 'withdrawn');
  const totalShare = allocationPool.reduce((sum, share) => sum + share.share, 0);

  const allocation = new Map<string, number>(shares.map((share) => [share.candidateId, 0]));
  if (totalDelegates <= 0 || totalShare <= 0) {
    return allocation;
  }

  const entries = allocationPool.map((share) => {
    const raw = (share.share / totalShare) * totalDelegates;
    return {
      candidateId: share.candidateId,
      delegates: Math.floor(raw),
      remainder: raw - Math.floor(raw)
    };
  });

  let assigned = entries.reduce((sum, entry) => sum + entry.delegates, 0);
  const byRemainder = [...entries].sort((a, b) => b.remainder - a.remainder);
  let index = 0;

  while (assigned < totalDelegates && byRemainder.length > 0) {
    byRemainder[index % byRemainder.length].delegates += 1;
    assigned += 1;
    index += 1;
  }

  for (const entry of byRemainder) {
    allocation.set(entry.candidateId, entry.delegates);
  }

  return allocation;
}

function distributeUnits(totalDelegates: number, preferredSize: number): number[] {
  if (totalDelegates <= 0) return [];

  const count = Math.max(1, Math.round(totalDelegates / preferredSize));
  const base = Math.floor(totalDelegates / count);
  const units = Array.from({ length: count }, () => base);
  let remainder = totalDelegates - (base * count);
  let index = 0;

  while (remainder > 0) {
    units[index % units.length] += 1;
    remainder -= 1;
    index += 1;
  }

  return units;
}

function buildDistrictProfile(stateData: StateElectionData, districtIndex: number): PlayerDemographics {
  const profile: PlayerDemographics = {
    liberal: stateData.liberal,
    libertarian: stateData.libertarian,
    owner: stateData.owner,
    worker: stateData.worker,
    religious: stateData.religious,
    immigrant: stateData.immigrant
  };

  const districtType = districtIndex % 4;
  if (districtType === 0) {
    profile.liberal = clampShare(profile.liberal + 8);
    profile.immigrant = clampShare(profile.immigrant + 6);
    profile.religious = clampShare(profile.religious - 6);
  } else if (districtType === 1) {
    profile.owner = clampShare(profile.owner + 6);
    profile.libertarian = clampShare(profile.libertarian + 4);
    profile.worker = clampShare(profile.worker - 3);
  } else if (districtType === 2) {
    profile.worker = clampShare(profile.worker + 8);
    profile.religious = clampShare(profile.religious + 4);
    profile.owner = clampShare(profile.owner - 4);
  } else {
    profile.liberal = clampShare(profile.liberal + 3);
    profile.owner = clampShare(profile.owner + 4);
    profile.immigrant = clampShare(profile.immigrant + 2);
  }

  return profile;
}

function getDistrictScore(candidate: AllocationCandidate, districtProfile: PlayerDemographics, stateName: string, districtIndex: number): number {
  const affinity =
    candidate.ideology.liberal * districtProfile.liberal +
    candidate.ideology.libertarian * districtProfile.libertarian +
    candidate.ideology.owner * districtProfile.owner +
    candidate.ideology.worker * districtProfile.worker +
    candidate.ideology.religious * districtProfile.religious +
    candidate.ideology.immigrant * districtProfile.immigrant;
  const noise = (seededFloat(`${stateName}-${districtIndex}-${candidate.candidateId}`) - 0.5) * 7;

  return Math.max(1, candidate.share * 11 + (affinity / 700) + noise);
}

function awardWinnerTakeAll(totalDelegates: number, winnerId: string, candidates: AllocationCandidate[]): Map<string, number> {
  const allocation = new Map<string, number>(candidates.map((candidate) => [candidate.candidateId, 0]));
  allocation.set(winnerId, totalDelegates);
  return allocation;
}

function calculateRuleProfile(stateData: StateElectionData, party: 'Democrat' | 'Republican'): PrimaryRuleProfile {
  const totalDelegates = party === 'Democrat' ? stateData.demDelegates : stateData.repDelegates;

  if (party === 'Democrat') {
    const statewideDelegates = Math.max(4, Math.round(totalDelegates * 0.24));
    const districtDelegates = Math.max(0, totalDelegates - statewideDelegates);
    return {
      stateName: stateData.stateName,
      party,
      preset: 'dem_proportional',
      threshold: 15,
      districtDelegates,
      statewideDelegates,
      summary: '15% threshold, district + statewide proportional allocation'
    };
  }

  if (REPUBLICAN_WINNER_TAKE_ALL_STATES.has(stateData.stateName)) {
    return {
      stateName: stateData.stateName,
      party,
      preset: 'rep_winner_take_all',
      threshold: 0,
      districtDelegates: 0,
      statewideDelegates: totalDelegates,
      winnerTakeAllTrigger: 0,
      summary: 'Winner-take-all statewide contest'
    };
  }

  if (REPUBLICAN_HYBRID_STATES.has(stateData.stateName)) {
    const statewideDelegates = Math.max(6, Math.round(totalDelegates * 0.28));
    const districtDelegates = Math.max(0, totalDelegates - statewideDelegates);
    return {
      stateName: stateData.stateName,
      party,
      preset: 'rep_hybrid',
      threshold: 20,
      districtDelegates,
      statewideDelegates,
      winnerTakeAllTrigger: 50,
      summary: 'District winner-take-all, statewide proportional, 50% sweep trigger'
    };
  }

  if (stateData.date >= '2024-03-15') {
    const statewideDelegates = Math.max(4, Math.round(totalDelegates * 0.3));
    const districtDelegates = Math.max(0, totalDelegates - statewideDelegates);
    return {
      stateName: stateData.stateName,
      party,
      preset: 'rep_winner_take_most',
      threshold: 20,
      districtDelegates,
      statewideDelegates,
      winnerTakeAllTrigger: 50,
      summary: 'Winner-take-most with district sweeps and statewide bonus'
    };
  }

  const statewideDelegates = Math.max(4, Math.round(totalDelegates * 0.4));
  const districtDelegates = Math.max(0, totalDelegates - statewideDelegates);
  return {
    stateName: stateData.stateName,
    party,
    preset: 'rep_early_proportional',
    threshold: 20,
    districtDelegates,
    statewideDelegates,
    summary: 'Early proportional allocation with a 20% viability threshold'
  };
}

export function getPrimaryRuleProfile(stateData: StateElectionData, party: 'Democrat' | 'Republican'): PrimaryRuleProfile {
  return calculateRuleProfile(stateData, party);
}

export function allocatePrimaryDelegatesForState(
  stateData: StateElectionData,
  party: 'Democrat' | 'Republican',
  playerName: string,
  playerIdeology: PlayerDemographics,
  projection: PrimaryStateProjection,
  rivals: RivalAI[]
): PrimaryAllocationResult {
  const rule = calculateRuleProfile(stateData, party);
  const candidates: AllocationCandidate[] = [
    {
      candidateId: 'player',
      name: playerName,
      share: projection.player,
      ideology: playerIdeology,
      status: 'player'
    },
    ...projection.fieldShares.map((share) => {
      const rival = rivals.find((entry) => entry.id === share.candidateId);
      return {
        candidateId: share.candidateId,
        name: share.name,
        share: share.share,
        ideology: rival?.ideology ?? playerIdeology,
        status: share.status
      };
    })
  ];

  const topCandidate = [...candidates].sort((a, b) => b.share - a.share)[0];
  const delegateMap = new Map<string, number>(candidates.map((candidate) => [candidate.candidateId, 0]));
  const districtWins: Record<string, number> = {};

  if (rule.preset === 'rep_winner_take_all') {
    return {
      rule,
      allocatedShares: candidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        name: candidate.name,
        share: candidate.share,
        delegates: candidate.candidateId === topCandidate.candidateId ? rule.statewideDelegates : 0,
        status: candidate.status
      })),
      districtWins
    };
  }

  if (rule.winnerTakeAllTrigger !== undefined && topCandidate.share >= rule.winnerTakeAllTrigger) {
    const sweepAllocation = awardWinnerTakeAll(rule.districtDelegates + rule.statewideDelegates, topCandidate.candidateId, candidates);
    return {
      rule: {
        ...rule,
        summary: `${rule.summary} - sweep triggered at ${rule.winnerTakeAllTrigger}%`
      },
      allocatedShares: candidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        name: candidate.name,
        share: candidate.share,
        delegates: sweepAllocation.get(candidate.candidateId) ?? 0,
        status: candidate.status
      })),
      districtWins
    };
  }

  const districtUnits = distributeUnits(
    rule.districtDelegates,
    party === 'Democrat' ? 6 : 3
  );

  districtUnits.forEach((unitDelegates, districtIndex) => {
    const districtProfile = buildDistrictProfile(stateData, districtIndex);
    const districtScores = candidates.map((candidate) => ({
      candidate,
      score: getDistrictScore(candidate, districtProfile, stateData.stateName, districtIndex)
    }));
    const totalScore = districtScores.reduce((sum, entry) => sum + entry.score, 0);
    const districtShares = districtScores.map((entry) => ({
      ...entry.candidate,
      share: (entry.score / totalScore) * 100
    }));

    if (rule.preset === 'dem_proportional' || rule.preset === 'rep_early_proportional') {
      const districtAllocation = allocateProportional(unitDelegates, districtShares, rule.threshold);
      for (const [candidateId, delegates] of districtAllocation.entries()) {
        delegateMap.set(candidateId, (delegateMap.get(candidateId) ?? 0) + delegates);
      }
    } else {
      const districtWinner = [...districtShares].sort((a, b) => b.share - a.share)[0];
      delegateMap.set(districtWinner.candidateId, (delegateMap.get(districtWinner.candidateId) ?? 0) + unitDelegates);
      districtWins[districtWinner.candidateId] = (districtWins[districtWinner.candidateId] ?? 0) + 1;
    }
  });

  const statewideAllocation = rule.preset === 'rep_winner_take_most'
    ? awardWinnerTakeAll(rule.statewideDelegates, topCandidate.candidateId, candidates)
    : allocateProportional(rule.statewideDelegates, candidates, rule.threshold);

  for (const [candidateId, delegates] of statewideAllocation.entries()) {
    delegateMap.set(candidateId, (delegateMap.get(candidateId) ?? 0) + delegates);
  }

  return {
    rule,
    allocatedShares: candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      name: candidate.name,
      share: candidate.share,
      delegates: delegateMap.get(candidate.candidateId) ?? 0,
      status: candidate.status
    })),
    districtWins
  };
}
