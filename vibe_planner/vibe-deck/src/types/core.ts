export type Session = {
  id: string;
  inviteToken: string;
  status: 'active' | 'matched' | 'expired';
  createdAt: number; // ms
  expiresAt: number; // ms
  location?: { lat: number; lng: number } | null;
  groupSizeHint?: number | null;
};

export type Participant = {
  id: string;
  sessionId: string;
  displayName?: string | null;
  deviceFingerprint?: string | null;
  isHost?: boolean;
  state: 'joined' | 'swiping' | 'completed';
  topVibes?: string[] | null;  // up to 3
  rawSwipes?: Record<string, number> | null;
  createdAt: number;
  updatedAt: number;
};

export type MatchResult = { key: string; confidence: number };

export type MatchRecord = {
  id: string;
  sessionId: string;
  groupVibe: MatchResult;
  suggestions: Array<{ title: string; desc?: string; url?: string }>;
  computedAt: number;
};

export type SessionSnapshot = {
  status: Session['status'];
  participants: Array<{ id: string; name: string; state: Participant['state'] }>;
  counts: { completed: number; total: number };
  provisionalMatch?: MatchResult | null;
  finalMatch?: MatchResult | null;
  suggestions?: MatchRecord['suggestions'];
};
