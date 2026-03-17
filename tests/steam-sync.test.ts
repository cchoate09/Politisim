import test from 'node:test';
import assert from 'node:assert/strict';
import { getCloudSaveFileName, pickPreferredSaveSource } from '../src/core/SteamSync.ts';

test('steam cloud save files use stable slot naming', () => {
  assert.equal(getCloudSaveFileName(0), 'politisim_slot_0.json');
  assert.equal(getCloudSaveFileName(2), 'politisim_slot_2.json');
});

test('newer cloud saves win reconciliation when timestamps are fresher', () => {
  const local = JSON.stringify({ savedAt: '2026-03-15T10:00:00.000Z' });
  const cloud = JSON.stringify({ savedAt: '2026-03-16T10:00:00.000Z' });

  assert.equal(pickPreferredSaveSource(local, cloud), 'cloud');
  assert.equal(pickPreferredSaveSource(cloud, local), 'local');
  assert.equal(pickPreferredSaveSource(local, null), 'local');
  assert.equal(pickPreferredSaveSource(null, cloud), 'cloud');
});
