export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/server/storage';

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const s = await getSession(sessionId);
  if (!s) return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  const joinUrl = base ? `${base}/s/${s.inviteToken}` : `${new URL('/', _req.url).origin}/s/${s.inviteToken}`;
  return NextResponse.json({ joinUrl, inviteToken: s.inviteToken });
}
