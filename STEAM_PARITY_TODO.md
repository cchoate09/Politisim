# Steam Parity Todo

This checklist turns the current competitive review into a working roadmap. The goal is not just "more features," but reaching parity with strong campaign-sim titles on Steam in depth, replayability, polish, and shipping readiness.

## Current Snapshot

Estimated parity progress: `61%`

- Core election simulation: `80%`
- Replayability and scenarios: `45%`
- Presentation and immersion: `50%`
- Product shell and Steam readiness: `35%`
- QA, onboarding, and usability: `32%`

## What Is Already Stronger Than Before

- [x] Multi-rival primary field exists
- [x] Proportional primary state resolution exists
- [x] Dropouts and endorsements exist
- [x] State-by-state delegate rules now vary by party and contest
- [x] Brokered conventions can now decide a deadlocked nomination
- [x] Public endorsements now function as a live coalition system with AI competition and weekly campaign effects
- [x] Election night now resolves through a dedicated state-calling sequence instead of an instant EV jump
- [x] Debate stage is a bespoke screen with policy-choice consequences
- [x] Scenario selector exists
- [x] Three official scenarios exist
- [x] Offline-safe map asset is local
- [x] DC is included and scenarios total 538 EV
- [x] Save/load, build, lint, and data-integrity verification are in better shape

## Milestone 1: Core Sim Parity

Goal: make the game feel strategically deep enough that players want multiple full runs.

### 1. Primary Rules Depth

- [x] Add state-specific delegate rules
  Acceptance: some states are proportional, some have thresholds, and some award bonus delegates or partial winner-take-all by party/state logic.
- [x] Add endorsements as a real campaign system
  Acceptance: unions, governors, former presidents, local machines, activists, and media figures can endorse based on ideology, trust, momentum, or state performance.
- [ ] Add rival suspensions and consolidation logic with more nuance
  Acceptance: rivals do not just drop mechanically; they suspend based on money, trust, bad debate nights, weak polling, or missed delegate paths.
- [x] Add convention drama
  Acceptance: a close nomination can trigger contested-convention style events, unity decisions, or negotiated momentum/trust outcomes.
- [x] Add a true election-night resolution layer
  Acceptance: the general election ends with states calling over time, not only a static EV summary.

### 2. Rival Identity

- [ ] Give each rival clearer strengths, weaknesses, regions, and issue brands
  Acceptance: players can explain why each rival is dangerous in specific states or phases.
- [ ] Add rival-specific scandals and strengths
  Acceptance: rivals can stumble, overperform in debates, collect endorsements, and lose trust too.
- [ ] Add different debate personalities
  Acceptance: some rivals attack, some reassure, some dodge, and the post-debate fallout reflects that.

### 3. Campaign Operations Depth

- [ ] Add field offices as a longer-term investment system
  Acceptance: offices improve local turnout and resilience over several weeks instead of acting like one-shot spending.
- [ ] Add volunteers and surrogate campaigning
  Acceptance: staffing and coalition assets can help cover more states than the player can personally visit.
- [ ] Add donor blocs
  Acceptance: small donors, business donors, activists, labor, and ideological networks respond differently to campaign choices.
- [ ] Add media strategy by channel
  Acceptance: local TV, cable, digital, earned media, and rapid response feel meaningfully different.
- [ ] Add oppo research consequences
  Acceptance: research can unlock events, weaken rivals, or backfire if abused.

## Milestone 2: Replayability Parity

Goal: make the game worth revisiting and worth talking about.

### 4. Scenario and Content Breadth

- [ ] Add at least 2 more official scenarios with unique strategic character
  Suggested targets: one historical election and one alternate-history scenario.
- [ ] Give scenarios unique rival rosters and flavor text
  Acceptance: scenario choice changes more than state numbers.
- [ ] Add more event pools tied to party, region, ideology, and scenario
  Acceptance: campaigns stop feeling like they draw from one generic event deck.
- [ ] Add more VP candidates with strategic tradeoffs
  Acceptance: VP selection feels like a real strategic fork, not just a stat bump.

### 5. Modding and Workshop

- [ ] Add in-game mod browser and scenario metadata panel
  Acceptance: players can browse installed scenarios without touching files manually.
