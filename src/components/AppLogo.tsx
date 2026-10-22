import React from 'react';

export const AppLogo: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="logo-card" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* Background with rounded squircle */}
      <rect width="512" height="512" rx="128" fill="url(#logo-bg)" />
      
      {/* Subtle border highlight */}
      <rect x="6" y="6" width="500" height="500" rx="122" stroke="url(#logo-accent)" strokeWidth="4" strokeOpacity="0.3" />

      {/* Inner Clipboard Base Plate */}
      <rect x="116" y="128" width="280" height="288" rx="28" fill="url(#logo-card)" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2" />

      {/* Clipboard Top Clip */}
      <rect x="206" y="104" width="100" height="40" rx="12" fill="#3b82f6" />
      <circle cx="256" cy="124" r="8" fill="#ffffff" />

      {/* Code / Key Lines on Board */}
      <rect x="156" y="184" width="120" height="12" rx="6" fill="#38bdf8" />
      <rect x="156" y="214" width="200" height="10" rx="5" fill="#94a3b8" fillOpacity="0.6" />
      <rect x="156" y="238" width="160" height="10" rx="5" fill="#94a3b8" fillOpacity="0.4" />

      {/* Dynamic Sync Badge / Arrow Circle */}
      <g transform="translate(300, 290)">
        <circle cx="50" cy="50" r="50" fill="url(#logo-accent)" />
        {/* Sync double arrows */}
        <path d="M 40 32 A 18 18 0 0 1 66 42 L 72 36 L 72 54 L 54 54 L 60 48 A 12 12 0 0 0 40 38 Z" fill="#ffffff" />
        <path d="M 60 68 A 18 18 0 0 1 34 58 L 28 64 L 28 46 L 46 46 L 40 52 A 12 12 0 0 0 60 62 Z" fill="#ffffff" />
      </g>
    </svg>
  );
};
