import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getPrimaryRuleProfile } from '../core/PrimaryRules';
import './StateActionPanel.css';

interface Props {
  stateName: string;
  onClose: () => void;
}

export const StateActionPanel: React.FC<Props> = ({ stateName, onClose }) => {
  const { states, pollingData, campaignSpending, spendBudget, setSpending, budget, gamePhase, voterParty, stamina, generalOpponent } = useGameStore();

  const stateData = states.find(s => s.stateName.toLowerCase() === stateName.toLowerCase());
  const polls = pollingData[stateData?.stateName || stateName];
  const spendingVars = campaignSpending[stateName] || {
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
  const costMultiplier = 0.5 + (stateData ? stateData.delegatesOrEV : 10) / 15.0;

  if (!stateData || !polls) {
    return (
      <aside className="glass-panel stats-panel">
        <p>Simulation data not ready for this state.</p>
        <button onClick={onClose} className="action-btn">Close</button>
      </aside>
    );
  }

  const delegatesAtStake = gamePhase === 'primary'
    ? voterParty === 'Democrat' ? stateData.demDelegates : stateData.repDelegates
    : stateData.delegatesOrEV;
  const ruleProfile = gamePhase === 'primary'
    ? getPrimaryRuleProfile(stateData, voterParty)
    : null;
  const turnout = polls.turnout || 60;
  
  const handleSpend = (type: keyof typeof spendingVars, baseCost: number, amount: number) => {
    const finalCost = Math.round(baseCost * costMultiplier);
    if (spendBudget(finalCost)) {
      setSpending(stateName, { [type]: spendingVars[type as keyof typeof spendingVars] + amount });
      if (type === 'visits') {
        useGameStore.setState((current) => ({
          stamina: Math.max(0, current.stamina - 5)
        }));
      }
    }
  };

  const formatCost = (base: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(Math.round(base * costMultiplier));
  };

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(budget);

  return (
    <aside className="glass-panel stats-panel state-action-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-accent)' }}>{stateName}</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      
      <p style={{ margin: '0 0 1rem 0', opacity: 0.7, fontSize: '0.9rem' }}>
        {delegatesAtStake} {gamePhase === 'primary' ? 'Delegates' : 'Electoral Votes'}
      </p>

      {ruleProfile && (
        <div className="rule-panel">
          <div className="rule-panel-title">Delegate Rules</div>
          <p>{ruleProfile.summary}</p>
          <div className="rule-panel-grid">
            <span>{ruleProfile.districtDelegates} district delegates</span>
            <span>{ruleProfile.statewideDelegates} statewide delegates</span>
            {ruleProfile.threshold > 0 && <span>{ruleProfile.threshold}% viability threshold</span>}
            {ruleProfile.winnerTakeAllTrigger !== undefined && ruleProfile.winnerTakeAllTrigger > 0 && (
              <span>{ruleProfile.winnerTakeAllTrigger}% sweep trigger</span>
            )}
          </div>
        </div>
      )}

      {/* State Polling Snapshot */}
      <div className="stat-card" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card-title">Projected Polling</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
          <span>Your Campaign</span>
          <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>{polls.player.toFixed(1)}%</span>
        </div>
        <div className="progress-bar-bg" style={{ marginBottom: '0.5rem' }}>
          <div className="progress-bar-fill" style={{ width: `${polls.player}%`, background: 'var(--primary-accent)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
          <span>{gamePhase === 'general' ? (generalOpponent?.shortName ?? generalOpponent?.name ?? 'Opponent') : 'Lead Rival'}</span>
          <span style={{ color: 'var(--secondary-accent)', fontWeight: 'bold' }}>{polls.rival.toFixed(1)}%</span>
        </div>
        <div className="progress-bar-bg" style={{ marginBottom: '0.5rem' }}>
          <div className="progress-bar-fill" style={{ width: `${polls.rival}%`, background: 'var(--secondary-accent)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
          <span>Undecided</span>
          <span style={{ color: 'var(--text-muted)' }}>{polls.undecided.toFixed(1)}%</span>
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Projected Turnout</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{turnout.toFixed(1)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ 
              width: `${turnout}%`, 
              background: 'linear-gradient(90deg, #d29922, #2ea043)' 
            }}></div>
          </div>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
        Campaign Actions
      </h4>
      <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Available Funds: <strong style={{ color: '#2ea043' }}>{formattedBudget}</strong></p>
      
      <div style={{ background: 'rgba(210, 153, 34, 0.1)', border: '1px solid rgba(210, 153, 34, 0.3)', padding: '0.5rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.75rem', color: '#d29922' }}>
        <strong>⚠️ Ad Decay:</strong> Your active ad spend and ground game impact decays by ~10% each week. Reinvest to maintain your grip on this state.
      </div>

      <div className="action-buttons-list">
        <button 
          className="spend-btn" 
          disabled={budget < (50000 * costMultiplier)}
          onClick={() => handleSpend('tvAds', 50000, 1000)}
        >
          <div className="spend-info">
            <span className="spend-title">Run TV Ads</span>
            <span className="spend-cost">{formatCost(50000)}</span>
          </div>
          <div className="spend-desc">Broad reach, massive impact. (Current: {spendingVars.tvAds / 1000} units)</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < (10000 * costMultiplier)}
          onClick={() => handleSpend('intAds', 10000, 500)}
        >
          <div className="spend-info">
            <span className="spend-title">Internet Ads</span>
            <span className="spend-cost">{formatCost(10000)}</span>
          </div>
          <div className="spend-desc">Targeted, efficient growth. (Current: {spendingVars.intAds / 500} units)</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < (20000 * costMultiplier) || stamina < 5}
          onClick={() => handleSpend('visits', 20000, 1)}
        >
          <div className="spend-info">
            <span className="spend-title">Hold Local Rally</span>
            <span className="spend-cost">{formatCost(20000)} <span style={{ color: '#f85149', fontSize: '0.75rem', marginLeft: '4px' }}>(-5 Stamina)</span></span>
          </div>
          <div className="spend-desc">Direct voter engagement. (Current: {spendingVars.visits} rallies)</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < (40000 * costMultiplier)}
          onClick={() => handleSpend('groundGame', 40000, 1000)}
        >
          <div className="spend-info">
            <span className="spend-title">Ground Game / Canvassing</span>
            <span className="spend-cost">{formatCost(40000)}</span>
          </div>
          <div className="spend-desc">Increases base turnout and local loyalty.</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < (60000 * costMultiplier)}
          onClick={() => handleSpend('socialMedia', 60000, 2000)}
        >
          <div className="spend-info">
            <span className="spend-title">Social Media Blitz</span>
            <span className="spend-cost">{formatCost(60000)}</span>
          </div>
          <div className="spend-desc">Amplifies momentum effects on polls.</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < (100000 * costMultiplier)}
          onClick={() => handleSpend('research', 100000, 5000)}
        >
          <div className="spend-info">
            <span className="spend-title">Opposition Research</span>
            <span className="spend-cost">{formatCost(100000)}</span>
          </div>
          <div className="spend-desc">Penalizes rival performance in this state.</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < (15000 * costMultiplier)}
          onClick={() => handleSpend('mailers', 15000, 500)}
        >
          <div className="spend-info">
            <span className="spend-title">Send Mailers</span>
            <span className="spend-cost">{formatCost(15000)}</span>
          </div>
          <div className="spend-desc">Targeted direct mail. (Current: {spendingVars.mailers / 500} batches)</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < 25000}
          onClick={() => handleSpend('staff1', 25000, 1)}
        >
          <div className="spend-info">
            <span className="spend-title">Hire Regional Director</span>
            <span className="spend-cost">$25,000</span>
          </div>
          <div className="spend-desc">Boosts effectiveness of mailers and rallies. (Current: {spendingVars.staff1} hired)</div>
        </button>

        <button 
          className="spend-btn" 
          disabled={budget < 30000}
          onClick={() => handleSpend('staff2', 30000, 1)}
        >
          <div className="spend-info">
            <span className="spend-title">Hire Media Liaison</span>
            <span className="spend-cost">$30,000</span>
          </div>
          <div className="spend-desc">Boosts effectiveness of all ad spending. (Current: {spendingVars.staff2} hired)</div>
        </button>
      </div>

    </aside>
  );
};
