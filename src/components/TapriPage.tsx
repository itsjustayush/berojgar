import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Users,
  Radio,
  Calendar,
  Share2,
  Check,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Flame,
  Volume2,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  subscribeToTapriRealtime,
  TapriRealtimeInfo,
  sanitizeTapriName,
  getOrCreateTapri,
} from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';

const BRAND_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AV9byNA9FQpRcjaipoJx0Wsa2-Zg_9rrkTlCjzdUg3om-SOQaPwkH1N4z0kFoe3B39efO8poxiohSM4LvMKfnSP-Froza0igkREI6qfgPzv4ddstqmGBqmvv0wHkJH7bIIdBsJvD2J_XEIxNaf1bk3qxSqlfyMd3xt0RMSjsaFpGe7F-L2pXqhjS3wolQReWlF1dBan3uhbHxj2ngxZvvV7iSylugDdb73FB4YmakFUHrgJjPLQnQgBXb0DPnIo7Gg';

interface TapriPageProps {
  tapriName: string;
  currentUser: UserProfile | null;
  onEnterTapriChat: (tapriName: string) => void;
  onNavigateHome: () => void;
  onViewUserProfile?: (username: string) => void;
}

export const TapriPage: React.FC<TapriPageProps> = ({
  tapriName: rawTapriName,
  currentUser,
  onEnterTapriChat,
  onNavigateHome,
  onViewUserProfile,
}) => {
  const cleanName = sanitizeTapriName(rawTapriName) || 'chai_n_code';
  const [tapriInfo, setTapriInfo] = useState<TapriRealtimeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [chaiCount, setChaiCount] = useState(48);
  const [isChaiClinked, setIsChaiClinked] = useState(false);

  // Subscribe to real-time Tapri updates and online users
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const unsubscribe = subscribeToTapriRealtime(
      cleanName,
      (data) => {
        if (!isMounted) return;
        setTapriInfo(data);
        setLoading(false);
      },
      currentUser
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [cleanName, currentUser]);

  const handleShareTapri = () => {
    const fullUrl = `https://berojgarchat.vercel.app/tapri=${cleanName}`;
    if (navigator.share) {
      navigator
        .share({
          title: `#${cleanName} - Berozgar Tapri`,
          text: `Join the late-night hangout at #${cleanName} on Berozgar Chat!`,
          url: fullUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSendChai = () => {
    setChaiCount((prev) => prev + 1);
    setIsChaiClinked(true);
    setTimeout(() => setIsChaiClinked(false), 700);
  };

  const handleJoinChatClick = async () => {
    // Ensure joined and navigate to chat
    if (currentUser) {
      await getOrCreateTapri(cleanName, currentUser);
    }
    onEnterTapriChat(cleanName);
  };

  // Format creation date
  const formatCreationDate = (ts?: number) => {
    if (!ts) return 'August 12, 2026';
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate relative age
  const getRelativeAge = (ts?: number) => {
    if (!ts) return 'Active Lounge';
    const diff = Date.now() - ts;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Created today';
    if (days === 1) return 'Created yesterday';
    if (days < 30) return `Active for ${days} days`;
    const months = Math.floor(days / 30);
    return `Established ${months} month${months > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface-container-low/90 backdrop-blur-md border-b border-outline-variant/30 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Chats</span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-outline-variant/30">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-primary-container shrink-0">
                <img
                  alt="Berojgar Logo"
                  className="w-full h-full object-cover"
                  src={BRAND_LOGO_URL}
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-sm text-on-surface">
                  Berojgar
                </span>
                <span className="text-[10px] font-semibold text-primary">
                  Tapri Lounge
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareTapri}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 text-xs font-mono transition-colors cursor-pointer"
              title="Copy Tapri Link"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share Tapri</span>
                </>
              )}
            </button>

            {currentUser ? (
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-outline-variant/30">
                <UserAvatar
                  name={currentUser.displayName}
                  username={currentUser.username}
                  photoURL={currentUser.photoURL}
                  size="sm"
                  showStatus
                  isOnline={currentUser.status === 'online'}
                />
                <span className="text-xs font-semibold text-on-surface-variant">@{currentUser.username}</span>
              </div>
            ) : (
              <button
                onClick={onNavigateHome}
                className="px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-8 lg:p-10 shadow-xs">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Tapri Big Icon */}
              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md">
                <Coffee size={36} />
              </div>

              {/* Title & Tag */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                    {tapriInfo?.tag || `#${cleanName}`}
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                    {tapriInfo?.isPublic ? 'Public Lounge' : 'Private Tapri'}
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1">
                    <Volume2 size={12} />
                    <span>Lofi & Voice Ready</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
                  {tapriInfo?.title || `#${cleanName}`}
                </h1>

                <p className="text-xs sm:text-sm text-on-surface-variant">
                  berojgarchat.vercel.app/tapri={cleanName}
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={handleJoinChatClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer"
              >
                <MessageSquare size={18} />
                <span>Enter Tapri Chat</span>
              </button>

              <button
                onClick={handleSendChai}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-primary transition-all cursor-pointer ${
                  isChaiClinked ? 'scale-105 ring-2 ring-primary' : ''
                }`}
                title="Clink cutting chai with this tapri"
              >
                <Coffee size={15} />
                <span>Cheer Cutting Chai ({chaiCount})</span>
              </button>
            </div>
          </div>

          {/* Real-time Status Counters Row */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Realtime Online Users Counter */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-emerald-500/30 relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Online Chillers
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono">
                  {loading ? '...' : tapriInfo?.onlineUsersCount || 0}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Realtime Live</span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">
                Active in this Tapri right now
              </p>
            </div>

            {/* Total Members Counter */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-1.5 mb-1 text-on-surface-variant">
                <Users size={14} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Total Users
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono">
                  {loading ? '...' : tapriInfo?.totalUsersCount || 1}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">members</span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">
                Registered tapri chillers
              </p>
            </div>

            {/* Tapri Creation Date */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-1.5 mb-1 text-on-surface-variant">
                <Calendar size={14} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Created On
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold text-on-surface truncate font-sans">
                {formatCreationDate(tapriInfo?.createdAt)}
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1 truncate">
                {getRelativeAge(tapriInfo?.createdAt)}
              </p>
            </div>

            {/* Tapri Creator Attribution */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-1.5 mb-1 text-on-surface-variant">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  Tapri Creator
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-on-surface truncate">
                  {tapriInfo?.creatorDisplayName || 'Ayush Bhattacharya'}
                </span>
              </div>
              <p className="text-[10px] text-primary mt-1 font-semibold truncate">
                @{tapriInfo?.creatorUsername || 'itsjustayush'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Tapri Description & Guidelines */}
          <div className="md:col-span-2 space-y-6">
            {/* Description Box */}
            <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles size={18} />
                <h2 className="font-extrabold text-base sm:text-lg text-on-surface font-sans">
                  Tapri Description & Vibe
                </h2>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-sm sm:text-base text-on-surface leading-relaxed font-sans">
                {tapriInfo?.description ||
                  'Late Night Coding, Rust, & Lofi beats stream. Debugging silent sessions with chill background sitar beats and occasional PR venting.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Real-time Presence</span>
                    <span className="text-[11px] text-on-surface-variant">Online status updates live in real time via Firestore</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5 text-xs">
                    ☕
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Cutting Chai Culture</span>
                    <span className="text-[11px] text-on-surface-variant">Spontaneous chai clinks and late-night tech discussions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Online Users / Chillers Right Now */}
            <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-base text-on-surface">
                    Chillers Online Now ({tapriInfo?.onlineUsersCount || 0})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                  Live Snapshot
                </span>
              </div>

              {tapriInfo && tapriInfo.onlineUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tapriInfo.onlineUsers.map((user) => (
                    <div
                      key={user.uid}
                      className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-3 hover:border-outline-variant transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          name={user.displayName}
                          username={user.username}
                          photoURL={user.photoURL}
                          size="md"
                          showStatus
                          isOnline={true}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-on-surface block truncate">
                            {user.displayName}
                          </span>
                          <span className="text-[11px] font-semibold text-primary block truncate">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {onViewUserProfile && (
                        <button
                          onClick={() => onViewUserProfile(user.username)}
                          className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center space-y-2">
                  <Coffee size={24} className="text-on-surface-variant/40 mx-auto" />
                  <p className="text-xs text-on-surface-variant">
                    No other chillers active right now.
                  </p>
                  <button
                    onClick={handleJoinChatClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Be the first to step into #{cleanName}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Creator Profile Card & Quick Actions */}
          <div className="space-y-6">
            {/* Creator Card */}
            <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-primary font-bold">
                  Tapri Creator
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                  Founder
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={tapriInfo?.creatorDisplayName || 'Ayush Bhattacharya'}
                    username={tapriInfo?.creatorUsername || 'itsjustayush'}
                    photoURL={tapriInfo?.creatorPhotoURL}
                    size="lg"
                    showStatus
                    isOnline={true}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-on-surface block truncate">
                      {tapriInfo?.creatorDisplayName || 'Ayush Bhattacharya'}
                    </span>
                    <span className="text-xs font-semibold text-primary block truncate">
                      @{tapriInfo?.creatorUsername || 'itsjustayush'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                  Host & curator of #{cleanName}. Welcoming developers, chillers, and late-night thinkers.
                </p>

                {onViewUserProfile && (
                  <button
                    onClick={() =>
                      onViewUserProfile(tapriInfo?.creatorUsername || 'itsjustayush')
                    }
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold border border-outline-variant/30 transition-colors cursor-pointer"
                  >
                    <span>View @{tapriInfo?.creatorUsername || 'itsjustayush'} Profile</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {/* Establishment Timeline Info */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Creation Date:</span>
                  <span className="text-on-surface font-semibold">
                    {formatCreationDate(tapriInfo?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Lounge ID:</span>
                  <span className="text-on-surface-variant font-mono">tapri_{cleanName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Direct URL:</span>
                  <span className="text-primary truncate max-w-[140px] font-semibold">
                    /tapri={cleanName}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Share Card */}
            <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-on-surface">
                <Share2 size={16} className="text-primary" />
                <h3 className="font-bold text-sm">Invite Chillers</h3>
              </div>
              <p className="text-xs text-on-surface-variant font-sans">
                Share this dedicated Tapri link anywhere. Anyone with the link can view live online count and join the chat.
              </p>

              <div className="flex items-center gap-2 p-2 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface overflow-hidden">
                <span className="truncate flex-1 font-mono text-[11px] pl-1">
                  berojgarchat.vercel.app/tapri={cleanName}
                </span>
                <button
                  onClick={handleShareTapri}
                  className="px-3 py-1.5 rounded-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-xs"
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
