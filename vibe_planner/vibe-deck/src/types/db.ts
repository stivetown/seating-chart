// Database row types for Supabase tables
// These match the exact structure of our database tables

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          host_user_id: string | null;
          invite_token: string;
          status: 'active' | 'matched' | 'expired';
          location_lat: number | null;
          location_lng: number | null;
          group_size_hint: number | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          host_user_id?: string | null;
          invite_token: string;
          status?: 'active' | 'matched' | 'expired';
          location_lat?: number | null;
          location_lng?: number | null;
          group_size_hint?: number | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          host_user_id?: string | null;
          invite_token?: string;
          status?: 'active' | 'matched' | 'expired';
          location_lat?: number | null;
          location_lng?: number | null;
          group_size_hint?: number | null;
          created_at?: string;
          expires_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          session_id: string;
          display_name: string | null;
          device_fingerprint: string | null;
          is_host: boolean;
          state: 'joined' | 'swiping' | 'completed';
          top_vibes: any | null; // JSONB
          raw_swipes: any | null; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          display_name?: string | null;
          device_fingerprint?: string | null;
          is_host?: boolean;
          state?: 'joined' | 'swiping' | 'completed';
          top_vibes?: any | null;
          raw_swipes?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          display_name?: string | null;
          device_fingerprint?: string | null;
          is_host?: boolean;
          state?: 'joined' | 'swiping' | 'completed';
          top_vibes?: any | null;
          raw_swipes?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vibes: {
        Row: {
          id: string;
          title: string;
          emoji: string;
          tags: any; // JSONB array
        };
        Insert: {
          id: string;
          title: string;
          emoji: string;
          tags: any;
        };
        Update: {
          id?: string;
          title?: string;
          emoji?: string;
          tags?: any;
        };
      };
      recommendations: {
        Row: {
          id: string;
          vibe_combo_key: string;
          items: any; // JSONB array
        };
        Insert: {
          id?: string;
          vibe_combo_key: string;
          items: any;
        };
        Update: {
          id?: string;
          vibe_combo_key?: string;
          items?: any;
        };
      };
      matches: {
        Row: {
          id: string;
          session_id: string;
          group_vibe: any; // JSONB object
          suggestions: any; // JSONB array
          computed_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          group_vibe: any;
          suggestions: any;
          computed_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          group_vibe?: any;
          suggestions?: any;
          computed_at?: string;
        };
      };
    };
  };
}

// Convenience types for commonly used data
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Participant = Database['public']['Tables']['participants']['Row'];
export type Vibe = Database['public']['Tables']['vibes']['Row'];
export type Recommendation =
  Database['public']['Tables']['recommendations']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];

// Insert types
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type ParticipantInsert =
  Database['public']['Tables']['participants']['Insert'];
export type VibeInsert = Database['public']['Tables']['vibes']['Insert'];
export type RecommendationInsert =
  Database['public']['Tables']['recommendations']['Insert'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];

// Update types
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
export type ParticipantUpdate =
  Database['public']['Tables']['participants']['Update'];
export type VibeUpdate = Database['public']['Tables']['vibes']['Update'];
export type RecommendationUpdate =
  Database['public']['Tables']['recommendations']['Update'];
export type MatchUpdate = Database['public']['Tables']['matches']['Update'];

// Realtime event types
export type SessionEvent =
  | { type: 'participant_joined'; participantId: string; displayName?: string }
  | {
      type: 'participant_updated';
      participantId: string;
      state: string;
      topVibes?: string[];
    }
  | {
      type: 'provisional_match';
      groupVibe: { key: string; confidence: number };
      sampleSuggestion?: any;
    }
  | {
      type: 'final_match';
      groupVibe: { key: string; confidence: number };
      suggestions: any[];
    }
  | { type: 'participant_left'; participantId: string }
  | {
      type: 'swipe_update';
      participantId: string;
      rawSwipes: Record<string, number>;
    }
  | { type: 'session_complete'; sessionId: string }
  | {
      type: 'match_generated';
      matchId: string;
      groupVibe: any;
      suggestions: any[];
    };

// Broadcast event payload for Supabase Realtime
export interface BroadcastEventPayload {
  type: SessionEvent['type'];
  payload: any;
  timestamp: string;
}

// Extended types with computed fields
export interface SessionWithParticipants extends Session {
  participants: Participant[];
}

export interface ParticipantWithSession extends Participant {
  session: Session;
}
