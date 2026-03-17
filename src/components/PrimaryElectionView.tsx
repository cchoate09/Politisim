import React, { useMemo, useState } from 'react';
import './PrimaryElectionView.css';
import { useGameStore } from '../store/gameStore';

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
    primaryResults
  } = useGameStore();
  const [showAll, setShowAll] = useState(false);

  const sortedStates = [...states].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  const displayStates = showAll ? sortedStates : sortedStates.slice(0, 12);

  const fieldStandings = useMemo(() => {
    return [
      { id: 'player', name: playerName, delegates: playerDelegates, momentum: null, tagline: 'Your campaign', status: 'active' },
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
          status: rival.status
        }))
    ];
  }, [playerDelegates, playerName, rivalAIs]);

  return (
    <div className="primary-view">
      <div className="primary-header">
        <h2>Primary Election Tracker</h2>
        <p>Track the full nomination fight. States resolve in batches, delegates are allocated proportionally, and weak candidates can drop out and endorse.</p>

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {fieldStandings.map((candidate) => (
          <div key={candidate.id} className="state-card" style={{ minHeight: 'unset', borderColor: candidate.status === 'withdrawn' ? 'rgba(255,255,255,0.06)' : undefined, opacity: candidate.status === 'withdrawn' ? 0.72 : 1 }}>
            <div className="state-card-header" style={{ marginBottom: '0.75rem' }}>
              <span className="state-title" style={{ fontSize: '1rem' }}>{candidate.name}</span>
              <span style={{ color: candidate.id === 'player' ? 'var(--primary-accent)' : 'var(--secondary-accent)', fontWeight: 'bold' }}>
                {candidate.delegates} Del
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{candidate.tagline}</div>
            {candidate.momentum !== null && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                Momentum <strong>{candidate.momentum}</strong>
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
          const delegatesAtStake = voterParty === 'Democrat' ? state.demDelegates : state.repDelegates;
          const topFieldRows = result?.fieldShares.slice(0, 4) ?? [];

          return (
            <div key={idx} className={`state-card ${isContested ? 'won' : ''}`}>
              <div className="state-card-header">
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
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {delegatesAtStake} {gamePhaseLabel(voterParty)}
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
                    {isContested ? 'Final Delegate Split' : 'Projected Front-Runner Race'}
                  </h4>

                  {isContested && result ? (
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      {topFieldRows.map((candidate) => (
                        <div key={`${state.stateName}-${candidate.candidateId}`} style={{ padding: '0.45rem 0.55rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                            <strong style={{ color: candidate.candidateId === 'player' ? 'var(--primary-accent)' : 'var(--text-main)' }}>{candidate.name}</strong>
                            <span>{candidate.share.toFixed(1)}% • {candidate.delegates} Del</span>
                          </div>
                          <div className="poll-bar-bg">
                            <div className="poll-bar-fill" style={{ width: `${candidate.share}%`, background: candidate.candidateId === 'player' ? 'var(--primary-accent)' : 'rgba(239,68,68,0.65)' }}></div>
                          </div>
                        </div>
                      ))}
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
