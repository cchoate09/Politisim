import React from 'react';
import './EventModal.css';
import { useGameStore } from '../store/gameStore';
import { CandidateIdentityCard } from './CandidateIdentityCard';

export const EventModal: React.FC = () => {
  const { activeEvent, resolveEvent, playerName, voterParty, currentWeek, rivalAIs, generalOpponent, gamePhase } = useGameStore();

  if (!activeEvent) return null;

  const featuredOpponent = gamePhase === 'general'
    ? generalOpponent
    : [...rivalAIs].sort((left, right) => right.delegates - left.delegates || right.momentum - left.momentum)[0];
  const stageLabel = activeEvent.title.toLowerCase().includes('scandal')
    || activeEvent.description.toLowerCase().includes('leak')
    || activeEvent.description.toLowerCase().includes('investigation')
    ? 'Crisis Desk'
    : activeEvent.title.toLowerCase().includes('endorsement')
      ? 'Coalition Shock'
      : activeEvent.title.toLowerCase().includes('debate')
        ? 'Spin Room'
        : 'Campaign Moment';

  const describeChoiceProfile = (choice: { moneyEffect: number; momentumEffect: number; trustEffect: number }) => {
    const tags: string[] = [];
    if (choice.moneyEffect <= -100000) tags.push('High cash cost');
    else if (choice.moneyEffect < 0) tags.push('Moderate cash cost');
    else if (choice.moneyEffect > 0) tags.push('Fundraising upside');

    if (choice.momentumEffect >= 10) tags.push('Big narrative swing');
    else if (choice.momentumEffect > 0) tags.push('Momentum upside');
    else if (choice.momentumEffect <= -10) tags.push('Momentum risk');

    if (choice.trustEffect >= 8) tags.push('Trust upside');
    else if (choice.trustEffect <= -8) tags.push('Trust risk');

    return tags;
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal">
        <div className="event-stage-header">
          <div>
            <p className="event-kicker">{stageLabel}</p>
            <h2 className="event-title">{activeEvent.title}</h2>
            <p className="event-description">{activeEvent.description}</p>
          </div>
          <div className="event-stage-meta">
            <span>Week {currentWeek}</span>
            <span>{gamePhase === 'general' ? 'General Election' : 'Primary Season'}</span>
          </div>
        </div>

        <div className="event-stage-cast">
          <CandidateIdentityCard
            name={playerName}
            subtitle={`${voterParty} campaign`}
            tagline="Your decision here can reshape the next stretch of the race."
            party={voterParty}
            accentLabel="player"
            compact
          />
          {featuredOpponent && (
            <CandidateIdentityCard
              name={featuredOpponent.name}
              subtitle={gamePhase === 'general' ? 'Opponent war room' : 'Lead rival'}
              tagline={featuredOpponent.tagline}
              party={featuredOpponent.party}
              accentLabel={gamePhase === 'general' ? 'opponent' : 'field leader'}
              chips={featuredOpponent.issueBrands.slice(0, 2)}
              compact
            />
          )}
        </div>

        <div className="event-choices">
          {activeEvent.choices.map((choice, index) => (
            <button
              key={index}
              className="event-choice-btn"
              onClick={() => resolveEvent(index)}
            >
              <div className="choice-topline">
                <div className="choice-text">{choice.text}</div>
                <span className="choice-index">Option {index + 1}</span>
              </div>
              <div className="choice-profiles">
                {describeChoiceProfile(choice).map((tag) => (
                  <span key={`${choice.text}-${tag}`} className="choice-profile-tag">{tag}</span>
                ))}
              </div>
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
