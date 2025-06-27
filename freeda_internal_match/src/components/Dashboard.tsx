import React from 'react';
import { Users, UserPlus, AlertTriangle, BarChart3 } from 'lucide-react';
import { DashboardStats, GroupAlert } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  onViewUngrouped: () => void;
  onViewAlerts: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, onViewUngrouped, onViewAlerts }) => {
  const getSeverityColor = (severity: GroupAlert['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertIcon = (type: GroupAlert['type']) => {
    switch (type) {
      case 'experience_mismatch': return '⚡';
      case 'price_mismatch': return '💰';
      case 'category_imbalance': return '⚖️';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-elegant-card rounded-xl p-8 text-white shadow-elegant">
        <h1 className="text-elegant-heading">Freeda Admin Dashboard</h1>
        <p className="text-elegant-body mt-4">Manage member groups and assignments with intelligent recommendations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-elegant p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-primary-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">Total Members</p>
              <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div 
          className="card-elegant p-6 cursor-pointer hover:bg-white/20 transition-all duration-200 transform hover:-translate-y-1"
          onClick={onViewUngrouped}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserPlus className="h-8 w-8 text-orange-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">Ungrouped Members</p>
              <p className="text-2xl font-bold text-white">{stats.ungroupedMembers}</p>
              {stats.ungroupedMembers > 0 && (
                <p className="text-sm text-orange-300">Click to view</p>
              )}
            </div>
          </div>
        </div>

        <div className="card-elegant p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-green-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">Total Groups</p>
              <p className="text-2xl font-bold text-white">{stats.totalGroups}</p>
            </div>
          </div>
        </div>

        <div className="card-elegant p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/70">Avg Group Size</p>
              <p className="text-2xl font-bold text-white">{stats.avgGroupSize.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {stats.alerts.length > 0 && (
        <div className="card-elegant">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-300 mr-2" />
                <h2 className="text-lg font-semibold text-white">Group Alerts</h2>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-200 rounded-full">
                  {stats.alerts.length}
                </span>
              </div>
              <button
                onClick={onViewAlerts}
                className="text-sm font-medium text-primary-300 hover:text-primary-200 transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {stats.alerts.slice(0, 3).map((alert, index) => (
                <div
                  key={`${alert.groupId}-${index}`}
                  className={`p-4 rounded-lg border backdrop-blur-sm ${
                    alert.severity === 'high' ? 'bg-red-500/20 border-red-400/50 text-red-200' :
                    alert.severity === 'medium' ? 'bg-orange-500/20 border-orange-400/50 text-orange-200' :
                    'bg-yellow-500/20 border-yellow-400/50 text-yellow-200'
                  }`}
                >
                  <div className="flex items-start">
                    <span className="text-lg mr-3">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white">{alert.groupName}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          alert.severity === 'high' ? 'bg-red-500/30 text-red-200' :
                          alert.severity === 'medium' ? 'bg-orange-500/30 text-orange-200' :
                          'bg-yellow-500/30 text-yellow-200'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-white/90">{alert.description}</p>
                      <p className="text-xs mt-2 text-white/70">
                        Affected: {alert.affectedMembers.slice(0, 3).join(', ')}
                        {alert.affectedMembers.length > 3 && ` +${alert.affectedMembers.length - 3} more`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {stats.alerts.length > 3 && (
                <div className="text-center pt-2">
                  <button
                    onClick={onViewAlerts}
                    className="text-sm font-medium text-primary-300 hover:text-primary-200 transition-colors"
                  >
                    View {stats.alerts.length - 3} more alerts
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card-elegant p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={onViewUngrouped}
            className="p-4 text-left border border-white/20 rounded-lg hover:border-primary-300 hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <UserPlus className="h-5 w-5 text-primary-300 mr-3" />
              <div>
                <p className="font-medium text-white">Assign Members</p>
                <p className="text-sm text-white/70">Review ungrouped members and assign them</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={onViewAlerts}
            className="p-4 text-left border border-white/20 rounded-lg hover:border-primary-300 hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-primary-300 mr-3" />
              <div>
                <p className="font-medium text-white">Review Alerts</p>
                <p className="text-sm text-white/70">Check groups with potential issues</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 text-left border border-white/20 rounded-lg hover:border-primary-300 hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary-300 mr-3" />
              <div>
                <p className="font-medium text-white">View Groups</p>
                <p className="text-sm text-white/70">Browse all group summary cards</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {stats.totalMembers === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
          <p className="text-gray-600 mb-6">Upload a CSV file or connect to Google Sheets to get started</p>
          <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
            Import Members
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 