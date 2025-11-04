import { NextRequest, NextResponse } from 'next/server';
import { shareCardSchema } from '@/lib/validation';

// Vibe emoji mapping
const vibeEmojis: Record<string, string> = {
  'cozy-creative': '🎨',
  'chill-social': '☕',
  'lowkey-game': '🎮',
  'mini-adventure': '🗺️',
  'talk-taste': '🍷',
  'music-mingle': '🎵',
  'active-outdoor': '🏃‍♂️',
  'focused-build': '🔨',
  'culture-hop': '🎭',
  'late-night': '🌙',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = shareCardSchema.parse(body);

    const { groupVibeKey, participants, suggestions } = validatedData;

    // Get emoji for the vibe
    const emoji = vibeEmojis[groupVibeKey] || '✨';

    // Format participant names
    const participantNames = participants.map((p) => p.name).join(', ');
    const participantCount = participants.length;

    // Format suggestions (max 3)
    const suggestionList = suggestions.slice(0, 3).map((s) => s.title);

    // For now, return a simple JSON response indicating the card would be generated
    // In a production environment, you would use a proper image generation library
    return NextResponse.json({
      message: 'Share card generation not yet implemented',
      data: {
        groupVibeKey,
        participantCount,
        suggestionCount: suggestionList.length,
        emoji,
      },
    });
  } catch (error) {
    console.error('Error generating share card:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate share card' },
      { status: 500 }
    );
  }
}
