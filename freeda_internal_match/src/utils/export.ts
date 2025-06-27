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
      group.lastModified,
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
        // Normalize header names
        const normalized = header.toLowerCase().trim();
        switch (normalized) {
          case 'name':
          case 'member name':
          case 'full name':
            return 'name';
          case 'email':
          case 'email address':
            return 'email';
          case 'experience':
          case 'experience level':
          case 'skill level':
            return 'experience';
          case 'price tier':
          case 'price':
          case 'pricing tier':
          case 'budget':
            return 'priceTier';
          case 'categories':
          case 'interests':
          case 'skills':
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
          default:
            return header;
        }
      },
      complete: (results) => {
        try {
          const members: Member[] = results.data.map((row: any, index: number) => {
            // Generate ID if not provided
            const id = row.id || `member_${Date.now()}_${index}`;
            
            // Parse categories - handle different formats
            let categories: string[] = [];
            if (row.categories) {
              if (typeof row.categories === 'string') {
                categories = row.categories
                  .split(/[;,|]/)
                  .map((cat: string) => cat.trim())
                  .filter((cat: string) => cat.length > 0);
              } else if (Array.isArray(row.categories)) {
                categories = row.categories;
              }
            }

            // Validate and normalize experience level
            const experienceMap: Record<string, string> = {
              'beginner': 'Beginner',
              'intermediate': 'Intermediate', 
              'advanced': 'Advanced',
              'expert': 'Expert',
              'junior': 'Beginner',
              'senior': 'Advanced',
              'lead': 'Expert'
            };
            
            const normalizedExp = experienceMap[row.experience?.toLowerCase()] || row.experience;

            // Validate and normalize price tier
            const priceTierMap: Record<string, string> = {
              'budget': 'Budget',
              'mid-range': 'Mid-Range',
              'mid range': 'Mid-Range',
              'premium': 'Premium',
              'luxury': 'Luxury',
              'low': 'Budget',
              'medium': 'Mid-Range',
              'high': 'Premium',
              'very high': 'Luxury'
            };

            const normalizedPrice = priceTierMap[row.priceTier?.toLowerCase()] || row.priceTier;

            return {
              id,
              name: row.name || '',
              email: row.email || '',
              experience: normalizedExp as any,
              priceTier: normalizedPrice as any,
              categories,
              groupId: row.groupId || undefined,
              notes: row.notes || undefined,
              joinedDate: row.joinedDate || new Date().toISOString().split('T')[0],
              lastActive: row.lastActive || new Date().toISOString().split('T')[0]
            };
          }).filter(member => member.name && member.email); // Filter out invalid rows

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