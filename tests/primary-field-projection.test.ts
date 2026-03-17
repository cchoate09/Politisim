import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SimulationEngine } from '../src/core/SimulationEngine.ts';

const repoRoot = process.cwd();
const states = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'vanilla', 'states.json'), 'utf8')
);

const EMPTY_SPENDING = {
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

test('primary projection exposes the full candidate field including the player', () => {
  const georgia = states.find((state: { stateName: string }) => state.stateName === 'Georgia');
  assert.ok(georgia, 'Expected Georgia in scenario data');

  const rivals = SimulationEngine.createPrimaryRivals('normal', 'Democrat', states);
  const projection = SimulationEngine.generatePrimaryFieldProjection(
    { liberal: 58, libertarian: 34, owner: 46, worker: 68, religious: 38, immigrant: 60 },
    georgia,
    EMPTY_SPENDING,
    20,
    55,
    rivals,
    { scoreMultiplier: 1, turnoutBonus: 0 },
    {},
    { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 },
    {},
    { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0, trustLift: 0, momentumLift: 0, rivalPenalty: 0, scandalShield: 0 },
    {},
    2,
    1,
    ['Healthcare', 'Education', 'Economy'],
    'Democrat',
    'Player',
    'South'
  );

  assert.ok(projection.allFieldShares.some((entry) => entry.candidateId === 'player'));
  assert.ok(projection.allFieldShares.length >= 5);
});

test('player home region creates a warmer starting map in aligned regions', () => {
  const georgia = states.find((state: { stateName: string }) => state.stateName === 'Georgia');
  assert.ok(georgia, 'Expected Georgia in scenario data');

  const rivals = SimulationEngine.createPrimaryRivals('normal', 'Democrat', states);
  const sharedIdeology = { liberal: 58, libertarian: 34, owner: 46, worker: 68, religious: 38, immigrant: 60 };

  const southernBase = SimulationEngine.generatePrimaryFieldProjection(
    sharedIdeology,
    georgia,
    EMPTY_SPENDING,
    20,
    55,
    rivals,
    { scoreMultiplier: 1, turnoutBonus: 0 },
    {},
    { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 },
    {},
    { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0, trustLift: 0, momentumLift: 0, rivalPenalty: 0, scandalShield: 0 },
    {},
    2,
    1,
    ['Healthcare', 'Education', 'Economy'],
    'Democrat',
    'Player',
    'South'
  );

  const westernBase = SimulationEngine.generatePrimaryFieldProjection(
    sharedIdeology,
    georgia,
    EMPTY_SPENDING,
    20,
    55,
    rivals,
    { scoreMultiplier: 1, turnoutBonus: 0 },
    {},
    { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0 },
    {},
    { scoreMultiplier: 1, turnoutBonus: 0, stabilityBonus: 0, trustLift: 0, momentumLift: 0, rivalPenalty: 0, scandalShield: 0 },
    {},
    2,
    1,
    ['Healthcare', 'Education', 'Economy'],
    'Democrat',
    'Player',
    'West'
  );

  assert.ok(southernBase.player > westernBase.player);
});
