import { create } from 'zustand';
import type { PlayerDemographics } from '../core/ElectionMath';
import type { StateElectionData, CampaignSpendingData } from '../core/CampaignDataParser';
import { CampaignDataParser, type CalendarWeek } from '../core/CampaignDataParser';
import {
  applyDebateStanding,
  createActiveDebate,
  EMPTY_DEBATE_STANDING,
  getDebateScheduleForWeek,
  mergeDebateStanding,
  type ActiveDebate,
  type DebatePhase,
  type DebateStanding
} from '../core/DebateData';
import {
  advanceElectionNightRound,
  createElectionNight,
  finalizeElectionNight as finalizeElectionNightState,
  type ActiveElectionNight
} from '../core/ElectionNight';
import {
  createConvention,
  getConventionRound,
  type ActiveConvention
} from '../core/ConventionData';
import {
  SimulationEngine,
  type PollingData,
  type PrimaryFieldShare,
  type PrimaryStateProjection,
  type RivalAI
} from '../core/SimulationEngine';
import {
  applyAICourtshipPressure,
  applyPlayerCourtship,
  createEndorsementRoster,
  evaluateEndorsement,
  getCandidateEndorsementSummary,
  getCandidateStateEndorsementEffect,
  reopenDormantEndorsements,
  resolveWeeklyEndorsements,
  type ActiveEndorsement,
  type CandidateEndorsementSnapshot
} from '../core/EndorsementData';
import {
  allocatePrimaryDelegatesForState
} from '../core/PrimaryRules';
import {
  applyWeeklyFieldOperationDecay,
  buildPlayerSurrogateRoster,
  createInitialFieldOperations,
  getAssignedStateForSurrogate,
  getFieldNetworkSummary,
  getFieldOfficeBuildCost,
  getFieldOperationEffect,
  getOfficeCapacity,
  getSurrogatePower,
  getTotalOfficeUpkeep,
  getVolunteerDeployCost,
  getVolunteerRecruitmentGain,
  getVolunteerWithdrawalReturn,
  normalizeFieldOperations,
  type StateFieldOperation,
  type SurrogateProfile
} from '../core/FieldOperations';

// ─── EVENT DEFINITIONS ────────────────────────────────────────────────
export interface CampaignEvent {
  title: string;
  description: string;
  phase?: 'primary' | 'general' | 'any';
  choices: {
    text: string;
    moneyEffect: number;
    momentumEffect: number;
    trustEffect: number;
  }[];
}

