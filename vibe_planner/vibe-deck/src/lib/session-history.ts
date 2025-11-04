export interface SessionHistoryItem {
  sessionId: string;
  name: string;
  matchKey?: string;
  confidence?: number;
  participantCount: number;
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY = 'vibe_session_history';
const MAX_HISTORY = 50;

export function getSessionHistory(): SessionHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const history = JSON.parse(stored) as SessionHistoryItem[];
    // Filter out expired sessions
    const now = Date.now();
    return history.filter(item => item.expiresAt > now);
  } catch {
    return [];
  }
}

export function addToSessionHistory(item: Omit<SessionHistoryItem, 'createdAt'> | SessionHistoryItem): void {
  try {
    const history = getSessionHistory();
    const newItem: SessionHistoryItem = {
      ...item,
      createdAt: 'createdAt' in item ? item.createdAt : Date.now(),
    };
    // Remove if already exists (by sessionId)
    const filtered = history.filter(h => h.sessionId !== item.sessionId);
    // Add to beginning
    filtered.unshift(newItem);
    // Keep only last MAX_HISTORY items
    const trimmed = filtered.slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save session history:', error);
  }
}

export function updateSessionHistory(
  sessionId: string,
  updates: Partial<SessionHistoryItem>
): void {
  try {
    const history = getSessionHistory();
    const index = history.findIndex(h => h.sessionId === sessionId);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update session history:', error);
  }
}

export function clearSessionHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session history:', error);
  }
}

