import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

test('store save/load round-trips donor, media, and debate state', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });

  useGameStore.getState().resetGame();
  useGameStore.setState({
    playerName: 'Test Candidate',
    playerIdeology: { liberal: 58, libertarian: 42, owner: 44, worker: 72, religious: 36, immigrant: 61 },
    playerIssues: ['Economy', 'Healthcare', 'Education'],
    voterParty: 'Democrat',
    scenarioId: 'vanilla',
    scenarioName: 'Road to 2024',
    difficulty: 'normal'
  });
  useGameStore.getState().initializeCampaign(states);

  const donorId = useGameStore.getState().donorBlocs[0]?.id;
  const channelId = useGameStore.getState().mediaChannels[0]?.id;
  assert.ok(donorId && channelId, 'Expected initialized donor blocs and media channels');

  assert.equal(useGameStore.getState().fundraiseFromBloc(donorId), true);
  assert.equal(useGameStore.getState().investInMedia(channelId), true);
  useGameStore.getState().previewDebate('primary');

  const beforeSave = useGameStore.getState();
  const savedDebateId = beforeSave.activeDebate?.id;
  const savedMediaIntensity = beforeSave.mediaChannels.find((channel) => channel.id === channelId)?.intensity ?? 0;
  const savedDonorEnergy = beforeSave.donorBlocs.find((bloc) => bloc.id === donorId)?.energy ?? 0;

  useGameStore.getState().saveGame(1);
  useGameStore.getState().resetGame();
  useGameStore.getState().loadGame(1);

  const restored = useGameStore.getState();
  assert.equal(restored.activeDebate?.id, savedDebateId);
  assert.equal(restored.mediaChannels.find((channel) => channel.id === channelId)?.intensity, savedMediaIntensity);
  assert.equal(restored.donorBlocs.find((bloc) => bloc.id === donorId)?.energy, savedDonorEnergy);
  assert.equal(restored.playerIssues.length, 3);
  assert.match(restored.activeDebate?.participants[0]?.tagline ?? '', /Economy|Healthcare|Education/);

  storage.clear();
  useGameStore.getState().resetGame();
});
