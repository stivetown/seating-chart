import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Vibe Deck API is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/session': 'Create a new session',
      'POST /api/join/[token]': 'Join a session with token',
      'GET /api/session/[sessionId]/status':
        'Get session status and participants',
    },
  });
}
