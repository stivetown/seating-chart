'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToastContainer, useToast } from '@/components/ui/toast';
import {
  Copy,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  ExternalLink,
  X,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  downloadICS,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateYahooCalendarUrl,
  parseTimeChip,
  type CalendarEvent,
} from '@/lib/calendar';

interface PlanPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

interface Match {
  groupVibe: {
    key: string;
    confidence: number;
  };
  suggestions: Array<{
    title: string;
    desc?: string;
    url?: string;
  }>;
}

interface SessionStatus {
  status: 'active' | 'matched' | 'expired';
  hostName: string;
  participants: Array<{
    name: string | null;
    state: string;
  }>;
  counts: {
    total: number;
    completed: number;
  };
  provisionalMatch?: Match;
}

interface LocationData {
  lat: number;
  lng: number;
  permission: 'granted' | 'denied' | 'prompt';
}

export default function PlanPage({ params }: PlanPageProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingParams, setIsLoadingParams] = useState(true);
  const router = useRouter();
  const { addToast } = useToast();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null
  );
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [nearbyOptions, setNearbyOptions] = useState<
    Array<{
      title: string;
      url: string;
      distance?: string;
    }>
  >([]);
  const [origin, setOrigin] = useState<string>('');
  const [timeChips, setTimeChips] = useState<
    Array<{ label: string; time: string; isActive: boolean }>
  >([]);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number | null>(null);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  // Handle async params
  useEffect(() => {
    params.then((resolvedParams) => {
      if (resolvedParams?.sessionId) {
        setSessionId(resolvedParams.sessionId);
      }
      setIsLoadingParams(false);
    });
  }, [params]);

  // Set origin and time chips on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      
      // Calculate time chips on client side
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekend = new Date(now);
      const daysUntilSaturday = (6 - now.getDay()) % 7;
      weekend.setDate(
        now.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday)
      );

      const chips = [
        {
          label: 'Tonight',
          time: '6:00 PM - 11:00 PM',
          isActive: now.getHours() < 18,
        },
        {
          label: 'Tomorrow',
          time: tomorrow.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }),
          isActive: true,
        },
        {
          label: 'This Weekend',
          time: weekend.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          isActive: true,
        },
      ];

      setTimeChips(chips);
      
      // Auto-select first active chip
      const firstActiveIndex = chips.findIndex(chip => chip.isActive);
      if (firstActiveIndex !== -1) {
        setSelectedTimeIndex(firstActiveIndex);
      }
    }
  }, []);

  // Fetch session status and match data
  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionData = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}/status`);
        if (!response.ok) {
          throw new Error('Failed to fetch session data');
        }

        const data = await response.json();
        setSessionStatus(data);

        // Use final match if available, otherwise provisional
        // The status endpoint returns: { finalMatch?: MatchResult, provisionalMatch?: MatchResult, suggestions?: Array }
        if (data.finalMatch) {
          // finalMatch is a MatchResult with { key, confidence }
          // We need to construct a Match object with groupVibe and suggestions
          setMatch({
            groupVibe: {
              key: data.finalMatch.key,
              confidence: data.finalMatch.confidence,
            },
            suggestions: data.suggestions || [],
          });
        } else if (data.provisionalMatch) {
          setMatch({
            groupVibe: {
              key: data.provisionalMatch.key,
              confidence: data.provisionalMatch.confidence,
            },
            suggestions: data.suggestions || [],
          });
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        addToast({
          type: 'error',
          title: 'Failed to Load Plan',
          description: 'Could not load session data. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, addToast]);

  // Request geolocation permission and generate nearby options
  useEffect(() => {
    const requestLocation = async () => {
      if (!navigator.geolocation) {
        setLocation({ lat: 0, lng: 0, permission: 'denied' });
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            });
          }
        );

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          permission: 'granted',
        });

        // Generate nearby options based on suggestions
        if (match?.suggestions) {
          generateNearbyOptions(
            match.suggestions,
            position.coords.latitude,
            position.coords.longitude
          );
        }
      } catch (error) {
        console.log('Geolocation denied or failed:', error);
        setLocation({ lat: 0, lng: 0, permission: 'denied' });
      }
    };

    if (match) {
      requestLocation();
    }
  }, [match]);

  const generateNearbyOptions = (
    suggestions: Match['suggestions'],
    lat: number,
    lng: number
  ) => {
    const options: Array<{ title: string; url: string; distance?: string }> =
      [];

    suggestions.forEach((suggestion) => {
      // Extract keywords from suggestion title
      const keywords = suggestion.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter((word) => word.length > 3)
        .join('+');

      if (keywords) {
        const mapsUrl = `https://www.google.com/maps/search/${keywords}+near+me/@${lat},${lng},15z`;
        options.push({
          title: `${suggestion.title} near me`,
          url: mapsUrl,
        });
      }
    });

    // Add some generic nearby options
    options.push(
      {
        title: 'Restaurants near me',
        url: `https://www.google.com/maps/search/restaurants+near+me/@${lat},${lng},15z`,
      },
      {
        title: 'Activities near me',
        url: `https://www.google.com/maps/search/activities+near+me/@${lat},${lng},15z`,
      }
    );

    setNearbyOptions(options.slice(0, 4)); // Limit to 4 options
  };

  const handleCopyPlan = async () => {
    if (!match || !sessionStatus) return;

    setIsCopying(true);
    try {
      const participantNames = sessionStatus.participants
        .filter((p) => p.name)
        .map((p) => p.name)
        .join(', ');

      const suggestionsText = match.suggestions
        .map(
          (s, index) =>
            `${index + 1}. ${s.title}${s.desc ? ` - ${s.desc}` : ''}`
        )
        .join('\n');

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const planText = `🎯 Group Plan: ${match.groupVibe.key}

👥 Participants: ${participantNames}
📊 Confidence: ${Math.round(match.groupVibe.confidence * 100)}%

📋 Suggestions:
${suggestionsText}

🔗 View full details: ${baseUrl}/sync/${sessionId}

Generated by Vibe Deck`;

      await navigator.clipboard.writeText(planText);

      addToast({
        type: 'success',
        title: 'Plan Copied!',
        description: 'The plan has been copied to your clipboard.',
      });
    } catch (error) {
      console.error('Error copying plan:', error);
      addToast({
        type: 'error',
        title: 'Copy Failed',
        description: 'Failed to copy plan to clipboard.',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleTimeChipClick = (index: number) => {
    setSelectedTimeIndex(index);
  };

  const createCalendarEvent = (): CalendarEvent | null => {
    if (!match || !sessionStatus) return null;

    // Get selected time or default to first active chip
    const timeIndex = selectedTimeIndex !== null ? selectedTimeIndex : timeChips.findIndex(chip => chip.isActive);
    const selectedChip = timeChips[timeIndex];
    
    if (!selectedChip) return null;

    const parsedTime = parseTimeChip(selectedChip);
    if (!parsedTime) return null;

    const { start, end } = parsedTime;

    // Build event title
    const vibeName = match.groupVibe.key
      .replace('-', ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    // Build description with suggestions
    const suggestionsText = match.suggestions
      .map((s, i) => `${i + 1}. ${s.title}${s.desc ? ` - ${s.desc}` : ''}`)
      .join('\n');
    
    const participantNames = sessionStatus.participants
      .filter((p) => p.name)
      .map((p) => p.name)
      .join(', ');

    const description = `Vibe Deck Match: ${vibeName} (${Math.round(match.groupVibe.confidence * 100)}% match)\n\nParticipants: ${participantNames || 'Group'}\n\nSuggestions:\n${suggestionsText}\n\nView full plan: ${origin}/plan/${sessionId}`;

    return {
      title: `${vibeName} with ${participantNames || 'Friends'}`,
      description,
      start,
      end,
      location: location?.permission === 'granted' 
        ? `${location.lat}, ${location.lng}` 
        : undefined,
      url: `${origin}/plan/${sessionId}`,
    };
  };

  const handleAddToCalendar = (provider: 'google' | 'outlook' | 'yahoo' | 'ics') => {
    const event = createCalendarEvent();
    if (!event) {
      addToast({
        type: 'error',
        title: 'Unable to create calendar event',
        description: 'Please select a time first.',
      });
      return;
    }

    switch (provider) {
      case 'google':
        window.open(generateGoogleCalendarUrl(event), '_blank');
        break;
      case 'outlook':
        window.open(generateOutlookCalendarUrl(event), '_blank');
        break;
      case 'yahoo':
        window.open(generateYahooCalendarUrl(event), '_blank');
        break;
      case 'ics':
        downloadICS(event, `vibe-deck-${match?.groupVibe.key || 'event'}.ics`);
        addToast({
          type: 'success',
          title: 'Calendar file downloaded',
          description: 'Open the .ics file to add it to your calendar.',
        });
        break;
    }

    setShowCalendarMenu(false);
  };

  const handleCloseSession = async () => {
    if (!sessionStatus) return;

    setIsClosing(true);
    try {
      // This would call an API to close the session
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addToast({
        type: 'success',
        title: 'Session Closed',
        description: 'The session has been marked as complete.',
      });

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error closing session:', error);
      addToast({
        type: 'error',
        title: 'Close Failed',
        description: 'Failed to close session. Please try again.',
      });
    } finally {
      setIsClosing(false);
    }
  };


  if (isLoadingParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/20 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-orange-400 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-red-500/20 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Invalid Session
          </h1>
          <p className="text-gray-700 mb-4">Session ID not found</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/30"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/20 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading your perfect plan...</p>
        </div>
      </div>
    );
  }

  if (!sessionStatus || !match || !match.groupVibe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-orange-400 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <ToastContainer />
        <div className="text-center max-w-md mx-auto px-4 relative z-10 bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-red-500/20 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Plan Not Found
          </h1>
          <p className="text-gray-700 mb-6">
            {!match || !match.groupVibe 
              ? 'We couldn\'t find a match for this session. The session may not be ready yet.'
              : 'Match data is incomplete. Please try again.'}
          </p>
          <Button 
            onClick={() => router.push(`/sync/${sessionId}`)}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/30"
          >
            View Session Status
          </Button>
        </div>
      </div>
    );
  }

  const isHost = sessionStatus.participants.some(
    (p) => p.name === sessionStatus.hostName
  );

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
        {/* Header */}
        <div className="text-center mb-8 bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl p-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 drop-shadow-lg">
            Your Perfect Plan
          </h1>
          <div className="flex items-center justify-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{sessionStatus.counts.completed} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{Math.round(match.groupVibe.confidence * 100)}% match</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Time Selection */}
          <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Clock className="h-5 w-5 text-indigo-400" />
                When to Meet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {timeChips.map((chip, index) => (
                  <div
                    key={index}
                    onClick={() => handleTimeChipClick(index)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer backdrop-blur-md ${
                      selectedTimeIndex === index
                        ? 'border-indigo-400/50 bg-indigo-500/80 hover:bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-300/50'
                        : chip.isActive
                          ? 'border-green-400/30 bg-green-500/80 hover:bg-green-500/90 text-white shadow-lg shadow-green-500/20'
                          : 'border-white/30 bg-white/50 opacity-60 text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    <div className={`text-lg font-semibold mb-1 ${
                      selectedTimeIndex === index ? 'text-white' : 'text-gray-900'
                    }`}>
                      {chip.label}
                      {selectedTimeIndex === index && (
                        <CheckCircle className="inline-block h-4 w-4 ml-2" />
                      )}
                    </div>
                    <div className={`text-sm ${
                      selectedTimeIndex === index ? 'text-white/90' : 'text-gray-600'
                    }`}>
                      {chip.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Plan */}
          <Card className="bg-white/80 backdrop-blur-xl border border-green-400/30 shadow-2xl shadow-green-500/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">
                    {match.groupVibe.key === 'cozy-creative'
                      ? '🎨'
                      : match.groupVibe.key === 'chill-social'
                        ? '☕'
                        : match.groupVibe.key === 'lowkey-game'
                          ? '🎮'
                          : match.groupVibe.key === 'mini-adventure'
                            ? '🗺️'
                            : match.groupVibe.key === 'talk-taste'
                              ? '🍷'
                              : match.groupVibe.key === 'music-mingle'
                                ? '🎵'
                                : '✨'}
                  </span>
                  {match.groupVibe.key
                    .replace('-', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <Badge
                  variant="secondary"
                  className="text-green-700 bg-green-100/80 backdrop-blur-sm border border-green-300/30"
                >
                  {Math.round(match.groupVibe.confidence * 100)}% match
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {match.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white/70 backdrop-blur-md rounded-xl p-5 border border-green-300/30 hover:bg-white/90 transition-all shadow-lg shadow-green-500/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {suggestion.title}
                        </h3>
                        {suggestion.desc && (
                          <p className="text-gray-600 mb-3">
                            {suggestion.desc}
                          </p>
                        )}
                        {suggestion.url && (
                          <a
                            href={suggestion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Learn more
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nearby Options (if location available) */}
          {location?.permission === 'granted' && nearbyOptions.length > 0 && (
            <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                  Nearby Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nearbyOptions.map((option, index) => (
                    <a
                      key={index}
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/30 hover:bg-white/80 transition-all hover:shadow-lg shadow-indigo-500/10"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {option.title}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Button
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                disabled={timeChips.length === 0 || (!selectedTimeIndex && !timeChips.some(chip => chip.isActive))}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              
              {showCalendarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowCalendarMenu(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl shadow-indigo-500/20 z-50 overflow-hidden">
                    <button
                      onClick={() => handleAddToCalendar('google')}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50/80 transition-colors flex items-center gap-3 text-gray-900"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        G
                      </div>
                      <span className="font-medium">Google Calendar</span>
                    </button>
                    <button
                      onClick={() => handleAddToCalendar('outlook')}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50/80 transition-colors flex items-center gap-3 text-gray-900 border-t border-white/20"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        O
                      </div>
                      <span className="font-medium">Outlook Calendar</span>
                    </button>
                    <button
                      onClick={() => handleAddToCalendar('yahoo')}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50/80 transition-colors flex items-center gap-3 text-gray-900 border-t border-white/20"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        Y
                      </div>
                      <span className="font-medium">Yahoo Calendar</span>
                    </button>
                    <button
                      onClick={() => handleAddToCalendar('ics')}
                      className="w-full px-4 py-3 text-left hover:bg-indigo-50/80 transition-colors flex items-center gap-3 text-gray-900 border-t border-white/20"
                    >
                      <Calendar className="h-5 w-5 text-indigo-500" />
                      <span className="font-medium">Download .ics file</span>
                      <span className="ml-auto text-xs text-gray-500">(Apple Calendar, etc.)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleCopyPlan}
              disabled={isCopying}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30"
            >
              <Copy className="h-4 w-4 mr-2" />
              {isCopying ? 'Copying...' : 'Copy Plan'}
            </Button>

            <Button
              onClick={() => router.push(`/sync/${sessionId}`)}
              className="flex-1 bg-white/80 backdrop-blur-xl border border-white/30 hover:bg-white/90 shadow-lg shadow-indigo-500/20 text-gray-900 font-semibold"
            >
              View Live Session
            </Button>

            {isHost && (
              <Button
                onClick={handleCloseSession}
                disabled={isClosing}
                className="flex items-center gap-2 bg-red-500/80 backdrop-blur-xl border border-red-400/30 hover:bg-red-500/90 text-white shadow-lg shadow-red-500/30"
              >
                <X className="h-4 w-4" />
                {isClosing ? 'Closing...' : 'Close Session'}
              </Button>
            )}
          </div>

          {/* Session Info */}
          <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl shadow-indigo-500/10 rounded-2xl">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-700">
                <p className="font-medium">Session created by {sessionStatus.hostName}</p>
                <p className="mt-1 text-gray-600">
                  Share this link to invite others:
                  <span className="font-mono text-xs bg-white/80 backdrop-blur-sm px-2 py-1 rounded ml-2 border border-white/30">
                    {origin || '...'}/s/[token]
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
