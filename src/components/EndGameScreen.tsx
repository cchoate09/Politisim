import React, { useEffect, useMemo } from 'react';
import './EndGameScreen.css';
import { useGameStore, computeEVTotals } from '../store/gameStore';

export const EndGameScreen: React.FC = () => {
  const {
    states,
    pollingData,
    playerName,
    vpPick,
    difficulty,
    currentWeek,
    hiredStaff,
    resetGame,
    budget,
    endReason,
    playerDelegates,
    delegateTarget,
  } = useGameStore();

  const { playerEV, rivalEV } = useMemo(
    () => computeEVTotals(states, pollingData),
    [states, pollingData]
  );

  const endedInPrimary = endReason === 'primary_loss';
  const hasWon = !endedInPrimary && playerEV > rivalEV;

  const achievements = useMemo(() => {
    if (endedInPrimary) {
      return ['Campaign Setback - You failed to secure enough delegates to win the nomination.'];
    }

    const achs: string[] = [];

    if (hasWon) {
      achs.push('Victory - You won the presidency!');
    } else {
      achs.push('Defeat - Better luck next election cycle.');
    }

    if (playerEV >= 400) achs.push('Landslide Victory - Won 400+ electoral votes');
    if (hasWon && budget < 100000) achs.push('Shoestring Budget - Won with less than $100K remaining');
    if (hasWon && difficulty === 'hard') achs.push('Hard Mode Champion - Won on the hardest difficulty');
    if (hiredStaff.length >= 3) achs.push('Full Staff - Hired all three staff members');
    if (vpPick) achs.push(`Running Mate - Selected ${vpPick.name} as VP`);
    if (hasWon && currentWeek <= 65) achs.push('Early Clinch - Secured victory before Election Day');

    return achs;
  }, [budget, currentWeek, difficulty, endedInPrimary, hasWon, hiredStaff.length, playerEV, vpPick]);

  useEffect(() => {
    if (endedInPrimary || !window.electron) return;

    const unlockAchievements = async () => {
      if (hasWon) {
        await window.electron?.unlockAchievement('ACH_WIN');
      } else {
        await window.electron?.unlockAchievement('ACH_LOSE');
      }

      if (playerEV >= 400) await window.electron?.unlockAchievement('ACH_LANDSLIDE');
      if (hasWon && budget < 100000) await window.electron?.unlockAchievement('ACH_SHOESTRING');
      if (hasWon && difficulty === 'hard') await window.electron?.unlockAchievement('ACH_HARD_MODE');
    };

    void unlockAchievements();
  }, [budget, difficulty, endedInPrimary, hasWon, playerEV]);

  return (
    <div className="endgame-screen">
      <div className={`endgame-container ${hasWon ? 'victory' : 'defeat'}`}>
        <h1 className="endgame-title">
          {endedInPrimary ? 'PRIMARY DEFEAT' : hasWon ? 'CAMPAIGN VICTORY!' : 'CONCESSION SPEECH'}
        </h1>

        <p className="endgame-subtitle">
          {endedInPrimary
            ? `${playerName}'s campaign ended at the convention. The party moved on without you after a bruising primary fight.`
            : hasWon
              ? `Congratulations, ${playerName}! The networks have called the race. You will be the next leader of the free world.`
              : `The numbers have fallen short for ${playerName}. The rival campaign has secured the necessary electoral votes.`}
        </p>

        {endedInPrimary ? (
          <div className="electoral-results">
            <div className="result-card player-result">
              <span className="result-label">{playerName}</span>
              <span className="result-value">{playerDelegates} Del</span>
            </div>

            <div className="result-divider">VS</div>

            <div className="result-card rival-result">
              <span className="result-label">Nomination Threshold</span>
              <span className="result-value">{delegateTarget} Del</span>
            </div>
          </div>
        ) : (
          <div className="electoral-results">
            <div className="result-card player-result">
              <span className="result-label">{playerName}</span>
              <span className="result-value">{playerEV} EV</span>
            </div>

            <div className="result-divider">VS</div>

            <div className="result-card rival-result">
              <span className="result-label">Rival Nominee</span>
              <span className="result-value">{rivalEV} EV</span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '2rem', textAlign: 'left', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {endedInPrimary ? 'Campaign Summary' : 'Achievements Unlocked'}
          </h3>
          {achievements.map((ach, i) => (
            <div key={i} style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              marginBottom: '0.4rem',
              fontSize: '0.9rem'
            }}>
              {ach}
            </div>
          ))}
        </div>

        <button
          className="restart-btn"
          onClick={() => resetGame()}
        >
          Start New Campaign
        </button>
      </div>
    </div>
  );
};
