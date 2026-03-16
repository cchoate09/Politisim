import { ElectionMath, type PlayerDemographics } from './ElectionMath';
import type { StateElectionData, CampaignSpendingData } from './CampaignDataParser';

export interface PollingData {
  player: number;  // 0-100 percentage
  rival: number;   // 0-100 percentage
  undecided: number; // 0-100 percentage
  turnout: number; // 0-100 percentage
}

export interface RivalAI {
  name: string;
  budget: number;
  difficulty: 'easy' | 'normal' | 'hard';
  momentum: number;
  spending: Record<string, CampaignSpendingData>;
  ideology: PlayerDemographics;
}


export class SimulationEngine {

  /**
   * Generates a default rival AI state. Called once at campaign init.
   */
  static createRivalAI(level: 'easy' | 'normal' | 'hard'): RivalAI {
    const budgetMap = {
      easy: 600000,
      normal: 1200000,
      hard: 2500000
    };
    return {
      name: 'Rival Candidate',
      budget: budgetMap[level],
      difficulty: level,
      momentum: 20,
      spending: {},
      ideology: {
        liberal: level === 'hard' ? 20 : 30,
        libertarian: level === 'hard' ? 80 : 70,
        owner: 85,
        worker: 40,
        religious: 70,
        immigrant: 20
      }
    };
  }

  /**
   * Runs the rival AI's weekly turn: picks top swing states and allocates spending.
   */
  static runRivalAITurn(
    rival: RivalAI, // Changed type from RivalAIState to RivalAI
    states: StateElectionData[],
    currentPolling: Record<string, PollingData>,
    difficulty: 'easy' | 'normal' | 'hard'
  ): RivalAI { // Changed return type from RivalAIState to RivalAI
    const weeklyIncome = {
      easy: 50000,
      normal: 120000,
      hard: 350000
    };

    rival.budget += weeklyIncome[rival.difficulty]; // Use rival.difficulty
    let newBudget = rival.budget; // newBudget should start from the updated rival.budget

    // Sort states by how close the race is (target swing states)
    const targetStates = [...states].sort((a, b) => {
      const pA = currentPolling[a.stateName];
      const pB = currentPolling[b.stateName];
      if (!pA || !pB) return 0;
      const marginA = Math.abs(pA.player - pA.rival);
      const marginB = Math.abs(pB.player - pB.rival);
      // On hard, also counter-target states player leads
      if (difficulty === 'hard') {
        const playerLeadA = pA.player > pA.rival ? (pA.player - pA.rival) : 0;
        const playerLeadB = pB.player > pB.rival ? (pB.player - pB.rival) : 0;
        return playerLeadB - playerLeadA; // Target where player leads most
      }
      return marginA - marginB; // Target closest races
    });

    const newSpending: Record<string, CampaignSpendingData> = {};
    // Deep-copy existing spending to avoid mutation
    for (const [key, val] of Object.entries(rival.spending)) {
      newSpending[key] = { ...val };
    }
    const numTargets = difficulty === 'easy' ? 3 : difficulty === 'normal' ? 5 : 8;
    const spendPerState = Math.floor(newBudget * 0.6 / numTargets);

    // Cap per-state spending to simulate diminishing returns for AI
    const maxPerField = difficulty === 'hard' ? 500000 : 300000;

    for (let i = 0; i < Math.min(numTargets, targetStates.length); i++) {
      const state = targetStates[i];
      const sName = state.stateName;
      const current = { ...(newSpending[sName] || { 
        intAds: 0, tvAds: 0, mailers: 0, 
        staff1: 0, staff2: 0, staff3: 0, 
        visits: 0, groundGame: 0, socialMedia: 0, research: 0 
      }) };

      // AI scales spending by state size (Tier 4 #3)
      const evScale = Math.sqrt(state.delegatesOrEV || 1) / 3.0; // Moderate scaling
      const scaledSpend = spendPerState * evScale;

      current.tvAds = Math.min(maxPerField, current.tvAds + scaledSpend * 0.4);
      current.intAds = Math.min(maxPerField, current.intAds + scaledSpend * 0.3);
      current.mailers = Math.min(maxPerField, current.mailers + scaledSpend * 0.2);
      current.groundGame = Math.min(maxPerField, current.groundGame + scaledSpend * 0.1);
      current.visits += 1;
      newSpending[sName] = current;
      newBudget -= scaledSpend;
    }

    // Momentum grows slowly on hard
    const momentumGain = difficulty === 'hard' ? 3 : difficulty === 'normal' ? 1 : 0;

    return {
      ...rival,
      budget: Math.max(0, newBudget),
      momentum: Math.min(100, rival.momentum + momentumGain),
      spending: newSpending
    };
  }

