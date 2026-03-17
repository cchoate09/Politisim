import React from 'react';
import './ConventionModal.css';
import { useGameStore } from '../store/gameStore';

export const ConventionModal: React.FC = () => {
  const { activeConvention, answerConventionChoice, advanceConvention } = useGameStore();

  if (!activeConvention) return null;

  const isAnswered = activeConvention.selectedChoiceIndex !== null;

  return (
    <div className="convention-overlay">
      <div className="convention-modal">
        <div className="convention-header">
          <div>
            <div className="convention-kicker">Brokered Convention</div>
            <h2>{activeConvention.title}</h2>
            <p>{activeConvention.subtitle}</p>
          </div>
          <div className="convention-ballot-card">
            <span>Ballot {activeConvention.ballot} / {activeConvention.maxBallots}</span>
            <strong>{activeConvention.leadingRivalName} leads the floor</strong>
          </div>
        </div>

        <div className="convention-scoreboard">
          <div className="convention-score">
            <span>Your Delegates</span>
            <strong>{activeConvention.playerDelegates}</strong>
          </div>
          <div className="convention-score">
            <span>Leading Rival</span>
            <strong>{activeConvention.rivalDelegates}</strong>
          </div>
          <div className="convention-score">
            <span>Free Delegates</span>
            <strong>{activeConvention.freeDelegates}</strong>
          </div>
          <div className="convention-score">
            <span>To Nominate</span>
            <strong>{activeConvention.targetDelegates}</strong>
          </div>
        </div>

        <div className="convention-body">
          <div className="convention-choice-column">
            {activeConvention.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                className={`convention-choice ${activeConvention.selectedChoiceIndex === index ? 'selected' : ''}`}
                onClick={() => answerConventionChoice(index)}
                disabled={isAnswered}
              >
                <h3>{choice.title}</h3>
                <p>{choice.description}</p>
              </button>
            ))}
          </div>

          <div className="convention-side-column">
            <div className="convention-panel">
              <div className="convention-panel-label">Floor Reaction</div>
              <p>{activeConvention.latestReaction ?? 'Choose a convention strategy to start moving delegates.'}</p>
              {isAnswered && (
                <button type="button" className="convention-next-btn" onClick={advanceConvention}>
                  {activeConvention.ballot === activeConvention.maxBallots ? 'Resolve Convention' : 'Advance to Next Ballot'}
                </button>
              )}
            </div>

            <div className="convention-panel">
              <div className="convention-panel-label">Ballot History</div>
              <div className="convention-history">
                {activeConvention.history.length === 0 ? (
                  <p>No blocs have broken yet.</p>
                ) : (
                  activeConvention.history.map((entry, index) => (
                    <div key={`${entry}-${index}`} className="convention-history-item">{entry}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
