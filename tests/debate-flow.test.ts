import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SimulationEngine } from '../src/core/SimulationEngine.ts';
import { useGameStore } from '../src/store/gameStore.ts';

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

const repoRoot = process.cwd();
const states = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'vanilla', 'states.json'), 'utf8')
);

test('scheduled debates open on the correct week and resolve into a spin-room event', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });

  useGameStore.getState().resetGame();
  useGameStore.setState({
    playerName: 'Debate Test',
    playerIdeology: { liberal: 60, libertarian: 40, owner: 45, worker: 70, religious: 32, immigrant: 66 },
    playerIssues: ['Economy', 'Healthcare', 'Education'],
    voterParty: 'Democrat',
    difficulty: 'normal'
  });
  useGameStore.getState().initializeCampaign(states);
  useGameStore.setState({ currentWeek: 19, calendarPhase: 'campaigning' });

  const originalRandom = Math.random;
  Math.random = () => 0.72;

  try {
    useGameStore.getState().advanceWeek();
    const scheduledDebate = useGameStore.getState().activeDebate;
    assert.equal(useGameStore.getState().currentWeek, 20);
    assert.ok(scheduledDebate, 'Expected the scheduled primary debate to open on week 20');
    assert.equal(scheduledDebate?.questions.length, 10);

    let safety = 0;
    while (useGameStore.getState().activeDebate) {
      useGameStore.getState().answerDebateQuestion(0);
      useGameStore.getState().advanceDebate();
      safety += 1;
      assert.ok(safety <= 12, 'Debate resolution loop exceeded expected question count');
    }

    const aftermath = useGameStore.getState().activeEvent;
    assert.ok(aftermath, 'Expected a post-debate event after the final question');
    assert.match(aftermath?.title ?? '', /Spin Room/);
    assert.equal(aftermath?.choices.length, 3);
    assert.ok((aftermath?.choices[0].tags?.length ?? 0) >= 1, 'Expected the aftermath choices to expose war-room strategy tags');
  } finally {
    Math.random = originalRandom;
    storage.clear();
    useGameStore.getState().resetGame();
  }
});

test('election day transitions into election night instead of ending instantly', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });

  useGameStore.getState().resetGame();
  useGameStore.setState({
    playerName: 'General Test',
    playerIdeology: { liberal: 55, libertarian: 40, owner: 52, worker: 64, religious: 38, immigrant: 58 },
    playerIssues: ['Economy', 'National Security', 'Healthcare'],
    voterParty: 'Democrat',
    difficulty: 'normal'
  });
  useGameStore.getState().initializeCampaign(states);
  useGameStore.setState({
    currentWeek: 69,
    gamePhase: 'general',
    calendarPhase: 'general',
    generalOpponent: SimulationEngine.createGeneralOpponentAI('normal', 'Democrat', states)
  });
  useGameStore.getState().runSimulation();

  const originalRandom = Math.random;
  Math.random = () => 0.61;

  try {
    useGameStore.getState().advanceWeek();
    const electionNight = useGameStore.getState().activeElectionNight;
    assert.equal(useGameStore.getState().currentWeek, 70);
    assert.ok(electionNight, 'Expected election night to begin on week 70');
    assert.equal(useGameStore.getState().activeDebate, null);
    assert.equal(useGameStore.getState().gamePhase, 'general');
  } finally {
    Math.random = originalRandom;
    storage.clear();
    useGameStore.getState().resetGame();
  }
});
