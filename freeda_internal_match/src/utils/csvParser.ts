import { Member } from '../types';

export interface CSVMemberRow {
  'Contact: First name': string;
  'Contact: Last name': string;
  'Contact: Email': string;
  'Years Within Industry': string;
  'What was your average revenue per booking last year?': string;
  'When did you start the company?': string;
  'Your company\'s approximate annual net revenue?': string;
  'Industry Category': string;
  'City, State': string;
  'What is your biggest goal for this year?': string;
  'Type of Bookings': string;
  'Number of Bookings Per Year': string;
  'Number of freelancers you regularly work with': string;
  'Which of the following best describes your networking strategy?': string;
  'Which of the following is most important to you when it comes to Freeda?': string;
  'Group Number ': string;
}

export function parseCSVToMembers(csvData: string): Member[] {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const members: Member[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Skip rows without email (invalid members)
    if (!row['Contact: Email'] || !row['Contact: Email'].includes('@')) {
      continue;
    }

    const member = transformRowToMember(row);
    if (member) {
      members.push(member);
    }
  }

  return members;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/"/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim().replace(/"/g, ''));
  return values;
}

function transformRowToMember(row: any): Member | null {
  try {
    const firstName = row['Contact: First name'] || '';
    const lastName = row['Contact: Last name'] || '';
    const email = row['Contact: Email'] || '';
    
    if (!firstName || !lastName || !email) {
      return null;
    }

    // Parse years in industry
    const yearsInIndustryStr = row['Years Within Industry'] || '0';
    const yearsInIndustry = parseInt(yearsInIndustryStr) || 0;

    // Parse average revenue
    const avgRevenueStr = row['What was your average revenue per booking last year?'] || '';
    const avgRevenue = cleanCurrency(avgRevenueStr);

    // Parse company founded date
    const companyFoundedStr = row['When did you start the company?'] || '';
    const companyFounded = parseDate(companyFoundedStr);

    // Parse annual revenue
    const annualRevenue = row['Your company\'s approximate annual net revenue?'] || '';

    // Parse industry category
    const industryCategory = row['Industry Category'] || '';
    const categories = parseIndustryCategory(industryCategory);

    // Parse location
    const location = row['City, State'] || '';

    // Parse other fields
    const goals = row['What is your biggest goal for this year?'] || '';
    const bookingTypes = row['Type of Bookings'] || '';
    const bookingsPerYearStr = row['Number of Bookings Per Year'] || '0';
    const bookingsPerYear = parseBookingsPerYear(bookingsPerYearStr);
    const freelancersStr = row['Number of freelancers you regularly work with'] || '0';
    const freelancersWorkedWith = parseInt(freelancersStr) || 0;
    const networkingStrategy = row['Which of the following best describes your networking strategy?'] || '';
    const freedaImportance = row['Which of the following is most important to you when it comes to Freeda?'] || '';

    // Parse group assignment
    const groupNumber = row['Group Number '] || '';
    const groupId = groupNumber ? `group_${groupNumber}` : undefined;

    // Determine experience level based on years in industry
    let experience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    if (yearsInIndustry <= 3) experience = 'Beginner';
    else if (yearsInIndustry <= 8) experience = 'Intermediate';
    else if (yearsInIndustry <= 15) experience = 'Advanced';
    else experience = 'Expert';

    // Determine price tier based on average revenue
    let priceTier: 'Budget' | 'Mid-Range' | 'Premium' | 'Luxury';
    const avgRevenueNum = parseFloat(avgRevenue.replace(/[,$]/g, '')) || 0;
    if (avgRevenueNum <= 10000) priceTier = 'Budget';
    else if (avgRevenueNum <= 25000) priceTier = 'Mid-Range';
    else if (avgRevenueNum <= 50000) priceTier = 'Premium';
    else priceTier = 'Luxury';

    const member: Member = {
      id: `member_${email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: `${firstName} ${lastName}`,
      email: email,
      experience: experience,
      priceTier: priceTier,
      categories: categories,
      location: location,
      yearsInIndustry: yearsInIndustry,
      averageRevenue: avgRevenue,
      companyFounded: companyFounded,
      annualRevenue: annualRevenue,
      goals: goals,
      bookingTypes: bookingTypes,
      bookingsPerYear: bookingsPerYear,
      freelancersWorkedWith: freelancersWorkedWith,
      networkingStrategy: networkingStrategy,
      freedaImportance: freedaImportance,
      groupId: groupId,
      joinedDate: '2024-01-01', // Default since not in CSV
      lastActive: new Date().toISOString().split('T')[0], // Today
    };

    return member;
  } catch (error) {
    console.error('Error transforming row to member:', error);
    return null;
  }
}

function cleanCurrency(value: string): string {
  if (!value) return '0';
  
  // Remove currency symbols and clean up
  return value.replace(/[\$,\"]/g, '').trim();
}

function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Handle various date formats from CSV
    const cleaned = dateStr.replace(/"/g, '').trim();
    
    // If it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
      return cleaned.split(' ')[0];
    }
    
    // If it's in MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(cleaned)) {
      const [month, day, year] = cleaned.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // If it's a timestamp, convert to date
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return cleaned;
  } catch {
    return dateStr;
  }
}

function parseIndustryCategory(category: string): string[] {
  if (!category) return ['Other'];
  
  const cleaned = category.replace(/"/g, '').trim();
  
  // Map CSV categories to our simplified categories
  const categoryMap: { [key: string]: string } = {
    'Photographer': 'Photographer',
    'Planner, Designer': 'Planner, Designer',
    'Beauty - Hair, Makeup, Skincare': 'Beauty',
    'Catering': 'Catering',
    'Branding, Stationery, Paper, Branded Gifts': 'Stationery',
    'B2B': 'B2B',
    'Videographer': 'Videographer',
    'Bands/Entertainment': 'Entertainment',
    'Not listed above (weather, scenting, et al!)': 'Other',
    'Floral Design': 'Floral',
    'Wedding Fashion - Salon, Styling, Attire': 'Fashion',
    'Officiant': 'Officiant'
  };

  return [categoryMap[cleaned] || 'Other'];
}

function parseBookingsPerYear(bookingsStr: string): number {
  if (!bookingsStr) return 0;
  
  const cleaned = bookingsStr.replace(/"/g, '').trim();
  
  // Handle ranges like "30-25" or "85-90"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const first = parseInt(parts[0]) || 0;
    const second = parseInt(parts[1]) || 0;
    return Math.max(first, second);
  }
  
  return parseInt(cleaned) || 0;
} 