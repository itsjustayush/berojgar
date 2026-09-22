import React, { useState, useEffect } from 'react';
import {
  Flame,
  Radio,
  Terminal,
  Check,
  Copy,
  BadgeCheck,
  Eye,
  Edit,
  Camera,
  Headphones,
  Share2,
  Brush,
  IdCard,
  X,
  UserCircle,
  Upload,
  Link2,
  LocateFixed,
  Smile,
  CheckCircle2,
  Moon,
  FileEdit,
} from 'lucide-react';
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

const BRAND_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AV9byNA9FQpRcjaipoJx0Wsa2-Zg_9rrkTlCjzdUg3om-SOQaPwkH1N4z0kFoe3B39efO8poxiohSM4LvMKfnSP-Froza0igkREI6qfgPzv4ddstqmGBqmvv0wHkJH7bIIdBsJvD2J_XEIxNaf1bk3qxSqlfyMd3xt0RMSjsaFpGe7F-L2pXqhjS3wolQReWlF1dBan3uhbHxj2ngxZvvV7iSylugDdb73FB4YmakFUHrgJjPLQnQgBXb0DPnIo7Gg';

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
      <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-on-surface-variant">Fetching @{username}'s Tapri space...</p>
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
    <div className="bg-surface text-on-surface font-sans min-h-screen flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-xs">
        <div className="h-16 w-full max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-primary-container shrink-0">
                <img
                  alt="Berojgar Logo"
                  className="w-full h-full object-cover"
                  src={BRAND_LOGO_URL}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                  Berojgar
                </span>
                <span className="text-[10px] font-semibold text-primary">
                  Where ideas brew
                </span>
              </div>
            </button>
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container ml-2 border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-on-surface-variant font-medium">3,412 chillers online</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onJoinTapri('chai_n_code')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Radio size={15} />
              <span>Join #chai_n_code</span>
            </button>
            <button
              onClick={onNavigateHome}
              className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-colors cursor-pointer"
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
            <div className="flex items-center gap-2 bg-surface-container-low backdrop-blur-md px-4 py-1.5 rounded-full border border-outline-variant/30 shadow-xs">
              <Terminal size={16} className="text-primary" />
              <span className="text-[11px] text-on-surface-variant font-mono">berojgarchat.vercel.app/</span>
              <span className="text-xs font-bold text-on-surface tracking-tight font-mono">
                {username}
              </span>
              <button
                onClick={handleCopyUrl}
                className="ml-1 text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full flex items-center cursor-pointer"
                title="Copy profile address"
              >
                {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold border border-secondary-container/60 shadow-xs">
              <BadgeCheck size={14} />
              <span>Verified Chiller • Day 12</span>
            </div>
          </div>

          {/* Mode Switcher Pill Dock */}
          <div className="flex items-center self-start md:self-auto bg-surface-container p-1 rounded-full border border-outline-variant/30 shadow-xs">
            <button
              onClick={() => setViewMode('public')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'public'
                  ? 'bg-secondary-container text-on-secondary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Eye size={14} />
              <span>Public View</span>
            </button>
            <button
              onClick={() => {
                setViewMode('customizer');
                const panel = document.getElementById('customizerPanel');
                panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'customizer'
                  ? 'bg-secondary-container text-on-secondary-container shadow-xs ring-1 ring-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FileEdit size={14} />
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
              className="relative overflow-hidden rounded-3xl bg-surface-container-lowest backdrop-blur-xl border border-outline-variant/30 shadow-xs transition-all duration-500"
            >
              {/* Customizable Ambient Aurora Banner */}
              <div
                className={`relative h-44 sm:h-56 w-full overflow-hidden bg-gradient-to-r ${getBannerGradient(
                  customTheme
                )}`}
              >
                {/* Dynamic Aura Blurs */}
                <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-secondary-container/20 blur-3xl mix-blend-screen pointer-events-none" />
                <div className="absolute top-4 right-8 w-72 h-72 rounded-full bg-primary-fixed/20 blur-3xl mix-blend-screen pointer-events-none" />
                {/* Dot Pattern Texture */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                {/* Top Right Banner Metadata */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-[11px] text-on-surface font-mono flex items-center gap-1.5 border border-outline-variant/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
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
                    <div className="w-full h-full rounded-full overflow-hidden bg-surface-container p-1 shadow-xl border-2 border-surface relative">
                      {avatarUrl ? (
                        <img
                          className="w-full h-full object-cover rounded-full"
                          src={avatarUrl}
                          alt={displayName}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-3xl">
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
                        <Camera size={22} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                      </button>
                    </div>
                    {/* Status Badge Dot */}
                    <div className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-surface flex items-center justify-center shadow-xs z-20">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
                    </div>
                  </div>

                  {/* Lounge Drop Button */}
                  <div className="flex flex-wrap items-center gap-2 sm:mb-2">
                    <button
                      onClick={() => {
                        onJoinTapri(`tapri_${username}`);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      <Headphones size={16} />
                      <span>Join {displayName.split(' ')[0] || username}'s Tapri</span>
                    </button>
                    {onStartDirectChat && !isOwnProfile && (
                      <button
                        onClick={() => {
                          if (profile) onStartDirectChat(profile);
                        }}
                        className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors cursor-pointer border border-outline-variant/30"
                      >
                        Direct Message
                      </button>
                    )}
                  </div>
                </div>

                {/* Name, Hindi Tag & Handle */}
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex items-center flex-wrap gap-2">
                    <h1 className="text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
                      {displayName}
                    </h1>
                    {hindiName && (
                      <span className="text-lg text-primary font-semibold">
                        ({hindiName})
                      </span>
                    )}
                    <BadgeCheck size={20} className="text-primary" />
                    <span className="ml-1 px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold tracking-wide uppercase border border-secondary-container/60">
                      {customVibeTag}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('customizer');
                        const el = document.getElementById('displayNameEditorSection');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="text-on-surface-variant hover:text-primary p-1 transition-colors cursor-pointer rounded-full hover:bg-surface-container"
                      title="Edit Profile Information"
                    >
                      <Edit size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    @{username} • <span className="text-on-surface font-medium">बस सुकून, बस कोड।</span>
                  </p>
                </div>

                {/* Bio */}
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl mb-4">
                  {bio}
                </p>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-surface-container-low mb-5 border border-outline-variant/30 shadow-xs">
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Lounge Time</span>
                    <span className="text-base text-on-surface font-bold flex items-center gap-1 font-mono">
                      {profile?.loungeHours || 142}
                      <span className="text-primary text-xs font-normal">hrs</span>
                    </span>
                  </div>
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Tea Clinks</span>
                    <span className="text-base text-on-surface font-bold flex items-center gap-1 font-mono">
                      {chaiCount} ☕
                    </span>
                  </div>
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Current Mood</span>
                    <span className="text-xs text-primary font-bold truncate pt-0.5">
                      {customStatus}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center flex-wrap gap-2.5">
                  <button
                    id="chaiClinkBtn"
                    onClick={handleClinkChai}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all cursor-pointer border border-outline-variant/30 group ${
                      isChaiClinked
                        ? 'bg-secondary-container text-on-secondary-container scale-105 shadow-md'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span className="text-[16px] group-hover:scale-125 transition-transform inline-block">
                      ☕
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {isChaiClinked ? 'Chai Sent!' : 'Send 1 Chai'}
                    </span>
                  </button>

                  <button
                    onClick={handleShareProfile}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer border border-outline-variant/30"
                    title="Share profile card"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Favorite Quiet Lounges & Communities Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
                  Frequented Quiet Lounges & Tapris
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Room 1 */}
                <div className="p-4 rounded-3xl bg-surface-container-lowest hover:border-primary border border-outline-variant/30 transition-all shadow-xs flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        #chai_n_code
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> 82
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
                      Late Night Coding, Rust, & Lofi beats stream.
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTapri('chai_n_code')}
                    className="w-full py-2 px-3 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Radio size={14} />
                    <span>Join Room</span>
                  </button>
                </div>

                {/* Room 2 */}
                <div className="p-4 rounded-3xl bg-surface-container-lowest hover:border-primary border border-outline-variant/30 transition-all shadow-xs flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        #startup_fumbles
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> 114
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
                      Honest pivoting stories, career rants & unhinged debugging.
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTapri('startup_fumbles')}
                    className="w-full py-2 px-3 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Radio size={14} />
                    <span>Join Room</span>
                  </button>
                </div>

                {/* Room 3 */}
                <div className="p-4 rounded-3xl bg-surface-container-lowest hover:border-primary border border-outline-variant/30 transition-all shadow-xs flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        #valorant_3am
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> 24
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">
                      Unranked late-night chill squad. Wholesome, zero toxicity.
                    </p>
                  </div>
                  <button
                    onClick={() => onJoinTapri('valorant_3am')}
                    className="w-full py-2 px-3 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Radio size={14} />
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
              viewMode === 'customizer' ? 'ring-2 ring-primary/60 rounded-3xl' : ''
            }`}
          >
            <div className="rounded-3xl bg-surface-container-lowest backdrop-blur-xl p-5 border border-outline-variant/30 shadow-xs flex flex-col gap-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
              {/* Customizer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <Brush size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Edit Profile & Tapri Space</h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Changes preview live in real-time
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-wider">
                  LIVE
                </span>
              </div>

              {/* Section: Display Name */}
              <div id="displayNameEditorSection" className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <IdCard size={15} className="text-primary" />
                    <span>Display Name</span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant">Real-time preview</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-2xl border border-outline-variant/30 focus-within:border-primary transition-colors">
                  <input
                    type="text"
                    value={customDisplayName}
                    onChange={(e) => setCustomDisplayName(e.target.value)}
                    placeholder="e.g. Ayush Bhattacharya"
                    className="bg-transparent flex-1 text-on-surface text-xs font-medium focus:outline-none placeholder:text-on-surface-variant/50"
                  />
                  {customDisplayName && (
                    <button
                      type="button"
                      onClick={() => setCustomDisplayName('')}
                      className="text-on-surface-variant hover:text-on-surface"
                      title="Clear display name"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Section: Avatar & Photo */}
              <div id="avatarEditorSection" className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <UserCircle size={15} className="text-primary" />
                    <span>Avatar & Photo</span>
                  </label>
                  <span className="text-[10px] text-primary font-semibold">Instant Presets</span>
                </div>

                {/* Current Avatar Preview & Upload */}
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border border-outline-variant/30 flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-on-secondary-container text-sm bg-secondary-container">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1 border border-outline-variant/30">
                        <Upload size={13} />
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
                          className="text-[10px] text-primary hover:underline cursor-pointer font-bold"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-on-surface-variant truncate">PNG, JPG or WebP</span>
                  </div>
                </div>

                {/* Avatar Presets Grid */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-on-surface-variant">Or pick an aesthetic vibe avatar:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCustomAvatarUrl(preset.url)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border transition-all text-left cursor-pointer ${
                          avatarUrl === preset.url
                            ? 'border-primary ring-1 ring-primary/50'
                            : 'border-outline-variant/30'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-[10px] text-on-surface truncate font-medium">{preset.vibe}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Avatar URL Input */}
                <div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1.5 rounded-2xl border border-outline-variant/30 text-[11px]">
                  <Link2 size={14} className="text-on-surface-variant" />
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="bg-transparent flex-1 text-on-surface text-[11px] focus:outline-none placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              {/* Section: Bio & About You */}
              <div id="bioEditorSection" className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <FileEdit size={15} className="text-primary" />
                    <span>Bio & Late-night Note</span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant">
                    {customBio.length}/280
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={280}
                  value={customBio}
                  onChange={(e) => setCustomBio(e.target.value)}
                  placeholder="Write a late-night thought, bio or what you're working on..."
                  className="w-full bg-surface-container-low text-on-surface text-xs p-3 rounded-2xl border border-outline-variant/30 focus:outline-none focus:border-primary resize-none leading-relaxed placeholder:text-on-surface-variant/50"
                />
              </div>

              {/* Section: Hindi Tag & Location / Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-on-surface">Hindi Name Tag</label>
                  <input
                    type="text"
                    value={customHindiName}
                    onChange={(e) => setCustomHindiName(e.target.value)}
                    placeholder="e.g. आयुष"
                    className="bg-surface-container-low px-2.5 py-2 rounded-2xl border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-on-surface">Fixed Location</label>
                    <button
                      type="button"
                      onClick={handleDetectCurrentLocation}
                      disabled={isDetectingLocation}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold transition-colors cursor-pointer"
                      title="Auto-detect current GPS/IP location & set as fixed location"
                    >
                      <LocateFixed size={13} className={isDetectingLocation ? 'animate-spin' : ''} />
                      <span>{isDetectingLocation ? '...' : 'Detect'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="e.g. Delhi, IN"
                    className="bg-surface-container-low px-2.5 py-2 rounded-2xl border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                  />
                  <span className="text-[9px] text-on-surface-variant">
                    Location is fixed • Clock updates live
                  </span>
                </div>
              </div>

              {/* Section 1: Ambient Banner Aura Picker */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/30">
                <label className="text-xs font-medium text-on-surface">Ambient Banner Aura</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomTheme('aurora')}
                    className={`p-2 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'aurora' ? 'border-primary' : 'border-outline-variant/30'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#143d42] to-[#2b1b17] ring-1 ring-primary/40" />
                    <span className="text-[11px] text-on-surface">Midnight Aurora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTheme('sunset')}
                    className={`p-2 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'sunset' ? 'border-primary' : 'border-outline-variant/30'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#ff5722] to-[#3a0d1f] ring-1 ring-primary/40" />
                    <span className="text-[11px] text-on-surface">Sunset Ember</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTheme('indigo')}
                    className={`p-2 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'indigo' ? 'border-primary' : 'border-outline-variant/30'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#1a237e] to-[#0d47a1] ring-1 ring-primary/40" />
                    <span className="text-[11px] text-on-surface">Electric Indigo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomTheme('sage')}
                    className={`p-2 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center gap-2 text-left transition-all border cursor-pointer ${
                      customTheme === 'sage' ? 'border-primary' : 'border-outline-variant/30'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#1c3829] to-[#0f231c] ring-1 ring-primary/40" />
                    <span className="text-[11px] text-on-surface">Nordic Sage</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Bio Vibe Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface">Persona • Bio Vibe Tag</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Late-night coder', 'Graphic nocturne', 'Philosophical chiller', 'Lofi curator'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCustomVibeTag(tag)}
                        className={`px-3 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                          customVibeTag === tag
                            ? 'bg-secondary-container text-on-secondary-container font-bold shadow-xs'
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30'
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
                <label className="text-xs font-medium text-on-surface">
                  Status Line & Focus Emoji
                </label>
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-2xl border border-outline-variant/30">
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="What are you doing at this late hour?"
                    className="bg-transparent flex-1 text-on-surface text-xs focus:outline-none"
                  />
                  <Smile size={18} className="text-primary" />
                </div>
              </div>

              {/* Section 4: Privacy & Ambient Rules */}
              <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/30">
                <label className="text-xs font-medium text-on-surface">Privacy & Ambient Rules</label>
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface font-medium">Broadcast Current Lounge</span>
                    <span className="text-[10px] text-on-surface-variant">
                      Shows #chai_n_code when active
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={broadcastLounge}
                    onChange={(e) => setBroadcastLounge(e.target.checked)}
                    className="accent-primary cursor-pointer w-4 h-4"
                  />
                </div>
              </div>

              {/* Save & Reset Action Triggers */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomSpace}
                  className="flex-1 py-2.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>{saveButtonText}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCustomSpace}
                  className="px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors cursor-pointer border border-outline-variant/30"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 py-6 mt-auto">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-primary-container shrink-0">
              <img
                alt="Berojgar Logo"
                className="w-full h-full object-cover"
                src={BRAND_LOGO_URL}
              />
            </div>
            <span className="text-xs font-bold text-on-surface">Berojgar Chat</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-on-surface-variant">
            <button onClick={onNavigateHome} className="hover:text-on-surface transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => onJoinTapri('chai_n_code')} className="hover:text-on-surface transition-colors cursor-pointer">
              #chai_n_code
            </button>
            <button onClick={() => onJoinTapri('startup_fumbles')} className="hover:text-on-surface transition-colors cursor-pointer">
              #startup_fumbles
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
