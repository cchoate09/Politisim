import React, { useState } from 'react';
import './PrimaryElectionView.css';
import { useGameStore } from '../store/gameStore';

export const PrimaryElectionView: React.FC = () => {
  const { states, pollingData, playerDelegates, rivalDelegates, delegateTarget, contestedStates } = useGameStore();
  const [showAll, setShowAll] = useState(false);

  // Sort states by date, mark contested ones
  const sortedStates = [...states].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const displayStates = showAll ? sortedStates : sortedStates.slice(0, 12);

  return (
    <div className="primary-view">
      <div className="primary-header">
        <h2>Primary Election Tracker</h2>
        <p>Track delegate allocation across all 50 states. States are contested every 4 weeks in date order.</p>

        {/* Delegate Summary Bar */}
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Delegates</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary-accent)' }}>{playerDelegates}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="progress-bar-bg" style={{ height: '12px' }}>
              <div className="progress-bar-fill" style={{
                width: `${Math.min(100, (playerDelegates / delegateTarget) * 100)}%`
              }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {delegateTarget} needed to win
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rival Delegates</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary-accent)' }}>{rivalDelegates}</div>
          </div>
        </div>
      </div>

      <div className="election-cards">
        {displayStates.map((state, idx) => {
          const isContested = contestedStates.includes(state.stateName);
          const poll = pollingData[state.stateName];
          const playerWon = poll && poll.player > poll.rival;

          return (
            <div key={idx} className={`state-card ${isContested ? (playerWon ? 'won' : 'lost') : ''}`}>

              <div className="state-card-header">
                <span className="state-title">
                  {state.stateName}
                  {isContested && (
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: playerWon ? 'rgba(46, 160, 67, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                      color: playerWon ? '#2ea043' : '#f85149'
                    }}>
                      {playerWon ? '✓ WON' : '✗ LOST'}
                    </span>
                  )}
                </span>
                <div className="state-delegates-columns">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.9rem', color: '#3182CE', fontWeight: 'bold' }}>{state.demDelegates} Dem Del</span>
                    <span style={{ fontSize: '0.9rem', color: '#E53E3E', fontWeight: 'bold', marginTop: '0.2rem' }}>{state.repDelegates} Rep Del</span>
                  </div>
                  {isContested && (
                    <span className="state-delegates-allocated" style={{ color: playerWon ? 'var(--primary-accent)' : 'var(--secondary-accent)', marginLeft: '1rem' }}>
                      {playerWon ? `+${state.delegatesOrEV}` : `-${state.delegatesOrEV}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="state-card-body">
                {/* Demographics Column */}
                <div className="demographics-list">
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Demographics</h4>
                  <div className="demographic-row"><span>Liberal</span> <span>{state.liberal}%</span></div>
                  <div className="demographic-row"><span>Libertarian</span> <span>{state.libertarian}%</span></div>
                  <div className="demographic-row"><span>Business</span> <span>{state.owner}%</span></div>
                  <div className="demographic-row"><span>Working Class</span> <span>{state.worker}%</span></div>
                  <div className="demographic-row"><span>Religious</span> <span>{state.religious}%</span></div>
                </div>

                {/* Polling Column */}
                <div className="polls-list">
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {isContested ? 'Final Result' : 'Projected Polls'}
                  </h4>

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
                      <strong>Rival</strong>
                      <span style={{ color: 'var(--secondary-accent)', fontWeight: 'bold' }}>
                        {poll?.rival.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="poll-bar-bg">
                      <div className="poll-bar-fill" style={{ width: `${poll?.rival || 0}%`, background: 'var(--secondary-accent)' }}></div>
                    </div>
                  </div>
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
            display: 'block', margin: '1.5rem auto', padding: '0.6rem 2rem', borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.9rem'
          }}
        >
          Show All {sortedStates.length} States
        </button>
      )}
    </div>
  );
}
