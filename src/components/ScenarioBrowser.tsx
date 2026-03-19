import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ScenarioBrowser.css';
import type { ScenarioCatalogEntry, ScenarioCatalogStatus, ScenarioValidationFinding } from '../core/ScenarioValidation';

export type ScenarioBrowserMessageTone = 'info' | 'success' | 'warning' | 'error';

interface ScenarioBrowserProps {
  scenarios: ScenarioCatalogEntry[];
  selectedScenarioId: string;
  loading: boolean;
  loadError: string | null;
  onSelectScenario: (scenarioId: string) => void;
  onRefreshScenarios: () => void;
  onImportScenarioFiles: (files: File[]) => Promise<void>;
  onRemoveScenario: (scenarioId: string) => Promise<void>;
  importBusy: boolean;
  statusMessage: string | null;
  statusTone: ScenarioBrowserMessageTone;
}

const CHALLENGE_FILTERS = ['All', 'Accessible', 'Competitive', 'Hardcore'] as const;
const STATUS_FILTERS: Array<{ id: 'all' | ScenarioCatalogStatus; label: string }> = [
  { id: 'all', label: 'All Health' },
  { id: 'valid', label: 'Ready' },
  { id: 'warning', label: 'Warnings' },
  { id: 'invalid', label: 'Blocked' }
];

function formatStatus(status: ScenarioCatalogStatus) {
  if (status === 'valid') {
    return {
      label: 'Ready',
      summary: 'No blocking issues. This scenario passes browser validation and should launch cleanly.',
      tone: 'ready'
    };
  }

  if (status === 'warning') {
    return {
      label: 'Needs Review',
      summary: 'This scenario can launch, but the browser found non-blocking issues worth checking first.',
      tone: 'warning'
    };
  }

  return {
    label: 'Blocked',
    summary: 'This scenario has schema or data issues that should be fixed before starting a run.',
    tone: 'blocked'
  };
}

