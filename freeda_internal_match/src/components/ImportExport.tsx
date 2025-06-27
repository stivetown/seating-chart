import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Member, Group } from '../types';
import { parseCSVData, exportToCSV, exportGroupSummaryToCSV, downloadSampleCSV } from '../utils/export';
import { validateMemberData } from '../utils/matching';

interface ImportExportProps {
  groups: Group[];
  ungroupedMembers: Member[];
  onImportMembers: (members: Member[]) => void;
}

const ImportExport: React.FC<ImportExportProps> = ({ groups, ungroupedMembers, onImportMembers }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });
  const [showGoogleSheets, setShowGoogleSheets] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportStatus({
        type: 'error',
        message: 'Please upload a CSV file',
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({ type: null, message: '' });

    try {
      const csvContent = await file.text();
      const members = await parseCSVData(csvContent);
      
      // Validate all members
      const validationErrors: string[] = [];
      const validMembers: Member[] = [];

      members.forEach((member, index) => {
        const errors = validateMemberData(member);
        if (errors.length > 0) {
          validationErrors.push(`Row ${index + 2}: ${errors.join(', ')}`);
        } else {
          validMembers.push(member);
        }
      });

      if (validationErrors.length > 0 && validMembers.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'No valid members found in the CSV file',
          details: validationErrors.slice(0, 10) // Show first 10 errors
        });
      } else {
        onImportMembers(validMembers);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${validMembers.length} member${validMembers.length !== 1 ? 's' : ''}`,
          details: validationErrors.length > 0 ? [`${validationErrors.length} rows had validation errors and were skipped`] : undefined
        });
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to parse CSV file',
        details: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportMembers = () => {
    exportToCSV(groups, ungroupedMembers, `Export generated on ${new Date().toLocaleString()}`);
  };

  const handleExportGroupSummary = () => {
    exportGroupSummaryToCSV(groups);
  };

  const handleGoogleSheetsConnect = () => {
    // In a real implementation, this would integrate with Google Sheets API
    setImportStatus({
      type: 'error',
      message: 'Google Sheets integration not implemented yet',
      details: ['This feature would connect to Google Sheets API to fetch member data']
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Import & Export</h2>
        <p className="text-gray-600 mt-1">
          Upload member data or export current group assignments
        </p>
      </div>

      {/* Status Messages */}
      {importStatus.type && (
        <div className={`rounded-lg p-4 ${
          importStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {importStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {importStatus.message}
              </p>
              {importStatus.details && (
                <ul className={`mt-2 text-sm ${
                  importStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {importStatus.details.map((detail, index) => (
                    <li key={index} className="mt-1">• {detail}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setImportStatus({ type: null, message: '' })}
              className={`ml-4 ${
                importStatus.type === 'success' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'
              }`}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Members</h3>
          
          {/* CSV Upload */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">Upload CSV File</h4>
              <p className="text-sm text-gray-600 mb-4">
                Choose a CSV file with member data
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? 'Processing...' : 'Choose File'}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={downloadSampleCSV}
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Download sample CSV template
              </button>
            </div>
          </div>

          {/* Google Sheets */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">Google Sheets</h4>
              </div>
              <button
                onClick={() => setShowGoogleSheets(!showGoogleSheets)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showGoogleSheets ? 'Hide' : 'Show'}
              </button>
            </div>

            {showGoogleSheets && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Connect to Google Sheets to automatically sync member data
                </p>
                
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="Google Sheets URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                  
                  <button
                    onClick={handleGoogleSheetsConnect}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Connect to Google Sheets
                  </button>
                </div>
                
                <p className="text-xs text-gray-500">
                  Make sure your Google Sheet is publicly accessible or you have shared it with the service account
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          
          <div className="space-y-4">
            {/* Full Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Complete Member Export</h4>
                <Download className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Export all members with their group assignments and details
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {groups.reduce((sum, g) => sum + g.members.length, 0) + ungroupedMembers.length} members
                </span>
                <button
                  onClick={handleExportMembers}
                  className="bg-primary-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Group Summary Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Group Summary</h4>
                <Download className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Export group statistics and member lists
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {groups.length} groups
                </span>
                <button
                  onClick={handleExportGroupSummary}
                  className="bg-primary-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {/* Archive Export */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Archive Snapshot</h4>
                <Download className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Create a timestamped archive for record keeping
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Includes notes and metadata
                </span>
                <button
                  onClick={() => exportToCSV(groups, ungroupedMembers, `Archive snapshot created on ${new Date().toLocaleString()}`)}
                  className="border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Create Archive
                </button>
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Export Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Files are exported in CSV format compatible with Excel and Google Sheets</li>
                <li>• All exports include timestamps for tracking</li>
                <li>• Member categories are semicolon-separated for easy parsing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExport; 