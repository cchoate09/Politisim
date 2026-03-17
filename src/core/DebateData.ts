import type { PlayerDemographics } from './ElectionMath';

export type DebatePhase = 'primary' | 'general';

export interface DebateChoice {
  text: string;
  reaction: string;
  momentumEffect: number;
  trustEffect: number;
  groupEffects: Partial<PlayerDemographics>;
}

export interface DebateQuestion {
  id: string;
  topic: string;
  prompt: string;
  choices: DebateChoice[];
}

export interface DebateTemplate {
  id: string;
  phase: DebatePhase;
  sequence: number;
  title: string;
  subtitle: string;
  venue: string;
  moderator: string;
  audienceLabel: string;
  questions: DebateQuestion[];
}

export interface DebateScheduleEntry {
  week: number;
  debateId: string;
  phase: DebatePhase;
  sequence: number;
  title: string;
}

export interface DebateParticipant {
  name: string;
  role: 'player' | 'rival';
  tagline: string;
}

export interface ActiveDebate {
  id: string;
  phase: DebatePhase;
  sequence: number;
  week: number;
  title: string;
  subtitle: string;
  venue: string;
  moderator: string;
  audienceLabel: string;
  questions: DebateQuestion[];
  participants: DebateParticipant[];
  currentQuestionIndex: number;
  selectedChoiceIndex: number | null;
  latestReaction: string | null;
}

export type DebateStanding = Record<keyof PlayerDemographics, number>;

const DEBATE_GROUPS: Array<keyof PlayerDemographics> = [
  'liberal',
  'libertarian',
  'owner',
  'worker',
  'religious',
  'immigrant'
];

const MAX_DEBATE_SHIFT = 24;

export const EMPTY_DEBATE_STANDING: DebateStanding = {
  liberal: 0,
  libertarian: 0,
  owner: 0,
  worker: 0,
  religious: 0,
  immigrant: 0
};

export const DEBATE_SCHEDULE: DebateScheduleEntry[] = [
  { week: 20, debateId: 'primary-1', phase: 'primary', sequence: 1, title: 'Primary Debate 1' },
  { week: 23, debateId: 'primary-2', phase: 'primary', sequence: 2, title: 'Primary Debate 2' },
  { week: 26, debateId: 'primary-3', phase: 'primary', sequence: 3, title: 'Primary Debate 3' },
  { week: 36, debateId: 'primary-4', phase: 'primary', sequence: 4, title: 'Primary Debate 4' },
  { week: 46, debateId: 'primary-5', phase: 'primary', sequence: 5, title: 'Primary Debate 5' },
  { week: 60, debateId: 'general-1', phase: 'general', sequence: 1, title: 'General Debate 1' },
  { week: 63, debateId: 'general-2', phase: 'general', sequence: 2, title: 'General Debate 2' },
  { week: 66, debateId: 'general-3', phase: 'general', sequence: 3, title: 'General Debate 3' }
];

