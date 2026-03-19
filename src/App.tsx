import { Suspense, lazy, useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { ActivityLog } from './components/ActivityLog';
import { useGameStore, computeEVTotals } from './store/gameStore';
import { useSettingsStore } from './store/settingsStore';
import { audioManager } from './core/AudioManager';
import { syncCloudSaves, type CloudSyncSummary, type SteamStatus } from './core/SteamSync';

const TABS = ['map', 'analytics', 'primary', 'general', 'campaign', 'budget'] as const;
const TUTORIAL_STORAGE_KEY = 'politisim_tutorial_complete';

const loadPrimaryElectionView = () => import('./components/PrimaryElectionView');
const loadGeneralElectionView = () => import('./components/GeneralElectionView');
const loadUSAMap = () => import('./components/USAMap');
const loadAnalyticsDashboard = () => import('./components/AnalyticsDashboard');
const loadCandidateCreator = () => import('./components/CandidateCreator');
const loadBudgetAllocationView = () => import('./components/BudgetAllocationView');
const loadEventModal = () => import('./components/EventModal');
const loadDebateScreen = () => import('./components/DebateScreen');
const loadConventionModal = () => import('./components/ConventionModal');
const loadStateActionPanel = () => import('./components/StateActionPanel');
const loadCampaignHQView = () => import('./components/CampaignHQView');
const loadElectionNightScreen = () => import('./components/ElectionNightScreen');
const loadEndGameScreen = () => import('./components/EndGameScreen');
const loadVPSelectionModal = () => import('./components/VPSelectionModal');
const loadCampaignGuideDrawer = () => import('./components/CampaignGuideDrawer');
const loadTutorialModal = () => import('./components/TutorialModal');
const loadSettingsDrawer = () => import('./components/SettingsDrawer');

const PrimaryElectionView = lazy(() => loadPrimaryElectionView().then((module) => ({ default: module.PrimaryElectionView })));
const GeneralElectionView = lazy(() => loadGeneralElectionView().then((module) => ({ default: module.GeneralElectionView })));
const USAMap = lazy(() => loadUSAMap().then((module) => ({ default: module.USAMap })));
const AnalyticsDashboard = lazy(() => loadAnalyticsDashboard().then((module) => ({ default: module.AnalyticsDashboard })));
const CandidateCreator = lazy(() => loadCandidateCreator().then((module) => ({ default: module.CandidateCreator })));
const BudgetAllocationView = lazy(() => loadBudgetAllocationView().then((module) => ({ default: module.BudgetAllocationView })));
const EventModal = lazy(() => loadEventModal().then((module) => ({ default: module.EventModal })));
const DebateScreen = lazy(() => loadDebateScreen().then((module) => ({ default: module.DebateScreen })));
const ConventionModal = lazy(() => loadConventionModal().then((module) => ({ default: module.ConventionModal })));
const StateActionPanel = lazy(() => loadStateActionPanel().then((module) => ({ default: module.StateActionPanel })));
const CampaignHQView = lazy(() => loadCampaignHQView().then((module) => ({ default: module.CampaignHQView })));
const ElectionNightScreen = lazy(() => loadElectionNightScreen().then((module) => ({ default: module.ElectionNightScreen })));
const EndGameScreen = lazy(() => loadEndGameScreen().then((module) => ({ default: module.EndGameScreen })));
const VPSelectionModal = lazy(() => loadVPSelectionModal().then((module) => ({ default: module.VPSelectionModal })));
const CampaignGuideDrawer = lazy(() => loadCampaignGuideDrawer().then((module) => ({ default: module.CampaignGuideDrawer })));
const TutorialModal = lazy(() => loadTutorialModal().then((module) => ({ default: module.TutorialModal })));
const SettingsDrawer = lazy(() => loadSettingsDrawer().then((module) => ({ default: module.SettingsDrawer })));

function PanelFallback({ label = 'Loading campaign systems...' }: { label?: string }) {
  return (
    <div style={{
      margin: '1rem',
      padding: '1rem 1.1rem',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      color: 'var(--text-muted)'
    }}>
      {label}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tutorialSessionId, setTutorialSessionId] = useState(0);
  const [steamStatus, setSteamStatus] = useState<SteamStatus | null>(null);
  const [cloudSyncSummary, setCloudSyncSummary] = useState<CloudSyncSummary | null>(null);
  const [cloudSyncBusy, setCloudSyncBusy] = useState(false);
  const settings = useSettingsStore();

  const {
    budget,
    currentWeek,
    advanceWeek,
    momentum,
    saveGame,
    loadGame,
    getSaveSlots,
    gamePhase,
    calendarPhase,
    calendar,
    publicTrust,
    stamina,
    states,
    pollingData,
    playerDelegates,
    rivalDelegates,
    delegateTarget,
    vpSelectionPending,
    playerIdeology,
    playerName,
    hasStarted,
    setHasStarted,
    voterParty,
    activeEvent,
    activeDebate,
    activeConvention,
    activeElectionNight,
    previewDebate,
    generalOpponent,
    rivalAIs,
    scenarioName,
  } = useGameStore();
  const previousWeekRef = useRef(currentWeek);
  const previousDebateIdRef = useRef<string | null>(null);
  const previousEventTitleRef = useRef<string | null>(null);
  const previousElectionRoundRef = useRef(activeElectionNight?.round ?? 0);

  const isDev = import.meta.env.DEV;

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

  const { playerEV, rivalEV } = computeEVTotals(states, pollingData);
  const victoryTarget = Math.max(1, delegateTarget);
  const leadPrimaryRival = [...rivalAIs].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'withdrawn' ? 1 : -1;
    if (a.delegates !== b.delegates) return b.delegates - a.delegates;
    return b.momentum - a.momentum;
  })[0];
  const rivalLabel = gamePhase === 'general'
    ? (generalOpponent?.shortName ?? generalOpponent?.name ?? 'Opponent')
    : (leadPrimaryRival?.shortName ?? leadPrimaryRival?.name ?? 'Field Leader');
  const phaseBriefing = calendarPhase === 'campaigning'
    ? {
        title: 'Opening Weeks',
        body: 'Pick a small number of states to build around, because this is when offices, issue identity, and early coalition signals compound the most.'
      }
    : calendarPhase === 'primary'
      ? {
          title: 'Primary Season',
          body: 'Read the delegate rules, protect stamina, and convert good weeks into durable advantages before the field consolidates.'
        }
      : calendarPhase === 'convention'
        ? {
            title: 'Convention Week',
            body: 'If the race deadlocks, elite backing and coalition strength matter just as much as raw delegates.'
          }
        : calendarPhase === 'general'
          ? {
              title: 'General Election',
              body: 'Build multiple paths through the battleground map. A national lead is not the same thing as an electoral path.'
            }
          : {
              title: 'Election Night',
              body: 'The final map is about to call state by state. Every durable advantage you built now gets tested.'
            };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!hasStarted || gamePhase === 'ended') return;
    if ((event.target as HTMLElement).tagName === 'INPUT') return;

    if (event.code === 'Space') {
      if (showGuide || showTutorial || showSettings || activeEvent || activeDebate || activeConvention || activeElectionNight) return;
      event.preventDefault();
      advanceWeek();
    } else if (event.code === 'Escape') {
      setSelectedState(undefined);
      setShowSaveSlots(false);
      setShowGuide(false);
      setShowTutorial(false);
      setShowSettings(false);
    } else if (event.key === ',' || (event.key.toLowerCase() === 's' && event.shiftKey)) {
      event.preventDefault();
      setShowSettings(true);
    } else if (event.key >= '1' && event.key <= '6') {
      if (showGuide || showTutorial || showSettings) return;
      const idx = parseInt(event.key, 10) - 1;
      if (idx < TABS.length) setActiveTab(TABS[idx]);
    }
  }, [hasStarted, gamePhase, showGuide, showTutorial, showSettings, activeEvent, activeDebate, activeConvention, activeElectionNight, advanceWeek]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.tab) setActiveTab(detail.tab);
      if (detail?.state) setSelectedState(detail.state);
    };
    window.addEventListener('politisim-navigate', handler);
    return () => window.removeEventListener('politisim-navigate', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ui-scale', `${settings.uiScale / 100}`);
    document.body.classList.toggle('high-contrast-ui', settings.highContrast);
    document.body.classList.toggle('motion-reduced', settings.animationLevel !== 'full');
    document.body.classList.toggle('motion-minimal', settings.animationLevel === 'minimal');
    document.body.classList.toggle('hide-gameplay-hints', !settings.gameplayHints);
  }, [settings.animationLevel, settings.gameplayHints, settings.highContrast, settings.uiScale]);

  useEffect(() => {
    audioManager.applyPreferences({
      masterVolume: settings.masterVolume,
      musicVolume: settings.musicVolume,
      sfxVolume: settings.sfxVolume,
      musicEnabled: settings.musicEnabled,
      sfxEnabled: settings.sfxEnabled,
      animationLevel: settings.animationLevel
    });
  }, [settings.animationLevel, settings.masterVolume, settings.musicEnabled, settings.musicVolume, settings.sfxEnabled, settings.sfxVolume]);

  useEffect(() => {
    const unlockAudio = () => {
      void audioManager.unlock();
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const scene = !hasStarted
      ? 'menu'
      : activeDebate
        ? 'debate'
        : activeConvention
          ? 'convention'
          : activeElectionNight
            ? 'election_night'
            : gamePhase === 'ended'
              ? 'endgame'
              : calendarPhase === 'general' || gamePhase === 'general'
                ? 'general'
                : calendarPhase === 'primary'
                  ? 'primary'
                  : 'campaign';
    audioManager.setScene(scene);
  }, [activeConvention, activeDebate, activeElectionNight, calendarPhase, gamePhase, hasStarted]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void Promise.all([
        loadAnalyticsDashboard(),
        loadPrimaryElectionView(),
        loadGeneralElectionView(),
        loadCampaignHQView(),
        loadBudgetAllocationView(),
        loadCampaignGuideDrawer(),
        loadSettingsDrawer()
      ]);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [hasStarted]);

  useEffect(() => {
    if (currentWeek > previousWeekRef.current) {
      audioManager.playCue('advance');
    }
    previousWeekRef.current = currentWeek;
  }, [currentWeek]);

  useEffect(() => {
    const currentDebateId = activeDebate?.id ?? null;
    if (currentDebateId && currentDebateId !== previousDebateIdRef.current) {
      audioManager.playCue('debate');
    }
    previousDebateIdRef.current = currentDebateId;
  }, [activeDebate]);

  useEffect(() => {
    const currentEventTitle = activeEvent?.title ?? null;
    if (currentEventTitle && currentEventTitle !== previousEventTitleRef.current) {
      audioManager.playCue('negative');
    }
    previousEventTitleRef.current = currentEventTitle;
  }, [activeEvent]);

  useEffect(() => {
    const currentRound = activeElectionNight?.round ?? 0;
    if (currentRound > previousElectionRoundRef.current) {
      audioManager.playCue('call');
    }
    previousElectionRoundRef.current = currentRound;
  }, [activeElectionNight]);

  const openTutorial = () => {
    setTutorialSessionId((current) => current + 1);
    setShowTutorial(true);
  };

  const dismissTutorial = () => {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setShowTutorial(false);
  };

  const refreshSteamIntegration = useCallback(async (syncCloud: boolean) => {
    if (!window.electron) return;

    try {
      setCloudSyncBusy(syncCloud);
      const status = await window.electron.getSteamStatus();
      setSteamStatus(status);

      if (syncCloud) {
        const summary = await syncCloudSaves(window.electron);
        setCloudSyncSummary(summary);
      }
    } finally {
      setCloudSyncBusy(false);
    }
  }, []);

  useEffect(() => {
    void refreshSteamIntegration(true);
  }, [refreshSteamIntegration]);

  const handleCampaignStart = () => {
    setHasStarted(true);
    void audioManager.unlock();
    const tutorialSeen = window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
    if (!tutorialSeen) {
      openTutorial();
    }
  };

  if (!hasStarted) {
    return (
      <>
        {showSettings && (
          <Suspense fallback={<PanelFallback label="Loading settings..." />}>
            <SettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />
          </Suspense>
        )}
        <button
          type="button"
          className="settings-floating-btn"
          onClick={() => setShowSettings(true)}
        >
          Settings & Audio
        </button>
        <Suspense fallback={<PanelFallback label="Loading campaign setup..." />}>
          <CandidateCreator onComplete={handleCampaignStart} />
        </Suspense>
      </>
    );
  }

  if (gamePhase === 'ended') {
    return (
      <Suspense fallback={<PanelFallback label="Loading postgame report..." />}>
        <EndGameScreen />
      </Suspense>
    );
  }

  if (activeElectionNight) {
    return (
      <Suspense fallback={<PanelFallback label="Loading election night desk..." />}>
        <ElectionNightScreen />
      </Suspense>
    );
  }

  const saveSlots = getSaveSlots();

  return (
    <>
      {activeDebate && (
        <Suspense fallback={<PanelFallback label="Loading debate stage..." />}>
          <DebateScreen />
        </Suspense>
      )}
      {activeEvent && (
        <Suspense fallback={<PanelFallback label="Loading event briefing..." />}>
          <EventModal />
        </Suspense>
      )}
      {activeConvention && (
        <Suspense fallback={<PanelFallback label="Loading convention floor..." />}>
          <ConventionModal />
        </Suspense>
      )}
      {vpSelectionPending && (
        <Suspense fallback={<PanelFallback label="Loading running mate bench..." />}>
          <VPSelectionModal />
        </Suspense>
      )}
      {showGuide && (
        <Suspense fallback={<PanelFallback label="Loading campaign guide..." />}>
          <CampaignGuideDrawer isOpen={showGuide} onClose={() => setShowGuide(false)} />
        </Suspense>
      )}
      {showSettings && (
        <Suspense fallback={<PanelFallback label="Loading settings..." />}>
          <SettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </Suspense>
      )}
      {showTutorial && (
        <Suspense fallback={<PanelFallback label="Loading tutorial..." />}>
          <TutorialModal
            key={`tutorial-${tutorialSessionId}`}
            isOpen={showTutorial}
            onClose={dismissTutorial}
            onOpenGuide={() => setShowGuide(true)}
          />
        </Suspense>
      )}
      <div className={`command-center ${voterParty === 'Republican' ? 'republican-theme' : ''}`}>
        <aside className="glass-panel nav-panel">
          <h2>PolitiSim Command</h2>
          <div style={{ margin: '0.5rem 0 1rem 0', opacity: 0.5, borderTop: '1px solid white' }} />

          <div className="nav-link" style={{ pointerEvents: 'none', color: 'var(--text-main)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            Calendar: {calendarLabel}
          </div>
          <div className="nav-link" style={{ pointerEvents: 'none', color: 'var(--text-muted)', marginBottom: '0.15rem', fontSize: '0.75rem' }}>
            {weeksLeft > 0 ? `${weeksLeft} weeks to the final result` : 'Election Day'}
          </div>
          <div className="nav-link" style={{ pointerEvents: 'none', color: gamePhase === 'general' ? 'var(--primary-accent)' : calendarPhase === 'convention' ? '#fbbf24' : 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            {calendarPhase === 'campaigning' && 'Early Campaign'}
            {calendarPhase === 'primary' && 'Primary Season'}
            {calendarPhase === 'convention' && 'Convention'}
            {calendarPhase === 'general' && 'General Election'}
            {calendarPhase === 'election_day' && 'Election Day'}
          </div>

          {TABS.map((tab, idx) => (
            <button
              type="button"
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
            </button>
          ))}

          <button
            type="button"
            className="guide-launch-btn"
            onClick={() => setShowGuide(true)}
          >
            Guide & Glossary
          </button>

          <button
            type="button"
            className="guide-launch-btn subtle"
            onClick={openTutorial}
          >
            Replay Tutorial
          </button>

          <button
            type="button"
            className="guide-launch-btn subtle"
            onClick={() => setShowSettings(true)}
          >
            Settings & Audio
          </button>

          <div style={{ flexGrow: 1 }} />

          <div className="stat-card" data-tooltip="Total money available for ads, staff, travel, and event recovery.">
            <div className="stat-card-title">Campaign Funds</div>
            <div className="stat-card-value" style={{ color: '#2ea043' }}>{formattedBudget}</div>
          </div>
        </aside>

        <main className="glass-panel center-view" style={{ padding: 0, overflow: 'hidden' }}>
          {activeTab === 'map' && (
            <Suspense fallback={<PanelFallback label="Loading national map..." />}>
              <USAMap
                activeStateName={selectedState}
                onStateClick={(name: string) => setSelectedState(name)}
              />
            </Suspense>
          )}
          {activeTab === 'analytics' && (
            <Suspense fallback={<PanelFallback label="Loading analytics..." />}>
              <AnalyticsDashboard />
            </Suspense>
          )}
          {activeTab === 'primary' && (
            <Suspense fallback={<PanelFallback label="Loading primary tracker..." />}>
              <PrimaryElectionView />
            </Suspense>
          )}
          {activeTab === 'general' && (
            <Suspense fallback={<PanelFallback label="Loading general election desk..." />}>
              <GeneralElectionView />
            </Suspense>
          )}
          {activeTab === 'campaign' && (
            <Suspense fallback={<PanelFallback label="Loading campaign HQ..." />}>
              <CampaignHQView />
            </Suspense>
          )}
          {activeTab === 'budget' && (
            <Suspense fallback={<PanelFallback label="Loading finance desk..." />}>
              <BudgetAllocationView />
            </Suspense>
          )}
        </main>

        {activeTab === 'map' && selectedState ? (
          <Suspense fallback={<PanelFallback label="Loading state operations..." />}>
            <StateActionPanel stateName={selectedState} onClose={() => setSelectedState(undefined)} />
          </Suspense>
        ) : (
          <aside className="glass-panel stats-panel">
            <h3>National Dashboard</h3>

            {settings.gameplayHints && (
              <div className="stat-card quickstart-card">
                <div className="stat-card-title">Campaign Playbook</div>
                <div className="quickstart-heading">{phaseBriefing.title}</div>
                <p className="quickstart-copy">{phaseBriefing.body}</p>
                <div className="quickstart-meta">
                  <span>{scenarioName}</span>
                  <button type="button" className="quickstart-link" onClick={() => setShowGuide(true)}>
                    Open Guide
                  </button>
                </div>
              </div>
            )}

            <div className="stat-card" data-tooltip={gamePhase === 'primary' ? 'Reach the delegate threshold to secure the nomination.' : `Reach ${victoryTarget} electoral votes to win the presidency.`}>
              <div className="stat-card-title">
                {gamePhase === 'primary' ? 'Delegate Count' : 'Projected Electoral Votes'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="stat-card-value" style={{ color: 'var(--primary-accent)' }}>{gamePhase === 'primary' ? playerDelegates : playerEV}</div>
                <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>/ {victoryTarget} to win</div>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{
                  width: `${gamePhase === 'primary' ? (playerDelegates / victoryTarget * 100) : (playerEV / victoryTarget * 100)}%`
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <span>{playerName}: {gamePhase === 'primary' ? playerDelegates : playerEV}</span>
                <span>{rivalLabel}: {gamePhase === 'primary' ? rivalDelegates : rivalEV}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-title">Voter Ideology Profile</div>
              {(['worker', 'owner', 'liberal', 'religious', 'libertarian', 'immigrant'] as const).map((key) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>{key === 'owner' ? 'Business' : key === 'worker' ? 'Working Class' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span style={{ color: 'var(--primary-accent)' }}>{playerIdeology[key]}</span>
                </div>
              ))}
            </div>

            <div className="stat-card" data-tooltip="High trust cushions the campaign from scandal fallout and makes your broad message more durable.">
              <div className="stat-card-title">Public Trust</div>
              <div className="stat-card-value" style={{ color: publicTrust > 60 ? '#2ea043' : publicTrust > 30 ? '#d29922' : '#f85149' }}>
                {publicTrust}%
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${publicTrust}%`, background: publicTrust > 60 ? '#2ea043' : publicTrust > 30 ? '#d29922' : '#f85149' }} />
              </div>
            </div>

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
                  ? 'You have narrative wind at your back, but it fades quickly if you stop feeding it.'
                  : 'Build momentum through debates, events, and efficient state targeting.'}
              </p>
            </div>

            <div className="stat-card" data-tooltip="Stamina falls with relentless travel and campaign activity. Low stamina makes setbacks harder to absorb.">
              <div className="stat-card-title">Campaign Stamina</div>
              <div className="stat-card-value" style={{ color: stamina > 60 ? '#2ea043' : stamina > 25 ? '#d29922' : '#f85149' }}>
                {stamina} / 100
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${stamina}%`, background: stamina > 60 ? '#2ea043' : stamina > 25 ? '#d29922' : '#f85149' }} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>
                {stamina < 25
                  ? 'The candidate is visibly drained. More travel and event pressure will become risky.'
                  : stamina < 50
                    ? 'The pace is catching up with you. Consider a lighter week.'
                    : 'The campaign still has enough energy to keep pushing.'}
              </p>
            </div>

            <div style={{ flexGrow: 1 }} />

            <ActivityLog maxEntries={3} />

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: showSaveSlots ? '0.5rem' : 0 }}>
                <button onClick={() => setShowSaveSlots(!showSaveSlots)} style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                  {showSaveSlots ? 'Close' : 'Save / Load'}
                </button>
                <button onClick={() => setShowSettings(true)} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', color: 'var(--primary-accent)', border: '1px solid rgba(56,189,248,0.16)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Settings
                </button>
              </div>

              {showSaveSlots && (
                <div className="save-slot-list">
                  {saveSlots.map((slot, i) => (
                    <div key={i} className="save-slot-card">
                      <div className="save-slot-top">
                        <strong>Slot {i + 1}{i === 2 ? ' (Auto)' : ''}</strong>
                        <span>{slot.phase === 'empty' ? 'Empty' : slot.phase === 'corrupted' ? 'Corrupted' : `W${slot.week} ${slot.phase}`}</span>
                      </div>
                      {slot.phase !== 'empty' && slot.phase !== 'corrupted' ? (
                        <>
                          <div className="save-slot-meta">
                            <span>{slot.scenarioName}</span>
                            <span>{slot.party}</span>
                            <span>{slot.difficulty}</span>
                          </div>
                          <div className="save-slot-copy">{slot.playerName}</div>
                          {slot.date && (
                            <div className="save-slot-timestamp">
                              {new Date(slot.date).toLocaleString()}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="save-slot-copy">
                          {slot.phase === 'corrupted' ? 'This save could not be read.' : 'Use this slot to branch a run before a debate, convention, or big event.'}
                        </div>
                      )}
                      <div className="save-slot-actions">
                        <button onClick={() => { saveGame(i); setShowSaveSlots(false); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(46,160,67,0.2)', color: '#2ea043', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>Save</button>
                        {slot.phase !== 'empty' && slot.phase !== 'corrupted' && (
                          <button onClick={() => { loadGame(i); setShowSaveSlots(false); }} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>Load</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {window.electron && (
              <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                <div className="stat-card-title">Steam Platform</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {steamStatus?.initialized
                    ? `Connected${steamStatus.playerName ? ` as ${steamStatus.playerName}` : ''}`
                    : 'Steam not initialized for this session'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {steamStatus?.initialized && steamStatus.cloudEnabledForAccount && steamStatus.cloudEnabledForApp
                    ? 'Cloud saves are active. Local save slots will reconcile against Steam on launch and can be synced on demand.'
                    : 'Cloud sync is unavailable until the Steam runtime and app id are both active.'}
                </div>
                {cloudSyncSummary && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.55rem' }}>
                    Last sync: pulled {cloudSyncSummary.pulledSlots.length}, pushed {cloudSyncSummary.pushedSlots.length}, skipped {cloudSyncSummary.skippedSlots.length}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void refreshSteamIntegration(true)}
                  disabled={cloudSyncBusy}
                  style={{
                    marginTop: '0.7rem',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '8px',
                    background: 'rgba(56,189,248,0.14)',
                    color: 'var(--primary-accent)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    cursor: cloudSyncBusy ? 'wait' : 'pointer',
                    fontSize: '0.78rem'
                  }}
                >
                  {cloudSyncBusy ? 'Syncing Cloud Saves...' : 'Sync Cloud Saves'}
                </button>
              </div>
            )}

            {isDev && (
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Debate Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => previewDebate('primary')}
                    disabled={Boolean(activeDebate) || Boolean(activeConvention)}
                    style={{ padding: '0.55rem', borderRadius: '8px', background: 'rgba(246,196,83,0.16)', color: '#f6c453', border: '1px solid rgba(246,196,83,0.25)', cursor: activeDebate || activeConvention ? 'not-allowed' : 'pointer', fontSize: '0.8rem', opacity: activeDebate || activeConvention ? 0.5 : 1 }}
                  >
                    Primary Debate
                  </button>
                  <button
                    onClick={() => previewDebate('general')}
                    disabled={Boolean(activeDebate) || Boolean(activeConvention)}
                    style={{ padding: '0.55rem', borderRadius: '8px', background: 'rgba(56,189,248,0.16)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', cursor: activeDebate || activeConvention ? 'not-allowed' : 'pointer', fontSize: '0.8rem', opacity: activeDebate || activeConvention ? 0.5 : 1 }}
                  >
                    General Debate
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={advanceWeek}
              disabled={vpSelectionPending || Boolean(activeEvent) || Boolean(activeDebate) || Boolean(activeConvention) || showSettings}
              title="Space"
              className={!vpSelectionPending && !activeEvent && !activeDebate && !activeConvention && !showSettings ? 'pulse-primary' : ''}
              style={{
                padding: '0.8rem',
                borderRadius: '8px',
                background: vpSelectionPending || activeEvent || activeDebate || activeConvention || showSettings ? 'rgba(255,255,255,0.1)' : 'var(--primary-accent)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: vpSelectionPending || activeEvent || activeDebate || activeConvention || showSettings ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                opacity: vpSelectionPending || activeEvent || activeDebate || activeConvention || showSettings ? 0.5 : 1
              }}
            >
              {vpSelectionPending
                ? 'Select VP First'
                : activeDebate
                  ? 'Finish Debate First'
                  : activeConvention
                    ? 'Resolve Convention First'
                  : showSettings
                    ? 'Close Settings First'
                  : activeEvent
                    ? 'Resolve Event First'
                    : 'Advance to Next Week'}
            </button>
          </aside>
        )}
      </div>
    </>
  );
}

export default App;
