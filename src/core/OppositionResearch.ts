import type { CampaignSpendingData } from './CampaignDataParser';
import type { MediaChannelId } from './CampaignStrategy';
import type { RivalAI } from './SimulationEngine';

export type OppoLeadCategory =
  | 'ethics'
  | 'fundraising'
  | 'temperament'
  | 'management'
  | 'records'
  | 'ideology';

export type OppoLeadStatus = 'active' | 'released' | 'burned';

export interface OppoLead {
  id: string;
  title: string;
  summary: string;
  category: OppoLeadCategory;
  severity: number;
  credibility: number;
  backfireRisk: number;
  discoveredWeek: number;
  status: OppoLeadStatus;
  framing: string;
}

export interface RivalResearchFile {
  rivalId: string;
  rivalName: string;
  heat: number;
  dossierStrength: number;
  lastResearchWeek: number | null;
  lastReleaseWeek: number | null;
  leads: OppoLead[];
}

export interface ResearchCommissionResult {
  file: RivalResearchFile;
  discoveredLead: OppoLead | null;
  trustDelta: number;
  momentumDelta: number;
  summary: string;
}

export interface ResearchReleaseResult {
  file: RivalResearchFile;
  lead: OppoLead;
  outcome: 'breakthrough' | 'contained' | 'backfire';
  summary: string;
  playerTrustDelta: number;
  playerMomentumDelta: number;
  rivalTrustDelta: number;
  rivalMomentumDelta: number;
  rivalBudgetDelta: number;
  volunteerDelta: number;
  donorLane: 'small_donors' | 'activists' | 'business' | 'labor';
  mediaBoosts: Array<{ channelId: MediaChannelId; intensityDelta: number }>;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function buildLeadId(rivalId: string, week: number, category: OppoLeadCategory, sequence: number) {
  return `${rivalId}-${category}-${week}-${sequence}`;
}

function pickLeadCategory(rival: RivalAI): OppoLeadCategory {
  const text = `${rival.vulnerabilities.join(' ')} ${rival.strengths.join(' ')} ${rival.issueBrands.join(' ')}`.toLowerCase();

  if (text.includes('donor') || text.includes('finance') || text.includes('business')) return 'fundraising';
  if (text.includes('discipline') || text.includes('volatile') || text.includes('overreach')) return 'temperament';
  if (text.includes('managerial') || text.includes('organization') || text.includes('staff')) return 'management';
  if (text.includes('security') || text.includes('record') || text.includes('governor') || text.includes('senator')) return 'records';
  if (text.includes('ideolog') || text.includes('base') || text.includes('electability')) return 'ideology';
  return 'ethics';
}

function buildLeadCopy(rival: RivalAI, category: OppoLeadCategory) {
  const vulnerability = rival.vulnerabilities[0] ?? 'operational discipline';

  switch (category) {
    case 'fundraising':
      return {
        title: 'Bundler Paper Trail',
        summary: `${rival.name}'s donor network left a paper trail that reinforces the campaign's vulnerability on ${vulnerability.toLowerCase()}.`,
        framing: 'Frame it as insider finance and donor capture.'
      };
    case 'temperament':
      return {
        title: 'Temperament File',
        summary: `Former aides are describing a pattern of rash calls and preventable flare-ups inside ${rival.name}'s orbit.`,
        framing: 'Push the argument that the rival folds under pressure.'
      };
    case 'management':
      return {
        title: 'War Room Chaos Memo',
        summary: `A management memo suggests ${rival.name}'s campaign has recurring internal breakdowns, weak vetting, and high staff churn.`,
        framing: 'Make competence, not ideology, the story.'
      };
    case 'records':
      return {
        title: 'Record Contradiction Packet',
        summary: `Opposition researchers found a clean contrast between ${rival.name}'s current message and older statements on the record.`,
        framing: 'Use it to define the rival as slippery and opportunistic.'
      };
    case 'ideology':
      return {
        title: 'Base Fracture Brief',
        summary: `The dossier shows a gap between ${rival.name}'s coalition rhetoric and what key factions in the party actually want.`,
        framing: 'Split the rival from a critical lane of primary voters.'
      };
    default:
      return {
        title: 'Ethics Pressure File',
        summary: `The research desk has assembled a credible ethics contrast around ${rival.name}'s soft spot on ${vulnerability.toLowerCase()}.`,
        framing: 'Keep the contrast narrow, verified, and relentless.'
      };
  }
}

function replaceOrAppendLead(leads: OppoLead[], lead: OppoLead) {
  const existingIndex = leads.findIndex((entry) => entry.category === lead.category && entry.status === 'active');

  if (existingIndex === -1) {
    return [lead, ...leads].slice(0, 5);
  }

  const existing = leads[existingIndex];
  if (existing.credibility >= lead.credibility && existing.severity >= lead.severity) {
    return leads;
  }

  const next = [...leads];
  next[existingIndex] = lead;
  return next;
}

export function createOppositionResearchBoard(rivals: RivalAI[]): Record<string, RivalResearchFile> {
  return Object.fromEntries(
    rivals.map((rival) => [
      rival.id,
      {
        rivalId: rival.id,
        rivalName: rival.name,
        heat: 0,
        dossierStrength: 18 + Math.round(rival.scandalRisk / 3.5),
        lastResearchWeek: null,
        lastReleaseWeek: null,
        leads: []
      } satisfies RivalResearchFile
    ])
  );
}

export function getNationalResearchPressure(campaignSpending: Record<string, CampaignSpendingData>) {
  const totalResearch = Object.values(campaignSpending).reduce((sum, spending) => sum + (spending.research || 0), 0);
  return clamp(Math.log10(totalResearch + 1) * 3.4, 0, 12);
}

export function ageOppositionResearch(
  board: Record<string, RivalResearchFile>,
  currentWeek: number
): Record<string, RivalResearchFile> {
  return Object.fromEntries(
    Object.entries(board).map(([rivalId, file]) => {
      const agedLeads = file.leads.map((lead) => {
        if (lead.status !== 'active') {
          return lead;
        }

        const age = currentWeek - lead.discoveredWeek;
        const credibilityLoss = age >= 14 ? 8 : age >= 9 ? 4 : age >= 6 ? 2 : 0;
        const nextCredibility = clamp(lead.credibility - credibilityLoss);
        const shouldBurn = age >= 16 && nextCredibility <= 34;

        return {
          ...lead,
          credibility: nextCredibility,
          status: shouldBurn ? 'burned' as OppoLeadStatus : lead.status
        };
      });

      return [
        rivalId,
        {
          ...file,
          heat: clamp(file.heat - 6),
          leads: agedLeads
        }
      ];
    })
  );
}

export function commissionOppositionResearch(
  file: RivalResearchFile,
  rival: RivalAI,
  week: number,
  playerTrust: number,
  researchPressure: number
): ResearchCommissionResult {
  const discoveryChance = 0.22
    + (rival.scandalRisk / 280)
    + (researchPressure / 30)
    + Math.max(0, 55 - playerTrust) / 260
    - (rival.messageDiscipline / 330);
  const foundLead = Math.random() < discoveryChance;

  if (!foundLead) {
    return {
      file: {
        ...file,
        heat: clamp(file.heat + 4),
        dossierStrength: clamp(file.dossierStrength + 2),
        lastResearchWeek: week
      },
      discoveredLead: null,
      trustDelta: 0,
      momentumDelta: 1,
      summary: `Your research desk spent the week on ${rival.name} and surfaced fragments, but nothing clean enough to land publicly yet.`
    };
  }

  const category = pickLeadCategory(rival);
  const copy = buildLeadCopy(rival, category);
  const credibility = clamp(
    42
      + Math.round(Math.random() * 20)
      + Math.round(researchPressure * 2.4)
      + Math.round(rival.scandalRisk / 3.5)
      - Math.round(rival.messageDiscipline / 7.5),
    26,
    92
  );
  const severity = clamp(
    34
      + Math.round(Math.random() * 16)
      + Math.round(rival.attackPower / 6)
      + Math.round(rival.scandalRisk / 2.8),
    24,
    94
  );
  const backfireRisk = clamp(
    18
      + Math.round((100 - credibility) * 0.45)
      + Math.round(file.heat / 3.5)
      + Math.round(rival.messageDiscipline / 10)
      - Math.round(researchPressure * 1.7),
    8,
    82
  );
  const lead: OppoLead = {
    id: buildLeadId(rival.id, week, category, file.leads.length + 1),
    title: copy.title,
    summary: copy.summary,
    category,
    severity,
    credibility,
    backfireRisk,
    discoveredWeek: week,
    status: 'active',
    framing: copy.framing
  };

  return {
    file: {
      ...file,
      heat: clamp(file.heat + 7),
      dossierStrength: clamp(file.dossierStrength + Math.round((credibility + severity) / 14)),
      lastResearchWeek: week,
      leads: replaceOrAppendLead(file.leads, lead)
    },
    discoveredLead: lead,
    trustDelta: credibility >= 70 ? 1 : 0,
    momentumDelta: severity >= 70 ? 2 : 1,
    summary: `Opposition researchers opened a live contrast file on ${rival.name}: ${copy.title.toLowerCase()}.`
  };
}

export function releaseOppositionHit(
  file: RivalResearchFile,
  lead: OppoLead,
  rival: RivalAI,
  playerTrust: number,
  rapidResponseIntensity: number,
  researchPressure: number,
  week: number
): ResearchReleaseResult {
  const backfireChance = clamp(
    (lead.backfireRisk * 0.56)
      + (file.heat * 0.3)
      + Math.max(0, 54 - playerTrust) * 0.72
      + (rival.messageDiscipline * 0.16)
      - (rapidResponseIntensity * 0.35)
      - (researchPressure * 1.8),
    6,
    86
  ) / 100;
  const containedChance = clamp(
    0.18
      + Math.max(0, 68 - lead.credibility) / 240
      + Math.max(0, 64 - lead.severity) / 320
      + Math.max(0, rival.messageDiscipline - 70) / 260,
    0.08,
    0.34
  );
  const roll = Math.random();

  const donorLane = lead.category === 'fundraising'
    ? 'small_donors'
    : lead.category === 'management'
      ? 'labor'
      : lead.category === 'ideology'
        ? 'activists'
        : 'business';

  if (roll < backfireChance) {
    return {
      file: {
        ...file,
        heat: clamp(file.heat + 18),
        lastReleaseWeek: week,
        leads: file.leads.map((entry) => entry.id === lead.id ? { ...entry, status: 'burned' } : entry)
      },
      lead: { ...lead, status: 'burned' },
      outcome: 'backfire',
      summary: `${rival.name} blunted your hit, reporters questioned the sourcing, and the story snapped back on your campaign.`,
      playerTrustDelta: -7,
      playerMomentumDelta: -4,
      rivalTrustDelta: 2,
      rivalMomentumDelta: 3,
      rivalBudgetDelta: 25000,
      volunteerDelta: -35,
      donorLane,
      mediaBoosts: [{ channelId: 'rapid_response', intensityDelta: 2 }]
    };
  }

  if (roll < backfireChance + containedChance) {
    return {
      file: {
        ...file,
        heat: clamp(file.heat + 13),
        lastReleaseWeek: week,
        leads: file.leads.map((entry) => entry.id === lead.id ? { ...entry, status: 'released' } : entry)
      },
      lead: { ...lead, status: 'released' },
      outcome: 'contained',
      summary: `${rival.name} took a bruise from the release, but the campaign contained most of the fallout before it became a full collapse.`,
      playerTrustDelta: -1,
      playerMomentumDelta: 1,
      rivalTrustDelta: -(4 + Math.round(lead.severity / 24)),
      rivalMomentumDelta: -(2 + Math.round(lead.credibility / 36)),
      rivalBudgetDelta: -(26000 + Math.round(lead.severity * 900)),
      volunteerDelta: 22,
      donorLane,
      mediaBoosts: [{ channelId: 'earned_media', intensityDelta: 3 }]
    };
  }

  return {
    file: {
      ...file,
      heat: clamp(file.heat + 15),
      dossierStrength: clamp(file.dossierStrength + 5),
      lastReleaseWeek: week,
      leads: file.leads.map((entry) => entry.id === lead.id ? { ...entry, status: 'released' } : entry)
    },
    lead: { ...lead, status: 'released' },
    outcome: 'breakthrough',
    summary: `${lead.title} landed cleanly, and ${rival.name} is spending the week trying to stop the bleed.`,
    playerTrustDelta: 2,
    playerMomentumDelta: 4,
    rivalTrustDelta: -(6 + Math.round(lead.severity / 16)),
    rivalMomentumDelta: -(4 + Math.round(lead.credibility / 22)),
    rivalBudgetDelta: -(52000 + Math.round(lead.severity * 1300)),
    volunteerDelta: 48,
    donorLane,
    mediaBoosts: [
      { channelId: 'earned_media', intensityDelta: 5 },
      { channelId: 'rapid_response', intensityDelta: 3 }
    ]
  };
}
