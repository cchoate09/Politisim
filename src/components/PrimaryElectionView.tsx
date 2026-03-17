import React, { useMemo, useState } from 'react';
import './PrimaryElectionView.css';
import { useGameStore } from '../store/gameStore';
import { getPrimaryRuleProfile } from '../core/PrimaryRules';
import { getCandidateEndorsementSummary } from '../core/EndorsementData';
import { getFieldNetworkSummary } from '../core/FieldOperations';
import { getRivalPersonaLine } from '../core/SimulationEngine';
import { CandidateIdentityCard } from './CandidateIdentityCard';

export const PrimaryElectionView: React.FC = () => {
  const {
    states,
    pollingData,
    playerDelegates,
    rivalDelegates,
    delegateTarget,
    contestedStates,
    voterParty,
    rivalAIs,
    playerName,
    primaryResults,
    activeConvention,
    endorsements,
    fieldOperations,
    volunteerReserve,
    primaryFieldAverages,
    playerHomeRegion
  } = useGameStore();
  const [showAll, setShowAll] = useState(false);

  const sortedStates = [...states].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  const displayStates = showAll ? sortedStates : sortedStates.slice(0, 12);

  const fieldStandings = useMemo(() => {
    const fieldAverageMap = new Map(primaryFieldAverages.map((entry) => [entry.candidateId, entry]));
    return [
      {
        id: 'player',
        name: playerName,
        delegates: playerDelegates,
        momentum: null,
        tagline: 'Your campaign',
        status: 'active',
        persona: `${playerHomeRegion} base | define your issue lane and protect trust`,
        vulnerabilities: [] as string[],
        share: fieldAverageMap.get('player')?.share ?? 0
      },
      ...[...rivalAIs]
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'withdrawn' ? 1 : -1;
          if (a.delegates !== b.delegates) return b.delegates - a.delegates;
          return b.momentum - a.momentum;
        })
        .map((rival) => ({
          id: rival.id,
          name: rival.name,
          delegates: rival.delegates,
          momentum: rival.momentum,
          tagline: rival.status === 'withdrawn'
            ? `Withdrawn${rival.endorsedCandidateId ? ' and endorsed' : ''}`
            : rival.tagline,
          status: rival.status,
          persona: getRivalPersonaLine(rival),
          vulnerabilities: rival.vulnerabilities,
          share: fieldAverageMap.get(rival.id)?.share ?? 0
        }))
    ];
  }, [playerDelegates, playerHomeRegion, playerName, primaryFieldAverages, rivalAIs]);
  const organizationSummary = useMemo(() => getFieldNetworkSummary(fieldOperations), [fieldOperations]);

  return (
    <div className="primary-view">
      <div className="primary-header">
        <h2>Primary Election Tracker</h2>
        <p>Track the full nomination fight. State rules vary by contest, the field can consolidate, and a deadlocked map can spill into a convention battle.</p>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Delegates</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>{playerDelegates}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="progress-bar-bg" style={{ height: '12px' }}>
              <div className="progress-bar-fill" style={{ width: `${Math.min(100, (playerDelegates / delegateTarget) * 100)}%` }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {delegateTarget} needed to win the nomination
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Leading Rival</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary-accent)' }}>{rivalDelegates}</div>
          </div>
        </div>
      </div>

      {activeConvention && (
        <div className="primary-alert">
          <div>
            <strong>Convention Floor Open</strong>
            <p>{activeConvention.leadingRivalName} is leading the deadlock, and the nomination is now being decided ballot by ballot.</p>
          </div>
          <div className="primary-alert-meta">
            <span>Ballot {activeConvention.ballot}</span>
            <span>{activeConvention.freeDelegates} unbound delegates</span>
          </div>
        </div>
      )}

      <div className="primary-ops-banner">
        <span>{organizationSummary.officeStates} office states</span>
        <span>{organizationSummary.volunteerStrength} volunteers deployed</span>
        <span>{volunteerReserve} reserve volunteers</span>
        <span>{organizationSummary.activeSurrogates} surrogate stops active</span>
      </div>

      <div className="primary-alert" style={{ marginBottom: '1.5rem' }}>
        <div>
          <strong>National Field Average</strong>
          <p>These weighted standings track the entire nomination field, not just the front-runner duel.</p>
        </div>
        <div className="primary-alert-meta">
          <span>{fieldStandings.length} active candidates</span>
          <span>{primaryFieldAverages.length > 0 ? `${primaryFieldAverages[0].name} leads nationally` : 'Early field still forming'}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {fieldStandings.map((candidate) => (
          <div key={candidate.id} style={{ opacity: candidate.status === 'withdrawn' ? 0.72 : 1 }}>
            <CandidateIdentityCard
              name={candidate.name}
              subtitle={candidate.id === 'player' ? 'Your campaign' : candidate.tagline}
              tagline={candidate.persona}
              party={voterParty}
              accentLabel={candidate.status === 'withdrawn' ? 'withdrawn' : candidate.id === 'player' ? 'player' : 'rival'}
              compact
              chips={candidate.vulnerabilities.length > 0 ? [candidate.vulnerabilities[0]] : []}
              stats={[
                { label: 'National avg', value: `${candidate.share.toFixed(1)}%` },
                { label: 'Delegates', value: `${candidate.delegates}` },
                ...(candidate.momentum !== null ? [{ label: 'Momentum', value: `${candidate.momentum}` }] : [])
              ]}
            />
            {(() => {
              const coalition = getCandidateEndorsementSummary(endorsements, candidate.id);
              if (coalition.count === 0) return null;
              return (
                <div className="field-endorsement-row">
                  <span>{coalition.count} backers</span>
                  <span>{coalition.prestige} leverage</span>
                </div>
              );
            })()}
            {candidate.vulnerabilities.length > 0 && (
              <div className="candidate-vulnerability-line">
                Watch for: {candidate.vulnerabilities[0]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="election-cards">
        {displayStates.map((state, idx) => {
          const isContested = contestedStates.includes(state.stateName);
          const poll = pollingData[state.stateName];
          const result = primaryResults[state.stateName];
          const ruleProfile = getPrimaryRuleProfile(state, voterParty);
          const delegatesAtStake = voterParty === 'Democrat' ? state.demDelegates : state.repDelegates;
          const topFieldRows = result?.fieldShares.slice(0, 4) ?? [];
          const projectedFieldRows = !isContested && poll && 'allFieldShares' in poll
            ? poll.allFieldShares.slice(0, 5)
            : [];
          const districtWinRows = result
            ? Object.entries(result.districtWins)
                .filter(([, wins]) => wins > 0)
                .sort(([, leftWins], [, rightWins]) => rightWins - leftWins)
                .slice(0, 3)
                .map(([candidateId, wins]) => {
                  const candidateName = candidateId === 'player'
                    ? playerName
                    : result.fieldShares.find((share) => share.candidateId === candidateId)?.name ?? 'Rival';
                  return `${candidateName}: ${wins} district${wins === 1 ? '' : 's'}`;
                })
            : [];

          return (
            <div key={idx} className={`state-card ${isContested ? 'won' : ''}`}>
              <div className="state-card-header">
                <div>
                  <span className="state-title">
                    {state.stateName}
                    {isContested && (
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.16)',
                        color: 'var(--primary-accent)'
                      }}>
                        CALLED
                      </span>
                    )}
                  </span>
                  <div className="rule-chip">
                    {isContested ? result?.ruleSummary ?? ruleProfile.summary : ruleProfile.summary}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <div>{delegatesAtStake} {gamePhaseLabel(voterParty)}</div>
                  <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                    {ruleProfile.districtDelegates} district / {ruleProfile.statewideDelegates} statewide
                  </div>
                </div>
              </div>

              <div className="state-card-body">
                <div className="demographics-list">
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Demographics</h4>
                  <div className="demographic-row"><span>Liberal</span> <span>{state.liberal}%</span></div>
                  <div className="demographic-row"><span>Libertarian</span> <span>{state.libertarian}%</span></div>
                  <div className="demographic-row"><span>Business</span> <span>{state.owner}%</span></div>
                  <div className="demographic-row"><span>Working Class</span> <span>{state.worker}%</span></div>
                  <div className="demographic-row"><span>Religious</span> <span>{state.religious}%</span></div>
                </div>

                <div className="polls-list">
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {isContested ? 'Final Delegate Split' : 'Projected Full Field'}
                  </h4>

                  {isContested && result ? (
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      {topFieldRows.map((candidate) => (
                        <div key={`${state.stateName}-${candidate.candidateId}`} style={{ padding: '0.45rem 0.55rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                            <strong style={{ color: candidate.candidateId === 'player' ? 'var(--primary-accent)' : 'var(--text-main)' }}>{candidate.name}</strong>
                            <span>{candidate.share.toFixed(1)}% | {candidate.delegates} Del</span>
                          </div>
                          <div className="poll-bar-bg">
                            <div className="poll-bar-fill" style={{ width: `${candidate.share}%`, background: candidate.candidateId === 'player' ? 'var(--primary-accent)' : 'rgba(239,68,68,0.65)' }}></div>
                          </div>
                        </div>
                      ))}
                      {districtWinRows.length > 0 && (
                        <div className="district-badges">
                          {districtWinRows.map((entry) => (
                            <span key={`${state.stateName}-${entry}`}>{entry}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : projectedFieldRows.length > 0 ? (
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      {projectedFieldRows.map((candidate) => (
                        <div key={`${state.stateName}-${candidate.candidateId}`} style={{ padding: '0.45rem 0.55rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                            <strong style={{ color: candidate.candidateId === 'player' ? 'var(--primary-accent)' : 'var(--text-main)' }}>{candidate.name}</strong>
                            <span>{candidate.share.toFixed(1)}%</span>
                          </div>
                          <div className="poll-bar-bg">
                            <div className="poll-bar-fill" style={{ width: `${candidate.share}%`, background: candidate.candidateId === 'player' ? 'var(--primary-accent)' : 'rgba(239,68,68,0.65)' }}></div>
                          </div>
                        </div>
                      ))}
                      <div className="district-badges">
                        <span>Rule: {ruleProfile.summary}</span>
                        {ruleProfile.threshold > 0 && (
                          <span>{ruleProfile.threshold}% viability threshold</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="poll-row">
                        <div className="poll-header">
                          <strong>Your Campaign</strong>
                          <span style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>
                            {poll?.player.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="poll-bar-bg">
                          <div className="poll-bar-fill" style={{ width: `${poll?.player || 0}%`, background: 'var(--primary-accent)' }}></div>
                        </div>
                      </div>

                      <div className="poll-row">
                        <div className="poll-header">
                          <strong>Lead Rival</strong>
                          <span style={{ color: 'var(--secondary-accent)', fontWeight: 'bold' }}>
                            {poll?.rival.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="poll-bar-bg">
                          <div className="poll-bar-fill" style={{ width: `${poll?.rival || 0}%`, background: 'var(--secondary-accent)' }}></div>
                        </div>
                      </div>

                      <div className="district-badges">
                        <span>Rule: {ruleProfile.summary}</span>
                        {ruleProfile.threshold > 0 && (
                          <span>{ruleProfile.threshold}% viability threshold</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showAll && sortedStates.length > 12 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            display: 'block',
            margin: '1.5rem auto',
            padding: '0.6rem 2rem',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Show All {sortedStates.length} Contests
        </button>
      )}
    </div>
  );
};

function gamePhaseLabel(voterParty: 'Democrat' | 'Republican') {
  return voterParty === 'Democrat' ? 'Dem Del' : 'Rep Del';
}
