import React from 'react';
import './VPSelectionModal.css';
import { useGameStore } from '../store/gameStore';
import { getScenarioVPCandidates } from '../core/ScenarioContent';

export const VPSelectionModal: React.FC = () => {
  const { selectVP, vpSelectionPending, scenarioId, voterParty } = useGameStore();
  const candidates = getScenarioVPCandidates(scenarioId, voterParty);

  if (!vpSelectionPending) return null;

  return (
    <div className="vp-modal-overlay">
      <div className="vp-modal">
        <h2 className="vp-title">🏛️ Select Your Running Mate</h2>
        <p className="vp-subtitle">
          You've secured the party nomination! Choose a Vice Presidential candidate to complement your platform for the General Election.
        </p>

        <div className="vp-grid">
          {candidates.map((vp) => (
            <div key={vp.id} className="vp-card">
              <div className="vp-card-top">
                <div>
                  <h3>{vp.name}</h3>
                  <div className="vp-role">{vp.title}</div>
                </div>
                <div className="vp-region">{vp.homeRegion}</div>
              </div>
              <p className="vp-desc">{vp.description}</p>
              <div className="vp-copy"><strong>Strengths:</strong> {vp.strengths.join(', ')}</div>
              <div className="vp-copy"><strong>Liabilities:</strong> {vp.liabilities.join(', ')}</div>
              <div className="vp-copy"><strong>Issue lanes:</strong> {vp.issueFocus.join(', ')}</div>
              <div className="vp-bonuses">
                {Object.entries(vp.bonuses).map(([key, val]) => (
                  <span key={key} className={`vp-bonus ${(val || 0) > 0 ? 'pos' : 'neg'}`}>
                    {(val || 0) > 0 ? '+' : ''}{val} {key}
                  </span>
                ))}
                <span className="vp-bonus pos">+{vp.momentumBonus} momentum</span>
                <span className="vp-bonus pos">+{vp.trustBonus} trust</span>
                <span className="vp-bonus pos">+${Math.round(vp.budgetBonus / 1000)}K launch cash</span>
                <span className="vp-bonus pos">+{vp.volunteerBonus} volunteers</span>
                <span className="vp-bonus pos">{vp.turnoutBonus.toFixed(1)} turnout</span>
                <span className="vp-bonus pos">{vp.battlegroundLift} battleground lift</span>
              </div>
              <button className="vp-select-btn" onClick={() => selectVP(vp)}>
                Select {vp.name.split(' ').pop()}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
