export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSnapshot, getSession } from '@/server/storage';

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    
    // Debug logging
    const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    const hasDb = Boolean(process.env.DATABASE_URL);
    console.log('[status] sessionId:', sessionId, 'hasKV:', hasKV, 'hasDb:', hasDb, 'onVercel:', process.env.VERCEL === '1');
    
    // Check if session exists first
    const session = await getSession(sessionId);
    if (!session) {
      console.log('[status] Session not found:', sessionId);
      return NextResponse.json({ 
        error: 'session_not_found',
        message: 'Session not found. This may be due to serverless cold starts. Consider configuring DATABASE_URL (Neon) or Vercel KV for persistence.',
        sessionId,
        hasKV,
        hasDb,
        onVercel: process.env.VERCEL === '1'
      }, { status: 404 });
    }
    
    const snap = await getSnapshot(sessionId);
    return NextResponse.json(snap);
  } catch (e: any) {
    console.error('[status] Error:', e);
    const msg = e?.message || 'not_found';
    return NextResponse.json({ 
      error: msg,
      message: e?.message || 'Failed to get session status',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: msg === 'session_not_found' ? 404 : 500 });
  }
}