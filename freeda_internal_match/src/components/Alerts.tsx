import React, { useState } from 'react';
import { AlertTriangle, Filter, Search, X } from 'lucide-react';
import { DashboardStats, GroupAlert } from '../types';

interface AlertsProps {
  stats: DashboardStats;
}

const Alerts: React.FC<AlertsProps> = ({ stats }) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<'all' | 'experience_mismatch' | 'price_mismatch' | 'category_imbalance'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getSeverityColor = (severity: GroupAlert['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 border-red-400/50 text-red-200';
      case 'medium': return 'bg-orange-500/20 border-orange-400/50 text-orange-200';
      case 'low': return 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200';
      default: return 'bg-gray-500/20 border-gray-400/50 text-gray-200';
    }
  };

  const getSeverityBadgeColor = (severity: GroupAlert['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-500/30 text-red-200';
      case 'medium': return 'bg-orange-500/30 text-orange-200';
      case 'low': return 'bg-yellow-500/30 text-yellow-200';
      default: return 'bg-gray-500/30 text-gray-200';
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

  const getTypeLabel = (type: GroupAlert['type']) => {
    switch (type) {
      case 'experience_mismatch': return 'Experience Mismatch';
      case 'price_mismatch': return 'Price Mismatch';
      case 'category_imbalance': return 'Category Imbalance';
      default: return 'Alert';
    }
  };

  // Filter alerts based on search and filter criteria
  const filteredAlerts = stats.alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesSearch = searchTerm === '' || 
      alert.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.affectedMembers.some(member => member.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSeverity && matchesType && matchesSearch;
  });

  // Sort alerts by severity (high -> medium -> low)
  const sortedAlerts = filteredAlerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-elegant-card rounded-xl p-8 text-white shadow-elegant">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Group Alerts</h1>
            <p className="text-white/80">Review and manage potential issues in member groups</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{stats.alerts.length}</div>
            <div className="text-sm text-white/70">Total Alerts</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elegant p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/70" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
                className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-primary-400"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-primary-400"
              >
                <option value="all">All Types</option>
                <option value="category_imbalance">Category Imbalance</option>
                <option value="experience_mismatch">Experience Mismatch</option>
                <option value="price_mismatch">Price Mismatch</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-white/70">
            Showing {filteredAlerts.length} of {stats.alerts.length} alerts
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {sortedAlerts.length === 0 ? (
        <div className="card-elegant p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-white/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {stats.alerts.length === 0 ? 'No Alerts Found' : 'No Matching Alerts'}
          </h3>
          <p className="text-white/70">
            {stats.alerts.length === 0 
              ? 'All groups are functioning well with no detected issues.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAlerts.map((alert, index) => (
            <div
              key={`${alert.groupId}-${index}`}
              className={`card-elegant border ${getSeverityColor(alert.severity)}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">{alert.groupName}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityBadgeColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full">
                            {getTypeLabel(alert.type)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-white/90 mb-3">{alert.description}</p>
                      
                      <div>
                        <p className="text-sm text-white/70 mb-2">Affected Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.affectedMembers.map((member, memberIndex) => (
                            <span
                              key={memberIndex}
                              className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded-md"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts; 