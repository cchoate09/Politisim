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

function cloneQuestions(questions: DebateQuestion[]): DebateQuestion[] {
  return questions.map((question) => ({
    ...question,
    choices: question.choices.map((choice) => ({
      ...choice,
      groupEffects: { ...choice.groupEffects }
    }))
  }));
}

function buildPrimaryParticipants(playerName: string, rivalNames: string[]): DebateParticipant[] {
  const taglines = [
    'Your campaign',
    'Establishment favorite',
    'Grassroots challenger',
    'Media disruptor'
  ];
  const names = [playerName, ...rivalNames.slice(0, 3)];

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
    questions: cloneQuestions(template.questions),
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
