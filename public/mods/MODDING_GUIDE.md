# PolitiSim Modding Guide

Welcome to the PolitiSim Steam Workshop modding documentation! PolitiSim was rebuilt from the ground up to support extensive data-driven modding. 

You can create entirely new historical elections, futuristic scenarios, or alternate reality maps simply by editing JSON files.

## How Mods Work

The game loads its core data from the `public/mods/` directory. By default, it loads the `vanilla` mod folder. 

To create your own mod:
1. Copy the `vanilla` folder and rename it (e.g., `1992-election`).
2. Inside your new folder, you will find `states.json`.
3. Open `states.json` in any text editor and modify the demographics, election dates, and electoral delegates as you see fit.

## `states.json` Schema Reference

Each state block in the JSON file looks like this:

```json
{
  "stateName": "Iowa",
  "delegatesOrEV": 41,
  "liberal": 40,
  "libertarian": 45,
  "owner": 60,
  "worker": 70,
  "religious": 75,
  "immigrant": 20,
  "region": "Midwest",
  "date": "2024-01-15"
}
```

### Definitions:
- `delegatesOrEV` (Integer): How many electoral votes (or primary delegates) this state is worth.
- Demographics (`liberal`, `libertarian`, `owner`, `worker`, `religious`, `immigrant`): These values range from 0 to 100. They represent the concentration or intensity of that demographic block in the state. If you align with these demographics as a candidate, your base polling support in this state will start higher.
- `region`: (String) Used by the game's Analytics Dashboard to group states.
- `date`: (YYYY-MM-DD) The date the primary election occurs.

## Uploading to Steam Workshop

(Coming soon in the Steamworks Update)
Once you have tested your JSON files locally by placing them in the `/mods/` folder and changing the game's settings to point to your folder name, you will be able to upload the folder directly to the Steam Workshop via the in-game Mod Manager tool.