const POSSIBLE_EVENTS: CampaignEvent[] = [
  // ── Scandals ──
  {
    title: "Leaked Audio Recording",
    description: "An old microphone caught you making a disparaging remark about a key demographic. The press is demanding a response.",
    phase: 'any',
    choices: [
      { text: "Apologize profusely", moneyEffect: 0, momentumEffect: -10, trustEffect: 5 },
      { text: "Quadruple down", moneyEffect: 50000, momentumEffect: 15, trustEffect: -15 },
      { text: "Blame the media", moneyEffect: 10000, momentumEffect: 0, trustEffect: -5 }
    ]
  },
  {
    title: "Opposing Research Dump",
    description: "A rival SuperPAC has published a 200-page dossier of your candidate's past voting record. Twitter is having a field day.",
    phase: 'any',
    choices: [
      { text: "Release a detailed rebuttal ad ($80K)", moneyEffect: -80000, momentumEffect: 5, trustEffect: 10 },
      { text: "Ignore it and stay on message", moneyEffect: 0, momentumEffect: -8, trustEffect: 0 },
      { text: "Counter-attack with your own oppo file", moneyEffect: -40000, momentumEffect: 10, trustEffect: -10 }
    ]
  },
  {
    title: "Social Media Gaffe",
    description: "Your campaign manager accidentally tweeted a meme from the wrong account. It's going viral for all the wrong reasons.",
    phase: 'any',
    choices: [
      { text: "Fire the manager publicly (+trust)", moneyEffect: 0, momentumEffect: -5, trustEffect: 8 },
      { text: "Lean into the meme (risky)", moneyEffect: 0, momentumEffect: 18, trustEffect: -8 },
      { text: "Issue a quiet correction", moneyEffect: 0, momentumEffect: -3, trustEffect: 2 }
    ]
  },
  // ── Debates ──
  {
    title: "Debate Highlight",
    description: "Your candidate delivered a crushing blow during the latest televised debate. The crowd roared.",
    phase: 'any',
    choices: [
      { text: "Run ads featuring the clip ($100K)", moneyEffect: -100000, momentumEffect: 20, trustEffect: 0 },
      { text: "Let it go viral organically", moneyEffect: 0, momentumEffect: 8, trustEffect: 0 }
    ]
  },
  {
    title: "Debate Stumble",
    description: "You froze on a question about foreign policy. The moment is being replayed on every news network.",
    phase: 'any',
    choices: [
      { text: "Do a late-night show appearance to recover", moneyEffect: -30000, momentumEffect: 5, trustEffect: 5 },
      { text: "Pivot to domestic policy messaging", moneyEffect: -20000, momentumEffect: -2, trustEffect: 3 },
      { text: "Attack the moderator's bias", moneyEffect: 0, momentumEffect: 3, trustEffect: -8 }
    ]
  },
  // ── Endorsements ──
  {
    title: "Major Union Endorsement",
    description: "The AFL-CIO is considering endorsing your campaign. They want a commitment to raise the minimum wage.",
    phase: 'primary',
    choices: [
      { text: "Accept — commit to $20/hr minimum", moneyEffect: 100000, momentumEffect: 10, trustEffect: 5 },
      { text: "Decline — keep your options open", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  {
    title: "Celebrity Endorsement",
    description: "A massively popular pop star wants to endorse you at their concert tonight.",
    phase: 'any',
    choices: [
      { text: "Accept — appear on stage", moneyEffect: 0, momentumEffect: 15, trustEffect: -3 },
      { text: "Politely decline", moneyEffect: 0, momentumEffect: 0, trustEffect: 3 }
    ]
  },
  {
    title: "Former President's Endorsement",
    description: "A former commander-in-chief has offered to stump for you, but they're a polarizing figure.",
    phase: 'general',
    choices: [
      { text: "Accept — massive base energizer", moneyEffect: 200000, momentumEffect: 15, trustEffect: -10 },
      { text: "Decline — chart your own path", moneyEffect: 0, momentumEffect: 0, trustEffect: 5 }
    ]
  },
  // ── Financial ──
  {
    title: "Major Donor Dinner",
    description: "A tech billionaire has invited you to a private dinner in Silicon Valley. The check could be enormous.",
    phase: 'any',
    choices: [
      { text: "Attend the dinner", moneyEffect: 300000, momentumEffect: 0, trustEffect: -12 },
      { text: "Decline publicly", moneyEffect: 0, momentumEffect: 8, trustEffect: 8 }
    ]
  },
  {
    title: "Campaign Staff Dispute",
    description: "Your senior advisors are feuding publicly. The press smells blood in the water.",
    phase: 'any',
    choices: [
      { text: "Mediate behind closed doors", moneyEffect: 0, momentumEffect: -5, trustEffect: 3 },
      { text: "Fire both and hire fresh talent ($120K)", moneyEffect: -120000, momentumEffect: 5, trustEffect: 5 },
      { text: "Ignore it — stay focused on voters", moneyEffect: 0, momentumEffect: -8, trustEffect: -3 }
    ]
  },
  // ── Policy / Crisis ──
  {
    title: "Natural Disaster Response",
    description: "A devastating hurricane has hit the Gulf Coast. Millions of eyes are on how candidates respond.",
    phase: 'any',
    choices: [
      { text: "Fly in and help in person ($150K)", moneyEffect: -150000, momentumEffect: 18, trustEffect: 12 },
      { text: "Donate campaign funds ($200K)", moneyEffect: -200000, momentumEffect: 8, trustEffect: 10 },
      { text: "Issue a statement of solidarity", moneyEffect: 0, momentumEffect: 2, trustEffect: 2 }
    ]
  },
  {
    title: "Economic Crisis",
    description: "The stock market just dropped 800 points. Voters on both sides are demanding answers.",
    phase: 'any',
    choices: [
      { text: "Propose a bold stimulus package", moneyEffect: 0, momentumEffect: 10, trustEffect: 5 },
      { text: "Blame the incumbent administration", moneyEffect: 0, momentumEffect: 8, trustEffect: -5 },
      { text: "Call for bipartisan cooperation", moneyEffect: 0, momentumEffect: 3, trustEffect: 8 }
    ]
  },
  {
    title: "Immigration Showdown",
    description: "A caravan of migrants has arrived at the southern border. Your position will define your campaign for weeks.",
    phase: 'any',
    choices: [
      { text: "Push for comprehensive reform", moneyEffect: 0, momentumEffect: 5, trustEffect: 5 },
      { text: "Call for strict border enforcement", moneyEffect: 0, momentumEffect: 8, trustEffect: -5 },
      { text: "Visit the border personally ($50K)", moneyEffect: -50000, momentumEffect: 12, trustEffect: 3 }
    ]
  },
  // ── Media ──
  {
    title: "Viral Town Hall Moment",
    description: "A struggling veteran asked about healthcare. Your answer made the audience tear up. The clip has 40 million views.",
    phase: 'any',
    choices: [
      { text: "Amplify with a follow-up ad ($60K)", moneyEffect: -60000, momentumEffect: 18, trustEffect: 5 },
      { text: "Let it speak for itself", moneyEffect: 0, momentumEffect: 10, trustEffect: 3 }
    ]
  },
  {
    title: "Hostile Interview",
    description: "A major cable news anchor grilled you for 20 minutes. The internet is split on who won.",
    phase: 'any',
    choices: [
      { text: "Post the full unedited clip", moneyEffect: 0, momentumEffect: 5, trustEffect: 5 },
      { text: "Rage-tweet about media bias", moneyEffect: 0, momentumEffect: 10, trustEffect: -10 },
      { text: "Move on to the next news cycle", moneyEffect: 0, momentumEffect: 0, trustEffect: 0 }
    ]
  },
  // ── October Surprises ──
  {
    title: "October Surprise: FBI Investigation",
    description: "The FBI has opened an investigation into your campaign's financial records. This could be devastating or amount to nothing.",
    phase: 'general',
    choices: [
      { text: "Full cooperation — release all records", moneyEffect: -50000, momentumEffect: -10, trustEffect: 15 },
      { text: "Call it a political witch hunt", moneyEffect: 0, momentumEffect: 5, trustEffect: -15 },
      { text: "Quietly hire the best lawyers ($200K)", moneyEffect: -200000, momentumEffect: 0, trustEffect: 0 }
    ]
  },
  {
    title: "Rival Drops Out",
    description: "One of the minor candidates has suspended their campaign and endorsed your rival.",
    phase: 'primary',
    choices: [
      { text: "Court their supporters with targeted ads ($100K)", moneyEffect: -100000, momentumEffect: 8, trustEffect: 0 },
      { text: "Stay the course", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  // ── VP / Running Mate ──
  {
    title: "Running Mate Scandal",
    description: "Your VP pick's college thesis has surfaced — and it's controversial. Pundits are having a meltdown.",
    phase: 'general',
    choices: [
      { text: "Stand by your pick publicly", moneyEffect: 0, momentumEffect: -5, trustEffect: 8 },
      { text: "Distance yourself carefully", moneyEffect: 0, momentumEffect: -3, trustEffect: -3 },
      { text: "Replace them entirely ($300K logistics)", moneyEffect: -300000, momentumEffect: -15, trustEffect: 5 }
    ]
  },
  // ── Grassroots ──
  {
    title: "Grassroots Viral Moment",
    description: "A supporter's handmade sign went viral. Small-dollar donations are flooding in overnight.",
    phase: 'any',
    choices: [
      { text: "Ride the wave — launch emergency fundraiser", moneyEffect: 200000, momentumEffect: 10, trustEffect: 5 },
      { text: "Acknowledge but stay humble", moneyEffect: 50000, momentumEffect: 5, trustEffect: 8 }
    ]
  },
  {
    title: "Disinformation Attack",
    description: "A deepfake video of your candidate is spreading across social media. It looks extremely convincing.",
    phase: 'any',
    choices: [
      { text: "Hire a cybersecurity firm ($100K)", moneyEffect: -100000, momentumEffect: 0, trustEffect: 10 },
      { text: "Address it head-on in a press conference", moneyEffect: -20000, momentumEffect: 5, trustEffect: 5 },
      { text: "Ignore it — don't give it oxygen", moneyEffect: 0, momentumEffect: -10, trustEffect: -5 }
    ]
  },
  {
    title: "Supreme Court Vacancy",
    description: "A seat has opened on the high court just weeks before the election. Your base expects a fighter.",
    phase: 'general',
    choices: [
      { text: "Promise a staunch literalist", moneyEffect: 80000, momentumEffect: 12, trustEffect: -8 },
      { text: "Promise a pragmatic moderate", moneyEffect: 0, momentumEffect: 5, trustEffect: 10 },
      { text: "Avoid the topic entirely", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  {
    title: "Healthcare Breakthrough",
    description: "A major pharma company announces a cure for a rare disease, but the treatment costs $2M per patient.",
    phase: 'any',
    choices: [
      { text: "Call for price controls", moneyEffect: 0, momentumEffect: 15, trustEffect: 5 },
      { text: "Protect medical innovation", moneyEffect: 150000, momentumEffect: -5, trustEffect: -5 },
      { text: "Propose a government subsidy", moneyEffect: 0, momentumEffect: 8, trustEffect: 8 }
    ]
  },
  {
    title: "Tech CEO Endorsement",
    description: "The CEO of the world's largest social network wants to host a 'fireside chat' with you.",
    phase: 'any',
    choices: [
      { text: "Accept — embrace the future", moneyEffect: 250000, momentumEffect: 10, trustEffect: -15 },
      { text: "Decline — cite privacy concerns", moneyEffect: 0, momentumEffect: 5, trustEffect: 15 }
    ]
  },
  {
    title: "Global Supply Chain Crisis",
    description: "A major shipping lane is blocked, causing prices to spike. Voters are feeling it at the checkout.",
    phase: 'any',
    choices: [
      { text: "Blame foreign competitors", moneyEffect: 0, momentumEffect: 8, trustEffect: -5 },
      { text: "Propose domestic production taskforce", moneyEffect: 0, momentumEffect: 12, trustEffect: 10 },
      { text: "Call for patience and unity", moneyEffect: 0, momentumEffect: 2, trustEffect: 5 }
    ]
  },
  {
    title: "Uncovered Tax Audit",
    description: "Documents leaked showing you've been under audit for three years. The numbers don't look great.",
    phase: 'any',
    choices: [
      { text: "Release full tax returns (+trust)", moneyEffect: -50000, momentumEffect: -10, trustEffect: 25 },
      { text: "Fight the IRS in public", moneyEffect: 0, momentumEffect: 15, trustEffect: -20 },
      { text: "Say it's a private matter", moneyEffect: 0, momentumEffect: -15, trustEffect: 0 }
    ]
  },
  {
    title: "National Park Encroachment",
    description: "A mining company wants to drill near Yellowstone. Environmentalists are up in arms.",
    phase: 'any',
    choices: [
      { text: "Block the permits (+environment)", moneyEffect: 0, momentumEffect: 10, trustEffect: 10 },
      { text: "Approve for 'energy independence'", moneyEffect: 180000, momentumEffect: 5, trustEffect: -12 },
      { text: "Commission a 2-year study", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  {
    title: "Labor Strike at Giant Warehouse",
    description: "Thousands of workers at 'Global-Logistics' have walked out. They want your presence on the picket line.",
    phase: 'any',
    choices: [
      { text: "Join the line and hold a sign", moneyEffect: -50000, momentumEffect: 20, trustEffect: 15 },
      { text: "Issue a statement supporting 'negotiation'", moneyEffect: 50000, momentumEffect: 5, trustEffect: 0 },
      { text: "Condemn the disruption", moneyEffect: 100000, momentumEffect: -10, trustEffect: -10 }
    ]
  },
  {
    title: "Historic Peace Treaty",
    description: "The current administration brokered a peace deal in a long-standing conflict. How do you respond?",
    phase: 'general',
    choices: [
      { text: "Give them full credit (Bipartisan)", moneyEffect: 0, momentumEffect: 5, trustEffect: 18 },
      { text: "Criticize the deal's fine print", moneyEffect: 0, momentumEffect: 8, trustEffect: -10 },
      { text: "Pivot to domestic failures", moneyEffect: 0, momentumEffect: 3, trustEffect: 2 }
    ]
  },
  {
    title: "Crypto Market Crash",
    description: "A major exchange collapsed. Millions of young voters just lost their savings.",
    phase: 'any',
    choices: [
      { text: "Demand aggressive regulation", moneyEffect: 0, momentumEffect: 12, trustEffect: 5 },
      { text: "Call it a 'learning moment' for investors", moneyEffect: 80000, momentumEffect: -8, trustEffect: -5 },
      { text: "Bail out small-scale investors", moneyEffect: -200000, momentumEffect: 18, trustEffect: 10 }
    ]
  },
  {
    title: "Infrastructure Bill Gridlock",
    description: "A major bridge in a swing state just started crumbling. Congress is stuck on funding.",
    phase: 'any',
    choices: [
      { text: "Hold a rally at the bridge ($40K)", moneyEffect: -40000, momentumEffect: 15, trustEffect: 8 },
      { text: "Release a 10-point 'New Deal' plan", moneyEffect: 0, momentumEffect: 10, trustEffect: 5 },
      { text: "Blame 'career politicians'", moneyEffect: 0, momentumEffect: 8, trustEffect: -3 }
    ]
  },
  {
    title: "Leaked Donor List",
    description: "An anonymous hack has exposed your top 100 private donors. The optics are terrible.",
    phase: 'any',
    choices: [
      { text: "Release full audit (-$100K)", moneyEffect: -100000, momentumEffect: -5, trustEffect: 15 },
      { text: "Freeze all PAC activity", moneyEffect: 0, momentumEffect: -15, trustEffect: 5 },
      { text: "Counter-sue the leakers", moneyEffect: -50000, momentumEffect: 5, trustEffect: -10 }
    ]
  },
  {
    title: "Voter Data Breach",
    description: "Your campaign's mobile app was breached. 50,000 voter emails were sold on the dark web.",
    phase: 'any',
    choices: [
      { text: "Pay for identity protection ($200K)", moneyEffect: -200000, momentumEffect: 0, trustEffect: 12 },
      { text: "Hire cybersecurity firm ($120K)", moneyEffect: -120000, momentumEffect: 5, trustEffect: 5 },
      { text: "Issue quiet advisory", moneyEffect: 0, momentumEffect: -20, trustEffect: -10 }
    ]
  },
  {
    title: "Internal Infighting",
    description: "Your policy director and communications chief had a shouting match caught on video.",
    phase: 'any',
    choices: [
      { text: "Fire them both ($80K)", moneyEffect: -80000, momentumEffect: 5, trustEffect: 5 },
      { text: "Force a public apology", moneyEffect: 0, momentumEffect: -10, trustEffect: 3 },
      { text: "Minimize the damage", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  {
    title: "Campaign Plane Grounded",
    description: "Mechanical issues have forced you to cancel three major rallies on the West Coast.",
    phase: 'any',
    choices: [
      { text: "Charter private jets ($150K)", moneyEffect: -150000, momentumEffect: 10, trustEffect: 0 },
      { text: "Switch to virtual town halls", moneyEffect: 0, momentumEffect: -10, trustEffect: 5 },
      { text: "Apologize and reschedule", moneyEffect: 0, momentumEffect: -15, trustEffect: 2 }
    ]
  },
  {
    title: "Supreme Court Gaffe",
    description: "You misnamed a sitting Justice during a live interview. The law community is mocking you.",
    phase: 'any',
    choices: [
      { text: "Correct the record quickly", moneyEffect: -10000, momentumEffect: -2, trustEffect: 2 },
      { text: "Blame exhaustion", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 },
      { text: "Attack 'activist judges' instead", moneyEffect: 0, momentumEffect: 10, trustEffect: -10 }
    ]
  },
  {
    title: "Shadowy PAC Ad",
    description: "A dark-money group has launched a coordinated ad blitz in 5 swing states. Polling is dipping.",
    phase: 'general',
    choices: [
      { text: "Launch counter-blitz ($250K)", moneyEffect: -250000, momentumEffect: 5, trustEffect: 0 },
      { text: "Report to FEC (Bureaucracy)", moneyEffect: 0, momentumEffect: -5, trustEffect: 10 },
      { text: "Ignore and stay positive", moneyEffect: 0, momentumEffect: -8, trustEffect: 5 }
    ]
  },
  {
    title: "Old Tax Records Surface",
    description: "A local newspaper found your property tax filings from 1998. You undervalued a penthouse.",
    phase: 'any',
    choices: [
      { text: "Pay the back taxes ($90K)", moneyEffect: -90000, momentumEffect: -3, trustEffect: 12 },
      { text: "Fight the city in court", moneyEffect: -30000, momentumEffect: 2, trustEffect: -8 },
      { text: "Say it's a 'clerical error'", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  {
    title: "Social Media Shadowban",
    description: "A major platform has flagged your campaign account for 'misleading content'. Reach is plummeting.",
    phase: 'any',
    choices: [
      { text: "Call for congressional hearings", moneyEffect: 0, momentumEffect: 15, trustEffect: -12 },
      { text: "Pivot to email/SMS drive ($50K)", moneyEffect: -50000, momentumEffect: 5, trustEffect: 5 },
      { text: "Apologize and delete post", moneyEffect: 0, momentumEffect: -10, trustEffect: 5 }
    ]
  },
  {
    title: "Hostile Takeover Rumor",
    description: "Rumors fly that your top aide is defecting to the rival camp.",
    phase: 'any',
    choices: [
      { text: "Promote them with a raise ($100K)", moneyEffect: -100000, momentumEffect: 3, trustEffect: 5 },
      { text: "Fire them immediately", moneyEffect: 0, momentumEffect: -10, trustEffect: -5 },
      { text: "Wait for the dust to settle", moneyEffect: 0, momentumEffect: -5, trustEffect: 0 }
    ]
  },
  // ── New Disruptive Events (Phase 4) ──
  {
    title: "Supply Chain Chaos",
    description: "A strike at a major shipping port has delayed all your campaign signs and mailers. Volunteers are idle.",
    phase: 'any',
    choices: [
      { text: "Pay for rush air-freight ($150K)", moneyEffect: -150000, momentumEffect: 0, trustEffect: 2 },
      { text: "Cancel the mailer wave", moneyEffect: 0, momentumEffect: -12, trustEffect: 0 },
      { text: "Blame the strike leaders", moneyEffect: 0, momentumEffect: 5, trustEffect: -10 }
    ]
  },
  {
    title: "AI Deepfake Sabotage",
    description: "An AI-generated video of you making a bizarre claim is spreading like wildfire on social media.",
    phase: 'any',
    choices: [
      { text: "Release a 'Humanity First' debunking ad ($80K)", moneyEffect: -80000, momentumEffect: 5, trustEffect: 12 },
      { text: "Report it and wait for platforms to act", moneyEffect: 0, momentumEffect: -15, trustEffect: 0 },
      { text: "Make a joke about your 'evil twin'", moneyEffect: 0, momentumEffect: 8, trustEffect: -5 }
    ]
  },
  {
    title: "Local Fundraiser Scandal",
    description: "A host of one of your local fundraisers has been arrested for a major financial crime. The optics are terrible.",
    phase: 'any',
    choices: [
      { text: "Return all donations from that event ($200K)", moneyEffect: -200000, momentumEffect: -2, trustEffect: 20 },
      { text: "Condemn the individual but keep the funds", moneyEffect: 0, momentumEffect: 0, trustEffect: -15 },
      { text: "Quietly distance yourself", moneyEffect: -20000, momentumEffect: -5, trustEffect: -5 }
    ]
  },
  {
    title: "Campaign Plane Grounded",
    description: "Mechanical issues have grounded your campaign plane during a critical 5-state swing. You're missing rallies.",
    phase: 'any',
    choices: [
      { text: "Charter a private jet ($250K)", moneyEffect: -250000, momentumEffect: 5, trustEffect: -5 },
      { text: "Switch to bus tours (slow)", moneyEffect: 0, momentumEffect: -10, trustEffect: 8 },
      { text: "Campaign via Zoom this week", moneyEffect: 0, momentumEffect: -20, trustEffect: 2 }
    ]
  },
  {
    title: "Data Breach",
    description: "Hackers have accessed your donor database. Supporters are worried about their privacy.",
    phase: 'any',
    choices: [
      { text: "Hire a top cybersecurity firm ($300K)", moneyEffect: -300000, momentumEffect: 0, trustEffect: 15 },
      { text: "Issue a standard apology", moneyEffect: 0, momentumEffect: -5, trustEffect: -15 },
      { text: "Blame foreign state actors", moneyEffect: 0, momentumEffect: 10, trustEffect: -10 }
    ]
  },
  {
    title: "Internal Memo Leak",
    description: "A private memo where your team discusses 'uninformed voters' in key states has been leaked to the press.",
    phase: 'any',
    choices: [
      { text: "Fire the author publicly", moneyEffect: 0, momentumEffect: -8, trustEffect: 10 },
      { text: "Claim the memo was 'taken out of context'", moneyEffect: 0, momentumEffect: -5, trustEffect: -8 },
      { text: "Ignore it and launch a policy offensive", moneyEffect: -100000, momentumEffect: 5, trustEffect: 0 }
    ]
  }
];

// ─── HIGH-STAKES DEBATE EVENTS ──────────────────────────────────────
const NEGATIVE_SHOCK_EVENTS: CampaignEvent[] = [
  {
    title: "Volunteer Walkout",
    description: "A local volunteer network says your campaign has become disorganized and dismissive. Reporters are on the story within hours.",
    phase: 'any',
    choices: [
      { text: "Meet organizers and promise reforms", moneyEffect: -25000, momentumEffect: -7, trustEffect: 4 },
      { text: "Replace the local leadership team", moneyEffect: -90000, momentumEffect: -4, trustEffect: -2 },
      { text: "Call it a minor flare-up", moneyEffect: 0, momentumEffect: -11, trustEffect: -8 }
    ]
  },
  {
    title: "Bad Internal Poll Leak",
    description: "A leaked internal memo shows your campaign trailing badly in states you expected to hold.",
    phase: 'any',
    choices: [
      { text: "Admit the setback and reset the strategy", moneyEffect: -50000, momentumEffect: -8, trustEffect: 3 },
      { text: "Attack the leak and blame sabotage", moneyEffect: 0, momentumEffect: -4, trustEffect: -7 },
      { text: "Flood the airwaves with reassurance ads", moneyEffect: -140000, momentumEffect: -2, trustEffect: -2 }
    ]
  },
  {
    title: "Fact-Check Barrage",
    description: "A major network publishes a brutal segment questioning several claims from your stump speech.",
    phase: 'any',
    choices: [
      { text: "Clarify the record and tighten your message", moneyEffect: -20000, momentumEffect: -6, trustEffect: 2 },
      { text: "Say the media is working for your rivals", moneyEffect: 0, momentumEffect: -1, trustEffect: -9 },
      { text: "Ignore it and hope the cycle moves on", moneyEffect: 0, momentumEffect: -9, trustEffect: -5 }
    ]
  },
  {
    title: "Field Office Eviction",
    description: "A landlord locks one of your busiest regional offices after a contract dispute goes public.",
    phase: 'primary',
    choices: [
      { text: "Open a replacement office immediately", moneyEffect: -120000, momentumEffect: -4, trustEffect: 1 },
      { text: "Shift to volunteer homes and remote organizing", moneyEffect: -15000, momentumEffect: -8, trustEffect: 0 },
      { text: "Blame local incompetence and move on", moneyEffect: 0, momentumEffect: -10, trustEffect: -6 }
    ]
  },
  {
    title: "Donor Revolt",
    description: "Several bundlers tell the press they are freezing support until the campaign shows discipline.",
    phase: 'any',
    choices: [
      { text: "Hold a private apology tour", moneyEffect: -40000, momentumEffect: -5, trustEffect: -2 },
      { text: "Pivot hard to grassroots fundraising", moneyEffect: -15000, momentumEffect: -7, trustEffect: 2 },
      { text: "Call the donor class entitled and out of touch", moneyEffect: 25000, momentumEffect: -3, trustEffect: -10 }
    ]
  },
  {
    title: "Ballot Access Challenge",
    description: "A paperwork challenge threatens your ballot status in a key state and raises competence questions everywhere else.",
    phase: 'general',
    choices: [
      { text: "Hire election lawyers now", moneyEffect: -180000, momentumEffect: -4, trustEffect: 2 },
      { text: "Go public and accuse insiders of interference", moneyEffect: -30000, momentumEffect: -2, trustEffect: -6 },
      { text: "Downplay it and trust the courts", moneyEffect: 0, momentumEffect: -9, trustEffect: -4 }
    ]
  },
  {
    title: "Surrogate Meltdown",
    description: "A high-profile surrogate goes off script on live TV and drags your campaign into a needless fight.",
    phase: 'any',
    choices: [
      { text: "Distance yourself and suspend appearances", moneyEffect: -10000, momentumEffect: -6, trustEffect: 1 },
      { text: "Stand by them and escalate the fight", moneyEffect: 0, momentumEffect: -2, trustEffect: -8 },
      { text: "Send a disciplined team to clean up the fallout", moneyEffect: -70000, momentumEffect: -4, trustEffect: 3 }
    ]
  },
  {
    title: "Exhaustion Narrative",
    description: "Clips from several events make the candidate look drained and unfocused. Commentators start questioning readiness.",
    phase: 'any',
    choices: [
      { text: "Clear the schedule for recovery", moneyEffect: -20000, momentumEffect: -8, trustEffect: 4 },
      { text: "Power through with more events", moneyEffect: -50000, momentumEffect: -4, trustEffect: -6 },
      { text: "Blame selective editing and hostile coverage", moneyEffect: 0, momentumEffect: -3, trustEffect: -8 }
    ]
  }
];

export const DEBATE_EVENTS: CampaignEvent[] = [
  {
    title: "Opening Statement Moment",
    description: "The moderator gives you 90 seconds to define your candidacy. The nation is watching.",
    phase: 'any',
    choices: [
      { text: "Go on the attack — hammer your rival's record", moneyEffect: 0, momentumEffect: 20, trustEffect: -10 },
      { text: "Deliver a hopeful, unifying vision", moneyEffect: 0, momentumEffect: 12, trustEffect: 12 },
      { text: "Lead with policy specifics — show depth", moneyEffect: 0, momentumEffect: 8, trustEffect: 15 }
    ]
  },
  {
    title: "Gotcha Question",
    description: "The moderator asks you to name the president of a country you can't pronounce. Social media is already laughing.",
    phase: 'any',
    choices: [
      { text: "Admit you don't know and pivot to your strengths", moneyEffect: 0, momentumEffect: -5, trustEffect: 10 },
      { text: "Bluff confidently", moneyEffect: 0, momentumEffect: 5, trustEffect: -15 },
      { text: "Attack the question as 'trivial elitism'", moneyEffect: 0, momentumEffect: 15, trustEffect: -8 }
    ]
  },
  {
    title: "Rival's Zinger Goes Viral",
    description: "Your opponent landed a devastating one-liner. Every news network is replaying it on loop.",
    phase: 'any',
    choices: [
      { text: "Laugh it off — show grace under fire", moneyEffect: 0, momentumEffect: -8, trustEffect: 8 },
      { text: "Fire back with your own rehearsed comeback ($50K prep)", moneyEffect: -50000, momentumEffect: 15, trustEffect: 0 },
      { text: "Run counter-ads immediately ($150K)", moneyEffect: -150000, momentumEffect: 10, trustEffect: 5 }
    ]
  },
  {
    title: "Healthcare Lightning Round",
    description: "Both candidates are grilled on rising drug prices. Your answer will define you with millions of suburban voters.",
    phase: 'any',
    choices: [
      { text: "Promise universal coverage (bold, expensive)", moneyEffect: -100000, momentumEffect: 18, trustEffect: 5 },
      { text: "Defend market-based solutions", moneyEffect: 50000, momentumEffect: 5, trustEffect: -5 },
      { text: "Propose a bipartisan commission", moneyEffect: 0, momentumEffect: 3, trustEffect: 10 }
    ]
  },
  {
    title: "Closing Statement Choice",
    description: "30 seconds left. You can either end with a passionate plea or a direct attack on your rival's character.",
    phase: 'any',
    choices: [
      { text: "Emotional plea — invoke voting for your kids' future", moneyEffect: 0, momentumEffect: 15, trustEffect: 10 },
      { text: "Character attack — 'the American people deserve better'", moneyEffect: 0, momentumEffect: 22, trustEffect: -12 },
      { text: "Policy summary — 'here's my day-one plan'", moneyEffect: 0, momentumEffect: 10, trustEffect: 8 }
    ]
  }
];

// ─── VP CANDIDATE DEFINITIONS ────────────────────────────────────────
export interface VPCandidate {
  name: string;
  description: string;
  bonuses: Partial<PlayerDemographics>;
  momentumBonus: number;
  trustBonus: number;
}

const VP_CANDIDATES: VPCandidate[] = [
  {
    name: "Sen. Maria Torres",
    description: "A fiery progressive senator from New Mexico. Massively boosts immigrant and liberal appeal.",
    bonuses: { liberal: 15, immigrant: 20, worker: 5 },
    momentumBonus: 10,
    trustBonus: 5
  },
  {
    name: "Gov. James Mitchell",
    description: "A moderate southern governor. Strong with religious and business demographics.",
    bonuses: { religious: 15, owner: 15, libertarian: 5 },
    momentumBonus: 5,
    trustBonus: 10
  },
  {
    name: "Fmr. Gen. Sarah Chen",
    description: "A retired four-star general. Massive trust and momentum, but alienates the libertarian base.",
    bonuses: { worker: 10, religious: 5, libertarian: -10 },
    momentumBonus: 20,
    trustBonus: 15
  },
  {
    name: "Rep. David Park",
    description: "A young tech-savvy congressman. Appeals to libertarians and young workers.",
    bonuses: { libertarian: 15, worker: 10, liberal: 10 },
    momentumBonus: 15,
    trustBonus: 0
  }
];

// ─── ACTIVITY LOG ────────────────────────────────────────────────────
export interface ActivityLogEntry {
  week: number;
  message: string;
  type: 'info' | 'positive' | 'negative' | 'event';
}

export interface PrimaryStateResult {
  stateName: string;
  week: number;
  playerShare: number;
  playerDelegates: number;
  leaderName: string;
  leaderShare: number;
  ruleSummary: string;
  districtWins: Record<string, number>;
  fieldShares: PrimaryFieldShare[];
}

type GameEndReason = 'primary_loss' | 'general_loss' | 'general_win' | null;

// ─── GAME STATE ──────────────────────────────────────────────────────
export interface GameState {
  currentWeek: number;
  calendar: CalendarWeek[];
  calendarPhase: 'campaigning' | 'primary' | 'convention' | 'general' | 'election_day';
  gamePhase: 'primary' | 'general' | 'ended';
  difficulty: 'easy' | 'normal' | 'hard';
  hasStarted: boolean;
  scenarioId: string;
  scenarioName: string;

  playerName: string;
  budget: number;
  publicTrust: number;
  playerIdeology: PlayerDemographics;
  momentum: number;
  stamina: number;

  playerDelegates: number;
  rivalDelegates: number;
  delegateTarget: number;
  contestedStates: string[];
  vpPick: VPCandidate | null;
  vpSelectionPending: boolean;
  endReason: GameEndReason;
  // Events
  activeEvent: CampaignEvent | null;
  activeDebate: ActiveDebate | null;
  activeConvention: ActiveConvention | null;
  activeElectionNight: ActiveElectionNight | null;
  debateStanding: DebateStanding;
  endorsements: ActiveEndorsement[];

  // Simulation
  states: StateElectionData[];
  campaignSpending: Record<string, CampaignSpendingData>;
  fieldOperations: Record<string, StateFieldOperation>;
  volunteerReserve: number;
  pollingData: Record<string, PollingData>;
  primaryResults: Record<string, PrimaryStateResult>;
  nationalPollingHistory: { week: string; player: number; rival: number; undecided: number }[];
  hiredStaff: string[];
  playerIssues: string[];
  rivalAIs: RivalAI[];
  generalOpponent: RivalAI | null;
  voterParty: 'Democrat' | 'Republican';

  // Activity Log
  activityLog: ActivityLogEntry[];

  // Fundraising cooldown
  fundraisingStreakWeeks: number;
  pacFundraisedThisWeek: boolean;

  // Actions
  initializeCampaign: (statesData: StateElectionData[]) => void;
  runSimulation: () => void;
  setSpending: (stateName: string, newSpending: Partial<CampaignSpendingData>) => void;
  buildFieldOffice: (stateName: string) => boolean;
  deployVolunteers: (stateName: string, amount: number) => boolean;
  withdrawVolunteers: (stateName: string, amount: number) => void;
  deploySurrogate: (surrogateId: string, stateName: string) => boolean;
  hireStaff: (staffId: string, cost: number) => boolean;
  selectVP: (vp: VPCandidate) => void;

  advanceWeek: () => void;
  addBudget: (amount: number, fromPAC: boolean) => void;
  spendBudget: (amount: number) => boolean;
  addMomentum: (amount: number) => void;
  resolveEvent: (choiceIndex: number) => void;
  answerDebateQuestion: (choiceIndex: number) => void;
  advanceDebate: () => void;
  previewDebate: (phase: DebatePhase) => void;
  answerConventionChoice: (choiceIndex: number) => void;
  advanceConvention: () => void;
  courtEndorsement: (endorsementId: string) => void;
  advanceElectionNight: () => void;
  finalizeElectionNight: () => void;

  // Persistence
  saveGame: (slot?: number) => void;
  loadGame: (slot?: number) => void;
  getSaveSlots: () => { slot: number; week: number; phase: string; date: string; scenarioName: string; difficulty: string; party: string; playerName: string }[];
  setHasStarted: (value: boolean) => void;
  resetGame: () => void;
}

// Helper to compute EV totals from polling
function computeEVTotals(states: StateElectionData[], pollingData: Record<string, PollingData>) {
  let playerEV = 0;
  let rivalEV = 0;
  for (const s of states) {
    const poll = pollingData[s.stateName];
    if (poll) {
      if (poll.player > poll.rival) playerEV += s.delegatesOrEV;
      else rivalEV += s.delegatesOrEV;
    }
  }
  return { playerEV, rivalEV };
}

const initialState: Omit<GameState, 'initializeCampaign' | 'runSimulation' | 'setSpending' | 'buildFieldOffice' | 'deployVolunteers' | 'withdrawVolunteers' | 'deploySurrogate' | 'hireStaff' | 'selectVP' | 'advanceWeek' | 'addBudget' | 'spendBudget' | 'addMomentum' | 'resolveEvent' | 'answerDebateQuestion' | 'advanceDebate' | 'previewDebate' | 'answerConventionChoice' | 'advanceConvention' | 'courtEndorsement' | 'advanceElectionNight' | 'finalizeElectionNight' | 'saveGame' | 'loadGame' | 'getSaveSlots' | 'setHasStarted' | 'resetGame'> = {
  currentWeek: 1,
  calendar: [] as CalendarWeek[],
  calendarPhase: 'campaigning',
  gamePhase: 'primary',
  difficulty: 'normal',
  hasStarted: false,
  scenarioId: 'vanilla',
  scenarioName: 'Modern Presidential Cycle',

  playerName: 'Your Candidate',
  budget: 150000,
  publicTrust: 58,
  playerIdeology: {
    liberal: 50,
    libertarian: 50,
    owner: 50,
    worker: 50,
    religious: 50,
    immigrant: 50
  },
  momentum: 12,
  stamina: 85,

  playerDelegates: 0,
  rivalDelegates: 0,
  delegateTarget: 1975,
  contestedStates: [] as string[],
  vpPick: null as VPCandidate | null,
  vpSelectionPending: false,
  endReason: null,
  activeEvent: null as CampaignEvent | null,
  activeDebate: null as ActiveDebate | null,
  activeConvention: null as ActiveConvention | null,
  activeElectionNight: null as ActiveElectionNight | null,
  debateStanding: { ...EMPTY_DEBATE_STANDING },
  endorsements: [] as ActiveEndorsement[],

  states: [] as StateElectionData[],
  campaignSpending: {} as Record<string, CampaignSpendingData>,
  fieldOperations: {} as Record<string, StateFieldOperation>,
  volunteerReserve: 0,
  pollingData: {} as Record<string, PollingData>,
  primaryResults: {} as Record<string, PrimaryStateResult>,
  nationalPollingHistory: [] as { week: string; player: number; rival: number; undecided: number }[],
  hiredStaff: [] as string[],
  playerIssues: [] as string[],
  rivalAIs: [] as RivalAI[],
  generalOpponent: null as RivalAI | null,
  voterParty: 'Democrat' as const,

  activityLog: [] as ActivityLogEntry[],
  fundraisingStreakWeeks: 0,
  pacFundraisedThisWeek: false,
};

const EMPTY_SPENDING: CampaignSpendingData = {
  intAds: 0,
  tvAds: 0,
  mailers: 0,
  staff1: 0,
  staff2: 0,
  staff3: 0,
  visits: 0,
  groundGame: 0,
  socialMedia: 0,
  research: 0
};

// Helper to cap log length
function capLog(log: ActivityLogEntry[], max = 100): ActivityLogEntry[] {
  return log.length > max ? log.slice(log.length - max) : log;
}

function cloneEmptySpending(): CampaignSpendingData {
  return { ...EMPTY_SPENDING };
}

function clampStat(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scalePositiveDebateValue(value: number, multiplier = 0.6): number {
  if (value <= 0) return value;
  return Math.max(1, Math.round(value * multiplier));
}

function scalePositiveDebateGroups(groupEffects: Partial<PlayerDemographics>): Partial<PlayerDemographics> {
  const scaledEffects: Partial<PlayerDemographics> = {};

  for (const [group, value] of Object.entries(groupEffects) as Array<[keyof PlayerDemographics, number]>) {
    scaledEffects[group] = scalePositiveDebateValue(value);
  }

  return scaledEffects;
}

function decayDebateStanding(standing: DebateStanding): DebateStanding {
  const nextStanding = { ...standing };

  for (const group of Object.keys(nextStanding) as Array<keyof DebateStanding>) {
    const currentValue = nextStanding[group];
    if (currentValue > 0) {
      nextStanding[group] = Math.max(0, currentValue - 4);
    } else if (currentValue < 0) {
      nextStanding[group] = Math.min(0, currentValue + 2);
    }
  }

  return nextStanding;
}

function getOrderedRivals(rivals: RivalAI[]): RivalAI[] {
  return [...rivals].sort((a, b) => {
    const statusWeightA = a.status === 'withdrawn' ? 0 : 1;
    const statusWeightB = b.status === 'withdrawn' ? 0 : 1;
    if (statusWeightA !== statusWeightB) return statusWeightB - statusWeightA;
    if (a.delegates !== b.delegates) return b.delegates - a.delegates;
    if (a.momentum !== b.momentum) return b.momentum - a.momentum;
    return b.supportBase - a.supportBase;
  });
}

function getLeadRival(rivals: RivalAI[], difficulty: 'easy' | 'normal' | 'hard'): RivalAI {
  return getOrderedRivals(rivals)[0] ?? SimulationEngine.createRivalAI(difficulty);
}

function getPlayerSurrogateRoster(state: Pick<GameState, 'vpPick' | 'hiredStaff' | 'endorsements'>): SurrogateProfile[] {
  return buildPlayerSurrogateRoster(state.vpPick, state.hiredStaff, state.endorsements);
}

function getStateCampaignSpending(campaignSpending: Record<string, CampaignSpendingData>, stateName: string): CampaignSpendingData {
  return campaignSpending[stateName] ? { ...campaignSpending[stateName] } : cloneEmptySpending();
}

function getVolunteerCapacityForOperation(operation: StateFieldOperation): number {
  return Math.max(60, getOfficeCapacity(operation.officeLevel, operation.officeReadiness));
}

function recalculateStateSurrogatePower(
  stateName: string,
  assignedSurrogates: string[],
  surrogates: SurrogateProfile[],
  states: StateElectionData[]
): number {
  const stateData = states.find((entry) => entry.stateName === stateName);
  if (!stateData) return 0;

  return assignedSurrogates.reduce((sum, surrogateId) => {
    const surrogate = surrogates.find((entry) => entry.id === surrogateId);
    if (!surrogate) return sum;
    return sum + getSurrogatePower(surrogate, stateData);
  }, 0);
}

function pickEndorsementTarget(
  playerIdeology: PlayerDemographics,
  playerId: string,
  rivals: RivalAI[],
  withdrawingRival: RivalAI
): string {
  const activeTargets = rivals.filter((rival) => rival.id !== withdrawingRival.id && rival.status !== 'withdrawn');
  const playerDistance = Object.keys(playerIdeology).reduce((sum, key) => {
    const trait = key as keyof PlayerDemographics;
    return sum + Math.abs(playerIdeology[trait] - withdrawingRival.ideology[trait]);
  }, 0);

  let bestTargetId = playerId;
  let bestDistance = playerDistance;

  for (const rival of activeTargets) {
    const distance = Object.keys(rival.ideology).reduce((sum, key) => {
      const trait = key as keyof PlayerDemographics;
      return sum + Math.abs(rival.ideology[trait] - withdrawingRival.ideology[trait]);
    }, 0);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestTargetId = rival.id;
    }
  }

  return bestTargetId;
}

function getTotalPartyDelegates(states: StateElectionData[], party: 'Democrat' | 'Republican'): number {
  return states.reduce((sum, contestState) => {
    return sum + (party === 'Democrat' ? contestState.demDelegates : contestState.repDelegates);
  }, 0);
}

function getCandidateWinStats(
  primaryResults: Record<string, PrimaryStateResult>,
  candidateId: string,
  currentWeek: number
): { stateWins: number; recentWins: number } {
  return Object.values(primaryResults).reduce((totals, result) => {
    const winnerId = result.fieldShares[0]?.candidateId ?? result.leaderName;
    if (winnerId !== candidateId) {
      return totals;
    }

    totals.stateWins += 1;
    if (result.week >= Math.max(1, currentWeek - 6)) {
      totals.recentWins += 1;
    }
    return totals;
  }, { stateWins: 0, recentWins: 0 });
}

function buildPlayerEndorsementSnapshot(
  state: GameState,
  currentWeek: number,
  delegateTarget: number
): CandidateEndorsementSnapshot {
  const winStats = getCandidateWinStats(state.primaryResults, 'player', currentWeek);

  return {
    id: 'player',
    name: state.playerName,
    ideology: state.playerIdeology,
    momentum: state.momentum,
    trust: state.publicTrust,
    delegates: state.playerDelegates,
    delegateTarget,
    stateWins: winStats.stateWins,
    recentWins: winStats.recentWins,
    homeRegion: 'National',
    supportBase: 14,
    status: 'player'
  };
}

function buildRivalEndorsementSnapshots(
  rivals: RivalAI[],
  primaryResults: Record<string, PrimaryStateResult>,
  currentWeek: number,
  delegateTarget: number
): CandidateEndorsementSnapshot[] {
  return rivals.map((rival) => {
    const winStats = getCandidateWinStats(primaryResults, rival.id, currentWeek);
    return {
      id: rival.id,
      name: rival.name,
      ideology: rival.ideology,
      momentum: rival.momentum,
      trust: rival.trust,
      delegates: rival.delegates,
      delegateTarget,
      stateWins: winStats.stateWins,
      recentWins: winStats.recentWins,
      homeRegion: rival.homeRegion,
      supportBase: rival.supportBase,
      status: rival.status === 'nominee' ? 'nominee' : rival.status
    };
  });
}

function countConventionEndorsements(
  endorsements: ActiveEndorsement[],
  rivals: RivalAI[],
  leadRivalId: string
): { player: number; lead: number } {
  const outsideBackers = {
    player: getCandidateEndorsementSummary(endorsements, 'player').conventionWeight,
    lead: getCandidateEndorsementSummary(endorsements, leadRivalId).conventionWeight
  };

  return rivals.reduce((totals, rival) => {
    if (rival.endorsedCandidateId === 'player') {
      totals.player += 1;
    } else if (rival.endorsedCandidateId === leadRivalId) {
      totals.lead += 1;
    }

    return totals;
  }, outsideBackers);
}

type PersistedGameState = Pick<GameState,
  | 'hasStarted'
  | 'currentWeek'
  | 'calendar'
  | 'calendarPhase'
  | 'gamePhase'
  | 'difficulty'
  | 'scenarioId'
  | 'scenarioName'
  | 'playerName'
  | 'budget'
  | 'publicTrust'
  | 'playerIdeology'
  | 'momentum'
  | 'stamina'
  | 'playerDelegates'
  | 'rivalDelegates'
  | 'delegateTarget'
  | 'contestedStates'
  | 'vpPick'
  | 'vpSelectionPending'
  | 'endReason'
  | 'activeDebate'
  | 'activeConvention'
  | 'activeElectionNight'
  | 'debateStanding'
  | 'endorsements'
  | 'states'
  | 'campaignSpending'
  | 'fieldOperations'
  | 'volunteerReserve'
  | 'pollingData'
  | 'primaryResults'
  | 'nationalPollingHistory'
  | 'hiredStaff'
  | 'playerIssues'
  | 'rivalAIs'
  | 'generalOpponent'
  | 'voterParty'
  | 'activityLog'
  | 'fundraisingStreakWeeks'
  | 'pacFundraisedThisWeek'
> & {
  savedAt: string;
};

export { VP_CANDIDATES, computeEVTotals };
export type { VPCandidate as VPCandidateType };

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  initializeCampaign: (statesData: StateElectionData[]) => {
    const state = get();
    const spending: Record<string, CampaignSpendingData> = {};
    for (const s of statesData) {
      spending[s.stateName] = cloneEmptySpending();
    }

    // Generate realist campaign calendar
    const calendar = CampaignDataParser.generateCalendar();

    const totalPrimaryDelegates = statesData.reduce((sum, contestState) => {
      return sum + (state.voterParty === 'Democrat' ? contestState.demDelegates : contestState.repDelegates);
    }, 0);
    const primaryTarget = Math.floor(totalPrimaryDelegates / 2) + 1;

    const opponents = SimulationEngine.createPrimaryRivals(state.difficulty, state.voterParty, statesData);

    set({
      states: statesData,
      campaignSpending: spending,
      fieldOperations: createInitialFieldOperations(statesData),
      volunteerReserve: 90,
      delegateTarget: primaryTarget,
      calendar,
      calendarPhase: 'campaigning',
      gamePhase: 'primary',
      stamina: 85,
      fundraisingStreakWeeks: 0,
      pacFundraisedThisWeek: false,
      endReason: null,
      activeEvent: null,
      activeDebate: null,
      activeConvention: null,
      activeElectionNight: null,
      debateStanding: { ...EMPTY_DEBATE_STANDING },
      endorsements: createEndorsementRoster(state.voterParty),
      primaryResults: {},
      rivalAIs: opponents,
      generalOpponent: null,
      activityLog: [{ week: 1, message: `Campaign launched — July 2023. ${statesData.length} contests in play. You are facing ${opponents.length} major primary opponents.`, type: 'info' }]
    });
    get().runSimulation();
  },

  runSimulation: () => {
    const state = get();
    if (state.states.length === 0) return;

    const newPolling: Record<string, PollingData> = {};
    let totalDelegates = 0;
    let sumPlayer = 0;
    let sumRival = 0;
    let sumUndecided = 0;

    let staffDiv = 2.0;
    let visitMult = 1.0;
    if (state.hiredStaff.includes('data_analyst')) staffDiv = 1.5;
    if (state.hiredStaff.includes('field_organizer')) visitMult = 2.0;

    const effectivePlayerIdeology = applyDebateStanding(state.playerIdeology, state.debateStanding);
    const activeGeneralOpponent = state.generalOpponent
      ?? SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty, state.states);
    const rival = state.gamePhase === 'general'
      ? activeGeneralOpponent
      : getLeadRival(state.rivalAIs, state.difficulty);

    for (const s of state.states) {
      const playerSpending = getStateCampaignSpending(state.campaignSpending, s.stateName);
      const playerEndorsementEffect = getCandidateStateEndorsementEffect(state.endorsements, 'player', s);
      const playerFieldEffect = getFieldOperationEffect(s, state.fieldOperations[s.stateName]);
      const poll = state.gamePhase === 'primary'
        ? SimulationEngine.generatePrimaryFieldProjection(
            effectivePlayerIdeology,
            s,
            playerSpending,
            state.momentum,
            state.publicTrust,
            state.rivalAIs,
            playerEndorsementEffect,
            Object.fromEntries(state.rivalAIs.map((entry) => [entry.id, getCandidateStateEndorsementEffect(state.endorsements, entry.id, s)])),
            playerFieldEffect,
            Object.fromEntries(state.rivalAIs.map((entry) => [entry.id, getFieldOperationEffect(s, entry.fieldOperations[s.stateName])])),
            staffDiv,
            visitMult,
            state.playerIssues,
            state.voterParty
          )
        : SimulationEngine.generateStatePolling(
            effectivePlayerIdeology,
            s,
            playerSpending,
            state.momentum,
            state.publicTrust,
            rival,
            playerEndorsementEffect,
            getCandidateStateEndorsementEffect(state.endorsements, rival.id, s),
            playerFieldEffect,
            getFieldOperationEffect(s, rival.fieldOperations[s.stateName]),
            staffDiv,
            visitMult,
            state.playerIssues,
            state.voterParty
          );
      newPolling[s.stateName] = poll;

      const delegates = s.delegatesOrEV || 1;
      totalDelegates += delegates;
      sumPlayer += poll.player * delegates;
      sumRival += poll.rival * delegates;
      sumUndecided += poll.undecided * delegates;
    }

    const nationalAvg = {
      week: `W${state.currentWeek}`,
      player: sumPlayer / totalDelegates,
      rival: sumRival / totalDelegates,
      undecided: sumUndecided / totalDelegates
    };

    set((currentState) => {
      const history = [...currentState.nationalPollingHistory];
      const existingWeekIndex = history.findIndex(h => h.week === nationalAvg.week);
      if (existingWeekIndex >= 0) {
        history[existingWeekIndex] = nationalAvg;
      } else {
        history.push(nationalAvg);
      }
      return { pollingData: newPolling, nationalPollingHistory: history };
    });
  },

  setSpending: (stateName, newStats) => {
    set((state) => {
      const current = state.campaignSpending[stateName] || cloneEmptySpending();
      return {
        campaignSpending: {
          ...state.campaignSpending,
          [stateName]: { ...current, ...newStats }
        }
      };
    });
    get().runSimulation();
  },

  buildFieldOffice: (stateName) => {
    const state = get();
    const stateData = state.states.find((entry) => entry.stateName === stateName);
    if (!stateData) return false;

    const currentOperation = state.fieldOperations[stateName] ?? {
      officeLevel: 0,
      officeReadiness: 0,
      volunteerStrength: 0,
      surrogatePower: 0,
      assignedSurrogates: [],
      lastOfficeWeek: null
    };
    if (currentOperation.officeLevel >= 3) return false;

    const buildCost = getFieldOfficeBuildCost(stateData, currentOperation.officeLevel);
    if (state.budget < buildCost) return false;

    set({
      budget: state.budget - buildCost,
      fieldOperations: {
        ...state.fieldOperations,
        [stateName]: {
          ...currentOperation,
          officeLevel: currentOperation.officeLevel + 1,
          officeReadiness: Math.max(18, currentOperation.officeReadiness),
          lastOfficeWeek: state.currentWeek
        }
      },
      activityLog: capLog([
        ...state.activityLog,
        {
          week: state.currentWeek,
          message: `${currentOperation.officeLevel === 0 ? 'Opened' : 'Upgraded'} a field office in ${stateName} for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(buildCost)}.`,
          type: 'positive'
        }
      ])
    });
    get().runSimulation();
    return true;
  },

  deployVolunteers: (stateName, amount) => {
    const state = get();
    const stateData = state.states.find((entry) => entry.stateName === stateName);
    if (!stateData || amount <= 0) return false;

    const currentOperation = state.fieldOperations[stateName] ?? {
      officeLevel: 0,
      officeReadiness: 0,
      volunteerStrength: 0,
      surrogatePower: 0,
      assignedSurrogates: [],
      lastOfficeWeek: null
    };
    const capacity = getVolunteerCapacityForOperation(currentOperation);
    const deployable = Math.min(amount, capacity - currentOperation.volunteerStrength, state.volunteerReserve);
    if (deployable <= 0) return false;

    const deploymentCost = getVolunteerDeployCost(stateData, deployable);
    if (state.budget < deploymentCost) return false;

    set({
      budget: state.budget - deploymentCost,
      volunteerReserve: state.volunteerReserve - deployable,
      fieldOperations: {
        ...state.fieldOperations,
        [stateName]: {
          ...currentOperation,
          volunteerStrength: currentOperation.volunteerStrength + deployable
        }
      },
      activityLog: capLog([
        ...state.activityLog,
        {
          week: state.currentWeek,
          message: `Deployed ${deployable} volunteers into ${stateName}'s field program.`,
          type: 'positive'
        }
      ])
    });
    get().runSimulation();
    return true;
  },

  withdrawVolunteers: (stateName, amount) => {
    const state = get();
    const currentOperation = state.fieldOperations[stateName];
    if (!currentOperation || amount <= 0) return;

    const withdrawn = Math.min(amount, currentOperation.volunteerStrength);
    if (withdrawn <= 0) return;

    const reserveReturn = getVolunteerWithdrawalReturn(withdrawn);
    set({
      volunteerReserve: state.volunteerReserve + reserveReturn,
      fieldOperations: {
        ...state.fieldOperations,
        [stateName]: {
          ...currentOperation,
          volunteerStrength: currentOperation.volunteerStrength - withdrawn
        }
      },
      activityLog: capLog([
        ...state.activityLog,
        {
          week: state.currentWeek,
          message: `Pulled ${withdrawn} volunteers out of ${stateName}. ${reserveReturn} return to the national reserve.`,
          type: 'info'
        }
      ])
    });
    get().runSimulation();
  },

  deploySurrogate: (surrogateId, stateName) => {
    const state = get();
    const stateData = state.states.find((entry) => entry.stateName === stateName);
    if (!stateData) return false;

    const roster = getPlayerSurrogateRoster(state);
    const surrogate = roster.find((entry) => entry.id === surrogateId);
    if (!surrogate) return false;

    const currentAssignedState = getAssignedStateForSurrogate(state.fieldOperations, surrogateId);
    const nextFieldOperations = { ...state.fieldOperations };

    if (currentAssignedState) {
      const previousOperation = nextFieldOperations[currentAssignedState];
      const remainingAssignments = previousOperation.assignedSurrogates.filter((entry) => entry !== surrogateId);
      nextFieldOperations[currentAssignedState] = {
        ...previousOperation,
        assignedSurrogates: remainingAssignments,
        surrogatePower: recalculateStateSurrogatePower(currentAssignedState, remainingAssignments, roster, state.states)
      };
    }

    if (currentAssignedState === stateName) {
      set({
        fieldOperations: nextFieldOperations,
        activityLog: capLog([
          ...state.activityLog,
          {
            week: state.currentWeek,
            message: `Recalled ${surrogate.name} from ${stateName}.`,
            type: 'info'
          }
        ])
      });
      get().runSimulation();
      return true;
    }

    const currentOperation = nextFieldOperations[stateName] ?? {
      officeLevel: 0,
      officeReadiness: 0,
      volunteerStrength: 0,
      surrogatePower: 0,
      assignedSurrogates: [],
      lastOfficeWeek: null
    };
    const nextAssignments = [...currentOperation.assignedSurrogates, surrogateId];
    nextFieldOperations[stateName] = {
      ...currentOperation,
      assignedSurrogates: nextAssignments,
      surrogatePower: recalculateStateSurrogatePower(stateName, nextAssignments, roster, state.states)
    };

    set({
      fieldOperations: nextFieldOperations,
      activityLog: capLog([
        ...state.activityLog,
        {
          week: state.currentWeek,
          message: `Deployed ${surrogate.name} to campaign in ${stateName}.`,
          type: 'positive'
        }
      ])
    });
    get().runSimulation();
    return true;
  },

  hireStaff: (staffId: string, cost: number) => {
    const state = get();
    if (state.budget >= cost && !state.hiredStaff.includes(staffId)) {
      set({
        budget: state.budget - cost,
        hiredStaff: [...state.hiredStaff, staffId],
        activityLog: [...state.activityLog, { week: state.currentWeek, message: `Hired new staff member.`, type: 'positive' }]
      });
      get().runSimulation();
      return true;
    }
    return false;
  },

  selectVP: (vp: VPCandidate) => {
    const state = get();
    const newIdeology = { ...state.playerIdeology };
    for (const [key, val] of Object.entries(vp.bonuses) as Array<[keyof PlayerDemographics, number | undefined]>) {
      newIdeology[key] = Math.max(0, Math.min(100, newIdeology[key] + (val ?? 0)));
    }
    set({
      vpPick: vp,
      vpSelectionPending: false,
      playerIdeology: newIdeology,
      momentum: Math.min(100, state.momentum + vp.momentumBonus),
      publicTrust: Math.min(100, state.publicTrust + vp.trustBonus),
      activityLog: [...state.activityLog, { week: state.currentWeek, message: `Selected ${vp.name} as running mate!`, type: 'positive' }]
    });
    get().runSimulation();
  },

  saveGame: (slot = 0) => {
    const state = get();
    const saveData: PersistedGameState = {
      hasStarted: true,
      currentWeek: state.currentWeek,
      calendar: state.calendar,
      calendarPhase: state.calendarPhase,
      gamePhase: state.gamePhase,
      difficulty: state.difficulty,
      scenarioId: state.scenarioId,
      scenarioName: state.scenarioName,
      playerName: state.playerName,
      budget: state.budget,
      publicTrust: state.publicTrust,
      playerIdeology: state.playerIdeology,
      momentum: state.momentum,
      stamina: state.stamina,
      playerDelegates: state.playerDelegates,
      rivalDelegates: state.rivalDelegates,
      delegateTarget: state.delegateTarget,
      contestedStates: state.contestedStates,
      vpPick: state.vpPick,
      vpSelectionPending: state.vpSelectionPending,
      endReason: state.endReason,
      activeDebate: state.activeDebate,
      activeConvention: state.activeConvention,
      activeElectionNight: state.activeElectionNight,
      debateStanding: state.debateStanding,
      endorsements: state.endorsements,
      states: state.states,
      campaignSpending: state.campaignSpending,
      fieldOperations: state.fieldOperations,
      volunteerReserve: state.volunteerReserve,
      pollingData: state.pollingData,
      primaryResults: state.primaryResults,
      nationalPollingHistory: state.nationalPollingHistory,
      hiredStaff: state.hiredStaff,
      playerIssues: state.playerIssues,
      rivalAIs: state.rivalAIs,
      generalOpponent: state.generalOpponent,
      voterParty: state.voterParty,
      activityLog: state.activityLog,
      fundraisingStreakWeeks: state.fundraisingStreakWeeks,
      pacFundraisedThisWeek: state.pacFundraisedThisWeek,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`politisim_save_${slot}`, JSON.stringify(saveData));
    console.log(`Game Saved to Slot ${slot}.`);
  },

  loadGame: (slot = 0) => {
    const saveDataStr = localStorage.getItem(`politisim_save_${slot}`);
    if (saveDataStr) {
      try {
        const parsed = JSON.parse(saveDataStr) as Partial<PersistedGameState>;
        const restoredCalendar = CampaignDataParser.generateCalendar();
        const restoredWeek = parsed.currentWeek ?? initialState.currentWeek;
        const restoredCalendarPhase = restoredCalendar[restoredWeek - 1]?.phase ?? parsed.calendarPhase ?? initialState.calendarPhase;
        const restoredStates = parsed.states ?? [];
        const normalizedRivals = (parsed.rivalAIs ?? []).map((rival) => ({
          ...SimulationEngine.createRivalAI(parsed.difficulty ?? initialState.difficulty, restoredStates),
          ...rival,
          shortName: rival.shortName ?? rival.name?.split(' ').slice(-1)[0] ?? 'Rival',
          tagline: rival.tagline ?? 'Campaign rival',
          party: rival.party ?? (parsed.voterParty === 'Democrat' ? 'Democrat' : 'Republican'),
          trust: rival.trust ?? 50,
          delegates: rival.delegates ?? 0,
          supportBase: rival.supportBase ?? 8,
          status: rival.status ?? 'active',
          homeRegion: rival.homeRegion ?? 'South',
          endorsedCandidateId: rival.endorsedCandidateId ?? null,
          fieldOperations: normalizeFieldOperations(restoredStates, rival.fieldOperations),
          volunteerReserve: rival.volunteerReserve ?? 150,
          fieldStrategy: rival.fieldStrategy ?? 'regional'
        }));
        const normalizedGeneralOpponent = parsed.generalOpponent
          ? {
              ...SimulationEngine.createGeneralOpponentAI(parsed.difficulty ?? initialState.difficulty, parsed.voterParty ?? initialState.voterParty, restoredStates),
              ...parsed.generalOpponent,
              shortName: parsed.generalOpponent.shortName ?? parsed.generalOpponent.name?.split(' ').slice(-1)[0] ?? 'Opponent',
              trust: parsed.generalOpponent.trust ?? 55,
              delegates: parsed.generalOpponent.delegates ?? 0,
              supportBase: parsed.generalOpponent.supportBase ?? 10,
              status: parsed.generalOpponent.status ?? 'nominee',
              endorsedCandidateId: parsed.generalOpponent.endorsedCandidateId ?? null,
              fieldOperations: normalizeFieldOperations(restoredStates, parsed.generalOpponent.fieldOperations),
              volunteerReserve: parsed.generalOpponent.volunteerReserve ?? 220,
              fieldStrategy: parsed.generalOpponent.fieldStrategy ?? 'battleground'
            }
          : null;
        const defaultEndorsements = createEndorsementRoster(parsed.voterParty ?? initialState.voterParty);
        const normalizedEndorsements = defaultEndorsements.map((endorsement) => {
          const saved = parsed.endorsements?.find((entry) => entry.id === endorsement.id);
          return saved
            ? {
                ...endorsement,
                ...saved,
                homeStates: saved.homeStates ?? endorsement.homeStates,
                regions: saved.regions ?? endorsement.regions,
                priorities: saved.priorities ?? endorsement.priorities,
                effects: {
                  ...endorsement.effects,
                  ...saved.effects,
                  demographicFocus: saved.effects?.demographicFocus ?? endorsement.effects.demographicFocus
                },
                rivalRelationships: saved.rivalRelationships ?? {}
              }
            : endorsement;
        });

        set({
          ...initialState,
          ...parsed,
          hasStarted: true,
          calendar: restoredCalendar,
          calendarPhase: restoredCalendarPhase,
          activeEvent: null,
          activeDebate: parsed.activeDebate ?? null,
          activeConvention: parsed.activeConvention ?? null,
          activeElectionNight: parsed.activeElectionNight ?? null,
          debateStanding: parsed.debateStanding ?? { ...EMPTY_DEBATE_STANDING },
          endorsements: normalizedEndorsements,
          states: restoredStates,
          fieldOperations: normalizeFieldOperations(restoredStates, parsed.fieldOperations),
          volunteerReserve: parsed.volunteerReserve ?? 0,
          primaryResults: parsed.primaryResults ?? {},
          vpSelectionPending: parsed.vpSelectionPending ?? false,
          endReason: parsed.endReason ?? null,
          fundraisingStreakWeeks: parsed.fundraisingStreakWeeks ?? 0,
          pacFundraisedThisWeek: parsed.pacFundraisedThisWeek ?? false,
          rivalAIs: normalizedRivals,
          generalOpponent: normalizedGeneralOpponent,
        });
        console.log(`Game Loaded from Slot ${slot}.`);
      } catch (e) {
        console.error("Save file corrupted", e);
      }
    }
  },

  getSaveSlots: () => {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const raw = localStorage.getItem(`politisim_save_${i}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          slots.push({
            slot: i,
            week: parsed.currentWeek,
            phase: parsed.gamePhase,
            date: parsed.savedAt || 'Unknown',
            scenarioName: parsed.scenarioName || 'Unknown Scenario',
            difficulty: parsed.difficulty || 'normal',
            party: parsed.voterParty || 'Democrat',
            playerName: parsed.playerName || 'Candidate'
          });
        } catch {
          slots.push({ slot: i, week: 0, phase: 'corrupted', date: 'Error', scenarioName: 'Corrupted Save', difficulty: '-', party: '-', playerName: '-' });
        }
      } else {
        slots.push({ slot: i, week: 0, phase: 'empty', date: '', scenarioName: '', difficulty: '', party: '', playerName: '' });
      }
    }
    return slots;
  },

  setHasStarted: (value: boolean) => set({ hasStarted: value }),

  resetGame: () => {
    set({
      ...initialState,
      rivalAIs: SimulationEngine.createPrimaryRivals('normal', initialState.voterParty, initialState.states),
      generalOpponent: null,
      primaryResults: {},
      fieldOperations: createInitialFieldOperations(initialState.states),
      volunteerReserve: 0,
      activeConvention: null,
      activeElectionNight: null,
      endorsements: createEndorsementRoster(initialState.voterParty)
    });
  },

  advanceWeek: () => {
    const state = get();
    if (state.gamePhase === 'ended') return;
    if (state.vpSelectionPending || state.activeEvent || state.activeDebate || state.activeConvention || state.activeElectionNight) return;

    const newLog: ActivityLogEntry[] = [...state.activityLog];
    const nextWeek = state.currentWeek + 1;
    const maxWeek = state.calendar.length;
    if (nextWeek > maxWeek) return;

    const calendarEntry = state.calendar[nextWeek - 1];
    const prevCalendarEntry = state.calendar[state.currentWeek - 1];
    const newCalendarPhase = calendarEntry.phase;
    const phaseChanged = prevCalendarEntry.phase !== newCalendarPhase;
    const scheduledDebate = getDebateScheduleForWeek(nextWeek);

    let nextGamePhase: GameState['gamePhase'] = state.gamePhase;
    let triggerVPSelection = false;
    let newPlayerDelegates = state.playerDelegates;
    let newRivalDelegates = state.rivalDelegates;
    let nextDelegateTarget = state.delegateTarget;
    let nextEndReason: GameEndReason = state.endReason;
    const newContested = [...state.contestedStates];
    const updatedPrimaryResults = { ...state.primaryResults };
    let updatedGeneralOpponent = state.generalOpponent;
    let nextActiveConvention: ActiveConvention | null = state.activeConvention;
    let nextActiveElectionNight: ActiveElectionNight | null = state.activeElectionNight;
    let updatedEndorsements = reopenDormantEndorsements(
      state.endorsements,
      [
        'player',
        ...state.rivalAIs.filter((rival) => rival.status !== 'withdrawn').map((rival) => rival.id),
        ...(state.generalOpponent ? [state.generalOpponent.id] : [])
      ]
    );
    let endorsementAnnouncementBudgetBonus = 0;
    const nextFieldOperations = applyWeeklyFieldOperationDecay(state.fieldOperations);
    const volunteerRecruitment = Math.floor(getVolunteerRecruitmentGain(
      nextFieldOperations,
      state.publicTrust,
      state.momentum,
      getCandidateEndorsementSummary(updatedEndorsements, 'player').count,
      state.hiredStaff.includes('field_organizer')
    ));
    const nextVolunteerReserve = Math.min(2400, state.volunteerReserve + volunteerRecruitment);

    if (phaseChanged && newCalendarPhase === 'primary') {
      newLog.push({ week: nextWeek, message: 'Primary season begins. Early contests are about to shape the field.', type: 'info' });
    }

    const trustLoss = newCalendarPhase === 'general' ? 4 : newCalendarPhase === 'primary' ? 3 : 2;
    let newTrust = Math.max(0, state.publicTrust - trustLoss);

    let newStamina = state.stamina;
    const totalVisits = Object.values(state.campaignSpending).reduce((sum, spending) => sum + (spending.visits || 0), 0);
    const rallyFatigue = Math.min(14, totalVisits * 4);
    newStamina = Math.max(0, newStamina - 3 - rallyFatigue);
    if (state.hiredStaff.includes('pr_manager')) newStamina = Math.min(100, newStamina + 1);
    let endorsementMomentumBonus = 0;
    if (newStamina < 25) {
      newLog.push({ week: nextWeek, message: `Campaign fatigue is setting in (stamina: ${newStamina}/100). Consider easing the travel schedule.`, type: 'negative' });
    }

    let updatedRivals = state.rivalAIs.map((rival) =>
      SimulationEngine.runRivalAITurn(
        rival,
        state.states,
        state.pollingData,
        state.difficulty,
        getCandidateEndorsementSummary(updatedEndorsements, rival.id).weeklyFundraising
      )
    );

    if (nextGamePhase === 'general' && updatedGeneralOpponent) {
      updatedGeneralOpponent = SimulationEngine.runRivalAITurn(
        updatedGeneralOpponent,
        state.states,
        state.pollingData,
        state.difficulty,
        getCandidateEndorsementSummary(updatedEndorsements, updatedGeneralOpponent.id).weeklyFundraising
      );
    }

    if (newCalendarPhase === 'primary' && nextWeek % 2 === 0) {
      const uncontested = state.states
        .filter((contestState) => !newContested.includes(contestState.stateName))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .slice(0, 5);
      const contestIdeology = applyDebateStanding(state.playerIdeology, state.debateStanding);
      const contestStaffDiv = state.hiredStaff.includes('data_analyst') ? 1.5 : 2.0;
      const contestVisitMult = state.hiredStaff.includes('field_organizer') ? 2.0 : 1.0;

      for (const contestState of uncontested) {
        const projection: PrimaryStateProjection = SimulationEngine.generatePrimaryFieldProjection(
          contestIdeology,
          contestState,
          getStateCampaignSpending(state.campaignSpending, contestState.stateName),
          state.momentum,
          state.publicTrust,
          updatedRivals,
          getCandidateStateEndorsementEffect(updatedEndorsements, 'player', contestState),
          Object.fromEntries(updatedRivals.map((entry) => [entry.id, getCandidateStateEndorsementEffect(updatedEndorsements, entry.id, contestState)])),
          getFieldOperationEffect(contestState, state.fieldOperations[contestState.stateName]),
          Object.fromEntries(updatedRivals.map((entry) => [entry.id, getFieldOperationEffect(contestState, entry.fieldOperations[contestState.stateName])])),
          contestStaffDiv,
          contestVisitMult,
          state.playerIssues,
          state.voterParty
        );

        const allocation = allocatePrimaryDelegatesForState(
          contestState,
          state.voterParty,
          state.playerName,
          contestIdeology,
          projection,
          updatedRivals
        );
        const allocated = allocation.allocatedShares;
        const playerAllocation = allocated.find((candidate) => candidate.candidateId === 'player');
        const playerDelegatesWon = playerAllocation?.delegates ?? 0;

        newContested.push(contestState.stateName);
        newPlayerDelegates += playerDelegatesWon;

        updatedRivals = updatedRivals.map((rival) => {
          const result = allocated.find((candidate) => candidate.candidateId === rival.id);
          return {
            ...rival,
            delegates: rival.delegates + (result?.delegates ?? 0)
          };
        });

        const rankedCandidates = [...allocated].sort((a, b) => b.share - a.share);
        const raceLeader = rankedCandidates[0];
        const delegatesAtStake = state.voterParty === 'Democrat' ? contestState.demDelegates : contestState.repDelegates;

        updatedPrimaryResults[contestState.stateName] = {
          stateName: contestState.stateName,
          week: nextWeek,
          playerShare: projection.player,
          playerDelegates: playerDelegatesWon,
          leaderName: raceLeader?.name ?? projection.leaderName,
          leaderShare: raceLeader?.share ?? projection.rival,
          ruleSummary: allocation.rule.summary,
          districtWins: allocation.districtWins,
          fieldShares: rankedCandidates
        };

        newLog.push({
          week: nextWeek,
          message: `${contestState.stateName} primary (${allocation.rule.summary}): ${raceLeader?.name ?? 'Field leader'} led with ${(raceLeader?.share ?? projection.rival).toFixed(1)}%. You won ${playerDelegatesWon}/${delegatesAtStake} delegates.`,
          type: playerDelegatesWon >= Math.ceil(delegatesAtStake / 3) ? 'positive' : 'negative'
        });
      }

      const activeRivals = getOrderedRivals(updatedRivals).filter((rival) => rival.status !== 'withdrawn');
      if (nextWeek >= 38 && activeRivals.length > 2) {
        const trailingRival = [...activeRivals].reverse().find((rival) => {
          const outOfMoney = rival.budget < 250000;
          const trustCollapse = rival.trust < 42;
          const momentumCollapse = rival.momentum < 30;
          const delegateMathIsGone = rival.delegates < Math.max(120, activeRivals[0].delegates * 0.45);
          return delegateMathIsGone && (outOfMoney || trustCollapse || momentumCollapse || nextWeek >= 46);
        });

        if (trailingRival) {
          const endorsementTargetId = pickEndorsementTarget(state.playerIdeology, 'player', updatedRivals, trailingRival);
          const suspensionReason = trailingRival.budget < 250000
            ? 'cash dried up'
            : trailingRival.trust < 42
              ? 'elite support cracked'
              : trailingRival.momentum < 30
                ? 'the campaign stalled'
                : 'their delegate path collapsed';
          updatedRivals = updatedRivals.map((rival) => {
            if (rival.id === trailingRival.id) {
              return {
                ...rival,
                status: 'withdrawn',
                momentum: Math.max(12, rival.momentum - 10),
                trust: Math.max(24, rival.trust - 8),
                endorsedCandidateId: endorsementTargetId
              };
            }

            if (rival.id === endorsementTargetId) {
              return {
                ...rival,
                supportBase: rival.supportBase + 6,
                momentum: Math.min(100, rival.momentum + 5),
                trust: Math.min(100, rival.trust + 3)
              };
            }

            return rival;
          });

          if (endorsementTargetId === 'player') {
            endorsementMomentumBonus += 6;
            newTrust = clampStat(newTrust + 3);
            newLog.push({
              week: nextWeek,
              message: `${trailingRival.name} suspended their campaign after ${suspensionReason} and endorsed you, giving your coalition new life.`,
              type: 'positive'
            });
          } else {
            const endorsedRival = updatedRivals.find((rival) => rival.id === endorsementTargetId);
            newLog.push({
              week: nextWeek,
              message: `${trailingRival.name} suspended their campaign after ${suspensionReason} and endorsed ${endorsedRival?.name ?? 'another rival'}.`,
              type: 'negative'
            });
          }
        }
      }
    }

    if ((newCalendarPhase === 'primary' || newCalendarPhase === 'convention') && nextGamePhase === 'primary') {
      updatedEndorsements = reopenDormantEndorsements(
        updatedEndorsements,
        ['player', ...updatedRivals.filter((rival) => rival.status !== 'withdrawn').map((rival) => rival.id)]
      );

      const candidateSnapshots: CandidateEndorsementSnapshot[] = [
        {
          id: 'player',
          name: state.playerName,
          ideology: state.playerIdeology,
          momentum: state.momentum + endorsementMomentumBonus,
          trust: newTrust,
          delegates: newPlayerDelegates,
          delegateTarget: state.delegateTarget,
          stateWins: getCandidateWinStats(updatedPrimaryResults, 'player', nextWeek).stateWins,
          recentWins: getCandidateWinStats(updatedPrimaryResults, 'player', nextWeek).recentWins,
          homeRegion: 'National',
          supportBase: 14,
          status: 'player'
        },
        ...buildRivalEndorsementSnapshots(updatedRivals, updatedPrimaryResults, nextWeek, state.delegateTarget)
      ];

      updatedEndorsements = applyAICourtshipPressure(updatedEndorsements, candidateSnapshots, nextWeek);
      const endorsementResolution = resolveWeeklyEndorsements(updatedEndorsements, candidateSnapshots, nextWeek);
      updatedEndorsements = endorsementResolution.endorsements;

      endorsementResolution.newlyEndorsed.forEach(({ endorsement, candidateId }) => {
        if (candidateId === 'player') {
          endorsementAnnouncementBudgetBonus += Math.floor(endorsement.effects.weeklyFundraising * 1.5);
          endorsementMomentumBonus += endorsement.effects.momentumBoost;
          newTrust = clampStat(newTrust + endorsement.effects.trustBoost);
          newLog.push({
            week: nextWeek,
            message: `${endorsement.name} endorsed you. ${endorsement.title} now backs your bid.`,
            type: 'positive'
          });
          return;
        }

        updatedRivals = updatedRivals.map((rival) => {
          if (rival.id !== candidateId) return rival;
          return {
            ...rival,
            budget: rival.budget + Math.floor(endorsement.effects.weeklyFundraising * 1.5),
            momentum: clampStat(rival.momentum + endorsement.effects.momentumBoost),
            trust: clampStat(rival.trust + endorsement.effects.trustBoost),
            supportBase: rival.supportBase + endorsement.effects.conventionWeight
          };
        });

        const backedRival = updatedRivals.find((rival) => rival.id === candidateId);
        newLog.push({
          week: nextWeek,
          message: `${endorsement.name} lined up behind ${backedRival?.name ?? 'a rival'}, strengthening that coalition.`,
          type: candidateId === getLeadRival(updatedRivals, state.difficulty).id ? 'negative' : 'info'
        });
      });
    }

    const leadRivalAfterContests = getLeadRival(updatedRivals, state.difficulty);
    if (nextGamePhase === 'primary') {
      newRivalDelegates = leadRivalAfterContests.delegates;
    }

    if (phaseChanged && newCalendarPhase === 'convention') {
      const playerWonOutright = newPlayerDelegates >= state.delegateTarget;
      const rivalWonOutright = leadRivalAfterContests.delegates >= state.delegateTarget;

      if (playerWonOutright) {
        nextGamePhase = 'general';
        triggerVPSelection = true;
        updatedGeneralOpponent = SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty, state.states);
        const totalEV = state.states.reduce((sum, contestState) => sum + contestState.delegatesOrEV, 0);
        nextDelegateTarget = Math.floor(totalEV / 2) + 1;
        newLog.push({ week: nextWeek, message: `You secured the nomination with ${newPlayerDelegates} delegates.`, type: 'positive' });
        newLog.push({ week: nextWeek, message: `Convention week: choose a running mate and prepare for a ${nextDelegateTarget}-EV general election.`, type: 'info' });
        newLog.push({ week: nextWeek, message: `Your likely general-election opponent is ${updatedGeneralOpponent.name}, ${updatedGeneralOpponent.tagline.toLowerCase()}.`, type: 'info' });
      } else if (rivalWonOutright) {
        nextGamePhase = 'ended';
        nextEndReason = 'primary_loss';
        newLog.push({
          week: nextWeek,
          message: `${leadRivalAfterContests.name} arrived at the convention with a majority and closed off your path to the nomination.`,
          type: 'negative'
        });
      } else {
        const totalPrimaryDelegates = getTotalPartyDelegates(state.states, state.voterParty);
        const endorsementCounts = countConventionEndorsements(updatedEndorsements, updatedRivals, leadRivalAfterContests.id);
        const freeDelegates = Math.max(0, totalPrimaryDelegates - newPlayerDelegates - leadRivalAfterContests.delegates);

        nextGamePhase = 'primary';
        nextActiveConvention = createConvention(
          newPlayerDelegates,
          leadRivalAfterContests,
          freeDelegates,
          state.delegateTarget,
          endorsementCounts.player,
          endorsementCounts.lead
        );
        newRivalDelegates = leadRivalAfterContests.delegates;
        newLog.push({
          week: nextWeek,
          message: `No candidate reached a majority. The convention opens with ${freeDelegates} delegates still fluid.`,
          type: 'event'
        });
        newLog.push({
          week: nextWeek,
          message: `${leadRivalAfterContests.name} leads entering the floor fight, but the nomination is still up for grabs.`,
          type: 'info'
        });
      }
    } else if (phaseChanged && newCalendarPhase === 'general') {
      newLog.push({
        week: nextWeek,
        message: `The General Election campaign begins${updatedGeneralOpponent ? ` against ${updatedGeneralOpponent.name}` : ''}. Election Day: November 5, 2024.`,
        type: 'info'
      });
    } else if (phaseChanged && newCalendarPhase === 'election_day') {
      nextGamePhase = 'general';
      nextActiveElectionNight = createElectionNight(
        state.states,
        state.pollingData,
        state.playerName,
        nextWeek
      );
      newLog.push({ week: nextWeek, message: 'Election Day arrives. Polls close and the decision desks prepare the first wave of calls.', type: 'event' });
      nextActiveConvention = null;
    }

    const newSpending = { ...state.campaignSpending };
    for (const stateName in newSpending) {
      const spending = { ...newSpending[stateName] };
      spending.tvAds = Math.floor((spending.tvAds || 0) * 0.9);
      spending.intAds = Math.floor((spending.intAds || 0) * 0.9);
      spending.mailers = Math.floor((spending.mailers || 0) * 0.9);
      spending.groundGame = Math.floor((spending.groundGame || 0) * 0.9);
      spending.socialMedia = Math.floor((spending.socialMedia || 0) * 0.9);
      spending.visits = 0;
      newSpending[stateName] = spending;
    }

    let momentumLoss: number;
    switch (newCalendarPhase) {
      case 'campaigning': momentumLoss = 5; break;
      case 'primary': momentumLoss = 7; break;
      case 'convention': momentumLoss = 3; break;
      case 'general': momentumLoss = 9; break;
      case 'election_day': momentumLoss = 0; break;
      default: momentumLoss = 6;
    }
    if (state.hiredStaff.includes('pr_manager')) momentumLoss = Math.max(0, momentumLoss - 1);
    const conventionBounce = phaseChanged && newCalendarPhase === 'convention' ? 8 : 0;

    const coalitionFundraising = getCandidateEndorsementSummary(updatedEndorsements, 'player').weeklyFundraising;
    const currentFieldSummary = getFieldNetworkSummary(state.fieldOperations);
    const fieldOfficeUpkeep = getTotalOfficeUpkeep(nextFieldOperations, state.states);
    const passiveIncome = Math.floor(8000 + (state.momentum / 100) * 18000) + coalitionFundraising + endorsementAnnouncementBudgetBonus;
    const weeklyOverhead = 24000 + (state.hiredStaff.length * 7000) + fieldOfficeUpkeep;
    const nextBudget = Math.max(0, state.budget + passiveIncome - weeklyOverhead);
    newLog.push({ week: nextWeek, message: `Fundraising: +${(passiveIncome / 1000).toFixed(0)}K from small-dollar donors.`, type: 'info' });
    if (coalitionFundraising > 0) {
      newLog.push({ week: nextWeek, message: `Coalition network: +${(coalitionFundraising / 1000).toFixed(0)}K from endorsements and surrogate finance channels.`, type: 'positive' });
    }
    if (volunteerRecruitment > 0) {
      newLog.push({
        week: nextWeek,
        message: `Field recruitment: +${volunteerRecruitment} volunteers replenished the reserve through offices, organizers, and coalition contacts.`,
        type: 'positive'
      });
    }
    if (currentFieldSummary.activeSurrogates > 0) {
      newLog.push({
        week: nextWeek,
        message: `Surrogate schedule: ${currentFieldSummary.activeSurrogates} surrogate stop${currentFieldSummary.activeSurrogates === 1 ? '' : 's'} helped hold local media this week.`,
        type: 'info'
      });
    }
    newLog.push({ week: nextWeek, message: `Operating costs: -${(weeklyOverhead / 1000).toFixed(0)}K to keep the campaign running.`, type: 'negative' });
    if (fieldOfficeUpkeep > 0) {
      newLog.push({
        week: nextWeek,
        message: `Field upkeep: -${(fieldOfficeUpkeep / 1000).toFixed(0)}K to maintain ${currentFieldSummary.officeStates} staffed state office${currentFieldSummary.officeStates === 1 ? '' : 's'}.`,
        type: 'negative'
      });
    }

    let randomEvent: CampaignEvent | null = null;
    let nextActiveDebate: ActiveDebate | null = null;
    if (nextGamePhase !== 'ended' && !nextActiveConvention && !nextActiveElectionNight) {
      if (scheduledDebate) {
        const rivalNames = scheduledDebate.phase === 'general'
          ? [updatedGeneralOpponent?.name ?? getLeadRival(updatedRivals, state.difficulty).name]
          : getOrderedRivals(updatedRivals).map((rival) => rival.name);
        const debate = createActiveDebate(scheduledDebate, state.playerName, rivalNames);
        nextActiveDebate = debate;
        const debateStage = scheduledDebate.phase === 'primary'
          ? `Primary Debate ${scheduledDebate.sequence}`
          : `General Debate ${scheduledDebate.sequence}`;
        newLog.push({ week: nextWeek, message: `Debate night: ${debateStage} at ${debate.venue}.`, type: 'event' });
      } else {
        const eventPhase = nextGamePhase === 'general' ? 'general' : 'primary';
        const phaseEvents = POSSIBLE_EVENTS.filter((event) => !event.phase || event.phase === 'any' || event.phase === eventPhase);
        const shockEvents = NEGATIVE_SHOCK_EVENTS.filter((event) => !event.phase || event.phase === 'any' || event.phase === eventPhase);
        const shockChance = newCalendarPhase === 'general' ? 0.38 : newCalendarPhase === 'primary' ? 0.30 : 0.22;
        const eventChance = newCalendarPhase === 'general' ? 0.70 : newCalendarPhase === 'primary' ? 0.58 : 0.45;

        if (Math.random() < shockChance && shockEvents.length > 0) {
          randomEvent = shockEvents[Math.floor(Math.random() * shockEvents.length)];
        } else if (Math.random() < eventChance && phaseEvents.length > 0) {
          randomEvent = phaseEvents[Math.floor(Math.random() * phaseEvents.length)];
        }

        if (randomEvent) {
          newLog.push({ week: nextWeek, message: `Event: ${randomEvent.title}`, type: 'event' });
        }
      }
    }

    if (nextGamePhase !== 'ended') {
      const mainRival = getLeadRival(updatedRivals, state.difficulty);
      const prevMainRival = getLeadRival(state.rivalAIs, state.difficulty);
      if (mainRival && prevMainRival && mainRival.momentum > prevMainRival.momentum) {
        newLog.push({ week: nextWeek, message: `Rival campaign is gaining momentum (${mainRival.momentum}/100).`, type: 'negative' });
      }
    }

    if (nextWeek % 10 === 0 && nextGamePhase !== 'ended') {
      setTimeout(() => get().saveGame(2), 100);
      newLog.push({ week: nextWeek, message: 'Autosaved.', type: 'info' });
    }

    const nextFundraisingStreakWeeks = state.pacFundraisedThisWeek
      ? state.fundraisingStreakWeeks + 1
      : 0;
    const nextDebateStanding = decayDebateStanding(state.debateStanding);

    set({
      currentWeek: nextWeek,
      gamePhase: nextGamePhase,
      calendarPhase: newCalendarPhase,
      delegateTarget: nextDelegateTarget,
      momentum: Math.max(0, Math.min(100, state.momentum - momentumLoss + conventionBounce + endorsementMomentumBonus)),
      stamina: newStamina,
      budget: nextBudget,
      campaignSpending: newSpending,
      fieldOperations: nextFieldOperations,
      volunteerReserve: nextVolunteerReserve,
      activeEvent: nextGamePhase === 'ended' || nextActiveDebate || nextActiveConvention || nextActiveElectionNight ? null : randomEvent,
      activeDebate: nextGamePhase === 'ended' ? null : nextActiveDebate,
      activeConvention: nextGamePhase === 'ended' ? null : nextActiveConvention,
      activeElectionNight: nextActiveElectionNight,
      endorsements: updatedEndorsements,
      playerDelegates: newPlayerDelegates,
      rivalDelegates: newRivalDelegates,
      contestedStates: newContested,
      rivalAIs: updatedRivals,
      generalOpponent: updatedGeneralOpponent,
      primaryResults: updatedPrimaryResults,
      debateStanding: nextDebateStanding,
      activityLog: capLog(newLog),
      fundraisingStreakWeeks: nextFundraisingStreakWeeks,
      pacFundraisedThisWeek: false,
      vpSelectionPending: triggerVPSelection,
      publicTrust: newTrust,
      endReason: nextEndReason,
    });

    if (nextGamePhase !== 'ended' && !nextActiveElectionNight) get().runSimulation();
  },

  resolveEvent: (choiceIndex: number) => {
    const state = get();
    if (!state.activeEvent) return;

    const choice = state.activeEvent.choices[choiceIndex];
    if (!choice) return;
    const newLog = [...state.activityLog, {
      week: state.currentWeek,
      message: `Resolved "${state.activeEvent.title}" — ${choice.text}`,
      type: 'event' as const
    }];

    set({
      budget: Math.max(0, state.budget + choice.moneyEffect),
      momentum: clampStat(state.momentum + choice.momentumEffect),
      publicTrust: clampStat(state.publicTrust + choice.trustEffect),
      activeEvent: null,
      activityLog: capLog(newLog)
    });
    get().runSimulation();
  },

  answerDebateQuestion: (choiceIndex: number) => {
    const state = get();
    const debate = state.activeDebate;
    if (!debate || debate.selectedChoiceIndex !== null) return;

    const question = debate.questions[debate.currentQuestionIndex];
    const choice = question?.choices[choiceIndex];
    if (!question || !choice) return;
    const scaledGroupEffects = scalePositiveDebateGroups(choice.groupEffects);

    const newLog = [...state.activityLog, {
      week: state.currentWeek,
      message: `Debate answer on ${question.topic}: ${choice.text}`,
      type: 'event' as const
    }];

    set({
      activeDebate: {
        ...debate,
        selectedChoiceIndex: choiceIndex,
        latestReaction: choice.reaction
      },
      debateStanding: mergeDebateStanding(state.debateStanding, scaledGroupEffects),
      momentum: clampStat(state.momentum + scalePositiveDebateValue(choice.momentumEffect)),
      publicTrust: clampStat(state.publicTrust + scalePositiveDebateValue(choice.trustEffect)),
      activityLog: capLog(newLog)
    });
  },

  advanceDebate: () => {
    const state = get();
    const debate = state.activeDebate;
    if (!debate || debate.selectedChoiceIndex === null) return;

    const nextQuestionIndex = debate.currentQuestionIndex + 1;
    if (nextQuestionIndex >= debate.questions.length) {
      const debateAftermathPool = DEBATE_EVENTS.filter((event) => !event.phase || event.phase === 'any' || event.phase === debate.phase);
      const debateAftermath = debateAftermathPool.length > 0
        ? debateAftermathPool[Math.floor(Math.random() * debateAftermathPool.length)]
        : null;
      const newLog = [...state.activityLog, {
        week: state.currentWeek,
        message: `Debate concluded: ${debate.title}.`,
        type: 'event' as const
      }];
      if (debateAftermath) {
        newLog.push({
          week: state.currentWeek,
          message: `Post-debate fallout: ${debateAftermath.title}.`,
          type: 'event' as const
        });
      }

      set({
        activeDebate: null,
        activeEvent: debateAftermath,
        activityLog: capLog(newLog)
      });
      get().runSimulation();
      return;
    }

    set({
      activeDebate: {
        ...debate,
        currentQuestionIndex: nextQuestionIndex,
        selectedChoiceIndex: null,
        latestReaction: null
      }
    });
  },

  previewDebate: (phase: DebatePhase) => {
    const state = get();
    if (state.activeDebate || state.activeConvention || state.activeElectionNight) return;

    const calendarDebateWeek = phase === 'primary'
      ? state.calendar.find((entry) => entry.debatePhase === 'primary')?.week
      : state.calendar.find((entry) => entry.debatePhase === 'general')?.week;
    const debateEntry = getDebateScheduleForWeek(calendarDebateWeek ?? (phase === 'primary' ? 20 : 60));

    if (!debateEntry) return;

    const rivalNames = phase === 'general'
      ? [state.generalOpponent?.name ?? SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty, state.states).name]
      : getOrderedRivals(state.rivalAIs).map((rival) => rival.name);
    const previewDebate = createActiveDebate(debateEntry, state.playerName, rivalNames);

    const newLog = [...state.activityLog, {
      week: state.currentWeek,
      message: `Previewed ${phase === 'primary' ? 'primary' : 'general'} debate scene.`,
      type: 'event' as const
    }];

    set({
      activeEvent: null,
      activeDebate: previewDebate,
      activityLog: capLog(newLog)
    });
  },

  courtEndorsement: (endorsementId: string) => {
    const state = get();
    const endorsement = state.endorsements.find((entry) => entry.id === endorsementId);
    if (!endorsement) return;
    if (state.gamePhase !== 'primary' || state.activeConvention) return;
    if (state.currentWeek < endorsement.availableWeek) return;
    if (endorsement.endorsedCandidateId) return;
    if (endorsement.lastContactWeek === state.currentWeek) return;
    if (state.budget < endorsement.courtingCost || state.stamina < endorsement.staminaCost) return;

    const playerSnapshot = buildPlayerEndorsementSnapshot(state, state.currentWeek, state.delegateTarget);
    const courtship = applyPlayerCourtship(endorsement, playerSnapshot, state.currentWeek);
    const nextEndorsements = state.endorsements.map((entry) => entry.id === endorsement.id ? courtship.updated : entry);
    const rivalSnapshots = buildRivalEndorsementSnapshots(state.rivalAIs, state.primaryResults, state.currentWeek, state.delegateTarget);
    const evaluation = evaluateEndorsement(courtship.updated, [playerSnapshot, ...rivalSnapshots], state.currentWeek);
    const immediateEndorsement = evaluation.readyToDecide && evaluation.standings[0]?.candidateId === 'player';
    const updatedEndorsements = immediateEndorsement
      ? nextEndorsements.map((entry) => entry.id === endorsement.id ? { ...entry, endorsedCandidateId: 'player', lockedWeek: state.currentWeek } : entry)
      : nextEndorsements;
    const newLog = [...state.activityLog, {
      week: state.currentWeek,
      message: `Courted ${endorsement.name}: ${courtship.reaction}`,
      type: 'event' as const
    }];

    if (immediateEndorsement) {
      newLog.push({
        week: state.currentWeek,
        message: `${endorsement.name} endorsed you on the spot after the meeting.`,
        type: 'positive' as const
      });
    }

    set({
      budget: Math.max(0, state.budget - endorsement.courtingCost + (immediateEndorsement ? Math.floor(endorsement.effects.weeklyFundraising * 1.5) : 0)),
      stamina: Math.max(0, state.stamina - endorsement.staminaCost),
      momentum: clampStat(state.momentum + (immediateEndorsement ? endorsement.effects.momentumBoost : 0)),
      publicTrust: clampStat(state.publicTrust + (immediateEndorsement ? endorsement.effects.trustBoost : 0)),
      endorsements: updatedEndorsements,
      activityLog: capLog(newLog)
    });
    get().runSimulation();
  },

  advanceElectionNight: () => {
    const state = get();
    const electionNight = state.activeElectionNight;
    if (!electionNight || electionNight.projectedWinnerId && electionNight.round >= electionNight.totalRounds) return;

    const opponentName = state.generalOpponent?.name ?? 'the opposition';
    const advancement = advanceElectionNightRound(electionNight, state.playerName, opponentName);
    const newLog = [...state.activityLog];

    advancement.wave.forEach((call) => {
      newLog.push({
        week: state.currentWeek,
        message: `${call.stateName} called for ${call.winnerId === 'player' ? state.playerName : opponentName} by ${call.margin.toFixed(1)} points.`,
        type: call.winnerId === 'player' ? 'positive' : 'negative'
      });
    });

    advancement.newMoments.slice(0, 2).forEach((moment) => {
      newLog.push({
        week: state.currentWeek,
        message: moment,
        type: 'event'
      });
    });

    set({
      activeElectionNight: advancement.electionNight,
      activityLog: capLog(newLog)
    });
  },

  finalizeElectionNight: () => {
    const state = get();
    const electionNight = state.activeElectionNight;
    if (!electionNight) return;

    const finalizedNight = finalizeElectionNightState(electionNight);
    const playerWon = finalizedNight.playerEV >= finalizedNight.targetEV;
    const opponentName = state.generalOpponent?.name ?? 'the opposition';
    const newLog = [...state.activityLog, {
      week: state.currentWeek,
      message: `Election night complete: ${playerWon ? `${state.playerName} wins ${finalizedNight.playerEV} to ${finalizedNight.rivalEV}` : `${opponentName} wins ${finalizedNight.rivalEV} to ${finalizedNight.playerEV}`}.`,
      type: playerWon ? 'positive' as const : 'negative' as const
    }];

    set({
      activeElectionNight: finalizedNight,
      gamePhase: 'ended',
      endReason: playerWon ? 'general_win' : 'general_loss',
      activityLog: capLog(newLog)
    });
  },

  answerConventionChoice: (choiceIndex: number) => {
    const state = get();
    const convention = state.activeConvention;
    if (!convention || convention.selectedChoiceIndex !== null) return;

    const choice = convention.choices[choiceIndex];
    if (!choice) return;

    const leadRival = state.rivalAIs.find((rival) => rival.id === convention.leadingRivalId) ?? getLeadRival(state.rivalAIs, state.difficulty);
    const fundingShortfall = state.budget < choice.budgetCost;
    const spendNow = Math.min(state.budget, choice.budgetCost);
    const delegatesInPlayRate = choice.strategy === 'ticket'
      ? 0.58
      : choice.strategy === 'dealmaking'
        ? 0.48
        : choice.strategy === 'powerbrokers'
          ? 0.42
          : 0.36;
    const delegatesInPlay = Math.min(
      convention.freeDelegates,
      Math.max(24, Math.floor(convention.freeDelegates * delegatesInPlayRate))
    );

    let playerScore = 0.28 + (state.publicTrust / 100) * 0.09 + (state.momentum / 100) * 0.08 + (convention.playerEndorsements * 0.025);
    let rivalScore = 0.24 + (leadRival.momentum / 100) * 0.08 + (convention.rivalEndorsements * 0.025);

    if (choice.strategy === 'unity') {
      playerScore += 0.06;
    } else if (choice.strategy === 'dealmaking') {
      playerScore += fundingShortfall ? -0.04 : 0.1;
      rivalScore += 0.02;
    } else if (choice.strategy === 'contrast') {
      playerScore += state.publicTrust >= 50 ? 0.08 : -0.03;
      rivalScore -= 0.02;
    } else if (choice.strategy === 'platform') {
      playerScore += 0.07 + (state.playerIssues.length * 0.01);
    } else if (choice.strategy === 'powerbrokers') {
      playerScore += fundingShortfall ? -0.03 : 0.07;
      rivalScore += 0.03;
    } else if (choice.strategy === 'ticket') {
      playerScore += 0.12 + (convention.playerEndorsements > 0 ? 0.04 : 0);
      rivalScore += 0.02;
    }

    if (leadRival.delegates > convention.playerDelegates) {
      rivalScore += 0.04;
    } else {
      playerScore += 0.03;
    }

    const totalScore = Math.max(0.1, playerScore + rivalScore);
    const playerGain = Math.min(convention.freeDelegates, Math.floor(delegatesInPlay * (playerScore / totalScore)));
    const rivalGain = Math.min(convention.freeDelegates - playerGain, Math.floor(delegatesInPlay * (rivalScore / totalScore)));
    const remainingFree = Math.max(0, convention.freeDelegates - playerGain - rivalGain);
    const reactionSuffix = fundingShortfall && choice.budgetCost > 0
      ? ' The cash crunch blunts some of the effect.'
      : '';
    const summary = `Ballot ${convention.ballot}: ${choice.title} moved ${playerGain} delegates to you and ${rivalGain} to ${convention.leadingRivalName}.`;
    const newLog = [...state.activityLog, {
      week: state.currentWeek,
      message: summary,
      type: 'event' as const
    }];

    set({
      budget: Math.max(0, state.budget - spendNow),
      momentum: clampStat(state.momentum + choice.momentumEffect),
      publicTrust: clampStat(state.publicTrust + choice.trustEffect),
      activeConvention: {
        ...convention,
        selectedChoiceIndex: choiceIndex,
        latestReaction: `${choice.reaction}${reactionSuffix} ${playerGain} delegates break your way; ${rivalGain} drift to ${convention.leadingRivalName}.`,
        playerDelegates: convention.playerDelegates + playerGain,
        rivalDelegates: convention.rivalDelegates + rivalGain,
        freeDelegates: remainingFree,
        history: [...convention.history, summary]
      },
      activityLog: capLog(newLog)
    });
  },

  advanceConvention: () => {
    const state = get();
    const convention = state.activeConvention;
    if (!convention || convention.selectedChoiceIndex === null) return;

    const leadRival = state.rivalAIs.find((rival) => rival.id === convention.leadingRivalId) ?? getLeadRival(state.rivalAIs, state.difficulty);
    let finalPlayerDelegates = convention.playerDelegates;
    let finalRivalDelegates = convention.rivalDelegates;
    let remainingFree = convention.freeDelegates;

    const shouldResolve =
      convention.ballot >= convention.maxBallots ||
      convention.playerDelegates >= convention.targetDelegates ||
      convention.rivalDelegates >= convention.targetDelegates ||
      convention.freeDelegates <= 0;

    if (shouldResolve) {
      if (remainingFree > 0) {
        const playerElectability = finalPlayerDelegates + (state.publicTrust * 1.6) + (state.momentum * 1.2) + (convention.playerEndorsements * 18);
        const rivalElectability = finalRivalDelegates + (leadRival.momentum * 1.4) + (convention.rivalEndorsements * 18) + 12;
        const playerShare = playerElectability / Math.max(1, playerElectability + rivalElectability);
        const playerBonus = Math.floor(remainingFree * playerShare);
        finalPlayerDelegates += playerBonus;
        finalRivalDelegates += remainingFree - playerBonus;
        remainingFree = 0;
      }

      const playerWonConvention =
        finalPlayerDelegates >= convention.targetDelegates ||
        (finalPlayerDelegates > finalRivalDelegates && state.publicTrust + state.momentum >= leadRival.momentum + 70);

      const newLog = [...state.activityLog];
      if (playerWonConvention) {
        const updatedGeneralOpponent = SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty, state.states);
        const totalEV = state.states.reduce((sum, contestState) => sum + contestState.delegatesOrEV, 0);
        const nextEVTarget = Math.floor(totalEV / 2) + 1;
        newLog.push({
          week: state.currentWeek,
          message: `Convention result: you outmaneuvered ${convention.leadingRivalName} and secured the nomination on ballot ${convention.ballot}.`,
          type: 'positive'
        });
        newLog.push({
          week: state.currentWeek,
          message: `The party now pivots to the general election against ${updatedGeneralOpponent.name}.`,
          type: 'info'
        });

        set({
          gamePhase: 'general',
          playerDelegates: finalPlayerDelegates,
          rivalDelegates: finalRivalDelegates,
          activeConvention: null,
          generalOpponent: updatedGeneralOpponent,
          delegateTarget: nextEVTarget,
          vpSelectionPending: true,
          activityLog: capLog(newLog)
        });
        get().runSimulation();
        return;
      }

      newLog.push({
        week: state.currentWeek,
        message: `Convention result: ${convention.leadingRivalName} emerged with the stronger coalition and denied you the nomination.`,
        type: 'negative'
      });

      set({
        gamePhase: 'ended',
        endReason: 'primary_loss',
        playerDelegates: finalPlayerDelegates,
        rivalDelegates: finalRivalDelegates,
        activeConvention: null,
        activityLog: capLog(newLog)
      });
      return;
    }

    const nextBallot = convention.ballot + 1;
    const nextRound = getConventionRound(nextBallot);
    set({
      activeConvention: {
        ...convention,
        ballot: nextBallot,
        title: nextRound.title,
        subtitle: nextRound.subtitle,
        choices: nextRound.choices,
        selectedChoiceIndex: null,
        latestReaction: null
      }
    });
  },

  addBudget: (amount: number, fromPAC: boolean) => {
    const state = get();
    const fatigueLevel = fromPAC
      ? state.fundraisingStreakWeeks + (state.pacFundraisedThisWeek ? 1 : 0)
      : 0;
    let efficiency = 1.0;
    if (fromPAC) {
      efficiency = Math.max(0.1, 0.9 - (fatigueLevel * 0.3));
    }
    
    const actualAmount = Math.floor(amount * efficiency);
    const newLog = [...state.activityLog];
    
    if (efficiency < 1.0 && fromPAC) {
      newLog.push({ 
        week: state.currentWeek, 
        message: `📉 Donor fatigue: fundraising efficiency at ${Math.round(efficiency * 100)}%. Stop fundraising to recover.`, 
        type: 'negative' 
      });
    }

    set({
      budget: state.budget + actualAmount,
      publicTrust: fromPAC ? Math.max(0, state.publicTrust - 8) : state.publicTrust,
      pacFundraisedThisWeek: fromPAC ? true : state.pacFundraisedThisWeek,
      activityLog: capLog(newLog)
    });
  },

  spendBudget: (amount: number) => {
    const { budget } = get();
    if (budget >= amount) {
      set({ budget: budget - amount });
      return true;
    }
    return false;
  },

  addMomentum: (amount: number) => set((state) => ({
    momentum: Math.min(100, state.momentum + amount)
  }))
}));

