# PolitiSim Modding Guide

PolitiSim reads scenario data from `public/mods/`. Each scenario lives in its own folder and is listed in `public/mods/manifest.json`, which powers the in-game scenario selector.

## Folder Structure

Every playable scenario uses this structure:

```text
public/mods/
  manifest.json
  vanilla/
    states.json
  your-scenario/
    states.json
```

## Adding a Scenario

1. Copy an existing scenario folder such as `vanilla`.
2. Rename the folder to a new scenario id, for example `1992-rematch`.
3. Add an entry for that id in `public/mods/manifest.json`.
4. Edit `states.json` to define your map, demographics, delegate totals, and issue priorities.

If you are sharing a community scenario instead of editing the built-in manifest directly, package a single folder that contains:

```text
your-scenario/
  manifest.json
  states.json
```

The in-game browser can now import that folder directly and will validate it before launch.

You can also share a single exported bundle file:

```text
your-scenario-share.politisim-scenario.json
```

The browser supports both:

- `Import Scenario Folder` for a folder containing `manifest.json` + `states.json`
- `Import Shared Bundle` for a single exported `.politisim-scenario.json` file

The scenario browser can also export a scenario back out as a single portable bundle or generate a creator template bundle based on an existing scenario.

## Manifest Schema

Each scenario entry in `manifest.json` looks like this:

```json
{
  "id": "vanilla",
  "name": "Road to 2024",
  "yearLabel": "2024",
  "electionYear": 2024,
  "tagline": "The flagship modern campaign scenario.",
  "description": "Fight through a crowded primary field and a volatile general election on the standard national map with all 50 states plus DC.",
  "challenge": "Competitive",
  "focus": ["Debates", "Coalition building", "General election"],
  "featuredStates": ["Pennsylvania", "Georgia", "Arizona", "Michigan"],
  "specialRules": ["Balanced national map", "Multi-lane primary field", "Classic battleground finish"],
  "author": "PolitiSim Team",
  "version": "1.0.0",
  "minGameVersion": "0.4.0",
  "workshopTitle": "Road to 2024",
  "workshopSummary": "Fight through a crowded 2024-style primary and a volatile general election on the full national map.",
  "workshopTags": ["Campaign Sim", "Political Strategy", "2024", "Competitive Run"],
  "workshopVisibility": "unlisted",
  "official": true
}
```

Manifest entries should include:

- `id`: Stable slug used for the folder name and scenario identifier.
- `name`: Scenario name shown in the UI.
- `yearLabel`: Short label displayed on the scenario card.
- `electionYear`: Election year used to build the campaign calendar and validate primary dates.
- `tagline`: One-line scenario identity.
- `description`: Longer scenario explanation shown in the browser and briefing panel.
- `challenge`: One of `Accessible`, `Competitive`, or `Hardcore`.
- `focus`: Short tags for the scenario browser.
- `featuredStates`: Optional list of marquee battlegrounds shown in browser metadata.
- `specialRules`: Optional list of strategic twists shown in browser metadata.
- `author`: Creator name shown in the scenario browser and useful for shared/community content.
- `version`: Scenario version. Use a semver-style format such as `1.0.0`.
- `minGameVersion`: Lowest supported game version for compatibility checks.
- `workshopTitle`: Optional override for the generated Workshop/browser publish title.
- `workshopSummary`: Optional short publish summary for share bundles or future Workshop uploads.
- `workshopTags`: Optional publish tags. Keep the list concise.
- `workshopVisibility`: Optional publish hint: `public`, `unlisted`, or `friends_only`.
- `official`: Marks built-in scenarios.

## `states.json` Schema

Each jurisdiction entry should look like this:

```json
{
  "stateName": "Pennsylvania",
  "delegatesOrEV": 19,
  "demDelegates": 159,
  "repDelegates": 67,
  "liberal": 50,
  "libertarian": 38,
  "owner": 55,
  "worker": 72,
  "religious": 54,
  "immigrant": 32,
  "region": "Northeast",
  "date": "2024-04-23",
  "baseTurnout": 72.4,
  "topIssues": ["Economy", "Healthcare", "Education"],
  "partisanLean": 3
}
```

## Field Definitions

- `stateName`: Jurisdiction name shown in the UI.
- `delegatesOrEV`: General-election electoral votes for that jurisdiction.
- `demDelegates`: Democratic primary delegates at stake.
- `repDelegates`: Republican primary delegates at stake.
- `liberal`, `libertarian`, `owner`, `worker`, `religious`, `immigrant`: Demographic intensity values from `0` to `100`.
- `region`: Regional bucket used by rivals and some map logic.
- `date`: Primary date in `YYYY-MM-DD`.
- `baseTurnout`: Baseline turnout percentage from `0` to `100`.
- `topIssues`: One or more issue labels used for campaign alignment.
- `partisanLean`: Positive values lean Democratic, negative values lean Republican.

## Tips

- Keep the map at 51 jurisdictions if you want a full U.S. presidential race.
- Total electoral votes should add up to `538` unless your scenario intentionally changes the rules.
- The primary system uses your delegate counts directly, so wildly uneven numbers will change the nomination pace.
- The in-game scenario browser validates manifest metadata, state schema, DC/538 coverage, turnout sanity, and primary-date alignment before a run can start.
- Scenarios with blocking validation errors appear as `Blocked` in the browser and cannot be launched until the listed issues are fixed.
- Community scenarios import directly from a folder chooser in the scenario browser. The importer preserves the folder as a local catalog entry, normalizes unsafe ids, and records import notes when something had to be adjusted.
- Shared scenario bundles include both manifest metadata and `states.json` in one file, which makes Discord, email, and cloud-drive sharing much easier for community creators.
- Creator template downloads clone an existing scenario into an editable starter bundle with placeholder author metadata and remix-friendly notes.
- The scenario browser can now generate a Workshop-prep package and a publish brief from any installed scenario. Those exports bundle metadata, validation notes, suggested tags, preview-art checklist items, and ready-to-edit release notes scaffolding.
- If you want your scenario to feel Workshop-ready, include `author`, `version`, `minGameVersion`, a clear tagline, focus tags, featured states, a concise special-rules summary, and optional `workshopTitle` / `workshopSummary` overrides.
- After editing a scenario, run `npm test` to catch manifest or data-shape mistakes.

## Workshop Support

Steam Workshop upload is still waiting on the final Steamworks production pass, but the scenario catalog is now manifest-driven, browser-validated, importable, exportable, and able to generate Workshop-prep metadata bundles. Local scenarios already work in both browser preview and the Electron build as long as they are declared in `manifest.json` or imported through the scenario browser.
