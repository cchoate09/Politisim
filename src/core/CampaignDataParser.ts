import { getDebateScheduleForWeek, type DebatePhase } from './DebateData';
import { buildScenarioCatalogEntry, type ScenarioCatalogEntry } from './ScenarioValidation';
import {
  listImportedScenarios,
  removeImportedScenario,
  saveImportedScenario,
  type ImportedScenarioRecord
} from './CommunityScenarioRegistry';

export interface StateElectionData {
  stateName: string;
  delegatesOrEV: number; // For General Election
  demDelegates: number;  // For Primary
  repDelegates: number;  // For Primary
  liberal: number;
  libertarian: number;
  owner: number;
  worker: number;
  religious: number;
  immigrant: number;
  region: string;
  date: string;
  baseTurnout: number; // 0-100 percentage
  topIssues: string[]; // List of key issues in this state
  partisanLean: number; // New: Positive for Democrat, Negative for Republican
}

export interface CampaignSpendingData {
  intAds: number;
  tvAds: number;
  mailers: number;
  staff1: number;
  staff2: number;
  staff3: number;
  visits: number;
  groundGame: number;
  socialMedia: number;
  research: number;
}

export interface ModManifestEntry {
  id: string;
  name: string;
  yearLabel: string;
  electionYear: number;
  tagline: string;
  description: string;
  challenge: 'Accessible' | 'Competitive' | 'Hardcore';
  focus: string[];
  featuredStates?: string[];
  specialRules?: string[];
  official?: boolean;
  author?: string;
  version?: string;
  minGameVersion?: string;
  importSource?: string;
  importedAt?: string;
  importNotes?: string[];
}

export class CampaignDataParser {
  private static manifestPromise: Promise<ModManifestEntry[]> | null = null;
  private static catalogPromise: Promise<ScenarioCatalogEntry[]> | null = null;
  private static modDataPromises = new Map<string, Promise<StateElectionData[]>>();

  private static invalidateCaches() {
    this.manifestPromise = null;
    this.catalogPromise = null;
    this.modDataPromises.clear();
  }

  static listImportedScenarios() {
    return listImportedScenarios();
  }

  static saveImportedScenario(record: ImportedScenarioRecord) {
    saveImportedScenario(record);
    this.invalidateCaches();
  }

  static removeImportedScenario(scenarioId: string) {
    removeImportedScenario(scenarioId);
    this.invalidateCaches();
  }

  static async listMods(options: { forceRefresh?: boolean } = {}): Promise<ModManifestEntry[]> {
    const { forceRefresh = false } = options;

    if (!forceRefresh && this.manifestPromise) {
      return this.manifestPromise;
    }

    const manifestRequest: Promise<ModManifestEntry[]> = (async () => {
      try {
        if (window.electron) {
          return await window.electron.listMods();
        }

        const response = await fetch(new URL('./mods/manifest.json', window.location.href).toString());
        if (!response.ok) {
          throw new Error('Failed to load mod manifest');
        }

        return await response.json() as ModManifestEntry[];
      } catch (error) {
        console.error('Error loading mod manifest:', error);
        const fallbackManifest: ModManifestEntry[] = [{
          id: 'vanilla',
          name: 'Road to 2024',
          yearLabel: '2024',
          electionYear: 2024,
          tagline: 'The default presidential campaign sandbox.',
          description: 'Fight through a modern nomination race and general election with the standard national map.',
          challenge: 'Competitive',
          focus: ['Primary strategy', 'Coalition building', 'Debates'],
          official: true,
          author: 'PolitiSim Team',
          version: '1.0.0',
          minGameVersion: '0.4.0'
        }];
        return fallbackManifest;
      }
    })();

    const mergedManifestRequest = manifestRequest.then((officialManifest) => {
      const importedManifest = this.listImportedScenarios().map((entry) => entry.manifest);
      return [...officialManifest, ...importedManifest];
    });

    if (!forceRefresh) {
      this.manifestPromise = mergedManifestRequest;
    }

    return mergedManifestRequest;
  }

