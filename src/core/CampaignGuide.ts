export interface GuideEntry {
  term: string;
  description: string;
  coaching: string;
}

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  entries: GuideEntry[];
}

export interface TutorialStep {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  takeaways: string[];
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'campaign-loop',
    title: 'Campaign Loop',
    summary: 'Every week is a resource tradeoff between visibility, organization, and coalition building.',
    entries: [
      {
        term: 'Weekly Rhythm',
        description: 'Most turns end with one click on advance week. Your actions, debates, events, and passive decay all resolve around that cadence.',
        coaching: 'Think in two- or three-week arcs, not one-week spikes.'
      },
      {
        term: 'Primary Goal',
        description: 'In the primary, you are trying to win enough delegates to secure the nomination before the convention or survive into a brokered floor fight.',
        coaching: 'Delegate rules matter as much as raw polling.'
      },
      {
        term: 'General Goal',
        description: 'In the general election, your win condition is electoral votes, not national popular vote.',
        coaching: 'A narrow path through swing states can beat a broad but inefficient national lead.'
      }
    ]
  },
  {
    id: 'core-stats',
    title: 'Core Stats',
    summary: 'These are the numbers that define whether your campaign is expanding, surviving, or stalling.',
    entries: [
      {
        term: 'Trust',
        description: 'Trust reflects how believable, disciplined, and scandal-resistant your campaign feels.',
        coaching: 'Low trust makes bad weeks cascade. Protect it before you chase flashy momentum.'
      },
      {
        term: 'Momentum',
        description: 'Momentum is the media and activist wind at your back. It helps, but it fades quickly if you stop feeding it.',
        coaching: 'Treat momentum as something to convert into delegates, endorsements, or offices before it decays.'
      },
      {
        term: 'Stamina',
        description: 'Stamina is your candidate’s ability to keep campaigning hard without visible exhaustion.',
        coaching: 'When stamina gets low, your margin for absorbing debates and shocks shrinks.'
      },
      {
        term: 'Budget',
        description: 'Budget funds every durable part of the campaign, from ads and research to offices and recovery after setbacks.',
        coaching: 'If cash is tight, favor systems that persist rather than one-week splashes.'
      }
    ]
  },
  {
    id: 'operations',
    title: 'State Operations',
    summary: 'Campaigning is no longer just ad spend. Durable state organization now wins close races.',
    entries: [
      {
        term: 'Field Offices',
        description: 'Offices are long-term investments. They build readiness over time and unlock larger volunteer capacity.',
        coaching: 'Open them early in states you expect to fight over for multiple weeks.'
      },
      {
        term: 'Volunteers',
        description: 'Volunteers come from your reserve and strengthen local turnout and organizational resilience inside a state.',
        coaching: 'A strong office makes the same volunteer deployment much more valuable.'
      },
      {
        term: 'Surrogates',
        description: 'Running mates, staff surrogates, and endorsers can be assigned weekly to states that need local earned media and coalition reinforcement.',
        coaching: 'Move surrogates to your thinnest states, not your safest ones.'
      },
      {
        term: 'Ad Decay',
        description: 'Paid media fades each week. Organization decays too, but much more slowly than one-off ad buys.',
        coaching: 'Use ads to create openings, then hold them with offices and volunteers.'
      }
    ]
  },
  {
    id: 'party-rules',
    title: 'Party Rules & Coalitions',
    summary: 'The map is filtered through party rules, endorsement coalitions, and convention math.',
    entries: [
      {
        term: 'Delegate Rules',
        description: 'Different states can be proportional, threshold-based, hybrid, or winner-take-all depending on the party and contest.',
        coaching: 'Read the rule panel before deciding whether a state is worth a full push.'
      },
      {
        term: 'Endorsements',
        description: 'Endorsements add fundraising, trust, turnout help, and convention leverage. They also shape who looks viable to party elites.',
        coaching: 'Court endorsers whose coalition overlaps with the states you are already targeting.'
      },
      {
        term: 'Convention Leverage',
        description: 'If nobody wins outright, delegates, elite backing, and coalition strength all matter at the convention.',
        coaching: 'A close second with a better coalition can still become the nominee.'
      }
    ]
  },
  {
    id: 'general-map',
    title: 'General Election Map',
    summary: 'Once the primary ends, the game becomes a state-by-state electoral college knife fight.',
    entries: [
      {
        term: 'Battlegrounds',
        description: 'The closest states decide the map, but not every close state is equally valuable.',
        coaching: 'Prioritize states that are both close and electorally meaningful.'
      },
      {
        term: 'Turnout',
        description: 'Turnout is shaped by base enthusiasm, ground game, endorsements, and field organization.',
        coaching: 'A strong turnout machine can rescue states where polling alone looks shaky.'
      },
      {
        term: 'Election Night',
        description: 'Final results now call state by state. What matters is where your actual map lands, not just your last projection.',
        coaching: 'Build multiple routes to 270 so one polling miss does not end the run.'
      }
    ]
  },
  {
    id: 'workflow',
    title: 'Workflow & Shortcuts',
    summary: 'The app is easier to manage once you know where each decision lives.',
    entries: [
      {
        term: 'Map Tab',
        description: 'Use the map to open a state panel and commit direct tactical actions.',
        coaching: 'If you know the state, click it. That is the fastest way to act.'
      },
      {
        term: 'Campaign HQ',
        description: 'HQ is where you manage staff, coalition strategy, field-network overview, and surrogate deployment.',
        coaching: 'Check it every few weeks so your political operation keeps pace with your polling operation.'
      },
      {
        term: 'Save Slots',
        description: 'Manual and autosave slots let you preserve strategic branches and revisit turning points.',
        coaching: 'Save before convention week, VP selection, and major debates.'
      },
      {
        term: 'Keyboard Shortcuts',
        description: 'Press Space to advance week, Escape to close panels, and 1 through 6 to jump between major tabs.',
        coaching: 'These shortcuts make long runs much smoother.'
      }
    ]
  }
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    eyebrow: 'Welcome',
    title: 'You are building a nomination, not just chasing a headline.',
    body: 'Every run starts with weak resources and a crowded political lane. Your job is to turn attention into delegates, then turn delegates into a viable general-election map.',
    takeaways: [
      'Primary season is about surviving long enough to consolidate a coalition.',
      'The general election is a separate map with different incentives.',
      'Momentum matters, but durable systems matter more.'
    ]
  },
  {
    id: 'loop',
    eyebrow: 'Weekly Loop',
    title: 'Most strategic mistakes happen because players think only one week ahead.',
    body: 'The strongest campaigns plan in short arcs: open a lane, reinforce it, then harvest it before the narrative turns.',
    takeaways: [
      'Use the map for tactical state actions.',
      'Use Campaign HQ for staff, endorsements, and surrogate decisions.',
      'Advance week only after you know what this week is supposed to accomplish.'
    ]
  },
  {
    id: 'stats',
    eyebrow: 'Core Stats',
    title: 'Trust, momentum, stamina, and cash all pull in different directions.',
    body: 'A flashy campaign can still collapse if trust erodes, stamina burns out, or the treasury dries up. Winning runs protect the floor as much as they chase the ceiling.',
    takeaways: [
      'Trust keeps bad events from snowballing.',
      'Momentum fades unless you convert it into something lasting.',
      'Budget and stamina set the real pace of the campaign.'
    ]
  },
  {
    id: 'organization',
    eyebrow: 'Field Game',
    title: 'Offices, volunteers, and surrogates are now how you hold a state.',
    body: 'Ads can open a race, but durable field organization is what keeps a close state from slipping away after one rough debate or scandal week.',
    takeaways: [
      'Open offices early in states you expect to revisit.',
      'Deploy volunteers where your office can actually support them.',
      'Move surrogates into thin states before a close contest, not after.'
    ]
  },
  {
    id: 'coalition',
    eyebrow: 'Coalition',
    title: 'The party notices who looks electable, organized, and durable.',
    body: 'Endorsements, delegate rules, and convention leverage all reward campaigns that can do more than spike a poll. Build a coalition that still makes sense when the race gets ugly.',
    takeaways: [
      'Not every state should be fought the same way.',
      'Endorsers should reinforce your chosen path, not distract from it.',
      'If the nomination deadlocks, your political operation can save you.'
    ]
  }
];
