import React, { useEffect, useMemo } from 'react';
import './EndGameScreen.css';
import { useGameStore, computeEVTotals } from '../store/gameStore';
import { ACHIEVEMENT_CATALOG, getUnlockedAchievements, unlockAchievements, type AchievementId } from '../core/Achievements';

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

  const endgameAchievementIds = useMemo<AchievementId[]>(() => {
    if (endedInPrimary) {
      return ['ACH_PRIMARY_LOSS'];
    }

    return [
      hasWon ? 'ACH_WIN' : 'ACH_LOSE',
      ...(hasWon && playerEV >= 400 ? ['ACH_LANDSLIDE' as const] : []),
      ...(hasWon && budget < 100000 ? ['ACH_SHOESTRING' as const] : []),
      ...(hasWon && difficulty === 'hard' ? ['ACH_HARD_MODE' as const] : []),
      ...(hiredStaff.length >= 3 ? ['ACH_FULL_STAFF' as const] : []),
      ...(vpPick ? ['ACH_RUNNING_MATE' as const] : []),
      ...(hasWon && playerEV >= generalTarget + 25 ? ['ACH_EARLY_CLINCH' as const] : [])
    ];
  }, [budget, difficulty, endedInPrimary, generalTarget, hasWon, hiredStaff.length, playerEV, vpPick]);

  const achievementEntries = useMemo(() => {
    const unlockedSet = new Set<AchievementId>([...getUnlockedAchievements(), ...endgameAchievementIds]);
    return ACHIEVEMENT_CATALOG.filter((entry) => unlockedSet.has(entry.id));
  }, [endgameAchievementIds]);

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
    unlockAchievements(endgameAchievementIds);
  }, [endgameAchievementIds]);

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
            <h3>{endedInPrimary ? 'Campaign Summary' : 'Campaign Achievements'}</h3>
            {achievementEntries.map((achievement) => (
              <div key={achievement.id} className="endgame-list-item">
                <strong>{achievement.title}</strong> - {achievement.description}
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
