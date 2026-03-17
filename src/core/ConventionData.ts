import type { RivalAI } from './SimulationEngine';

export type ConventionStrategy = 'unity' | 'dealmaking' | 'contrast' | 'platform' | 'powerbrokers' | 'ticket';

export interface ConventionChoiceTemplate {
  id: string;
  title: string;
  description: string;
  reaction: string;
  strategy: ConventionStrategy;
  budgetCost: number;
  momentumEffect: number;
  trustEffect: number;
}

export interface ConventionRoundTemplate {
  ballot: number;
  title: string;
  subtitle: string;
  choices: ConventionChoiceTemplate[];
}

export type ActiveConventionChoice = ConventionChoiceTemplate;

export interface ActiveConvention {
  ballot: number;
  maxBallots: number;
  title: string;
  subtitle: string;
  choices: ActiveConventionChoice[];
  selectedChoiceIndex: number | null;
  latestReaction: string | null;
  playerDelegates: number;
  rivalDelegates: number;
  freeDelegates: number;
  targetDelegates: number;
  leadingRivalId: string;
  leadingRivalName: string;
  playerEndorsements: number;
  rivalEndorsements: number;
  history: string[];
}

const CONVENTION_ROUNDS: ConventionRoundTemplate[] = [
  {
    ballot: 1,
    title: 'Credentials Fight',
    subtitle: 'No candidate arrived with a majority. Floor leaders are trying to decide whether this convention becomes a coronation or a battle.',
    choices: [
      {
        id: 'unity-speech',
        title: 'Deliver a unity speech',
        description: 'Make the case that the party needs a nominee who can hold every wing together in November.',
        reaction: 'Delegates respond to the electability pitch and the hall settles down around your coalition.',
        strategy: 'unity',
        budgetCost: 0,
        momentumEffect: 4,
        trustEffect: 4
      },
      {
        id: 'floor-whip',
        title: 'Run a full whip operation',
        description: 'Deploy staff, donors, and endorsers to track every undecided delegate on the floor.',
        reaction: 'The operation looks expensive, but it convinces delegates that you are serious about finishing the job.',
        strategy: 'dealmaking',
        budgetCost: 150000,
        momentumEffect: 2,
        trustEffect: 1
      },
      {
        id: 'frontrunner-contrast',
        title: 'Argue the frontrunner is unelectable',
        description: 'Force the convention to focus on the general-election risk of backing the leading rival.',
        reaction: 'The speech electrifies one bloc and angers another, but it does scramble the inevitability narrative.',
        strategy: 'contrast',
        budgetCost: 0,
        momentumEffect: 5,
        trustEffect: -2
      }
    ]
  },
  {
    ballot: 2,
    title: 'Platform Negotiations',
    subtitle: 'The convention moves behind closed doors. Delegates want concessions, portfolios, and proof that their wing will still matter.',
    choices: [
      {
        id: 'platform-deal',
        title: 'Cut a platform deal',
        description: 'Offer visible concessions on signature planks to win over suspended campaigns and ideological blocs.',
        reaction: 'Some delegates see pragmatism; others see weakness. Either way, votes start to move.',
        strategy: 'platform',
        budgetCost: 0,
        momentumEffect: 2,
        trustEffect: 3
      },
      {
        id: 'broker-room',
        title: 'Court party brokers',
        description: 'Spend political capital with governors, committee chairs, and donor networks who want a clean ending.',
        reaction: 'The establishment likes the discipline, but activists read it as insider politics.',
        strategy: 'powerbrokers',
        budgetCost: 100000,
        momentumEffect: 1,
        trustEffect: -1
      },
      {
        id: 'movement-floor',
        title: 'Take the fight to the floor',
        description: 'Lean into your movement supporters and make it harder for delegates to drift back to the frontrunner.',
        reaction: 'The hall gets louder and more chaotic, but your base starts to believe the convention can actually break your way.',
        strategy: 'unity',
        budgetCost: 50000,
        momentumEffect: 4,
        trustEffect: 1
      }
    ]
  },
  {
    ballot: 3,
    title: 'Brokered Finish',
    subtitle: 'The convention is exhausted. Delegates want a ticket they can defend, and this ballot will likely decide the nominee.',
    choices: [
      {
        id: 'unity-ticket',
        title: 'Offer a unity ticket',
        description: 'Signal openness to a rival faction in the vice presidency or cabinet to close the deal.',
        reaction: 'The room sees a path out of deadlock and starts consolidating around one final coalition.',
        strategy: 'ticket',
        budgetCost: 0,
        momentumEffect: 3,
        trustEffect: 5
      },
      {
        id: 'electability-case',
        title: 'Make the electability case',
        description: 'Argue that your campaign is the only one broad enough to survive the general election map.',
        reaction: 'The speech lands hardest with delegates who are already afraid of handing the fall campaign to the wrong nominee.',
        strategy: 'contrast',
        budgetCost: 0,
        momentumEffect: 5,
        trustEffect: 2
      },
      {
        id: 'backroom-close',
        title: 'Close the room with hard bargaining',
        description: 'Trade promises, assignments, and floor support to force a final settlement before chaos spreads.',
        reaction: 'It is ruthless, expensive, and effective if enough people believe you can govern after the smoke clears.',
        strategy: 'dealmaking',
        budgetCost: 180000,
        momentumEffect: 2,
        trustEffect: -1
      }
    ]
  }
];

export function createConvention(
  playerDelegates: number,
  leadingRival: RivalAI,
  freeDelegates: number,
  targetDelegates: number,
  playerEndorsements: number,
  rivalEndorsements: number
): ActiveConvention {
  const firstRound = CONVENTION_ROUNDS[0];

  return {
    ballot: 1,
    maxBallots: CONVENTION_ROUNDS.length,
    title: firstRound.title,
    subtitle: firstRound.subtitle,
    choices: firstRound.choices,
    selectedChoiceIndex: null,
    latestReaction: null,
    playerDelegates,
    rivalDelegates: leadingRival.delegates,
    freeDelegates,
    targetDelegates,
    leadingRivalId: leadingRival.id,
    leadingRivalName: leadingRival.name,
    playerEndorsements,
    rivalEndorsements,
    history: []
  };
}

export function getConventionRound(ballot: number): ConventionRoundTemplate {
  return CONVENTION_ROUNDS[Math.min(CONVENTION_ROUNDS.length - 1, ballot - 1)];
}
