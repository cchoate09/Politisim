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
- After editing a scenario, run `npm test` to catch manifest or data-shape mistakes.

## Workshop Support

Steam Workshop upload is not wired in yet, but the scenario catalog is now manifest-driven and browser-validated, which keeps local mods aligned with a future Workshop flow. Local scenarios already work in both browser preview and the Electron build as long as they are declared in `manifest.json`.