const DEBATE_LIBRARY: DebateTemplate[] = [
  {
    id: 'primary-1',
    phase: 'primary',
    sequence: 1,
    title: 'Economic Fairness Forum',
    subtitle: 'The party base is looking for a clear economic identity before voting begins.',
    venue: 'Milwaukee Civic Auditorium',
    moderator: 'Elena Cruz',
    audienceLabel: 'County chairs, labor delegates, local press',
    questions: [
      {
        id: 'primary-1-jobs',
        topic: 'Jobs',
        prompt: 'Factories are closing and wages are flat. What is your first move on the economy?',
        choices: [
          {
            text: 'Launch an aggressive industrial policy tied to union jobs.',
            reaction: 'The room roars from the labor sections while business donors go quiet.',
            momentumEffect: 6,
            trustEffect: 2,
            groupEffects: { worker: 12, liberal: 4, owner: -8 }
          },
          {
            text: 'Cut taxes for small firms and reward companies that hire at home.',
            reaction: 'The applause is steadier, with local chambers of commerce leaning in.',
            momentumEffect: 4,
            trustEffect: 3,
            groupEffects: { owner: 9, worker: 4, libertarian: 4 }
          },
          {
            text: 'Push a bipartisan wage and training compact with governors.',
            reaction: 'Moderates nod along, even if the activists wanted more heat.',
            momentumEffect: 3,
            trustEffect: 5,
            groupEffects: { worker: 6, owner: 3, religious: 2 }
          }
        ]
      },
      {
        id: 'primary-1-health',
        topic: 'Healthcare',
        prompt: 'Prescription prices keep climbing. How hard are you willing to go after the industry?',
        choices: [
          {
            text: 'Authorize direct price negotiation and cap out-of-pocket costs fast.',
            reaction: 'A sharp cheer rises from the back rows as the moderator pushes for details.',
            momentumEffect: 5,
            trustEffect: 4,
            groupEffects: { liberal: 8, worker: 7, owner: -5 }
          },
          {
            text: 'Keep private coverage but hammer monopolies and hospital mergers.',
            reaction: 'The answer lands as disciplined and credible rather than flashy.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { owner: 4, worker: 5, libertarian: 3 }
          },
          {
            text: 'Expand tax credits and let families pick what works for them.',
            reaction: 'The audience is mixed, but suburban attendees seem relieved.',
            momentumEffect: 2,
            trustEffect: 4,
            groupEffects: { owner: 5, religious: 3, liberal: -3 }
          }
        ]
      },
      {
        id: 'primary-1-immigration',
        topic: 'Immigration',
        prompt: 'Border crossings are up. What should your party say without sounding panicked?',
        choices: [
          {
            text: 'Defend asylum, modernize processing, and punish exploitative employers.',
            reaction: 'Advocates erupt while some county leaders trade anxious looks.',
            momentumEffect: 5,
            trustEffect: 2,
            groupEffects: { immigrant: 12, liberal: 6, religious: -2 }
          },
          {
            text: 'Add judges, secure the border, and tie reform to enforcement.',
            reaction: 'The answer feels balanced enough to quiet the room.',
            momentumEffect: 4,
            trustEffect: 5,
            groupEffects: { immigrant: 4, owner: 4, religious: 4 }
          },
          {
            text: 'Talk less about the border and more about wages and local strain.',
            reaction: 'You sidestep the trap, but the moderator makes sure everyone notices.',
            momentumEffect: 1,
            trustEffect: 1,
            groupEffects: { worker: 5, immigrant: -3, religious: 2 }
          }
        ]
      }
    ]
  },
  {
    id: 'primary-2',
    phase: 'primary',
    sequence: 2,
    title: 'Faith and Freedom Town Hall',
    subtitle: 'Social issues move from background noise to front-page tests.',
    venue: 'Columbia Performing Arts Center',
    moderator: 'Marcus Bell',
    audienceLabel: 'Church leaders, activists, campus reporters',
    questions: [
      {
        id: 'primary-2-rights',
        topic: 'Rights',
        prompt: 'A statewide abortion ban has just taken effect. What role should Washington play?',
        choices: [
          {
            text: 'Back federal protections and say the party must fight openly for them.',
            reaction: 'The answer electrifies younger voters and draws visible pushback elsewhere.',
            momentumEffect: 6,
            trustEffect: 2,
            groupEffects: { liberal: 11, immigrant: 4, religious: -8 }
          },
          {
            text: 'Support protections with room for state flexibility and medical exceptions.',
            reaction: 'The room settles into careful applause as you thread a narrow lane.',
            momentumEffect: 3,
            trustEffect: 6,
            groupEffects: { liberal: 5, religious: 3, owner: 2 }
          },
          {
            text: 'Say the party should lower the temperature and focus on maternal care.',
            reaction: 'You sound calm, but some activists visibly deflate.',
            momentumEffect: 1,
            trustEffect: 4,
            groupEffects: { religious: 6, worker: 3, liberal: -4 }
          }
        ]
      },
      {
        id: 'primary-2-liberty',
        topic: 'Religious Liberty',
        prompt: 'Should faith-based schools and charities get wider exemptions from federal rules?',
        choices: [
          {
            text: 'Yes, if they serve the public and do not discriminate in basic services.',
            reaction: 'Moderates appreciate the nuance, even if no faction gets everything it wants.',
            momentumEffect: 3,
            trustEffect: 6,
            groupEffects: { religious: 7, owner: 2, liberal: 1 }
          },
          {
            text: 'No, civil-rights law has to come first every time.',
            reaction: 'The activist flank cheers loudly and instantly.',
            momentumEffect: 5,
            trustEffect: 3,
            groupEffects: { liberal: 9, immigrant: 5, religious: -7 }
          },
          {
            text: 'Keep exemptions narrow and focus federal attention on public-school funding.',
            reaction: 'The answer lands as practical but less memorable than the sharper alternatives.',
            momentumEffect: 2,
            trustEffect: 5,
            groupEffects: { worker: 5, religious: 2, liberal: 2 }
          }
        ]
      },
      {
        id: 'primary-2-safety',
        topic: 'Public Safety',
        prompt: 'Crime is rising in several cities. Do you lean into reform, enforcement, or both?',
        choices: [
          {
            text: 'Rebuild trust with federal standards, local hiring, and targeted intervention.',
            reaction: 'You sound prepared, and the audience gives you a long, measured clap.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { worker: 5, liberal: 4, religious: 3 }
          },
          {
            text: 'Put more officers on the street now and stop overthinking it.',
            reaction: 'The sharper tone cuts through the room immediately.',
            momentumEffect: 5,
            trustEffect: 1,
            groupEffects: { religious: 8, owner: 5, liberal: -5 }
          },
          {
            text: 'Reduce violence by funding housing, treatment, and youth programs first.',
            reaction: 'It plays well with reformers, though skeptics remain unconvinced.',
            momentumEffect: 4,
            trustEffect: 3,
            groupEffects: { liberal: 8, worker: 4, owner: -4 }
          }
        ]
      }
    ]
  },
  {
    id: 'primary-3',
    phase: 'primary',
    sequence: 3,
    title: 'Kitchen Table Debate',
    subtitle: 'The final debate before the first votes becomes a judgment on competence.',
    venue: 'Manchester Convention Hall',
    moderator: 'Nina Patel',
    audienceLabel: 'First-in-the-nation voters, donors, cable news panels',
    questions: [
      {
        id: 'primary-3-inflation',
        topic: 'Inflation',
        prompt: 'Families are squeezed by food and housing costs. What gets relief moving fastest?',
        choices: [
          {
            text: 'Go after price gouging, housing scarcity, and corporate concentration at once.',
            reaction: 'The base lights up as you turn a kitchen-table problem into an indictment.',
            momentumEffect: 6,
            trustEffect: 2,
            groupEffects: { worker: 8, liberal: 7, owner: -6 }
          },
          {
            text: 'Cut payroll taxes for a year and lean on the Fed to keep cooling prices.',
            reaction: 'The answer sounds financially literate and donor-friendly.',
            momentumEffect: 3,
            trustEffect: 5,
            groupEffects: { owner: 8, libertarian: 5, worker: 3 }
          },
          {
            text: 'Pair homebuilding incentives with temporary middle-class rebates.',
            reaction: 'The audience responds well to the specificity, even without fireworks.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { worker: 6, owner: 3, immigrant: 2 }
          }
        ]
      },
      {
        id: 'primary-3-debt',
        topic: 'Education',
        prompt: 'Student debt is back in the headlines. Should your party promise another major move?',
        choices: [
          {
            text: 'Cancel a substantial share of debt and make public college more affordable.',
            reaction: 'Young voters and activists drown out the grumbling from the donor pit.',
            momentumEffect: 6,
            trustEffect: 1,
            groupEffects: { liberal: 10, immigrant: 4, owner: -7 }
          },
          {
            text: 'Target relief to working families and apprentices instead of blanket forgiveness.',
            reaction: 'The line sounds disciplined and harder to caricature.',
            momentumEffect: 4,
            trustEffect: 5,
            groupEffects: { worker: 8, owner: 3, religious: 2 }
          },
          {
            text: 'Focus on lowering future costs, not rewriting past loans.',
            reaction: 'The crowd reaction is restrained, but budget hawks clearly approve.',
            momentumEffect: 2,
            trustEffect: 4,
            groupEffects: { owner: 6, libertarian: 6, liberal: -5 }
          }
        ]
      },
      {
        id: 'primary-3-energy',
        topic: 'Energy',
        prompt: 'Voters want cheaper power and climate action. Which side do you push hardest?',
        choices: [
          {
            text: 'Build clean energy fast and make fossil producers pay for the transition.',
            reaction: 'The line is bold enough to dominate the post-debate chatter.',
            momentumEffect: 6,
            trustEffect: 2,
            groupEffects: { liberal: 11, immigrant: 3, owner: -6 }
          },
          {
            text: 'Approve all energy that lowers prices, then invest in grid modernization.',
            reaction: 'The answer feels practical and resilient under crossfire.',
            momentumEffect: 4,
            trustEffect: 5,
            groupEffects: { owner: 6, worker: 5, libertarian: 3 }
          },
          {
            text: 'Back nuclear, permitting reform, and a long glide path to decarbonization.',
            reaction: 'The crowd leans in as you sound more technocratic than ideological.',
            momentumEffect: 3,
            trustEffect: 6,
            groupEffects: { owner: 5, liberal: 3, worker: 4 }
          }
        ]
      }
    ]
  },
  {
    id: 'primary-4',
    phase: 'primary',
    sequence: 4,
    title: 'Union Hall Showdown',
    subtitle: 'The field narrows and every answer is measured against electability.',
    venue: 'Detroit Labor Forum',
    moderator: 'Thomas Avery',
    audienceLabel: 'Union members, suburban volunteers, national commentators',
    questions: [
      {
        id: 'primary-4-trade',
        topic: 'Trade',
        prompt: 'A rival says your trade plan would cost jobs. How do you answer?',
        choices: [
          {
            text: 'Hit back with tariffs, domestic content rules, and strict labor standards.',
            reaction: 'The attack lands with blue-collar force and obvious edge.',
            momentumEffect: 6,
            trustEffect: 1,
            groupEffects: { worker: 10, religious: 4, owner: -7 }
          },
          {
            text: 'Say trade is fine if you pair it with worker bargaining power and tax reform.',
            reaction: 'You turn a trap into a policy lecture that mostly works.',
            momentumEffect: 4,
            trustEffect: 5,
            groupEffects: { worker: 7, owner: 4, liberal: 3 }
          },
          {
            text: 'Argue the real problem is concentration at home, not trade itself.',
            reaction: 'The answer is intellectually sharp and a little less visceral.',
            momentumEffect: 3,
            trustEffect: 5,
            groupEffects: { liberal: 6, owner: 2, worker: 4 }
          }
        ]
      },
      {
        id: 'primary-4-housing',
        topic: 'Housing',
        prompt: 'Rent is exploding in fast-growing states. What does your administration do first?',
        choices: [
          {
            text: 'Override exclusionary zoning and finance a major affordable-housing buildout.',
            reaction: 'The room wakes up immediately at the scale of the promise.',
            momentumEffect: 5,
            trustEffect: 3,
            groupEffects: { worker: 8, liberal: 6, owner: -4 }
          },
          {
            text: 'Reward cities that permit more homes and cut red tape for builders.',
            reaction: 'Donor rows and younger staffers alike seem pleased with the competence.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { owner: 7, libertarian: 5, worker: 3 }
          },
          {
            text: 'Use tax relief and vouchers to get people through the crunch quickly.',
            reaction: 'The answer sounds humane, but lighter on long-term structure.',
            momentumEffect: 3,
            trustEffect: 4,
            groupEffects: { religious: 4, worker: 5, owner: 2 }
          }
        ]
      },
      {
        id: 'primary-4-order',
        topic: 'Order',
        prompt: 'After a weekend of unrest, the moderator asks if your party has lost the middle on safety.',
        choices: [
          {
            text: 'Reject that frame and talk about accountability with serious enforcement.',
            reaction: 'The audience gives you a firm, approving murmur rather than a blast of applause.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { religious: 6, worker: 5, liberal: 2 }
          },
          {
            text: 'Center the answer on poverty, guns, and the need to de-escalate policing.',
            reaction: 'Activists respond instantly, even as skeptics stay frozen.',
            momentumEffect: 5,
            trustEffect: 2,
            groupEffects: { liberal: 9, immigrant: 4, religious: -5 }
          },
          {
            text: 'Promise federal crackdowns on illegal guns and repeat offenders.',
            reaction: 'The toughness changes the energy in the room at once.',
            momentumEffect: 5,
            trustEffect: 1,
            groupEffects: { religious: 8, owner: 4, liberal: -4 }
          }
        ]
      }
    ]
  },
  {
    id: 'primary-5',
    phase: 'primary',
    sequence: 5,
    title: 'Closing Stretch Forum',
    subtitle: 'Delegates are moving and one strong night can redefine the nomination fight.',
    venue: 'Atlanta Debate Center',
    moderator: 'Jordan Pike',
    audienceLabel: 'Delegates, supervolunteers, late-deciding primary voters',
    questions: [
      {
        id: 'primary-5-world',
        topic: 'Foreign Policy',
        prompt: 'A hostile power threatens shipping lanes. Do you project force, patience, or restraint?',
        choices: [
          {
            text: 'Project force with allies and say deterrence has to be visible.',
            reaction: 'The hall responds to the command, even from voters who wanted more domestic focus.',
            momentumEffect: 5,
            trustEffect: 4,
            groupEffects: { owner: 5, religious: 6, libertarian: -4 }
          },
          {
            text: 'Lead with sanctions, coalition pressure, and economic leverage.',
            reaction: 'The answer sounds measured and presidential rather than theatrical.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { owner: 4, liberal: 4, immigrant: 3 }
          },
          {
            text: 'Warn against another endless entanglement and keep the focus at home.',
            reaction: 'Anti-war voters erupt, while hawks look unconvinced.',
            momentumEffect: 5,
            trustEffect: 2,
            groupEffects: { libertarian: 9, worker: 5, owner: -4 }
          }
        ]
      },
      {
        id: 'primary-5-tech',
        topic: 'Technology',
        prompt: 'Big Tech is accused of crushing workers, speech, and small business at the same time. What now?',
        choices: [
          {
            text: 'Break up dominant platforms and write strict national privacy rules.',
            reaction: 'The anti-monopoly line punches through instantly.',
            momentumEffect: 6,
            trustEffect: 3,
            groupEffects: { liberal: 7, worker: 6, libertarian: -4 }
          },
          {
            text: 'Target abuses, but do not let Washington throttle innovation.',
            reaction: 'The answer sounds safe, donor-friendly, and hard to caricature.',
            momentumEffect: 3,
            trustEffect: 5,
            groupEffects: { owner: 8, libertarian: 5, worker: 2 }
          },
          {
            text: 'Treat online concentration like a labor issue and empower workers first.',
            reaction: 'The labor-heavy crowd clearly likes where you take it.',
            momentumEffect: 5,
            trustEffect: 4,
            groupEffects: { worker: 9, liberal: 4, owner: -5 }
          }
        ]
      },
      {
        id: 'primary-5-unity',
        topic: 'Party Unity',
        prompt: 'The moderator says your coalition is fracturing. Do you reassure the center or excite the base?',
        choices: [
          {
            text: 'Tell the base you will fight for them and trust turnout to follow.',
            reaction: 'The room gets louder, sharper, and more ideological all at once.',
            momentumEffect: 6,
            trustEffect: 1,
            groupEffects: { liberal: 8, worker: 5, religious: -4 }
          },
          {
            text: 'Promise competence, unity, and a coalition broad enough to govern.',
            reaction: 'The answer feels less thrilling but more presidential.',
            momentumEffect: 3,
            trustEffect: 7,
            groupEffects: { owner: 4, religious: 4, worker: 4 }
          },
          {
            text: 'Say the party needs both moral urgency and practical discipline.',
            reaction: 'You split the difference cleanly enough to calm the room.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { liberal: 4, worker: 5, religious: 3 }
          }
        ]
      }
    ]
  },
  {
    id: 'general-1',
    phase: 'general',
    sequence: 1,
    title: 'Presidential Debate I',
    subtitle: 'The first head-to-head sets the frame for the entire fall campaign.',
    venue: 'Philadelphia Constitution Hall',
    moderator: 'Alicia Monroe',
    audienceLabel: 'National audience, undecided voters, family-watch parties',
    questions: [
      {
        id: 'general-1-economy',
        topic: 'Economy',
        prompt: 'Middle-class voters want to know who will actually make life cheaper by next year.',
        choices: [
          {
            text: 'Promise aggressive relief on housing, child costs, and medical bills.',
            reaction: 'The answer hits the audience where they live and the applause shows it.',
            momentumEffect: 7,
            trustEffect: 3,
            groupEffects: { worker: 8, liberal: 5, immigrant: 3 }
          },
          {
            text: 'Make the case for disciplined growth, stable prices, and simpler taxes.',
            reaction: 'The tone is reassuring, especially to older and business-minded viewers.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { owner: 8, religious: 4, libertarian: 4 }
          },
          {
            text: 'Attack your opponent as a creature of failed elites and broken promises.',
            reaction: 'The hall crackles with energy, even if the answer is lighter on policy.',
            momentumEffect: 8,
            trustEffect: -1,
            groupEffects: { worker: 6, libertarian: 4, religious: 3 }
          }
        ]
      },
      {
        id: 'general-1-border',
        topic: 'Border',
        prompt: 'A chaotic border clip plays on the screen. The moderator asks what order looks like under you.',
        choices: [
          {
            text: 'Lead with enforcement capacity, faster adjudication, and legal migration reform.',
            reaction: 'You sound prepared enough to blunt the trap.',
            momentumEffect: 5,
            trustEffect: 6,
            groupEffects: { religious: 5, owner: 4, immigrant: 4 }
          },
          {
            text: 'Condemn fear politics and focus on labor demand and humane processing.',
            reaction: 'Supporters cheer; tougher-minded viewers seem unconvinced.',
            momentumEffect: 5,
            trustEffect: 2,
            groupEffects: { immigrant: 11, liberal: 6, religious: -5 }
          },
          {
            text: 'Call for emergency controls and make security the headline.',
            reaction: 'The answer cuts hard and dominates the room for a moment.',
            momentumEffect: 7,
            trustEffect: 0,
            groupEffects: { religious: 8, owner: 5, immigrant: -7 }
          }
        ]
      },
      {
        id: 'general-1-care',
        topic: 'Care',
        prompt: 'A parent asks why healthcare still feels unaffordable no matter who is in charge.',
        choices: [
          {
            text: 'Cap costs, expand subsidies, and challenge hospital monopolies directly.',
            reaction: 'The audience response is immediate and personal.',
            momentumEffect: 6,
            trustEffect: 5,
            groupEffects: { worker: 7, liberal: 6, owner: -4 }
          },
          {
            text: 'Protect choice but force transparent pricing and interstate competition.',
            reaction: 'It sounds practical and hard to dismiss.',
            momentumEffect: 4,
            trustEffect: 6,
            groupEffects: { owner: 7, libertarian: 5, worker: 3 }
          },
          {
            text: 'Say the problem is trust and waste, then pivot to anti-corruption.',
            reaction: 'The pivot lands rhetorically, if not as an exact answer.',
            momentumEffect: 5,
            trustEffect: 3,
            groupEffects: { religious: 4, worker: 4, owner: 2 }
          }
        ]
      }
    ]
  },
  {
    id: 'general-2',
    phase: 'general',
    sequence: 2,
    title: 'Commander in Chief Debate',
    subtitle: 'Security, disorder, and resilience dominate the second showdown.',
    venue: 'Phoenix Veterans Center',
    moderator: 'Rachel Doyle',
    audienceLabel: 'Veterans, suburban independents, crisis-focused viewers',
    questions: [
      {
        id: 'general-2-allies',
        topic: 'Alliances',
        prompt: 'An ally is under attack and Americans fear escalation. What is the line you draw?',
        choices: [
          {
            text: 'Stand shoulder to shoulder with allies and keep force ready if deterrence fails.',
            reaction: 'The answer projects command and wins a strong response.',
            momentumEffect: 6,
            trustEffect: 5,
            groupEffects: { owner: 5, religious: 7, libertarian: -4 }
          },
          {
            text: 'Use sanctions, coalition leverage, and intelligence support before any escalation.',
            reaction: 'You sound sober and disciplined under pressure.',
            momentumEffect: 4,
            trustEffect: 7,
            groupEffects: { owner: 3, immigrant: 4, liberal: 4 }
          },
          {
            text: 'Tell voters America cannot afford another foreign spiral and must hold back.',
            reaction: 'The line excites anti-war viewers and alarms hawks.',
            momentumEffect: 5,
            trustEffect: 2,
            groupEffects: { libertarian: 9, worker: 4, owner: -5 }
          }
        ]
      },
      {
        id: 'general-2-crime',
        topic: 'Crime',
        prompt: 'The moderator cites violent crime anxiety in swing suburbs. What changes under your presidency?',
        choices: [
          {
            text: 'Fund local policing, violence interruption, and mental-health response together.',
            reaction: 'The blended answer sounds like governing rather than slogan-making.',
            momentumEffect: 5,
            trustEffect: 7,
            groupEffects: { religious: 5, worker: 5, liberal: 3 }
          },
          {
            text: 'Emphasize toughness first and promise visible enforcement immediately.',
            reaction: 'The room stiffens and then breaks into applause.',
            momentumEffect: 6,
            trustEffect: 1,
            groupEffects: { religious: 8, owner: 5, liberal: -5 }
          },
          {
            text: 'Argue that economic security is the real anti-crime policy.',
            reaction: 'It resonates with some viewers, but it leaves the direct question hanging.',
            momentumEffect: 3,
            trustEffect: 3,
            groupEffects: { worker: 7, liberal: 5, religious: -2 }
          }
        ]
      },
      {
        id: 'general-2-climate',
        topic: 'Climate',
        prompt: 'A disaster season has hammered multiple states. How do you talk climate without losing pocketbook voters?',
        choices: [
          {
            text: 'Frame clean energy as resilience, manufacturing, and lower utility bills.',
            reaction: 'That synthesis lands better than the usual ideological trench lines.',
            momentumEffect: 6,
            trustEffect: 6,
            groupEffects: { worker: 6, liberal: 6, owner: 2 }
          },
          {
            text: 'Say innovation will solve the problem faster than mandates ever could.',
            reaction: 'The answer reassures skeptics and entrepreneurs alike.',
            momentumEffect: 4,
            trustEffect: 5,
            groupEffects: { owner: 8, libertarian: 6, liberal: -4 }
          },
          {
            text: 'Call the crisis moral and demand a rapid transition now.',
            reaction: 'The activist sections erupt, and everybody else takes it in carefully.',
            momentumEffect: 6,
            trustEffect: 2,
            groupEffects: { liberal: 10, immigrant: 3, religious: -4 }
          }
        ]
      }
    ]
  },
  {
    id: 'general-3',
    phase: 'general',
    sequence: 3,
    title: 'Final Presidential Debate',
    subtitle: 'The last debate is less about ideology than who looks ready to close.',
    venue: 'Cleveland Public Forum',
    moderator: 'David Parke',
    audienceLabel: 'Late deciders, high-turnout voters, closing-night audience',
    questions: [
      {
        id: 'general-3-courts',
        topic: 'Courts',
        prompt: 'The Supreme Court is central to the race. How much should voters factor that in?',
        choices: [
          {
            text: 'Tell voters the Court shapes daily life and must be central to the choice.',
            reaction: 'The urgency of the answer visibly sharpens the room.',
            momentumEffect: 6,
            trustEffect: 4,
            groupEffects: { liberal: 8, religious: 5, worker: 3 }
          },
          {
            text: 'Stress judicial restraint and say presidents should stop treating courts like war.',
            reaction: 'The answer is calm, controlled, and unexpectedly effective.',
            momentumEffect: 4,
            trustEffect: 7,
            groupEffects: { libertarian: 6, religious: 4, owner: 3 }
          },
          {
            text: 'Pivot to judges only as part of a broader fight over freedom and order.',
            reaction: 'You widen the frame and keep the room with you.',
            momentumEffect: 5,
            trustEffect: 5,
            groupEffects: { religious: 6, worker: 4, liberal: 2 }
          }
        ]
      },
      {
        id: 'general-3-democracy',
        topic: 'Democracy',
        prompt: 'The moderator asks whether trust in elections and institutions can still be rebuilt.',
        choices: [
          {
            text: 'Make rule of law and peaceful transfer a red line that no faction gets to cross.',
            reaction: 'The audience grows very quiet and then answers with a long applause.',
            momentumEffect: 5,
            trustEffect: 8,
            groupEffects: { liberal: 6, owner: 4, immigrant: 4 }
          },
          {
            text: 'Say trust returns only when institutions serve ordinary people again.',
            reaction: 'The populist framing gives the answer more emotional bite.',
            momentumEffect: 6,
            trustEffect: 4,
            groupEffects: { worker: 8, libertarian: 4, religious: 3 }
          },
          {
            text: 'Frame the problem as censorship, bureaucracy, and distant elites.',
            reaction: 'The line fires up skeptics immediately.',
            momentumEffect: 7,
            trustEffect: 0,
            groupEffects: { libertarian: 8, religious: 5, immigrant: -4 }
          }
        ]
      },
      {
        id: 'general-3-close',
        topic: 'Closing',
        prompt: 'You get one final answer. What do you want voters feeling when the stage lights go dark?',
        choices: [
          {
            text: 'Hopeful that they can trust each other and the future again.',
            reaction: 'The ending feels uplifting and surprisingly personal.',
            momentumEffect: 6,
            trustEffect: 7,
            groupEffects: { religious: 4, immigrant: 4, owner: 2, worker: 4 }
          },
          {
            text: 'Certain that you are the tougher fighter in a dangerous moment.',
            reaction: 'The room snaps to attention and stays there.',
            momentumEffect: 8,
            trustEffect: 1,
            groupEffects: { religious: 7, owner: 5, libertarian: 3 }
          },
          {
            text: 'Convinced you have the clearest plan and the discipline to execute it.',
            reaction: 'It is less emotional, but it sounds deeply ready for office.',
            momentumEffect: 5,
            trustEffect: 8,
            groupEffects: { owner: 5, worker: 4, liberal: 3 }
          }
        ]
      }
    ]
  }
];

