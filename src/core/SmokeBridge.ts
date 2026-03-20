import type { ModManifestEntry, StateElectionData } from './CampaignDataParser';
import { CampaignDataParser } from './CampaignDataParser';
import { createConvention } from './ConventionData';
import { createElectionNight } from './ElectionNight';
import { getUnlockedAchievements, type AchievementId } from './Achievements';
import { normalizeImportedScenario, clearImportedScenarios } from './CommunityScenarioRegistry';
import { getScenarioVPCandidates } from './ScenarioContent';
import { SimulationEngine } from './SimulationEngine';
import { useGameStore, type PlayerHomeRegion } from '../store/gameStore';

type Party = 'Democrat' | 'Republican';
type Difficulty = 'easy' | 'normal' | 'hard';

interface SmokeBootstrapOptions {
  scenarioId: string;
  playerName?: string;
  party?: Party;
  difficulty?: Difficulty;
  issues?: string[];
  homeRegion?: PlayerHomeRegion;
}

interface SmokeImportedScenarioOptions {
  manifest: Partial<ModManifestEntry>;
  states: StateElectionData[];
}

interface SmokeSaveSlotSummary {
  slot: number;
  week: number;
  phase: string;
  date: string;
  scenarioName: string;
  difficulty: string;
  party: string;
  playerName: string;
}

interface SmokeBridge {
  clearImportedScenarios: () => Promise<number>;
  getScenarioCatalog: () => Promise<Array<{ id: string; status: string; errors: number; warnings: number; official?: boolean }>>;
  importScenario: (options: SmokeImportedScenarioOptions) => Promise<{ importedId: string; status: string; catalogCount: number }>;
  removeScenario: (scenarioId: string) => Promise<{ removedId: string; catalogCount: number }>;
  bootstrapCampaign: (options: SmokeBootstrapOptions) => Promise<ReturnType<typeof buildStateSummary>>;
  getStateSummary: () => ReturnType<typeof buildStateSummary>;
  resolveActiveEvent: (choiceIndex?: number) => ReturnType<typeof buildStateSummary>;
  runPreviewDebate: (phase: 'primary' | 'general') => { debateId: string | null; questionCount: number; achievementsBefore: AchievementId[] };
  completeActiveDebate: (choicePattern?: number[]) => { aftermathTitle: string | null; achievements: AchievementId[] };
  saveAndReloadSlot: (slot: number) => { before: ReturnType<typeof buildStateSummary>; after: ReturnType<typeof buildStateSummary>; slotSummary: SmokeSaveSlotSummary | null };
  openSyntheticConvention: () => { ballot: number; freeDelegates: number; targetDelegates: number };
  resolveSyntheticConvention: () => ReturnType<typeof buildStateSummary> & { achievements: AchievementId[] };
  openSyntheticElectionNight: () => { round: number; targetEV: number };
  resolveElectionNightToEnd: () => ReturnType<typeof buildStateSummary> & { achievements: AchievementId[] };
}

function getDefaultIdeologyForParty(party: Party) {
  if (party === 'Republican') {
    return { liberal: 20, libertarian: 58, owner: 72, worker: 44, religious: 68, immigrant: 18 };
  }

  return { liberal: 64, libertarian: 32, owner: 46, worker: 70, religious: 36, immigrant: 66 };
}

function buildStateSummary() {
  const state = useGameStore.getState();
  return {
    hasStarted: state.hasStarted,
    scenarioId: state.scenarioId,
    scenarioName: state.scenarioName,
    scenarioElectionYear: state.scenarioElectionYear,
    gamePhase: state.gamePhase,
    calendarPhase: state.calendarPhase,
    currentWeek: state.currentWeek,
    budget: state.budget,
    publicTrust: state.publicTrust,
    momentum: state.momentum,
    playerDelegates: state.playerDelegates,
    rivalDelegates: state.rivalDelegates,
    delegateTarget: state.delegateTarget,
    vpSelectionPending: state.vpSelectionPending,
    activeDebateId: state.activeDebate?.id ?? null,
    activeEventTitle: state.activeEvent?.title ?? null,
    activeConventionTitle: state.activeConvention?.title ?? null,
    activeElectionNightHeadline: state.activeElectionNight?.headline ?? null,
    electionNightRound: state.activeElectionNight?.round ?? null,
    endReason: state.endReason,
    generalOpponentName: state.generalOpponent?.name ?? null,
    saveSlots: state.getSaveSlots(),
    achievements: getUnlockedAchievements()
  };
}

