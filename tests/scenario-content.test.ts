import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CampaignDataParser } from '../src/core/CampaignDataParser.ts';
import { getScenarioEventDeck, getScenarioVPCandidates, getVPCandidateStateEffect } from '../src/core/ScenarioContent.ts';
import { SimulationEngine } from '../src/core/SimulationEngine.ts';

const repoRoot = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'manifest.json'), 'utf8')
);
const vanillaStates = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'vanilla', 'states.json'), 'utf8')
);

test('official scenario manifest includes new authored scenarios', () => {
  const ids = new Set(manifest.map((entry: { id: string }) => entry.id));
  assert.ok(ids.has('restoration_2012'));
  assert.ok(ids.has('fractured_republic_2032'));
});

test('scenario calendars can shift to the authored election year', () => {
  const restorationCalendar = CampaignDataParser.generateCalendar(2012);
  assert.equal(restorationCalendar[0]?.year, 2011);
  assert.equal(restorationCalendar.at(-1)?.year, 2012);
});

test('scenario-specific rival rosters differ from the vanilla field', () => {
  const vanillaDem = SimulationEngine.createPrimaryRivals('normal', 'Democrat', vanillaStates, 'vanilla');
  const restorationDem = SimulationEngine.createPrimaryRivals('normal', 'Democrat', vanillaStates, 'restoration_2012');
  const futureRep = SimulationEngine.createPrimaryRivals('normal', 'Republican', vanillaStates, 'fractured_republic_2032');

  assert.notEqual(vanillaDem[0]?.name, restorationDem[0]?.name);
  assert.match(restorationDem[0]?.tagline ?? '', /Recovery|incumbent/i);
  assert.match(futureRep[0]?.tagline ?? '', /future|nationalist|executive/i);
});

test('scenario event decks expose authored flavor instead of only generic events', () => {
  const sunbeltPositive = getScenarioEventDeck('sunbelt_surge', 'primary', 'positive');
  const heartlandNegative = getScenarioEventDeck('heartland_reckoning', 'general', 'negative');

  assert.equal(sunbeltPositive[0]?.title, 'Metro Coalition Surge');
  assert.equal(heartlandNegative[0]?.title, 'Factory-County Rumor Mill');
});

test('running mate benches and state effects vary by scenario and state fit', () => {
  const bench = getScenarioVPCandidates('heartland_reckoning', 'Democrat');
  const vp = bench.find((candidate) => candidate.homeRegion === 'Midwest') ?? bench[0];
  const michigan = vanillaStates.find((state: { stateName: string }) => state.stateName === 'Michigan');
  const arizona = vanillaStates.find((state: { stateName: string }) => state.stateName === 'Arizona');

  assert.ok(vp, 'Expected at least one VP candidate');
  assert.ok(michigan, 'Expected Michigan');
  assert.ok(arizona, 'Expected Arizona');

  const midwestEffect = getVPCandidateStateEffect(vp, michigan, 'general', ['Jobs', 'Healthcare']);
  const sunbeltEffect = getVPCandidateStateEffect(vp, arizona, 'general', ['Jobs', 'Healthcare']);

  assert.ok(midwestEffect.scoreMultiplier >= sunbeltEffect.scoreMultiplier);
  assert.ok(midwestEffect.turnoutBonus >= sunbeltEffect.turnoutBonus);
});
