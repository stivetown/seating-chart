import { describe, it, expect } from 'vitest';
import {
  scoreTopVibes,
  aggregateScores,
  pickTop,
  computeGroupVibe,
  chooseSuggestions,
  type Participant,
  type MatchResult,
} from '../matching';

describe('scoreTopVibes', () => {
  it('should score vibes with proper weights', () => {
    const topVibes = ['vibe-a', 'vibe-b', 'vibe-c'];
    const scores = scoreTopVibes(topVibes);

    expect(scores).toEqual({
      'vibe-a': 3, // 1st place
      'vibe-b': 2, // 2nd place
      'vibe-c': 1, // 3rd place
    });
  });

  it('should handle missing entries gracefully', () => {
    const topVibes = ['vibe-a', '', 'vibe-c'];
    const scores = scoreTopVibes(topVibes);

    expect(scores).toEqual({
      'vibe-a': 3, // 1st place
      'vibe-c': 1, // 3rd place (2nd is empty, so 3rd gets 1pt)
    });
  });

  it('should handle empty array', () => {
    const scores = scoreTopVibes([]);
    expect(scores).toEqual({});
  });

  it('should handle array with more than 3 items', () => {
    const topVibes = ['vibe-a', 'vibe-b', 'vibe-c', 'vibe-d', 'vibe-e'];
    const scores = scoreTopVibes(topVibes);

    expect(scores).toEqual({
      'vibe-a': 3, // 1st place
      'vibe-b': 2, // 2nd place
      'vibe-c': 1, // 3rd place (4th and 5th ignored)
    });
  });

  it('should handle duplicate vibes', () => {
    const topVibes = ['vibe-a', 'vibe-a', 'vibe-b'];
    const scores = scoreTopVibes(topVibes);

    expect(scores).toEqual({
      'vibe-a': 5, // 3 + 2 = 5 points
      'vibe-b': 1, // 3rd place
    });
  });
});

describe('aggregateScores', () => {
  it('should aggregate scores from multiple participants', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a', 'vibe-b'] },
      { id: '2', state: 'completed', topVibes: ['vibe-b', 'vibe-c'] },
      { id: '3', state: 'completed', topVibes: ['vibe-a', 'vibe-c'] },
    ];

    const scores = aggregateScores(participants);

    expect(scores).toEqual({
      'vibe-a': 6, // 3 + 3 = 6 (both participants have it 1st)
      'vibe-b': 5, // 3 + 2 = 5 (1st + 2nd)
      'vibe-c': 4, // 2 + 2 = 4 (both participants have it 2nd)
    });
  });

  it('should ignore participants with different states', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a'] },
      { id: '2', state: 'joined', topVibes: ['vibe-b'] },
      { id: '3', state: 'swiping', topVibes: ['vibe-c'] },
    ];

    const scores = aggregateScores(participants);

    expect(scores).toEqual({
      'vibe-a': 3, // Only completed participant counted
    });
  });

  it('should ignore participants without topVibes', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a'] },
      { id: '2', state: 'completed' }, // No topVibes
      { id: '3', state: 'completed', topVibes: [] }, // Empty topVibes
    ];

    const scores = aggregateScores(participants);

    expect(scores).toEqual({
      'vibe-a': 3, // Only participant with valid topVibes counted
    });
  });

  it('should handle empty participants array', () => {
    const scores = aggregateScores([]);
    expect(scores).toEqual({});
  });
});

describe('pickTop', () => {
  it('should return highest scoring key', () => {
    const scores = { 'vibe-a': 5, 'vibe-b': 3, 'vibe-c': 7 };
    const result = pickTop(scores);

    expect(result).toEqual({ key: 'vibe-c', score: 7 });
  });

  it('should use lexical order for tiebreaking', () => {
    const scores = { 'vibe-b': 5, 'vibe-a': 5, 'vibe-c': 3 };
    const result = pickTop(scores);

    expect(result).toEqual({ key: 'vibe-a', score: 5 }); // 'a' comes before 'b' lexically
  });

  it('should return null for empty scores', () => {
    const result = pickTop({});
    expect(result).toBeNull();
  });

  it('should handle single entry', () => {
    const scores = { 'vibe-a': 3 };
    const result = pickTop(scores);

    expect(result).toEqual({ key: 'vibe-a', score: 3 });
  });
});

