import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SimulationEngine, getRivalDebateTagline } from '../src/core/SimulationEngine.ts';

const repoRoot = process.cwd();
const states = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'vanilla', 'states.json'), 'utf8')
);

test('primary rival rosters have distinct styles, strengths, and vulnerabilities', () => {
  const rivals = SimulationEngine.createPrimaryRivals('normal', 'Democrat', states);
  const styleCount = new Set(rivals.map((rival) => rival.debateStyle)).size;

  assert.ok(styleCount >= 3, 'Expected at least three distinct debate styles');
  assert.ok(rivals.every((rival) => rival.issueBrands.length >= 2));
  assert.ok(rivals.every((rival) => rival.strengths.length >= 1));
  assert.ok(rivals.every((rival) => rival.vulnerabilities.length >= 1));
  assert.ok(rivals.every((rival) => getRivalDebateTagline(rival).length > 10));
});

test('rival campaign beats can generate deterministic scandal fallout', () => {
  const rivals = SimulationEngine.createPrimaryRivals('normal', 'Republican', states);
  const volatileRival = rivals.find((rival) => rival.scandalRisk >= 35) ?? rivals[0];
  const originalRandom = Math.random;
  Math.random = () => 0.001;

  try {
    const beat = SimulationEngine.resolveRivalCampaignBeat(volatileRival, 'primary', 48);
    assert.ok(beat, 'Expected a rival beat');
    assert.equal(beat?.type, 'negative');
    assert.ok((beat?.rival.trust ?? volatileRival.trust) < volatileRival.trust);
    assert.match(beat?.message ?? '', new RegExp(volatileRival.name));
  } finally {
    Math.random = originalRandom;
  }
});
