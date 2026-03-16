
import fs from 'fs';

const leans = {
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
};

const filePath = 'C:\\Users\\cchoa\\Gemini_Sandbox\\politisim-steam\\public\\mods\\vanilla\\states.json';

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    const updatedData = data.map(state => ({
        ...state,
        partisanLean: leans[state.stateName] || 0
    }));

    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    console.log(`Updated ${updatedData.length} states with partisan leans.`);
} catch (err) {
    console.error("Error updating states.json:", err);
}
