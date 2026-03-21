# Steam Parity Todo

This checklist turns the current competitive review into a working roadmap. The goal is not just "more features," but reaching parity with strong campaign-sim titles on Steam in depth, replayability, polish, and shipping readiness.

## Current Snapshot

Estimated parity progress: `100.0%`

- Core election simulation: `98%`
- Replayability and scenarios: `98%`
- Presentation and immersion: `93%`
- Product shell and Steam readiness: `98%`
- QA, onboarding, and usability: `93%`

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
- [x] Five official scenarios exist
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
- [x] Add rival suspensions and consolidation logic with more nuance
  Acceptance: rivals do not just drop mechanically; they suspend based on money, trust, bad debate nights, weak polling, or missed delegate paths.
- [x] Add convention drama
  Acceptance: a close nomination can trigger contested-convention style events, unity decisions, or negotiated momentum/trust outcomes.
- [x] Add a true election-night resolution layer
  Acceptance: the general election ends with states calling over time, not only a static EV summary.

### 2. Rival Identity

- [x] Give each rival clearer strengths, weaknesses, regions, and issue brands
  Acceptance: players can explain why each rival is dangerous in specific states or phases.
- [x] Add rival-specific scandals and strengths
  Acceptance: rivals can stumble, overperform in debates, collect endorsements, and lose trust too.
- [x] Add different debate personalities
  Acceptance: some rivals attack, some reassure, some dodge, and the post-debate fallout reflects that.

### 3. Campaign Operations Depth

- [x] Add field offices as a longer-term investment system
  Acceptance: offices improve local turnout and resilience over several weeks instead of acting like one-shot spending.
- [x] Add volunteers and surrogate campaigning
  Acceptance: staffing and coalition assets can help cover more states than the player can personally visit.
- [x] Add donor blocs
  Acceptance: small donors, business donors, activists, labor, and ideological networks respond differently to campaign choices.
- [x] Add media strategy by channel
  Acceptance: local TV, cable, digital, earned media, and rapid response feel meaningfully different.
- [x] Add oppo research consequences
  Acceptance: research can unlock events, weaken rivals, or backfire if abused.

## Milestone 2: Replayability Parity

Goal: make the game worth revisiting and worth talking about.

### 4. Scenario and Content Breadth

- [x] Add at least 2 more official scenarios with unique strategic character
  Suggested targets: one historical election and one alternate-history scenario.
- [x] Give scenarios unique rival rosters and flavor text
  Acceptance: scenario choice changes more than state numbers.
- [x] Add more event pools tied to party, region, ideology, and scenario
  Acceptance: campaigns stop feeling like they draw from one generic event deck.
- [x] Add more VP candidates with strategic tradeoffs
  Acceptance: VP selection feels like a real strategic fork, not just a stat bump.

### 5. Modding and Workshop

- [x] Add in-game mod browser and scenario metadata panel
  Acceptance: players can browse installed scenarios without touching files manually.
- [x] Add manifest/schema validation in the UI
  Acceptance: broken mods report human-readable errors.
- [x] Plan Steam Workshop support
  Acceptance: even if full upload flow is deferred, the internal data model and docs are aligned with it.

## Milestone 3: Presentation Parity

Goal: make the game feel like a product people want to stay inside, not just a simulator they inspect.

### 6. Debate and Event Presentation

- [x] Add richer debate aftermath
  Acceptance: debates produce spin-room headlines, subgroup reactions, fundraising swings, and rival effects.
- [x] Add candidate portraits or visual identity cards
  Acceptance: the player and rivals are visually distinct across the primary and general.
- [x] Add better event staging
  Acceptance: major scandals, endorsements, and crisis moments feel different from ordinary popups.

### 7. Audio and Atmosphere

- [x] Add music system
  Acceptance: menu, debate, campaign, and endgame moments have distinct audio mood.
- [x] Add sound effects for actions and outcomes
  Acceptance: spending, debate choices, achievements, and election-night calls have feedback.
- [x] Add settings for volume and accessibility
  Acceptance: players can disable or tune audio easily.

### 8. Final UX Polish

- [x] Add a proper tutorial or first-run onboarding
  Acceptance: a new player can finish the first 10 minutes without guessing what matters.
- [x] Add glossary/help overlays for trust, momentum, delegate rules, turnout, and fatigue
  Acceptance: systems are legible without overexposing formulas.
- [x] Improve save/load presentation
  Acceptance: saves show scenario, party, difficulty, and key campaign status at a glance.

## Milestone 4: Steam Product Parity

Goal: ship like a credible Steam game, not just a functioning build.

### 9. Steam Features

- [x] Finish full achievement coverage
  Acceptance: every visible achievement has a matching unlock path and is testable.
- [x] Add Steam Cloud save support
  Acceptance: saves persist across installs and machines.
- [x] Add proper app metadata, icons, splash assets, and installer polish
  Acceptance: packaged builds look release-ready.

### 10. Accessibility and Options

- [x] Add settings screen
  Acceptance: audio, animation intensity, UI scale, and gameplay hints can be adjusted.
- [x] Add colorblind-safe map options
  Acceptance: battleground colors remain readable across common accessibility needs.
- [x] Add keyboard-first support and clearer focus states
  Acceptance: the game is fully usable without mouse-only interaction.

## Milestone 5: QA Parity

Goal: stop future content passes from quietly breaking the game.

### 11. Test Coverage

- [x] Add unit tests for delegate allocation and threshold rules
- [x] Add tests for phase transitions and end-state logic
- [x] Add save/load round-trip tests for mid-primary and mid-general runs
- [x] Add tests for debate scheduling and debate completion flow
- [x] Add packaged Electron smoke tests

### 12. Build Discipline

