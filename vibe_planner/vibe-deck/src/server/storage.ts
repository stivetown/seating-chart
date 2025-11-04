import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import type { MatchRecord, Participant, Session, SessionSnapshot } from '@/types/core';
import { computeGroupVibe } from './matching';
import { getDb, rowToSession, rowToParticipant, rowToMatchRecord } from '@/lib/db';

let kv: any = null;
let db: ReturnType<typeof getDb> | null = null;
const onVercel = process.env.VERCEL === '1';
const isProd = process.env.NODE_ENV === 'production';

function hasKVEnvs() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function hasDbEnv() {
  return Boolean(process.env.DATABASE_URL);
}

async function getKV() {
  if (!hasKVEnvs()) return null;
  if (kv) return kv;
  const mod = await import('@vercel/kv');
  kv = mod.kv;
  return kv;
}

async function getDbConnection() {
  if (!hasDbEnv()) return null;
  if (db) return db;
  try {
    db = getDb();
    return db;
  } catch (error) {
    console.error('Failed to get database connection:', error);
    return null;
  }
}

// Global in-memory fallback (survives within a single lambda/container)
type MemStore = {
  sessions: Map<string, Session>;
  byToken: Map<string, string>;
  participants: Map<string, Participant[]>;
  matches: Map<string, MatchRecord>;
};
const g = globalThis as any;
if (!g.__vibe_mem) {
  g.__vibe_mem = {
    sessions: new Map(),
    byToken: new Map(),
    participants: new Map(),
    matches: new Map(),
  } as MemStore;
}
const mem: MemStore = g.__vibe_mem;

const now = () => Date.now();
const in48h = () => now() + 48 * 3600_000;
// Generate UUID for database or custom ID for in-memory
export const makeId = (p: string) => hasDbEnv() ? uuidv4() : `${p}-${Date.now()}-${nanoid(9)}`;
export const makeToken = () => nanoid(10);

function requireStorageOrExplain() {
  if (onVercel && isProd && !hasDbEnv() && !hasKVEnvs()) {
    console.warn('⚠️  No persistent storage configured (DATABASE_URL or KV) – using in-memory fallback (session data will not persist across cold starts)');
  }
}

export async function createSession(input: { displayName?: string; groupSizeHint?: number; location?: { lat:number; lng:number } | null }): Promise<{ session: Session; host: Participant }> {
  requireStorageOrExplain();
  const session: Session = {
    id: makeId('session'),
    inviteToken: makeToken(),
    status: 'active',
    createdAt: now(),
    expiresAt: in48h(),
    groupSizeHint: input.groupSizeHint ?? null,
    location: input.location ?? null,
  };
  const host: Participant = {
    id: makeId('participant'),
    sessionId: session.id,
    displayName: input.displayName ?? 'Host',
    isHost: true,
    state: 'joined',
    createdAt: now(),
    updatedAt: now(),
  };

  const dbConnection = await getDbConnection();
  if (dbConnection) {
    // Use Neon/PostgreSQL
    const createdAt = new Date(session.createdAt).toISOString();
    const expiresAt = new Date(session.expiresAt).toISOString();
    const hostCreatedAt = new Date(host.createdAt).toISOString();
    const hostUpdatedAt = new Date(host.updatedAt).toISOString();
    
    await dbConnection`
      INSERT INTO sessions (id, invite_token, status, location_lat, location_lng, group_size_hint, created_at, expires_at)
      VALUES (${session.id}, ${session.inviteToken}, ${session.status}, ${session.location?.lat || null}, ${session.location?.lng || null}, ${session.groupSizeHint || null}, ${createdAt}::timestamptz, ${expiresAt}::timestamptz)
    `;
    
    await dbConnection`
      INSERT INTO participants (id, session_id, display_name, device_fingerprint, is_host, state, top_vibes, raw_swipes, created_at, updated_at)
      VALUES (${host.id}, ${host.sessionId}, ${host.displayName || null}, ${host.deviceFingerprint || null}, ${host.isHost || false}, ${host.state}, ${host.topVibes ? JSON.stringify(host.topVibes) : null}::jsonb, ${host.rawSwipes ? JSON.stringify(host.rawSwipes) : null}::jsonb, ${hostCreatedAt}::timestamptz, ${hostUpdatedAt}::timestamptz)
    `;
  } else {
    const kvc = await getKV();
    if (kvc) {
      await kvc.hset(`session:${session.id}`, session as any);
      await kvc.set(`token:${session.inviteToken}`, session.id);
      await kvc.rpush(`participants:${session.id}`, JSON.stringify(host));
    } else {
      mem.sessions.set(session.id, session);
      mem.byToken.set(session.inviteToken, session.id);
      mem.participants.set(session.id, [host]);
    }
  }
  return { session, host };
}

