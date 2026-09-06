import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Conversation,
} from '../types';
import {
  getUserProfileByUsername,
  saveUserProfileCustomization,
  incrementChaiCount,
  DEFAULT_AYUSH_PROFILE,
} from '../lib/socialChatService';
import {
  detectUserGeoLocation,
  getFormattedRealtimeTime,
  formatLocationWithCurrentTime,
  extractPlaceName,
} from '../lib/locationService';

export const AVATAR_PRESETS = [
  {
    name: 'Ayush Original',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJe3nbFkQtKoCqm58K9RWFUmmJDmwlBWkKle2F7gG78lnABk7MgwBG-dT0ouL8iX_khyY95fEomvvG-Mav-viTSqG8xkGPTYmOgehmiBnAexGhUB-7p_AcfOQctOvefLN5YW0533nD1VkTSwDECqOtUD_T2elfvO72IfGYaTdk5sjMUb81TbZPmDKaVEX8CKuwhtEARdIeC0riHD1iFEnL5iYurlWarMCXcEm14KOdmmxtWoAZAXWV',
    vibe: 'Original',
  },
  {
    name: 'Night Coder',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    vibe: 'Dev Mode',
  },
  {
    name: 'Cyber Chai',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    vibe: 'Chai Head',
  },
  {
    name: 'Lofi Chiller',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    vibe: 'Lofi Chill',
  },
  {
    name: '3 AM Owl',
    url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=80',
    vibe: 'Nocturne',
  },
  {
    name: 'Philosopher',
    url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&auto=format&fit=crop&q=80',
    vibe: 'Thinker',
  },
];

interface UserProfilePageProps {
  username: string;
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onJoinTapri: (tapriName: string) => void;
  onStartDirectChat?: (targetUser: UserProfile) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  username,
  currentUser,
  onNavigateHome,
  onJoinTapri,
  onStartDirectChat,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'public' | 'customizer'>('public');

