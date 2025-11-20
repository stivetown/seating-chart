import { NextRequest, NextResponse } from 'next/server';
import { detectColumns, parseCSV, generateDefaultMapping } from '@/lib/csv-import';

// POST /api/import/columns - Detect columns from CSV file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const csvContent = await file.text();
    const csvRows = parseCSV(csvContent);
    const columns = detectColumns(csvRows);
    const defaultMapping = generateDefaultMapping(columns);

    // Get sample row for preview
    const sampleRow = csvRows.length > 1 ? csvRows[1] : [];

    return NextResponse.json({
      columns,
      defaultMapping,
      sampleRow,
      totalRows: csvRows.length - 1, // Exclude header
    });
  } catch (error) {
    console.error('Column detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect columns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

