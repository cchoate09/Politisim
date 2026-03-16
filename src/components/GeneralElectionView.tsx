import React from 'react';
import './GeneralElectionView.css';
import { useGameStore, computeEVTotals } from '../store/gameStore';

export const GeneralElectionView: React.FC = () => {
  const { states, pollingData, playerName, vpPick, voterParty } = useGameStore();
  const { playerEV, rivalEV } = computeEVTotals(states, pollingData);

  // Find the closest-margin swing states
  const swingStates = [...states]
    .map(s => {
      const poll = pollingData[s.stateName];
      if (!poll) return null;
      return {
        name: s.stateName,
        ev: s.delegatesOrEV,
        playerPoll: Math.round(poll.player * 10) / 10,
        oppPoll: Math.round(poll.rival * 10) / 10,
        margin: Math.abs(poll.player - poll.rival)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.margin - b!.margin)
    .slice(0, 8) as { name: string; ev: number; playerPoll: number; oppPoll: number; margin: number }[];

  return (
    <div className="general-view">
      <div className="general-header">
        <h2>General Election Map</h2>
        <p>The race to 270 Electoral Votes. Review the tightest battleground states.</p>
      </div>

      <div className="head-to-head">
        <div className="candidate-profile player">
          <div className="candidate-name">{playerName}</div>
          <div className="candidate-party">{vpPick ? `VP: ${vpPick.name}` : `${voterParty} Nominee`}</div>
          <div className="electoral-votes" style={{ color: 'var(--primary-accent)' }}>{playerEV}</div>
        </div>

        <div className="vs-badge">VS</div>

        <div className="candidate-profile opponent">
          <div className="candidate-name">Rival Nominee</div>
          <div className="candidate-party">{voterParty === 'Democrat' ? 'Republican Nominee' : 'Democratic Nominee'}</div>
          <div className="electoral-votes" style={{ color: 'var(--secondary-accent)' }}>{rivalEV}</div>
        </div>
      </div>

      <div className="swing-states-section">
        <h3 className="swing-states-header">Key Battlegrounds (Closest Margins)</h3>

        {swingStates.map((state, idx) => {
          const total = state.playerPoll + state.oppPoll;
          const playerWidth = total > 0 ? (state.playerPoll / total) * 100 : 50;

          return (
            <div key={idx} className="swing-state-card">
              <div className="swing-state-info">
                <div className="swing-state-name">{state.name}</div>
                <div className="swing-state-ev">{state.ev} Electoral Votes</div>
              </div>

              <div className="swing-state-bar-container">
                <div className="swing-state-poll">
                  <span style={{ color: 'var(--primary-accent)' }}>{state.playerPoll}%</span>
                  <span style={{ color: 'var(--secondary-accent)' }}>{state.oppPoll}%</span>
                </div>
                <div className="swing-state-bar">
                  <div className="swing-state-bar-player" style={{ width: `${playerWidth}%` }}></div>
                </div>
                <button
                  style={{
                    marginTop: '0.5rem', padding: '0.3rem 0.8rem', borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.15)', color: 'var(--primary-accent)',
                    border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 'bold'
                  }}
                  onClick={() => {
                    // Navigate to map tab with this state selected — signal via custom event
                    window.dispatchEvent(new CustomEvent('politisim-navigate', { detail: { tab: 'map', state: state.name } }));
                  }}
                >
                  Campaign Here →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