const DEBATE_QUESTION_COUNT = 10;

const ADDITIONAL_PRIMARY_QUESTIONS: DebateQuestion[] = [
  {
    id: 'primary-extra-childcare',
    topic: 'Childcare',
    prompt: 'Parents say childcare costs now feel like a second mortgage. What does your party do first?',
    choices: [
      {
        text: 'Create a national childcare guarantee tied to wages and quality standards.',
        reaction: 'Working parents erupt while fiscal hawks tense up immediately.',
        momentumEffect: 6,
        trustEffect: 2,
        groupEffects: { worker: 10, liberal: 7, owner: -5 }
      },
      {
        text: 'Expand tax relief and let states build the system that fits them best.',
        reaction: 'The answer sounds practical and harder to caricature.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { owner: 6, worker: 5, religious: 3 }
      },
      {
        text: 'Prioritize employer partnerships and local flexibility over a federal model.',
        reaction: 'Donors approve, though activists clearly wanted more urgency.',
        momentumEffect: 3,
        trustEffect: 4,
        groupEffects: { owner: 8, libertarian: 5, worker: 2 }
      }
    ]
  },
  {
    id: 'primary-extra-veterans',
    topic: 'Veterans',
    prompt: 'Veterans in the audience say the VA still feels slow and distant. How do you answer them?',
    choices: [
      {
        text: 'Fund mental-health care, housing support, and quicker benefits decisions now.',
        reaction: 'The room responds warmly to the specificity and moral clarity.',
        momentumEffect: 5,
        trustEffect: 6,
        groupEffects: { worker: 6, religious: 5, liberal: 3 }
      },
      {
        text: 'Let veterans use private options more easily if the VA cannot deliver fast enough.',
        reaction: 'The answer sounds sharp, market-friendly, and politically safe.',
        momentumEffect: 4,
        trustEffect: 5,
        groupEffects: { owner: 6, libertarian: 6, religious: 4 }
      },
      {
        text: 'Clean out VA management first and make accountability the headline.',
        reaction: 'The toughness cuts through, even if the plan is lighter on detail.',
        momentumEffect: 5,
        trustEffect: 2,
        groupEffects: { religious: 7, owner: 3, worker: 3 }
      }
    ]
  },
  {
    id: 'primary-extra-retirement',
    topic: 'Retirement',
    prompt: 'Social Security is under pressure. Do you promise expansion, restraint, or reform?',
    choices: [
      {
        text: 'Protect and expand benefits by taxing higher incomes more aggressively.',
        reaction: 'Primary voters on the left cheer instantly.',
        momentumEffect: 5,
        trustEffect: 3,
        groupEffects: { worker: 9, liberal: 8, owner: -6 }
      },
      {
        text: 'Protect current retirees and stabilize the system with measured revenue changes.',
        reaction: 'The room hears competence rather than applause bait.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { worker: 6, religious: 4, owner: 2 }
      },
      {
        text: 'Encourage private savings and gradual retirement reform instead of new promises.',
        reaction: 'Budget hawks nod, but the audience cools noticeably.',
        momentumEffect: 2,
        trustEffect: 4,
        groupEffects: { owner: 7, libertarian: 7, worker: -4 }
      }
    ]
  },
  {
    id: 'primary-extra-china',
    topic: 'China',
    prompt: 'A moderator asks whether your party has been too soft on China. What is your lane?',
    choices: [
      {
        text: 'Confront China on trade, security, and industrial dependence all at once.',
        reaction: 'The line lands as forceful and politically useful.',
        momentumEffect: 6,
        trustEffect: 3,
        groupEffects: { worker: 7, religious: 5, owner: 2 }
      },
      {
        text: 'Compete hard at home with manufacturing, research, and allied supply chains.',
        reaction: 'You sound disciplined and less theatrical than the field.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { owner: 5, worker: 5, immigrant: 2 }
      },
      {
        text: 'Avoid chest-thumping and focus on domestic resilience instead of a new cold war.',
        reaction: 'Anti-hawk voters like it, though others want more edge.',
        momentumEffect: 3,
        trustEffect: 5,
        groupEffects: { libertarian: 8, liberal: 4, religious: -2 }
      }
    ]
  },
  {
    id: 'primary-extra-guns',
    topic: 'Guns',
    prompt: 'After another mass shooting, the moderator asks what you would sign first.',
    choices: [
      {
        text: 'Back assault-weapons restrictions, red-flag laws, and stronger background checks.',
        reaction: 'The reform answer electrifies one side of the room immediately.',
        momentumEffect: 6,
        trustEffect: 2,
        groupEffects: { liberal: 10, immigrant: 4, religious: -6 }
      },
      {
        text: 'Push red-flag laws and enforcement against traffickers, but avoid sweeping bans.',
        reaction: 'The answer feels calibrated for people who want action without maximalism.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { worker: 5, religious: 3, liberal: 4 }
      },
      {
        text: 'Center mental health, school security, and prosecuting violent offenders.',
        reaction: 'The crowd reaction is steadier and more conservative.',
        momentumEffect: 4,
        trustEffect: 4,
        groupEffects: { religious: 7, owner: 4, liberal: -4 }
      }
    ]
  },
  {
    id: 'primary-extra-rural-health',
    topic: 'Rural Health',
    prompt: 'Rural hospitals are closing across the map. What is your first intervention?',
    choices: [
      {
        text: 'Use federal stabilization money and staffing incentives to keep them open.',
        reaction: 'You connect with worried local officials right away.',
        momentumEffect: 5,
        trustEffect: 6,
        groupEffects: { worker: 7, religious: 5, liberal: 3 }
      },
      {
        text: 'Expand telehealth and cut bureaucracy so clinics can survive on their own.',
        reaction: 'The answer sounds practical, efficient, and less ideological.',
        momentumEffect: 4,
        trustEffect: 5,
        groupEffects: { owner: 5, libertarian: 5, worker: 4 }
      },
      {
        text: 'Tie support to broader regional development instead of saving every facility.',
        reaction: 'It sounds tough-minded, but some in the audience wince.',
        momentumEffect: 3,
        trustEffect: 3,
        groupEffects: { owner: 4, worker: 2, religious: -2 }
      }
    ]
  },
  {
    id: 'primary-extra-corruption',
    topic: 'Corruption',
    prompt: 'Voters say both parties look purchased. How do you prove you are different?',
    choices: [
      {
        text: 'Promise public financing, donor transparency, and a ban on congressional stock trading.',
        reaction: 'The anti-establishment mood in the room swings strongly your way.',
        momentumEffect: 6,
        trustEffect: 6,
        groupEffects: { liberal: 7, worker: 6, libertarian: 4 }
      },
      {
        text: 'Publish every meeting and donor event while keeping the current finance system intact.',
        reaction: 'The answer sounds credible without sounding revolutionary.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { owner: 4, religious: 3, worker: 3 }
      },
      {
        text: 'Argue corruption is mostly media theater and pivot to kitchen-table issues.',
        reaction: 'The dodge gets noticed, even if the pivot partly works.',
        momentumEffect: 3,
        trustEffect: 1,
        groupEffects: { worker: 4, owner: 2, liberal: -3 }
      }
    ]
  },
  {
    id: 'primary-extra-farm',
    topic: 'Agriculture',
    prompt: 'Farm-state voters ask whether you stand with small producers or global agribusiness.',
    choices: [
      {
        text: 'Break concentration, expand disaster support, and back small producers directly.',
        reaction: 'The populist edge lands well with anxious rural voters.',
        momentumEffect: 5,
        trustEffect: 4,
        groupEffects: { worker: 7, religious: 4, owner: -4 }
      },
      {
        text: 'Protect export markets while helping family farms modernize and survive.',
        reaction: 'The answer sounds governing-oriented and regionally savvy.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { owner: 6, worker: 4, religious: 3 }
      },
      {
        text: 'Say federal policy should stop distorting the market and let efficiency win.',
        reaction: 'Free-market audiences like it more than the farmers in the hall do.',
        momentumEffect: 3,
        trustEffect: 3,
        groupEffects: { libertarian: 7, owner: 5, worker: -3 }
      }
    ]
  },
  {
    id: 'primary-extra-ai-jobs',
    topic: 'Automation',
    prompt: 'Workers fear AI will wipe out good jobs before Washington reacts. What is your answer?',
    choices: [
      {
        text: 'Tie AI deployment to worker protections, retraining, and shared productivity gains.',
        reaction: 'It sounds like you actually see the labor market coming.',
        momentumEffect: 5,
        trustEffect: 6,
        groupEffects: { worker: 9, liberal: 5, owner: -3 }
      },
      {
        text: 'Lean into innovation but tax big windfalls to fund transition support.',
        reaction: 'The answer feels modern without sounding reckless.',
        momentumEffect: 4,
        trustEffect: 5,
        groupEffects: { owner: 5, worker: 5, liberal: 3 }
      },
      {
        text: 'Avoid heavy regulation and trust new industries to create better jobs over time.',
        reaction: 'The business crowd likes it more than the workers do.',
        momentumEffect: 3,
        trustEffect: 3,
        groupEffects: { owner: 8, libertarian: 6, worker: -5 }
      }
    ]
  },
  {
    id: 'primary-extra-opioids',
    topic: 'Opioids',
    prompt: 'Communities ravaged by opioids want to hear something more than slogans. What do you tell them?',
    choices: [
      {
        text: 'Treat addiction like a public-health emergency and sue the companies that fueled it.',
        reaction: 'The answer is morally sharp and broadly resonant.',
        momentumEffect: 5,
        trustEffect: 6,
        groupEffects: { worker: 7, religious: 5, liberal: 3 }
      },
      {
        text: 'Pair treatment expansion with tougher penalties on traffickers and cross-border supply.',
        reaction: 'The blended posture plays well with swing-minded viewers.',
        momentumEffect: 5,
        trustEffect: 5,
        groupEffects: { religious: 6, worker: 5, owner: 2 }
      },
      {
        text: 'Say the deeper answer is jobs, family stability, and long-term local renewal.',
        reaction: 'It sounds compassionate, though a little less immediate.',
        momentumEffect: 3,
        trustEffect: 5,
        groupEffects: { worker: 6, religious: 3, liberal: 2 }
      }
    ]
  }
];

