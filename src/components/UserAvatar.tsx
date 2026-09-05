import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  username?: string;
  photoURL?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  statusPosition?: 'bottom-right' | 'top-right';
}

const SIZE_MAP = {
  xs: {
    container: 'w-6 h-6 min-w-6 min-h-6 text-[10px]',
    status: 'w-1.5 h-1.5',
    rounded: 'rounded-lg',
  },
  sm: {
    container: 'w-8 h-8 min-w-8 min-h-8 text-xs',
    status: 'w-2 h-2',
    rounded: 'rounded-xl',
  },
  md: {
    container: 'w-10 h-10 min-w-10 min-h-10 text-sm',
    status: 'w-2.5 h-2.5',
    rounded: 'rounded-2xl',
  },
  lg: {
    container: 'w-12 h-12 min-w-12 min-h-12 text-base',
    status: 'w-3 h-3',
    rounded: 'rounded-2xl',
  },
  xl: {
    container: 'w-16 h-16 min-w-16 min-h-16 text-xl font-bold',
    status: 'w-3.5 h-3.5',
    rounded: 'rounded-3xl',
  },
  '2xl': {
    container: 'w-20 h-20 min-w-20 min-h-20 text-2xl font-bold',
    status: 'w-4 h-4',
    rounded: 'rounded-3xl',
  },
};

// Deterministic gentle hue for initial background
function getInitialColor(seed: string): { bg: string; text: string; border: string } {
  const charCode = (seed.charCodeAt(0) || 66) + (seed.charCodeAt(seed.length - 1) || 65);
  const palettes = [
    { bg: 'bg-[#261009]', text: 'text-[#EF4E22]', border: 'border-[#EF4E22]/30' },
    { bg: 'bg-[#08171f]', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]/30' },
    { bg: 'bg-[#170a1f]', text: 'text-[#c084fc]', border: 'border-[#c084fc]/30' },
    { bg: 'bg-[#1f0a10]', text: 'text-[#fb7185]', border: 'border-[#fb7185]/30' },
    { bg: 'bg-[#1f1508]', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30' },
    { bg: 'bg-[#091f16]', text: 'text-[#34d399]', border: 'border-[#34d399]/30' },
  ];
  return palettes[charCode % palettes.length];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  username = '',
  photoURL,
  size = 'md',
  className = '',
  showStatus = false,
  isOnline = false,
  statusPosition = 'bottom-right',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const displayName = name.trim() || username.trim() || 'Berozgar';
  const initial = (displayName.charAt(0) || 'B').toUpperCase();
  const conf = SIZE_MAP[size] || SIZE_MAP.md;
  const palette = getInitialColor(username || displayName);

  // Check if valid web URL (and not too long)
  const hasValidImg = Boolean(
    photoURL &&
    !imgFailed &&
    photoURL.length < 500 &&
    (photoURL.startsWith('http://') || photoURL.startsWith('https://'))
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${conf.container} ${conf.rounded} border ${palette.border} ${palette.bg} ${className}`}
      aria-label={`${displayName} avatar`}
    >
      {hasValidImg ? (
        <img
          src={photoURL!}
          alt={displayName}
          onError={() => setImgFailed(true)}
          className={`w-full h-full object-cover ${conf.rounded}`}
        />
      ) : (
        <span className={`font-mono font-bold tracking-wider ${palette.text}`}>
          {initial}
        </span>
      )}

      {showStatus && (
        <span
          className={`absolute ${
            statusPosition === 'bottom-right'
              ? '-bottom-0.5 -right-0.5'
              : '-top-0.5 -right-0.5'
          } ${conf.status} rounded-full border-2 border-[#0b1326] transition-colors ${
            isOnline ? 'bg-[#EF4E22] shadow-[0_0_8px_rgba(239,78,34,0.7)]' : 'bg-neutral-600'
          }`}
          title={isOnline ? 'Active now' : 'Offline'}
        />
      )}
    </div>
  );
};
