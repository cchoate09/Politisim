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

test('opposition research can discover and release a credible hit', () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage });

  useGameStore.getState().resetGame();
  useGameStore.setState({
    playerName: 'Research Test',
    playerIdeology: { liberal: 62, libertarian: 34, owner: 48, worker: 72, religious: 30, immigrant: 70 },
    playerIssues: ['Economy', 'Healthcare', 'Climate Change'],
    voterParty: 'Democrat',
    difficulty: 'normal'
  });
  useGameStore.getState().initializeCampaign(states);
  useGameStore.setState((state) => ({
    mediaChannels: state.mediaChannels.map((channel) => channel.id === 'rapid_response' ? { ...channel, intensity: 18 } : channel),
    campaignSpending: {
      ...state.campaignSpending,
      Iowa: { ...state.campaignSpending.Iowa, research: 280000 },
      Nevada: { ...state.campaignSpending.Nevada, research: 180000 }
    }
  }));

  const target = useGameStore.getState().rivalAIs[0];
  assert.ok(target, 'Expected at least one rival in the initialized field');

  const originalRandom = Math.random;
  const rolls = [0.01, 0.82, 0.77, 0.96];
  Math.random = () => rolls.shift() ?? 0.95;

  try {
    assert.equal(useGameStore.getState().commissionResearch(target.id), true);
    const afterResearch = useGameStore.getState();
    const file = afterResearch.oppositionResearch[target.id];
    const lead = file.leads.find((entry) => entry.status === 'active');
    assert.ok(lead, 'Expected a live lead after the commissioned research sweep');

    const budgetBeforeRelease = afterResearch.budget;
    assert.equal(useGameStore.getState().releaseResearchLead(target.id, lead!.id), true);

    const releasedState = useGameStore.getState();
    const updatedTarget = releasedState.rivalAIs.find((entry) => entry.id === target.id);
    const updatedLead = releasedState.oppositionResearch[target.id].leads.find((entry) => entry.id === lead!.id);

    assert.equal(updatedLead?.status, 'released');
    assert.ok((updatedTarget?.trust ?? 100) < target.trust, 'Expected the released hit to damage rival trust');
    assert.ok((updatedTarget?.momentum ?? 100) < target.momentum, 'Expected the released hit to damage rival momentum');
    assert.ok(releasedState.budget <= budgetBeforeRelease, 'Releasing a hit should not create money out of thin air');
    assert.ok(
      releasedState.mediaChannels.some((channel) => channel.id === 'earned_media' && channel.intensity > 0),
      'Expected the hit to create media follow-through'
    );
  } finally {
    Math.random = originalRandom;
    storage.clear();
    useGameStore.getState().resetGame();
  }
});
