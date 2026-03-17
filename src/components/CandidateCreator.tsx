import React, { useEffect, useMemo, useState } from 'react';
import './CandidateCreator.css';
import { useGameStore } from '../store/gameStore';
import { CampaignDataParser, type ModManifestEntry } from '../core/CampaignDataParser';
import type { PlayerDemographics } from '../core/ElectionMath';

const MAX_POINTS = 300;

export const CandidateCreator: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { playerIdeology, voterParty } = useGameStore();

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [traits, setTraits] = useState<PlayerDemographics>(playerIdeology);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [availableMods, setAvailableMods] = useState<ModManifestEntry[]>([]);
  const [selectedMod, setSelectedMod] = useState('vanilla');
  const [loadingMods, setLoadingMods] = useState(true);
  const [modsError, setModsError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const pointsRemaining = useMemo(
    () => MAX_POINTS - Object.values(traits).reduce((acc, val) => acc + val, 0),
    [traits]
  );

  const activeScenario = useMemo(
    () => availableMods.find((mod) => mod.id === selectedMod) ?? availableMods[0] ?? null,
    [availableMods, selectedMod]
  );

  useEffect(() => {
    let alive = true;

    const loadMods = async () => {
      setLoadingMods(true);
      const mods = await CampaignDataParser.listMods();

      if (!alive) return;

      setAvailableMods(mods);
      setSelectedMod((current) => mods.some((mod) => mod.id === current) ? current : (mods[0]?.id ?? 'vanilla'));
      setLoadingMods(false);
    };

    void loadMods();

    return () => {
      alive = false;
    };
  }, []);

  const adjustTrait = (key: keyof PlayerDemographics, amount: number) => {
    setTraits((prev) => {
      const newValue = prev[key] + amount;
      if (newValue < 0 || newValue > 100) return prev;
      if (amount > 0 && pointsRemaining <= 0) return prev;
      return { ...prev, [key]: newValue };
    });
  };

  const calculateArchetype = () => {
    if (traits.owner > 70 && traits.libertarian > 60) return 'Corporate Libertarian';
    if (traits.worker > 70 && traits.liberal > 60) return 'Progressive Populist';
    if (traits.religious > 70 && traits.owner > 50) return 'Traditional Conservative';
    if (traits.liberal > 50 && traits.worker > 50 && traits.owner > 40) return 'Establishment Moderate';
    if (traits.immigrant > 60 && traits.liberal > 50) return 'Reform Democrat';
    return 'Unorthodox Outsider';
  };

  const TRAIT_TOOLTIPS: Record<string, string> = {
    liberal: 'Appeal to progressive social policies. High values boost you in blue states like California and New York.',
    libertarian: 'Appeal to personal freedom and small government. Strong in mountain west and rural states.',
    owner: 'Appeal to business owners and entrepreneurs. Helps in wealthy suburban districts.',
    worker: 'Appeal to working-class communities. Critical in Rust Belt swing states.',
    religious: 'Appeal to faith-based voters. Dominant in the South and parts of the Midwest.',
    immigrant: 'Appeal to immigrant communities. Powerful in border states and diverse metros.'
  };

  const handleStartCampaign = async () => {
    setIsLaunching(true);
    setModsError(null);

    const states = await CampaignDataParser.loadModData(selectedMod);
    if (states.length === 0) {
      setModsError('That scenario could not be loaded. Check the scenario files and try again.');
      setIsLaunching(false);
      return;
    }

    useGameStore.setState({
      playerIdeology: traits,
      playerName: name || 'Candidate',
      difficulty,
      playerIssues: selectedIssues
    });

    useGameStore.getState().initializeCampaign(states);
    onComplete();
  };

  return (
    <div className="candidate-creator">
      <div className="creator-header">
        <h2>Establish Your Platform</h2>
        <p>Pick a scenario, build your coalition, and enter a full presidential campaign with a clear strategic lane.</p>
      </div>

      <div className="creator-layout">
        <div className="traits-panel">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Scenario
            </label>
            {loadingMods ? (
              <div className="scenario-empty-state">Loading official scenarios...</div>
            ) : (
              <div className="scenario-grid">
                {availableMods.map((mod) => {
                  const isSelected = mod.id === selectedMod;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      className={`scenario-card ${isSelected ? 'scenario-card-selected' : ''}`}
                      onClick={() => setSelectedMod(mod.id)}
                    >
                      <div className="scenario-card-header">
                        <span className="scenario-card-year">{mod.yearLabel}</span>
                        <span className="scenario-card-challenge">{mod.challenge}</span>
                      </div>
                      <div className="scenario-card-name">{mod.name}</div>
                      <div className="scenario-card-tagline">{mod.tagline}</div>
                      <div className="scenario-card-tags">
                        {mod.focus.map((focus) => (
                          <span key={`${mod.id}-${focus}`} className="scenario-card-tag">{focus}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Candidate Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Difficulty
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['easy', 'normal', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: difficulty === level ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.15)',
                    background: difficulty === level ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: difficulty === level ? 'var(--primary-accent)' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: difficulty === level ? 'bold' : 'normal',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              {difficulty === 'easy' && 'Rivals have weaker budgets and less disciplined state targeting.'}
              {difficulty === 'normal' && 'Balanced challenge with a competitive field and realistic campaign pressure.'}
              {difficulty === 'hard' && 'Well-funded rivals, faster decay, and sharper counter-programming in the states you need most.'}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Political Party
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['Democrat', 'Republican'] as const).map((party) => (
                <button
                  key={party}
                  type="button"
                  onClick={() => useGameStore.setState({ voterParty: party })}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: voterParty === party ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.15)',
                    background: voterParty === party ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: voterParty === party ? 'var(--primary-accent)' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: voterParty === party ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {party}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Focus Issues (Select 3)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Economy', 'Healthcare', 'Immigration', 'Climate Change', 'Education', 'National Security', 'Civil Rights'].map((issue) => {
                const isSelected = selectedIssues.includes(issue);
                return (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedIssues(selectedIssues.filter((entry) => entry !== issue));
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

          {(Object.keys(traits) as Array<keyof PlayerDemographics>).map((trait) => (
            <div key={trait} className="trait-row" title={TRAIT_TOOLTIPS[trait]}>
              <span className="trait-name" style={{ textTransform: 'capitalize' }}>
                {trait === 'owner' ? 'Business Owners' : trait === 'worker' ? 'Working Class' : trait}
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  {TRAIT_TOOLTIPS[trait]?.slice(0, 60)}...
                </span>
              </span>

              <div className="trait-controls">
                <button className="trait-btn" type="button" onClick={() => adjustTrait(trait, -5)} disabled={traits[trait] <= 0}>-</button>
                <div className="trait-value">{traits[trait]}</div>
                <button className="trait-btn" type="button" onClick={() => adjustTrait(trait, 5)} disabled={traits[trait] >= 100 || pointsRemaining <= 0}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="summary-panel">
          {activeScenario && (
            <div className="scenario-briefing">
              <div className="summary-title">Scenario Briefing</div>
              <div className="scenario-briefing-name">{activeScenario.name}</div>
              <div className="scenario-briefing-copy">{activeScenario.description}</div>
            </div>
          )}

          <div className="summary-title">Calculated Archetype</div>
          <div className="archetype-name">{calculateArchetype()}</div>
          <div className="archetype-desc">
            Your ideology shapes where your coalition starts strong, where debates can rescue you, and which rivals are best positioned to box you out.
          </div>

          {modsError && (
            <div className="scenario-empty-state" style={{ marginBottom: '1rem', width: '100%' }}>
              {modsError}
            </div>
          )}

          <button
            className="start-campaign-btn"
            onClick={handleStartCampaign}
            disabled={pointsRemaining > 0 || selectedIssues.length < 3 || loadingMods || isLaunching}
          >
            {isLaunching
              ? 'Loading Scenario...'
              : pointsRemaining > 0
                ? `Spend All Points (${pointsRemaining} left)`
                : selectedIssues.length < 3
                  ? `Select ${3 - selectedIssues.length} more issues`
                  : 'Launch Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
};
