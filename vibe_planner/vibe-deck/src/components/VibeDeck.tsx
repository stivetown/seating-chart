'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type {
  Vibe,
  VibeDeckProps,
  VibeSwipe,
  VibeDeckComplete,
} from '@/types/vibes';
import { trackDeckCompleted } from '@/lib/analytics';

const CARD_OFFSET = 10;
const SWIPE_THRESHOLD = 50;
const ROTATION_RANGE = 15;

interface VibeCardProps {
  vibe: Vibe;
  index: number;
  total: number;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
}

function VibeCard({ vibe, index, total, onSwipe, isTop }: VibeCardProps) {
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(
    null
  );

  const getEnergyGradient = (tags: string[]) => {
    const energyTag = tags.find((tag) => tag.startsWith('energy:'));
    const energy = energyTag?.split(':')[1] || 'medium';

    switch (energy) {
      case 'low':
        return 'from-purple-50 to-pink-50';
      case 'high':
        return 'from-orange-50 to-red-50';
      default:
        return 'from-blue-50 to-indigo-50';
    }
  };

  const getCategoryColor = (tags: string[]) => {
    const categoryTag = tags.find((tag) => tag.startsWith('category:'));
    const category = categoryTag?.split(':')[1] || 'general';

    switch (category) {
      case 'creative':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'gaming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cultural':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    const threshold = 20;
    if (info.offset.x > threshold) {
      setDragDirection('right');
    } else if (info.offset.x < -threshold) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setDragDirection(null);

    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  const rotation =
    dragDirection === 'left'
      ? -ROTATION_RANGE
      : dragDirection === 'right'
        ? ROTATION_RANGE
        : 0;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        zIndex: total - index,
        y: index * CARD_OFFSET,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{
        x: 0,
        y: index * CARD_OFFSET,
        rotate: rotation,
        scale: isTop ? 1 : 0.95 - index * 0.02,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      <Card className="h-full w-full cursor-grab active:cursor-grabbing bg-white/80 backdrop-blur-xl border border-white/30 shadow-2xl shadow-purple-500/20 rounded-2xl">
        <CardContent className="h-full p-6">
          <div
            className={`h-full rounded-xl bg-gradient-to-br ${getEnergyGradient(vibe.tags)} p-6 flex flex-col justify-between backdrop-blur-sm`}
          >
            {/* Header */}
            <div className="text-center">
              <div className="text-6xl mb-4">{vibe.emoji}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {vibe.title}
              </h3>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 justify-center">
              {vibe.tags.slice(0, 3).map((tag, tagIndex) => {
                const [key, value] = tag.split(':');
                return (
                  <Badge
                    key={tagIndex}
                    variant="secondary"
                    className={`text-xs ${getCategoryColor(vibe.tags)}`}
                  >
                    {key}: {value}
                  </Badge>
                );
              })}
            </div>

            {/* Swipe indicators */}
            {isTop && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-red-500/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 border border-red-400/30"
                  animate={{
                    opacity: dragDirection === 'left' ? 1 : 0,
                    scale: dragDirection === 'left' ? 1 : 0.8,
                  }}
                >
                  PASS
                </motion.div>
                <motion.div
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 border border-green-400/30"
                  animate={{
                    opacity: dragDirection === 'right' ? 1 : 0,
                    scale: dragDirection === 'right' ? 1 : 0.8,
                  }}
                >
                  KEEP
                </motion.div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function VibeDeck({
  variant,
  onComplete,
  className = '',
}: VibeDeckProps) {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipes, setSwipes] = useState<VibeSwipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vibes on mount
  useEffect(() => {
    const fetchVibes = async () => {
      try {
        const response = await fetch('/api/vibes');
        if (!response.ok) {
          throw new Error('Failed to fetch vibes');
        }
        const data = await response.json();
        const vibesList = data.vibes || [];
        
        // Shuffle vibes to ensure different order each time
        const shuffled = [...vibesList].sort(() => Math.random() - 0.5);
        setVibes(shuffled);
      } catch (err) {
        console.error('Error fetching vibes:', err);
        setError('Failed to load vibes');
        // Fallback to static vibes
        setVibes([
          {
            id: 'cozy-creative',
            title: 'Cozy Creative',
            emoji: '🎨',
            tags: ['energy:low', 'setting:home', 'category:creative'],
          },
          {
            id: 'chill-social',
            title: 'Chill Social',
            emoji: '☕',
            tags: ['energy:medium', 'setting:home', 'category:social'],
          },
          {
            id: 'lowkey-game',
            title: 'Lowkey Game',
            emoji: '🎮',
            tags: ['energy:low', 'setting:home', 'category:gaming'],
          },
          {
            id: 'mini-adventure',
            title: 'Mini Adventure',
            emoji: '🗺️',
            tags: ['energy:high', 'setting:outdoor', 'category:adventure'],
          },
          {
            id: 'talk-taste',
            title: 'Talk & Taste',
            emoji: '🍷',
            tags: ['energy:medium', 'setting:outdoor', 'category:social'],
          },
          {
            id: 'music-mingle',
            title: 'Music Mingle',
            emoji: '🎵',
            tags: ['energy:high', 'setting:outdoor', 'category:social'],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVibes();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (currentIndex >= vibes.length) return;

      if (event.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (event.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, vibes.length]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (currentIndex >= vibes.length) return;

      const vibe = vibes[currentIndex];
      const newSwipe: VibeSwipe = {
        vibeId: vibe.id,
        action: direction === 'right' ? 'like' : 'dislike',
        timestamp: Date.now(),
      };

      setSwipes((prev) => [...prev, newSwipe]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, vibes]
  );

  const resetDeck = () => {
    setCurrentIndex(0);
    setSwipes([]);
  };

  // Compute results when deck is complete
  useEffect(() => {
    if (currentIndex >= vibes.length && vibes.length > 0) {
      const rawSwipes: Record<string, number> = {};
      swipes.forEach((swipe) => {
        rawSwipes[swipe.vibeId] = swipe.action === 'like' ? 1 : -1;
      });

      // Get top 3 liked vibes
      const likedVibes = swipes
        .filter((swipe) => swipe.action === 'like')
        .map((swipe) => swipe.vibeId)
        .slice(0, 3);

      let topVibes = likedVibes;

      // If we don't have enough liked vibes, infer from tags
      if (topVibes.length < 3) {
        const likedVibeTags = likedVibes.flatMap((vibeId) => {
          const vibe = vibes.find((v) => v.id === vibeId);
          return vibe?.tags || [];
        });

        // Find most common tags
        const tagCounts: Record<string, number> = {};
        likedVibeTags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        // Sort by frequency and get top tags
        const topTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([tag]) => tag);

        // Find vibes that match these tags
        const inferredVibes = vibes
          .filter((vibe) => !likedVibes.includes(vibe.id))
          .filter((vibe) => vibe.tags.some((tag) => topTags.includes(tag)))
          .slice(0, 3 - topVibes.length)
          .map((vibe) => vibe.id);

        topVibes = [...likedVibes, ...inferredVibes];
      }

      // Track deck completion on client side
      const acceptedCount = Object.values(rawSwipes).filter(
        (swipe) => swipe > 0
      ).length;
      const rejectedCount = Object.values(rawSwipes).filter(
        (swipe) => swipe < 0
      ).length;

      console.log('[VibeDeck] Deck completed:', {
        likedVibes,
        inferredVibes: topVibes.length > likedVibes.length ? topVibes.slice(likedVibes.length) : [],
        topVibes,
        acceptedCount,
        rejectedCount,
        totalSwipes: Object.keys(rawSwipes).length,
      });

      trackDeckCompleted({
        topVibes,
        totalSwipes: Object.keys(rawSwipes).length,
        acceptedCount,
        rejectedCount,
      });

      onComplete({ rawSwipes, topVibes });
    }
  }, [currentIndex, vibes, swipes, onComplete]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vibes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (vibes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600">No vibes available</p>
        </div>
      </div>
    );
  }

  const isComplete = currentIndex >= vibes.length;
  const remainingCards = Math.max(0, vibes.length - currentIndex);

  return (
    <div className={`relative ${className}`}>
      {/* Progress dots */}
      <div className="flex justify-center mb-6 space-x-2">
        {vibes.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < currentIndex
                ? 'bg-green-500'
                : index === currentIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Deck container */}
      <div className="relative h-96 w-80 mx-auto">
        <AnimatePresence>
          {vibes.slice(currentIndex, currentIndex + 6).map((vibe, index) => (
            <VibeCard
              key={`${vibe.id}-${currentIndex + index}`}
              vibe={vibe}
              index={index}
              total={Math.min(6, remainingCards)}
              onSwipe={handleSwipe}
              isTop={index === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleSwipe('left')}
          disabled={isComplete}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Pass</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={resetDeck}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleSwipe('right')}
          disabled={isComplete}
          className="flex items-center space-x-2"
        >
          <span>Keep</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-center mt-4 text-sm text-gray-600">
        {isComplete ? (
          <p className="text-green-600 font-medium">
            Deck complete! Processing your preferences...
          </p>
        ) : (
          <p>
            {variant === 'solo'
              ? 'Swipe or use arrow keys'
              : 'Swipe to help find your group vibe'}
          </p>
        )}
      </div>
    </div>
  );
}