export async function getSessionByToken(inviteToken: string) {
  const dbConnection = await getDbConnection();
  if (dbConnection) {
    const rows = await dbConnection`
      SELECT * FROM sessions WHERE invite_token = ${inviteToken} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rowToSession(rows[0]);
  }
  
  const kvc = await getKV();
  if (kvc) {
    const sid = await kvc.get<string>(`token:${inviteToken}`);
    if (!sid) return null;
    const s = await kvc.hgetall<Session>(`session:${sid}`);
    return s || null;
  }
  const sid = mem.byToken.get(inviteToken);
  if (!sid) return null;
  return mem.sessions.get(sid) ?? null;
}

export async function getSession(sessionId: string) {
  const dbConnection = await getDbConnection();
  if (dbConnection) {
    const rows = await dbConnection`
      SELECT * FROM sessions WHERE id = ${sessionId} LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rowToSession(rows[0]);
  }
  
  const kvc = await getKV();
  if (kvc) {
    const s = await kvc.hgetall<Session>(`session:${sessionId}`);
    return s || null;
  }
  return mem.sessions.get(sessionId) ?? null;
}

export async function addParticipant(sessionId: string, p: Omit<Participant,'id'|'sessionId'|'createdAt'|'updatedAt'>) {
  const participant: Participant = {
    id: makeId('participant'),
    sessionId,
    createdAt: now(),
    updatedAt: now(),
    ...p,
  };
  
  const dbConnection = await getDbConnection();
  if (dbConnection) {
    const createdAt = new Date(participant.createdAt).toISOString();
    const updatedAt = new Date(participant.updatedAt).toISOString();
    await dbConnection`
      INSERT INTO participants (id, session_id, display_name, device_fingerprint, is_host, state, top_vibes, raw_swipes, created_at, updated_at)
      VALUES (${participant.id}, ${participant.sessionId}, ${participant.displayName || null}, ${participant.deviceFingerprint || null}, ${participant.isHost || false}, ${participant.state}, ${participant.topVibes ? JSON.stringify(participant.topVibes) : null}::jsonb, ${participant.rawSwipes ? JSON.stringify(participant.rawSwipes) : null}::jsonb, ${createdAt}::timestamptz, ${updatedAt}::timestamptz)
    `;
    return participant;
  }
  
  const kvc = await getKV();
  if (kvc) {
    await kvc.rpush(`participants:${sessionId}`, JSON.stringify(participant));
  } else {
    const list = mem.participants.get(sessionId) ?? [];
    list.push(participant);
    mem.participants.set(sessionId, list);
  }
  return participant;
}

export async function listParticipants(sessionId: string): Promise<Participant[]> {
  const dbConnection = await getDbConnection();
  if (dbConnection) {
    const rows = await dbConnection`
      SELECT * FROM participants WHERE session_id = ${sessionId} ORDER BY created_at ASC
    `;
    const participants = rows.map(rowToParticipant);
    console.log('[listParticipants] Loaded from DB:', participants.map(p => ({
      id: p.id,
      displayName: p.displayName,
      state: p.state,
      topVibes: p.topVibes,
      topVibesLength: p.topVibes?.length || 0,
    })));
    return participants;
  }
  
  const kvc = await getKV();
  if (kvc) {
    const raw = await kvc.lrange<string>(`participants:${sessionId}`, 0, -1);
    return (raw ?? []).map(j => JSON.parse(j));
  }
  return mem.participants.get(sessionId) ?? [];
}

