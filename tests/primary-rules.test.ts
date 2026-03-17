import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { allocatePrimaryDelegatesForState } from '../src/core/PrimaryRules.ts';
import { SimulationEngine, type PrimaryStateProjection } from '../src/core/SimulationEngine.ts';

const repoRoot = process.cwd();
const states = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'vanilla', 'states.json'), 'utf8')
);

test('democratic proportional allocation enforces the viability threshold', () => {
  const california = states.find((state: { stateName: string }) => state.stateName === 'California');
  assert.ok(california, 'Expected California in scenario data');

  const rivals = SimulationEngine.createPrimaryRivals('normal', 'Democrat', states);
  const projection: PrimaryStateProjection = {
    player: 41,
    rival: 27,
    undecided: 4,
    turnout: 67,
    leaderId: 'player',
    leaderName: 'Player',
    fieldShares: [
      { candidateId: rivals[0].id, name: rivals[0].name, share: 27, delegates: 0, status: 'active' },
      { candidateId: rivals[1].id, name: rivals[1].name, share: 18, delegates: 0, status: 'active' },
      { candidateId: rivals[2].id, name: rivals[2].name, share: 10, delegates: 0, status: 'active' },
      { candidateId: rivals[3].id, name: rivals[3].name, share: 0, delegates: 0, status: 'active' }
    ]
  };

  const result = allocatePrimaryDelegatesForState(
    california,
    'Democrat',
    'Player',
    { liberal: 65, libertarian: 40, owner: 48, worker: 70, religious: 35, immigrant: 68 },
    projection,
    rivals
  );

  const totalAllocated = result.allocatedShares.reduce((sum, candidate) => sum + candidate.delegates, 0);
  const underThreshold = result.allocatedShares.find((candidate) => candidate.share < result.rule.threshold && candidate.candidateId !== 'player');

  assert.equal(result.rule.preset, 'dem_proportional');
  assert.equal(totalAllocated, california.demDelegates);
  assert.ok(underThreshold, 'Expected at least one non-viable rival');
  assert.equal(underThreshold?.delegates, 0);
});

test('republican winner-take-all states award every delegate to the statewide leader', () => {
  const florida = states.find((state: { stateName: string }) => state.stateName === 'Florida');
  assert.ok(florida, 'Expected Florida in scenario data');

  const rivals = SimulationEngine.createPrimaryRivals('normal', 'Republican', states);
  const projection: PrimaryStateProjection = {
    player: 31,
    rival: 38,
    undecided: 3,
    turnout: 70,
    leaderId: rivals[0].id,
    leaderName: rivals[0].name,
    fieldShares: [
      { candidateId: rivals[0].id, name: rivals[0].name, share: 38, delegates: 0, status: 'active' },
      { candidateId: rivals[1].id, name: rivals[1].name, share: 18, delegates: 0, status: 'active' },
      { candidateId: rivals[2].id, name: rivals[2].name, share: 10, delegates: 0, status: 'active' },
      { candidateId: rivals[3].id, name: rivals[3].name, share: 0, delegates: 0, status: 'active' }
    ]
  };

  const result = allocatePrimaryDelegatesForState(
    florida,
    'Republican',
    'Player',
    { liberal: 18, libertarian: 70, owner: 78, worker: 44, religious: 74, immigrant: 18 },
    projection,
    rivals
  );
  const winner = result.allocatedShares.find((candidate) => candidate.candidateId === projection.leaderId);
  const others = result.allocatedShares.filter((candidate) => candidate.candidateId !== projection.leaderId);

  assert.equal(result.rule.preset, 'rep_winner_take_all');
  assert.equal(winner?.delegates, florida.repDelegates);
  assert.ok(others.every((candidate) => candidate.delegates === 0));
});
