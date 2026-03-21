import type { StateElectionData } from './CampaignDataParser';
import type { PlayerDemographics } from './ElectionMath';

export type DonorBlocId =
  | 'small_donors'
  | 'labor'
  | 'business'
  | 'activists'
  | 'faith'
  | 'tech';

export type MediaChannelId =
  | 'local_tv'
  | 'cable'
  | 'digital'
  | 'earned_media'
  | 'rapid_response'
  | 'direct_mail';

export interface DonorBlocState {
  id: DonorBlocId;
  name: string;
  description: string;
  askLabel: string;
  relationship: number;
  energy: number;
  weeklyPotential: number;
  askAmount: number;
  staminaCost: number;
  trustRisk: number;
  momentumBonus: number;
  priorities: Partial<PlayerDemographics>;
  preferredIssues: string[];
  partyAffinity: 'Democrat' | 'Republican' | 'both';
}

export interface MediaChannelState {
  id: MediaChannelId;
  name: string;
  description: string;
  intensity: number;
  weeklyCostPerPoint: number;
  investmentCost: number;
  decay: number;
}

export interface CampaignMediaEffect {
  scoreMultiplier: number;
  turnoutBonus: number;
  stabilityBonus: number;
  trustLift: number;
  momentumLift: number;
  rivalPenalty: number;
  scandalShield: number;
}

export interface MediaSummary {
  weeklyCost: number;
  momentumDelta: number;
  trustDelta: number;
  scandalShield: number;
  strongestChannels: MediaChannelState[];
}

export interface DonorAskResult {
  blocs: DonorBlocState[];
  amount: number;
  trustDelta: number;
  momentumDelta: number;
  staminaCost: number;
  summary: string;
}

