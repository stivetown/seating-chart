import React, { useState } from 'react';
import { User, Brain, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { Member, Group, GroupSuggestion } from '../types';
import { generateGroupSuggestions } from '../utils/matching';

interface UngroupedMembersProps {
  ungroupedMembers: Member[];
  groups: Group[];
  onAssignMember: (memberId: string, groupId: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => string;
}

const UngroupedMembers: React.FC<UngroupedMembersProps> = ({
  ungroupedMembers,
  groups,
  onAssignMember,
  onCreateGroup
}) => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [suggestions, setSuggestions] = useState<GroupSuggestion[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    const memberSuggestions = generateGroupSuggestions(member, groups);
    setSuggestions(memberSuggestions);
  };

  const handleAssignment = (groupId: string) => {
    if (selectedMember) {
      onAssignMember(selectedMember.id, groupId);
      setSelectedMember(null);
      setSuggestions([]);
    }
  };

  const handleCreateNewGroup = () => {
    if (selectedMember && newGroupName.trim()) {
      onCreateGroup(newGroupName.trim(), [selectedMember.id]);
      setSelectedMember(null);
      setSuggestions([]);
      setShowCreateGroup(false);
      setNewGroupName('');
    }
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (ungroupedMembers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All members are grouped!</h3>
        <p className="text-gray-600">Every member has been assigned to a group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ungrouped Members</h2>
            <p className="text-gray-600 mt-1">
              {ungroupedMembers.length} member{ungroupedMembers.length !== 1 ? 's' : ''} waiting for assignment
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Brain className="h-4 w-4 mr-1" />
            Click a member to see AI suggestions
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members List */}
        <div className="space-y-4">
          {ungroupedMembers.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all ${
                selectedMember?.id === member.id
                  ? 'border-primary-300 ring-2 ring-primary-100'
                  : 'border-gray-200 hover:border-primary-200'
              }`}
              onClick={() => handleMemberSelect(member)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {member.name}
                    </h3>
                    {selectedMember?.id === member.id && (
                      <ArrowRight className="h-4 w-4 text-primary-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate">{member.email}</p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExperienceColor(member.experience)}`}>
                      {member.experience}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriceTierColor(member.priceTier)}`}>
                      {member.priceTier}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Categories: {member.categories.slice(0, 3).join(', ')}
                      {member.categories.length > 3 && ` +${member.categories.length - 3} more`}
                    </p>
                  </div>
                  
                  {member.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{member.notes}"</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {selectedMember ? (
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Brain className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  AI Suggestions for {selectedMember.name}
                </h3>
              </div>

              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.groupId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{suggestion.groupName}</h4>
                        <div className={`px-2 py-1 text-xs font-bold rounded-full ${getScoreColor(suggestion.score)}`}>
                          {suggestion.score}% match
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        {suggestion.reasons.map((reason, index) => (
                          <p key={index} className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            {reason}
                          </p>
                        ))}
                      </div>
                      
                      {suggestion.potentialIssues && (
                        <div className="space-y-1 mb-3">
                          {suggestion.potentialIssues.map((issue, index) => (
                            <p key={index} className="text-sm text-amber-600 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                              {issue}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleAssignment(suggestion.groupId)}
                        className="w-full bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                      >
                        Assign to this group
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No existing groups to suggest</p>
                </div>
              )}

              {/* Create New Group Option */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {!showCreateGroup ? (
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="w-full border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Create new group with {selectedMember.name}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateNewGroup}
                        disabled={!newGroupName.trim()}
                        className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Create Group
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateGroup(false);
                          setNewGroupName('');
                        }}
                        className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a member</h3>
              <p className="text-gray-600">
                Click on a member from the list to see AI-powered group suggestions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UngroupedMembers; 