const ADDITIONAL_GENERAL_QUESTIONS: DebateQuestion[] = [
  {
    id: 'general-extra-deficit',
    topic: 'Deficit',
    prompt: 'A moderator asks whether voters should expect spending cuts, tax hikes, or more borrowing under you.',
    choices: [
      {
        text: 'Cut waste at the top and ask the wealthy to pay more before touching benefits.',
        reaction: 'The answer is politically vivid and fiscally combative.',
        momentumEffect: 5,
        trustEffect: 4,
        groupEffects: { worker: 7, liberal: 6, owner: -4 }
      },
      {
        text: 'Promise discipline on both taxes and spending while protecting the middle class.',
        reaction: 'It sounds careful, centrist, and highly electable.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { owner: 5, religious: 4, worker: 3 }
      },
      {
        text: 'Argue growth is the answer and warn against panic over annual deficits.',
        reaction: 'The answer lands better with markets than with anxious households.',
        momentumEffect: 3,
        trustEffect: 3,
        groupEffects: { owner: 7, libertarian: 6, worker: -2 }
      }
    ]
  },
  {
    id: 'general-extra-schools',
    topic: 'Schools',
    prompt: 'Parents say schools feel like the center of the culture war. How would you lower the temperature?',
    choices: [
      {
        text: 'Fund schools better, defend student rights, and stop turning classrooms into battlegrounds.',
        reaction: 'Supporters cheer while skeptics keep watching closely.',
        momentumEffect: 5,
        trustEffect: 4,
        groupEffects: { liberal: 8, immigrant: 4, religious: -4 }
      },
      {
        text: 'Put parents, teachers, and local boards in the same room and demand clear standards.',
        reaction: 'The answer sounds sane and broadly reassuring.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { religious: 5, worker: 4, owner: 2 }
      },
      {
        text: 'Push school choice harder and let families walk away from failing systems.',
        reaction: 'The line energizes skeptics of the current system immediately.',
        momentumEffect: 5,
        trustEffect: 3,
        groupEffects: { religious: 6, owner: 5, libertarian: 5 }
      }
    ]
  },
  {
    id: 'general-extra-entitlements',
    topic: 'Entitlements',
    prompt: 'The moderator presses you on Medicare and Social Security insolvency warnings. What is your line?',
    choices: [
      {
        text: 'Refuse benefit cuts and raise revenue from those most able to pay.',
        reaction: 'The defense of the safety net hits emotionally and politically.',
        momentumEffect: 5,
        trustEffect: 5,
        groupEffects: { worker: 8, liberal: 6, owner: -5 }
      },
      {
        text: 'Protect current retirees and negotiate a long-run fix before the math gets worse.',
        reaction: 'The answer sounds sober enough for undecided voters.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { worker: 5, religious: 4, owner: 3 }
      },
      {
        text: 'Warn that Washington has overpromised and voters deserve the truth now.',
        reaction: 'The directness is striking, though it chills the room a bit.',
        momentumEffect: 3,
        trustEffect: 3,
        groupEffects: { libertarian: 7, owner: 5, worker: -5 }
      }
    ]
  },
  {
    id: 'general-extra-disaster',
    topic: 'Disaster Response',
    prompt: 'Wildfires and storms have hit several states. What does competent national response look like under you?',
    choices: [
      {
        text: 'Build a larger federal surge capacity and invest in resilience before disaster hits.',
        reaction: 'The answer feels practical, urgent, and presidential.',
        momentumEffect: 5,
        trustEffect: 7,
        groupEffects: { worker: 5, liberal: 5, religious: 3 }
      },
      {
        text: 'Give states more flexibility and cut the red tape that slows local response.',
        reaction: 'The decentralizing argument lands better than expected.',
        momentumEffect: 4,
        trustEffect: 5,
        groupEffects: { owner: 5, libertarian: 6, religious: 3 }
      },
      {
        text: 'Frame the issue mainly as climate adaptation and force polluters to pay.',
        reaction: 'The base lights up, while some swing voters keep their distance.',
        momentumEffect: 5,
        trustEffect: 3,
        groupEffects: { liberal: 9, immigrant: 3, owner: -4 }
      }
    ]
  },
  {
    id: 'general-extra-aid',
    topic: 'Foreign Aid',
    prompt: 'Voters ask why America sends money overseas when problems at home still pile up.',
    choices: [
      {
        text: 'Defend aid that prevents larger wars and protects American interests abroad.',
        reaction: 'You sound authoritative, if not universally popular.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { owner: 4, religious: 5, immigrant: 3 }
      },
      {
        text: 'Support aid only when it is tightly linked to accountability and burden-sharing.',
        reaction: 'The room hears discipline instead of reflexive idealism.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { owner: 5, worker: 3, religious: 4 }
      },
      {
        text: 'Say the money should stay home and America has done enough already.',
        reaction: 'The populist hit is loud and immediate.',
        momentumEffect: 6,
        trustEffect: 1,
        groupEffects: { libertarian: 8, worker: 4, immigrant: -3 }
      }
    ]
  },
  {
    id: 'general-extra-judiciary',
    topic: 'Judiciary',
    prompt: 'The moderator asks whether the federal judiciary has become too political. What would you change?',
    choices: [
      {
        text: 'Back stronger ethics rules and structural reforms for a court losing public legitimacy.',
        reaction: 'The reform frame energizes one side of the electorate instantly.',
        momentumEffect: 5,
        trustEffect: 4,
        groupEffects: { liberal: 8, worker: 3, religious: -4 }
      },
      {
        text: 'Focus on ethics, transparency, and calmer appointments instead of a structural fight.',
        reaction: 'That narrower answer sounds more broadly governable.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { owner: 3, religious: 4, liberal: 3 }
      },
      {
        text: 'Defend judicial independence and say politicians should stop threatening the courts.',
        reaction: 'The constitutional language gives the answer extra weight.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { libertarian: 6, owner: 4, religious: 3 }
      }
    ]
  },
  {
    id: 'general-extra-housing',
    topic: 'Housing',
    prompt: 'Young families ask why the dream of owning a home keeps moving farther away. What would you do?',
    choices: [
      {
        text: 'Finance a major housing buildout and break local barriers to supply.',
        reaction: 'The scale of the answer catches the audience attention fast.',
        momentumEffect: 5,
        trustEffect: 5,
        groupEffects: { worker: 8, liberal: 5, owner: -3 }
      },
      {
        text: 'Reward faster building, modernize permits, and expand first-time buyer relief.',
        reaction: 'The answer feels businesslike and electorally smart.',
        momentumEffect: 4,
        trustEffect: 7,
        groupEffects: { owner: 6, worker: 4, libertarian: 3 }
      },
      {
        text: 'Keep Washington out of local housing markets and focus on inflation broadly.',
        reaction: 'It sounds disciplined, but less satisfying to squeezed renters.',
        momentumEffect: 3,
        trustEffect: 4,
        groupEffects: { owner: 5, libertarian: 6, worker: -3 }
      }
    ]
  },
  {
    id: 'general-extra-democracy',
    topic: 'Democracy',
    prompt: 'The moderator asks whether the country can still trust the peaceful transfer of power.',
    choices: [
      {
        text: 'Say democracy is fragile and leaders must defend rules even when they lose.',
        reaction: 'The line lands with moral seriousness and visible force.',
        momentumEffect: 5,
        trustEffect: 7,
        groupEffects: { liberal: 7, immigrant: 5, religious: 2 }
      },
      {
        text: 'Stress confidence in local election workers and reject apocalyptic rhetoric from both sides.',
        reaction: 'The answer sounds stabilizing and broadly reassuring.',
        momentumEffect: 4,
        trustEffect: 6,
        groupEffects: { owner: 3, religious: 4, worker: 3 }
      },
      {
        text: 'Say trust returns only when institutions stop dismissing voter anger.',
        reaction: 'The populist turn charges the room in a different direction.',
        momentumEffect: 5,
        trustEffect: 2,
        groupEffects: { worker: 5, libertarian: 5, liberal: -2 }
      }
    ]
  },
  {
    id: 'general-extra-energy',
    topic: 'Energy',
    prompt: 'Gas prices jump again a month before Election Day. What is your message to voters?',
    choices: [
      {
        text: 'Accelerate clean domestic power and stop letting volatile fuel markets control family budgets.',
        reaction: 'The answer sounds future-focused and economically sharper than usual.',
        momentumEffect: 5,
        trustEffect: 5,
        groupEffects: { liberal: 7, worker: 4, owner: 1 }
      },
      {
        text: 'Open more supply now and pair it with grid upgrades and permitting reform.',
        reaction: 'The blended approach lands well with practical voters.',
        momentumEffect: 5,
        trustEffect: 6,
        groupEffects: { owner: 6, worker: 5, religious: 3 }
      },
      {
        text: 'Blame failed elites and promise immediate energy abundance.',
        reaction: 'It is punchy, memorable, and lighter on detail.',
        momentumEffect: 6,
        trustEffect: 1,
        groupEffects: { religious: 5, owner: 4, libertarian: 4 }
      }
    ]
  },
  {
    id: 'general-extra-border-labor',
    topic: 'Border Labor',
    prompt: 'Business leaders say they need workers while communities say the border feels overwhelmed. How do you square that?',
    choices: [
      {
        text: 'Expand legal work pathways while restoring order with more judges and processing capacity.',
        reaction: 'The answer is balanced enough to quiet the room for a beat.',
        momentumEffect: 5,
        trustEffect: 7,
        groupEffects: { owner: 5, immigrant: 6, religious: 3 }
      },
      {
        text: 'Lead with security first and insist labor reform can only come after control is restored.',
        reaction: 'The law-and-order emphasis gets a stronger pop from the crowd.',
        momentumEffect: 6,
        trustEffect: 3,
        groupEffects: { religious: 7, owner: 4, immigrant: -5 }
      },
      {
        text: 'Say economic demand makes zero-sum border politics dishonest and self-defeating.',
        reaction: 'Some voters admire the candor, while others bristle.',
        momentumEffect: 4,
        trustEffect: 4,
        groupEffects: { immigrant: 8, liberal: 5, religious: -3 }
      }
    ]
  }
];

