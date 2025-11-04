export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addParticipant, getSessionByToken } from '@/server/storage';

const Body = z.object({
  displayName: z.string().optional(),
  deviceFingerprint: z.string().optional(),
});

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const bodyRaw = await _req.json().catch(() => ({}));
    const body = Body.safeParse(bodyRaw);
    if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
    const session = await getSessionByToken(token);
    if (!session) return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
    const p = await addParticipant(session.id, {
      displayName: body.data.displayName || 'Guest',
      deviceFingerprint: body.data.deviceFingerprint || null,
      state: 'swiping',
    });
    return NextResponse.json({ participantId: p.id, sessionId: session.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'join_failed' }, { status: 500 });
  }
}