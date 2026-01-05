
import React, { useMemo } from 'react';
import { EntityType, AnimationState } from '../types';

interface PixelCharacterProps {
  type: EntityType;
  state: AnimationState;
  direction: 'up' | 'down' | 'left' | 'right';
  frame: number;
}

const PixelCharacter: React.FC<PixelCharacterProps> = ({ type, state, direction, frame }) => {
  const getSprites = useMemo(() => {
    const isFather = type === EntityType.FATHER;
    const colors = {
      skin: isFather ? '#e5c1a0' : '#f3e5d8',
      hair: isFather ? '#4b3621' : '#ffd700',
      shirt: isFather ? '#2c3e50' : '#f1c40f',
      pants: isFather ? '#34495e' : '#2980b9',
      eyes: '#000000',
      shadow: 'rgba(0,0,0,0.3)'
    };

    const isWalking = state === AnimationState.WALK || state === AnimationState.RUN;
    const bounce = isWalking ? (frame % 2 === 0 ? 0 : 2) : 0;
    const headTilt = (state === AnimationState.UNNATURAL || state === AnimationState.FALLING) ? (Math.sin(Date.now() / 100) * 10) : 0;

    return (
      <svg viewBox="0 0 16 20" className="w-full h-full pixel-art">
        {state !== AnimationState.FALLING && (
            <ellipse cx="8" cy="18" rx="5" ry="2" fill={colors.shadow} />
        )}
        
        <g style={{ transform: `translateY(${bounce}px)` }}>
          <rect x="5" y="14" width="2" height="4" fill={colors.pants} />
          <rect x="9" y="14" width="2" height="4" fill={colors.pants} />
          <rect x="4" y="8" width="8" height="7" fill={colors.shirt} />
          
          {direction === 'left' ? (
             <rect x="2" y="9" width="2" height="5" fill={colors.shirt} />
          ) : direction === 'right' ? (
             <rect x="12" y="9" width="2" height="5" fill={colors.shirt} />
          ) : (
            <>
              <rect x="3" y="9" width="2" height="5" fill={colors.shirt} />
              <rect x="11" y="9" width="2" height="5" fill={colors.shirt} />
            </>
          )}

          <g style={{ transform: `translateY(${headTilt}px) rotate(${headTilt}deg)`, transformOrigin: '8px 8px' }}>
            <rect x="5" y="2" width="6" height="6" fill={colors.skin} />
            <rect x="5" y="2" width="6" height="2" fill={colors.hair} />
            
            <g className={(state === AnimationState.UNNATURAL || state === AnimationState.FALLING) ? 'animate-pulse' : ''}>
              <rect x="6" y="4" width="1" height="1" fill={(state === AnimationState.UNNATURAL || state === AnimationState.FALLING) ? '#ff0000' : colors.eyes} />
              <rect x="9" y="4" width="1" height="1" fill={(state === AnimationState.UNNATURAL || state === AnimationState.FALLING) ? '#ff0000' : colors.eyes} />
            </g>

            {isFather && (state === AnimationState.SCARED || state === AnimationState.FALLING) && (
              <rect x="5" y="6" width="6" height="1" fill="#c0392b" opacity="0.6" />
            )}
          </g>
        </g>
      </svg>
    );
  }, [type, state, direction, frame]);

  return (
    <div className={`w-24 h-32 flex items-center justify-center transition-all duration-75 ${state === AnimationState.FALLING ? 'animate-spin' : ''}`}>
      {getSprites}
    </div>
  );
};

export default PixelCharacter;
