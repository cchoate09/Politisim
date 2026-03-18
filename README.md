# PolitiSim

PolitiSim is a U.S. presidential campaign simulation game built with React, Zustand, Vite, and Electron. You roleplay as a major-party candidate, fight through a multi-rival primary, survive debates and scandals, choose a running mate, and try to assemble a winning general-election map.

## Current Focus

- Four-rival primary field with delegate accumulation, dropouts, and endorsements
- Debate stage flow with policy questions and hidden demographic consequences
- Scenario-driven state data loaded from `public/mods/`
- Electron build with Steam achievement bridge and offline-safe renderer paths

## Scenarios Included

- `Road to 2024`: the flagship modern campaign map
- `Sun Belt Surge`: a faster-growth battleground map centered on turnout and migration
- `Heartland Reckoning`: a recession-heavy map that punishes trust and weak economic positioning

## Development

```bash
npm install
npm run dev
```

## Electron

```bash
npm run electron:dev
```

To initialize Steamworks in a production wrapper, set `POLITISIM_STEAM_APP_ID` before launch.

## Build

```bash
npm run build
npm run electron:build
```

`npm run electron:build` produces an unsigned local installer/build for smoke testing. Use `npm run electron:build:release` on the properly provisioned release machine when you are ready for the final signed package.

For a packaged Windows smoke pass before release:

```bash
npm run electron:smoke:packaged
npm run release:verify
```

The full manual checklist lives in `docs/STEAM_RELEASE_CHECKLIST.md`.

## Quality Checks

```bash
npm run lint
npm test
```

## Modding

Scenario data lives in `public/mods/`. Add new scenarios to `public/mods/manifest.json` and create a matching folder with `states.json`. See [public/mods/MODDING_GUIDE.md](public/mods/MODDING_GUIDE.md) for the expected schema.