function formatPrimaryDate(date: string | null) {
  if (!date) return 'Unknown';

  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function groupFindings(findings: ScenarioValidationFinding[]) {
  return {
    error: findings.filter((finding) => finding.severity === 'error'),
    warning: findings.filter((finding) => finding.severity === 'warning'),
    info: findings.filter((finding) => finding.severity === 'info')
  };
}

export const ScenarioBrowser: React.FC<ScenarioBrowserProps> = ({
  scenarios,
  selectedScenarioId,
  loading,
  loadError,
  onSelectScenario,
  onRefreshScenarios,
  onImportScenarioFiles,
  onRemoveScenario,
  importBusy,
  statusMessage,
  statusTone
}) => {
  const [query, setQuery] = useState('');
  const [challengeFilter, setChallengeFilter] = useState<(typeof CHALLENGE_FILTERS)[number]>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | ScenarioCatalogStatus>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!fileInputRef.current) return;

    fileInputRef.current.setAttribute('webkitdirectory', '');
    fileInputRef.current.setAttribute('directory', '');
  }, []);

  const filteredScenarios = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return scenarios.filter((scenario) => {
      const matchesQuery = normalizedQuery.length === 0 || [
        scenario.name,
        scenario.yearLabel,
        scenario.tagline,
        scenario.description,
        ...scenario.focus,
        ...(scenario.featuredStates ?? []),
        ...(scenario.specialRules ?? [])
      ].join(' ').toLowerCase().includes(normalizedQuery);

      const matchesChallenge = challengeFilter === 'All' || scenario.challenge === challengeFilter;
      const matchesStatus = statusFilter === 'all' || scenario.validation.status === statusFilter;

      return matchesQuery && matchesChallenge && matchesStatus;
    });
  }, [challengeFilter, query, scenarios, statusFilter]);

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0] ?? null,
    [scenarios, selectedScenarioId]
  );
  const statusSummary = selectedScenario ? formatStatus(selectedScenario.validation.status) : null;
  const groupedFindings = selectedScenario ? groupFindings(selectedScenario.validation.findings) : null;

  const healthCounts = useMemo(() => ({
    ready: scenarios.filter((scenario) => scenario.validation.status === 'valid').length,
    warning: scenarios.filter((scenario) => scenario.validation.status === 'warning').length,
    blocked: scenarios.filter((scenario) => scenario.validation.status === 'invalid').length
  }), [scenarios]);
  const workshopReadiness = useMemo(() => {
    if (!selectedScenario) return null;

    const checklist = [
      { label: 'Validates cleanly', met: selectedScenario.validation.errors === 0 },
      { label: 'Author metadata', met: Boolean(selectedScenario.author?.trim()) },
      { label: 'Version metadata', met: Boolean(selectedScenario.version?.trim()) },
      { label: 'Compatibility target', met: Boolean(selectedScenario.minGameVersion?.trim()) },
      { label: 'Scenario pitch and tags', met: Boolean(selectedScenario.tagline?.trim()) && selectedScenario.focus.length >= 2 },
      { label: 'Battleground highlights', met: Boolean(selectedScenario.featuredStates?.length) },
      { label: 'Strategic rules summary', met: Boolean(selectedScenario.specialRules?.length) }
    ];
    const metCount = checklist.filter((item) => item.met).length;

    return {
      score: Math.round((metCount / checklist.length) * 100),
      checklist
    };
  }, [selectedScenario]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      await onImportScenarioFiles(files);
    }

    event.target.value = '';
  };

  return (
    <section className="scenario-browser">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />
      <div className="scenario-browser-header">
        <div>
          <div className="scenario-browser-eyebrow">Scenario Browser</div>
          <h3>Installed Scenarios</h3>
          <p>Browse official or custom campaign setups, inspect their ruleset, and catch broken data before you ever launch a run.</p>
        </div>

        <div className="scenario-browser-summary">
          <div className="scenario-browser-summary-chip">
            <strong>{scenarios.length}</strong>
            <span>Installed</span>
          </div>
          <div className="scenario-browser-summary-chip">
            <strong>{healthCounts.ready}</strong>
            <span>Ready</span>
          </div>
          <div className="scenario-browser-summary-chip">
            <strong>{healthCounts.warning}</strong>
            <span>Warnings</span>
          </div>
          <div className="scenario-browser-summary-chip">
            <strong>{healthCounts.blocked}</strong>
            <span>Blocked</span>
          </div>
        </div>
      </div>

      <div className="scenario-browser-actions">
        <button
          type="button"
          className="scenario-browser-action-btn primary"
          onClick={handleImportClick}
          disabled={loading || importBusy}
        >
          {importBusy ? 'Importing Scenario...' : 'Import Scenario Folder'}
        </button>
        <button
          type="button"
          className="scenario-browser-action-btn"
          onClick={onRefreshScenarios}
          disabled={loading || importBusy}
        >
          Refresh Catalog
        </button>
        <div className="scenario-browser-action-copy">
          Pick a folder that contains `manifest.json` and `states.json`. Imported scenarios stay in the browser catalog, are validated automatically, and can be removed later.
        </div>
      </div>

      {statusMessage && (
        <div className={`scenario-browser-message scenario-browser-message-${statusTone}`}>
          {statusMessage}
        </div>
      )}

      <div className="scenario-browser-toolbar">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="scenario-browser-search"
          placeholder="Search by year, focus, featured state, or tagline..."
          aria-label="Search scenarios"
        />

        <div className="scenario-browser-filter-group">
          {CHALLENGE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`scenario-browser-filter ${challengeFilter === filter ? 'active' : ''}`}
              onClick={() => setChallengeFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="scenario-browser-filter-group">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`scenario-browser-filter ${statusFilter === filter.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && <div className="scenario-browser-empty-state">{loadError}</div>}

      {loading ? (
        <div className="scenario-browser-empty-state">Loading installed scenarios and running validation checks...</div>
      ) : (
        <div className="scenario-browser-layout">
          <div className="scenario-browser-list">
            {filteredScenarios.length === 0 ? (
              <div className="scenario-browser-empty-state">
                No scenarios match those filters yet. Clear the search or switch health filters to see the full catalog again.
              </div>
            ) : (
              filteredScenarios.map((scenario) => {
                const status = formatStatus(scenario.validation.status);
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`scenario-browser-card ${selectedScenarioId === scenario.id ? 'selected' : ''}`}
                    onClick={() => onSelectScenario(scenario.id)}
                  >
                    <div className="scenario-browser-card-top">
                      <span className="scenario-browser-card-year">{scenario.yearLabel}</span>
                      <span className={`scenario-browser-status scenario-browser-status-${status.tone}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="scenario-browser-card-title-row">
                      <div className="scenario-browser-card-name">{scenario.name}</div>
                      <span className="scenario-browser-card-official">
                        {scenario.official ? 'Official' : 'Community'}
                      </span>
                    </div>

                    <div className="scenario-browser-card-tagline">{scenario.tagline}</div>

                    <div className="scenario-browser-card-meta">
                      <span>{scenario.challenge}</span>
                      <span>{scenario.validation.stats.totalEV} EV</span>
                      <span>{scenario.validation.stats.jurisdictionCount} jurisdictions</span>
                    </div>

                    <div className="scenario-browser-tag-row">
                      {scenario.focus.slice(0, 3).map((focus) => (
                        <span key={`${scenario.id}-${focus}`} className="scenario-browser-tag">{focus}</span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="scenario-browser-detail">
            {selectedScenario && statusSummary && groupedFindings ? (
              <>
                <div className="scenario-browser-detail-header">
                  <div>
                    <div className="scenario-browser-eyebrow">
                      {selectedScenario.official ? 'Official Scenario' : 'Community Scenario'}
                    </div>
                    <h4>{selectedScenario.name}</h4>
                    <p>{selectedScenario.description}</p>
                  </div>

                  <div className={`scenario-browser-status-card scenario-browser-status-card-${statusSummary.tone}`}>
                    <span>{statusSummary.label}</span>
                    <strong>{selectedScenario.validation.errors} errors / {selectedScenario.validation.warnings} warnings</strong>
                    <p>{statusSummary.summary}</p>
                  </div>
                </div>

                <div className="scenario-browser-detail-grid">
                  <div className="scenario-browser-detail-stat">
                    <span>Election Year</span>
                    <strong>{selectedScenario.electionYear}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Author</span>
                    <strong>{selectedScenario.author ?? 'Unknown'}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Challenge</span>
                    <strong>{selectedScenario.challenge}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Version</span>
                    <strong>{selectedScenario.version ?? 'Unversioned'}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Jurisdictions</span>
                    <strong>{selectedScenario.validation.stats.jurisdictionCount}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Electoral Votes</span>
                    <strong>{selectedScenario.validation.stats.totalEV}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Avg. Turnout</span>
                    <strong>{selectedScenario.validation.stats.averageTurnout}%</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Min Game Version</span>
                    <strong>{selectedScenario.minGameVersion ?? 'Not declared'}</strong>
                  </div>
                  <div className="scenario-browser-detail-stat">
                    <span>Primary Window</span>
                    <strong>
                      {formatPrimaryDate(selectedScenario.validation.stats.earliestPrimaryDate)}
                      {' - '}
                      {formatPrimaryDate(selectedScenario.validation.stats.latestPrimaryDate)}
                    </strong>
                  </div>
                </div>

                <div className="scenario-browser-detail-section">
                  <div className="scenario-browser-detail-section-title">Focus</div>
                  <div className="scenario-browser-tag-row">
                    {selectedScenario.focus.map((focus) => (
                      <span key={`${selectedScenario.id}-focus-${focus}`} className="scenario-browser-tag">{focus}</span>
                    ))}
                  </div>
                </div>

                {selectedScenario.featuredStates && selectedScenario.featuredStates.length > 0 && (
                  <div className="scenario-browser-detail-section">
                    <div className="scenario-browser-detail-section-title">Featured States</div>
                    <div className="scenario-browser-tag-row">
                      {selectedScenario.featuredStates.map((state) => (
                        <span key={`${selectedScenario.id}-state-${state}`} className="scenario-browser-tag scenario-browser-tag-highlight">
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedScenario.specialRules && selectedScenario.specialRules.length > 0 && (
                  <div className="scenario-browser-detail-section">
                    <div className="scenario-browser-detail-section-title">Special Rules</div>
                    <div className="scenario-browser-rule-list">
                      {selectedScenario.specialRules.map((rule) => (
                        <div key={`${selectedScenario.id}-rule-${rule}`} className="scenario-browser-rule">
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedScenario.importNotes && selectedScenario.importNotes.length > 0 && (
                  <div className="scenario-browser-detail-section">
                    <div className="scenario-browser-detail-section-title">Import Notes</div>
                    <div className="scenario-browser-rule-list">
                      {selectedScenario.importNotes.map((note) => (
                        <div key={`${selectedScenario.id}-note-${note}`} className="scenario-browser-rule">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {workshopReadiness && (
                  <div className="scenario-browser-detail-section">
                    <div className="scenario-browser-detail-section-title">Workshop Readiness</div>
                    <div className="scenario-browser-status-card scenario-browser-status-card-ready">
                      <span>Checklist Score</span>
                      <strong>{workshopReadiness.score}%</strong>
                      <p>These checks keep community scenarios legible, versioned, and easier to publish or share later.</p>
                    </div>
                    <div className="scenario-browser-rule-list">
                      {workshopReadiness.checklist.map((item) => (
                        <div key={`${selectedScenario.id}-readiness-${item.label}`} className={`scenario-browser-rule ${item.met ? 'scenario-browser-rule-pass' : 'scenario-browser-rule-miss'}`}>
                          {item.met ? 'Ready: ' : 'Missing: '}{item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="scenario-browser-detail-section">
                  <div className="scenario-browser-detail-section-title">Validation Findings</div>

                  {groupedFindings.error.length === 0 && groupedFindings.warning.length === 0 ? (
                    <div className="scenario-browser-finding scenario-browser-finding-info">
                      The browser did not find any blocking schema problems. Diagnostics still check map size, turnout, dates, and metadata quality.
                    </div>
                  ) : null}

                  {groupedFindings.error.slice(0, 5).map((finding) => (
                    <div key={`${finding.code}-${finding.scope ?? 'error'}`} className="scenario-browser-finding scenario-browser-finding-error">
                      <strong>Blocking</strong>
                      <span>{finding.message}</span>
                    </div>
                  ))}

                  {groupedFindings.warning.slice(0, 5).map((finding) => (
                    <div key={`${finding.code}-${finding.scope ?? 'warning'}`} className="scenario-browser-finding scenario-browser-finding-warning">
                      <strong>Warning</strong>
                      <span>{finding.message}</span>
                    </div>
                  ))}

                  {groupedFindings.info.slice(0, 2).map((finding) => (
                    <div key={`${finding.code}-${finding.scope ?? 'info'}`} className="scenario-browser-finding scenario-browser-finding-info">
                      <strong>Diagnostic</strong>
                      <span>{finding.message}</span>
                    </div>
                  ))}
                </div>

                {!selectedScenario.official && (
                  <div className="scenario-browser-detail-section">
                    <button
                      type="button"
                      className="scenario-browser-action-btn scenario-browser-remove-btn"
                      onClick={() => void onRemoveScenario(selectedScenario.id)}
                      disabled={importBusy}
                    >
                      Remove Imported Scenario
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="scenario-browser-empty-state">Select a scenario to inspect its rules, metadata, and validation diagnostics.</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
