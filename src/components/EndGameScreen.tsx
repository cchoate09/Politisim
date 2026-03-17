import React, { useEffect, useMemo } from 'react';
import './EndGameScreen.css';
import { useGameStore, computeEVTotals } from '../store/gameStore';

interface AchievementEntry {
  label: string;
  achievementId: string;
  unlocked: boolean;
}

export const EndGameScreen: React.FC = () => {
  const {
    states,
    pollingData,
    playerName,
    vpPick,
    difficulty,
    hiredStaff,
    resetGame,
    budget,
    endReason,
    playerDelegates,
    delegateTarget,
    generalOpponent,
    activityLog,
    activeElectionNight,
  } = useGameStore();

  const { playerEV, rivalEV } = useMemo(
    () => activeElectionNight
      ? { playerEV: activeElectionNight.playerEV, rivalEV: activeElectionNight.rivalEV }
      : computeEVTotals(states, pollingData),
    [activeElectionNight, states, pollingData]
  );

  const generalTarget = Math.floor(states.reduce((sum, state) => sum + state.delegatesOrEV, 0) / 2) + 1;
  const endedInPrimary = endReason === 'primary_loss';
  const hasWon = endReason === 'general_win';
  const opponentName = generalOpponent?.name ?? 'Opposition Nominee';

  const achievements = useMemo<AchievementEntry[]>(() => {
    if (endedInPrimary) {
      return [{
        label: 'Campaign Setback - You failed to secure enough delegates to win the nomination.',
        achievementId: 'ACH_PRIMARY_LOSS',
        unlocked: true
      }];
    }

    return [
      {
        label: hasWon ? 'Victory - You won the presidency.' : 'Defeat - Better luck next election cycle.',
        achievementId: hasWon ? 'ACH_WIN' : 'ACH_LOSE',
        unlocked: true
      },
      {
        label: 'Landslide Victory - Win 400 or more electoral votes.',
        achievementId: 'ACH_LANDSLIDE',
        unlocked: hasWon && playerEV >= 400
      },
      {
        label: 'Shoestring Budget - Win with less than $100K remaining.',
        achievementId: 'ACH_SHOESTRING',
        unlocked: hasWon && budget < 100000
      },
      {
        label: 'Hard Mode Champion - Win on hard difficulty.',
        achievementId: 'ACH_HARD_MODE',
        unlocked: hasWon && difficulty === 'hard'
      },
      {
        label: 'Full Staff - Hire all three staff roles.',
        achievementId: 'ACH_FULL_STAFF',
        unlocked: hiredStaff.length >= 3
      },
      {
        label: vpPick ? `Running Mate - Complete the ticket with ${vpPick.name}.` : 'Running Mate - Complete the ticket with a vice presidential pick.',
        achievementId: 'ACH_RUNNING_MATE',
        unlocked: Boolean(vpPick)
      },
      {
        label: 'Electoral Cushion - Win with a comfortable map above the minimum threshold.',
        achievementId: 'ACH_EARLY_CLINCH',
        unlocked: hasWon && playerEV >= generalTarget + 25
      }
    ];
  }, [budget, difficulty, endedInPrimary, generalTarget, hasWon, hiredStaff.length, playerEV, vpPick]);

  const stateHighlights = useMemo(() => {
    if (endedInPrimary) return [];

    const calledStates = activeElectionNight
      ? activeElectionNight.results.map((result) => ({
          name: result.stateName,
          value: result.electoralVotes,
          margin: result.margin,
          playerWon: result.winnerId === 'player'
        }))
      : states
          .map((state) => {
            const poll = pollingData[state.stateName];
            if (!poll) return null;

            const playerWon = poll.player >= poll.rival;
            return {
              name: state.stateName,
              value: state.delegatesOrEV,
              margin: Math.abs(poll.player - poll.rival),
              playerWon
            };
          })
          .filter(Boolean) as { name: string; value: number; margin: number; playerWon: boolean }[];

    const highlights = calledStates
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return highlights;
  }, [activeElectionNight, endedInPrimary, pollingData, states]);

  const closingMoments = useMemo(() => activityLog.slice(-4).reverse(), [activityLog]);

  useEffect(() => {
    if (endedInPrimary || !window.electron) return;

    const unlockAchievements = async () => {
      for (const achievement of achievements) {
        if (achievement.unlocked) {
          await window.electron?.unlockAchievement(achievement.achievementId);
        }
      }
    };

    void unlockAchievements();
  }, [achievements, endedInPrimary]);

  return (
    <div className="endgame-screen">
      <div className={`endgame-container ${hasWon ? 'victory' : 'defeat'}`}>
        <h1 className="endgame-title">
          {endedInPrimary ? 'PRIMARY DEFEAT' : hasWon ? 'ELECTION NIGHT VICTORY' : 'CONCESSION NIGHT'}
        </h1>

        <p className="endgame-subtitle">
          {endedInPrimary
            ? `${playerName}'s campaign ended at the convention after falling short of the delegate threshold.`
            : hasWon
              ? `${playerName} defeated ${opponentName} and secured the presidency on the national map.`
              : `${opponentName} carried the electoral map. ${playerName}'s campaign came up short in the general election.`}
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
              <span className="result-label">{opponentName}</span>
              <span className="result-value">{rivalEV} EV</span>
            </div>
          </div>
        )}

        {!endedInPrimary && (
          <div className="result-briefing">
            <div className="result-briefing-card">
              <span className="result-briefing-label">Winning Number</span>
              <strong>{generalTarget} EV</strong>
            </div>
            <div className="result-briefing-card">
              <span className="result-briefing-label">Ticket</span>
              <strong>{vpPick ? `${playerName} / ${vpPick.name}` : playerName}</strong>
            </div>
          </div>
        )}

        <div className="endgame-grid">
          <div className="endgame-panel">
            <h3>{endedInPrimary ? 'Campaign Summary' : 'Achievements Unlocked'}</h3>
            {achievements.filter((achievement) => achievement.unlocked).map((achievement) => (
              <div key={achievement.achievementId} className="endgame-list-item">
                {achievement.label}
              </div>
            ))}
          </div>

          <div className="endgame-panel">
            <h3>{endedInPrimary ? 'Final Weeks' : 'Map Highlights'}</h3>
            {endedInPrimary ? (
              closingMoments.map((entry, index) => (
                <div key={`${entry.week}-${index}`} className="endgame-list-item">
                  Week {entry.week}: {entry.message}
                </div>
              ))
            ) : (
              stateHighlights.map((state) => (
                <div key={state.name} className="endgame-list-item">
                  {state.name} ({state.value} EV) - {state.playerWon ? `${playerName} +` : `${opponentName} +`}{state.margin.toFixed(1)}
                </div>
              ))
            )}
          </div>
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