function cloneQuestions(questions: DebateQuestion[]): DebateQuestion[] {
  return questions.map((question) => ({
    ...question,
    choices: question.choices.map((choice) => ({
      ...choice,
      groupEffects: { ...choice.groupEffects }
    }))
  }));
}

function getQuestionPool(phase: DebatePhase): DebateQuestion[] {
  const templateQuestions = DEBATE_LIBRARY
    .filter((debate) => debate.phase === phase)
    .flatMap((debate) => debate.questions);
  const additionalQuestions = phase === 'primary'
    ? ADDITIONAL_PRIMARY_QUESTIONS
    : ADDITIONAL_GENERAL_QUESTIONS;

  return [...templateQuestions, ...additionalQuestions];
}

function buildDebateQuestions(template: DebateTemplate): DebateQuestion[] {
  const baseQuestionIds = new Set(template.questions.map((question) => question.id));
  const additionalPool = getQuestionPool(template.phase).filter((question) => !baseQuestionIds.has(question.id));
  const rotationOffset = additionalPool.length === 0
    ? 0
    : ((template.sequence - 1) * 6 + template.id.length) % additionalPool.length;
  const rotatedPool = additionalPool.length === 0
    ? []
    : [...additionalPool.slice(rotationOffset), ...additionalPool.slice(0, rotationOffset)];

  return cloneQuestions([...template.questions, ...rotatedPool].slice(0, DEBATE_QUESTION_COUNT));
}

