export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveSwipes, computeAndStoreMatch, listParticipants } from '@/server/storage';

const Body = z.object({
  participantId: z.string(),
  rawSwipes: z.record(z.any(), z.any()).transform((swipes) => {
    // Convert all keys to strings and values to numbers
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(swipes)) {
      const numValue = typeof value === 'number' ? value : Number(value);
      if (!isNaN(numValue)) {
        result[String(key)] = numValue;
      }
    }
    return result;
  }),
  topVibes: z.array(z.any()).transform((arr) => 
    arr.map(String).filter(Boolean).slice(0, 3)
  ),
});

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    console.log('SWIPES_ENDPOINT: called for sessionId:', sessionId);
    
    const rawBody = await req.json();
    console.log('SWIPES_ENDPOINT: raw request body:', rawBody);
    
    // Enhanced validation with better error messages
    const body = Body.safeParse(rawBody);
    if (!body.success) {
      const errors = body.error.flatten();
      console.log('SWIPES_ENDPOINT: validation failed:', errors);
      
      // Create a readable error message
      const fieldErrors = Object.entries(errors.fieldErrors)
        .map(([field, fieldErrors]) => `${field}: ${fieldErrors?.join(', ')}`)
        .join('; ');
      
      const readableError = fieldErrors || 'Invalid request data';
      
      return NextResponse.json({ 
        error: 'Invalid swipes data',
        message: readableError,
        details: errors,
        received: rawBody 
      }, { status: 400 });
    }
    
    console.log('SWIPES_ENDPOINT: validated body:', body.data);
    
    // Validate participantId exists in session
    const participants = await listParticipants(sessionId);
    const participant = participants.find(p => p.id === body.data.participantId);
    if (!participant) {
      console.log('SWIPES_ENDPOINT: participant not found:', body.data.participantId);
      return NextResponse.json({ 
        error: 'Participant not found in session' 
      }, { status: 404 });
    }
    
    console.log('SWIPES_ENDPOINT: Saving swipes:', {
      participantId: body.data.participantId,
      topVibes: body.data.topVibes,
      topVibesLength: body.data.topVibes?.length || 0,
      rawSwipesCount: Object.keys(body.data.rawSwipes || {}).length,
      rawSwipes: body.data.rawSwipes,
    });
    
    await saveSwipes(sessionId, body.data.participantId, { 
      rawSwipes: body.data.rawSwipes, 
      topVibes: body.data.topVibes 
    });
    
    console.log('SWIPES_ENDPOINT: Swipes saved, computing match...');
    const { provisional, isFinal, record } = await computeAndStoreMatch(sessionId);
    console.log('SWIPES_ENDPOINT: Match computed - provisional:', provisional, 'isFinal:', isFinal, 'match:', record.groupVibe);
    
    return NextResponse.json({ 
      provisional, 
      isFinal, 
      match: record.groupVibe, 
      suggestions: record.suggestions 
    });
  } catch (e: any) {
    console.error('SWIPES_ENDPOINT: error:', e);
    return NextResponse.json({ 
      error: e?.message || 'Internal server error' 
    }, { status: 500 });
  }
}