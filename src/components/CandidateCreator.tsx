import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './CandidateCreator.css';
import { useGameStore } from '../store/gameStore';
import { CampaignDataParser } from '../core/CampaignDataParser';
import type { PlayerDemographics } from '../core/ElectionMath';
import { getScenarioIntro, getScenarioPrimaryProfiles, getScenarioStrategicNotes, getScenarioVPCandidates } from '../core/ScenarioContent';
import { CandidateIdentityCard } from './CandidateIdentityCard';
import { ScenarioBrowser, type ScenarioBrowserMessageTone } from './ScenarioBrowser';
import type { ScenarioCatalogEntry } from '../core/ScenarioValidation';
import { importScenarioFromFiles } from '../core/ScenarioImport';
import {
  buildScenarioShareBundleDownload,
  buildScenarioTemplateBundleDownload
} from '../core/ScenarioExchange';
import {
  buildScenarioWorkshopBriefDownload,
  buildScenarioWorkshopPublishKitDownload
} from '../core/ScenarioWorkshop';

const MAX_POINTS = 300;
const HOME_REGIONS = ['National', 'Northeast', 'Midwest', 'South', 'West'] as const;

function getScenarioHealthCopy(scenario: ScenarioCatalogEntry | null) {
  if (!scenario) {
    return {
      label: 'Unavailable',
      summary: 'No scenario metadata is loaded yet.'
    };
  }

  if (scenario.validation.status === 'valid') {
    return {
      label: 'Ready for launch',
      summary: 'No blocking issues. The scenario passes manifest, schema, and map validation.'
    };
  }

  if (scenario.validation.status === 'warning') {
    return {
      label: 'Launchable with warnings',
      summary: 'The scenario can still launch, but the browser found non-blocking metadata or data quality issues.'
    };
  }

  return {
    label: 'Blocked by validation',
    summary: 'This scenario has blocking manifest or data issues and should be fixed before a campaign starts.'
  };
}