describe('computeGroupVibe', () => {
  it('should calculate confidence correctly for 2 participants', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a', 'vibe-b'] },
      { id: '2', state: 'completed', topVibes: ['vibe-a', 'vibe-c'] },
    ];

    const result = computeGroupVibe(participants);

    expect(result).toEqual({
      key: 'vibe-a',
      confidence: 1.0, // (3 + 3) / (3 * 2) = 6/6 = 1.0
    });
  });

  it('should calculate confidence correctly for 3 participants', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a', 'vibe-b'] },
      { id: '2', state: 'completed', topVibes: ['vibe-b', 'vibe-c'] },
      { id: '3', state: 'completed', topVibes: ['vibe-a', 'vibe-c'] },
    ];

    const result = computeGroupVibe(participants);

    // vibe-a: 3 + 3 = 6 points
    // vibe-b: 3 + 2 = 5 points
    // vibe-c: 2 + 2 = 4 points
    // Total possible: 3 * 3 = 9
    expect(result).toEqual({
      key: 'vibe-a',
      confidence: 0.67, // 6/9 = 0.666... rounded to 0.67
    });
  });

  it('should return null for no completed participants', () => {
    const participants: Participant[] = [
      { id: '1', state: 'joined' },
      { id: '2', state: 'swiping' },
    ];

    const result = computeGroupVibe(participants);
    expect(result).toBeNull();
  });

  it('should return null for completed participants with no topVibes', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed' },
      { id: '2', state: 'completed' },
    ];

    const result = computeGroupVibe(participants);
    expect(result).toBeNull();
  });

  it('should handle mixed participant states', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a'] },
      { id: '2', state: 'joined' },
      { id: '3', state: 'completed', topVibes: ['vibe-a'] },
    ];

    const result = computeGroupVibe(participants);

    expect(result).toEqual({
      key: 'vibe-a',
      confidence: 1.0, // (3 + 3) / (3 * 2) = 6/6 = 1.0
    });
  });

  it('should round confidence to 2 decimal places', () => {
    const participants: Participant[] = [
      { id: '1', state: 'completed', topVibes: ['vibe-a', 'vibe-b'] },
      { id: '2', state: 'completed', topVibes: ['vibe-b', 'vibe-a'] },
    ];

    const result = computeGroupVibe(participants);

    // Both have vibe-a and vibe-b, but in different orders
    // vibe-a: 3 + 2 = 5 points
    // vibe-b: 2 + 3 = 5 points
    // Total possible: 3 * 2 = 6
    // Confidence: 5/6 = 0.833... rounded to 0.83
    expect(result).toEqual({
      key: 'vibe-a', // 'a' wins tiebreak
      confidence: 0.83,
    });
  });
});

describe('chooseSuggestions', () => {
  const recommendations = [
    {
      vibe_combo_key: 'chill-social|cozy-creative',
      items: [
        { title: 'Cook + Movie Night', desc: 'Comfort food and films' },
        { title: 'Craft & Chat', desc: 'Creative activities' },
      ],
    },
    {
      vibe_combo_key: 'lowkey-game',
      items: [
        { title: 'Board Game Night', desc: 'Strategy games' },
        { title: 'Card Games', desc: 'Quick card games' },
      ],
    },
    {
      vibe_combo_key: 'music-mingle',
      items: [
        { title: 'Playlist Party', desc: 'Music sharing' },
        { title: 'Karaoke Night', desc: 'Singing fun' },
      ],
    },
  ];

  it('should find exact combo match', () => {
    const suggestions = chooseSuggestions(
      'chill-social|cozy-creative',
      recommendations
    );

    expect(suggestions).toEqual([
      { title: 'Cook + Movie Night', desc: 'Comfort food and films' },
      { title: 'Craft & Chat', desc: 'Creative activities' },
    ]);
  });

  it('should find single vibe match', () => {
    const suggestions = chooseSuggestions('lowkey-game', recommendations);

    expect(suggestions).toEqual([
      { title: 'Board Game Night', desc: 'Strategy games' },
      { title: 'Card Games', desc: 'Quick card games' },
    ]);
  });

  it('should try split fallback for combo not found', () => {
    const suggestions = chooseSuggestions(
      'chill-social|music-mingle',
      recommendations
    );

    // Should find 'music-mingle' (second part of combo)
    expect(suggestions).toEqual([
      { title: 'Playlist Party', desc: 'Music sharing' },
      { title: 'Karaoke Night', desc: 'Singing fun' },
    ]);
  });

  it('should use fallback function when no matches found', () => {
    const fallbackFn = (key: string) => [
      { title: `Fallback for ${key}`, desc: 'Default suggestion' },
    ];

    const suggestions = chooseSuggestions(
      'unknown-vibe',
      recommendations,
      fallbackFn
    );

    expect(suggestions).toEqual([
      { title: 'Fallback for unknown-vibe', desc: 'Default suggestion' },
    ]);
  });

  it('should return empty array when no matches and no fallback', () => {
    const suggestions = chooseSuggestions('unknown-vibe', recommendations);

    expect(suggestions).toEqual([]);
  });

  it('should limit results to 5 items', () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      title: `Item ${i + 1}`,
      desc: `Description ${i + 1}`,
    }));

    const recommendationsWithMany = [
      {
        vibe_combo_key: 'test-vibe',
        items: manyItems,
      },
    ];

    const suggestions = chooseSuggestions('test-vibe', recommendationsWithMany);

    expect(suggestions).toHaveLength(5);
    expect(suggestions[0].title).toBe('Item 1');
    expect(suggestions[4].title).toBe('Item 5');
  });

  it('should handle empty recommendations array', () => {
    const suggestions = chooseSuggestions('any-vibe', []);

    expect(suggestions).toEqual([]);
  });
});
