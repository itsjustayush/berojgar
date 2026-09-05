import React from 'react';

interface BerozgarLogoProps {
  variant?: 'icon' | 'horizontal' | 'compact' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const BerozgarLogoIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 40,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Berozgar Chat Logo"
    >
      {/* Speech Bubble Base */}
      <path
        d="M 50 8 
           C 73 8, 92 25, 92 47 
           C 92 69, 73 86, 50 86 
           C 42 86, 35 84, 28 80 
           L 12 92 
           C 15 84, 15 76, 13 72 
           C 9 65, 8 56, 8 47 
           C 8 25, 27 8, 50 8 Z"
        fill="#EF4E22"
      />

      {/* Bench (horizontal plank + 3 vertical legs) */}
      <rect x="22" y="64" width="56" height="3" rx="1.5" fill="#FFF9F3" />
      <rect x="25" y="67" width="2.5" height="12" rx="1" fill="#FFF9F3" />
      <rect x="49" y="67" width="2" height="12" rx="1" fill="#FFF9F3" opacity="0.85" />
      <rect x="72.5" y="67" width="2.5" height="12" rx="1" fill="#FFF9F3" />

      {/* Left Person */}
      {/* Head */}
      <circle cx="34" cy="27" r="5.5" stroke="#FFF9F3" strokeWidth="2.5" fill="none" />
      {/* Hair swoop */}
      <path d="M 30 24 C 32 21, 37 21, 39 24" stroke="#FFF9F3" strokeWidth="2" strokeLinecap="round" />
      {/* Smile & Eye */}
      <circle cx="36" cy="26.5" r="0.75" fill="#FFF9F3" />
      <path d="M 35 29 C 36 30, 38 29.5, 38.5 28.5" stroke="#FFF9F3" strokeWidth="1.2" strokeLinecap="round" />

      {/* Left Torso */}
      <path
        d="M 34 33.5 
           L 34 49 
           L 29 49 
           C 27.5 49, 27 46, 27 42 
           L 27 37 
           C 27 34, 30 33.5, 34 33.5 Z"
        stroke="#FFF9F3"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Left Arms holding cup */}
      <path
        d="M 34 38 L 41 42 L 41 47"
        stroke="#FFF9F3"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Cup */}
      <rect x="40" y="44" width="4.5" height="5.5" rx="1" fill="#FFF9F3" />
      {/* Steam from left cup */}
      <path d="M 41.5 41 C 41 39, 42.5 38, 42 36" stroke="#FFF9F3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 43.5 41 C 43 39, 44.5 38, 44 36" stroke="#FFF9F3" strokeWidth="1.2" strokeLinecap="round" />

      {/* Left Legs seated */}
      <path
        d="M 30 49 L 30 64 L 38 64 L 39 74 L 35 74"
        stroke="#FFF9F3"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Right Person */}
      {/* Head */}
      <circle cx="66" cy="27" r="5.5" stroke="#FFF9F3" strokeWidth="2.5" fill="none" />
      {/* Hair swoop */}
      <path d="M 62 24 C 64 21, 69 21, 71 24" stroke="#FFF9F3" strokeWidth="2" strokeLinecap="round" />
      {/* Smile & Eye */}
      <circle cx="64" cy="26.5" r="0.75" fill="#FFF9F3" />
      <path d="M 65 29 C 64 30, 62 29.5, 61.5 28.5" stroke="#FFF9F3" strokeWidth="1.2" strokeLinecap="round" />

      {/* Right Torso */}
      <path
        d="M 66 33.5 
           L 66 49 
           L 71 49 
           C 72.5 49, 73 46, 73 42 
           L 73 37 
           C 73 34, 70 33.5, 66 33.5 Z"
        stroke="#FFF9F3"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right Arms holding cup */}
      <path
        d="M 66 38 L 59 42 L 59 47"
        stroke="#FFF9F3"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Cup */}
      <rect x="55.5" y="44" width="4.5" height="5.5" rx="1" fill="#FFF9F3" />
      {/* Steam from right cup */}
      <path d="M 57 41 C 56.5 39, 58 38, 57.5 36" stroke="#FFF9F3" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 59 41 C 58.5 39, 60 38, 59.5 36" stroke="#FFF9F3" strokeWidth="1.2" strokeLinecap="round" />

      {/* Right Legs seated */}
      <path
        d="M 70 49 L 70 64 L 62 64 L 61 74 L 65 74"
        stroke="#FFF9F3"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Mini Chat Bubble in between heads */}
      <rect x="44.5" y="21" width="11" height="8" rx="3.5" fill="#FFF9F3" />
      <path d="M 47 29 L 45 32 L 49 29 Z" fill="#FFF9F3" />
      <circle cx="47.5" cy="25" r="0.9" fill="#EF4E22" />
      <circle cx="50" cy="25" r="0.9" fill="#EF4E22" />
      <circle cx="52.5" cy="25" r="0.9" fill="#EF4E22" />
    </svg>
  );
};

export const BerozgarLogo: React.FC<BerozgarLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = false,
}) => {
  const pixelSizes = {
    xs: 26,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const iconPx = pixelSizes[size];

  if (variant === 'icon') {
    return <BerozgarLogoIcon size={iconPx} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <BerozgarLogoIcon size={iconPx} />
        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-tight text-[#EF4E22] text-base" style={{ fontFamily: 'Mukta, Rozha One, sans-serif' }}>
            बेरोजगार
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#FFF9F3]/70">
            Berojgar • Chat
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <BerozgarLogoIcon size={iconPx} />
      <div className="flex flex-col justify-center select-none">
        <div className="flex items-baseline gap-2">
          {/* Main Hindi Name */}
          <span
            className="font-extrabold text-[#EF4E22] leading-none"
            style={{
              fontFamily: 'Rozha One, Mukta, sans-serif',
              fontSize: size === 'xl' ? '2.1rem' : size === 'lg' ? '1.75rem' : size === 'md' ? '1.4rem' : '1.15rem',
              letterSpacing: '0.02em',
            }}
          >
            बेरोजगार
          </span>
          {/* Sub Hindi 'चैट एप' */}
          <span
            className="font-bold text-[#FFF9F3]/80 leading-none"
            style={{
              fontFamily: 'Mukta, sans-serif',
              fontSize: size === 'xl' ? '1.1rem' : size === 'lg' ? '0.95rem' : size === 'md' ? '0.8rem' : '0.7rem',
            }}
          >
            चैट एप
          </span>
        </div>

        {/* English Brand Subtitle */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="italic font-bold tracking-wider text-[#FFF9F3]/90 text-[10px] sm:text-[11px]">
            BEROJGAR <span className="text-[#EF4E22]">•</span> CHAT
          </span>
          {showTagline && (
            <span className="hidden md:inline font-sans text-[10px] text-[#F7F3E8]/60 ml-1 border-l border-white/20 pl-2">
              बस गपशप, बस बिला
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