export const CandidateCreator: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { playerIdeology, voterParty, playerHomeRegion } = useGameStore();

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [traits, setTraits] = useState<PlayerDemographics>(playerIdeology);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [availableMods, setAvailableMods] = useState<ScenarioCatalogEntry[]>([]);
  const [selectedMod, setSelectedMod] = useState('vanilla');
  const [loadingMods, setLoadingMods] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [catalogMessageTone, setCatalogMessageTone] = useState<ScenarioBrowserMessageTone>('info');
  const [modsError, setModsError] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const pointsRemaining = useMemo(
    () => MAX_POINTS - Object.values(traits).reduce((acc, val) => acc + val, 0),
    [traits]
  );

  const activeScenario = useMemo(
    () => availableMods.find((mod) => mod.id === selectedMod) ?? availableMods[0] ?? null,
    [availableMods, selectedMod]
  );
  const scenarioRivals = useMemo(
    () => getScenarioPrimaryProfiles(selectedMod, voterParty).slice(0, 4),
    [selectedMod, voterParty]
  );
  const scenarioVPBench = useMemo(
    () => getScenarioVPCandidates(selectedMod, voterParty).slice(0, 3),
    [selectedMod, voterParty]
  );
  const scenarioNotes = useMemo(
    () => getScenarioStrategicNotes(selectedMod),
    [selectedMod]
  );
  const scenarioHealth = useMemo(
    () => getScenarioHealthCopy(activeScenario),
    [activeScenario]
  );
  const isScenarioBlocked = activeScenario?.validation.status === 'invalid';
  const canLaunchCampaign = !loadingMods && !isLaunching && !isScenarioBlocked && pointsRemaining === 0 && selectedIssues.length === 3 && Boolean(activeScenario);

  const loadMods = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoadingMods(true);
      setCatalogError(null);
      const mods = await CampaignDataParser.loadScenarioCatalog({ forceRefresh });

      setAvailableMods(mods);
      setSelectedMod((current) => {
        if (mods.some((mod) => mod.id === current)) {
          return current;
        }

        return mods.find((mod) => mod.validation.isValid)?.id ?? mods[0]?.id ?? 'vanilla';
      });
      if (mods.length === 0) {
        setCatalogError('No scenarios were discovered. Add scenario folders to public/mods and declare them in manifest.json.');
      }
    } catch (error) {
      console.error('Failed to load scenario catalog:', error);
      setCatalogError('The scenario catalog could not be loaded. Refresh the catalog or review imported scenario data.');
    } finally {
      setLoadingMods(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      await loadMods();
      if (!alive) {
        return;
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [loadMods]);

  const saveDownloadedText = (fileName: string, content: string, mimeType = 'application/json;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  };

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

    if (!activeScenario) {
      setModsError('No scenario is selected yet. Wait for the catalog to finish loading and try again.');
      setIsLaunching(false);
      return;
    }

    if (!activeScenario.validation.isValid) {
      setModsError('This scenario is blocked by validation errors. Review the scenario browser details and fix the listed issues before launching.');
      setIsLaunching(false);
      return;
    }

    const states = activeScenario.states.length > 0
      ? activeScenario.states
      : await CampaignDataParser.loadModData(selectedMod);

    if (states.length === 0) {
      setModsError('That scenario could not be loaded. Check the scenario files and try again.');
      setIsLaunching(false);
      return;
    }

    useGameStore.setState({
      playerIdeology: traits,
      playerName: name || 'Candidate',
      playerHomeRegion,
      difficulty,
      playerIssues: selectedIssues,
      scenarioId: selectedMod,
      scenarioName: activeScenario?.name ?? selectedMod,
      scenarioElectionYear: activeScenario?.electionYear ?? 2024
    });

    useGameStore.getState().initializeCampaign(states);
    onComplete();
  };

  const handleRefreshScenarios = async () => {
    setCatalogMessage('Refreshing the scenario catalog and re-running validation checks...');
    setCatalogMessageTone('info');
    await loadMods(true);
    setCatalogMessage('Scenario catalog refreshed. Validation diagnostics are up to date.');
    setCatalogMessageTone('success');
  };

  const handleImportScenarioFiles = async (files: File[]) => {
    setImportBusy(true);
    setCatalogMessage(null);
    setModsError(null);

    try {
      const existingIds = availableMods.map((scenario) => scenario.id);
      const importedScenario = await importScenarioFromFiles(files, existingIds);
      CampaignDataParser.saveImportedScenario(importedScenario);
      await loadMods(true);
      setSelectedMod(importedScenario.manifest.id);
      const importLabel = importedScenario.importSource.startsWith('bundle:') ? 'shared bundle' : 'scenario folder';
      setCatalogMessage(`Imported ${importedScenario.manifest.name} from a ${importLabel}. Review the scenario browser diagnostics before launch if you edited the map or metadata.`);
      setCatalogMessageTone(importedScenario.importNotes.length > 0 ? 'warning' : 'success');
    } catch (error) {
      console.error('Scenario import failed:', error);
      setCatalogMessage(error instanceof Error ? error.message : 'Scenario import failed.');
      setCatalogMessageTone('error');
    } finally {
      setImportBusy(false);
    }
  };

  const handleExportScenarioBundle = (scenarioId: string) => {
    const scenario = availableMods.find((entry) => entry.id === scenarioId);
    if (!scenario) {
      return;
    }

    const download = buildScenarioShareBundleDownload(scenario);
    saveDownloadedText(download.fileName, download.content);
    setCatalogMessage(`Exported ${scenario.name} as a portable share bundle. Another player can import that single file directly from the scenario browser.`);
    setCatalogMessageTone(scenario.validation.warnings > 0 ? 'warning' : 'success');
  };

  const handleDownloadScenarioTemplate = (scenarioId: string) => {
    const scenario = availableMods.find((entry) => entry.id === scenarioId);
    if (!scenario) {
      return;
    }

    const download = buildScenarioTemplateBundleDownload(scenario);
    saveDownloadedText(download.fileName, download.content);
    setCatalogMessage(`Downloaded a creator template based on ${scenario.name}. It includes placeholder metadata and the full map so a modder can start editing immediately.`);
    setCatalogMessageTone('info');
  };

  const handleDownloadWorkshopPublishKit = (scenarioId: string) => {
    const scenario = availableMods.find((entry) => entry.id === scenarioId);
    if (!scenario) {
      return;
    }

    const download = buildScenarioWorkshopPublishKitDownload(scenario);
    saveDownloadedText(download.fileName, download.content);
    setCatalogMessage(`Downloaded a Workshop publish kit for ${scenario.name}. It bundles scenario metadata, readiness notes, and a portable share file into one creator-facing package.`);
    setCatalogMessageTone(download.kit.readiness.status === 'blocked' ? 'warning' : 'success');
  };

  const handleDownloadWorkshopBrief = (scenarioId: string) => {
    const scenario = availableMods.find((entry) => entry.id === scenarioId);
    if (!scenario) {
      return;
    }

    const download = buildScenarioWorkshopBriefDownload(scenario);
    saveDownloadedText(download.fileName, download.content, 'text/markdown;charset=utf-8');
    setCatalogMessage(`Downloaded a publish brief for ${scenario.name}. It includes workshop-style title copy, tags, release notes scaffolding, and screenshot guidance.`);
    setCatalogMessageTone('info');
  };

  const handleRemoveScenario = async (scenarioId: string) => {
    CampaignDataParser.removeImportedScenario(scenarioId);
    await loadMods(true);
    setCatalogMessage(`Removed imported scenario ${scenarioId} from the local catalog.`);
    setCatalogMessageTone('info');
  };

  return (
    <div className="candidate-creator">
      <div className="creator-header">
        <h2>Establish Your Platform</h2>
        <p>Pick a scenario, build your coalition, and enter a full presidential campaign with a clear strategic lane.</p>
      </div>

      <div className="creator-layout">
        <div className="traits-panel">
          <ScenarioBrowser
            scenarios={availableMods}
            selectedScenarioId={selectedMod}
            loading={loadingMods}
            loadError={catalogError}
            onSelectScenario={setSelectedMod}
            onRefreshScenarios={() => void handleRefreshScenarios()}
            onImportScenarioFiles={handleImportScenarioFiles}
            onExportScenarioBundle={handleExportScenarioBundle}
            onDownloadScenarioTemplate={handleDownloadScenarioTemplate}
            onDownloadWorkshopPublishKit={handleDownloadWorkshopPublishKit}
            onDownloadWorkshopBrief={handleDownloadWorkshopBrief}
            onRemoveScenario={handleRemoveScenario}
            importBusy={importBusy}
            statusMessage={catalogMessage}
            statusTone={catalogMessageTone}
          />

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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Regional Base
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.45rem' }}>
              {HOME_REGIONS.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => useGameStore.setState({ playerHomeRegion: region })}
                  style={{
                    padding: '0.55rem',
                    borderRadius: '8px',
                    border: playerHomeRegion === region ? '2px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.15)',
                    background: playerHomeRegion === region ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: playerHomeRegion === region ? 'var(--primary-accent)' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: playerHomeRegion === region ? 'bold' : 'normal'
                  }}
                >
                  {region}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Your regional base now matters. It shapes where the campaign starts warm and where rivals can still box you out early.
            </p>
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
                      setSelectedIssues((current) => {
                        const currentlySelected = current.includes(issue);
                        if (currentlySelected) {
                          return current.filter((entry) => entry !== issue);
                        }

                        if (current.length >= 3) {
                          return current;
                        }

                        return [...current, issue];
                      });
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
          <CandidateIdentityCard
            name={name || 'Candidate'}
            subtitle={playerHomeRegion === 'National' ? `${voterParty} national launch` : `${voterParty} base in the ${playerHomeRegion}`}
            tagline={activeScenario?.tagline ?? 'Presidential campaign launch'}
            party={voterParty}
            accentLabel={difficulty}
            chips={[calculateArchetype(), ...selectedIssues]}
            stats={[
              { label: 'Points left', value: pointsRemaining.toString() },
              { label: 'Issues', value: `${selectedIssues.length}/3` },
              { label: 'Scenario', value: activeScenario?.yearLabel ?? '2024' }
            ]}
          />

          {activeScenario && (
            <div className="scenario-briefing">
              <div className="summary-title">Scenario Briefing</div>
              <div className="scenario-briefing-name">{activeScenario.name}</div>
              <div className={`scenario-health-banner scenario-health-banner-${activeScenario.validation.status}`}>
                <strong>{scenarioHealth.label}</strong>
                <span>
                  {activeScenario.validation.errors} errors · {activeScenario.validation.warnings} warnings · {activeScenario.validation.infos} diagnostics
                </span>
              </div>
              <div className="scenario-briefing-copy">{activeScenario.description}</div>
              <div className="scenario-briefing-copy" style={{ marginTop: '0.75rem' }}>
                {getScenarioIntro(selectedMod)}
              </div>
              <div className="scenario-briefing-copy" style={{ marginTop: '0.75rem' }}>
                {scenarioHealth.summary}
              </div>
              {activeScenario.featuredStates && activeScenario.featuredStates.length > 0 && (
                <div className="scenario-briefing-copy" style={{ marginTop: '0.75rem' }}>
                  Featured states: {activeScenario.featuredStates.join(', ')}
                </div>
              )}
              {activeScenario.specialRules && activeScenario.specialRules.length > 0 && (
                <div className="scenario-briefing-copy" style={{ marginTop: '0.75rem' }}>
                  Strategic twist: {activeScenario.specialRules.join(' | ')}
                </div>
              )}
            </div>
          )}

          <div className="scenario-briefing" style={{ marginTop: '1rem' }}>
            <div className="summary-title">Scenario Notes</div>
            {scenarioNotes.map((note) => (
              <div key={note} className="scenario-briefing-copy" style={{ marginTop: '0.5rem' }}>
                {note}
              </div>
            ))}
          </div>

          <div className="scenario-briefing" style={{ marginTop: '1rem' }}>
            <div className="summary-title">Primary Field Preview</div>
            {scenarioRivals.map((rival) => (
              <div key={rival.id} className="scenario-briefing-copy" style={{ marginTop: '0.5rem' }}>
                <strong>{rival.name}</strong>: {rival.tagline}. {rival.issueBrands.slice(0, 2).join(', ')}.
              </div>
            ))}
          </div>

          <div className="scenario-briefing" style={{ marginTop: '1rem' }}>
            <div className="summary-title">Running Mate Bench</div>
            {scenarioVPBench.map((vp) => (
              <div key={vp.id} className="scenario-briefing-copy" style={{ marginTop: '0.5rem' }}>
                <strong>{vp.name}</strong>: {vp.title}. {vp.strengths[0]}.
              </div>
            ))}
          </div>

          <div className="summary-title">Calculated Archetype</div>
          <div className="archetype-name">{calculateArchetype()}</div>
          <div className="archetype-desc">
            Your ideology shapes where your coalition starts strong, where debates can rescue you, and which rivals are best positioned to box you out.
          </div>

          <div className="scenario-briefing" style={{ marginTop: '1rem' }}>
            <div className="summary-title">First 10 Minutes</div>
            <div className="scenario-briefing-copy">
              Pick a few focus states, avoid spending every dollar on one-week ads, and use the in-game guide after launch if you need a refresher on trust, momentum, delegates, or field offices.
            </div>
          </div>

          {modsError && (
            <div className="scenario-empty-state" style={{ marginBottom: '1rem', width: '100%' }}>
              {modsError}
            </div>
          )}

          <button
            className="start-campaign-btn"
            onClick={handleStartCampaign}
            disabled={!canLaunchCampaign}
          >
            {isLaunching
              ? 'Loading Scenario...'
              : isScenarioBlocked
                ? 'Resolve Scenario Errors First'
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
