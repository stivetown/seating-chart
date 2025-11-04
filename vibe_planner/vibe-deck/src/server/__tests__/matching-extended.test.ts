import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  scoreTopVibes,
  aggregateScores,
  pickTop,
  computeGroupVibe,
  chooseSuggestions,
  type Participant,
} from '../matching';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
  emitSessionEvent: vi.fn(),
}));

describe('Matching Logic - Extended Tests', () => {
  describe('scoreTopVibes', () => {
    it('should handle empty top vibes', () => {
      const topVibes: string[] = [];
      const scores = scoreTopVibes(topVibes);
      expect(scores).toEqual({});
    });

    it('should handle mixed valid and invalid top vibes', () => {
      const topVibes = ['cozy-creative', '', 'chill-social'];
      const scores = scoreTopVibes(topVibes);

      expect(scores).toEqual({
        'cozy-creative': 3, // 1st place
        'chill-social': 1, // 3rd place (2nd is empty)
      });
    });

    it('should handle more than 3 top vibes', () => {
      const topVibes = ['a', 'b', 'c', 'd', 'e'];
      const scores = scoreTopVibes(topVibes);

      expect(scores).toEqual({
        a: 3, // 1st place
        b: 2, // 2nd place
        c: 1, // 3rd place (4th and 5th ignored)
      });
    });

    it('should handle duplicate vibes', () => {
      const topVibes = ['cozy-creative', 'cozy-creative', 'chill-social'];
      const scores = scoreTopVibes(topVibes);

      expect(scores).toEqual({
        'cozy-creative': 5, // 3 + 2 = 5 points
        'chill-social': 1, // 3rd place
      });
    });
  });

  describe('aggregateScores', () => {
    it('should handle participants with different orders', () => {
      const participants: Participant[] = [
        {
          id: '1',
          state: 'completed',
          topVibes: ['cozy-creative', 'chill-social', 'lowkey-game'],
        },
        {
          id: '2',
          state: 'completed',
          topVibes: ['chill-social', 'cozy-creative', 'music-mingle'],
        },
        {
          id: '3',
          state: 'completed',
          topVibes: ['lowkey-game', 'music-mingle', 'cozy-creative'],
        },
      ];

      const scores = aggregateScores(participants);

      expect(scores).toEqual({
        'cozy-creative': 6, // 3 + 2 + 1 = 6 points
        'chill-social': 5, // 2 + 3 + 0 = 5 points
        'lowkey-game': 4, // 1 + 0 + 3 = 4 points
        'music-mingle': 3, // 0 + 1 + 2 = 3 points
      });
    });

    it('should handle participants with no top vibes', () => {
      const participants: Participant[] = [
        { id: '1', state: 'completed' },
        { id: '2', state: 'completed', topVibes: [] },
        { id: '3', state: 'completed', topVibes: ['cozy-creative'] },
      ];

      const scores = aggregateScores(participants);

      expect(scores).toEqual({
        'cozy-creative': 3, // Only participant with valid topVibes counted
      });
    });
  });

  describe('pickTop', () => {
    it('should handle edge case with very low scores', () => {
      const scores = { 'vibe-a': 1, 'vibe-b': 1, 'vibe-c': 0 };
      const result = pickTop(scores);

      expect(result).toEqual({ key: 'vibe-a', score: 1 }); // 'a' wins tiebreak
    });

    it('should handle single participant with perfect score', () => {
      const scores = { 'vibe-a': 3 };
      const result = pickTop(scores);

      expect(result).toEqual({ key: 'vibe-a', score: 3 });
    });

    it('should handle zero scores', () => {
      const scores = { 'vibe-a': 0, 'vibe-b': 0 };
      const result = pickTop(scores);

      expect(result).toEqual({ key: 'vibe-a', score: 0 }); // 'a' wins tiebreak
    });
  });

  describe('computeGroupVibe', () => {
    it('should handle single participant with perfect score', () => {
      const participants: Participant[] = [
        {
          id: '1',
          state: 'completed',
          topVibes: ['cozy-creative', 'chill-social', 'lowkey-game'],
        },
      ];

      const result = computeGroupVibe(participants);

      expect(result).toEqual({
        key: 'cozy-creative',
        confidence: 1.0, // 3 / (3 * 1) = 1.0
      });
    });

    it('should handle edge case with very low confidence', () => {
      const participants: Participant[] = [
        { id: '1', state: 'completed', topVibes: ['cozy-creative'] },
        { id: '2', state: 'completed', topVibes: ['chill-social'] },
        { id: '3', state: 'completed', topVibes: ['lowkey-game'] },
      ];

      const result = computeGroupVibe(participants);

      // All different vibes, so highest scoring one wins with low confidence
      expect(result).toEqual({
        key: 'chill-social', // 'c' comes first lexically among the 3
        confidence: 0.33, // 1 / (3 * 3) = 0.333... rounded to 0.33
      });
    });

    it('should handle participants with different completion states', () => {
      const participants: Participant[] = [
        { id: '1', state: 'completed', topVibes: ['cozy-creative'] },
        { id: '2', state: 'joined' },
        { id: '3', state: 'swiping' },
        { id: '4', state: 'completed', topVibes: ['cozy-creative'] },
      ];

      const result = computeGroupVibe(participants);

      expect(result).toEqual({
        key: 'cozy-creative',
        confidence: 1.0, // (3 + 3) / (3 * 2) = 6/6 = 1.0
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
          { title: 'Board-Game Café', desc: 'Low-rules games' },
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

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].title).toBe('Cook + Movie Night');
    });

    it('should try split fallback for combo not found', () => {
      const suggestions = chooseSuggestions(
        'chill-social|music-mingle',
        recommendations
      );

      // Should find 'music-mingle' (second part of combo)
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].title).toBe('Playlist Party');
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

      const suggestions = chooseSuggestions(
        'test-vibe',
        recommendationsWithMany
      );

      expect(suggestions).toHaveLength(5);
      expect(suggestions[0].title).toBe('Item 1');
      expect(suggestions[4].title).toBe('Item 5');
    });

    it('should handle empty recommendations array', () => {
      const suggestions = chooseSuggestions('any-vibe', []);

      expect(suggestions).toEqual([]);
    });
  });
});