export async function saveSwipes(sessionId: string, participantId: string, data: { rawSwipes: Record<string,number>; topVibes: string[] }) {
  console.log('[saveSwipes] Saving:', {
    sessionId,
    participantId,
    topVibes: data.topVibes,
    topVibesLength: data.topVibes?.length || 0,
    rawSwipesCount: Object.keys(data.rawSwipes || {}).length,
  });
  
  const dbConnection = await getDbConnection();
  if (dbConnection) {
    const updatedAt = new Date(now()).toISOString();
    const topVibesJson = JSON.stringify(data.topVibes);
    const rawSwipesJson = JSON.stringify(data.rawSwipes);
    console.log('[saveSwipes] Saving to DB:', {
      topVibesJson,
      rawSwipesJson: rawSwipesJson.substring(0, 100) + '...', // Truncate for logging
    });
    
    await dbConnection`
      UPDATE participants 
      SET raw_swipes = ${rawSwipesJson}::jsonb,
          top_vibes = ${topVibesJson}::jsonb,
          state = 'completed',
          updated_at = ${updatedAt}::timestamptz
      WHERE id = ${participantId} AND session_id = ${sessionId}
    `;
    const rows = await dbConnection`
      SELECT * FROM participants WHERE id = ${participantId} LIMIT 1
    `;
    if (rows.length === 0) throw new Error('participant_not_found');
    const saved = rowToParticipant(rows[0]);
    console.log('[saveSwipes] Saved participant:', {
      id: saved.id,
      topVibes: saved.topVibes,
      state: saved.state,
    });
    return saved;
  }
  
  const list = await listParticipants(sessionId);
  const idx = list.findIndex(p => p.id === participantId);
  if (idx === -1) throw new Error('participant_not_found');
  list[idx] = { ...list[idx], rawSwipes: data.rawSwipes, topVibes: data.topVibes, state: 'completed', updatedAt: now() };
  
  const kvc = await getKV();
  if (kvc) {
    await kvc.del(`participants:${sessionId}`);
    if (list.length) await kvc.rpush(`participants:${sessionId}`, ...list.map(p => JSON.stringify(p)));
  } else {
    mem.participants.set(sessionId, list);
  }
  return list[idx];
}