async function bootstrapCampaign(options: SmokeBootstrapOptions) {
  const party = options.party ?? 'Democrat';
  const difficulty = options.difficulty ?? 'normal';
  const issues = options.issues ?? ['Economy', 'Healthcare', 'Education'];
  const homeRegion = options.homeRegion ?? 'National';
  const catalog = await CampaignDataParser.loadScenarioCatalog({ forceRefresh: true });
  const scenario = catalog.find((entry) => entry.id === options.scenarioId);

  if (!scenario) {
    throw new Error(`Could not find scenario ${options.scenarioId}.`);
  }
  if (!scenario.validation.isValid) {
    throw new Error(`Scenario ${options.scenarioId} is not launchable in smoke mode because validation reported blocking errors.`);
  }

  useGameStore.getState().resetGame();
  useGameStore.setState({
    hasStarted: true,
    playerName: options.playerName ?? 'Smoke Candidate',
    voterParty: party,
    difficulty,
    playerHomeRegion: homeRegion,
    playerIdeology: getDefaultIdeologyForParty(party),
    playerIssues: issues,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    scenarioElectionYear: scenario.electionYear
  });
  useGameStore.getState().initializeCampaign(scenario.states);

  return buildStateSummary();
}

function resolveActiveEvent(choiceIndex: number = 0) {
  const state = useGameStore.getState();
  if (state.activeEvent) {
    state.resolveEvent(choiceIndex);
  }
  return buildStateSummary();
}

function runPreviewDebate(phase: 'primary' | 'general') {
  const state = useGameStore.getState();
  state.previewDebate(phase);
  const nextState = useGameStore.getState();

  return {
    debateId: nextState.activeDebate?.id ?? null,
    questionCount: nextState.activeDebate?.questions.length ?? 0,
    achievementsBefore: getUnlockedAchievements()
  };
}

function completeActiveDebate(choicePattern: number[] = [0]) {
  let guard = 0;
  while (useGameStore.getState().activeDebate && guard < 24) {
    const debate = useGameStore.getState().activeDebate;
    const questionIndex = debate?.currentQuestionIndex ?? 0;
    const choiceIndex = choicePattern[Math.min(choicePattern.length - 1, questionIndex)] ?? 0;
    useGameStore.getState().answerDebateQuestion(choiceIndex);
    useGameStore.getState().advanceDebate();
    guard += 1;
  }

  if (useGameStore.getState().activeDebate) {
    throw new Error('Debate did not complete within the expected step count.');
  }

  return {
    aftermathTitle: useGameStore.getState().activeEvent?.title ?? null,
    achievements: getUnlockedAchievements()
  };
}

function saveAndReloadSlot(slot: number) {
  const before = buildStateSummary();
  useGameStore.getState().saveGame(slot);
  useGameStore.getState().loadGame(slot);
  const after = buildStateSummary();
  const slotSummary = useGameStore.getState().getSaveSlots().find((entry) => entry.slot === slot) ?? null;
  return { before, after, slotSummary };
}

function openSyntheticConvention() {
  const state = useGameStore.getState();
  const leadRival = state.rivalAIs[0] ?? SimulationEngine.createPrimaryRivals(state.difficulty, state.voterParty, state.states, state.scenarioId)[0];
  if (!leadRival) {
    throw new Error('No rival was available to stage a synthetic convention.');
  }

  const targetDelegates = Math.max(200, state.delegateTarget);
  const playerDelegates = Math.max(1, targetDelegates - 90);
  const rivalDelegates = Math.max(1, targetDelegates - 120);
  const freeDelegates = 180;
  const convention = createConvention(
    playerDelegates,
    { ...leadRival, delegates: rivalDelegates, momentum: 24, trust: 44 },
    freeDelegates,
    targetDelegates,
    8,
    2
  );

  useGameStore.setState({
    gamePhase: 'primary',
    calendarPhase: 'convention',
    activeEvent: null,
    activeDebate: null,
    activeElectionNight: null,
    activeConvention: convention,
    playerDelegates,
    rivalDelegates,
    budget: Math.max(state.budget, 450000),
    publicTrust: 82,
    momentum: 78
  });

  return {
    ballot: convention.ballot,
    freeDelegates: convention.freeDelegates,
    targetDelegates: convention.targetDelegates
  };
}

