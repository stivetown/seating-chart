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

// Deep Twilight color palette with gradients
const gradientPairs = [
  { from: '#6366f1', to: '#8b5cf6' }, // Indigo to Purple
  { from: '#8b5cf6', to: '#a855f7' }, // Purple to Purple
  { from: '#6366f1', to: '#3b82f6' }, // Indigo to Blue
  { from: '#3b82f6', to: '#2563eb' }, // Blue to Blue
  { from: '#8b5cf6', to: '#6366f1' }, // Purple to Indigo
  { from: '#a855f7', to: '#8b5cf6' }, // Purple to Purple
  { from: '#6366f1', to: '#4f46e5' }, // Indigo to Indigo
  { from: '#3b82f6', to: '#6366f1' }, // Blue to Indigo
  { from: '#7c3aed', to: '#8b5cf6' }, // Purple to Purple
  { from: '#4f46e5', to: '#3b82f6' }, // Indigo to Blue
  { from: '#2563eb', to: '#1d4ed8' }, // Blue to Blue
  { from: '#a855f7', to: '#9333ea' }, // Purple to Purple
  { from: '#6366f1', to: '#818cf8' }, // Indigo to Indigo
  { from: '#3b82f6', to: '#60a5fa' }, // Blue to Blue
  { from: '#8b5cf6', to: '#a78bfa' }, // Purple to Purple
  { from: '#4f46e5', to: '#6366f1' }, // Indigo to Indigo
];

// Pattern variations for visual uniqueness
const patterns = [
  'diagonal', // Diagonal lines
  'dots', // Dot pattern
  'rings', // Concentric rings
  'none', // No pattern
];

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const { initials, gradient, pattern, rotation } = useMemo(() => {
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

    // Generate consistent values based on name hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const gradientIndex = Math.abs(hash) % gradientPairs.length;
    const gradient = gradientPairs[gradientIndex];
    
    const patternIndex = Math.abs(hash >> 8) % patterns.length;
    const pattern = patterns[patternIndex];
    
    // Slight rotation for visual variety (-5 to +5 degrees)
    const rotation = (Math.abs(hash >> 16) % 11) - 5;

    return { initials, gradient, pattern, rotation };
  }, [name]);

  // Pattern overlay SVG
  const patternOverlay = useMemo(() => {
    if (pattern === 'none') return null;
    
    const patternId = `pattern-${name.replace(/\s+/g, '-')}-${size}`;
    
    if (pattern === 'diagonal') {
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10" style={{ transform: `rotate(${rotation}deg)` }}>
          <defs>
            <pattern id={patternId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="8" y2="8" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      );
    }
    
    if (pattern === 'dots') {
      return (
        <svg className="absolute inset-0 w-full h-full opacity-15">
          <defs>
            <pattern id={patternId} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      );
    }
    
    if (pattern === 'rings') {
      return (
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <circle cx="50%" cy="50%" r="40%" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="60%" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      );
    }
    
    return null;
  }, [name, size, pattern, rotation]);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      }}
      title={name}
    >
      {patternOverlay}
      <span className="relative z-10 drop-shadow-sm">{initials}</span>
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
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white bg-gradient-to-br from-indigo-600 to-blue-800`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
