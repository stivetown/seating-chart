import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  AlertTriangle,
  Users,
  Users2,
  UserPlus
} from 'lucide-react';
import { useMembers } from './hooks/useMembers';
import Dashboard from './components/Dashboard';
import UngroupedMembers from './components/UngroupedMembers';
import GroupCards from './components/GroupCards';
import ImportExport from './components/ImportExport';

// Password Protection Component
const LoginGate = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const CORRECT_PASSWORD = 'Fd#9K2m!8nQ7$xL5'; // Secure password for Freeda admin access

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for security
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        sessionStorage.setItem('freeda_authenticated', 'true');
        onAuthenticated();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-600 mb-2">🎯 Freeda</div>
          <div className="text-gray-600 text-sm">Admin Interface - Members & Matching</div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Access Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter admin password"
              required
              disabled={isLoading}
            />
            {error && (
              <div className="mt-2 text-red-600 text-sm">{error}</div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Authenticating...' : 'Access Admin Dashboard'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          Secure access required for member data protection
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Check authentication status
  useEffect(() => {
    const authStatus = sessionStorage.getItem('freeda_authenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  const {
    members,
    groups,
    loading,
    error,
    getUngroupedMembers,
    getSuggestionsForMember,
    addMemberToGroup,
    createNewGroup,
    removeMemberFromGroup,
    refreshData
  } = useMembers();

  // Show login gate if not authenticated
  if (!isAuthenticated) {
    return <LoginGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const ungroupedMembers = getUngroupedMembers();
  
  // Calculate dashboard stats
  const dashboardStats = {
    totalMembers: members.length,
    ungroupedMembers: ungroupedMembers.length,
    totalGroups: groups.length,
    avgGroupSize: groups.length > 0 ? members.filter(m => m.groupId).length / groups.length : 0,
    alerts: groups.flatMap(group => {
      const alerts: Array<{
        groupId: string;
        groupName: string;
        type: 'experience_mismatch' | 'price_mismatch' | 'category_imbalance';
        severity: 'high' | 'medium' | 'low';
        description: string;
        affectedMembers: string[];
      }> = [];
      
      // Check for same industry in group
      const industries = new Map();
      group.members.forEach(member => {
        member.categories.forEach(cat => {
          if (!industries.has(cat)) industries.set(cat, []);
          industries.get(cat).push(member.name);
        });
      });
      
      industries.forEach((members: string[], industry: string) => {
        if (members.length > 1) {
          alerts.push({
            groupId: group.id,
            groupName: group.name,
            type: 'category_imbalance',
            severity: 'high' as const,
            description: `Direct competitors in ${industry}: ${members.join(', ')}`,
            affectedMembers: members
          });
        }
      });
      
      return alerts;
    })
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'ungrouped', name: 'Ungrouped Members', icon: Users },
    { id: 'groups', name: 'Group Management', icon: Users2 },
    { id: 'import-export', name: 'Import/Export', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading member data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          stats={dashboardStats} 
          onViewUngrouped={() => setActiveTab('ungrouped')}
          onViewAlerts={() => setActiveTab('alerts')}
        />;
      case 'ungrouped':
        return (
          <UngroupedMembers
            ungroupedMembers={ungroupedMembers}
            groups={groups}
            onAssignMember={addMemberToGroup}
            onCreateGroup={(name: string, memberIds: string[]) => {
              createNewGroup(memberIds[0]);
              return `group_${Date.now()}`;
            }}
          />
        );
      case 'groups':
        return (
          <GroupCards
            groups={groups}
            onRemoveMember={(memberId: string) => {
              // Find which group the member belongs to
              const memberGroup = groups.find(g => 
                g.members.some(m => m.id === memberId)
              );
              if (memberGroup) {
                removeMemberFromGroup(memberId, memberGroup.id);
              }
            }}
            onUpdateGroup={() => {}}
          />
        );
      case 'import-export':
        return <ImportExport 
          groups={groups} 
          ungroupedMembers={ungroupedMembers}
          onImportMembers={() => {}} 
        />;
      default:
        return <Dashboard 
          stats={dashboardStats} 
          onViewUngrouped={() => setActiveTab('ungrouped')}
          onViewAlerts={() => setActiveTab('alerts')}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Freeda Admin</h1>
              <span className="ml-3 text-sm text-gray-500">Member Matching System</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {members.length} members • {groups.length} groups
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('freeda_authenticated');
                  setIsAuthenticated(false);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 