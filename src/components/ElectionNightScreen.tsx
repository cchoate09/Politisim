import React from 'react';
import './ElectionNightScreen.css';
import { useGameStore } from '../store/gameStore';

export const ElectionNightScreen: React.FC = () => {
  const {
    activeElectionNight,
    playerName,
    generalOpponent,
    advanceElectionNight,
    finalizeElectionNight
  } = useGameStore();

  if (!activeElectionNight) return null;

  const opponentName = generalOpponent?.name ?? 'Opposition Nominee';
  const latestWave = activeElectionNight.results
    .filter((result) => result.called && result.callRound === activeElectionNight.round)
    .sort((left, right) => right.electoralVotes - left.electoralVotes);
  const outstanding = activeElectionNight.results
    .filter((result) => !result.called)
    .sort((left, right) => {
      if (left.margin !== right.margin) return left.margin - right.margin;
      return right.electoralVotes - left.electoralVotes;
    })
    .slice(0, 8);

  const calledPct = Math.round((activeElectionNight.results.filter((result) => result.called).length / activeElectionNight.results.length) * 100);
  const raceLeader = activeElectionNight.playerEV >= activeElectionNight.rivalEV ? playerName : opponentName;
  const actionLabel = activeElectionNight.projectedWinnerId || outstanding.length === 0
    ? 'Finalize Result'
    : activeElectionNight.round === 0
      ? 'Call First Wave'
      : 'Call Next Wave';

  const closestOutstanding = outstanding[0]
    ? `${outstanding[0].stateName} is still live at ${outstanding[0].margin.toFixed(1)} points.`
    : 'No outstanding battlegrounds remain.';

  return (
    <div className="election-night-screen">
      <div className="election-night-shell">
        <header className="election-night-header">
          <div>
            <div className="election-night-kicker">Decision Desk</div>
            <h1>Election Night</h1>
            <p>{activeElectionNight.headline}</p>
          </div>
          <div className="election-night-round">
            <span>Round {activeElectionNight.round} / {activeElectionNight.totalRounds}</span>
            <strong>{calledPct}% of states called</strong>
          </div>
        </header>

        <section className="election-night-scoreboard">
          <div className="night-score player">
            <span>{playerName}</span>
            <strong>{activeElectionNight.playerEV}</strong>
            <small>Electoral votes called</small>
          </div>
          <div className="night-target">
            <span>Winning Number</span>
            <strong>{activeElectionNight.targetEV}</strong>
            <small>{raceLeader} leads the map right now</small>
          </div>
          <div className="night-score rival">
            <span>{opponentName}</span>
            <strong>{activeElectionNight.rivalEV}</strong>
            <small>Electoral votes called</small>
          </div>
        </section>

        <section className="election-night-summary">
          <div className="summary-blurb">
            <strong>Desk Summary</strong>
            <p>{activeElectionNight.summary}</p>
          </div>
          <div className="summary-blurb">
            <strong>Closest Outstanding</strong>
            <p>{closestOutstanding}</p>
          </div>
        </section>

        <div className="election-night-grid">
          <section className="night-panel">
            <div className="night-panel-header">
              <h3>{activeElectionNight.round === 0 ? 'First Calls Pending' : 'Latest Calls'}</h3>
              <span>{latestWave.length} states in the most recent wave</span>
            </div>
            <div className="night-call-list">
              {latestWave.length === 0 ? (
                <div className="night-empty">The networks are waiting for enough returns to make the first projection.</div>
              ) : (
                latestWave.map((result) => (
                  <div key={result.stateName} className="night-call-card">
                    <div>
                      <strong>{result.stateName}</strong>
                      <span>{result.electoralVotes} EV</span>
                    </div>
                    <div className={`night-call-winner ${result.winnerId === 'player' ? 'player' : 'rival'}`}>
                      {result.winnerId === 'player' ? playerName : opponentName} +{result.margin.toFixed(1)}
                    </div>
                    <p>{result.callReason}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="night-panel">
            <div className="night-panel-header">
              <h3>Outstanding Battlegrounds</h3>
              <span>{outstanding.length} closest uncalled states</span>
            </div>
            <div className="night-call-list compact">
              {outstanding.length === 0 ? (
                <div className="night-empty">Every state has now been called.</div>
              ) : (
                outstanding.map((result) => (
                  <div key={result.stateName} className="night-call-card compact">
                    <div>
                      <strong>{result.stateName}</strong>
                      <span>{result.electoralVotes} EV</span>
                    </div>
                    <div className="night-outstanding-meta">
                      <span>{result.margin.toFixed(1)} pts</span>
                      <span>{result.region}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="night-panel timeline">
          <div className="night-panel-header">
            <h3>Night Timeline</h3>
            <span>Latest desk notes and projections</span>
          </div>
          <div className="night-timeline">
            {activeElectionNight.momentLog.length === 0 ? (
              <div className="night-empty">No calls yet. The timeline will update as the desk projects states.</div>
            ) : (
              activeElectionNight.momentLog.map((entry, index) => (
                <div key={`${entry}-${index}`} className="night-timeline-entry">{entry}</div>
              ))
            )}
          </div>
        </section>

        <div className="night-actions">
          <button
            type="button"
            className="night-action-btn"
            onClick={activeElectionNight.projectedWinnerId || outstanding.length === 0 ? finalizeElectionNight : advanceElectionNight}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
