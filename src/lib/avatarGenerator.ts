// Self-contained, zero-network-dependency SVG avatar generator
// Guarantees avatars render 100% reliably with no broken image icons

export interface AvatarPreset {
  id: string;
  name: string;
  dataUrl: string;
}

// Generates an inline SVG data URI with customizable color palettes and geometric designs
export function generateSvgAvatar(seed: string, colorIndex = 0): string {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const themes = [
    { primary: '#EF4E22', secondary: '#f3643d', bg: '#1f0d06', glow: 'rgba(239,78,34,0.4)', text: '#FFF9F3' },
    { primary: '#00f0ff', secondary: '#0099ff', bg: '#04121a', glow: 'rgba(0,240,255,0.4)', text: '#000000' },
    { primary: '#c084fc', secondary: '#9333ea', bg: '#13041a', glow: 'rgba(192,132,252,0.4)', text: '#ffffff' },
    { primary: '#fb7185', secondary: '#e11d48', bg: '#1a0409', glow: 'rgba(251,113,133,0.4)', text: '#ffffff' },
    { primary: '#fbbf24', secondary: '#d97706', bg: '#1a1204', glow: 'rgba(251,191,36,0.4)', text: '#000000' },
    { primary: '#34d399', secondary: '#059669', bg: '#041a12', glow: 'rgba(52,211,153,0.4)', text: '#000000' },
  ];

  const t = themes[(hash + colorIndex) % themes.length];
  const char = (seed.charAt(0) || 'B').toUpperCase();

  // Modern cybernetic avatar SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="g_${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${t.primary}" />
          <stop offset="100%" stop-color="${t.secondary}" />
        </linearGradient>
        <radialGradient id="glow_${hash}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${t.primary}" stop-opacity="0.25" />
          <stop offset="100%" stop-color="${t.bg}" stop-opacity="0" />
        </radialGradient>
      </defs>
      
      <!-- Dark container background -->
      <rect width="100" height="100" rx="28" fill="${t.bg}" />
      <circle cx="50" cy="50" r="42" fill="url(#glow_${hash})" />
      <rect x="2" y="2" width="96" height="96" rx="26" fill="none" stroke="${t.primary}" stroke-opacity="0.25" stroke-width="2" />
      
      <!-- Tech Head Frame -->
      <rect x="24" y="24" width="52" height="52" rx="16" fill="#141414" stroke="url(#g_${hash})" stroke-width="2.5" />
      
      <!-- Visor band -->
      <rect x="30" y="38" width="40" height="14" rx="7" fill="url(#g_${hash})" />
      
      <!-- Glowing Eyes inside Visor -->
      <circle cx="42" cy="45" r="3" fill="${t.bg}" />
      <circle cx="58" cy="45" r="3" fill="${t.bg}" />
      
      <!-- Chin / Cyber detail -->
      <line x1="40" y1="62" x2="60" y2="62" stroke="${t.primary}" stroke-width="2" stroke-linecap="round" opacity="0.8" />
      <circle cx="50" cy="69" r="1.5" fill="${t.primary}" />

      <!-- Top antenna/status node -->
      <circle cx="50" cy="18" r="3" fill="${t.primary}" />
      <line x1="50" y1="21" x2="50" y2="24" stroke="${t.primary}" stroke-width="2" />
    </svg>
  `.trim().replace(/\s+/g, ' ');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'atlas', name: 'Atlas (Lime)', dataUrl: generateSvgAvatar('Atlas', 0) },
  { id: 'echo', name: 'Echo (Cyan)', dataUrl: generateSvgAvatar('Echo', 1) },
  { id: 'nova', name: 'Nova (Violet)', dataUrl: generateSvgAvatar('Nova', 2) },
  { id: 'cipher', name: 'Cipher (Rose)', dataUrl: generateSvgAvatar('Cipher', 3) },
  { id: 'solar', name: 'Solar (Amber)', dataUrl: generateSvgAvatar('Solar', 4) },
  { id: 'phantom', name: 'Phantom (Mint)', dataUrl: generateSvgAvatar('Phantom', 5) },
];