function buildPrimaryParticipants(playerName: string, rivalNames: string[]): DebateParticipant[] {
  const taglines = [
    'Your campaign',
    'Establishment favorite',
    'Grassroots challenger',
    'Media disruptor',
    'Regional power broker'
  ];
  const names = [playerName, ...rivalNames.slice(0, 4)];

  return names.map((name, index) => ({
    name,
    role: index === 0 ? 'player' : 'rival',
    tagline: taglines[index] ?? 'Debate stage'
  }));
}

function buildGeneralParticipants(playerName: string, rivalNames: string[]): DebateParticipant[] {
  return [
    { name: playerName, role: 'player', tagline: 'Your ticket' },
    { name: rivalNames[0] ?? 'Opposition Nominee', role: 'rival', tagline: 'Opposition ticket' }
  ];
}

export function getDebateScheduleForWeek(week: number): DebateScheduleEntry | null {
  return DEBATE_SCHEDULE.find((entry) => entry.week === week) ?? null;
}

export function createActiveDebate(
  entry: DebateScheduleEntry,
  playerName: string,
  rivalNames: string[]
): ActiveDebate {
  const template = DEBATE_LIBRARY.find((debate) => debate.id === entry.debateId);

  if (!template) {
    throw new Error(`Missing debate template for ${entry.debateId}`);
  }

  return {
    ...template,
    week: entry.week,
    questions: buildDebateQuestions(template),
    participants: entry.phase === 'primary'
      ? buildPrimaryParticipants(playerName, rivalNames)
      : buildGeneralParticipants(playerName, rivalNames),
    currentQuestionIndex: 0,
    selectedChoiceIndex: null,
    latestReaction: null
  };
}

export function mergeDebateStanding(
  currentStanding: DebateStanding,
  groupEffects: Partial<PlayerDemographics>
): DebateStanding {
  const nextStanding = { ...currentStanding };

  for (const group of DEBATE_GROUPS) {
    const delta = groupEffects[group] ?? 0;
    nextStanding[group] = Math.max(-MAX_DEBATE_SHIFT, Math.min(MAX_DEBATE_SHIFT, nextStanding[group] + delta));
  }

  return nextStanding;
}

export function applyDebateStanding(
  ideology: PlayerDemographics,
  standing: DebateStanding
): PlayerDemographics {
  const adjusted = { ...ideology };

  for (const group of DEBATE_GROUPS) {
    adjusted[group] = Math.max(0, Math.min(100, adjusted[group] + standing[group]));
  }

  return adjusted;
}
