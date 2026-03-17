import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  askDonorBloc,
  createInitialDonorBlocs,
  createInitialMediaChannels,
  getMediaStateEffect,
  investInMediaChannel
} from '../src/core/CampaignStrategy.ts';

const repoRoot = process.cwd();
const states = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'mods', 'vanilla', 'states.json'), 'utf8')
);

test('donor asks trade energy for cash while preserving bloc identity', () => {
  const ideology = { liberal: 62, libertarian: 38, owner: 40, worker: 74, religious: 34, immigrant: 58 };
  const blocs = createInitialDonorBlocs(ideology, ['Economy', 'Healthcare', 'Education'], 'Democrat');
  const smallDonors = blocs.find((bloc) => bloc.id === 'small_donors');
  assert.ok(smallDonors, 'Expected small donor bloc');

  const result = askDonorBloc(blocs, 'small_donors', ideology, ['Economy', 'Healthcare', 'Education'], 'Democrat');
  assert.ok(result, 'Expected a donor ask result');
  const updated = result?.blocs.find((bloc) => bloc.id === 'small_donors');

  assert.ok((result?.amount ?? 0) > 0);
  assert.ok((updated?.energy ?? 100) < (smallDonors?.energy ?? 0));
  assert.match(result?.summary ?? '', /Small-Dollar Army/);
});

test('local television matters more in battleground states than safe states', () => {
  const florida = states.find((state: { stateName: string }) => state.stateName === 'Florida');
  const california = states.find((state: { stateName: string }) => state.stateName === 'California');
  assert.ok(florida && california, 'Expected Florida and California in scenario data');

  let channels = createInitialMediaChannels('Democrat', ['Economy', 'Healthcare', 'Education']);
  channels = investInMediaChannel(channels, 'local_tv');
  channels = investInMediaChannel(channels, 'local_tv');

  const floridaEffect = getMediaStateEffect(florida, channels);
  const californiaEffect = getMediaStateEffect(california, channels);

  assert.ok(floridaEffect.scoreMultiplier > californiaEffect.scoreMultiplier);
  assert.ok(floridaEffect.turnoutBonus >= californiaEffect.turnoutBonus);
});
