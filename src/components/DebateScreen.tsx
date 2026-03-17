import React from 'react';
import './DebateScreen.css';
import { useGameStore } from '../store/gameStore';

export const DebateScreen: React.FC = () => {
  const { activeDebate, answerDebateQuestion, advanceDebate } = useGameStore();

  if (!activeDebate) return null;

  const currentQuestion = activeDebate.questions[activeDebate.currentQuestionIndex];
  if (!currentQuestion) return null;

  const isAnswered = activeDebate.selectedChoiceIndex !== null;
  const progress = ((activeDebate.currentQuestionIndex + 1) / activeDebate.questions.length) * 100;
  const audienceTags = activeDebate.audienceLabel.split(',').map((tag) => tag.trim());

  return (
    <div className="debate-overlay">
      <div className="debate-backdrop-glow debate-backdrop-glow-left" />
      <div className="debate-backdrop-glow debate-backdrop-glow-right" />

      <section className="debate-stage">
        <header className="debate-header">
          <div>
            <p className="debate-kicker">
              {activeDebate.phase === 'primary' ? 'Nomination Debate' : 'General Election Debate'}
            </p>
            <h2>{activeDebate.title}</h2>
            <p className="debate-subtitle">{activeDebate.subtitle}</p>
          </div>

          <div className="debate-progress-card">
            <div className="debate-progress-label">
              <span>{activeDebate.venue}</span>
              <span>Question {activeDebate.currentQuestionIndex + 1} / {activeDebate.questions.length}</span>
            </div>
            <div className="debate-progress-bar">
              <div className="debate-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        <div className="debate-cast">
          {activeDebate.participants.map((participant) => (
            <article
              key={`${activeDebate.id}-${participant.name}`}
              className={`debate-podium ${participant.role === 'player' ? 'debate-podium-player' : ''}`}
            >
              <div className="debate-podium-crest" />
              <p className="debate-podium-tag">{participant.tagline}</p>
              <h3>{participant.name}</h3>
            </article>
          ))}
        </div>

        <div className="debate-middle-row">
          <aside className="debate-moderator-card">
            <p className="debate-section-label">Moderator</p>
            <h3>{activeDebate.moderator}</h3>
            <p>{activeDebate.venue}</p>
          </aside>

          <section className="debate-question-card">
            <p className="debate-section-label">{currentQuestion.topic}</p>
            <p className="debate-question-text">{currentQuestion.prompt}</p>
          </section>
        </div>

        <div className="debate-choices">
          {currentQuestion.choices.map((choice, index) => {
            const isSelected = activeDebate.selectedChoiceIndex === index;

            return (
              <button
                key={`${currentQuestion.id}-${index}`}
                type="button"
                className={`debate-choice ${isSelected ? 'debate-choice-selected' : ''}`}
                onClick={() => answerDebateQuestion(index)}
                disabled={isAnswered}
              >
                <span className="debate-choice-index">{index + 1}</span>
                <span>{choice.text}</span>
              </button>
            );
          })}
        </div>

        <div className="debate-bottom-row">
          <section className="debate-audience-card">
            <p className="debate-section-label">Audience</p>
            <div className="debate-audience-silhouettes" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={`audience-${index}`} className="debate-audience-figure" />
              ))}
            </div>
            <div className="debate-audience-tags">
              {audienceTags.map((tag) => (
                <span key={`${activeDebate.id}-${tag}`} className="debate-audience-tag">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="debate-reaction-card">
            <p className="debate-section-label">Room Reaction</p>
            <p className="debate-reaction-text">
              {activeDebate.latestReaction ?? 'Choose an answer and the stage moves with you.'}
            </p>
            {isAnswered && (
              <button type="button" className="debate-next-button" onClick={advanceDebate}>
                {activeDebate.currentQuestionIndex === activeDebate.questions.length - 1
                  ? 'Return to Campaign'
                  : 'Next Question'}
              </button>
            )}
          </section>
        </div>
      </section>
    </div>
  );
};
