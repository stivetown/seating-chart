export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession } from '@/server/storage';

const Body = z.object({
  displayName: z.string().optional(),
  groupSizeHint: z.number().int().min(1).max(12).optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));
    const body = Body.safeParse(raw);
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
    console.log('[create] hasKV:', hasKV, 'onVercel:', process.env.VERCEL === '1');
    
    const { session: s, host } = await createSession(body.data);
    
    console.log('[create] Session created:', s.id, 'token:', s.inviteToken, 'host:', host.id);
    
    return NextResponse.json({ 
      sessionId: s.id, 
      inviteToken: s.inviteToken, 
      joinUrl: `/s/${s.inviteToken}`, 
      hostId: host.id,
      _debug: process.env.NODE_ENV === 'development' ? { hasKV, onVercel: process.env.VERCEL === '1' } : undefined
    });
  } catch (e: any) {
    console.error('[create] Session creation error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to create session' }, { status: 500 });
  }
}