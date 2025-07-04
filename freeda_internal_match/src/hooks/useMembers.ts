import { useState, useEffect } from 'react';
import { Member, Group, GroupSuggestion } from '../types';
import { generateGroupSuggestions, calculateGroupStats } from '../utils/matching';
import { parseCSVToMembers } from '../utils/csvParser';
import { loadSecureMemberData } from '../data/members';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real CSV data
  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load the secure CSV data
      const csvText = await loadSecureMemberData();
      const parsedMembers = parseCSVToMembers(csvText);
      
      // Initialize groups from existing group assignments
      const existingGroups = new Map<string, Group>();
      
      parsedMembers.forEach(member => {
        if (member.groupId) {
          if (!existingGroups.has(member.groupId)) {
            const groupNumber = member.groupId.replace('G', '');
            existingGroups.set(member.groupId, {
              id: member.groupId,
              name: `Group ${groupNumber}`,
              members: [],
              averageExperience: 0,
              dominantPriceTier: '',
              categories: [] as string[],
              createdDate: new Date().toISOString().split('T')[0],
              lastActivity: new Date().toISOString().split('T')[0]
            });
          }
          const group = existingGroups.get(member.groupId)!;
          group.members.push(member);
        }
      });

             // Calculate group statistics
       existingGroups.forEach(group => {
                   const stats = calculateGroupStats(group);
         group.averageExperience = stats.averageExperience;
         group.dominantPriceTier = stats.dominantPriceTier;
         group.categories = stats.categories;
       });

      setMembers(parsedMembers);
      setGroups(Array.from(existingGroups.values()));
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading CSV data:', err);
      setError('Failed to load member data');
      setLoading(false);
    }
  };

  const getUngroupedMembers = () => {
    return members.filter(member => !member.groupId);
  };

  const getSuggestionsForMember = (memberId: string): GroupSuggestion[] => {
    const member = members.find(m => m.id === memberId);
    if (!member) return [];
    
    return generateGroupSuggestions(member, groups);
  };

  const addMemberToGroup = (memberId: string, groupId: string) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, groupId }
        : member
    ));

    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const updatedMember = members.find(m => m.id === memberId);
        if (updatedMember) {
          const newMembers = [...group.members, { ...updatedMember, groupId }];
          const updatedGroup = {
            ...group,
            members: newMembers,
          };
          const stats = calculateGroupStats(updatedGroup);
          return {
            ...updatedGroup,
            averageExperience: stats.averageExperience,
            dominantPriceTier: stats.dominantPriceTier,
            categories: stats.categories,
            lastActivity: new Date().toISOString().split('T')[0]
          };
        }
      }
      return group;
    }));
  };

  const createNewGroup = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const existingGroupNumbers = groups.map(g => parseInt(g.id.replace('G', ''))).filter(Boolean);
    const nextGroupNumber = Math.max(0, ...existingGroupNumbers) + 1;
    const groupId = `G${nextGroupNumber}`;

    const updatedMember = { ...member, groupId };
    
    setMembers(prev => prev.map(m => 
      m.id === memberId ? updatedMember : m
    ));

    const newGroup = {
      id: groupId,
      name: `Group ${nextGroupNumber}`,
      members: [updatedMember],
      averageExperience: 0,
      dominantPriceTier: '',
      categories: [] as string[],
      createdDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0]
    };

    const stats = calculateGroupStats(newGroup);
    newGroup.averageExperience = stats.averageExperience;
    newGroup.dominantPriceTier = stats.dominantPriceTier;
    newGroup.categories = stats.categories;

    setGroups(prev => [...prev, newGroup]);
  };

  const removeMemberFromGroup = (memberId: string, groupId: string) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, groupId: undefined }
        : member
    ));

    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newMembers = group.members.filter(m => m.id !== memberId);
        if (newMembers.length === 0) {
          return null; // Mark for removal
        }
        const updatedGroup = {
          ...group,
          members: newMembers,
        };
        const stats = calculateGroupStats(updatedGroup);
        return {
          ...updatedGroup,
          averageExperience: stats.averageExperience,
          dominantPriceTier: stats.dominantPriceTier,
          categories: stats.categories,
          lastActivity: new Date().toISOString().split('T')[0]
        };
      }
      return group;
    }).filter(Boolean) as Group[]);
  };

  const importMembers = (importedMembers: Member[]) => {
    // Add imported members to existing members
    setMembers(prev => {
      // Remove duplicates based on name and email
      const existingMemberKeys = new Set(prev.map(m => `${m.name}-${m.email}`));
      const newMembers = importedMembers.filter(member => 
        !existingMemberKeys.has(`${member.name}-${member.email}`)
      );
      
      return [...prev, ...newMembers];
    });

    // Process groups from imported members
    const newGroups = new Map<string, Group>();
    importedMembers.forEach(member => {
      if (member.groupId) {
        if (!newGroups.has(member.groupId)) {
          const groupNumber = member.groupId.replace(/[^\d]/g, '');
          newGroups.set(member.groupId, {
            id: member.groupId,
            name: `Group ${groupNumber}`,
            members: [],
            averageExperience: 0,
            dominantPriceTier: '',
            categories: [] as string[],
            createdDate: new Date().toISOString().split('T')[0],
            lastActivity: new Date().toISOString().split('T')[0]
          });
        }
        const group = newGroups.get(member.groupId)!;
        group.members.push(member);
      }
    });

    // Calculate group statistics and merge with existing groups
    newGroups.forEach(group => {
      const stats = calculateGroupStats(group);
      group.averageExperience = stats.averageExperience;
      group.dominantPriceTier = stats.dominantPriceTier;
      group.categories = stats.categories;
    });

    setGroups(prev => {
      // Merge with existing groups, avoiding duplicates
      const existingGroupIds = new Set(prev.map(g => g.id));
      const groupsToAdd = Array.from(newGroups.values()).filter(g => 
        !existingGroupIds.has(g.id)
      );
      
      return [...prev, ...groupsToAdd];
    });
  };

  return {
    members,
    groups,
    loading,
    error,
    getUngroupedMembers,
    getSuggestionsForMember,
    addMemberToGroup,
    createNewGroup,
    removeMemberFromGroup,
    importMembers,
    refreshData: loadCSVData
  };
} 