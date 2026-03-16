import React, { useEffect, useState } from 'react';
import './EndGameScreen.css';
import { useGameStore, computeEVTotals } from '../store/gameStore';

export const EndGameScreen: React.FC = () => {
  const { states, pollingData, playerName, vpPick, difficulty, currentWeek, calendar, hiredStaff, resetGame, budget } = useGameStore();

  const [playerEV, setPlayerEV] = useState(0);
  const [rivalEV, setRivalEV] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);

  useEffect(() => {
    const { playerEV: pVotes, rivalEV: rVotes } = computeEVTotals(states, pollingData);
    setPlayerEV(pVotes);
    setRivalEV(rVotes);

    // Calculate achievements
    const achs: string[] = [];

    if (pVotes > rVotes) {
      achs.push('🏆 Victory — You won the presidency!');
    } else {
      achs.push('📉 Defeat — Better luck next election cycle.');
    }

    if (pVotes >= 400) achs.push('🌊 Landslide Victory — Won 400+ electoral votes');
    if (pVotes > rVotes && budget < 100000) achs.push('💰 Shoestring Budget — Won with less than $100K remaining');
    if (pVotes > rVotes && difficulty === 'hard') achs.push('🔥 Hard Mode Champion — Won on the hardest difficulty');
    if (hiredStaff.length >= 3) achs.push('👥 Full Staff — Hired all three staff members');
    if (vpPick) achs.push(`🤝 Running Mate — Selected ${vpPick.name} as VP`);
    
    // Check if won before Election Day (Week 70). Say Week 65 (early October)
    if (pVotes > rVotes && currentWeek <= 65) achs.push('⚡ Early Clinch — Secured victory before Election Day');

    setAchievements(achs);

    // Steam achievement hooks (uses invoke to match ipcMain.handle)
    if ((window as any).electron) {
      if (pVotes > rVotes) (window as any).electron.ipcRenderer.invoke('unlock-achievement', 'ACH_WIN');
      else (window as any).electron.ipcRenderer.invoke('unlock-achievement', 'ACH_LOSE');
      if (pVotes >= 400) (window as any).electron.ipcRenderer.invoke('unlock-achievement', 'ACH_LANDSLIDE');
      if (pVotes > rVotes && budget < 100000) (window as any).electron.ipcRenderer.invoke('unlock-achievement', 'ACH_SHOESTRING');
      if (pVotes > rVotes && difficulty === 'hard') (window as any).electron.ipcRenderer.invoke('unlock-achievement', 'ACH_HARD_MODE');
    }
  }, [states, pollingData, budget, difficulty, hiredStaff, vpPick, currentWeek, calendar]);

  const hasWon = playerEV > rivalEV;

  return (
    <div className="endgame-screen">
      <div className={`endgame-container ${hasWon ? 'victory' : 'defeat'}`}>
        <h1 className="endgame-title">
          {hasWon ? "CAMPAIGN VICTORY!" : "CONCESSION SPEECH"}
        </h1>

        <p className="endgame-subtitle">
          {hasWon
            ? `Congratulations, ${playerName}! The networks have called the race. You will be the next leader of the free world.`
            : `The numbers have fallen short for ${playerName}. The rival campaign has secured the necessary electoral votes.`}
        </p>

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

        {/* Achievements */}
        <div style={{ marginBottom: '2rem', textAlign: 'left', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Achievements Unlocked</h3>
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
