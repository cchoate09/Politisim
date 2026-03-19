import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { ModManifestEntry, StateElectionData } from '../src/core/CampaignDataParser.ts';
import { validateScenarioDefinition } from '../src/core/ScenarioValidation.ts';

const repoRoot = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'manifest.json'), 'utf8')
) as ModManifestEntry[];

function readStates(scenarioId: string) {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'public', 'mods', scenarioId, 'states.json'), 'utf8')
  ) as StateElectionData[];
}

test('official scenarios validate cleanly in the scenario browser', () => {
  for (const entry of manifest) {
    const validation = validateScenarioDefinition(entry, readStates(entry.id), manifest);

    assert.equal(validation.errors, 0, `${entry.id} should have no blocking validation errors`);
    assert.equal(validation.warnings, 0, `${entry.id} should have no scenario-browser warnings`);
    assert.equal(validation.status, 'valid', `${entry.id} should appear launch-ready in the browser`);
  }
});

test('validator reports broken manifest and state schema data in human-readable form', () => {
  const baseEntry = manifest[0];
  const baseStates = readStates(baseEntry.id);
  const brokenEntry = {
    ...baseEntry,
    id: 'Broken Scenario!',
    yearLabel: '',
    electionYear: 1800,
    challenge: 'Nightmare',
    tagline: '',
    description: '',
    focus: [],
    featuredStates: ['Atlantis'],
    specialRules: new Array(7).fill('Rule overload')
  } as unknown as ModManifestEntry;

  const brokenStates = [
    {
      ...baseStates[0],
      stateName: baseStates[0]?.stateName ?? 'Alabama',
      delegatesOrEV: 0,
      demDelegates: -5,
      repDelegates: -3,
      liberal: 150,
      topIssues: [],
      date: 'not-a-date',
      baseTurnout: 0
    },
    {
      ...baseStates[1],
      stateName: baseStates[0]?.stateName ?? 'Alabama'
    }
  ] as StateElectionData[];

  const validation = validateScenarioDefinition(brokenEntry, brokenStates, [brokenEntry]);
  const codes = new Set(validation.findings.map((finding) => finding.code));

  assert.equal(validation.status, 'invalid');
  assert.ok(validation.errors > 0);
  assert.ok(codes.has('manifest.id'));
  assert.ok(codes.has('manifest.election_year'));
  assert.ok(codes.has('manifest.description'));
  assert.ok(codes.has('states.ev_range'));
  assert.ok(codes.has('states.dem_delegate_range'));
  assert.ok(codes.has('states.duplicate_name'));
  assert.ok(codes.has('states.date'));
});
