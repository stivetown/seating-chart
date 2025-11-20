import { parse } from 'csv-parse/sync';
import { z } from 'zod';

// Flexible CSV import system that handles any column structure
export interface ColumnMapping {
  [csvColumn: string]: string; // Maps CSV column name to attribute path
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errors: Array<{ row: number; error: string }>;
  sampleData?: Record<string, any>[];
}

/**
 * Parse CSV file and return structured data
 */
export function parseCSV(csvContent: string): string[][] {
  try {
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow varying column counts
    });
    return records;
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect columns from CSV header row
 */
export function detectColumns(csvRows: string[][]): string[] {
  if (csvRows.length === 0) {
    return [];
  }
  return csvRows[0];
}

/**
 * Map CSV rows to member attributes using column mapping
 */
export function mapCSVToMembers(
  csvRows: string[][],
  columnMapping: ColumnMapping
): Array<{ attributes: Record<string, any>; rowNumber: number }> {
  if (csvRows.length < 2) {
    return []; // Need at least header + one data row
  }

  const headers = csvRows[0];
  const dataRows = csvRows.slice(1);
  const members: Array<{ attributes: Record<string, any>; rowNumber: number }> = [];

  dataRows.forEach((row, index) => {
    const attributes: Record<string, any> = {};
    let hasData = false;

    headers.forEach((header, colIndex) => {
      const mappedPath = columnMapping[header];
      if (mappedPath && row[colIndex] !== undefined && row[colIndex] !== '') {
        // Support nested paths like "profile.name"
        setNestedProperty(attributes, mappedPath, row[colIndex]);
        hasData = true;
      }
    });

    if (hasData) {
      members.push({
        attributes,
        rowNumber: index + 2, // +2 because: 1-indexed + header row
      });
    }
  });

  return members;
}

/**
 * Set nested property on object (e.g., "profile.name" -> obj.profile.name)
 */
function setNestedProperty(obj: Record<string, any>, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Validate and process CSV import
 */
export async function processCSVImport(
  csvContent: string,
  columnMapping: ColumnMapping
): Promise<ImportResult> {
  try {
    const csvRows = parseCSV(csvContent);
    
    if (csvRows.length < 2) {
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        errorRows: 0,
        errors: [{ row: 0, error: 'CSV file must have at least a header row and one data row' }],
      };
    }

    const members = mapCSVToMembers(csvRows, columnMapping);
    const totalRows = csvRows.length - 1; // Exclude header
    const importedRows = members.length;
    const errorRows = totalRows - importedRows;

    // Get sample data (first 5 rows)
    const sampleData = members.slice(0, 5).map(m => m.attributes);

    return {
      success: true,
      totalRows,
      importedRows,
      errorRows,
      errors: [],
      sampleData,
    };
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      errorRows: 0,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : 'Unknown error during import',
        },
      ],
    };
  }
}

/**
 * Generate default column mapping (maps CSV columns to themselves)
 */
export function generateDefaultMapping(csvColumns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  csvColumns.forEach((col) => {
    // Clean column name and use as attribute path
    const cleanName = col.trim().toLowerCase().replace(/\s+/g, '_');
    mapping[col] = cleanName;
  });
  return mapping;
}

