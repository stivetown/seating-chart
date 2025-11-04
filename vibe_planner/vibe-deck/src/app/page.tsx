'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VibeDeck from '@/components/VibeDeck';
import type { VibeDeckComplete } from '@/types/vibes';
import { useToast } from '@/components/ui/toast';
import { ToastContainer } from '@/components/ui/toast';
import { getSessionHistory, addToSessionHistory } from '@/lib/session-history';
import { getGroups, createGroup } from '@/lib/groups';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Plus, Users, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isSwiping, setIsSwiping] = useState(false);
  const [results, setResults] = useState<VibeDeckComplete | null>(null);
  const [sessionHistory, setSessionHistory] = useState(getSessionHistory());
  const [groups, setGroups] = useState(getGroups());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const { addToast } = useToast();

  // Refresh data when component mounts or when returning from other pages
  useEffect(() => {
    setSessionHistory(getSessionHistory());
    setGroups(getGroups());
  }, []);

  const handleStartSolo = () => {
    setIsSwiping(true);
  };

  const handleComplete = (result: VibeDeckComplete) => {
    setResults(result);
    setIsSwiping(false);

    addToast({
      type: 'success',
      title: 'Vibe Selection Complete!',
      description: `You selected ${result.topVibes.length} vibes. Ready to find your perfect match!`,
    });
  };

  const handleReset = () => {
    setResults(null);
    setIsSwiping(false);
  };

  const [hostSessionData, setHostSessionData] = useState<{
    sessionId: string;
    participantId: string;
    groupId?: string;
  } | null>(null);
  const [isHostSwiping, setIsHostSwiping] = useState(false);

  const handleCreateGroupSession = async (groupId?: string) => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to create session');

      // Store session data and show swipe deck for host
      setHostSessionData({
        sessionId: data.sessionId,
        participantId: data.hostId,
        groupId,
      });
      setIsHostSwiping(true);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Failed to Create Session',
        description: String(e.message || e),
      });
    }
  };

  const handleHostSwipeComplete = async (result: VibeDeckComplete) => {
    if (!hostSessionData) return;

    try {
      // Save host's swipes
      const cleanSwipes: Record<string, number> = {};
      Object.entries(result.rawSwipes || {}).forEach(([k, v]) => {
        const n = typeof v === 'number' ? v : Number(v);
        if (Number.isFinite(n)) cleanSwipes[String(k)] = n;
      });

      const cleanTop = Array.from(new Set((result.topVibes || []).map(String).filter(Boolean))).slice(0, 3);

      const res = await fetch(`/api/session/${hostSessionData.sessionId}/swipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: hostSessionData.participantId,
          rawSwipes: cleanSwipes,
          topVibes: cleanTop,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'swipes_failed');

      // If creating from a group, save the group info
      if (hostSessionData.groupId) {
        const group = groups.find(g => g.id === hostSessionData.groupId);
        if (group) {
          // Update group with session info
          // Note: In a real implementation, you'd want to link this properly
        }
      }

      // Add to session history
      addToSessionHistory({
        sessionId: hostSessionData.sessionId,
        name: 'New Session',
        participantCount: 1,
        expiresAt: Date.now() + 48 * 60 * 60 * 1000, // 48 hours
      });

      addToast({
        type: 'success',
        title: 'Your vibe is ready! 🎉',
        description: 'Now invite friends to join you.',
      });

      // Navigate to sync page
      router.push(`/sync/${hostSessionData.sessionId}`);
    } catch (e: any) {
      console.error('Host swipe error:', e);
      addToast({
        type: 'error',
        title: 'Failed to Save Your Vibe',
        description: String(e.message || e),
      });
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      addToast({
        type: 'error',
        title: 'Group Name Required',
        description: 'Please enter a name for your group.',
      });
      return;
    }

    const group = createGroup(newGroupName.trim(), []);
    setGroups(getGroups());
    setNewGroupName('');
    setShowCreateGroup(false);
    addToast({
      type: 'success',
      title: 'Group Created!',
      description: `"${group.name}" has been created. Add members when creating sessions.`,
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getVibeEmoji = (key?: string) => {
    const emojiMap: Record<string, string> = {
      'cozy-creative': '🎨',
      'chill-social': '☕',
      'lowkey-game': '🎮',
      'mini-adventure': '🗺️',
      'talk-taste': '🍷',
      'music-mingle': '🎵',
    };
    return emojiMap[key || ''] || '✨';
  };

  // Host swiping flow (after creating session)
  if (isHostSwiping && hostSessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <ToastContainer />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-8 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 drop-shadow-lg">
              Let's find your vibe first! 🎯
            </h1>
            <p className="text-gray-700 text-lg font-medium">
              Swipe through cards to discover your preferences, then invite friends to join you
            </p>
          </div>

          <VibeDeck
            variant="session"
            onComplete={handleHostSwipeComplete}
            className="max-w-md mx-auto"
          />
        </div>
      </div>
    );
  }

  // Solo swiping (exploratory)
  if (isSwiping) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <ToastContainer />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-8 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 drop-shadow-lg">
              Find Your Vibe
            </h1>
            <p className="text-gray-700 text-lg font-medium">
              Swipe through cards to discover what resonates with you
            </p>
          </div>

          <VibeDeck
            variant="solo"
            onComplete={handleComplete}
            className="max-w-md mx-auto"
          />
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        <ToastContainer />
        <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
          <div className="text-center mb-8 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 drop-shadow-lg">
              Your Vibe Profile
            </h1>
            <p className="text-gray-700 text-lg font-medium">
              Here's what we learned about your preferences
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Your Top Vibes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.topVibes.map((vibeId, index) => (
                    <div
                      key={vibeId}
                      className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/80 transition-all shadow-lg shadow-indigo-500/10"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="bg-indigo-500/80 backdrop-blur-sm text-white">{index + 1}</Badge>
                        <span className="font-medium text-gray-900">{vibeId}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-400/30 bg-green-100/80 backdrop-blur-sm"
                      >
                        Selected
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-gray-900">All Your Swipes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(results.rawSwipes).map(([vibeId, score]) => (
                    <div
                      key={vibeId}
                      className={`p-3 rounded-xl text-sm text-center backdrop-blur-md border transition-all ${
                        score > 0
                          ? 'bg-green-500/80 text-white border-green-400/30 shadow-lg shadow-green-500/20'
                          : 'bg-red-500/80 text-white border-red-400/30 shadow-lg shadow-red-500/20'
                      }`}
                    >
                      {vibeId}: {score > 0 ? '✓' : '✗'}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button onClick={handleReset} className="bg-white/80 backdrop-blur-xl border border-white/30 hover:bg-white/90 shadow-lg shadow-indigo-500/20 text-gray-900 font-semibold">
                Try Again
              </Button>
              <Button onClick={() => handleCreateGroupSession()} className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/30">
                Create Group Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <ToastContainer />
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Welcome to Vibe Deck
          </h1>
          <p className="text-white/90 text-lg font-medium">
            Swipe your way to the perfect plan with friends
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => handleCreateGroupSession()}
            className="h-24 text-lg flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/20 hover:bg-white/90 hover:shadow-indigo-500/30 transition-all"
            size="lg"
          >
            <Plus className="h-6 w-6 text-indigo-400" />
            <span className="text-gray-900 font-semibold">Create Session</span>
          </Button>
          <Button
            onClick={handleStartSolo}
            className="h-24 text-lg flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-blue-500/20 hover:bg-white/90 hover:shadow-blue-500/30 transition-all"
            size="lg"
          >
            <Sparkles className="h-6 w-6 text-blue-400" />
            <span className="text-gray-900 font-semibold">Try Solo</span>
          </Button>
        </div>

        {/* Your Groups */}
        <Card className="mb-8 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="h-5 w-5 text-indigo-400" />
                Your Groups
              </CardTitle>
              {groups.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Group
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No groups yet. Create one to save your favorite planning groups!
                </p>
                <Button onClick={() => setShowCreateGroup(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <>
                {showCreateGroup && (
                  <div className="mb-4 p-4 bg-white/60 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-indigo-500/10">
                    <input
                      type="text"
                      placeholder="Group name (e.g., Friday Night Crew)"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl mb-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCreateGroup} size="sm">
                        Create
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCreateGroup(false);
                          setNewGroupName('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <Card
                      key={group.id}
                      className="hover:shadow-xl hover:shadow-indigo-500/20 transition-all cursor-pointer bg-white/80 backdrop-blur-xl border border-white/30 shadow-lg shadow-indigo-500/10 rounded-xl hover:scale-[1.02]"
                      onClick={() => handleCreateGroupSession(group.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          <AvatarGroup
                            names={group.participants.length > 0 ? group.participants : ['You']}
                            max={3}
                            size="sm"
                          />
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {group.participants.length || 1} member
                              {group.participants.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {group.sessionCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{group.sessionCount} session{group.sessionCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {group.typicalVibe && (
                            <div className="flex items-center gap-1">
                              <span>{getVibeEmoji(group.typicalVibe)}</span>
                              <span className="capitalize">
                                {group.typicalVibe.replace('-', ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          className="w-full mt-3 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/30"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateGroupSession(group.id);
                          }}
                        >
                          Create Session
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {!showCreateGroup && (
                    <Card
                      className="border-dashed border-2 border-white/40 hover:border-white/60 transition-all cursor-pointer bg-white/50 backdrop-blur-xl hover:bg-white/60 rounded-xl"
                      onClick={() => setShowCreateGroup(true)}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                        <Plus className="h-8 w-8 text-white/70 mb-2" />
                        <p className="text-sm text-white/80 font-medium">Add Group</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        {sessionHistory.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5 text-indigo-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessionHistory.slice(0, 5).map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md rounded-xl hover:bg-white/80 transition-all cursor-pointer border border-white/20 hover:border-white/40 hover:shadow-lg shadow-indigo-500/10"
                    onClick={() => router.push(`/sync/${session.sessionId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getVibeEmoji(session.matchKey)}
                      </span>
                      <div>
                        <div className="font-medium">{session.name}</div>
                        <div className="text-sm text-gray-600">
                          {session.participantCount} participant
                          {session.participantCount !== 1 ? 's' : ''} •{' '}
                          {formatTimeAgo(session.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.confidence && (
                        <Badge variant="secondary">
                          {Math.round(session.confidence * 100)}% match
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Tips */}
        {sessionHistory.length === 0 && groups.length === 0 && (
          <Card className="mt-8 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Quick Tips
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Create groups to save your favorite planning teams</li>
                    <li>• Your session history will appear here for quick access</li>
                    <li>• Swipe solo to discover your vibe preferences</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