function resolveSyntheticConvention() {
  let guard = 0;
  while (useGameStore.getState().activeConvention && guard < 12) {
    useGameStore.getState().answerConventionChoice(0);
    useGameStore.getState().advanceConvention();
    guard += 1;
  }

  if (useGameStore.getState().activeConvention) {
    throw new Error('Synthetic convention did not resolve within the expected step count.');
  }

  if (useGameStore.getState().vpSelectionPending) {
    const state = useGameStore.getState();
    const vp = getScenarioVPCandidates(state.scenarioId, state.voterParty)[0];
    if (vp) {
      useGameStore.getState().selectVP(vp);
    }
  }

  return {
    ...buildStateSummary(),
    achievements: getUnlockedAchievements()
  };
}

function openSyntheticElectionNight() {
  const state = useGameStore.getState();
  const generalOpponent = state.generalOpponent ?? SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty, state.states, state.scenarioId);
  const totalEV = state.states.reduce((sum, contestState) => sum + contestState.delegatesOrEV, 0);
  const targetEV = Math.floor(totalEV / 2) + 1;
  const electionNight = createElectionNight(state.states, state.pollingData, state.playerName, state.currentWeek);

  useGameStore.setState({
    gamePhase: 'general',
    calendarPhase: 'election_day',
    activeEvent: null,
    activeDebate: null,
    activeConvention: null,
    activeElectionNight: electionNight,
    generalOpponent,
    delegateTarget: targetEV,
    vpSelectionPending: false
  });

  return {
    round: electionNight.round,
    targetEV: electionNight.targetEV
  };
}

function resolveElectionNightToEnd() {
  let guard = 0;
  while (useGameStore.getState().activeElectionNight && guard < 16) {
    const night = useGameStore.getState().activeElectionNight;
    if (!night) break;
    if (night.round >= night.totalRounds) {
      break;
    }
    useGameStore.getState().advanceElectionNight();
    guard += 1;
  }

  useGameStore.getState().finalizeElectionNight();

  return {
    ...buildStateSummary(),
    achievements: getUnlockedAchievements()
  };
}

async function getScenarioCatalog() {
  const catalog = await CampaignDataParser.loadScenarioCatalog({ forceRefresh: true });
  return catalog.map((scenario) => ({
    id: scenario.id,
    status: scenario.validation.status,
    errors: scenario.validation.errors,
    warnings: scenario.validation.warnings,
    official: scenario.official
  }));
}

async function importScenario(options: SmokeImportedScenarioOptions) {
  const existingIds = (await CampaignDataParser.listMods({ forceRefresh: true })).map((entry) => entry.id);
  const record = normalizeImportedScenario(
    options.manifest,
    options.states,
    existingIds,
    'smoke:script'
  );
  CampaignDataParser.saveImportedScenario(record);
  const catalog = await CampaignDataParser.loadScenarioCatalog({ forceRefresh: true });
  const imported = catalog.find((scenario) => scenario.id === record.manifest.id);
  if (!imported) {
    throw new Error(`Imported scenario ${record.manifest.id} did not appear in the refreshed catalog.`);
  }

  return {
    importedId: record.manifest.id,
    status: imported.validation.status,
    catalogCount: catalog.length
  };
}

async function removeScenario(scenarioId: string) {
  CampaignDataParser.removeImportedScenario(scenarioId);
  const catalog = await CampaignDataParser.loadScenarioCatalog({ forceRefresh: true });
  return {
    removedId: scenarioId,
    catalogCount: catalog.length
  };
}

async function clearImportedScenariosForSmoke() {
  clearImportedScenarios();
  const catalog = await CampaignDataParser.loadScenarioCatalog({ forceRefresh: true });
  return catalog.length;
}

declare global {
  interface Window {
    __POLITISIM_SMOKE__?: SmokeBridge;
  }
}

export function installSmokeBridge() {
  window.__POLITISIM_SMOKE__ = {
    clearImportedScenarios: clearImportedScenariosForSmoke,
    getScenarioCatalog,
    importScenario,
    removeScenario,
    bootstrapCampaign,
    getStateSummary: buildStateSummary,
    resolveActiveEvent,
    runPreviewDebate,
    completeActiveDebate,
    saveAndReloadSlot,
    openSyntheticConvention,
    resolveSyntheticConvention,
    openSyntheticElectionNight,
    resolveElectionNightToEnd
  };
}
