import React from 'react';

interface PixelTreeProps {
  delay?: string;
}

const PixelTree: React.FC<PixelTreeProps> = ({ delay }) => {
  return (
    <svg 
      viewBox="0 0 32 48" 
      className="w-full h-full pixel-art opacity-90 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] animate-sway"
      style={{ animationDelay: delay }}
    >
      {/* Trunk */}
      <rect x="14" y="32" width="4" height="16" fill="#1a1a1a" />
      <rect x="13" y="38" width="1" height="10" fill="#0d0d0d" />
      <rect x="18" y="38" width="1" height="10" fill="#0d0d0d" />
      
      {/* Leaves/Needles Layer 1 (Bottom) */}
      <path d="M4 35 L28 35 L16 18 Z" fill="#0a100a" />
      <path d="M6 32 L26 32 L16 20 Z" fill="#141c14" />
      
      {/* Leaves/Needles Layer 2 (Middle) */}
      <path d="M8 24 L24 24 L16 10 Z" fill="#0a100a" />
      <path d="M10 21 L22 21 L16 12 Z" fill="#141c14" />
      
      {/* Leaves/Needles Layer 3 (Top) */}
      <path d="M11 12 L21 12 L16 2 Z" fill="#0a100a" />
      <path d="M13 10 L19 10 L16 4 Z" fill="#141c14" />
      
      {/* Detail highlights */}
      <rect x="15" y="5" width="2" height="2" fill="#1e2e1e" opacity="0.4" />
      <rect x="12" y="28" width="2" height="2" fill="#1e2e1e" opacity="0.4" />
      <rect x="18" y="22" width="2" height="2" fill="#1e2e1e" opacity="0.4" />
    </svg>
  );
};

export default PixelTree;