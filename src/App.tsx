import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { PrimaryElectionView } from './components/PrimaryElectionView';
import { GeneralElectionView } from './components/GeneralElectionView';
import { USAMap } from './components/USAMap';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CandidateCreator } from './components/CandidateCreator';
import { BudgetAllocationView } from './components/BudgetAllocationView';
import { EventModal } from './components/EventModal';
import { StateActionPanel } from './components/StateActionPanel';
import { CampaignHQView } from './components/CampaignHQView';
import { EndGameScreen } from './components/EndGameScreen';
import { VPSelectionModal } from './components/VPSelectionModal';
import { ActivityLog } from './components/ActivityLog';
import { useGameStore, computeEVTotals } from './store/gameStore';

const TABS = ['map', 'analytics', 'primary', 'general', 'campaign', 'budget'] as const;

function App() {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [showSaveSlots, setShowSaveSlots] = useState(false);

  const {
    budget, currentWeek, advanceWeek, momentum, saveGame, loadGame, getSaveSlots,
    gamePhase, calendarPhase, calendar, publicTrust, stamina, states, pollingData,
    playerDelegates, rivalDelegates, delegateTarget, vpSelectionPending,
    playerIdeology, playerName, hasStarted, setHasStarted, voterParty
  } = useGameStore();

  // Current calendar entry
  const calendarEntry = calendar.length > 0 && currentWeek <= calendar.length
    ? calendar[currentWeek - 1]
    : null;
  const calendarLabel = calendarEntry ? `${calendarEntry.month} ${calendarEntry.year}` : `Week ${currentWeek}`;
  const weeksLeft = calendar.length - currentWeek;

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(budget);

  // Compute real EV totals from simulation data
  const { playerEV, rivalEV } = computeEVTotals(states, pollingData);

  // ── Keyboard Shortcuts ──
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!hasStarted || gamePhase === 'ended') return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      advanceWeek();
    } else if (e.code === 'Escape') {
      setSelectedState(undefined);
      setShowSaveSlots(false);
    } else if (e.key >= '1' && e.key <= '6') {
      const idx = parseInt(e.key) - 1;
      if (idx < TABS.length) setActiveTab(TABS[idx]);
    }
  }, [hasStarted, gamePhase, advanceWeek]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Listen for navigation events from GeneralElectionView "Campaign Here" buttons ──
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) setActiveTab(detail.tab);
      if (detail?.state) setSelectedState(detail.state);
    };
    window.addEventListener('politisim-navigate', handler);
    return () => window.removeEventListener('politisim-navigate', handler);
  }, []);

  // Show Candidate Creator until player finishes platform setup
  if (!hasStarted) {
    return <CandidateCreator onComplete={() => setHasStarted(true)} />;
  }

  // Show End Game screen if the timeline has finished
  if (gamePhase === 'ended') {
    return <EndGameScreen />;
  }

  const saveSlots = getSaveSlots();

  return (
    <>
      <EventModal />
      {vpSelectionPending && <VPSelectionModal />}
      <div className={`command-center ${voterParty === 'Republican' ? 'republican-theme' : ''}`}>
      {/* LEFT NAVIGATION PANEL */}
      <aside className="glass-panel nav-panel">
        <h2>PolitiSim Command</h2>
        <div style={{ margin: '0.5rem 0 1rem 0', opacity: 0.5, borderTop: '1px solid white' }}></div>

        <div className="nav-link" style={{ pointerEvents: 'none', color: 'var(--text-main)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          📅 {calendarLabel}
        </div>
        <div className="nav-link" style={{ pointerEvents: 'none', color: 'var(--text-muted)', marginBottom: '0.15rem', fontSize: '0.75rem' }}>
          {weeksLeft > 0 ? `${weeksLeft} weeks to Election Day` : 'Election Day'}
        </div>
        <div className="nav-link" style={{ pointerEvents: 'none', color: gamePhase === 'general' ? 'var(--primary-accent)' : calendarPhase === 'convention' ? '#fbbf24' : 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
          {calendarPhase === 'campaigning' && '📣 Early Campaign'}
          {calendarPhase === 'primary' && '🗳️ Primary Season'}
          {calendarPhase === 'convention' && '🏛️ Convention'}
          {calendarPhase === 'general' && '🏛️ General Election'}
          {calendarPhase === 'election_day' && '🗳️ Election Day'}
        </div>

        {TABS.map((tab, idx) => (
          <div
            key={tab}
            className={`nav-link ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span style={{ opacity: 0.4, marginRight: '0.5rem', fontSize: '0.8rem' }}>{idx + 1}</span>
            {tab === 'map' && 'Electoral Map'}
            {tab === 'analytics' && 'Analytics & Polling'}
            {tab === 'primary' && 'Primary Election'}
            {tab === 'general' && 'General Election'}
            {tab === 'campaign' && 'Campaign HQ & Staff'}
            {tab === 'budget' && 'Budget Allocation'}
          </div>
        ))}

        <div style={{ flexGrow: 1 }}></div>

        <div className="stat-card" data-tooltip="Total money available for ads, staff, and events.">
          <div className="stat-card-title">Campaign Funds</div>
          <div className="stat-card-value" style={{ color: '#2ea043' }}>{formattedBudget}</div>
        </div>
      </aside>

      {/* CENTER VIEW */}
      <main className="glass-panel center-view" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'map' && (
          <USAMap
            activeStateName={selectedState}
            onStateClick={(name: string) => setSelectedState(name)}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'primary' && <PrimaryElectionView />}
        {activeTab === 'general' && <GeneralElectionView />}
        {activeTab === 'campaign' && <CampaignHQView />}
        {activeTab === 'budget' && <BudgetAllocationView />}
      </main>

      {/* RIGHT STATS PANEL */}
      {activeTab === 'map' && selectedState ? (
        <StateActionPanel stateName={selectedState} onClose={() => setSelectedState(undefined)} />
      ) : (
        <aside className="glass-panel stats-panel">
          <h3>National Dashboard</h3>

        <div className="stat-card" data-tooltip={gamePhase === 'primary' ? 'Reach the target to secure your party nomination.' : 'Target 270 EVs to win the Presidency.'}>
          <div className="stat-card-title">
            {gamePhase === 'primary' ? 'Delegate Count' : 'Projected Electoral Votes'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="stat-card-value" style={{ color: 'var(--primary-accent)' }}>{gamePhase === 'primary' ? playerDelegates : playerEV}</div>
            <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>/ {gamePhase === 'primary' ? delegateTarget : 270} to win</div>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{
              width: `${gamePhase === 'primary' ? (playerDelegates / delegateTarget * 100) : (playerEV / 270 * 100)}%`
            }}></div>
          </div>
          {/* Show rival count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            <span>{playerName}: {gamePhase === 'primary' ? playerDelegates : playerEV}</span>
            <span>Rival: {gamePhase === 'primary' ? rivalDelegates : rivalEV}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Voter Ideology Profile</div>
          {(['worker', 'owner', 'liberal', 'religious', 'libertarian', 'immigrant'] as const).map(key => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>{key === 'owner' ? 'Business' : key === 'worker' ? 'Working Class' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span style={{ color: 'var(--primary-accent)' }}>{playerIdeology[key]}</span>
            </div>
          ))}
        </div>

        <div className="stat-card" data-tooltip="High trust makes your ads more effective. Low trust triggers scandal events.">
          <div className="stat-card-title">Public Trust</div>
          <div className="stat-card-value" style={{ color: publicTrust > 60 ? '#2ea043' : publicTrust > 30 ? '#d29922' : '#f85149' }}>
            {publicTrust}%
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${publicTrust}%`, background: publicTrust > 60 ? '#2ea043' : publicTrust > 30 ? '#d29922' : '#f85149' }}></div>
          </div>
        </div>

        {/* MOMENTUM AURA MECHANIC */}
        <div className="stat-card" style={{
          background: momentum > 50 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0,0,0,0.25)',
          border: momentum > 50 ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div className="stat-card-title" style={{ color: momentum > 50 ? '#38bdf8' : 'var(--text-muted)' }}>
            Campaign Momentum
          </div>
          <div className="stat-card-value" style={{ color: momentum > 50 ? '#38bdf8' : 'var(--text-main)' }}>
            {momentum} / 100
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>
            {momentum > 50
              ? "🔥 Campaign on fire! +5% boost nationwide."
              : "Build hype via ads, rallies, and events."}
          </p>
        </div>

        {/* STAMINA / FATIGUE */}
        <div className="stat-card" data-tooltip="Stamina decays each week. Rallies cost extra stamina. Rest weeks help recover.">
          <div className="stat-card-title">Campaign Stamina</div>
          <div className="stat-card-value" style={{ color: stamina > 60 ? '#2ea043' : stamina > 25 ? '#d29922' : '#f85149' }}>
            {stamina} / 100
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${stamina}%`, background: stamina > 60 ? '#2ea043' : stamina > 25 ? '#d29922' : '#f85149' }}></div>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>
            {stamina < 25 ? '⚠️ Exhausted — campaign effectiveness halved.' : stamina < 50 ? 'Tiring — schedule some rest weeks.' : 'Energized and ready.'}
          </p>
        </div>

        <div style={{ flexGrow: 1 }}></div>

        {/* Activity Log Preview */}
        <ActivityLog maxEntries={3} />

        {/* Save/Load with Slot Picker */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: showSaveSlots ? '0.5rem' : 0 }}>
            <button onClick={() => setShowSaveSlots(!showSaveSlots)} style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
              {showSaveSlots ? 'Close' : 'Save / Load'}
            </button>
          </div>

          {showSaveSlots && (
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.5rem' }}>
              {saveSlots.map((slot, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Slot {i + 1}{i === 2 ? ' (Auto)' : ''}: {slot.phase === 'empty' ? 'Empty' : `W${slot.week} ${slot.phase}`}
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => { saveGame(i); setShowSaveSlots(false); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(46,160,67,0.2)', color: '#2ea043', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>Save</button>
                    {slot.phase !== 'empty' && (
                      <button onClick={() => { loadGame(i); setShowSaveSlots(false); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>Load</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={advanceWeek}
          disabled={vpSelectionPending}
          title="Space"
          className={!vpSelectionPending ? "pulse-primary" : ""}
          style={{
            padding: '0.8rem',
            borderRadius: '8px',
            background: vpSelectionPending ? 'rgba(255,255,255,0.1)' : 'var(--primary-accent)',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            cursor: vpSelectionPending ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: vpSelectionPending ? 0.5 : 1
          }}
        >
          {vpSelectionPending ? 'Select VP First' : `Advance to Next Week`}
        </button>

        </aside>
      )}
    </div>
    </>
  );
}

export default App;