  /**
   * Loads a JSON file containing the state demographics for a specific 'mod' (e.g., 'vanilla', '1992').
   */
  static async loadModData(modName: string = 'vanilla', options: { forceRefresh?: boolean } = {}): Promise<StateElectionData[]> {
    const { forceRefresh = false } = options;

    if (!forceRefresh && this.modDataPromises.has(modName)) {
      return await this.modDataPromises.get(modName)!;
    }

    const importedScenario = this.listImportedScenarios().find((entry) => entry.manifest.id === modName);
    if (importedScenario) {
      return importedScenario.states;
    }

    const modDataRequest = (async () => {
      try {
        if (window.electron) {
          return await window.electron.loadModData(modName);
        }

        const response = await fetch(new URL(`./mods/${modName}/states.json`, window.location.href).toString());
        if (!response.ok) {
          throw new Error(`Failed to load mod data for [${modName}]`);
        }
        const data: StateElectionData[] = await response.json();
        return data;
      } catch (error) {
        console.error('Error loading mod data:', error);
        return [];
      }
    })();

    if (!forceRefresh) {
      this.modDataPromises.set(modName, modDataRequest);
    }

    return modDataRequest;
  }

  static async loadScenarioCatalog(options: { forceRefresh?: boolean } = {}): Promise<ScenarioCatalogEntry[]> {
    const { forceRefresh = false } = options;

    if (!forceRefresh && this.catalogPromise) {
      return this.catalogPromise;
    }

    const catalogRequest = (async () => {
      const manifest = await this.listMods({ forceRefresh });
      const catalog = await Promise.all(
        manifest.map(async (entry) => {
          const states = await this.loadModData(entry.id, { forceRefresh });
          return buildScenarioCatalogEntry(entry, states, manifest);
        })
      );

      return catalog;
    })();

    if (!forceRefresh) {
      this.catalogPromise = catalogRequest;
    }

    return catalogRequest;
  }

  /**
   * Generates a realistic 70-week campaign calendar from July 2023 to November 2024.
   */
  static generateCalendar(electionYear: number = 2024): CalendarWeek[] {
    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const weeks: CalendarWeek[] = [];
    
    const currentDate = new Date(electionYear - 1, 6, 1);
    
    for (let w = 1; w <= 70; w++) {
      const month = currentDate.getMonth(); // 0-11
      const year = currentDate.getFullYear();
      const monthNum = month + 1; // 1-12
      const debateEntry = getDebateScheduleForWeek(w);
      
      let phase: CalendarWeek['phase'];
      if (w <= 26) {
        phase = 'campaigning'; // Jul 2023 – Dec 2023
      } else if (w <= 52) {
        phase = 'primary'; // Jan 2024 – Jun 2024
      } else if (w <= 56) {
        phase = 'convention'; // Jul 2024
      } else if (w <= 69) {
        phase = 'general'; // Aug 2024 – Oct 2024
      } else {
        phase = 'election_day'; // Nov 5, 2024
      }

      // Debate weeks
      const isDebateWeek = debateEntry !== null;

      weeks.push({
        week: w,
        month: MONTH_NAMES[month],
        monthNum,
        year,
        label: `${MONTH_NAMES[month]} ${year} — Week ${w}`,
        phase,
        isDebateWeek,
        debateId: debateEntry?.debateId ?? null,
        debatePhase: debateEntry?.phase ?? null,
        debateSequence: debateEntry?.sequence ?? null
      });
      
      // Advance by 7 days
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
  }
}

export interface CalendarWeek {
  week: number;
  month: string;
  monthNum: number; // 1-12
  year: number;
  label: string;
  phase: 'campaigning' | 'primary' | 'convention' | 'general' | 'election_day';
  isDebateWeek: boolean;
  debateId: string | null;
  debatePhase: DebatePhase | null;
  debateSequence: number | null;
}
