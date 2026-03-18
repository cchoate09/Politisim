import type { PlayerDemographics } from './ElectionMath';
import type { DonorBlocId, MediaChannelId } from './CampaignStrategy';

export type RivalDebateStyle = 'attacker' | 'reassurer' | 'wonk' | 'outsider' | 'dodger';
export type RivalTemperament = 'disciplined' | 'charismatic' | 'volatile' | 'technocrat' | 'retail';
export type RivalFieldStrategy = 'regional' | 'delegate' | 'turnout' | 'battleground' | 'airwar' | 'insurgent';

export interface CampaignEventChoice {
  text: string;
  moneyEffect: number;
  momentumEffect: number;
  trustEffect: number;
  staminaEffect?: number;
  volunteerEffect?: number;
  donorEffects?: Array<{ blocId: DonorBlocId; relationshipDelta: number; energyDelta: number }>;
  mediaEffects?: Array<{ channelId: MediaChannelId; intensityDelta: number }>;
  rivalId?: string | null;
  rivalMomentumEffect?: number;
  rivalTrustEffect?: number;
  rivalBudgetEffect?: number;
  tags?: string[];
  logLine?: string;
}

export interface CampaignEvent {
  title: string;
  description: string;
  phase?: 'primary' | 'general' | 'any';
  choices: CampaignEventChoice[];
}

export interface VPCandidate {
  id: string;
  name: string;
  title: string;
  description: string;
  party: 'Democrat' | 'Republican';
  homeRegion: string;
  homeStates: string[];
  issueFocus: string[];
  strengths: string[];
  liabilities: string[];
  bonuses: Partial<PlayerDemographics>;
  momentumBonus: number;
  trustBonus: number;
  budgetBonus: number;
  volunteerBonus: number;
  turnoutBonus: number;
  debateBonus: number;
  regionalLift: number;
  battlegroundLift: number;
  donorLanes: DonorBlocId[];
  mediaLanes: MediaChannelId[];
  surrogatePower?: number;
}

export interface ScenarioRivalProfile {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  homeRegion: string;
  supportBase: number;
  momentum: number;
  trust: number;
  ideology: PlayerDemographics;
  fieldStrategy: RivalFieldStrategy;
  issueBrands: string[];
  strengths: string[];
  vulnerabilities: string[];
  debateStyle: RivalDebateStyle;
  temperament: RivalTemperament;
  donorLanes: DonorBlocId[];
  mediaLanes: MediaChannelId[];
  attackPower: number;
  organizationPower: number;
  messageDiscipline: number;
  scandalRisk: number;
  earnedMediaSkill: number;
}
