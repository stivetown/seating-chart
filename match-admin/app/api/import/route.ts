import { NextRequest, NextResponse } from 'next/server';
import { processCSVImport, generateDefaultMapping, detectColumns, parseCSV, type ColumnMapping } from '@/lib/csv-import';
import { prisma } from '@/lib/prisma';

// POST /api/import - Import CSV file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenantId') as string;
    const columnMappingJson = formData.get('columnMapping') as string;

    if (!file || !tenantId) {
      return NextResponse.json(
        { error: 'File and tenantId are required' },
        { status: 400 }
      );
    }

    // Read CSV content
    const csvContent = await file.text();

    // Parse CSV to detect columns
    const csvRows = parseCSV(csvContent);
    const detectedColumns = detectColumns(csvRows);

    // Use provided mapping or generate default
    let columnMapping: ColumnMapping;
    if (columnMappingJson) {
      columnMapping = JSON.parse(columnMappingJson);
    } else {
      columnMapping = generateDefaultMapping(detectedColumns);
    }

    // Process import
    const result = await processCSVImport(csvContent, columnMapping);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Import failed', details: result.errors },
        { status: 400 }
      );
    }

    // Create import record
    const importRecord = await prisma.import.create({
      data: {
        tenantId,
        fileName: file.name,
        status: 'pending',
        totalRows: result.totalRows,
        columnMapping: columnMapping as any,
      },
    });

    // Import members in batches (async processing)
    // For now, we'll do it synchronously, but in production you'd want to queue this
    const members = await importMembersFromCSV(
      csvContent,
      columnMapping,
      tenantId,
      importRecord.id
    );

    // Update import record
    await prisma.import.update({
      where: { id: importRecord.id },
      data: {
        status: 'completed',
        importedRows: members.length,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      totalRows: result.totalRows,
      importedRows: members.length,
      sampleData: result.sampleData,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to import members
async function importMembersFromCSV(
  csvContent: string,
  columnMapping: ColumnMapping,
  tenantId: string,
  importId: string
) {
  const { mapCSVToMembers, parseCSV } = await import('@/lib/csv-import');
  const csvRows = parseCSV(csvContent);
  const membersData = mapCSVToMembers(csvRows, columnMapping);

  // Batch insert members
  const members = [];
  for (const memberData of membersData) {
    try {
      const member = await prisma.member.create({
        data: {
          tenantId,
          importId,
          attributes: memberData.attributes as any,
          isMatched: false,
        },
      });
      members.push(member);
    } catch (error) {
      console.error(`Failed to import member at row ${memberData.rowNumber}:`, error);
    }
  }

  return members;
}

// GET /api/import - Get import history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const imports = await prisma.import.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ imports });
  } catch (error) {
    console.error('Error fetching imports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch imports' },
      { status: 500 }
    );
  }
}

