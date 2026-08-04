/**
 * Glassmorphism Card - Frosted glass effect with blur
 * Modern UI trend for premium feel
 */

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  intensity = 'medium',
}) => {
  const intensityClasses = {
    light: 'bg-white/10 backdrop-blur-sm border-white/20',
    medium: 'bg-white/20 backdrop-blur-md border-white/30',
    strong: 'bg-white/30 backdrop-blur-lg border-white/40',
  };

  return (
    <div
      className={`rounded-2xl border ${intensityClasses[intensity]} shadow-xl ${className}`}
    >
      {children}
    </div>
  );
};
