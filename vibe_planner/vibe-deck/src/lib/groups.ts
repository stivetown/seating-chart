export interface Group {
  id: string;
  name: string;
  participants: string[]; // display names
  createdAt: number;
  lastSessionAt?: number;
  sessionCount: number;
  typicalVibe?: string;
}

const STORAGE_KEY = 'vibe_groups';
const MAX_GROUPS = 20;

export function getGroups(): Group[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Group[];
  } catch {
    return [];
  }
}

export function createGroup(name: string, participants: string[]): Group {
  const groups = getGroups();
  const newGroup: Group = {
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    participants,
    createdAt: Date.now(),
    sessionCount: 0,
  };
  groups.push(newGroup);
  // Keep only last MAX_GROUPS
  const trimmed = groups.slice(-MAX_GROUPS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return newGroup;
}

export function updateGroup(groupId: string, updates: Partial<Group>): void {
  try {
    const groups = getGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    }
  } catch (error) {
    console.error('Failed to update group:', error);
  }
}

export function deleteGroup(groupId: string): void {
  try {
    const groups = getGroups();
    const filtered = groups.filter(g => g.id !== groupId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete group:', error);
  }
}

export function incrementGroupSessionCount(groupId: string, matchKey?: string): void {
  const group = getGroups().find(g => g.id === groupId);
  if (group) {
    updateGroup(groupId, {
      sessionCount: group.sessionCount + 1,
      lastSessionAt: Date.now(),
      typicalVibe: matchKey || group.typicalVibe,
    });
  }
}

export function findGroupByName(name: string): Group | undefined {
  return getGroups().find(g => g.name.toLowerCase() === name.toLowerCase());
}