const ISSUE_SET = ['Economy', 'Healthcare', 'Immigration', 'Climate Change', 'Education', 'National Security', 'Civil Rights'];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function averagePriority(priorities: Partial<PlayerDemographics>) {
  const values = Object.values(priorities).filter((value): value is number => typeof value === 'number');
  if (values.length === 0) return 50;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreBlocCompatibility(
  ideology: PlayerDemographics,
  bloc: Pick<DonorBlocState, 'priorities' | 'preferredIssues' | 'partyAffinity'>,
  playerIssues: string[],
  party: 'Democrat' | 'Republican'
) {
  const ideologyScore = averagePriority(bloc.priorities) === 0
    ? 0.5
    : Object.entries(bloc.priorities).reduce((sum, [key, weight]) => {
        const ideologyValue = ideology[key as keyof PlayerDemographics] ?? 50;
        return sum + ((ideologyValue / 100) * (weight ?? 0));
      }, 0) / Math.max(1, averagePriority(bloc.priorities));
  const issueMatches = bloc.preferredIssues.filter((issue) => playerIssues.includes(issue)).length;
  const issueScore = bloc.preferredIssues.length === 0
    ? 0.5
    : issueMatches / bloc.preferredIssues.length;
  const partyScore = bloc.partyAffinity === 'both'
    ? 0.55
    : bloc.partyAffinity === party
      ? 0.8
      : 0.3;

  return clamp((ideologyScore * 45) + (issueScore * 25) + (partyScore * 30), 20, 92);
}

function buildBaseDonorBlocs(): Omit<DonorBlocState, 'relationship' | 'energy'>[] {
  return [
    {
      id: 'small_donors',
      name: 'Small-Dollar Army',
      description: 'Email, text, and merch donors who reward authenticity, issue focus, and momentum.',
      askLabel: 'Launch grassroots push',
      weeklyPotential: 72000,
      askAmount: 82000,
      staminaCost: 3,
      trustRisk: -1,
      momentumBonus: 3,
      priorities: { worker: 55, liberal: 45, religious: 20, immigrant: 30 },
      preferredIssues: ['Healthcare', 'Civil Rights', 'Climate Change', 'Economy'],
      partyAffinity: 'both'
    },
    {
      id: 'labor',
      name: 'Labor Tables',
      description: 'Union leaders and blue-collar donor networks who care about wages, trade, and organizing strength.',
      askLabel: 'Hit labor roundtables',
      weeklyPotential: 108000,
      askAmount: 145000,
      staminaCost: 5,
      trustRisk: 0,
      momentumBonus: 2,
      priorities: { worker: 80, religious: 25, liberal: 35, owner: 10 },
      preferredIssues: ['Economy', 'Healthcare', 'Education'],
      partyAffinity: 'both'
    },
    {
      id: 'business',
      name: 'Business Roundtable',
      description: 'Executives, major investors, and trade groups who can fill the war chest but can hurt populist credibility.',
      askLabel: 'Host finance dinner',
      weeklyPotential: 185000,
      askAmount: 285000,
      staminaCost: 6,
      trustRisk: 8,
      momentumBonus: 0,
      priorities: { owner: 90, libertarian: 50, worker: 15 },
      preferredIssues: ['Economy', 'National Security'],
      partyAffinity: 'both'
    },
    {
      id: 'activists',
      name: 'Movement Activists',
      description: 'Issue-focused networks that reward boldness, clean enemies, and ideological clarity.',
      askLabel: 'Fire up activist lists',
      weeklyPotential: 92000,
      askAmount: 115000,
      staminaCost: 4,
      trustRisk: 1,
      momentumBonus: 4,
      priorities: { liberal: 78, immigrant: 55, libertarian: 18, worker: 35 },
      preferredIssues: ['Climate Change', 'Civil Rights', 'Immigration'],
      partyAffinity: 'Democrat'
    },
    {
      id: 'faith',
      name: 'Faith Coalition',
      description: 'Church networks, values PACs, and religious broadcasters that can mobilize loyal, high-turnout communities.',
      askLabel: 'Work the values circuit',
      weeklyPotential: 102000,
      askAmount: 130000,
      staminaCost: 4,
      trustRisk: 1,
      momentumBonus: 3,
      priorities: { religious: 88, worker: 30, owner: 20, liberal: 8 },
      preferredIssues: ['Education', 'National Security'],
      partyAffinity: 'Republican'
    },
    {
      id: 'tech',
      name: 'Tech & Innovation Finance',
      description: 'Startup founders, digital financiers, and online bundlers who love disruption, data, and scale.',
      askLabel: 'Pitch innovation donors',
      weeklyPotential: 132000,
      askAmount: 188000,
      staminaCost: 5,
      trustRisk: 5,
      momentumBonus: 2,
      priorities: { owner: 52, libertarian: 58, liberal: 42, immigrant: 36 },
      preferredIssues: ['Economy', 'Immigration', 'Education'],
      partyAffinity: 'both'
    }
  ];
}

export function createInitialDonorBlocs(
  ideology: PlayerDemographics,
  playerIssues: string[],
  party: 'Democrat' | 'Republican'
): DonorBlocState[] {
  return buildBaseDonorBlocs().map((bloc) => {
    const relationship = scoreBlocCompatibility(ideology, bloc, playerIssues, party);
    return {
      ...bloc,
      relationship,
      energy: clamp(70 + Math.round((relationship - 50) * 0.45), 48, 92)
    };
  });
}

function buildBaseMediaChannels(): MediaChannelState[] {
  return [
    {
      id: 'local_tv',
      name: 'Local TV Buy',
      description: 'Build familiarity in expensive battleground media markets and high-value primary states.',
      intensity: 0,
      weeklyCostPerPoint: 1800,
      investmentCost: 95000,
      decay: 10
    },
    {
      id: 'cable',
      name: 'Cable Narrative',
      description: 'Shape elite chatter and broad narrative framing, especially among older and habitual voters.',
      intensity: 0,
      weeklyCostPerPoint: 1450,
      investmentCost: 70000,
      decay: 8
    },
    {
      id: 'digital',
      name: 'Digital Mobilization',
      description: 'Microtarget, retarget, and push turnout reminders into persuadable online audiences.',
      intensity: 0,
      weeklyCostPerPoint: 1250,
      investmentCost: 65000,
      decay: 9
    },
    {
      id: 'earned_media',
      name: 'Earned Media Tour',
      description: 'Town halls, friendly interviews, and headline-making appearances that create free momentum when they land.',
      intensity: 0,
      weeklyCostPerPoint: 950,
      investmentCost: 50000,
      decay: 11
    },
    {
      id: 'rapid_response',
      name: 'Rapid Response War Room',
      description: 'Fact-check, clipping, surrogate booking, and opposition pushback that soften bad news cycles.',
      intensity: 0,
      weeklyCostPerPoint: 1050,
      investmentCost: 55000,
      decay: 7
    },
    {
      id: 'direct_mail',
      name: 'Direct Mail Program',
      description: 'Targeted persuasion and vote-plan communication that helps older voters and lower-information households.',
      intensity: 0,
      weeklyCostPerPoint: 1200,
      investmentCost: 60000,
      decay: 8
    }
  ];
}

export function createInitialMediaChannels(
  party: 'Democrat' | 'Republican',
  playerIssues: string[]
): MediaChannelState[] {
  const defaults = buildBaseMediaChannels();
  return defaults.map((channel) => {
    if (channel.id === 'digital' && playerIssues.some((issue) => issue === 'Climate Change' || issue === 'Civil Rights')) {
      return { ...channel, intensity: party === 'Democrat' ? 10 : 6 };
    }
    if (channel.id === 'cable' && party === 'Republican') {
      return { ...channel, intensity: 8 };
    }
    if (channel.id === 'local_tv' && playerIssues.includes('Economy')) {
      return { ...channel, intensity: 6 };
    }
    return channel;
  });
}

export function askDonorBloc(
  blocs: DonorBlocState[],
  blocId: DonorBlocId,
  ideology: PlayerDemographics,
  playerIssues: string[],
  party: 'Democrat' | 'Republican'
): DonorAskResult | null {
  const target = blocs.find((bloc) => bloc.id === blocId);
  if (!target) return null;

  const compatibility = scoreBlocCompatibility(ideology, target, playerIssues, party);
  const enthusiasm = (target.relationship * 0.55) + (target.energy * 0.45);
  const amount = Math.round(
    target.askAmount
    * (0.56 + (compatibility / 300))
    * (0.54 + (enthusiasm / 240))
  );

  const updated = blocs.map((bloc) => {
    if (bloc.id !== blocId) {
      const passiveRecovery = 1;
      return {
        ...bloc,
        energy: clamp(bloc.energy + passiveRecovery),
        relationship: clamp(bloc.relationship + (bloc.id === target.id ? 0 : 0))
      };
    }

    const relationshipDelta = target.trustRisk > 4 ? -1 : 1;
    return {
      ...bloc,
      energy: clamp(bloc.energy - 26),
      relationship: clamp(bloc.relationship + relationshipDelta + Math.round((compatibility - 55) / 20))
    };
  });

  const trustDelta = target.id === 'small_donors'
    ? 2
    : target.id === 'labor'
      ? 1
      : target.id === 'business'
        ? -target.trustRisk
        : target.id === 'tech'
          ? -target.trustRisk
          : target.id === 'faith'
            ? 0
            : -1;
  const momentumDelta = target.momentumBonus + (compatibility >= 70 ? 1 : 0);

  return {
    blocs: updated,
    amount,
    trustDelta,
    momentumDelta,
    staminaCost: target.staminaCost,
    summary: `${target.name} came through with ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)} after a ${target.askLabel.toLowerCase()}.`
  };
}

export function recoverDonorBlocs(
  blocs: DonorBlocState[],
  ideology: PlayerDemographics,
  playerIssues: string[],
  party: 'Democrat' | 'Republican',
  trust: number,
  momentum: number
): DonorBlocState[] {
  return blocs.map((bloc) => {
    const compatibility = scoreBlocCompatibility(ideology, bloc, playerIssues, party);
    const trustModifier = (trust - 50) / 20;
    const momentumModifier = (momentum - 45) / 30;
    const targetRelationship = clamp((compatibility * 0.68) + 16 + trustModifier + momentumModifier, 22, 90);

    return {
      ...bloc,
      energy: clamp(bloc.energy + 5 + (bloc.id === 'small_donors' ? Math.max(0, Math.round(momentum / 50)) : 0)),
      relationship: clamp(bloc.relationship + Math.round((targetRelationship - bloc.relationship) / 7))
    };
  });
}

export function getPassiveDonorIncome(
  blocs: DonorBlocState[],
  trust: number,
  momentum: number
): number {
  return Math.round(blocs.reduce((sum, bloc) => {
    const relationshipFactor = bloc.relationship / 100;
    const energyFactor = bloc.energy / 100;
    const moodFactor = 0.58 + (trust / 320) + (momentum / 420);
    return sum + (bloc.weeklyPotential * relationshipFactor * energyFactor * moodFactor);
  }, 0));
}

export function investInMediaChannel(
  channels: MediaChannelState[],
  channelId: MediaChannelId
): MediaChannelState[] {
  return channels.map((channel) => {
    if (channel.id !== channelId) return channel;
    const lift = channel.id === 'rapid_response' ? 12 : channel.id === 'earned_media' ? 13 : 14;
    return {
      ...channel,
      intensity: clamp(channel.intensity + lift)
    };
  });
}

export function applyWeeklyMediaDecay(channels: MediaChannelState[]): MediaChannelState[] {
  return channels.map((channel) => ({
    ...channel,
    intensity: clamp(channel.intensity - channel.decay - (channel.intensity >= 35 ? 2 : 0))
  }));
}

function channelIntensity(channels: MediaChannelState[], channelId: MediaChannelId) {
  return (channels.find((channel) => channel.id === channelId)?.intensity ?? 0) / 100;
}

export function getWeeklyMediaCost(channels: MediaChannelState[]) {
  return Math.round(channels.reduce((sum, channel) => {
    return sum + (channel.intensity * channel.weeklyCostPerPoint);
  }, 0));
}

export function getMediaSummary(channels: MediaChannelState[]): MediaSummary {
  const strongestChannels = [...channels]
    .filter((channel) => channel.intensity >= 12)
    .sort((left, right) => right.intensity - left.intensity)
    .slice(0, 3);
  const earned = channelIntensity(channels, 'earned_media');
  const rapid = channelIntensity(channels, 'rapid_response');

  return {
    weeklyCost: getWeeklyMediaCost(channels),
    momentumDelta: Math.round((earned * 4.0) + (channelIntensity(channels, 'digital') * 1.8)),
    trustDelta: Math.round((rapid * 2.4) + (channelIntensity(channels, 'local_tv') * 1.2) - (channelIntensity(channels, 'cable') * 0.9)),
    scandalShield: (rapid * 0.3) + (channelIntensity(channels, 'cable') * 0.1),
    strongestChannels
  };
}

export function getMediaStateEffect(
  stateData: StateElectionData,
  channels: MediaChannelState[]
): CampaignMediaEffect {
  const battlegroundFactor = Math.max(0.5, 1.18 - (Math.abs(stateData.partisanLean ?? 0) / 20));
  const localTv = channelIntensity(channels, 'local_tv');
  const cable = channelIntensity(channels, 'cable');
  const digital = channelIntensity(channels, 'digital');
  const earned = channelIntensity(channels, 'earned_media');
  const rapid = channelIntensity(channels, 'rapid_response');
  const directMail = channelIntensity(channels, 'direct_mail');
  const coalitionDensity = (stateData.worker + stateData.owner + stateData.religious) / 300;
  const digitalDensity = (stateData.liberal + stateData.libertarian + stateData.immigrant) / 300;

  return {
    scoreMultiplier: 1
      + (localTv * 0.08 * battlegroundFactor)
      + (cable * 0.035 * coalitionDensity)
      + (digital * 0.045 * digitalDensity)
      + (directMail * 0.04 * coalitionDensity)
      + (earned * 0.02),
    turnoutBonus:
      (digital * (3.2 - (stateData.baseTurnout / 36)))
      + (directMail * 1.4)
      + (localTv * 0.65 * battlegroundFactor),
    stabilityBonus: (rapid * 9) + (cable * 3) + (directMail * 2),
    trustLift: (rapid * 1.1) + (localTv * 0.55),
    momentumLift: (earned * 3.2) + (digital * 1.2),
    rivalPenalty: (rapid * 0.04) + (earned * 0.02),
    scandalShield: (rapid * 0.28) + (cable * 0.12)
  };
}

export function getMediaChannelById(channels: MediaChannelState[], channelId: MediaChannelId) {
  return channels.find((channel) => channel.id === channelId) ?? null;
}

export function getDefaultIssuePool() {
  return [...ISSUE_SET];
}