  static generateStatePolling(
    playerIdeology: PlayerDemographics,
    stateData: StateElectionData,
    playerSpending: CampaignSpendingData,
    playerMomentum: number,
    publicTrust: number,
    rivalAI: RivalAI,
    globalStaffDiv: number = 2.0,
    globalVisitMult: number = 1.0,
    playerIssues: string[] = [], // Optional focus issues
    playerParty: 'Democrat' | 'Republican' = 'Democrat' // DEFAULTING to Democrat if not passed
  ): PollingData & { turnout: number } {
    // 1. Calculate Base Scores with Issue Alignment
    const playerBase = ElectionMath.calculateBaseScore(playerIdeology, stateData, playerIssues);
    const rivalBase = ElectionMath.calculateBaseScore(rivalAI.ideology, stateData, []); // AI default issues empty for now

    // 2. Apply spending bonuses
    const playerTotalScore = ElectionMath.applyCampaignBonuses(playerBase, stateData, playerSpending, globalStaffDiv, globalVisitMult);

    const rivalSpending = rivalAI.spending[stateData.stateName] || { 
      intAds: 0, tvAds: 0, mailers: 0, 
      staff1: 0, staff2: 0, staff3: 0, 
      visits: 0, groundGame: 0, socialMedia: 0, research: 0 
    };
    const rivalTotalScore = ElectionMath.applyCampaignBonuses(rivalBase, stateData, rivalSpending, 2.0, 1.0);

    // 3. Calculate Turnout (Tier 4 #1)
    const stateTurnout = ElectionMath.calculateTurnout(
      stateData, 
      (playerSpending.groundGame || 0) + (rivalSpending.groundGame || 0), 
      playerMomentum + rivalAI.momentum
    );

    // 4. Apply Momentum/Trust/Lean modifiers
    const trustMultiplier = 0.5 + (publicTrust / 100) * 0.7;
    const playerMomentumBonus = playerMomentum > 50 ? 5 : 0;
    const rawMomentumBoost = Math.floor(playerMomentum / 10);

    // ── Partisan Lean Implementation ──
    // Positive lean = Democratic advantage, Negative lean = Republican advantage
    let leanAdjustment = 0;
    if (stateData.partisanLean !== undefined) {
      if (playerParty === 'Democrat') {
        leanAdjustment = stateData.partisanLean;
      } else {
        leanAdjustment = -stateData.partisanLean; // Republican flips the sign
      }
    }

    // 5. Normalize to Percentages
    // Lean adjustment is applied as a weight shift
    const finalPlayerScore = (playerTotalScore * trustMultiplier) + Math.max(0, leanAdjustment);
    const finalRivalScore = rivalTotalScore + Math.max(0, -leanAdjustment);

    const totalScore = finalPlayerScore + finalRivalScore;
    if (totalScore <= 0) {
      return { player: 33, rival: 33, undecided: 34, turnout: stateTurnout };
    }

    let undecided = 15;
    let playerPct = ((finalPlayerScore / totalScore) * (100 - undecided)) + rawMomentumBoost + playerMomentumBonus;
    let rivalPct = ((finalRivalScore / totalScore) * (100 - undecided)) + (rivalAI.momentum / 10);

    // 6. Polling Error / Stochastic Noise (Tier 4 #5)
    // Add ±4% noise + specific polling error that decreases as weeks pass
    const noise = (Math.random() - 0.5) * 8;
    playerPct += noise;

    // Rebalance
    if (playerPct + rivalPct > 100) {
      const scale = 100 / (playerPct + rivalPct);
      playerPct *= scale;
      rivalPct *= scale;
      undecided = 0;
    } else {
      undecided = 100 - playerPct - rivalPct;
    }

    return {
      player: Math.max(0, Math.min(100, playerPct)),
      rival: Math.max(0, Math.min(100, rivalPct)),
      undecided: Math.max(0, Math.min(100, undecided)),
      turnout: stateTurnout
    };
  }
}
