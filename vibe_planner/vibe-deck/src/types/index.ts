// Core types for Vibe Deck application

export interface User {
  id: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  token: string;
  createdBy: string;
  participants: User[];
  status: 'waiting' | 'active' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface SwipeOption {
  id: string;
  title: string;
  description: string;
  category: 'activity' | 'location' | 'time' | 'food' | 'entertainment';
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export interface SwipeAction {
  id: string;
  userId: string;
  sessionId: string;
  optionId: string;
  action: 'like' | 'dislike' | 'super_like';
  timestamp: Date;
}

export interface Plan {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  activities: SwipeOption[];
  location: SwipeOption;
  time: SwipeOption;
  createdAt: Date;
  sharedAt?: Date;
}

export interface SyncStatus {
  sessionId: string;
  totalParticipants: number;
  completedParticipants: number;
  progress: number;
  isComplete: boolean;
  results?: Plan;
}
