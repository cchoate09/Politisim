import type { DonorBlocId, MediaChannelId } from './CampaignStrategy';
import type { ActiveDebate, DebateAnswerRecord, DebateStanding } from './DebateData';
import type { PlayerDemographics } from './ElectionMath';

export interface DebateAftermathChoiceSpec {
  text: string;
  tags: string[];
  moneyEffect: number;
  momentumEffect: number;
  trustEffect: number;
  volunteerEffect: number;
  donorEffects: Array<{ blocId: DonorBlocId; relationshipDelta: number; energyDelta: number }>;
  mediaEffects: Array<{ channelId: MediaChannelId; intensityDelta: number }>;
  rivalMomentumEffect: number;
  rivalTrustEffect: number;
  rivalBudgetEffect: number;
  logLine: string;
}

export interface DebateAftermathSpec {
  title: string;
  description: string;
  performance: 'breakthrough' | 'steady' | 'shaky';
  headline: string;
  choices: DebateAftermathChoiceSpec[];
}

const GROUP_LABELS: Record<keyof PlayerDemographics, string> = {
  liberal: 'progressives',
  libertarian: 'liberty-minded voters',
  owner: 'business-minded voters',
  worker: 'working-class voters',
  religious: 'faith-oriented voters',
  immigrant: 'immigrant communities'
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function rankDebateGroups(standing: DebateStanding) {
  const entries = Object.entries(standing) as Array<[keyof PlayerDemographics, number]>;
  const positive = [...entries]
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1]);
  const negative = [...entries]
    .filter(([, value]) => value < 0)
    .sort((left, right) => left[1] - right[1]);

  return {
    positive,
    negative,
    leadPositive: positive[0]?.[0] ?? null,
    leadNegative: negative[0]?.[0] ?? null
  };
}

function pickPreferredDonor(group: keyof PlayerDemographics | null, phase: ActiveDebate['phase']): DonorBlocId {
  if (group === 'worker') return 'labor';
  if (group === 'owner' || group === 'libertarian') return 'business';
  if (group === 'religious') return 'faith';
  if (group === 'immigrant') return phase === 'primary' ? 'activists' : 'small_donors';
  return phase === 'primary' ? 'small_donors' : 'business';
}

function pickSupportMedia(performance: DebateAftermathSpec['performance']): MediaChannelId[] {
  if (performance === 'breakthrough') return ['earned_media', 'cable'];
  if (performance === 'steady') return ['rapid_response', 'local_tv'];
  return ['rapid_response', 'local_tv'];
}

function sumChoiceMetric(answerHistory: DebateAnswerRecord[], key: 'momentumEffect' | 'trustEffect') {
  return answerHistory.reduce((sum, answer) => sum + answer[key], 0);
}

