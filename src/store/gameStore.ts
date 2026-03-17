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
  SimulationEngine,
  type PollingData,
  type PrimaryFieldShare,
  type PrimaryStateProjection,
  type RivalAI
} from '../core/SimulationEngine';

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
  debateStanding: DebateStanding;

  // Simulation
  states: StateElectionData[];
  campaignSpending: Record<string, CampaignSpendingData>;
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

  // Persistence
  saveGame: (slot?: number) => void;
  loadGame: (slot?: number) => void;
  getSaveSlots: () => { slot: number; week: number; phase: string; date: string }[];
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

const initialState: Omit<GameState, 'initializeCampaign' | 'runSimulation' | 'setSpending' | 'hireStaff' | 'selectVP' | 'advanceWeek' | 'addBudget' | 'spendBudget' | 'addMomentum' | 'resolveEvent' | 'answerDebateQuestion' | 'advanceDebate' | 'previewDebate' | 'saveGame' | 'loadGame' | 'getSaveSlots' | 'setHasStarted' | 'resetGame'> = {
  currentWeek: 1,
  calendar: [] as CalendarWeek[],
  calendarPhase: 'campaigning',
  gamePhase: 'primary',
  difficulty: 'normal',
  hasStarted: false,

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
  debateStanding: { ...EMPTY_DEBATE_STANDING },

  states: [] as StateElectionData[],
  campaignSpending: {} as Record<string, CampaignSpendingData>,
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

// Helper to cap log length
function capLog(log: ActivityLogEntry[], max = 100): ActivityLogEntry[] {
  return log.length > max ? log.slice(log.length - max) : log;
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

function allocateProportionalDelegates(totalDelegates: number, shares: PrimaryFieldShare[]): PrimaryFieldShare[] {
  const viableShares = shares.filter((share) => share.share >= 15);
  const allocationPool = viableShares.length > 0 ? viableShares : shares;
  const totalShare = allocationPool.reduce((sum, share) => sum + share.share, 0);

  if (totalDelegates <= 0 || totalShare <= 0) {
    return shares.map((share) => ({ ...share, delegates: 0 }));
  }

  const withFloors = allocationPool.map((share) => {
    const rawDelegates = (share.share / totalShare) * totalDelegates;
    return {
      candidateId: share.candidateId,
      floor: Math.floor(rawDelegates),
      remainder: rawDelegates - Math.floor(rawDelegates)
    };
  });

  let delegatesAssigned = withFloors.reduce((sum, share) => sum + share.floor, 0);
  const byRemainder = [...withFloors].sort((a, b) => b.remainder - a.remainder);
  let remainderIndex = 0;

  while (delegatesAssigned < totalDelegates && byRemainder.length > 0) {
    byRemainder[remainderIndex % byRemainder.length].floor += 1;
    delegatesAssigned += 1;
    remainderIndex += 1;
  }

  return shares.map((share) => {
    const allocated = withFloors.find((candidate) => candidate.candidateId === share.candidateId);
    return {
      ...share,
      delegates: allocated?.floor ?? 0
    };
  });
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

type PersistedGameState = Pick<GameState,
  | 'hasStarted'
  | 'currentWeek'
  | 'calendar'
  | 'calendarPhase'
  | 'gamePhase'
  | 'difficulty'
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
  | 'debateStanding'
  | 'states'
  | 'campaignSpending'
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
      spending[s.stateName] = { 
        intAds: 0, tvAds: 0, mailers: 0, 
        staff1: 0, staff2: 0, staff3: 0, 
        visits: 0, groundGame: 0, research: 0, socialMedia: 0
      };
    }

    // Generate realist campaign calendar
    const calendar = CampaignDataParser.generateCalendar();

    const totalPrimaryDelegates = statesData.reduce((sum, contestState) => {
      return sum + (state.voterParty === 'Democrat' ? contestState.demDelegates : contestState.repDelegates);
    }, 0);
    const primaryTarget = Math.floor(totalPrimaryDelegates / 2) + 1;

    const opponents = SimulationEngine.createPrimaryRivals(state.difficulty, state.voterParty);

    set({
      states: statesData,
      campaignSpending: spending,
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
      debateStanding: { ...EMPTY_DEBATE_STANDING },
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
      ?? SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty);
    const rival = state.gamePhase === 'general'
      ? activeGeneralOpponent
      : getLeadRival(state.rivalAIs, state.difficulty);

    for (const s of state.states) {
      const playerSpending = state.campaignSpending[s.stateName] || { intAds: 0, tvAds: 0, mailers: 0, staff1: 0, staff2: 0, staff3: 0, visits: 0, groundGame: 0, research: 0, socialMedia: 0 };
      const poll = state.gamePhase === 'primary'
        ? SimulationEngine.generatePrimaryFieldProjection(
            effectivePlayerIdeology,
            s,
            playerSpending,
            state.momentum,
            state.publicTrust,
            state.rivalAIs,
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
      const current = state.campaignSpending[stateName] || { 
        intAds: 0, tvAds: 0, mailers: 0, 
        staff1: 0, staff2: 0, staff3: 0, 
        visits: 0, groundGame: 0, research: 0, socialMedia: 0
      };
      return {
        campaignSpending: {
          ...state.campaignSpending,
          [stateName]: { ...current, ...newStats }
        }
      };
    });
    get().runSimulation();
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
      debateStanding: state.debateStanding,
      states: state.states,
      campaignSpending: state.campaignSpending,
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
        const normalizedRivals = (parsed.rivalAIs ?? []).map((rival) => ({
          ...SimulationEngine.createRivalAI(parsed.difficulty ?? initialState.difficulty),
          ...rival,
          shortName: rival.shortName ?? rival.name?.split(' ').slice(-1)[0] ?? 'Rival',
          tagline: rival.tagline ?? 'Campaign rival',
          party: rival.party ?? (parsed.voterParty === 'Democrat' ? 'Democrat' : 'Republican'),
          delegates: rival.delegates ?? 0,
          supportBase: rival.supportBase ?? 8,
          status: rival.status ?? 'active',
          homeRegion: rival.homeRegion ?? 'South',
          endorsedCandidateId: rival.endorsedCandidateId ?? null
        }));
        const normalizedGeneralOpponent = parsed.generalOpponent
          ? {
              ...SimulationEngine.createGeneralOpponentAI(parsed.difficulty ?? initialState.difficulty, parsed.voterParty ?? initialState.voterParty),
              ...parsed.generalOpponent,
              shortName: parsed.generalOpponent.shortName ?? parsed.generalOpponent.name?.split(' ').slice(-1)[0] ?? 'Opponent',
              delegates: parsed.generalOpponent.delegates ?? 0,
              supportBase: parsed.generalOpponent.supportBase ?? 10,
              status: parsed.generalOpponent.status ?? 'nominee',
              endorsedCandidateId: parsed.generalOpponent.endorsedCandidateId ?? null
            }
          : null;

        set({
          ...initialState,
          ...parsed,
          hasStarted: true,
          calendar: restoredCalendar,
          calendarPhase: restoredCalendarPhase,
          activeEvent: null,
          activeDebate: parsed.activeDebate ?? null,
          debateStanding: parsed.debateStanding ?? { ...EMPTY_DEBATE_STANDING },
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
          slots.push({ slot: i, week: parsed.currentWeek, phase: parsed.gamePhase, date: parsed.savedAt || 'Unknown' });
        } catch {
          slots.push({ slot: i, week: 0, phase: 'corrupted', date: 'Error' });
        }
      } else {
        slots.push({ slot: i, week: 0, phase: 'empty', date: '' });
      }
    }
    return slots;
  },

  setHasStarted: (value: boolean) => set({ hasStarted: value }),

  resetGame: () => {
    set({
      ...initialState,
      rivalAIs: SimulationEngine.createPrimaryRivals('normal', initialState.voterParty),
      generalOpponent: null,
      primaryResults: {}
    });
  },

  advanceWeek: () => {
    const state = get();
    if (state.gamePhase === 'ended') return;

    // Modals block advance
    if (state.vpSelectionPending || state.activeEvent || state.activeDebate) return;

    const newLog: ActivityLogEntry[] = [...state.activityLog];
    const nextWeek = state.currentWeek + 1;
    const maxWeek = state.calendar.length;

    // Guard against overrun
    if (nextWeek > maxWeek) return;

    // ── Calendar phase lookup ──
    const calendarEntry = state.calendar[nextWeek - 1]; // 0-indexed
    const prevCalendarEntry = state.calendar[state.currentWeek - 1];
    const newCalendarPhase = calendarEntry.phase;
    const phaseChanged = prevCalendarEntry.phase !== newCalendarPhase;
    const scheduledDebate = getDebateScheduleForWeek(nextWeek);

    // ── Phase transition announcements ──
    let nextGamePhase: GameState['gamePhase'] = state.gamePhase;
    let triggerVPSelection = false;
    let newPlayerDelegates = state.playerDelegates;
    let newRivalDelegates = state.rivalDelegates;
    let nextDelegateTarget = state.delegateTarget;
    let nextEndReason: GameEndReason = state.endReason;
    const newContested = [...state.contestedStates];
    const updatedPrimaryResults = { ...state.primaryResults };
    let updatedGeneralOpponent = state.generalOpponent;

    if (phaseChanged) {
      if (newCalendarPhase === 'primary') {
        newLog.push({ week: nextWeek, message: `🗳️ Primary season begins! Iowa caucuses are approaching.`, type: 'info' });
      } else if (newCalendarPhase === 'convention') {
        // End of primary → convention
        const wonPrimary = newPlayerDelegates >= state.delegateTarget;
        if (wonPrimary) {
          nextGamePhase = 'general';
          triggerVPSelection = true;
          updatedGeneralOpponent = SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty);
          const totalEV = state.states.reduce((sum, s) => sum + s.delegatesOrEV, 0);
          nextDelegateTarget = Math.floor(totalEV / 2) + 1;
          newLog.push({
            week: nextWeek,
            message: `PRIMARY WON! You secured the nomination with ${newPlayerDelegates} delegates.`,
            type: 'positive'
          });
          newLog.push({
            week: nextWeek,
            message: `Convention week! Choose your running mate. General election target: ${nextDelegateTarget} EVs.`,
            type: 'info'
          });
          newLog.push({
            week: nextWeek,
            message: `Your likely general-election opponent is ${updatedGeneralOpponent.name}, ${updatedGeneralOpponent.tagline.toLowerCase()}.`,
            type: 'info'
          });
        } else {
          nextGamePhase = 'ended';
          nextEndReason = 'primary_loss';
          newLog.push({
            week: nextWeek,
            message: `Primary season is over. You fell short of the nomination with ${newPlayerDelegates} delegates.`,
            type: 'negative'
          });
        }
        /*
          ? `🎉 PRIMARY WON! You secured the nomination with ${newPlayerDelegates} delegates.`
          : `😬 Narrow primary win — you squeaked through with ${newPlayerDelegates} delegates.`,
          type: 'positive' });
        newLog.push({ week: nextWeek, message: `🏛️ Convention week! Choose your running mate. General election target: ${newTarget} EVs.`, type: 'info' });
        // Update delegate target to EV target for general
        set({ delegateTarget: newTarget });
        */
      } else if (newCalendarPhase === 'general') {
        newLog.push({
          week: nextWeek,
          message: `The General Election campaign begins${updatedGeneralOpponent ? ` against ${updatedGeneralOpponent.name}` : ''}. Election Day: November 5, 2024.`,
          type: 'info'
        });
      } else if (newCalendarPhase === 'election_day') {
        // ── ELECTION DAY — resolve all states at once ──
        nextGamePhase = 'ended';
        const projectedEV = computeEVTotals(state.states, state.pollingData);
        nextEndReason = projectedEV.playerEV >= nextDelegateTarget ? 'general_win' : 'general_loss';
        newLog.push({ week: nextWeek, message: `🗳️ ELECTION DAY — November 5, 2024. All polls are closed.`, type: 'event' });
      }
    }

    // ── Primary delegate awarding (every 2 weeks during primary phase) ──
    // Primary states are resolved later in the week after rival spending and dropout updates.

    // ── Trust decay (-1% per week) — Phase 4 #1 ──
    const trustLoss = newCalendarPhase === 'general' ? 4 : newCalendarPhase === 'primary' ? 3 : 2;
    let newTrust = Math.max(0, state.publicTrust - trustLoss);

    // ── Stamina decay (Phase 4 #5 - slowed down) ──
    let newStamina = state.stamina;
    const totalVisits = Object.values(state.campaignSpending).reduce((sum, s) => sum + (s.visits || 0), 0);
    const rallyFatigue = Math.min(14, totalVisits * 4);
    newStamina = Math.max(0, newStamina - 3 - rallyFatigue);
    if (state.hiredStaff.includes('pr_manager')) newStamina = Math.min(100, newStamina + 1);
    let endorsementMomentumBonus = 0;
    if (newStamina < 25) {
      newLog.push({ week: nextWeek, message: `⚠️ Campaign fatigue is setting in (stamina: ${newStamina}/100). Consider resting.`, type: 'negative' });
    }

    // ── Rival AI Turns ──
    let updatedRivals = state.rivalAIs.map(r => 
      SimulationEngine.runRivalAITurn(r, state.states, state.pollingData, state.difficulty)
    );

    if (nextGamePhase === 'general' && updatedGeneralOpponent) {
      updatedGeneralOpponent = SimulationEngine.runRivalAITurn(
        updatedGeneralOpponent,
        state.states,
        state.pollingData,
        state.difficulty
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
          state.campaignSpending[contestState.stateName] || { intAds: 0, tvAds: 0, mailers: 0, staff1: 0, staff2: 0, staff3: 0, visits: 0, groundGame: 0, research: 0, socialMedia: 0 },
          state.momentum,
          state.publicTrust,
          updatedRivals,
          contestStaffDiv,
          contestVisitMult,
          state.playerIssues,
          state.voterParty
        );

        const delegatesAtStake = state.voterParty === 'Democrat' ? contestState.demDelegates : contestState.repDelegates;
        const allocated = allocateProportionalDelegates(delegatesAtStake, [
          {
            candidateId: 'player',
            name: state.playerName,
            share: projection.player,
            delegates: 0,
            status: 'player'
          },
          ...projection.fieldShares
        ]);
        const playerAllocation = allocated.find((candidate) => candidate.candidateId === 'player');
        const playerDelegatesWon = playerAllocation?.delegates ?? 0;

        newContested.push(contestState.stateName);
        newPlayerDelegates += playerDelegatesWon;

        updatedRivals = updatedRivals.map((rival) => {
          const allocation = allocated.find((candidate) => candidate.candidateId === rival.id);
          return {
            ...rival,
            delegates: rival.delegates + (allocation?.delegates ?? 0)
          };
        });

        const rankedCandidates = [...allocated].sort((a, b) => b.share - a.share);
        const raceLeader = rankedCandidates[0];
        updatedPrimaryResults[contestState.stateName] = {
          stateName: contestState.stateName,
          week: nextWeek,
          playerShare: projection.player,
          playerDelegates: playerDelegatesWon,
          leaderName: raceLeader?.name ?? projection.leaderName,
          leaderShare: raceLeader?.share ?? projection.rival,
          fieldShares: rankedCandidates
        };

        newLog.push({
          week: nextWeek,
            message: `${contestState.stateName} primary: ${raceLeader?.name ?? 'Field leader'} led with ${(raceLeader?.share ?? projection.rival).toFixed(1)}%. You won ${playerDelegatesWon}/${delegatesAtStake} delegates.`,
            type: playerDelegatesWon >= Math.ceil(delegatesAtStake / 3) ? 'positive' : 'negative'
          });
      }

      const activeRivals = getOrderedRivals(updatedRivals).filter((rival) => rival.status !== 'withdrawn');
      if (nextWeek >= 38 && activeRivals.length > 2) {
        const trailingRival = [...activeRivals].reverse().find((rival) => rival.delegates < Math.max(120, activeRivals[0].delegates * 0.45));

        if (trailingRival) {
          const endorsementTargetId = pickEndorsementTarget(state.playerIdeology, 'player', updatedRivals, trailingRival);
          updatedRivals = updatedRivals.map((rival) => {
            if (rival.id === trailingRival.id) {
              return {
                ...rival,
                status: 'withdrawn',
                momentum: Math.max(12, rival.momentum - 10),
                endorsedCandidateId: endorsementTargetId
              };
            }

            if (rival.id === endorsementTargetId) {
              return {
                ...rival,
                supportBase: rival.supportBase + 6,
                momentum: Math.min(100, rival.momentum + 5)
              };
            }

            return rival;
          });

          if (endorsementTargetId === 'player') {
            endorsementMomentumBonus += 6;
            newTrust = clampStat(newTrust + 3);
            newLog.push({
              week: nextWeek,
              message: `${trailingRival.name} suspended their campaign and endorsed you, giving your coalition new life.`,
              type: 'positive'
            });
          } else {
            const endorsedRival = updatedRivals.find((rival) => rival.id === endorsementTargetId);
            newLog.push({
              week: nextWeek,
              message: `${trailingRival.name} suspended their campaign and endorsed ${endorsedRival?.name ?? 'another rival'}.`,
              type: 'negative'
            });
          }
        }
      }

      newRivalDelegates = getLeadRival(updatedRivals, state.difficulty).delegates;
    }

    if (nextGamePhase === 'primary') {
      newRivalDelegates = getLeadRival(updatedRivals, state.difficulty).delegates;
    }

    // ── Ad decay (10% per week) ──
    const newSpending = { ...state.campaignSpending };
    for (const sName in newSpending) {
      const s = { ...newSpending[sName] };
      s.tvAds = Math.floor((s.tvAds || 0) * 0.9);
      s.intAds = Math.floor((s.intAds || 0) * 0.9);
      s.mailers = Math.floor((s.mailers || 0) * 0.9);
      s.groundGame = Math.floor((s.groundGame || 0) * 0.9);
      s.socialMedia = Math.floor((s.socialMedia || 0) * 0.9);
      s.visits = 0; // Visits reset each week (one-time action)
      newSpending[sName] = s;
    }

    // ── Momentum decay (scales by phase) ──
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
    // Convention bounce
    const conventionBounce = (phaseChanged && newCalendarPhase === 'convention') ? 8 : 0;

    // ── Passive weekly income (based on momentum) ──
    const passiveIncome = Math.floor(8000 + (state.momentum / 100) * 18000);
    const weeklyOverhead = 24000 + (state.hiredStaff.length * 7000);
    const nextBudget = Math.max(0, state.budget + passiveIncome - weeklyOverhead);
    newLog.push({ week: nextWeek, message: `Fundraising: +$${(passiveIncome / 1000).toFixed(0)}K from small-dollar donors.`, type: 'info' });
    newLog.push({ week: nextWeek, message: `Operating costs: -$${(weeklyOverhead / 1000).toFixed(0)}K to keep the campaign running.`, type: 'negative' });

    // ── Pick event (or debate if scheduled) ──
    let randomEvent: CampaignEvent | null = null;
    let nextActiveDebate: ActiveDebate | null = null;
    if (nextGamePhase !== 'ended') {
      if (scheduledDebate) {
        const rivalNames = scheduledDebate.phase === 'general'
          ? [updatedGeneralOpponent?.name ?? getLeadRival(updatedRivals, state.difficulty).name]
          : getOrderedRivals(updatedRivals).map((rival) => rival.name);
        const debate = createActiveDebate(scheduledDebate, state.playerName, rivalNames);
        nextActiveDebate = debate;
        const debateStage = scheduledDebate.phase === 'primary'
          ? `Primary Debate ${scheduledDebate.sequence}`
          : `General Debate ${scheduledDebate.sequence}`;
        newLog.push({
          week: nextWeek,
          message: `Debate night: ${debateStage} at ${debate.venue}.`,
          type: 'event'
        });
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

    // ── Run rival AI turn ──
    // const updatedRival = nextGamePhase !== 'ended'
    //   ? SimulationEngine.runRivalAITurn(state.rivalAI, state.states, state.pollingData, state.difficulty)
    //   : state.rivalAI;

    // Log rival activity
    if (nextGamePhase !== 'ended') {
      const mainRival = getLeadRival(updatedRivals, state.difficulty);
      const prevMainRival = getLeadRival(state.rivalAIs, state.difficulty);
      if (mainRival && prevMainRival && mainRival.momentum > prevMainRival.momentum) {
        newLog.push({ week: nextWeek, message: `Rival campaign is gaining momentum (${mainRival.momentum}/100)`, type: 'negative' });
      }
    }

    // ── Autosave every 10 weeks ──
    if (nextWeek % 10 === 0 && nextGamePhase !== 'ended') {
      setTimeout(() => get().saveGame(2), 100);
      newLog.push({ week: nextWeek, message: `Autosaved.`, type: 'info' });
    }

    // ── Fundraising streak tracking (Phase 4 #2) ──
    // Does not update here, handled in addBudget. 
    // We just need to know if it's a NEW week starting to decay the streak?
    // User said: "fundraising is too easy, need to work more for that".
    // I'll make the streak persist but reset if they DON'T fundraise for a week.
    // wait, I already reset it in the set() call if I'm not careful.
    
    // Correct logic: streak only resets if they took NO money this week.
    // But advanceWeek is where we "end" the week.
    // I'll simplify: if they didn't fundraise in the PREVIOUS week, streak is 0.
    // But wait, addBudget updates the streak. 
    // I'll just keep it simple: if you fundraise multiple weeks in a row, you get the penalty.
    // I'll assume it's reset in advanceWeek if no fundraising happened.
    // I'll use a local tracker inside advanceWeek if needed.
    // Actually, I'll just leave it and fix the set() call.
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
      activeEvent: nextGamePhase === 'ended' || nextActiveDebate ? null : randomEvent,
      activeDebate: nextGamePhase === 'ended' ? null : nextActiveDebate,
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

    if (nextGamePhase !== 'ended') get().runSimulation();
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
    if (state.activeDebate) return;

    const calendarDebateWeek = phase === 'primary'
      ? state.calendar.find((entry) => entry.debatePhase === 'primary')?.week
      : state.calendar.find((entry) => entry.debatePhase === 'general')?.week;
    const debateEntry = getDebateScheduleForWeek(calendarDebateWeek ?? (phase === 'primary' ? 20 : 60));

    if (!debateEntry) return;

    const rivalNames = phase === 'general'
      ? [state.generalOpponent?.name ?? SimulationEngine.createGeneralOpponentAI(state.difficulty, state.voterParty).name]
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
