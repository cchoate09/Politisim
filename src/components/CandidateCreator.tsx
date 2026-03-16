import React, { useState, useEffect } from 'react';
import './CandidateCreator.css';
import { useGameStore } from '../store/gameStore';
import type { PlayerDemographics } from '../core/ElectionMath';

const MAX_POINTS = 300;

export const CandidateCreator: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { playerIdeology } = useGameStore();

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [traits, setTraits] = useState<PlayerDemographics>(playerIdeology);
  const [pointsRemaining, setPointsRemaining] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  useEffect(() => {
    const totalSpent = Object.values(traits).reduce((acc, val) => acc + val, 0);
    setPointsRemaining(MAX_POINTS - totalSpent);
  }, [traits]);

  const adjustTrait = (key: keyof PlayerDemographics, amount: number) => {
    setTraits(prev => {
      const newValue = prev[key] + amount;
      if (newValue < 0 || newValue > 100) return prev;
      if (amount > 0 && pointsRemaining <= 0) return prev;
      return { ...prev, [key]: newValue };
    });
  };

  const calculateArchetype = () => {
    if (traits.owner > 70 && traits.libertarian > 60) return "Corporate Libertarian";
    if (traits.worker > 70 && traits.liberal > 60) return "Progressive Populist";
    if (traits.religious > 70 && traits.owner > 50) return "Traditional Conservative";
    if (traits.liberal > 50 && traits.worker > 50 && traits.owner > 40) return "Establishment Moderate";
    if (traits.immigrant > 60 && traits.liberal > 50) return "Reform Democrat";
    return "Unorthodox Outsider";
  };

  const TRAIT_TOOLTIPS: Record<string, string> = {
    liberal: "Appeal to progressive social policies. High values boost you in blue states like California and New York.",
    libertarian: "Appeal to personal freedom and small government. Strong in mountain west and rural states.",
    owner: "Appeal to business owners and entrepreneurs. Helps in wealthy suburban districts.",
    worker: "Appeal to working-class communities. Critical in Rust Belt swing states.",
    religious: "Appeal to faith-based voters. Dominant in the South and parts of the Midwest.",
    immigrant: "Appeal to immigrant communities. Powerful in border states and diverse metros."
  };

  const handleStartCampaign = async () => {
    useGameStore.setState({
      playerIdeology: traits,
      playerName: name || 'Candidate',
      difficulty: difficulty,
      playerIssues: selectedIssues
    });
    const { CampaignDataParser } = await import('../core/CampaignDataParser');
    const states = await CampaignDataParser.loadModData('vanilla');
    useGameStore.getState().initializeCampaign(states);
    onComplete();
  };

  return (
    <div className="candidate-creator">
      <div className="creator-header">
        <h2>Establish Your Platform</h2>
        <p>Define your candidate's name, choose a difficulty, and distribute ideology points.</p>
      </div>

      <div className="creator-layout">

        {/* Left: Setup */}
        <div className="traits-panel">
          {/* Name Input (Tier 4 #24) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Candidate Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              style={{
                width: '100%',
                padding: '0.7rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Difficulty Selection (Tier 2 #10) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Difficulty
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['easy', 'normal', 'hard'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: difficulty === d ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.15)',
                    background: difficulty === d ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: difficulty === d ? 'var(--primary-accent)' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: difficulty === d ? 'bold' : 'normal',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {difficulty === 'easy' && 'Rival AI is weak with limited funding.'}
              {difficulty === 'normal' && 'Balanced challenge with adaptive rival AI.'}
              {difficulty === 'hard' && 'Aggressive rival AI that counter-targets your strongest states.'}
            </p>
          </div>

          {/* Party Selection (Tier 4 #24) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Political Party
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['Democrat', 'Republican'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => useGameStore.setState({ voterParty: p })}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: useGameStore.getState().voterParty === p ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.15)',
                    background: useGameStore.getState().voterParty === p ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: useGameStore.getState().voterParty === p ? 'var(--primary-accent)' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: useGameStore.getState().voterParty === p ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Focus Selection (Phase 1 #2) */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Focus Issues (Select 3)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Economy', 'Healthcare', 'Immigration', 'Climate Change', 'Education', 'National Security', 'Civil Rights'].map(issue => {
                const isSelected = selectedIssues.includes(issue);
                return (
                  <button
                    key={issue}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedIssues(selectedIssues.filter(i => i !== issue));
                      } else if (selectedIssues.length < 3) {
                        setSelectedIssues([...selectedIssues, issue]);
                      }
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      border: isSelected ? '1.5px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.15)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                      color: isSelected ? 'var(--primary-accent)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {issue}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="points-remaining">
            Points Remaining: {pointsRemaining}
          </div>

          {(Object.keys(traits) as Array<keyof PlayerDemographics>).map(trait => (
            <div key={trait} className="trait-row" title={TRAIT_TOOLTIPS[trait]}>
              <span className="trait-name" style={{ textTransform: 'capitalize' }}>
                {trait === 'owner' ? 'Business Owners' : trait === 'worker' ? 'Working Class' : trait}
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  {TRAIT_TOOLTIPS[trait]?.slice(0, 60)}...
                </span>
              </span>

              <div className="trait-controls">
                <button className="trait-btn" onClick={() => adjustTrait(trait, -5)} disabled={traits[trait] <= 0}>-</button>
                <div className="trait-value">{traits[trait]}</div>
                <button className="trait-btn" onClick={() => adjustTrait(trait, 5)} disabled={traits[trait] >= 100 || pointsRemaining <= 0}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary */}
        <div className="summary-panel">
          <div className="summary-title">Calculated Archetype:</div>
          <div className="archetype-name">{calculateArchetype()}</div>
          <div className="archetype-desc">
            Your starting ideology heavily dictates your base polling numbers in different states.
            An Unorthodox Outsider might struggle in the primaries but overperform in the general election if the map aligns.
          </div>

          <button
            className="start-campaign-btn"
            onClick={handleStartCampaign}
            disabled={pointsRemaining > 0 || selectedIssues.length < 3}
          >
            {pointsRemaining > 0 
              ? `Spend All Points (${pointsRemaining} left)` 
              : selectedIssues.length < 3 
                ? `Select ${3 - selectedIssues.length} more issues`
                : '🚀 Launch Campaign'}
          </button>
        </div>

      </div>
    </div>
  );
};
