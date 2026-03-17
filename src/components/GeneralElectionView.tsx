import React from 'react';
import './GeneralElectionView.css';
import { useGameStore, computeEVTotals } from '../store/gameStore';
import { getRivalPersonaLine } from '../core/SimulationEngine';
import { CandidateIdentityCard } from './CandidateIdentityCard';

export const GeneralElectionView: React.FC = () => {
  const { states, pollingData, playerName, vpPick, voterParty, generalOpponent, fieldOperations, playerIssues } = useGameStore();
  const { playerEV, rivalEV } = computeEVTotals(states, pollingData);
  const generalTarget = Math.floor(states.reduce((sum, state) => sum + state.delegatesOrEV, 0) / 2) + 1;
  const opponentName = generalOpponent?.name ?? 'Opposition Nominee';
  const opponentParty = generalOpponent?.party ?? (voterParty === 'Democrat' ? 'Republican' : 'Democrat');
  const opponentTagline = generalOpponent?.tagline ?? `${opponentParty} standard-bearer`;
  const opponentPersona = generalOpponent ? getRivalPersonaLine(generalOpponent) : 'National ticket | battleground-focused campaign';

  const swingStates = [...states]
    .map((state) => {
      const poll = pollingData[state.stateName];
      if (!poll) return null;

      return {
        name: state.stateName,
        ev: state.delegatesOrEV,
        playerPoll: Math.round(poll.player * 10) / 10,
        oppPoll: Math.round(poll.rival * 10) / 10,
        margin: Math.abs(poll.player - poll.rival),
        officeLevel: fieldOperations[state.stateName]?.officeLevel ?? 0,
        volunteers: fieldOperations[state.stateName]?.volunteerStrength ?? 0,
        surrogates: fieldOperations[state.stateName]?.assignedSurrogates.length ?? 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.margin - b!.margin)
    .slice(0, 8) as { name: string; ev: number; playerPoll: number; oppPoll: number; margin: number; officeLevel: number; volunteers: number; surrogates: number }[];

  const playerLeadingBattlegrounds = swingStates.filter((state) => state.playerPoll >= state.oppPoll).length;

  return (
    <div className="general-view">
      <div className="general-header">
        <h2>General Election Map</h2>
        <p>The race to {generalTarget} electoral votes. The margin is narrow, the map is volatile, and debate fallout will matter.</p>
      </div>

      <div className="head-to-head">
        <div className="candidate-profile">
          <CandidateIdentityCard
            name={playerName}
            subtitle={vpPick ? `Ticket with ${vpPick.name}` : `${voterParty} nominee`}
            tagline="Your coalition is trying to lock down enough battlegrounds to cross the national threshold."
            party={voterParty}
            accentLabel="ticket"
            chips={playerIssues}
            stats={[
              { label: 'Projected EV', value: `${playerEV}` },
              { label: 'Target', value: `${generalTarget}` }
            ]}
          />
        </div>

        <div className="vs-badge">VS</div>

        <div className="candidate-profile">
          <CandidateIdentityCard
            name={opponentName}
            subtitle={`${opponentParty} nominee`}
            tagline={`${opponentTagline}. ${opponentPersona}`}
            party={opponentParty}
            accentLabel="opponent"
            chips={generalOpponent?.issueBrands ?? []}
            stats={[
              { label: 'Projected EV', value: `${rivalEV}` },
              { label: 'Target', value: `${generalTarget}` }
            ]}
          />
        </div>
      </div>

      <div className="race-outlook-card">
        <div>
          <div className="race-outlook-label">Race Outlook</div>
          <div className="race-outlook-copy">
            {playerEV >= generalTarget
              ? 'You are currently on a winning map, but the path is thin enough that one bad week can still break it.'
              : playerLeadingBattlegrounds >= Math.ceil(swingStates.length / 2)
                ? 'You are alive in the battlegrounds. Protect narrow leads before the opposition converts them into electoral votes.'
                : 'You are chasing the map. Rebuild trust and target the closest swing states before the battleground window closes.'}
          </div>
        </div>
        <div className="race-outlook-metric">
          <span>Closest swing average</span>
          <strong>{swingStates.length > 0 ? `${swingStates[0].margin.toFixed(1)} pts` : 'n/a'}</strong>
        </div>
      </div>

      <div className="swing-states-section">
        <h3 className="swing-states-header">Key Battlegrounds</h3>

        {swingStates.map((state) => {
          const total = state.playerPoll + state.oppPoll;
          const playerWidth = total > 0 ? (state.playerPoll / total) * 100 : 50;

          return (
            <div key={state.name} className="swing-state-card">
              <div className="swing-state-info">
                <div className="swing-state-name">{state.name}</div>
                <div className="swing-state-ev">{state.ev} Electoral Votes</div>
              </div>

              <div className="swing-state-bar-container">
                <div className="swing-state-poll">
                  <span style={{ color: 'var(--primary-accent)' }}>{state.playerPoll}%</span>
                  <span style={{ color: 'var(--secondary-accent)' }}>{state.oppPoll}%</span>
                </div>
                <div className="swing-state-ops">
                  <span>Office L{state.officeLevel}</span>
                  <span>{state.volunteers} volunteers</span>
                  <span>{state.surrogates} surrogates</span>
                </div>
                <div className="swing-state-bar">
                  <div className="swing-state-bar-player" style={{ width: `${playerWidth}%` }} />
                </div>
                <button
                  type="button"
                  className="swing-state-action"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('politisim-navigate', { detail: { tab: 'map', state: state.name } }));
                  }}
                >
                  Campaign Here
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
