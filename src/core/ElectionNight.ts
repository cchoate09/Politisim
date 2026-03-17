import type { StateElectionData } from './CampaignDataParser';
import type { PollingData } from './SimulationEngine';

export type ElectionNightWinnerId = 'player' | 'rival';

export interface ElectionNightStateCall {
  stateName: string;
  region: string;
  electoralVotes: number;
  playerPct: number;
  rivalPct: number;
  winnerId: ElectionNightWinnerId;
  margin: number;
  callRound: number;
  called: boolean;
  callReason: string;
  battleground: boolean;
}

export interface ActiveElectionNight {
  round: number;
  totalRounds: number;
  targetEV: number;
  playerEV: number;
  rivalEV: number;
  results: ElectionNightStateCall[];
  projectedWinnerId: ElectionNightWinnerId | null;
  clinchedRound: number | null;
  headline: string;
  summary: string;
  momentLog: string[];
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function seededFloat(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function normalizeShares(playerPct: number, rivalPct: number): { playerPct: number; rivalPct: number } {
  const player = Math.max(0, playerPct);
  const rival = Math.max(0, rivalPct);
  const total = player + rival;
  if (total <= 0) {
    return { playerPct: 50, rivalPct: 50 };
  }
  return {
    playerPct: clampPercentage((player / total) * 100),
    rivalPct: clampPercentage((rival / total) * 100)
  };
}

function getRegionBaseRound(region: string): number {
  if (region === 'Northeast') return 1;
  if (region === 'South') return 2;
  if (region === 'Midwest') return 3;
  return 4;
}

function getCallRound(stateData: StateElectionData, margin: number): number {
  const baseRound = getRegionBaseRound(stateData.region);
  let round = baseRound;

  if (margin >= 12) round -= 1;
  else if (margin < 8) round += 1;
  if (margin < 5) round += 1;
  if (margin < 3) round += 1;
  if (margin < 1.4) round += 1;
  if (stateData.delegatesOrEV >= 20 && margin < 6) round += 1;

  return Math.max(1, Math.min(7, round));
}

function getCallReason(margin: number, stateData: StateElectionData): string {
  if (margin >= 12) {
    return `${stateData.stateName} was called almost immediately once the first precincts reported.`;
  }
  if (margin >= 7) {
    return `${stateData.stateName} firmed up once the regional vote pattern matched expectations.`;
  }
  if (margin >= 3) {
    return `${stateData.stateName} tightened early before the desk felt comfortable making the call.`;
  }
  return `${stateData.stateName} stayed live deep into the night and only broke once the final metro and absentee tranches landed.`;
}

function createStateResult(
  stateData: StateElectionData,
  polling: PollingData,
  seedPrefix: string
): ElectionNightStateCall {
  const undecidedPool = Math.max(0, polling.undecided);
  const volatility = Math.abs(polling.player - polling.rival) < 3 ? 3.9 : Math.abs(polling.player - polling.rival) < 6 ? 2.6 : 1.4;
  const miss = (seededFloat(`${seedPrefix}-${stateData.stateName}-miss`) - 0.5) * volatility;
  const turnoutTilt = (seededFloat(`${seedPrefix}-${stateData.stateName}-turnout`) - 0.5) * 1.6;

  const rawPlayer = polling.player + (undecidedPool / 2) + miss + turnoutTilt;
  const rawRival = polling.rival + (undecidedPool / 2) - (miss * 0.92) - (turnoutTilt * 0.55);
  const normalized = normalizeShares(rawPlayer, rawRival);
  const winnerId: ElectionNightWinnerId = normalized.playerPct >= normalized.rivalPct ? 'player' : 'rival';
  const margin = Math.abs(normalized.playerPct - normalized.rivalPct);

  return {
    stateName: stateData.stateName,
    region: stateData.region,
    electoralVotes: stateData.delegatesOrEV,
    playerPct: Math.round(normalized.playerPct * 10) / 10,
    rivalPct: Math.round(normalized.rivalPct * 10) / 10,
    winnerId,
    margin: Math.round(margin * 10) / 10,
    callRound: getCallRound(stateData, margin),
    called: false,
    callReason: getCallReason(margin, stateData),
    battleground: margin < 4.5
  };
}

function getHeadline(playerEV: number, rivalEV: number, projectedWinnerId: ElectionNightWinnerId | null, targetEV: number): string {
  if (projectedWinnerId === 'player') {
    return `Networks project the presidency for your campaign with ${playerEV} electoral votes.`;
  }
  if (projectedWinnerId === 'rival') {
    return `The opposition has been projected to win the presidency with ${rivalEV} electoral votes.`;
  }
  if (playerEV === rivalEV) {
    return 'The map is deadlocked and every remaining battleground matters.';
  }
  return playerEV > rivalEV
    ? `You lead ${playerEV} to ${rivalEV}, still short of the ${targetEV}-vote threshold.`
    : `The opposition leads ${rivalEV} to ${playerEV} while the path remains open.`;
}

function getSummary(results: ElectionNightStateCall[], playerEV: number, rivalEV: number): string {
  const remainingStates = results.filter((result) => !result.called).length;
  const tossupsRemaining = results.filter((result) => !result.called && result.battleground).length;
  if (remainingStates === 0) {
    return `All states have been called. Final electoral margin: ${Math.abs(playerEV - rivalEV)} votes.`;
  }
  return `${remainingStates} states remain uncalled, including ${tossupsRemaining} live battleground${tossupsRemaining === 1 ? '' : 's'}.`;
}

function summarizeWave(wave: ElectionNightStateCall[]): string {
  const playerStates = wave.filter((result) => result.winnerId === 'player');
  const rivalStates = wave.filter((result) => result.winnerId === 'rival');

  const playerSummary = playerStates.length > 0
    ? `${playerStates.map((result) => result.stateName).join(', ')} for you`
    : null;
  const rivalSummary = rivalStates.length > 0
    ? `${rivalStates.map((result) => result.stateName).join(', ')} for the opposition`
    : null;

  return [playerSummary, rivalSummary].filter(Boolean).join(' | ');
}

export function createElectionNight(
  states: StateElectionData[],
  pollingData: Record<string, PollingData>,
  playerName: string,
  currentWeek: number
): ActiveElectionNight {
  const targetEV = Math.floor(states.reduce((sum, state) => sum + state.delegatesOrEV, 0) / 2) + 1;
  const seedPrefix = `${playerName}-${currentWeek}`;
  const results = states
    .map((state) => createStateResult(state, pollingData[state.stateName] ?? { player: 50, rival: 50, undecided: 0, turnout: 60 }, seedPrefix))
    .sort((left, right) => {
      if (left.callRound !== right.callRound) return left.callRound - right.callRound;
      if (left.margin !== right.margin) return right.margin - left.margin;
      return right.electoralVotes - left.electoralVotes;
    });

  return {
    round: 0,
    totalRounds: 7,
    targetEV,
    playerEV: 0,
    rivalEV: 0,
    results,
    projectedWinnerId: null,
    clinchedRound: null,
    headline: 'Polls are closing and the decision desk is waiting on the first wave of calls.',
    summary: `${results.length} states and jurisdictions are still outstanding.`,
    momentLog: []
  };
}

export function advanceElectionNightRound(
  electionNight: ActiveElectionNight,
  playerName: string,
  opponentName: string
): { electionNight: ActiveElectionNight; wave: ElectionNightStateCall[]; newMoments: string[]; complete: boolean } {
  const nextRound = Math.min(electionNight.totalRounds, electionNight.round + 1);
  let wave = electionNight.results.filter((result) => !result.called && result.callRound <= nextRound);

  if (nextRound === electionNight.totalRounds && wave.length === 0) {
    wave = electionNight.results.filter((result) => !result.called);
  }

  const updatedResults = electionNight.results.map((result) => {
    if (wave.some((entry) => entry.stateName === result.stateName)) {
      return { ...result, called: true };
    }
    return result;
  });

  const playerEV = updatedResults.filter((result) => result.called && result.winnerId === 'player').reduce((sum, result) => sum + result.electoralVotes, 0);
  const rivalEV = updatedResults.filter((result) => result.called && result.winnerId === 'rival').reduce((sum, result) => sum + result.electoralVotes, 0);
  let projectedWinnerId = electionNight.projectedWinnerId;
  let clinchedRound = electionNight.clinchedRound;
  const newMoments: string[] = [];

  if (!projectedWinnerId && playerEV >= electionNight.targetEV) {
    projectedWinnerId = 'player';
    clinchedRound = nextRound;
    newMoments.push(`The desk projects ${playerName} as the winner after crossing ${electionNight.targetEV} electoral votes.`);
  } else if (!projectedWinnerId && rivalEV >= electionNight.targetEV) {
    projectedWinnerId = 'rival';
    clinchedRound = nextRound;
    newMoments.push(`The desk projects ${opponentName} as the winner after crossing ${electionNight.targetEV} electoral votes.`);
  }

  if (wave.length > 0) {
    newMoments.unshift(`Round ${nextRound}: ${summarizeWave(wave)}.`);
  }

  const complete = updatedResults.every((result) => result.called);

  return {
    electionNight: {
      ...electionNight,
      round: nextRound,
      playerEV,
      rivalEV,
      results: updatedResults,
      projectedWinnerId,
      clinchedRound,
      headline: getHeadline(playerEV, rivalEV, projectedWinnerId, electionNight.targetEV),
      summary: getSummary(updatedResults, playerEV, rivalEV),
      momentLog: [...newMoments, ...electionNight.momentLog].slice(0, 18)
    },
    wave,
    newMoments,
    complete
  };
}

export function finalizeElectionNight(electionNight: ActiveElectionNight): ActiveElectionNight {
  const allCalled = electionNight.results.map((result) => ({ ...result, called: true }));
  const playerEV = allCalled.filter((result) => result.winnerId === 'player').reduce((sum, result) => sum + result.electoralVotes, 0);
  const rivalEV = allCalled.filter((result) => result.winnerId === 'rival').reduce((sum, result) => sum + result.electoralVotes, 0);
  const projectedWinnerId = playerEV >= electionNight.targetEV ? 'player' : 'rival';

  return {
    ...electionNight,
    round: electionNight.totalRounds,
    playerEV,
    rivalEV,
    projectedWinnerId,
    clinchedRound: electionNight.clinchedRound ?? electionNight.totalRounds,
    results: allCalled,
    headline: getHeadline(playerEV, rivalEV, projectedWinnerId, electionNight.targetEV),
    summary: getSummary(allCalled, playerEV, rivalEV)
  };
}
