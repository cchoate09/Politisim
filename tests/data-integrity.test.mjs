import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const modsRoot = path.join(repoRoot, 'public', 'mods');
const manifestPath = path.join(modsRoot, 'manifest.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

test('mod manifest exists and references real scenarios', () => {
  assert.ok(fs.existsSync(manifestPath), 'Expected public/mods/manifest.json to exist');
  const manifest = readJson(manifestPath);
  assert.ok(Array.isArray(manifest) && manifest.length >= 3, 'Expected at least three scenarios in the manifest');

  const ids = new Set();
  for (const entry of manifest) {
    assert.ok(entry.id, 'Scenario id is required');
    assert.ok(!ids.has(entry.id), `Duplicate scenario id: ${entry.id}`);
    ids.add(entry.id);
    assert.ok(fs.existsSync(path.join(modsRoot, entry.id, 'states.json')), `Missing states.json for ${entry.id}`);
  }
});

test('each official scenario has a full national map with DC and 538 electoral votes', () => {
  const manifest = readJson(manifestPath);

  for (const entry of manifest) {
    const states = readJson(path.join(modsRoot, entry.id, 'states.json'));
    const stateNames = new Set(states.map((state) => state.stateName));
    const totalEv = states.reduce((sum, state) => sum + state.delegatesOrEV, 0);

    assert.equal(states.length, 51, `${entry.id} should include 50 states plus DC`);
    assert.equal(stateNames.size, states.length, `${entry.id} contains duplicate jurisdictions`);
    assert.ok(stateNames.has('District of Columbia'), `${entry.id} is missing District of Columbia`);
    assert.equal(totalEv, 538, `${entry.id} should total 538 electoral votes`);
  }
});

test('scenario state data includes the fields the simulation expects', () => {
  const manifest = readJson(manifestPath);
  const requiredFields = [
    'stateName',
    'delegatesOrEV',
    'demDelegates',
    'repDelegates',
    'liberal',
    'libertarian',
    'owner',
    'worker',
    'religious',
    'immigrant',
    'region',
    'date',
    'baseTurnout',
    'topIssues',
    'partisanLean'
  ];

  for (const entry of manifest) {
    const states = readJson(path.join(modsRoot, entry.id, 'states.json'));
    for (const state of states) {
      for (const field of requiredFields) {
        assert.ok(field in state, `${entry.id}/${state.stateName} is missing ${field}`);
      }

      assert.ok(Array.isArray(state.topIssues) && state.topIssues.length >= 1, `${entry.id}/${state.stateName} should define topIssues`);
      assert.ok(!Number.isNaN(Date.parse(state.date)), `${entry.id}/${state.stateName} has an invalid primary date`);
      assert.ok(state.baseTurnout > 0 && state.baseTurnout <= 100, `${entry.id}/${state.stateName} has invalid turnout`);
    }
  }
});
