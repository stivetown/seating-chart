import { NextRequest, NextResponse } from 'next/server';
import { computeAndStoreMatch } from '@/server/storage';
import { rateLimiter } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    // TODO: Add rate limiting
    // const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    // const isAllowed = await rateLimiter.isAllowed(clientIP);
    // if (!isAllowed) {
    //   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    // }

    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Compute match
    const { provisional, isFinal, record } = await computeAndStoreMatch(sessionId);

    return NextResponse.json({
      success: true,
      provisional,
      isFinal,
      match: record.groupVibe,
      suggestions: record.suggestions,
    });
  } catch (error) {
    console.error('POST /api/session/[sessionId]/compute error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
