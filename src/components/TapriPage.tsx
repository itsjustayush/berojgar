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
import { BerozgarLogo } from './BerozgarLogo';

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
    <div className="min-h-screen bg-[#070e1c] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#ff5722] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0a1427]/85 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-mono transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Chats</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
              <BerozgarLogo variant="icon" size="sm" />
              <span className="font-extrabold text-sm tracking-tight text-white font-mono">
                BEROZGAR<span className="text-[#ff5722]">.TAPRI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareTapri}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 text-xs font-mono transition-colors cursor-pointer"
              title="Copy Tapri Link"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-[#22C55E]" />
                  <span className="text-[#22C55E] font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share Tapri</span>
                </>
              )}
            </button>

            {currentUser ? (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/10">
                <UserAvatar
                  name={currentUser.displayName}
                  username={currentUser.username}
                  photoURL={currentUser.photoURL}
                  size="sm"
                  showStatus
                  isOnline={currentUser.status === 'online'}
                />
                <span className="text-xs font-mono text-white/70">@{currentUser.username}</span>
              </div>
            ) : (
              <button
                onClick={onNavigateHome}
                className="px-3 py-1.5 rounded-xl bg-[#ff5722] hover:bg-[#f3643d] text-white text-xs font-bold font-mono transition-colors cursor-pointer"
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111f38] to-[#0d182b] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#ff5722]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#3b82f6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Tapri Big Icon */}
              <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#ff5722] via-[#f4511e] to-[#ff8a65] flex items-center justify-center text-white shadow-xl shadow-[#ff5722]/20 border-2 border-white/20">
                <Coffee size={36} className="text-white drop-shadow-md" />
              </div>

              {/* Title & Tag */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff5722]/20 border border-[#ff5722]/40 text-[#ff8a65] text-xs font-mono font-bold uppercase tracking-wider">
                    {tapriInfo?.tag || `#${cleanName}`}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-mono">
                    {tapriInfo?.isPublic ? 'Public Lounge' : 'Private Tapri'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono flex items-center gap-1">
                    <Volume2 size={12} />
                    <span>Lofi & Voice Ready</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {tapriInfo?.title || `#${cleanName}`}
                </h1>

                <p className="text-xs sm:text-sm text-white/50 font-mono">
                  berojgarchat.vercel.app/tapri={cleanName}
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={handleJoinChatClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff5722] to-[#ea580c] hover:from-[#f4511e] hover:to-[#c2410c] text-white font-bold text-sm shadow-lg shadow-[#ff5722]/25 hover:shadow-xl hover:shadow-[#ff5722]/35 transition-all transform hover:-translate-y-0.5 cursor-pointer font-sans"
              >
                <MessageSquare size={18} />
                <span>Enter Tapri Chat</span>
              </button>

              <button
                onClick={handleSendChai}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#ffb5a0] transition-all cursor-pointer ${
                  isChaiClinked ? 'scale-105 ring-2 ring-[#ff5722]' : ''
                }`}
                title="Clink cutting chai with this tapri"
              >
                <Coffee size={15} className="text-[#ff5722]" />
                <span>Cheer Cutting Chai ({chaiCount})</span>
              </button>
            </div>
          </div>

          {/* Real-time Status Counters Row */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Realtime Online Users Counter */}
            <div className="p-4 rounded-2xl bg-[#091324]/80 border border-[#22c55e]/30 relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#22C55E] font-bold">
                  Online Chillers
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {loading ? '...' : tapriInfo?.onlineUsersCount || 0}
                </span>
                <span className="text-xs text-[#22c55e] font-mono font-medium">Realtime Live</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1 font-mono">
                Active in this Tapri right now
              </p>
            </div>

            {/* Total Members Counter */}
            <div className="p-4 rounded-2xl bg-[#091324]/80 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1 text-white/60">
                <Users size={14} className="text-[#38bdf8]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#38bdf8] font-bold">
                  Total Users
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {loading ? '...' : tapriInfo?.totalUsersCount || 1}
                </span>
                <span className="text-xs text-white/50 font-mono">members</span>
              </div>
              <p className="text-[10px] text-white/40 mt-1 font-mono">
                Registered tapri chillers
              </p>
            </div>

            {/* Tapri Creation Date */}
            <div className="p-4 rounded-2xl bg-[#091324]/80 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1 text-white/60">
                <Calendar size={14} className="text-[#a78bfa]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#a78bfa] font-bold">
                  Created On
                </span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white truncate font-sans">
                {formatCreationDate(tapriInfo?.createdAt)}
              </div>
              <p className="text-[10px] text-white/40 mt-1 font-mono truncate">
                {getRelativeAge(tapriInfo?.createdAt)}
              </p>
            </div>

            {/* Tapri Creator Attribution */}
            <div className="p-4 rounded-2xl bg-[#091324]/80 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1 text-white/60">
                <ShieldCheck size={14} className="text-[#ffb5a0]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#ffb5a0] font-bold">
                  Tapri Creator
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white truncate">
                  {tapriInfo?.creatorDisplayName || 'Ayush Bhattacharya'}
                </span>
              </div>
              <p className="text-[10px] text-[#ff5722] mt-1 font-mono truncate">
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
            <div className="rounded-3xl bg-[#0e192e] border border-white/10 p-6 sm:p-7 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-[#ff5722]">
                <Sparkles size={18} />
                <h2 className="font-extrabold text-base sm:text-lg text-white font-sans">
                  Tapri Description & Vibe
                </h2>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070e1c] border border-white/5 text-sm sm:text-base text-white/80 leading-relaxed font-sans">
                {tapriInfo?.description ||
                  'Late Night Coding, Rust, & Lofi beats stream. Debugging silent sessions with chill background sitar beats and occasional PR venting.'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white/2 border border-white/5 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Real-time Presence</span>
                    <span className="text-[11px] text-white/50">Online status updates live in real time via Firestore</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/2 border border-white/5 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#ff5722]/15 text-[#ff5722] flex items-center justify-center shrink-0 mt-0.5">
                    ☕
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cutting Chai Culture</span>
                    <span className="text-[11px] text-white/50">Spontaneous chai clinks and late-night tech discussions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Online Users / Chillers Right Now */}
            <div className="rounded-3xl bg-[#0e192e] border border-white/10 p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-[#22c55e]" />
                  <h3 className="font-extrabold text-base text-white">
                    Chillers Online Now ({tapriInfo?.onlineUsersCount || 0})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#22c55e] px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30">
                  Live Snapshot
                </span>
              </div>

              {tapriInfo && tapriInfo.onlineUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tapriInfo.onlineUsers.map((user) => (
                    <div
                      key={user.uid}
                      className="p-3 rounded-2xl bg-[#070e1c] border border-white/5 flex items-center justify-between gap-3 hover:border-white/15 transition-all"
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
                          <span className="text-xs font-bold text-white block truncate">
                            {user.displayName}
                          </span>
                          <span className="text-[11px] font-mono text-[#ff5722] block truncate">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {onViewUserProfile && (
                        <button
                          onClick={() => onViewUserProfile(user.username)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#070e1c] border border-white/5 text-center space-y-2">
                  <Coffee size={24} className="text-white/20 mx-auto" />
                  <p className="text-xs text-white/50 font-mono">
                    No other chillers active right now.
                  </p>
                  <button
                    onClick={handleJoinChatClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff5722] hover:bg-[#f3643d] text-white font-bold text-xs font-mono transition-colors cursor-pointer"
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
            <div className="rounded-3xl bg-[#0e192e] border border-white/10 p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#ff5722] font-bold">
                  Tapri Creator
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  Founder
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#070e1c] border border-white/5 space-y-3">
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
                    <span className="text-sm font-extrabold text-white block truncate">
                      {tapriInfo?.creatorDisplayName || 'Ayush Bhattacharya'}
                    </span>
                    <span className="text-xs font-mono text-[#ff5722] block truncate">
                      @{tapriInfo?.creatorUsername || 'itsjustayush'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  Host & curator of #{cleanName}. Welcoming developers, chillers, and late-night thinkers.
                </p>

                {onViewUserProfile && (
                  <button
                    onClick={() =>
                      onViewUserProfile(tapriInfo?.creatorUsername || 'itsjustayush')
                    }
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    <span>View @{tapriInfo?.creatorUsername || 'itsjustayush'} Profile</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {/* Establishment Timeline Info */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/50">Creation Date:</span>
                  <span className="text-white font-medium">
                    {formatCreationDate(tapriInfo?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/50">Lounge ID:</span>
                  <span className="text-white/70">tapri_{cleanName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/50">Direct URL:</span>
                  <span className="text-[#ff5722] truncate max-w-[140px]">
                    /tapri={cleanName}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Share Card */}
            <div className="rounded-3xl bg-[#0e192e] border border-white/10 p-6 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Share2 size={16} className="text-[#38bdf8]" />
                <h3 className="font-bold text-sm">Invite Chillers</h3>
              </div>
              <p className="text-xs text-white/60 font-sans">
                Share this dedicated Tapri link anywhere. Anyone with the link can view live online count and join the chat.
              </p>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#070e1c] border border-white/10 font-mono text-xs text-white/80 overflow-hidden">
                <span className="truncate flex-1">
                  berojgarchat.vercel.app/tapri={cleanName}
                </span>
                <button
                  onClick={handleShareTapri}
                  className="px-2.5 py-1 rounded-lg bg-[#ff5722] hover:bg-[#f3643d] text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
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