- [ ] Add manifest/schema validation in the UI
  Acceptance: broken mods report human-readable errors.
- [ ] Plan Steam Workshop support
  Acceptance: even if full upload flow is deferred, the internal data model and docs are aligned with it.

## Milestone 3: Presentation Parity

Goal: make the game feel like a product people want to stay inside, not just a simulator they inspect.

### 6. Debate and Event Presentation

- [ ] Add richer debate aftermath
  Acceptance: debates produce spin-room headlines, subgroup reactions, fundraising swings, and rival effects.
- [ ] Add candidate portraits or visual identity cards
  Acceptance: the player and rivals are visually distinct across the primary and general.
- [ ] Add better event staging
  Acceptance: major scandals, endorsements, and crisis moments feel different from ordinary popups.

### 7. Audio and Atmosphere

- [ ] Add music system
  Acceptance: menu, debate, campaign, and endgame moments have distinct audio mood.
- [ ] Add sound effects for actions and outcomes
  Acceptance: spending, debate choices, achievements, and election-night calls have feedback.
- [ ] Add settings for volume and accessibility
  Acceptance: players can disable or tune audio easily.

### 8. Final UX Polish

- [ ] Add a proper tutorial or first-run onboarding
  Acceptance: a new player can finish the first 10 minutes without guessing what matters.
- [ ] Add glossary/help overlays for trust, momentum, delegate rules, turnout, and fatigue
  Acceptance: systems are legible without overexposing formulas.
- [ ] Improve save/load presentation
  Acceptance: saves show scenario, party, difficulty, and key campaign status at a glance.

## Milestone 4: Steam Product Parity

Goal: ship like a credible Steam game, not just a functioning build.

### 9. Steam Features

- [ ] Finish full achievement coverage
  Acceptance: every visible achievement has a matching unlock path and is testable.
- [ ] Add Steam Cloud save support
  Acceptance: saves persist across installs and machines.
- [ ] Add proper app metadata, icons, splash assets, and installer polish
  Acceptance: packaged builds look release-ready.

### 10. Accessibility and Options

- [ ] Add settings screen
  Acceptance: audio, animation intensity, UI scale, and gameplay hints can be adjusted.
- [ ] Add colorblind-safe map options
  Acceptance: battleground colors remain readable across common accessibility needs.
- [ ] Add keyboard-first support and clearer focus states
  Acceptance: the game is fully usable without mouse-only interaction.

## Milestone 5: QA Parity

Goal: stop future content passes from quietly breaking the game.

### 11. Test Coverage

- [ ] Add unit tests for delegate allocation and threshold rules
- [ ] Add tests for phase transitions and end-state logic
- [ ] Add save/load round-trip tests for mid-primary and mid-general runs
- [ ] Add tests for debate scheduling and debate completion flow
- [ ] Add packaged Electron smoke tests

### 12. Build Discipline

- [ ] Add CI for lint, test, and build
- [ ] Add scenario data validation to CI
- [ ] Add a release checklist for Steam builds

## Recommended Order

If we want the highest return on effort, tackle these next:

1. Field offices and volunteers
2. Tutorial and glossary
3. Audio/settings/accessibility
4. Steam Cloud and final achievement coverage
5. CI and deeper tests

## Latest Milestone Notes

- `2026-03-16`: Added state-by-state delegate allocation rules for both parties, surfaced those rules in the UI, and introduced brokered conventions with ballot-by-ballot strategic resolution when no candidate reaches a delegate majority.
- `2026-03-17`: Added a real endorsement system with party-specific validator rosters, player courtship actions, AI competition for backing, polling and fundraising effects, coalition tracking in Campaign HQ, and convention leverage tied to endorsement strength.
- `2026-03-17`: Added a dedicated election-night resolution phase with state call waves, hidden polling misses, desk projections, and a final transition into the postgame report only after the map is actually called.

## How We Should Track Progress

Use this rule of thumb after each major pass:

- `+5%` if a feature deepens strategic gameplay in a way players will feel every run
- `+3%` if a feature improves replayability or product presentation materially
- `+2%` if a feature improves Steam-readiness or reliability
- `+1%` if it is primarily cleanup, docs, or internal tooling

That lets us keep a running parity estimate without pretending the number is exact.