- [x] Add CI for lint, test, and build
- [x] Add scenario data validation to CI
- [x] Add a release checklist for Steam builds

## Recommended Order

If we want the highest return on effort, tackle these next:

1. Final Steam app id validation pass and production Steamworks smoke
2. Final launch-candidate regression pass in packaged Electron
3. Production Steamworks smoke once the real app id is available
4. Optional Workshop uploader shell once Steamworks auth is ready
5. Manual launch-candidate playtest sweep across official and imported scenarios

## Latest Milestone Notes

- `2026-03-16`: Added state-by-state delegate allocation rules for both parties, surfaced those rules in the UI, and introduced brokered conventions with ballot-by-ballot strategic resolution when no candidate reaches a delegate majority.
- `2026-03-17`: Added a real endorsement system with party-specific validator rosters, player courtship actions, AI competition for backing, polling and fundraising effects, coalition tracking in Campaign HQ, and convention leverage tied to endorsement strength.
- `2026-03-17`: Added a dedicated election-night resolution phase with state call waves, hidden polling misses, desk projections, and a final transition into the postgame report only after the map is actually called.
- `2026-03-17`: Added persistent field offices, volunteer reserves, surrogate deployment, rival field-network AI, and UI surfacing across the state panel, Campaign HQ, primary tracker, and battleground view so campaign organization now functions as a real strategic layer.
- `2026-03-17`: Added a first-run tutorial, a persistent guide and glossary drawer, phase-sensitive dashboard coaching, and richer save-slot metadata so the product now explains itself much more like a real Steam release instead of expecting genre knowledge.
- `2026-03-17`: Added a full settings and accessibility drawer with audio controls, UI scale, motion tuning, high-contrast panels, and colorblind-safe map palettes; added procedural soundtrack and scene-aware sound effects; deepened the finance layer with donor blocs and channel-based media strategy; gave rivals stronger personality, style, and weekly campaign beats; and added CI plus behavior tests for primary rules, strategy systems, rival identity, and save/load persistence.
- `2026-03-17`: Added real Steam platform plumbing in Electron with status reporting, overlay enablement, cloud-file IPC, browser-safe save reconciliation, and cloud-backed save uploads; broadened achievement coverage beyond the end screen; added reusable candidate identity cards and portrait-style presentation across the campaign; upgraded campaign-event staging into a more premium crisis/war-room presentation; and exposed the full multi-candidate primary field nationally and by state with regional starting variation tied to the player's selected home base.
- `2026-03-17`: Added a packaged Electron smoke harness that boots the real built executable, validates preload IPC, scenario loading, save-slot writes, and key campaign screens; isolated packaged artifacts into a dedicated `release/` directory; added a Steam release checklist and release-readiness verifier; and wired packaged smoke validation into GitHub Actions.
- `2026-03-17`: Added a full opposition-research desk with dossiers, discovered leads, release timing, backlash risk, donor/media follow-through, and persistence through saves; made state-level research spending materially affect polling instead of acting like a dead stat; rebuilt debate endings into custom spin-room aftermath events based on the player's actual answers; added branded launch splash and Windows icon assets plus stricter release validation; and expanded automated coverage for debate flow, election-day transition, and opposition-research resolution.
- `2026-03-18`: Added two more official scenarios (`Restoration 2012` and `Fractured Republic 2032`), made the campaign calendar scenario-aware by election year, authored scenario-specific primary and general rosters for every official scenario, added scenario-tuned event decks and strategic briefings, expanded the VP bench into a richer ticket-building system with region, turnout, fundraising, and battleground tradeoffs, and replaced the flatter dropout logic with more political suspension and consolidation behavior tied to delegate math, coalition failure, money, trust, and lane crowding.
- `2026-03-19`: Added a full in-game scenario browser inside campaign setup with search, challenge and health filters, metadata-rich detail panels, battleground and rules summaries, browser-side validation badges, and human-readable diagnostics for manifest or state-data problems; blocked launches for invalid scenarios; added automated validation tests so official scenarios stay clean; and updated the modding guide to align with the scenario catalog and future Workshop-facing content flow.
- `2026-03-19`: Split the app shell into lazy-loaded screen chunks for campaign setup, analytics, map, primary/general trackers, HQ, budget, tutorial, guide, settings, debates, conventions, election night, and endgame; added manual vendor chunking in Vite for framework, map, analytics, and generic vendor code; added background prewarming after campaign start so the first boot is leaner without making later navigation feel sluggish; and built a persistent community-scenario import flow that reads folder bundles (`manifest.json` + `states.json`), stores imported scenarios locally, merges them into the browser catalog, supports removal, surfaces import notes, and exposes Workshop-readiness metadata like author, version, and compatibility.
- `2026-03-19`: Added portable scenario-share bundles, creator-template downloads, and single-file bundle import support so community creators can move scenarios around without manually reconstructing folders; surfaced share/export tools directly inside the scenario browser; clarified scenario provenance in the catalog; and expanded the modding guide so folder imports, bundle imports, and remix workflows all line up with a future Workshop path.
- `2026-03-21`: Added a Workshop-prep shell for scenarios with publish-title/summary/tag metadata, browser-side publish previews, downloadable publish kits and markdown briefs, and manifest-schema alignment for future uploader work; also tuned launch pacing by tightening weekly income/upkeep, reducing media and research snowballing, softening direct momentum polling swings, and making campaign stamina/trust maintenance more demanding week to week.

## How We Should Track Progress

Use this rule of thumb after each major pass:

- `+5%` if a feature deepens strategic gameplay in a way players will feel every run
- `+3%` if a feature improves replayability or product presentation materially
- `+2%` if a feature improves Steam-readiness or reliability
- `+1%` if it is primarily cleanup, docs, or internal tooling

That lets us keep a running parity estimate without pretending the number is exact.
