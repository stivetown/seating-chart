import Papa from 'papaparse';
import { Member, Group, ExportData } from '../types';
import { format } from 'date-fns';

// Export groups and members to CSV
export function exportToCSV(groups: Group[], ungroupedMembers: Member[], notes?: string): void {
  const exportData: ExportData = {
    groups,
    ungroupedMembers,
    exportDate: new Date().toISOString(),
    notes
  };

  // Prepare data for CSV export
  const csvData: any[] = [];

  // Add header row
  csvData.push([
    'Member Name',
    'Email',
    'Experience Level',
    'Price Tier',
    'Categories',
    'Group ID',
    'Group Name',
    'Group Size',
    'Joined Date',
    'Last Active',
    'Notes'
  ]);

  // Add grouped members
  groups.forEach(group => {
    group.members.forEach(member => {
      csvData.push([
        member.name,
        member.email,
        member.experience,
        member.priceTier,
        member.categories.join('; '),
        member.groupId,
        group.name,
        group.members.length,
        member.joinedDate,
        member.lastActive,
        member.notes || ''
      ]);
    });
  });

  // Add ungrouped members
  ungroupedMembers.forEach(member => {
    csvData.push([
      member.name,
      member.email,
      member.experience,
      member.priceTier,
      member.categories.join('; '),
      '',
      'Unassigned',
      0,
      member.joinedDate,
      member.lastActive,
      member.notes || ''
    ]);
  });

  // Convert to CSV string
  const csv = Papa.unparse(csvData);

  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `freeda_groups_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export group summary to CSV
export function exportGroupSummaryToCSV(groups: Group[]): void {
  const csvData: any[] = [];

  // Add header row
  csvData.push([
    'Group ID',
    'Group Name',
    'Member Count',
    'Average Experience',
    'Dominant Price Tier',
    'Categories',
    'Created Date',
    'Last Modified',
    'Member Names',
    'Notes'
  ]);

  // Add group data
  groups.forEach(group => {
    csvData.push([
      group.id,
      group.name,
      group.members.length,
      group.averageExperience.toFixed(2),
      group.dominantPriceTier,
      group.categories.join('; '),
      group.createdDate,
      group.lastActivity,
      group.members.map(m => m.name).join('; '),
      group.notes || ''
    ]);
  });

  // Convert to CSV string
  const csv = Papa.unparse(csvData);

  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `freeda_group_summary_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Parse CSV data for import
export function parseCSVData(csvContent: string): Promise<Member[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize header names for the Freeda dataset
        const normalized = header.toLowerCase().trim();
        switch (normalized) {
          case 'full name':
          case 'name':
          case 'member name':
            return 'name';
          case 'email':
          case 'email address':
            return 'email';
          case 'experience':
          case 'experience level':
          case 'skill level':
          case 'years within industry':
            return 'yearsInIndustry';
          case 'price tier':
          case 'price':
          case 'pricing tier':
          case 'budget':
          case 'what range do most of your clients\' budgets fall into?':
            return 'priceTier';
          case 'categories':
          case 'interests':
          case 'skills':
          case 'industry category':
            return 'categories';
          case 'group id':
          case 'group':
            return 'groupId';
          case 'joined date':
          case 'join date':
          case 'registration date':
            return 'joinedDate';
          case 'last active':
          case 'last login':
          case 'last seen':
            return 'lastActive';
          case 'notes':
          case 'comments':
            return 'notes';
          case 'what was your average revenue per booking last year?':
            return 'averageRevenue';
          case 'when did you start the company?':
            return 'companyFounded';
          case 'your company\'s approximate annual net revenue?':
            return 'annualRevenue';
          case 'city, state':
          case 'where are most of your events taking place?':
            return 'location';
          case 'what is your biggest goal for this year?':
            return 'goals';
          case 'type of bookings':
            return 'bookingTypes';
          case 'number of bookings per year':
            return 'bookingsPerYear';
          case 'number of freelancers you regularly work with':
            return 'freelancersWorkedWith';
          case 'which of the following best describes your current networking strategy?':
            return 'networkingStrategy';
          case 'which of the following is most important to you when it comes to freeda?':
            return 'freedaImportance';
          default:
            return header;
        }
      },
      complete: (results) => {
        try {
          const members: Member[] = results.data.map((row: any, index: number) => {
            // Generate ID if not provided
            const id = row.id || `member_${Date.now()}_${index}`;
            
            // Parse categories - handle industry category format
            let categories: string[] = [];
            if (row.categories) {
              if (typeof row.categories === 'string') {
                // Map specific industry categories to our simplified ones
                const categoryMap: { [key: string]: string } = {
                  'Photographer': 'Photographer',
                  'Planner': 'Planner',
                  'Caterer': 'Catering',
                  'Florist': 'Floral',
                  'Videographer': 'Videographer',
                  'DJ': 'Entertainment',
                  'Stationer': 'Stationery'
                };
                categories = [categoryMap[row.categories] || row.categories];
              } else if (Array.isArray(row.categories)) {
                categories = row.categories;
              }
            }

            // Parse years in industry to determine experience level
            const yearsInIndustry = parseInt(row.yearsInIndustry) || 0;
            let experience: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
            if (yearsInIndustry <= 3) experience = 'Beginner';
            else if (yearsInIndustry <= 8) experience = 'Intermediate';
            else if (yearsInIndustry <= 15) experience = 'Advanced';
            else experience = 'Expert';

            // Parse price tier from budget range or average revenue
            let priceTier: 'Budget' | 'Mid-Range' | 'Premium' | 'Luxury';
            const avgRevenue = parseInt(row.averageRevenue) || 0;
            if (avgRevenue <= 10000) priceTier = 'Budget';
            else if (avgRevenue <= 25000) priceTier = 'Mid-Range';
            else if (avgRevenue <= 50000) priceTier = 'Premium';
            else priceTier = 'Luxury';

            // Parse group ID
            let groupId = undefined;
            if (row.groupId && row.groupId.toLowerCase().includes('group')) {
              groupId = row.groupId.toLowerCase().replace(/\s+/g, '_');
            }

            return {
              id,
              name: row.name || '',
              email: `${row.name?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}@example.com` || `member${index}@example.com`,
              experience: experience,
              priceTier: priceTier,
              categories,
              location: row.location || '',
              yearsInIndustry: yearsInIndustry,
              averageRevenue: row.averageRevenue || '0',
              companyFounded: row.companyFounded || '',
              annualRevenue: row.annualRevenue || '',
              goals: row.goals || '',
              bookingTypes: row.bookingTypes || '',
              bookingsPerYear: parseInt(row.bookingsPerYear) || 0,
              freelancersWorkedWith: parseInt(row.freelancersWorkedWith) || 0,
              networkingStrategy: row.networkingStrategy || '',
              freedaImportance: row.freedaImportance || '',
              groupId: groupId,
              notes: row.notes || undefined,
              joinedDate: row.joinedDate || new Date().toISOString().split('T')[0],
              lastActive: row.lastActive || new Date().toISOString().split('T')[0]
            };
          }).filter(member => member.name); // Filter out invalid rows

          resolve(members);
        } catch (error) {
          reject(new Error(`Failed to parse CSV data: ${error}`));
        }
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// Generate sample CSV template
export function downloadSampleCSV(): void {
  const sampleData = [
    [
      'Member Name',
      'Email',
      'Experience Level',
      'Price Tier',
      'Categories',
      'Group ID',
      'Joined Date',
      'Last Active',
      'Notes'
    ],
    [
      'John Doe',
      'john.doe@example.com',
      'Intermediate',
      'Mid-Range',
      'Photography; Travel; Nature',
      '',
      '2024-01-15',
      '2024-06-20',
      'New member, very enthusiastic'
    ],
    [
      'Jane Smith',
      'jane.smith@example.com',
      'Advanced',
      'Premium',
      'Portrait; Wedding; Studio',
      'group_001',
      '2023-08-10',
      '2024-06-25',
      'Experienced photographer'
    ]
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'freeda_member_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 