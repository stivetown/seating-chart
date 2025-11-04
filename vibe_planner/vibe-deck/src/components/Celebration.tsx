'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationProps {
  trigger?: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export function Celebration({ trigger = true, intensity = 'medium' }: CelebrationProps) {
  useEffect(() => {
    if (!trigger) return;

    const duration = 2000;
    const end = Date.now() + duration;

    const config = {
      particleCount: intensity === 'low' ? 50 : intensity === 'high' ? 200 : 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    };

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        ...config,
        angle: 60,
        origin: { x: 0, y: 0.6 },
      });
      confetti({
        ...config,
        angle: 120,
        origin: { x: 1, y: 0.6 },
      });
    }, 200);

    // Cleanup after duration
    setTimeout(() => {
      clearInterval(interval);
    }, duration);

    return () => {
      clearInterval(interval);
    };
  }, [trigger, intensity]);

  return null;
}

