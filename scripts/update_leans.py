
import json

leans = {
    "Alabama": -25, "Alaska": -10, "Arizona": 0, "Arkansas": -28, "California": 28,
    "Colorado": 14, "Connecticut": 20, "Delaware": 19, "Florida": -4, "Georgia": 0,
    "Hawaii": 28, "Idaho": -30, "Illinois": 14, "Indiana": -12, "Iowa": -9,
    "Kansas": -14, "Kentucky": -25, "Louisiana": -15, "Maine": 10, "Maryland": 28,
    "Massachusetts": 28, "Michigan": 1, "Minnesota": 7, "Mississippi": -15, "Missouri": -15,
    "Montana": -16, "Nebraska": -18, "Nevada": 1, "New Hampshire": 7, "New Jersey": 16,
    "New Mexico": 10, "New York": 22, "North Carolina": -2, "North Dakota": -33, "Ohio": -8,
    "Oklahoma": -33, "Oregon": 16, "Pennsylvania": 0, "Rhode Island": 20, "South Carolina": -10,
    "South Dakota": -25, "Tennessee": -23, "Texas": -6, "Utah": -18, "Vermont": 35,
    "Virginia": 10, "Washington": 18, "West Virginia": -38, "Wisconsin": 1, "Wyoming": -43,
    "District of Columbia": 85
}

file_path = r'C:\Users\cchoa\Gemini_Sandbox\politisim-steam\public\mods\vanilla\states.json'

with open(file_path, 'r') as f:
    data = json.load(f)

for state in data:
    name = state['stateName']
    state['partisanLean'] = leans.get(name, 0)

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Updated {len(data)} states with partisan leans.")