export async function computeAndStoreMatch(sessionId: string) {
  const parts = await listParticipants(sessionId);
  const completed = parts.filter(p => p.state === 'completed').length;
  const total = parts.length;
  const groupVibe = computeGroupVibe(parts);

  // Debug logging
  console.log('[computeMatch] ========================================');
  console.log('[computeMatch] sessionId:', sessionId);
  console.log('[computeMatch] participants count:', parts.length);
  console.log('[computeMatch] completed count:', completed);
  console.log('[computeMatch] participants details:', parts.map(p => ({ 
    id: p.id, 
    state: p.state, 
    topVibes: p.topVibes,
    topVibesLength: p.topVibes?.length || 0,
    displayName: p.displayName,
    isHost: p.isHost
  })));
  console.log('[computeMatch] ========================================');

  let suggestions: MatchRecord['suggestions'] = [];
  if (groupVibe) {
    const key = groupVibe.key;
    
    // Try to get suggestions from database
    const dbConnection = await getDbConnection();
    if (dbConnection) {
      try {
        // Try exact match first
        let rows = await dbConnection`
          SELECT items FROM recommendations WHERE vibe_combo_key = ${key} LIMIT 1
        `;
        
        if (rows.length === 0 && key.includes('|')) {
          // Try each part of combo individually
          const parts = key.split('|');
          for (const part of parts) {
            rows = await dbConnection`
              SELECT items FROM recommendations WHERE vibe_combo_key = ${part} LIMIT 1
            `;
            if (rows.length > 0) break;
          }
        }
        
        if (rows.length > 0) {
          const items = typeof rows[0].items === 'string' ? JSON.parse(rows[0].items) : rows[0].items;
          suggestions = Array.isArray(items) ? items.slice(0, 5) : [];
          console.log('[computeMatch] Found suggestions from DB:', suggestions.length);
        }
      } catch (e) {
        console.error('[computeMatch] Error fetching suggestions from DB:', e);
      }
    }
    
    // Fallback to hardcoded suggestions if DB didn't return any
    if (suggestions.length === 0) {
      console.log('[computeMatch] Using fallback suggestions for key:', key);
      if (key.includes('game')) {
        suggestions = [{ title:'Low-rules party game' },{ title:'Card game + snacks' },{ title:'Trivia mini-pack' }];
      } else if (key.includes('outdoor')) {
        suggestions = [{ title:'Sunset walk' },{ title:'Photo quest' },{ title:'Coffee after' }];
      } else {
        suggestions = [{ title:'Cook + Movie Night' },{ title:'Playlist Potluck' },{ title:'Dessert Run' }];
      }
    }
  }

  const record: MatchRecord = { id: makeId('match'), sessionId, groupVibe: groupVibe || { key:'unknown', confidence:0 }, suggestions, computedAt: now() };
  
  const dbConnection = await getDbConnection();
  if (dbConnection) {
    const computedAt = new Date(record.computedAt).toISOString();
    // Delete existing match if any, then insert new one
    await dbConnection`
      DELETE FROM matches WHERE session_id = ${record.sessionId}
    `;
    await dbConnection`
      INSERT INTO matches (id, session_id, group_vibe, suggestions, computed_at)
      VALUES (${record.id}, ${record.sessionId}, ${JSON.stringify(record.groupVibe)}::jsonb, ${JSON.stringify(record.suggestions)}::jsonb, ${computedAt}::timestamptz)
    `;
  } else {
    const kvc = await getKV();
    if (kvc) {
      await kvc.hset(`match:${sessionId}`, record as any);
    } else {
      mem.matches.set(sessionId, record);
    }
  }

  const provisional = !!groupVibe && completed >= Math.min(2, total);
  const isFinal = !!groupVibe && (completed === total || groupVibe.confidence >= 0.7);
  return { provisional, isFinal, record, participants: parts };
}

export async function getSnapshot(sessionId: string): Promise<SessionSnapshot> {
  const s = await getSession(sessionId);
  if (!s) throw new Error('session_not_found');
  const parts = await listParticipants(sessionId);
  const completed = parts.filter(p => p.state === 'completed').length;
  const total = parts.length;
  
  const dbConnection = await getDbConnection();
  let match: MatchRecord | null = null;
  if (dbConnection) {
    const rows = await dbConnection`
      SELECT * FROM matches WHERE session_id = ${sessionId} LIMIT 1
    `;
    if (rows.length > 0) {
      match = rowToMatchRecord(rows[0]);
    }
  } else {
    const kvc = await getKV();
    if (kvc) {
      match = await kvc.hgetall<MatchRecord>(`match:${sessionId}`);
    } else {
      match = mem.matches.get(sessionId) ?? null;
    }
  }
  
  const groupVibe = computeGroupVibe(parts);
  const provisional = !!groupVibe && completed >= Math.min(2, total);
  return {
    status: s.status,
    participants: parts.map(p => ({ id:p.id, name:p.displayName || 'Guest', state:p.state })),
    counts: { completed, total },
    provisionalMatch: provisional ? groupVibe : null,
    finalMatch: match?.groupVibe ?? null,
    suggestions: match?.suggestions ?? undefined,
  };
}

// Legacy exports for compatibility
export const id = makeId;
export const token = makeToken;