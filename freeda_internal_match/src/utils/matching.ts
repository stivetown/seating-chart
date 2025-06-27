import { Member, Group, GroupSuggestion, GroupAlert, EXPERIENCE_SCORES } from '../types';

// Enhanced matching algorithm based on business strategy
export function calculateGroupFit(member: Member, group: Group): number {
  if (group.members.length === 0) return 0;

  let score = 0;
  let dealBreakers = 0;

  // DEAL BREAKER #1: Same Industry Category (prevents direct competition)
  const sameIndustryMembers = group.members.filter(m => 
    m.categories.some(cat => member.categories.includes(cat))
  );
  if (sameIndustryMembers.length > 0) {
    dealBreakers += 50; // Heavy penalty for same industry
  }

  // DEAL BREAKER #2: Same Geographic Market (prevents local competition)
  const memberLocation = extractLocation(member.location || '');
  const sameLocationMembers = group.members.filter(m => {
    const memberLoc = extractLocation(m.location || '');
    return isSameMetroArea(memberLocation, memberLoc);
  });
  if (sameLocationMembers.length > 0) {
    dealBreakers += 40; // Heavy penalty for same location
  }

  // PRIMARY FACTOR #1: Years Within Industry (±2 years compatibility) - 30%
  const memberYears = member.yearsInIndustry || 0;
  const groupYears = group.members.map(m => m.yearsInIndustry || 0);
  const avgGroupYears = groupYears.reduce((a, b) => a + b, 0) / groupYears.length;
  const yearsDiff = Math.abs(memberYears - avgGroupYears);
  
  let yearsScore = 0;
  if (yearsDiff <= 2) yearsScore = 100;
  else if (yearsDiff <= 4) yearsScore = 75;
  else if (yearsDiff <= 6) yearsScore = 50;
  else yearsScore = 25;
  
  score += yearsScore * 0.3;

  // PRIMARY FACTOR #2: Average Revenue Per Booking (±25% compatibility) - 30%
  const memberRevenue = parseRevenue(member.averageRevenue);
  const groupRevenues = group.members
    .map(m => parseRevenue(m.averageRevenue))
    .filter(r => r > 0);
  
  if (groupRevenues.length > 0 && memberRevenue > 0) {
    const avgGroupRevenue = groupRevenues.reduce((a, b) => a + b, 0) / groupRevenues.length;
    const revenueDiff = Math.abs(memberRevenue - avgGroupRevenue) / avgGroupRevenue;
    
    let revenueScore = 0;
    if (revenueDiff <= 0.25) revenueScore = 100;
    else if (revenueDiff <= 0.5) revenueScore = 75;
    else if (revenueDiff <= 0.75) revenueScore = 50;
    else revenueScore = 25;
    
    score += revenueScore * 0.3;
  }

  // PRIMARY FACTOR #3: Business Maturity (company founding date) - 20%
  const memberFounded = new Date(member.companyFounded || Date.now()).getFullYear();
  const currentYear = new Date().getFullYear();
  const memberBusinessAge = currentYear - memberFounded;
  
  const groupBusinessAges = group.members.map(m => {
    const founded = new Date(m.companyFounded || Date.now()).getFullYear();
    return currentYear - founded;
  });
  const avgGroupBusinessAge = groupBusinessAges.reduce((a, b) => a + b, 0) / groupBusinessAges.length;
  const businessAgeDiff = Math.abs(memberBusinessAge - avgGroupBusinessAge);
  
  let businessAgeScore = 0;
  if (businessAgeDiff <= 3) businessAgeScore = 100;
  else if (businessAgeDiff <= 6) businessAgeScore = 75;
  else if (businessAgeDiff <= 10) businessAgeScore = 50;
  else businessAgeScore = 25;
  
  score += businessAgeScore * 0.2;

  // SECONDARY FACTOR: Group size optimization - 10%
  const sizeScore = group.members.length <= 6 ? 100 : Math.max(0, 100 - (group.members.length - 6) * 10);
  score += sizeScore * 0.1;

  // SECONDARY FACTOR: Annual Revenue Scale (backup/validation) - 10%
  const memberAnnualRevenue = parseAnnualRevenue(member.annualRevenue);
  const groupAnnualRevenues = group.members
    .map(m => parseAnnualRevenue(m.annualRevenue))
    .filter(r => r > 0);
    
  if (groupAnnualRevenues.length > 0 && memberAnnualRevenue > 0) {
    const avgGroupAnnualRevenue = groupAnnualRevenues.reduce((a, b) => a + b, 0) / groupAnnualRevenues.length;
    const annualRevenueDiff = Math.abs(memberAnnualRevenue - avgGroupAnnualRevenue) / avgGroupAnnualRevenue;
    
    let annualRevenueScore = 0;
    if (annualRevenueDiff <= 0.5) annualRevenueScore = 100;
    else if (annualRevenueDiff <= 1.0) annualRevenueScore = 75;
    else annualRevenueScore = 50;
    
    score += annualRevenueScore * 0.1;
  }

  // Apply deal breaker penalties
  score = Math.max(0, score - dealBreakers);

  return Math.round(score);
}

