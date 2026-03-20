import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUniqueScenarioId,
  clearImportedScenarios,
  listImportedScenarios,
  normalizeImportedScenario,
  saveImportedScenario,
  type StorageLike
} from '../src/core/CommunityScenarioRegistry.ts';
import { importScenarioFromFiles } from '../src/core/ScenarioImport.ts';
import {
  buildScenarioShareBundleDownload,
  buildScenarioTemplateBundleDownload,
  importScenarioRecordFromBundle,
  SCENARIO_SHARE_BUNDLE_EXTENSION
} from '../src/core/ScenarioExchange.ts';
import type { ScenarioCatalogEntry } from '../src/core/ScenarioValidation.ts';

function createMemoryStorage(): StorageLike {
  const data = new Map<string, string>();

  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

const sampleStates = [
  {
    stateName: 'Alabama',
    delegatesOrEV: 9,
    demDelegates: 52,
    repDelegates: 49,
    liberal: 26,
    libertarian: 31,
    owner: 48,
    worker: 61,
    religious: 72,
    immigrant: 11,
    region: 'South',
    date: '2024-03-05',
    baseTurnout: 62,
    topIssues: ['Economy'],
    partisanLean: -25
  }
];

const sampleCatalogEntry: ScenarioCatalogEntry = {
  id: 'future-path',
  name: 'Future Path',
  yearLabel: '2036',
  electionYear: 2036,
  tagline: 'A future import',
  description: 'Scenario imported through the browser picker.',
  challenge: 'Hardcore',
  focus: ['Future economy'],
  official: false,
  author: 'Test Creator',
  version: '2.1.0',
  minGameVersion: '0.4.0',
  states: sampleStates,
  validation: {
    isValid: true,
    status: 'valid',
    errors: 0,
    warnings: 0,
    infos: 0,
    findings: [],
    stats: {
      jurisdictionCount: 1,
      totalEV: 9,
      hasDistrictOfColumbia: false,
      earliestPrimaryDate: '2036-03-05',
      latestPrimaryDate: '2036-03-05',
      averageTurnout: 62
    }
  }
};

test('community scenario ids normalize and avoid collisions', () => {
  const id = buildUniqueScenarioId('Broken Scenario!', 'Broken Scenario!', ['vanilla', 'broken-scenario']);
  assert.equal(id, 'broken-scenario_2');
});

test('imported scenarios persist in the local registry', () => {
  const storage = createMemoryStorage();
  const scenario = normalizeImportedScenario({
    id: 'custom-entry',
    name: 'Custom Entry',
    electionYear: 2028,
    yearLabel: '2028',
    tagline: 'Community test import',
    description: 'Imported in a unit test.',
    challenge: 'Competitive',
    focus: ['Community']
  }, sampleStates, ['vanilla'], 'folder:custom-entry');

  saveImportedScenario(scenario, storage);
  const stored = listImportedScenarios(storage);

  assert.equal(stored.length, 1);
  assert.equal(stored[0]?.manifest.id, 'custom-entry');

  clearImportedScenarios(storage);
  assert.equal(listImportedScenarios(storage).length, 0);
});

test('scenario folder import reads manifest and states from matching folder paths', async () => {
  const imported = await importScenarioFromFiles([
    {
      name: 'manifest.json',
      webkitRelativePath: 'my_scenario/manifest.json',
      text: async () => JSON.stringify({
        id: 'future-path',
        name: 'Future Path',
        electionYear: 2036,
        yearLabel: '2036',
        tagline: 'A future import',
        description: 'Scenario imported through the browser picker.',
        challenge: 'Hardcore',
        focus: ['Future economy'],
        author: 'Test Creator',
        version: '2.1.0',
        minGameVersion: '0.4.0'
      })
    },
    {
      name: 'states.json',
      webkitRelativePath: 'my_scenario/states.json',
      text: async () => JSON.stringify(sampleStates)
    }
  ], ['vanilla']);

  assert.equal(imported.manifest.id, 'future-path');
  assert.equal(imported.manifest.author, 'Test Creator');
  assert.equal(imported.states.length, 1);
  assert.equal(imported.importSource, 'folder:my_scenario');
});

test('scenario share bundles serialize and round-trip back into imported scenarios', () => {
  const download = buildScenarioShareBundleDownload(sampleCatalogEntry);
  const imported = importScenarioRecordFromBundle(download.content, ['vanilla'], download.fileName);

  assert.ok(download.fileName.endsWith(SCENARIO_SHARE_BUNDLE_EXTENSION));
  assert.equal(imported.manifest.name, sampleCatalogEntry.name);
  assert.equal(imported.states.length, sampleStates.length);
  assert.equal(imported.importSource, `bundle:${download.fileName}`);
  assert.ok(imported.importNotes.some((note) => note.includes('shared scenario bundle')));
});

test('creator template bundles preserve a launchable scenario shell with placeholder metadata', async () => {
  const download = buildScenarioTemplateBundleDownload(sampleCatalogEntry);
  const imported = await importScenarioFromFiles([
    {
      name: download.fileName,
      text: async () => download.content
    }
  ], ['vanilla']);

  assert.equal(imported.manifest.author, 'Your Name Here');
  assert.equal(imported.manifest.version, '0.1.0');
  assert.equal(imported.manifest.official, false);
  assert.ok(imported.importNotes.some((note) => note.includes('creator template bundle')));
});
