import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  GuestbookNote,
  Conversation,
} from '../types';
import {
  getUserProfileByUsername,
  saveUserProfileCustomization,
  addGuestbookNote,
  incrementChaiCount,
} from '../lib/socialChatService';

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

  // Customization Form State
  const [customTheme, setCustomTheme] = useState<'aurora' | 'sunset' | 'indigo' | 'sage'>('aurora');
  const [customVibeTag, setCustomVibeTag] = useState('Late-night coder');
  const [customStatus, setCustomStatus] = useState('React 19 & Chai');
  const [broadcastLounge, setBroadcastLounge] = useState(true);
  const [allowVoicePings, setAllowVoicePings] = useState(true);
  const [saveButtonText, setSaveButtonText] = useState('Save My Tapri');
  const [isCopied, setIsCopied] = useState(false);

  // Interactive Guestbook & Chai Clinks
  const [chaiCount, setChaiCount] = useState(1280);
  const [isChaiClinked, setIsChaiClinked] = useState(false);
  const [guestbookNotes, setGuestbookNotes] = useState<GuestbookNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSimulatingRecord, setIsSimulatingRecord] = useState(false);

  // Fetch or synthesize profile for username
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getUserProfileByUsername(username).then((data) => {
      if (!isMounted) return;
      setProfile(data);
      setCustomTheme(data.customThemeAura || 'aurora');
      setCustomVibeTag(data.customVibeTag || 'Late-night coder');
      setCustomStatus(data.customStatusEmoji || 'React 19 & Chai');
      setBroadcastLounge(data.broadcastCurrentLounge !== false);
      setAllowVoicePings(data.allowVoicePings !== false);
      setChaiCount(data.chaiCount || (username === 'itsjustayush' ? 1280 : 18));
      setGuestbookNotes(data.guestbookNotes || []);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [username]);

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

  const handleAddGuestbookNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) return;

    const senderName = currentUser?.displayName || 'Guest Chiller';
    const senderUsername = currentUser?.username || 'guest';
    const initials = senderName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const note: GuestbookNote = {
      id: `note_${Date.now()}`,
      senderName,
      senderUsername,
      text: newNoteText.trim(),
      timestamp: Date.now(),
      avatarInitials: initials || 'GC',
    };

    setGuestbookNotes((prev) => [note, ...prev]);
    setNewNoteText('');
    await addGuestbookNote(username, note);
  };

  const handleSaveCustomSpace = async () => {
    const updates: Partial<UserProfile> = {
      customThemeAura: customTheme,
      customVibeTag: customVibeTag,
      customStatusEmoji: customStatus,
      broadcastCurrentLounge: broadcastLounge,
      allowVoicePings: allowVoicePings,
    };

    await saveUserProfileCustomization(username, updates, currentUser?.uid);
    setSaveButtonText('Saved to Tapri!');
    setTimeout(() => {
      setSaveButtonText('Save My Tapri');
    }, 2000);
  };

  const handleResetCustomSpace = () => {
    setCustomTheme('aurora');
    setCustomVibeTag('Late-night coder');
    setCustomStatus('React 19 & Chai');
    setBroadcastLounge(true);
    setAllowVoicePings(true);
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

  const formatTimeRemaining = (timestamp: number) => {
    const hoursElapsed = (Date.now() - timestamp) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(1, Math.round(24 - hoursElapsed));
    return `${hoursRemaining}h`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return '1d ago';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070E18] text-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#ff5722] border-t-transparent animate-spin mb-4" />
        <p className="font-mono text-xs text-white/50">Fetching @{username}'s Tapri space...</p>
      </div>
    );
  }

  const displayName = profile?.displayName || username;
  const avatarUrl = profile?.photoURL;
  const bio = profile?.bio || 'Building late-night side-projects & breaking state engines. Chai > Coffee ☕';

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
              onClick={() => setViewMode('customizer')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'customizer'
                  ? 'bg-[#ff5722] text-white shadow-[0_2px_12px_rgba(255,87,34,0.35)]'
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>Customize Space</span>
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
                    <span>{profile?.customLocation || 'Delhi, IN • 02:45 AM'}</span>
                  </span>
                </div>
              </div>

              {/* Profile Body Content */}
              <div className="relative px-6 pb-6">
                {/* Avatar + Status Pill Placement */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
                  {/* Avatar Stack */}
                  <div className="relative group w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#1C2D46] p-1 shadow-2xl border border-white/10">
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
                    </div>
                    {/* Status Badge Dot */}
                    <div className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-[#070E18] flex items-center justify-center shadow-md">
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
                      <span>Join {profile?.displayName?.split(' ')[0] || username}'s Tapri</span>
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
                    {profile?.customHindiName && (
                      <span className="text-lg text-[#e4beb4] font-medium">
                        ({profile.customHindiName})
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[#0C1929]/80 mb-5 border border-white/5 shadow-inner">
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-[#64748B] font-mono">Lounge Time</span>
                    <span className="text-base text-white font-semibold flex items-center gap-1">
                      {profile?.loungeHours || 142}
                      <span className="text-[#ff5722] text-xs font-normal">hrs</span>
                    </span>
                  </div>
                  <div className="flex flex-col px-3 py-1">
                    <span className="text-[11px] text-[#64748B] font-mono">Audio Snippets</span>
                    <span className="text-base text-white font-semibold flex items-center gap-1">
                      {profile?.audioSnippetsCount || 48}
                      <span className="text-[#86cfff] text-xs font-normal">notes</span>
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
                    onClick={() => {
                      const el = document.getElementById('guestbookDock');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1C2D46] hover:bg-[#273647] text-white text-xs font-medium transition-colors cursor-pointer border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[17px] text-[#ff5722]">
                      mic
                    </span>
                    <span>Send Vanishing Voice Note</span>
                  </button>

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
                <span className="text-[11px] text-[#ff5722] font-mono">Live Audio Active</span>
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

            {/* Vanishing Guestbook / Wall of Chai */}
            <div
              id="guestbookDock"
              className="rounded-2xl bg-[#13233A]/70 p-5 backdrop-blur-md border border-white/10 shadow-md flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#ff5722]/20 flex items-center justify-center text-[#ff5722]">
                    <span className="material-symbols-outlined text-[18px]">timer</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Vanishing Guestbook • Wall of Chai
                    </h3>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      Notes vanish after 24h • zero tracking • purely late-night vibes
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#0C1929] text-[11px] font-mono text-[#CBD5E1] border border-white/5">
                  {guestbookNotes.length} active notes
                </span>
              </div>

              {/* Input Dock */}
              <form
                onSubmit={handleAddGuestbookNote}
                className="flex items-center gap-2 bg-[#0C1929] p-1.5 rounded-full border border-white/10 shadow-inner"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsSimulatingRecord(true);
                    setTimeout(() => {
                      setIsSimulatingRecord(false);
                      setNewNoteText('🎙️ [Vanishing Voice Note 0:08 - "Suno yaar, kya scene kal ka?"]');
                    }, 1200);
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isSimulatingRecord
                      ? 'bg-red-500/30 text-red-400 animate-pulse'
                      : 'bg-[#1C2D46] hover:bg-[#273647] text-[#ff5722]'
                  }`}
                  title="Record vanishing voice ping"
                >
                  <span className="material-symbols-outlined text-[18px]">mic</span>
                </button>
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Bolo bhai, kya scene hai... (Leave a quick note)"
                  className="bg-transparent flex-1 px-3 py-1.5 text-white placeholder:text-[#64748B] text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-4 py-1.5 rounded-full bg-[#ff5722] hover:bg-[#F4511E] disabled:opacity-40 disabled:hover:bg-[#ff5722] text-white text-xs font-semibold transition-all shadow-[0_2px_12px_rgba(255,87,34,0.3)] flex items-center gap-1 cursor-pointer"
                >
                  <span>Send</span>
                  <span className="material-symbols-outlined text-[14px]">send</span>
                </button>
              </form>

              {/* Notes Feed */}
              <div className="flex flex-col gap-2.5">
                {guestbookNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#0C1929]/70 border border-white/5 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#273647] flex items-center justify-center text-xs font-bold text-[#86cfff] flex-shrink-0">
                        {note.avatarInitials}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            @{note.senderUsername}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-mono">
                            • {formatTimeAgo(note.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[#CBD5E1] mt-0.5">{note.text}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#64748B] font-mono flex items-center gap-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[13px]">
                        hourglass_top
                      </span>{' '}
                      {formatTimeRemaining(note.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Profile Customization Panel (Live Preview Dock) */}
          <div
            className={`lg:col-span-4 flex flex-col gap-4 sticky top-20 transition-all ${
              viewMode === 'customizer' ? 'ring-2 ring-[#ff5722]/60 rounded-2xl' : ''
            }`}
          >
            <div className="rounded-2xl bg-[#13233A]/90 backdrop-blur-xl p-5 border border-white/10 shadow-xl flex flex-col gap-4">
              {/* Customizer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#ff5722]/20 flex items-center justify-center text-[#ff5722]">
                    <span className="material-symbols-outlined text-[18px]">brush</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Customize Tapri Space</h3>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      Changes preview live in real-time
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ff5722]/20 text-[#ffb5a0] text-[10px] font-mono font-bold tracking-wider">
                  LIVE
                </span>
              </div>

              {/* Section 1: Ambient Banner Aura Picker */}
              <div className="flex flex-col gap-1.5">
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

              {/* Section 4: 15s Audio Intro Recorder */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#CBD5E1]">
                    15s Audio Intro Snippet
                  </label>
                  <span className="text-[11px] font-mono text-[#22C55E]">Active (0:14)</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0C1929] border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center hover:bg-[#EF4444]/30 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isPlayingAudio ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono text-white">vibe_snip_3am.wav</span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {isPlayingAudio ? 'Playing loop...' : 'Recorded yesterday'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulatingRecord(true);
                      setTimeout(() => setIsSimulatingRecord(false), 1500);
                    }}
                    className="px-3 py-1 rounded-full bg-[#1C2D46] hover:bg-[#273647] text-[#CBD5E1] text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Re-record
                  </button>
                </div>
              </div>

              {/* Section 5: Privacy & Vanishing Controls */}
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
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0C1929] border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs text-white font-medium">
                      Allow Anonymous Voice Pings
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      In the vanishing 24h guestbook
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowVoicePings}
                    onChange={(e) => setAllowVoicePings(e.target.checked)}
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
            <span className="text-xs text-[#64748B]">
              © 2026 बेरोजगार चैट (Berojgar Chat). Late-night safe haven for idle thinkers.
            </span>
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
