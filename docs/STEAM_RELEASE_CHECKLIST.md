# Steam Release Checklist

This checklist is the shipping gate for PolitiSim on Steam. The automated steps should run for every release candidate, and the manual checks should be completed before a branch is promoted to the public store build.

## 1. Automated Gates

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run electron:smoke:packaged`
- [ ] `npm run release:verify`

Expected automated artifacts:

- `release/win-unpacked/PolitiSim.exe`
- `release/smoke/packaged-smoke-report.json`
- `release/smoke/release-readiness.json`

What the packaged smoke test covers:

- unpacked packaged resources boot through Electron in production mode
- Electron boots from the packaged build rather than the dev server
- preload IPC is exposed in the renderer
- bundled scenario data loads through the Electron bridge
- a new campaign can be started
- a local save slot can be written from the packaged app
- Primary Election, Analytics, and Campaign HQ render successfully

Notes:

- `npm run electron:build` is the unsigned local packaging path used for smoke validation and CI.
- `npm run electron:build:release` is the final installer path for the release machine once icons, metadata, and signing setup are ready.

## 2. Steamworks Configuration

- [ ] `POLITISIM_STEAM_APP_ID` is set to the production Steam app id for the final validation pass
- [ ] Steam achievements in Steamworks match the ids used in `src/core/Achievements.ts`
- [ ] Steam Cloud is enabled and the remote save path strategy matches the Electron save implementation
- [ ] Store capsule art, screenshots, trailers, and written copy are updated for the current build
- [ ] Release branches and beta branches are named and documented before upload

## 3. Installer And Package Quality

- [ ] Branded Windows `.ico` asset is configured for the installer and executable
- [ ] `productName`, `appId`, version number, and installer artifact names are correct
- [ ] Installer runs cleanly on a machine without dev tools or the local repo present
- [ ] Uninstall removes the packaged app cleanly without touching intentional save data
- [ ] The packaged game can launch offline without CDN dependencies

## 4. Functional Manual QA

- [ ] Start a fresh Democratic campaign and a fresh Republican campaign
- [ ] Verify the tutorial, guide, settings drawer, and accessibility toggles from a fresh install
- [ ] Save and load from multiple slots in the packaged build
- [ ] Run through at least one debate, one endorsement courtship, and one election-night flow
- [ ] Confirm brokered conventions still resolve correctly in a packaged build
- [ ] Verify audio playback, mute toggles, and reduced-motion settings in the packaged build
- [ ] Confirm cloud sync behavior on a machine with Steam Cloud enabled
- [ ] Confirm at least one achievement unlocks in a production Steam build with the real app id

## 5. Store And Support Readiness

- [ ] Steam store page feature flags match the actual product
- [ ] Known limitations are reflected honestly on the store page and patch notes
- [ ] Crash-repro notes and rollback instructions exist for the launch build
- [ ] A short launch-day smoke plan exists for post-upload validation

## 6. Launch-Day Smoke Plan

Run these after the build is uploaded to Steam:

1. Install the uploaded build from Steam onto a clean machine.
2. Launch once with Steam online and once offline.
3. Start a new campaign, save, reload, and verify the save persists.
4. Confirm Steam overlay, achievement unlock, and cloud save behavior.
5. Play through at least one debate and advance far enough to verify the weekly loop still behaves normally.

If any of these fail, do not promote the build beyond the current branch.