  // Customization & Profile Editing State
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customBio, setCustomBio] = useState('');
  const [customHindiName, setCustomHindiName] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [customTheme, setCustomTheme] = useState<'aurora' | 'sunset' | 'indigo' | 'sage'>('aurora');
  const [customVibeTag, setCustomVibeTag] = useState('Late-night coder');
  const [customStatus, setCustomStatus] = useState('React 19 & Chai');
  const [broadcastLounge, setBroadcastLounge] = useState(true);
  const [saveButtonText, setSaveButtonText] = useState('Save Changes');
  const [isCopied, setIsCopied] = useState(false);

  // Realtime Live Clock & Chai Clinks
  const [chaiCount, setChaiCount] = useState(1280);
  const [isChaiClinked, setIsChaiClinked] = useState(false);
  const [liveTime, setLiveTime] = useState(() => getFormattedRealtimeTime(new Date()));

  // Keep live time ticking accurately every second for the user's timezone
  useEffect(() => {
    const updateLiveClock = () => {
      setLiveTime(getFormattedRealtimeTime(new Date(), profile?.timezone));
    };
    updateLiveClock();
    const timer = setInterval(updateLiveClock, 1000);
    return () => clearInterval(timer);
  }, [profile?.timezone]);

  // Fetch or synthesize profile for username
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getUserProfileByUsername(username).then(async (data) => {
      if (!isMounted) return;
      setProfile(data);
      const initialDisplayName = data.displayName || (username === 'itsjustayush' ? 'Ayush Bhattacharya' : username);
      setCustomDisplayName(initialDisplayName);
      setCustomAvatarUrl(data.photoURL || '');
      setCustomBio(
        data.bio ||
          'Building late-night side-projects & breaking state engines. Chai > Coffee ☕ | Rust, React, and Valorant at 3 AM. If my lounge mic is green, feel free to hop in and talk philosophy or bugs.'
      );
      setCustomHindiName(data.customHindiName || (username === 'itsjustayush' ? 'आयुष' : ''));
      
      // The user's geographic location is strictly fixed for their profile
      const userFixedLocation = extractPlaceName(
        data.customLocation || (data.city && data.countryCode ? `${data.city}, ${data.countryCode}` : 'Delhi, IN'),
        data.timezone
      );
      setCustomLocation(userFixedLocation);

      setCustomTheme(data.customThemeAura || 'aurora');
      setCustomVibeTag(data.customVibeTag || 'Late-night coder');
      setCustomStatus(data.customStatusEmoji || 'React 19 & Chai');
      setBroadcastLounge(data.broadcastCurrentLounge !== false);
      setChaiCount(data.chaiCount || (username === 'itsjustayush' ? 1280 : 18));
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Please choose an image under 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Is this the logged-in user's own profile?
  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  const handleClinkChai = async () => {
    const updatedCount = await incrementChaiCount(username);
    setChaiCount(updatedCount);
    setIsChaiClinked(true);
    setTimeout(() => setIsChaiClinked(false), 800);
  };

  const handleShareProfile = () => {
    const fullUrl = `https://berojgarchat.vercel.app/${username}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${profile?.displayName || username} on Berojgar Chat`,
          text: `Late-night thoughts, quiet rooms, and chai on Berojgar!`,
          url: fullUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCopyUrl = () => {
    const fullUrl = `https://berojgarchat.vercel.app/${username}`;
    navigator.clipboard?.writeText(fullUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDetectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const geo = await detectUserGeoLocation();
      setCustomLocation(geo.locationString);
    } catch {
      setCustomLocation('Delhi, IN');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSaveCustomSpace = async () => {
    const finalDisplayName = customDisplayName.trim() || (username === 'itsjustayush' ? 'Ayush Bhattacharya' : username);
    const fixedLocationToSave = extractPlaceName(customLocation.trim(), profile?.timezone) || 'Delhi, IN';
    const updates: Partial<UserProfile> = {
      displayName: finalDisplayName,
      photoURL: customAvatarUrl.trim(),
      bio: customBio.trim(),
      customHindiName: customHindiName.trim(),
      customLocation: fixedLocationToSave,
      customThemeAura: customTheme,
      customVibeTag: customVibeTag,
      customStatusEmoji: customStatus,
      broadcastCurrentLounge: broadcastLounge,
    };

    await saveUserProfileCustomization(username, updates, currentUser?.uid);
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    setSaveButtonText('Saved to Tapri!');
    setTimeout(() => {
      setSaveButtonText('Save Changes');
    }, 2000);
  };

  const handleResetCustomSpace = () => {
    const defaultName = username === 'itsjustayush' ? 'Ayush Bhattacharya' : username;
    setCustomDisplayName(defaultName);
    setCustomAvatarUrl(DEFAULT_AYUSH_PROFILE.photoURL || '');
    setCustomBio(
      'Building late-night side-projects & breaking state engines. Chai > Coffee ☕ | Rust, React, and Valorant at 3 AM. If my lounge mic is green, feel free to hop in and talk philosophy or bugs.'
    );
    setCustomHindiName(username === 'itsjustayush' ? 'आयुष' : '');
    setCustomLocation('Delhi, IN');
    setCustomTheme('aurora');
    setCustomVibeTag('Late-night coder');
    setCustomStatus('React 19 & Chai');
    setBroadcastLounge(true);
  };

  const getBannerGradient = (theme: 'aurora' | 'sunset' | 'indigo' | 'sage') => {
    switch (theme) {
      case 'sunset':
        return 'from-[#4a1205] via-[#ff5722]/60 to-[#21091a]';
      case 'indigo':
        return 'from-[#0b1340] via-[#1a237e] to-[#04081c]';
      case 'sage':
        return 'from-[#0c2419] via-[#1c3829] to-[#08150f]';
      case 'aurora':
      default:
        return 'from-[#0d2838] via-[#143d42] to-[#2b1b17]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070E18] text-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#ff5722] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-white/50">Fetching @{username}'s Tapri space...</p>
      </div>
    );
  }

  const displayName =
    customDisplayName.trim() ||
    profile?.displayName ||
    (username === 'itsjustayush' ? 'Ayush Bhattacharya' : username);
  const avatarUrl = customAvatarUrl !== '' ? customAvatarUrl : profile?.photoURL;
  const bio =
    customBio ||
    profile?.bio ||
    'Building late-night side-projects & breaking state engines. Chai > Coffee ☕ | Rust, React, and Valorant at 3 AM.';
  const hindiName =
    customHindiName !== ''
      ? customHindiName
      : profile?.customHindiName || (username === 'itsjustayush' ? 'आयुष' : '');
  const locationTag = formatLocationWithCurrentTime(
    customLocation !== '' ? customLocation : profile?.customLocation,
    profile?.timezone,
    liveTime
  );

  return (
    <div className="bg-[#070E18] text-[#d4e4fa] font-sans min-h-screen flex flex-col selection:bg-[#ff5722]/30">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-[#070E18]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        <div className="h-16 w-full max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-[#ff5722] flex items-center justify-center shadow-[0_0_16px_rgba(255,87,34,0.35)]">
                <span className="material-symbols-outlined text-white text-[20px]">
                  local_fire_department
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white group-hover:text-[#ff5722] transition-colors">
                  बेरोजगार चैट
                </span>
                <span className="text-[11px] text-[#64748B] font-mono">
                  Berojgar Chat • Tapri Lounges
                </span>
              </div>
            </button>
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#13233A]/60 ml-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] text-[#CBD5E1] font-mono">3,412 chillers online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onJoinTapri('chai_n_code')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ff5722] hover:bg-[#F4511E] text-white font-semibold text-xs transition-all shadow-[0_4px_16px_rgba(255,87,34,0.3)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
              <span>Join #chai_n_code</span>
            </button>
            <button
              onClick={onNavigateHome}
              className="px-3.5 py-1.5 rounded-full bg-[#1C2D46] hover:bg-[#273647] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Back to Lounges
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-20">
        {/* Top Breadcrumb & URL Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-[#13233A]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-sm">
              <span className="material-symbols-outlined text-[#ffb5a0] text-[18px]">terminal</span>
              <span className="text-[11px] text-[#64748B] font-mono">berojgarchat.vercel.app/</span>
              <span className="text-xs font-semibold text-white tracking-tight font-mono">
                {username}
              </span>
              <button
                onClick={handleCopyUrl}
                className="ml-1 text-[#64748B] hover:text-white transition-colors p-1 rounded-full flex items-center cursor-pointer"
                title="Copy profile address"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isCopied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c2b3c] text-[#ffb5a0] text-xs font-medium shadow-sm">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                verified
              </span>
              <span>Verified Chiller • Day 12</span>
            </div>
          </div>

          {/* Mode Switcher Pill Dock */}
          <div className="flex items-center self-start md:self-auto bg-[#0d1c2d] p-1 rounded-full border border-white/5">
            <button
              onClick={() => setViewMode('public')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'public'
                  ? 'bg-[#ff5722] text-white shadow-[0_2px_12px_rgba(255,87,34,0.35)]'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">visibility</span>
              <span>Public View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('customizer');
                const panel = document.getElementById('customizerPanel');
                panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'customizer'
                  ? 'bg-[#ff5722] text-white shadow-[0_2px_12px_rgba(255,87,34,0.35)] ring-1 ring-[#ff5722]/50'
                  : 'text-[#CBD5E1] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">edit_note</span>
              <span>Customize & Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Profile Canvas, Wall of Chai, Lounges */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {/* Hero Profile Container */}
            <div
              id="profileHeroCard"
              className="relative overflow-hidden rounded-2xl bg-[#13233A]/75 backdrop-blur-xl border border-white/10 shadow-xl transition-all duration-500"
            >
              {/* Customizable Ambient Aurora Banner */}
              <div
                className={`relative h-44 sm:h-56 w-full overflow-hidden bg-gradient-to-r ${getBannerGradient(
                  customTheme
                )}`}
              >
                {/* Dynamic Aura Blurs */}
                <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#ff5722]/25 blur-3xl mix-blend-screen pointer-events-none" />
                <div className="absolute top-4 right-8 w-72 h-72 rounded-full bg-[#4c98c6]/30 blur-3xl mix-blend-screen pointer-events-none" />
                {/* Dot Pattern Texture */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                {/* Top Right Banner Metadata */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#070E18]/60 backdrop-blur-md text-[11px] text-[#CBD5E1] font-mono flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                    <span>{locationTag}</span>
                  </span>
                </div>
              </div>

              {/* Profile Body Content */}
              <div className="relative px-6 pb-6">
                {/* Avatar + Status Pill Placement */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
                  {/* Avatar Stack */}
                  <div className="relative group w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#1C2D46] p-1 shadow-2xl border border-white/10 relative">
                      {avatarUrl ? (
                        <img
                          className="w-full h-full object-cover rounded-full"
                          src={avatarUrl}
                          alt={displayName}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ff5722] to-[#3a0d1f] flex items-center justify-center font-bold text-3xl text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Avatar Edit Quick Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('customizer');
                          const el = document.getElementById('avatarEditorSection');
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-white z-10"
                        title="Change Avatar"
                      >
                        <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                      </button>
                    </div>
                    {/* Status Badge Dot */}
                    <div className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-[#070E18] flex items-center justify-center shadow-md z-20">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#22C55E] ring-2 ring-[#070E18]" />
                    </div>
                  </div>

                  {/* Lounge Drop Button */}
                  <div className="flex flex-wrap items-center gap-2 sm:mb-2">
                    <button
                      onClick={() => {
                        onJoinTapri(`tapri_${username}`);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff5722] hover:bg-[#F4511E] text-white font-bold text-xs transition-all shadow-[0_4px_20px_rgba(255,87,34,0.4)] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">headphones</span>
                      <span>Join {displayName.split(' ')[0] || username}'s Tapri</span>
                    </button>
                    {onStartDirectChat && !isOwnProfile && (
                      <button
                        onClick={() => {
                          if (profile) onStartDirectChat(profile);
                        }}
                        className="px-4 py-2.5 rounded-full bg-[#1C2D46] hover:bg-[#273647] text-white text-xs font-semibold transition-colors cursor-pointer border border-white/5"
                      >
                        Direct Message
                      </button>
                    )}
                  </div>
                </div>

                {/* Name, Hindi Tag & Handle */}
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <h1 className="text-2xl sm:text-3xl text-white font-extrabold tracking-tight">
                      {displayName}
                    </h1>
                    {hindiName && (
                      <span className="text-lg text-[#e4beb4] font-medium">
                        ({hindiName})
                      </span>
                    )}
                    <span
                      className="material-symbols-outlined text-[#ff5722] text-[20px]"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      verified
                    </span>
                    <span className="ml-1 px-3 py-0.5 rounded-full bg-[#1c2b3c] text-[#ffb5a0] text-[11px] font-mono tracking-wide uppercase">
                      {customVibeTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('customizer');
                        const el = document.getElementById('displayNameEditorSection');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="text-[#64748B] hover:text-[#ff5722] p-1 transition-colors cursor-pointer rounded-full hover:bg-white/5"
                      title="Edit Profile Information"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    @{username} • <span className="text-[#CBD5E1]">बस सुकून, बस कोड।</span>
                  </p>
                </div>

                {/* Bio */}
                <p className="text-sm text-[#CBD5E1] leading-relaxed max-w-2xl mb-4">
                  {bio}
                </p>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#0C1929]/80 mb-5 border border-white/5 shadow-inner">
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-[#64748B] font-mono">Lounge Time</span>
                    <span className="text-base text-white font-semibold flex items-center gap-1">
                      {profile?.loungeHours || 142}
                      <span className="text-[#ff5722] text-xs font-normal">hrs</span>
                    </span>
                  </div>
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-[#64748B] font-mono">Tea Clinks</span>
                    <span className="text-base text-white font-semibold flex items-center gap-1">
                      {chaiCount} ☕
                    </span>
                  </div>
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-[#64748B] font-mono">Current Mood</span>
                    <span className="text-xs text-[#ff5722] font-semibold truncate pt-0.5">
                      {customStatus}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center flex-wrap gap-2.5">
                  <button
                    id="chaiClinkBtn"
                    onClick={handleClinkChai}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all cursor-pointer border border-white/5 group ${
                      isChaiClinked
                        ? 'bg-[#ff5722] text-white scale-105 shadow-[0_0_16px_rgba(255,87,34,0.5)]'
                        : 'bg-[#1C2D46] hover:bg-[#273647] text-white'
                    }`}
                  >
                    <span className="text-[16px] group-hover:scale-125 transition-transform inline-block">
                      ☕
                    </span>
                    <span className="text-xs font-medium">
                      {isChaiClinked ? 'Chai Sent!' : 'Send 1 Chai'}
                    </span>
                  </button>

                  <button
                    onClick={handleShareProfile}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1C2D46] hover:bg-[#273647] text-[#CBD5E1] hover:text-white transition-colors cursor-pointer border border-white/5"
                    title="Share profile card"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Favorite Quiet Lounges & Communities Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">
                  Frequented Quiet Lounges & Tapris
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Room 1 */}
                <div className="p-4 rounded-xl bg-[#13233A]/60 hover:bg-[#13233A] border border-white/5 transition-all shadow-sm flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white group-hover:text-[#ff5722] transition-colors">
                        #chai_n_code
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" /> 82
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-4 line-clamp-2">
                      Late Night Coding, Rust, & Lofi beats stream.
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTapri('chai_n_code')}
                    className="w-full py-1.5 px-3 rounded-full bg-[#1C2D46] hover:bg-[#ff5722] hover:text-white text-[#CBD5E1] text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">sensors</span>
                    <span>Join Room</span>
                  </button>
                </div>

                {/* Room 2 */}
                <div className="p-4 rounded-xl bg-[#13233A]/60 hover:bg-[#13233A] border border-white/5 transition-all shadow-sm flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white group-hover:text-[#ff5722] transition-colors truncate">
                        #startup_fumbles
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" /> 114
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-4 line-clamp-2">
                      Honest pivoting stories, career rants & unhinged debugging.
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTapri('startup_fumbles')}
                    className="w-full py-1.5 px-3 rounded-full bg-[#1C2D46] hover:bg-[#ff5722] hover:text-white text-[#CBD5E1] text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">sensors</span>
                    <span>Join Room</span>
                  </button>
                </div>

                {/* Room 3 */}
                <div className="p-4 rounded-xl bg-[#13233A]/60 hover:bg-[#13233A] border border-white/5 transition-all shadow-sm flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white group-hover:text-[#ff5722] transition-colors">
                        #valorant_3am
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#22C55E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" /> 24
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mb-4 line-clamp-2">
                      Unranked late-night chill squad. Wholesome, zero toxicity.
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTapri('valorant_3am')}
                    className="w-full py-1.5 px-3 rounded-full bg-[#1C2D46] hover:bg-[#ff5722] hover:text-white text-[#CBD5E1] text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">sensors</span>
                    <span>Join Room</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Profile Customization Panel (Live Preview Dock) */}
          <div
            id="customizerPanel"
            className={`lg:col-span-4 flex flex-col gap-4 sticky top-20 transition-all ${
              viewMode === 'customizer' ? 'ring-2 ring-[#ff5722]/60 rounded-2xl' : ''
            }`}
          >
            <div className="rounded-2xl bg-[#13233A]/90 backdrop-blur-xl p-5 border border-white/10 shadow-xl flex flex-col gap-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {/* Customizer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#ff5722]/20 flex items-center justify-center text-[#ff5722]">
                    <span className="material-symbols-outlined text-[18px]">brush</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Edit Profile & Tapri Space</h3>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      Changes preview live in real-time
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ff5722]/20 text-[#ffb5a0] text-[10px] font-mono font-bold tracking-wider">
                  LIVE
                </span>
              </div>

              {/* Section: Display Name */}
              <div id="displayNameEditorSection" className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#ff5722]">badge</span>
                    <span>Display Name</span>
                  </label>
                  <span className="text-[10px] text-[#64748B] font-mono">Real-time preview</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0C1929] px-3 py-2 rounded-xl border border-white/10 focus-within:border-[#ff5722] transition-colors">
                  <input
                    type="text"
                    value={customDisplayName}
                    onChange={(e) => setCustomDisplayName(e.target.value)}
                    placeholder="e.g. Ayush Bhattacharya"
                    className="bg-transparent flex-1 text-white text-xs font-medium focus:outline-none placeholder:text-[#64748B]"
                  />
                  {customDisplayName && (
                    <button
                      type="button"
                      onClick={() => setCustomDisplayName('')}
                      className="text-[#64748B] hover:text-white"
                      title="Clear display name"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section: Avatar & Photo */}
              <div id="avatarEditorSection" className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#ff5722]">account_circle</span>
                    <span>Avatar & Photo</span>
                  </label>
                  <span className="text-[10px] text-[#ffb5a0] font-mono">Instant Presets</span>
                </div>

                {/* Current Avatar Preview & Upload */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0C1929] border border-white/5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1C2D46] border border-white/10 flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-[#ff5722] to-[#3a0d1f]">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 rounded-lg bg-[#1C2D46] hover:bg-[#273647] text-white text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">upload</span>
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                      </label>
                      {customAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setCustomAvatarUrl('')}
                          className="text-[10px] text-[#ff5722] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-[#64748B] truncate">PNG, JPG or WebP</span>
                  </div>
                </div>

                {/* Avatar Presets Grid */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#64748B] font-mono">Or pick an aesthetic vibe avatar:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCustomAvatarUrl(preset.url)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0C1929] hover:bg-[#1C2D46] border transition-all text-left cursor-pointer ${
                          avatarUrl === preset.url
                            ? 'border-[#ff5722] ring-1 ring-[#ff5722]/50'
                            : 'border-white/5'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-[10px] text-[#CBD5E1] truncate font-mono">{preset.vibe}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Avatar URL Input */}
                <div className="flex items-center gap-2 bg-[#0C1929] px-2.5 py-1.5 rounded-xl border border-white/5 text-[11px]">
                  <span className="material-symbols-outlined text-[#64748B] text-[14px]">link</span>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="bg-transparent flex-1 text-white text-[11px] focus:outline-none placeholder:text-[#64748B]"
                  />
                </div>
              </div>

              {/* Section: Bio & About You */}
              <div id="bioEditorSection" className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#ff5722]">edit_note</span>
                    <span>Bio & Late-night Note</span>
                  </label>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    {customBio.length}/280
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={280}
                  value={customBio}
                  onChange={(e) => setCustomBio(e.target.value)}
                  placeholder="Write a late-night thought, bio or what you're working on..."
                  className="w-full bg-[#0C1929] text-white text-xs p-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#ff5722] resize-none leading-relaxed placeholder:text-[#64748B]"
                />
              </div>

              {/* Section: Hindi Tag & Location / Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#CBD5E1]">Hindi Name Tag</label>
                  <input
                    type="text"
                    value={customHindiName}
                    onChange={(e) => setCustomHindiName(e.target.value)}
                    placeholder="e.g. आयुष"
                    className="bg-[#0C1929] px-2.5 py-2 rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#ff5722] placeholder:text-[#64748B]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-[#CBD5E1]">Fixed Location</label>
                    <button
                      type="button"
                      onClick={handleDetectCurrentLocation}
                      disabled={isDetectingLocation}
                      className="text-[10px] text-[#ff5722] hover:text-[#ff784e] flex items-center gap-1 font-mono transition-colors cursor-pointer"
                      title="Auto-detect current GPS/IP location & set as fixed location"
                    >
                      <span className={`material-symbols-outlined text-[13px] ${isDetectingLocation ? 'animate-spin' : ''}`}>
                        my_location
                      </span>
                      <span>{isDetectingLocation ? '...' : 'Detect'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="e.g. Delhi, IN"
                    className="bg-[#0C1929] px-2.5 py-2 rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-[#ff5722] placeholder:text-[#64748B]"
                  />
                  <span className="text-[9px] text-[#64748B] font-mono">
                    Location is fixed • Clock updates live
                  </span>
                </div>
              </div>

              {/* Section 1: Ambient Banner Aura Picker */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                <label className="text-xs font-medium text-[#CBD5E1]">Ambient Banner Aura</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomTheme('aurora')}
                    className={`p-2 rounded-xl bg-[#0C1929] hover:bg-[#1C2D46] flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'aurora' ? 'border-[#ff5722]' : 'border-white/5'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#143d42] to-[#2b1b17] ring-1 ring-[#ff5722]/40" />
                    <span className="text-[11px] text-[#CBD5E1]">Midnight Aurora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTheme('sunset')}
                    className={`p-2 rounded-xl bg-[#0C1929] hover:bg-[#1C2D46] flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'sunset' ? 'border-[#ff5722]' : 'border-white/5'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#ff5722] to-[#3a0d1f] ring-1 ring-[#ff5722]/40" />
                    <span className="text-[11px] text-[#CBD5E1]">Sunset Ember</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTheme('indigo')}
                    className={`p-2 rounded-xl bg-[#0C1929] hover:bg-[#1C2D46] flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'indigo' ? 'border-[#ff5722]' : 'border-white/5'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#1a237e] to-[#0d47a1] ring-1 ring-[#ff5722]/40" />
                    <span className="text-[11px] text-[#CBD5E1]">Electric Indigo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTheme('sage')}
                    className={`p-2 rounded-xl bg-[#0C1929] hover:bg-[#1C2D46] flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'sage' ? 'border-[#ff5722]' : 'border-white/5'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#1c3829] to-[#0f231c] ring-1 ring-[#ff5722]/40" />
                    <span className="text-[11px] text-[#CBD5E1]">Nordic Sage</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Bio Vibe Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#CBD5E1]">Persona • Bio Vibe Tag</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Late-night coder', 'Graphic nocturne', 'Philosophical chiller', 'Lofi curator'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCustomVibeTag(tag)}
                        className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                          customVibeTag === tag
                            ? 'bg-[#ff5722] text-white'
                            : 'bg-[#0C1929] hover:bg-[#1C2D46] text-[#CBD5E1] border border-white/5'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Section 3: Status Line & Focus Emoji Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#CBD5E1]">
                  Status Line & Focus Emoji
                </label>
                <div className="flex items-center gap-2 bg-[#0C1929] px-3 py-2 rounded-xl border border-white/10">
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="What are you doing at this late hour?"
                    className="bg-transparent flex-1 text-white text-xs focus:outline-none"
                  />
                  <span className="material-symbols-outlined text-[#ff5722] text-[18px]">
                    sentiment_satisfied
                  </span>
                </div>
              </div>

              {/* Section 4: Privacy & Ambient Rules */}
              <div className="flex flex-col gap-2 pt-1 border-t border-white/5">
                <label className="text-xs font-medium text-[#CBD5E1]">Privacy & Ambient Rules</label>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0C1929] border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-medium">Broadcast Current Lounge</span>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      Shows #chai_n_code when active
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={broadcastLounge}
                    onChange={(e) => setBroadcastLounge(e.target.checked)}
                    className="accent-[#ff5722] cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              {/* Save & Reset Action Triggers */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomSpace}
                  className="flex-1 py-2.5 rounded-full bg-[#ff5722] hover:bg-[#F4511E] text-white text-xs font-bold transition-all shadow-[0_4px_16px_rgba(255,87,34,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{saveButtonText}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCustomSpace}
                  className="px-4 py-2.5 rounded-full bg-[#1C2D46] hover:bg-[#273647] text-[#64748B] hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0C1929] border-t border-white/5 py-6 mt-auto">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#ff5722] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[14px]">nightlight</span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-[#CBD5E1]">
            <button onClick={onNavigateHome} className="hover:text-white transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => onJoinTapri('chai_n_code')} className="hover:text-white transition-colors cursor-pointer">
              #chai_n_code
            </button>
            <button onClick={() => onJoinTapri('startup_fumbles')} className="hover:text-white transition-colors cursor-pointer">
              #startup_fumbles
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
