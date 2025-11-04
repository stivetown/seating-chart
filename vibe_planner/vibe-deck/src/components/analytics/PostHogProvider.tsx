'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

interface PostHogProviderProps {
  children: React.ReactNode;
}

/**
 * PostHog provider component that initializes analytics on the client side
 */
export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Initialize PostHog when the component mounts
    initAnalytics();
  }, []);

  return <>{children}</>;
}
