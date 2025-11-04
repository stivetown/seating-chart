'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  supabase,
  subscribeToSession,
  getSessionByToken,
  isSessionActive,
} from '@/lib/supabase';
import type { Session, SessionEvent } from '@/types/db';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  joinSession: (token: string) => Promise<boolean>;
  leaveSession: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinSession = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionData = await getSessionByToken(token);

      if (!sessionData) {
        setError('Session not found or expired');
        return false;
      }

      if (!isSessionActive(sessionData)) {
        setError('Session is not active');
        return false;
      }

      setSession(sessionData);
      return true;
    } catch (err) {
      setError('Failed to join session');
      console.error('Join session error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveSession = () => {
    setSession(null);
    setError(null);
  };

  // Subscribe to session events when session is active
  useEffect(() => {
    if (!session) return;

    const unsubscribe = subscribeToSession(
      session.id,
      (event: SessionEvent) => {
        console.log('Session event received:', event);

        switch (event.type) {
          case 'participant_joined':
            // Handle participant joined
            break;
          case 'participant_left':
            // Handle participant left
            break;
          case 'swipe_update':
            // Handle swipe update
            break;
          case 'session_complete':
            // Handle session completion
            break;
          case 'match_generated':
            // Handle match generation
            break;
          default:
            console.warn('Unknown session event type:', event.type);
        }
      }
    );

    return unsubscribe;
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        error,
        joinSession,
        leaveSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
