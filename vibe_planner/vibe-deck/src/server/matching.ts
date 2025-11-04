import type { Participant, MatchResult } from '@/types/core';

export type TopVibes = string[];

export function scoreTopVibes(topVibes: TopVibes | undefined | null) {
  const scores: Record<string, number> = {};
  if (!topVibes || topVibes.length === 0) return scores;
  const weights = [3, 2, 1];
  for (let i = 0; i < Math.min(3, topVibes.length); i++) {
    const key = topVibes[i];
    if (!key) continue;
    scores[key] = (scores[key] ?? 0) + weights[i];
  }
  return scores;
}

export function aggregateScores(participants: Participant[]) {
  const acc: Record<string, number> = {};
  console.log('[aggregateScores] Processing participants:', participants.length);
  for (const p of participants) {
    if (p.state !== 'completed' || !p.topVibes?.length) {
      console.log('[aggregateScores] Skipping participant:', { 
        id: p.id, 
        state: p.state, 
        hasTopVibes: !!p.topVibes?.length 
      });
      continue;
    }
    console.log('[aggregateScores] Participant:', { 
      id: p.id, 
      displayName: p.displayName, 
      topVibes: p.topVibes 
    });
    const s = scoreTopVibes(p.topVibes);
    console.log('[aggregateScores] Scores for participant:', s);
    for (const [k, v] of Object.entries(s)) acc[k] = (acc[k] ?? 0) + v;
  }
  console.log('[aggregateScores] Total aggregated scores:', acc);
  return acc;
}

export function pickTop(scores: Record<string, number>) {
  const entries = Object.entries(scores);
  if (!entries.length) {
    console.log('[pickTop] No scores to pick from');
    return null;
  }
  console.log('[pickTop] All scores before sorting:', entries);
  entries.sort((a, b) => {
    if (b[1] === a[1]) return a[0].localeCompare(b[0]); // lexical tiebreak
    return b[1] - a[1];
  });
  console.log('[pickTop] Sorted scores:', entries);
  const [key, score] = entries[0];
  console.log('[pickTop] Picked top:', { key, score });
  return { key, score };
}

export function computeGroupVibe(participants: Participant[]): MatchResult | null {
  const completed = participants.filter(p => p.state === 'completed');
  console.log('[computeGroupVibe] Total participants:', participants.length, 'Completed:', completed.length);
  if (!completed.length) {
    console.log('[computeGroupVibe] No completed participants');
    return null;
  }
  const totalPossible = 3 * completed.length;
  console.log('[computeGroupVibe] Total possible points:', totalPossible);
  const aggregated = aggregateScores(participants);
  const top = pickTop(aggregated);
  if (!top || totalPossible === 0) {
    console.log('[computeGroupVibe] No top vibe found or totalPossible is 0');
    return null;
  }
  const confidence = Math.round((top.score / totalPossible) * 100) / 100;
  console.log('[computeGroupVibe] Final result:', { key: top.key, score: top.score, confidence, totalPossible });
  return { key: top.key, confidence };
}

export function chooseSuggestions(
  vibeKey: string,
  recommendations: Array<{ vibe_combo_key: string; items: any[] }>,
  fallbackBySingle?: (key: string) => any[]
): any[] {
  // Try exact combo matches where vibeKey may be a combo "a|b" or single "a"
  const exactMatch = recommendations.find(r => r.vibe_combo_key === vibeKey);
  if (exactMatch) {
    return exactMatch.items.slice(0, 5);
  }

  // If not found and key contains "|", try each side individually
  if (vibeKey.includes('|')) {
    const parts = vibeKey.split('|');
    for (const part of parts) {
      const partMatch = recommendations.find(r => r.vibe_combo_key === part);
      if (partMatch) {
        return partMatch.items.slice(0, 5);
      }
    }
  }

  // If still not found, use fallbackBySingle(key) or return an empty array
  if (fallbackBySingle) {
    return fallbackBySingle(vibeKey).slice(0, 5);
  }

  return [];
}

/**
Provisional vs Final guideline (for API):
- Provisional when completed >= Math.min(2, totalParticipants)
- Final when (completed == totalParticipants) OR (confidence >= 0.70)
*/