import React, { useState } from 'react';
import { Users, TrendingUp, DollarSign, Tag, MoreHorizontal, UserMinus, Edit3 } from 'lucide-react';
import { Group, Member } from '../types';

interface GroupCardsProps {
  groups: Group[];
  onRemoveMember: (memberId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Group>) => void;
}

const GroupCards: React.FC<GroupCardsProps> = ({ groups, onRemoveMember, onUpdateGroup }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriceTierColor = (tier: string) => {
    switch (tier) {
      case 'Budget': return 'bg-green-100 text-green-800';
      case 'Mid-Range': return 'bg-yellow-100 text-yellow-800';
      case 'Premium': return 'bg-orange-100 text-orange-800';
      case 'Luxury': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLabel = (score: number): string => {
    if (score <= 1.5) return 'Beginner';
    if (score <= 2.5) return 'Intermediate';
    if (score <= 3.5) return 'Advanced';
    return 'Expert';
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
        <p className="text-gray-600">Groups will appear here once members are assigned</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Group Overview</h2>
        <p className="text-gray-600 mt-1">
          {groups.length} active group{groups.length !== 1 ? 's' : ''} with balanced diversity
        </p>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Group Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{group.name}</h3>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Group Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{group.members.length}</p>
                  <p className="text-xs text-gray-600">Members</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {getExperienceLabel(group.averageExperience)}
                  </p>
                  <p className="text-xs text-gray-600">Avg Level</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{group.dominantPriceTier}</p>
                  <p className="text-xs text-gray-600">Price Tier</p>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm font-medium text-gray-700">Categories</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.categories.slice(0, 4).map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                  {group.categories.length > 4 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      +{group.categories.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Member Preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Members</p>
                {group.members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900 truncate max-w-[120px]">
                        {member.name}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getExperienceColor(member.experience)}`}>
                        {member.experience.charAt(0)}
                      </span>
                    </div>
                  </div>
                ))}
                {group.members.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{group.members.length - 3} more members
                  </p>
                )}
              </div>
            </div>

            {/* Expanded Member List */}
            {expandedGroup === group.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">All Members</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-600 truncate">{member.email}</p>
                        <div className="flex space-x-1 mt-1">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${getExperienceColor(member.experience)}`}>
                            {member.experience}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${getPriceTierColor(member.priceTier)}`}>
                            {member.priceTier}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveMember(member.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove from group"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Group Actions */}
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-primary-700 transition-colors">
                    View Details
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Group Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last modified: {new Date(group.lastActivity).toLocaleDateString()}
              </p>
              {group.notes && (
                <p className="text-xs text-gray-600 mt-1 italic">"{group.notes}"</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Total Members</p>
            <p className="text-2xl font-bold text-gray-900">
              {groups.reduce((sum, group) => sum + group.members.length, 0)}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Average Group Size</p>
            <p className="text-2xl font-bold text-gray-900">
              {groups.length > 0 
                ? Math.round(groups.reduce((sum, group) => sum + group.members.length, 0) / groups.length * 10) / 10
                : 0
              }
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Largest Group</p>
            <p className="text-2xl font-bold text-gray-900">
              {groups.length > 0 ? Math.max(...groups.map(g => g.members.length)) : 0}
            </p>
          </div>
          
                      <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  const allCats = groups.flatMap(g => g.categories);
                  return allCats.filter((cat, index) => allCats.indexOf(cat) === index).length;
                })()}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCards; 