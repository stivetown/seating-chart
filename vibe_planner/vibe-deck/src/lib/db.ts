import { neon } from '@neondatabase/serverless';
import type { Session, Participant, MatchRecord } from '@/types/core';

let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    sql = neon(connectionString);
  }
  return sql;
}

// Helper to convert timestamp (ms) to ISO string
function toISO(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// Convert database row to Session type
export function rowToSession(row: any): Session {
  return {
    id: row.id,
    inviteToken: row.invite_token,
    status: row.status as 'active' | 'matched' | 'expired',
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
    location: row.location_lat && row.location_lng
      ? { lat: Number(row.location_lat), lng: Number(row.location_lng) }
      : null,
    groupSizeHint: row.group_size_hint ? Number(row.group_size_hint) : null,
  };
}

// Convert database row to Participant type
export function rowToParticipant(row: any): Participant {
  return {
    id: row.id,
    sessionId: row.session_id,
    displayName: row.display_name,
    deviceFingerprint: row.device_fingerprint,
    isHost: row.is_host || false,
    state: row.state as 'joined' | 'swiping' | 'completed',
    topVibes: row.top_vibes ? (typeof row.top_vibes === 'string' ? JSON.parse(row.top_vibes) : row.top_vibes) : null,
    rawSwipes: row.raw_swipes ? (typeof row.raw_swipes === 'string' ? JSON.parse(row.raw_swipes) : row.raw_swipes) : null,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

// Convert database row to MatchRecord type
export function rowToMatchRecord(row: any): MatchRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    groupVibe: typeof row.group_vibe === 'string' ? JSON.parse(row.group_vibe) : row.group_vibe,
    suggestions: typeof row.suggestions === 'string' ? JSON.parse(row.suggestions) : row.suggestions,
    computedAt: new Date(row.computed_at).getTime(),
  };
}