// Generate group suggestions with new logic
export function generateGroupSuggestions(member: Member, groups: Group[]): GroupSuggestion[] {
  const suggestions = groups
    .filter(group => group.members.length > 0)
    .map(group => {
      const score = calculateGroupFit(member, group);
      const reasons: string[] = [];
      const potentialIssues: string[] = [];

      // Check for deal breakers
      const sameIndustryMembers = group.members.filter(m => 
        m.categories.some(cat => member.categories.includes(cat))
      );
      if (sameIndustryMembers.length > 0) {
        potentialIssues.push(`Same industry: ${sameIndustryMembers.map(m => m.name).join(', ')}`);
      }

      const memberLocation = extractLocation(member.location || '');
      const sameLocationMembers = group.members.filter(m => {
        const memberLoc = extractLocation(m.location || '');
        return isSameMetroArea(memberLocation, memberLoc);
      });
      if (sameLocationMembers.length > 0) {
        potentialIssues.push(`Same market: ${sameLocationMembers.map(m => m.name).join(', ')}`);
      }

      // Positive matching factors
      const memberYears = member.yearsInIndustry || 0;
      const groupYears = group.members.map(m => m.yearsInIndustry || 0);
      const avgGroupYears = groupYears.reduce((a, b) => a + b, 0) / groupYears.length;
      const yearsDiff = Math.abs(memberYears - avgGroupYears);
      
      if (yearsDiff <= 2) {
        reasons.push(`Similar experience level (${memberYears} vs ${Math.round(avgGroupYears)} years)`);
      }

      const memberRevenue = parseRevenue(member.averageRevenue);
      const groupRevenues = group.members
        .map(m => parseRevenue(m.averageRevenue))
        .filter(r => r > 0);
      
      if (groupRevenues.length > 0 && memberRevenue > 0) {
        const avgGroupRevenue = groupRevenues.reduce((a, b) => a + b, 0) / groupRevenues.length;
        const revenueDiff = Math.abs(memberRevenue - avgGroupRevenue) / avgGroupRevenue;
        
        if (revenueDiff <= 0.25) {
          reasons.push(`Similar pricing tier ($${formatRevenue(memberRevenue)} vs $${formatRevenue(avgGroupRevenue)} avg)`);
        }
      }

      // Cross-industry learning opportunity
      const uniqueIndustries = group.members
        .flatMap(m => m.categories)
        .filter((cat, index, arr) => arr.indexOf(cat) === index)
        .filter(cat => !member.categories.includes(cat));
      
      if (uniqueIndustries.length > 0) {
        reasons.push(`Cross-industry learning: ${uniqueIndustries.slice(0, 2).join(', ')}`);
      }

      return {
        groupId: group.id,
        groupName: group.name,
        score,
        reasons,
        potentialIssues: potentialIssues.length > 0 ? potentialIssues : undefined
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return suggestions;
}

// Helper functions for new matching logic
function extractLocation(location: string): { city: string; state: string; region: string } {
  // Clean up location string and extract city/state
  const cleaned = location.replace(/['"]/g, '').trim();
  
  // Handle various formats: "City, State", "City State", etc.
  const parts = cleaned.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    return {
      city: parts[0].toLowerCase(),
      state: parts[1].toLowerCase(),
      region: getRegion(parts[1].toLowerCase())
    };
  }
  
  return {
    city: cleaned.toLowerCase(),
    state: '',
    region: getRegion(cleaned.toLowerCase())
  };
}

function isSameMetroArea(loc1: any, loc2: any): boolean {
  if (!loc1.city || !loc2.city) return false;
  
  // Same city
  if (loc1.city === loc2.city) return true;
  
  // Major metro areas
  const metroAreas = [
    ['new york', 'brooklyn', 'manhattan', 'queens', 'bronx', 'staten island', 'jersey city', 'hoboken'],
    ['los angeles', 'hollywood', 'beverly hills', 'santa monica', 'manhattan beach', 'pasadena'],
    ['chicago', 'evanston', 'oak park', 'schaumburg'],
    ['boston', 'cambridge', 'somerville', 'newton', 'brookline'],
    ['san francisco', 'oakland', 'berkeley', 'palo alto', 'san jose'],
    ['dallas', 'fort worth', 'plano', 'frisco', 'irving'],
    ['miami', 'fort lauderdale', 'boca raton', 'coral gables']
  ];
  
  for (const metro of metroAreas) {
    if (metro.includes(loc1.city) && metro.includes(loc2.city)) {
      return true;
    }
  }
  
  return false;
}

function getRegion(location: string): string {
  const eastCoast = ['new york', 'ny', 'massachusetts', 'ma', 'connecticut', 'ct', 'new jersey', 'nj', 'pennsylvania', 'pa'];
  const westCoast = ['california', 'ca', 'oregon', 'or', 'washington', 'wa'];
  const south = ['florida', 'fl', 'texas', 'tx', 'north carolina', 'nc', 'south carolina', 'sc', 'georgia', 'ga'];
  const midwest = ['illinois', 'il', 'michigan', 'mi', 'ohio', 'oh', 'wisconsin', 'wi', 'minnesota', 'mn'];
  
  const loc = location.toLowerCase();
  
  if (eastCoast.some(state => loc.includes(state))) return 'east';
  if (westCoast.some(state => loc.includes(state))) return 'west';
  if (south.some(state => loc.includes(state))) return 'south';
  if (midwest.some(state => loc.includes(state))) return 'midwest';
  
  return 'other';
}

function parseRevenue(revenueStr: string | undefined): number {
  if (!revenueStr) return 0;
  
  // Remove currency symbols and commas
  const cleaned = revenueStr.replace(/[\$,]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

function parseAnnualRevenue(revenueRange: string | undefined): number {
  if (!revenueRange) return 0;
  
  const ranges: { [key: string]: number } = {
    '$200K and below': 150000,
    '$200-300K': 250000,
    '$300-400K': 350000,
    '$400-500K': 450000,
    '$500-600K': 550000,
    '$600-700K': 650000,
    '$700-800K': 750000,
    '$800-900K': 850000,
    '$900K-1M': 950000,
    '$1-1.5M': 1250000,
    '$1.5-2M': 1750000,
    '$2-3M': 2500000,
    '$3-4M': 3500000,
    '$4-5M': 4500000,
    '$5M+': 6000000
  };
  
  return ranges[revenueRange] || 0;
}

function formatRevenue(revenue: number): string {
  if (revenue >= 1000000) {
    return `${(revenue / 1000000).toFixed(1)}M`;
  } else if (revenue >= 1000) {
    return `${(revenue / 1000).toFixed(0)}K`;
  }
  return revenue.toString();
}

// Keep existing functions for compatibility
export function analyzeGroupAlerts(groups: Group[]): GroupAlert[] {
  const alerts: GroupAlert[] = [];

  groups.forEach(group => {
    if (group.members.length < 2) return;

    // Alert for same industry members (now a major issue)
    const industryMap: { [key: string]: string[] } = {};
    group.members.forEach(member => {
      member.categories.forEach(cat => {
        if (!industryMap[cat]) industryMap[cat] = [];
        industryMap[cat].push(member.name);
      });
    });

    Object.entries(industryMap).forEach(([industry, members]) => {
      if (members.length > 1) {
        alerts.push({
          groupId: group.id,
          groupName: group.name,
          type: 'experience_mismatch', // Reusing existing type
          severity: 'high',
          description: `Direct competitors in ${industry}: ${members.join(', ')}`,
          affectedMembers: members
        });
      }
    });

    // Alert for same location members
    const locationMap: { [key: string]: string[] } = {};
    group.members.forEach(member => {
      const location = extractLocation(member.location || '');
      const key = `${location.city}, ${location.state}`;
      if (!locationMap[key]) locationMap[key] = [];
      locationMap[key].push(member.name);
    });

    Object.entries(locationMap).forEach(([location, members]) => {
      if (members.length > 1) {
        alerts.push({
          groupId: group.id,
          groupName: group.name,
          type: 'price_mismatch', // Reusing existing type
          severity: 'medium',
          description: `Same market area (${location}): ${members.join(', ')}`,
          affectedMembers: members
        });
      }
    });
  });

  return alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

// Update group statistics calculation
export function calculateGroupStats(group: Group): {
  averageExperience: number;
  dominantPriceTier: string;
  categories: string[];
} {
  if (group.members.length === 0) {
    return {
      averageExperience: 0,
      dominantPriceTier: '',
      categories: []
    };
  }

  // Calculate average years in industry
  const avgExp = group.members.reduce((sum, member) => {
    return sum + (member.yearsInIndustry || 0);
  }, 0) / group.members.length;

  // Find dominant revenue tier
  const revenueTiers = group.members.map(m => m.annualRevenue || 'Unknown');
  const tierCounts = revenueTiers.reduce((acc, tier) => {
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantPriceTier = Object.entries(tierCounts)
    .sort(([,a], [,b]) => b - a)[0][0];

  // Collect unique categories
  const allCats = group.members.flatMap(m => m.categories);
  const categories = allCats.filter((cat, index) => allCats.indexOf(cat) === index);

  return {
    averageExperience: Math.round(avgExp * 100) / 100,
    dominantPriceTier,
    categories
  };
}

// Helper function to get experience label from score
function getExperienceLabel(score: number): string {
  const rounded = Math.round(score);
  switch (rounded) {
    case 1: return 'Beginner';
    case 2: return 'Intermediate';
    case 3: return 'Advanced';
    case 4: return 'Expert';
    default: return 'Unknown';
  }
}

// Validate member data
export function validateMemberData(member: Partial<Member>): string[] {
  const errors: string[] = [];

  if (!member.name?.trim()) {
    errors.push('Name is required');
  }

  if (!member.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
    errors.push('Invalid email format');
  }

  if (!member.yearsInIndustry || member.yearsInIndustry < 0) {
    errors.push('Years in industry is required');
  }

  if (!member.categories || member.categories.length === 0) {
    errors.push('At least one category is required');
  }

  if (!member.location?.trim()) {
    errors.push('Location is required');
  }

  return errors;
} 