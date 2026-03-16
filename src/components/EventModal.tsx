import React from 'react';
import './EventModal.css';
import { useGameStore } from '../store/gameStore';

export const EventModal: React.FC = () => {
  const { activeEvent, resolveEvent } = useGameStore();

  if (!activeEvent) return null;

  return (
    <div className="event-modal-overlay">
      <div className="event-modal">
        <h2 className="event-title">{activeEvent.title}</h2>
        <p className="event-description">{activeEvent.description}</p>
        
        <div className="event-choices">
          {activeEvent.choices.map((choice, index) => (
            <button 
              key={index}
              className="event-choice-btn"
              onClick={() => resolveEvent(index)}
            >
              <div className="choice-text">{choice.text}</div>
              <div className="choice-effects">
                {choice.moneyEffect !== 0 && (
                  <span className={choice.moneyEffect > 0 ? "effect-pos" : "effect-neg"}>
                    {choice.moneyEffect > 0 ? '+' : '-'}${Math.abs(choice.moneyEffect).toLocaleString()}
                  </span>
                )}
                {choice.momentumEffect !== 0 && (
                  <span className={choice.momentumEffect > 0 ? "effect-pos" : "effect-neg"}>
                    {choice.momentumEffect > 0 ? '+' : '-'}{Math.abs(choice.momentumEffect)} Momentum
                  </span>
                )}
                {choice.trustEffect !== 0 && (
                  <span className={choice.trustEffect > 0 ? "effect-pos" : "effect-neg"}>
                    {choice.trustEffect > 0 ? '+' : '-'}{Math.abs(choice.trustEffect)}% Trust
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
