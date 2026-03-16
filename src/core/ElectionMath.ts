import type { StateElectionData, CampaignSpendingData } from './CampaignDataParser';

export interface PlayerDemographics {
  liberal: number;
  libertarian: number;
  owner: number;
  worker: number;
  religious: number;
  immigrant: number;
}
export class ElectionMath {
  /**
   * Calculates the base ideology score based on the multipliers and state-specific issues.
   */
  static calculateBaseScore(
    playerStats: PlayerDemographics, 
    stateData: StateElectionData,
    playerIssues: string[] = [] // New: Player's focus issues
  ): number {
    let score = Math.max(0, playerStats.liberal * stateData.liberal) + 
                  Math.max(0, playerStats.libertarian * stateData.libertarian) + 
                  Math.max(0, playerStats.owner * stateData.owner) + 
                  Math.max(0, playerStats.worker * stateData.worker) + 
                  Math.max(0, playerStats.religious * stateData.religious) + 
                  Math.max(0, playerStats.immigrant * stateData.immigrant);
    
    // Issue Alignment Bonus (Phase 1 #2)
    let issueBonus = 1.0;
    if (stateData.topIssues && playerIssues.length > 0) {
      const matches = stateData.topIssues.filter(i => playerIssues.includes(i)).length;
      issueBonus = 1.0 + (matches * 0.15); // +15% per matching issue
    }

    // Partisan Lean Bonus (Positive = Dem, Negative = Rep)
    // We increase the base score directly before normalization in SimulationEngine
    if (stateData.partisanLean !== undefined) {
      // The store will decide if this lean helps or hurts the player
    }

    return Math.max(1, (score / 2.0) * issueBonus);
  }

  /**
   * Calculates voter turnout based on state base turnout and campaign activity.
   */
  static calculateTurnout(stateData: StateElectionData, groundGame: number, momentum: number): number {
    // Base turnout is boosted by ground game and momentum
    const groundBonus = Math.log(Math.max(1, groundGame) + 1) * 2;
    const momentumBonus = momentum / 20.0;
    
    const totalTurnout = stateData.baseTurnout + groundBonus + momentumBonus;
    return Math.min(100, Math.max(30, totalTurnout));
  }

  /**
   * Adds the effect of campaign spending (Ads, Staff, Visits) to the base score.
   */
  static applyCampaignBonuses(
    baseScore: number, 
    stateData: StateElectionData, 
    spending: CampaignSpendingData, 
    staffDiv: number, 
    visitMult: number
  ): number {
    let score = baseScore;

    // Internet Ads Bonus (Persuasion)
    score += Math.log(Math.max(1, spending.intAds) * (Math.max(1, spending.staff2 || 1) / staffDiv) * 
             (2 * stateData.liberal + stateData.libertarian + stateData.owner) / 100.0);
    
    // TV Ads Bonus (Persuasion)
    score += Math.log(Math.max(1, spending.tvAds) * (Math.max(1, spending.staff2 || 1) / staffDiv) * 
             (stateData.liberal + 2 * stateData.libertarian + stateData.owner) / 100.0);
    
    // Mailers Bonus (Targeted Persuasion)
    score += Math.log(Math.max(1, spending.mailers) * (Math.max(1, spending.staff1 || 1) / staffDiv) * 
             (stateData.liberal + stateData.libertarian + 2 * stateData.owner) / 100.0);
    
    // Visits Bonus (Direct Impact) — BUFFED from visitMult to visitMult * 2.0
    score += (spending.visits * visitMult * 2.0);

    // Social Media Influence
    score += Math.log(Math.max(1, spending.socialMedia || 0) + 1) * 2;

    // Base Staff Bonus
    score += (spending.staff1 / staffDiv);

    return Math.max(1, score);
  }
}