function getLeadTopic(answerHistory: DebateAnswerRecord[]) {
  const topicCounts = new Map<string, number>();
  answerHistory.forEach((answer) => {
    topicCounts.set(answer.topic, (topicCounts.get(answer.topic) ?? 0) + 1);
  });

  return [...topicCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'policy';
}

function describeSubgroupShift(standing: DebateStanding) {
  const ranked = rankDebateGroups(standing);
  const positiveLine = ranked.leadPositive ? GROUP_LABELS[ranked.leadPositive] : 'late undecideds';
  const negativeLine = ranked.leadNegative ? GROUP_LABELS[ranked.leadNegative] : null;

  if (!negativeLine) {
    return `${positiveLine} reacted best to the answers on stage.`;
  }

  return `${positiveLine} leaned your way, while ${negativeLine} stayed the most skeptical.`;
}

function buildBreakthroughChoices(
  leadDonor: DonorBlocId,
  supportMedia: MediaChannelId[],
  featuredRivalName: string
): DebateAftermathChoiceSpec[] {
  return [
    {
      text: 'Flood the spin room and claim the best night on stage.',
      tags: ['Narrative grab', 'Cable pressure', 'Risky overreach'],
      moneyEffect: -85000,
      momentumEffect: 4,
      trustEffect: -1,
      volunteerEffect: 20,
      donorEffects: [{ blocId: leadDonor, relationshipDelta: 4, energyDelta: 10 }],
      mediaEffects: supportMedia.map((channelId, index) => ({ channelId, intensityDelta: index === 0 ? 6 : 4 })),
      rivalMomentumEffect: -4,
      rivalTrustEffect: -2,
      rivalBudgetEffect: -30000,
      logLine: `Your campaign flooded cable and surrogate hits after the debate, forcing ${featuredRivalName} onto the back foot.`
    },
    {
      text: 'Turn the performance into a small-dollar and volunteer wave.',
      tags: ['Grassroots push', 'Volunteer surge', 'Base activation'],
      moneyEffect: 65000,
      momentumEffect: 2,
      trustEffect: 1,
      volunteerEffect: 85,
      donorEffects: [{ blocId: 'small_donors', relationshipDelta: 5, energyDelta: 16 }],
      mediaEffects: [
        { channelId: 'digital', intensityDelta: 5 },
        { channelId: 'earned_media', intensityDelta: 2 }
      ],
      rivalMomentumEffect: -2,
      rivalTrustEffect: 0,
      rivalBudgetEffect: -12000,
      logLine: 'Grassroots donors and volunteers responded quickly, turning the debate into a real organizing wave.'
    },
    {
      text: 'Book validators and make the night about steadiness.',
      tags: ['Trust play', 'Validator lane', 'Less flash'],
      moneyEffect: -40000,
      momentumEffect: 1,
      trustEffect: 4,
      volunteerEffect: 35,
      donorEffects: [{ blocId: leadDonor, relationshipDelta: 3, energyDelta: 6 }],
      mediaEffects: [
        { channelId: 'rapid_response', intensityDelta: 4 },
        { channelId: 'local_tv', intensityDelta: 3 }
      ],
      rivalMomentumEffect: -1,
      rivalTrustEffect: -3,
      rivalBudgetEffect: -18000,
      logLine: 'The post-debate validator parade helped lock in trust with softer voters and party insiders.'
    }
  ];
}

function buildSteadyChoices(
  leadDonor: DonorBlocId,
  supportMedia: MediaChannelId[],
  featuredRivalName: string
): DebateAftermathChoiceSpec[] {
  return [
    {
      text: 'Push a disciplined spin line before rivals define the night for you.',
      tags: ['Damage control', 'Rapid response', 'Safe lane'],
      moneyEffect: -45000,
      momentumEffect: 2,
      trustEffect: 2,
      volunteerEffect: 20,
      donorEffects: [{ blocId: leadDonor, relationshipDelta: 2, energyDelta: 5 }],
      mediaEffects: supportMedia.map((channelId, index) => ({ channelId, intensityDelta: index === 0 ? 4 : 2 })),
      rivalMomentumEffect: -2,
      rivalTrustEffect: -1,
      rivalBudgetEffect: -15000,
      logLine: `${featuredRivalName} had less room to win the spin war because your team closed the media window early.`
    },
    {
      text: 'Clip the best exchanges and push them to supporters all weekend.',
      tags: ['Digital clip push', 'Persuasion follow-up', 'Lower cost'],
      moneyEffect: -20000,
      momentumEffect: 2,
      trustEffect: 0,
      volunteerEffect: 45,
      donorEffects: [{ blocId: 'small_donors', relationshipDelta: 3, energyDelta: 8 }],
      mediaEffects: [{ channelId: 'digital', intensityDelta: 4 }],
      rivalMomentumEffect: -1,
      rivalTrustEffect: 0,
      rivalBudgetEffect: -8000,
      logLine: 'The clipped answers performed well online and helped the campaign hold attention through the weekend.'
    },
    {
      text: 'Quietly reassure validators and spend the next week governing from the center.',
      tags: ['Trust lane', 'Validator management', 'Low volatility'],
      moneyEffect: -25000,
      momentumEffect: 1,
      trustEffect: 3,
      volunteerEffect: 15,
      donorEffects: [{ blocId: leadDonor, relationshipDelta: 2, energyDelta: 4 }],
      mediaEffects: [{ channelId: 'local_tv', intensityDelta: 3 }],
      rivalMomentumEffect: 0,
      rivalTrustEffect: -2,
      rivalBudgetEffect: -6000,
      logLine: 'The calmer post-debate rollout did not dominate the news cycle, but it firmed up wavering trust.'
    }
  ];
}

function buildShakyChoices(
  leadDonor: DonorBlocId,
  supportMedia: MediaChannelId[],
  featuredRivalName: string
): DebateAftermathChoiceSpec[] {
  return [
    {
      text: 'Activate rapid response and smother the weakest clips before dawn.',
      tags: ['Recovery', 'War room', 'Expensive fix'],
      moneyEffect: -70000,
      momentumEffect: 1,
      trustEffect: 3,
      volunteerEffect: -10,
      donorEffects: [{ blocId: leadDonor, relationshipDelta: 1, energyDelta: 2 }],
      mediaEffects: supportMedia.map((channelId, index) => ({ channelId, intensityDelta: index === 0 ? 5 : 3 })),
      rivalMomentumEffect: -2,
      rivalTrustEffect: 0,
      rivalBudgetEffect: -10000,
      logLine: `Your war room moved quickly enough to keep ${featuredRivalName} from owning the entire post-debate window.`
    },
    {
      text: 'Pivot hard to field and grassroots contact while the pundits talk.',
      tags: ['Volunteer recovery', 'Base contact', 'Narrative dodge'],
      moneyEffect: -15000,
      momentumEffect: 0,
      trustEffect: 1,
      volunteerEffect: 70,
      donorEffects: [{ blocId: 'small_donors', relationshipDelta: 2, energyDelta: 6 }],
      mediaEffects: [{ channelId: 'digital', intensityDelta: 3 }],
      rivalMomentumEffect: 0,
      rivalTrustEffect: 0,
      rivalBudgetEffect: 0,
      logLine: 'The campaign stopped chasing the pundits and instead used the week to rebuild enthusiasm on the ground.'
    },
    {
      text: 'Counterpunch on your rival before the stumble hardens into the story.',
      tags: ['Contrast attack', 'High variance', 'Base jolt'],
      moneyEffect: -35000,
      momentumEffect: 3,
      trustEffect: -2,
      volunteerEffect: 10,
      donorEffects: [{ blocId: leadDonor, relationshipDelta: 3, energyDelta: 4 }],
      mediaEffects: [{ channelId: 'earned_media', intensityDelta: 4 }],
      rivalMomentumEffect: -3,
      rivalTrustEffect: -3,
      rivalBudgetEffect: -22000,
      logLine: `A sharp contrast attack redirected some of the scrutiny back toward ${featuredRivalName}, even if it came with its own risk.`
    }
  ];
}

export function buildDebateAftermath(
  debate: ActiveDebate,
  debateStanding: DebateStanding,
  playerName: string,
  featuredRivalName: string
): DebateAftermathSpec {
  const answerHistory = debate.answerHistory;
  const momentumTotal = sumChoiceMetric(answerHistory, 'momentumEffect');
  const trustTotal = sumChoiceMetric(answerHistory, 'trustEffect');
  const weightedStanding = Object.values(debateStanding).reduce((sum, value) => sum + value, 0);
  const averageAnswerQuality = answerHistory.length === 0
    ? 0
    : (momentumTotal + trustTotal + weightedStanding * 0.35) / answerHistory.length;
  const performance: DebateAftermathSpec['performance'] = averageAnswerQuality >= 6.8
    ? 'breakthrough'
    : averageAnswerQuality >= 4
      ? 'steady'
      : 'shaky';
  const leadTopic = getLeadTopic(answerHistory);
  const subgroupLine = describeSubgroupShift(debateStanding);
  const leadDonor = pickPreferredDonor(rankDebateGroups(debateStanding).leadPositive, debate.phase);
  const supportMedia = pickSupportMedia(performance);

  const headline = performance === 'breakthrough'
    ? `${playerName} broke through on ${leadTopic.toLowerCase()} and changed the post-debate conversation.`
    : performance === 'steady'
      ? `${playerName} put together a credible night, but the spin room is still contestable.`
      : `${playerName} left openings, and ${featuredRivalName} is trying to turn them into a week-long narrative.`;

  const choices = performance === 'breakthrough'
    ? buildBreakthroughChoices(leadDonor, supportMedia, featuredRivalName)
    : performance === 'steady'
      ? buildSteadyChoices(leadDonor, supportMedia, featuredRivalName)
      : buildShakyChoices(leadDonor, supportMedia, featuredRivalName);

  return {
    title: performance === 'breakthrough'
      ? `Spin Room Breakout: ${leadTopic}`
      : performance === 'steady'
        ? `Spin Room Fight: ${leadTopic}`
        : `Spin Room Recovery: ${leadTopic}`,
    description: `${headline} ${subgroupLine}`,
    performance,
    headline,
    choices
  };
}

export function createDebateAnswerRecord(
  debate: ActiveDebate,
  choiceIndex: number
): DebateAnswerRecord | null {
  const question = debate.questions[debate.currentQuestionIndex];
  const choice = question?.choices[choiceIndex];

  if (!question || !choice) {
    return null;
  }

  return {
    questionId: question.id,
    topic: question.topic,
    choiceIndex,
    choiceText: choice.text,
    momentumEffect: choice.momentumEffect,
    trustEffect: choice.trustEffect,
    groupEffects: { ...choice.groupEffects }
  };
}

export function describeDebateLead(standing: DebateStanding) {
  const ranked = rankDebateGroups(standing);
  const positive = ranked.positive.slice(0, 2).map(([group]) => GROUP_LABELS[group]);
  const negative = ranked.negative.slice(0, 1).map(([group]) => GROUP_LABELS[group]);

  return {
    positive,
    negative,
    summary: describeSubgroupShift(standing)
  };
}

export function summarizeDebatePerformance(answerHistory: DebateAnswerRecord[]) {
  const totalMomentum = sumChoiceMetric(answerHistory, 'momentumEffect');
  const totalTrust = sumChoiceMetric(answerHistory, 'trustEffect');
  const average = answerHistory.length === 0 ? 0 : (totalMomentum + totalTrust) / answerHistory.length;

  return {
    totalMomentum: clamp(totalMomentum, -100, 100),
    totalTrust: clamp(totalTrust, -100, 100),
    average
  };
}
