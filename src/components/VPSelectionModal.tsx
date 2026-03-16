import React from 'react';
import './VPSelectionModal.css';
import { useGameStore, VP_CANDIDATES } from '../store/gameStore';

export const VPSelectionModal: React.FC = () => {
  const { selectVP, vpSelectionPending } = useGameStore();

  if (!vpSelectionPending) return null;

  return (
    <div className="vp-modal-overlay">
      <div className="vp-modal">
        <h2 className="vp-title">🏛️ Select Your Running Mate</h2>
        <p className="vp-subtitle">
          You've secured the party nomination! Choose a Vice Presidential candidate to complement your platform for the General Election.
        </p>

        <div className="vp-grid">
          {VP_CANDIDATES.map((vp) => (
            <div key={vp.name} className="vp-card">
              <h3>{vp.name}</h3>
              <p className="vp-desc">{vp.description}</p>
              <div className="vp-bonuses">
                {Object.entries(vp.bonuses).map(([key, val]) => (
                  <span key={key} className={`vp-bonus ${(val || 0) > 0 ? 'pos' : 'neg'}`}>
                    {(val || 0) > 0 ? '+' : ''}{val} {key}
                  </span>
                ))}
                {vp.momentumBonus > 0 && <span className="vp-bonus pos">+{vp.momentumBonus} momentum</span>}
                {vp.trustBonus > 0 && <span className="vp-bonus pos">+{vp.trustBonus} trust</span>}
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
