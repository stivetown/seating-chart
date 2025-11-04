'use client';

import { useMemo } from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#F4A261', // Orange
  '#E76F51', // Coral
  '#2A9D8F', // Dark Teal
  '#264653', // Dark Blue-Green
];

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const { initials, color } = useMemo(() => {
    // Extract initials (first letter of first two words, or first two letters)
    const words = name.trim().split(/\s+/);
    let initials = '';
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      initials = words[0][0]?.toUpperCase() || '?';
    }

    // Generate consistent color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];

    return { initials, color };
  }, [name]);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  names: string[];
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup({ names, max = 4, size = 'md' }: AvatarGroupProps) {
  const displayNames = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {displayNames.map((name, index) => (
        <Avatar
          key={`${name}-${index}`}
          name={name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white bg-gray-400`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
