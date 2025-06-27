export interface Member {
  id: string;
  name: string;
  email: string;
  experience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  priceTier: 'Budget' | 'Mid-Range' | 'Premium' | 'Luxury';
  categories: string[];
  
  // New fields for enhanced matching algorithm
  location?: string; // City, State
  yearsInIndustry?: number; // Years Within Industry
  averageRevenue?: string; // What was your average revenue per booking last year?
  companyFounded?: string; // When did you start the company?
  annualRevenue?: string; // Your company's approximate annual net revenue
  
  // Secondary fields for context
  goals?: string; // What is your biggest goal for this year?
  bookingTypes?: string; // Type of Bookings
  bookingsPerYear?: number; // Number of Bookings Per Year
  freelancersWorkedWith?: number; // Number of freelancers you regularly work with
  networkingStrategy?: string; // Which of the following best describes your networking strategy?
  freedaImportance?: string; // Which of the following is most important to you when it comes to Freeda?
  
  groupId?: string;
  notes?: string;
  joinedDate: string;
  lastActive: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  averageExperience: number;
  dominantPriceTier: string;
  categories: string[];
  createdDate: string;
  lastActivity: string;
  notes?: string;
}

export interface GroupSuggestion {
  groupId: string;
  groupName: string;
  score: number;
  reasons: string[];
  potentialIssues?: string[];
}

export interface GroupAlert {
  groupId: string;
  groupName: string;
  type: 'experience_mismatch' | 'price_mismatch' | 'category_imbalance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedMembers: string[];
}

export interface DashboardStats {
  totalMembers: number;
  ungroupedMembers: number;
  totalGroups: number;
  avgGroupSize: number;
  alerts: GroupAlert[];
}

export interface ExportData {
  groups: Group[];
  ungroupedMembers: Member[];
  exportDate: string;
  notes?: string;
}

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type PriceTier = 'Budget' | 'Mid-Range' | 'Premium' | 'Luxury';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const PRICE_TIERS: PriceTier[] = ['Budget', 'Mid-Range', 'Premium', 'Luxury'];

export const EXPERIENCE_SCORES = {
  'Beginner': 1,
  'Intermediate': 2,
  'Advanced': 3,
  'Expert': 4
} as const; 