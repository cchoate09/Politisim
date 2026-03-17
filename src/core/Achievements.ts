export type AchievementId =
  | 'ACH_PRIMARY_LOSS'
  | 'ACH_WIN'
  | 'ACH_LOSE'
  | 'ACH_LANDSLIDE'
  | 'ACH_SHOESTRING'
  | 'ACH_HARD_MODE'
  | 'ACH_FULL_STAFF'
  | 'ACH_RUNNING_MATE'
  | 'ACH_EARLY_CLINCH'
  | 'ACH_DEBATE_STAGE'
  | 'ACH_FIRST_ENDORSEMENT'
  | 'ACH_COALITION_BUILDER'
  | 'ACH_FIELD_MACHINE'
  | 'ACH_FIRST_STATE_WIN'
  | 'ACH_BROKERED_CONVENTION'
  | 'ACH_SUPER_TUESDAY';

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  category: 'campaign' | 'milestone' | 'endgame';
}

const STORAGE_KEY = 'politisim_achievements';

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    id: 'ACH_DEBATE_STAGE',
    title: 'Under The Lights',
    description: 'Finish your first live debate.',
    category: 'campaign'
  },
  {
    id: 'ACH_FIRST_ENDORSEMENT',
    title: 'Validator On Board',
    description: 'Secure your first public endorsement.',
    category: 'campaign'
  },
  {
    id: 'ACH_COALITION_BUILDER',
    title: 'Coalition Builder',
    description: 'Assemble a broad endorsement coalition.',
    category: 'milestone'
  },
  {
    id: 'ACH_FIELD_MACHINE',
    title: 'Ground Game',
    description: 'Build a durable field network across the map.',
    category: 'milestone'
  },
  {
    id: 'ACH_FIRST_STATE_WIN',
    title: 'First Call',
    description: 'Win your first contest of the nomination race.',
    category: 'campaign'
  },
  {
    id: 'ACH_SUPER_TUESDAY',
    title: 'Big Night',
    description: 'String together a multi-state primary breakthrough.',
    category: 'milestone'
  },
  {
    id: 'ACH_BROKERED_CONVENTION',
    title: 'Floor Fighter',
    description: 'Win the nomination through a brokered convention.',
    category: 'milestone'
  },
  {
    id: 'ACH_PRIMARY_LOSS',
    title: 'Campaign Setback',
    description: 'Fall short of the nomination.',
    category: 'endgame'
  },
  {
    id: 'ACH_WIN',
    title: 'Victory',
    description: 'Win the presidency.',
    category: 'endgame'
  },
  {
    id: 'ACH_LOSE',
    title: 'Defeat',
    description: 'Lose the general election.',
    category: 'endgame'
  },
  {
    id: 'ACH_LANDSLIDE',
    title: 'Landslide Victory',
    description: 'Win 400 or more electoral votes.',
    category: 'endgame'
  },
  {
    id: 'ACH_SHOESTRING',
    title: 'Shoestring Budget',
    description: 'Win with less than $100K remaining.',
    category: 'endgame'
  },
  {
    id: 'ACH_HARD_MODE',
    title: 'Hard Mode Champion',
    description: 'Win on hard difficulty.',
    category: 'endgame'
  },
  {
    id: 'ACH_FULL_STAFF',
    title: 'Full Staff',
    description: 'Hire all three staff roles.',
    category: 'milestone'
  },
  {
    id: 'ACH_RUNNING_MATE',
    title: 'Running Mate',
    description: 'Complete the ticket with a vice presidential pick.',
    category: 'milestone'
  },
  {
    id: 'ACH_EARLY_CLINCH',
    title: 'Electoral Cushion',
    description: 'Win with a comfortable electoral-vote buffer.',
    category: 'endgame'
  }
];

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

function readUnlockedAchievements(): AchievementId[] {
  if (!canUseStorage()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is AchievementId => typeof entry === 'string');
  } catch {
    return [];
  }
}

function persistUnlockedAchievements(achievements: AchievementId[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(achievements)].sort()));
}

export function getAchievementDefinition(id: AchievementId) {
  return ACHIEVEMENT_CATALOG.find((entry) => entry.id === id) ?? null;
}

export function getUnlockedAchievements() {
  return readUnlockedAchievements();
}

export function hasUnlockedAchievement(id: AchievementId) {
  return readUnlockedAchievements().includes(id);
}

export function unlockAchievement(id: AchievementId): boolean {
  const unlocked = readUnlockedAchievements();
  if (unlocked.includes(id)) {
    return false;
  }

  const next = [...unlocked, id];
  persistUnlockedAchievements(next);

  if (typeof window !== 'undefined' && window.electron) {
    void window.electron.unlockAchievement(id);
  }

  return true;
}

export function unlockAchievements(ids: AchievementId[]) {
  const newlyUnlocked: AchievementId[] = [];

  ids.forEach((id) => {
    if (unlockAchievement(id)) {
      newlyUnlocked.push(id);
    }
  });

  return newlyUnlocked;
}
