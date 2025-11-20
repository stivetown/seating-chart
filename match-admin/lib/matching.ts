/**
 * Matching algorithm for grouping members based on compatibility and diversity
 */

export interface MemberAttributes {
  [key: string]: any;
}

export interface MatchingWeight {
  attributePath: string;
  weight: number;
  matchType: 'exact' | 'range' | 'similarity' | 'diversity';
}

/**
 * Calculate similarity score between two members
 */
export function calculateSimilarity(
  member1: MemberAttributes,
  member2: MemberAttributes,
  weights: MatchingWeight[]
): number {
  if (weights.length === 0) {
    return 0.5; // Default neutral score
  }

  let totalWeight = 0;
  let weightedScore = 0;

  for (const weightConfig of weights) {
    const value1 = getNestedValue(member1, weightConfig.attributePath);
    const value2 = getNestedValue(member2, weightConfig.attributePath);

    if (value1 === undefined || value2 === undefined) {
      continue; // Skip if attribute doesn't exist
    }

    const score = calculateAttributeScore(value1, value2, weightConfig);
    weightedScore += score * weightConfig.weight;
    totalWeight += weightConfig.weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Get nested value from object using dot notation (e.g., "profile.age")
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Calculate score for a specific attribute based on match type
 */
function calculateAttributeScore(
  value1: any,
  value2: any,
  weightConfig: MatchingWeight
): number {
  switch (weightConfig.matchType) {
    case 'exact':
      return value1 === value2 ? 1.0 : 0.0;

    case 'range':
      // For numeric values, calculate proximity
      const num1 = Number(value1);
      const num2 = Number(value2);
      if (isNaN(num1) || isNaN(num2)) {
        return value1 === value2 ? 1.0 : 0.0;
      }
      const diff = Math.abs(num1 - num2);
      const maxDiff = 100; // Configurable threshold
      return Math.max(0, 1 - diff / maxDiff);

    case 'similarity':
      // String similarity (simple implementation)
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        return calculateStringSimilarity(value1.toLowerCase(), value2.toLowerCase());
      }
      return value1 === value2 ? 1.0 : 0.0;

    case 'diversity':
      // Inverse similarity - prefer different values
      const similarity = value1 === value2 ? 1.0 : 0.0;
      return 1 - similarity;

    default:
      return value1 === value2 ? 1.0 : 0.0;
  }
}

/**
 * Simple string similarity (Jaccard-like)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0.0;
}

/**
 * Calculate group fit score (average similarity within group)
 */
export function calculateGroupFitScore(
  members: MemberAttributes[],
  weights: MatchingWeight[]
): number {
  if (members.length < 2) {
    return 1.0; // Perfect fit for single member
  }

  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const similarity = calculateSimilarity(members[i], members[j], weights);
      totalSimilarity += similarity;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

/**
 * Calculate diversity score for a group
 */
export function calculateDiversityScore(
  members: MemberAttributes[],
  diversityWeights: MatchingWeight[]
): number {
  if (members.length < 2) {
    return 0.0; // No diversity with single member
  }

  let totalDiversity = 0;
  let comparisons = 0;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const diversity = calculateSimilarity(members[i], members[j], diversityWeights);
      totalDiversity += diversity;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalDiversity / comparisons : 0;
}

/**
 * Generate groups from unmatched members
 */
export async function generateGroups(
  members: Array<{ id: string; attributes: MemberAttributes; isMatched?: boolean }>,
  weights: MatchingWeight[],
  groupSize: number = 4,
  minFitScore: number = 0.5
): Promise<Array<{ memberIds: string[]; fitScore: number }>> {
  const unmatched = members.filter((m) => !m.isMatched);
  const groups: Array<{ memberIds: string[]; fitScore: number }> = [];

  // Simple greedy algorithm: start with best matches
  const used = new Set<string>();

  while (unmatched.length > 0 && used.size < unmatched.length) {
    // Find best starting member (one with highest potential matches)
    let bestStart: { id: string; score: number } | null = null;

    for (const member of unmatched) {
      if (used.has(member.id)) continue;

      let avgScore = 0;
      let count = 0;
      for (const other of unmatched) {
        if (other.id === member.id || used.has(other.id)) continue;
        const score = calculateSimilarity(member.attributes, other.attributes, weights);
        avgScore += score;
        count++;
      }
      const finalScore = count > 0 ? avgScore / count : 0;

      if (!bestStart || finalScore > bestStart.score) {
        bestStart = { id: member.id, score: finalScore };
      }
    }

    if (!bestStart) break;

    // Build group starting with best member
    const group: string[] = [bestStart.id];
    used.add(bestStart.id);

    // Add members that best fit the group
    while (group.length < groupSize && unmatched.some((m) => !used.has(m.id))) {
      let bestFit: { id: string; score: number } | null = null;

      for (const member of unmatched) {
        if (used.has(member.id)) continue;

        // Calculate average fit with current group
        const memberData = members.find((m) => m.id === member.id);
        if (!memberData) continue;

        let totalFit = 0;
        for (const groupMemberId of group) {
          const groupMember = members.find((m) => m.id === groupMemberId);
          if (groupMember) {
            totalFit += calculateSimilarity(
              memberData.attributes,
              groupMember.attributes,
              weights
            );
          }
        }
        const avgFit = totalFit / group.length;

        if (!bestFit || avgFit > bestFit.score) {
          bestFit = { id: member.id, score: avgFit };
        }
      }

      if (bestFit && bestFit.score >= minFitScore) {
        group.push(bestFit.id);
        used.add(bestFit.id);
      } else {
        break; // No good matches found
      }
    }

    // Calculate group fit score
    const groupMembers = group.map((id) => {
      const m = members.find((mem) => mem.id === id);
      return m?.attributes;
    }).filter(Boolean) as MemberAttributes[];

    const fitScore = calculateGroupFitScore(groupMembers, weights);

    groups.push({
      memberIds: group,
      fitScore,
    });
  }

  return groups;
}

