export interface Vibe {
  id: string;
  title: string;
  emoji: string;
  tags: string[];
}

export interface VibeSwipe {
  vibeId: string;
  action: 'like' | 'dislike';
  timestamp: number;
}

export interface VibeDeckComplete {
  rawSwipes: Record<string, number>;
  topVibes: string[];
}

export interface VibeDeckProps {
  variant: 'solo' | 'session';
  onComplete: (result: VibeDeckComplete) => void;
  className?: string;
}
