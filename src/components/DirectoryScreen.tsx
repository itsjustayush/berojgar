import React, { useState, useEffect } from 'react';
import {
  Search,
  Coffee,
  Sparkles,
  MessageSquare,
  Phone,
  Flame,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Users,
  Award,
  ArrowUpRight,
  Filter,
  UserPlus,
  Radio,
} from 'lucide-react';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { subscribeToAllRegisteredUsers } from '../lib/socialChatService';

const BRAND_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AV9byNA9FQpRcjaipoJx0Wsa2-Zg_9rrkTlCjzdUg3om-SOQaPwkH1N4z0kFoe3B39efO8poxiohSM4LvMKfnSP-Froza0igkREI6qfgPzv4ddstqmGBqmvv0wHkJH7bIIdBsJvD2J_XEIxNaf1bk3qxSqlfyMd3xt0RMSjsaFpGe7F-L2pXqhjS3wolQReWlF1dBan3uhbHxj2ngxZvvV7iSylugDdb73FB4YmakFUHrgJjPLQnQgBXb0DPnIo7Gg';

interface DirectoryScreenProps {
  currentUser: UserProfile | null;
  onStartChat: (targetUser: UserProfile) => void;
  onOpenTapri: (tapriName: string) => void;
  onViewProfile: (username: string) => void;
  onNavigateHome?: () => void;
}

export const DirectoryScreen: React.FC<DirectoryScreenProps> = ({
  currentUser,
  onStartChat,
  onOpenTapri,
  onViewProfile,
  onNavigateHome,
}) => {
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Online' | 'Chai'>('All');

  // Real-time listener for registered users in Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllRegisteredUsers(currentUser?.uid, (users) => {
      setRegisteredUsers(users);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  const onlineCount = registeredUsers.filter((u) => u.status === 'online').length;

  const filteredMembers = registeredUsers.filter((member) => {
    if (selectedFilter === 'Online' && member.status !== 'online') return false;
    if (selectedFilter === 'Chai' && member.allowVoicePings === false) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      (member.displayName || '').toLowerCase().includes(q) ||
      (member.username || '').toLowerCase().includes(q) ||
      (member.bio || '').toLowerCase().includes(q) ||
      (member.city || '').toLowerCase().includes(q) ||
      (member.customVibeTag || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface dark:bg-[#080F21] text-on-surface dark:text-slate-100 font-sans">
      {/* Brand Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-surface/90 dark:bg-[#080F21]/90 transition-all border-b border-surface-variant/30 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high dark:bg-slate-800 text-on-surface text-xs font-semibold transition-colors cursor-pointer mr-2"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back</span>
              </button>
            )}
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-primary-container shrink-0">
              <img
                alt="Berojgar Logo"
                className="w-full h-full object-cover"
                src={BRAND_LOGO_URL}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold tracking-tight text-on-surface">Berojgar</span>
              <span className="text-[10px] font-semibold text-on-surface-variant -mt-0.5">
                Community Directory
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onOpenTapri('chai_n_code')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold shadow-xs hover:bg-secondary-fixed transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">local_cafe</span>
              <span>Join Chai Tapri</span>
            </button>
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant/50 text-on-surface text-xs font-semibold transition-colors cursor-pointer"
              >
                Open Chats
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header & Stats Banner */}
          <div className="bg-surface-container-lowest dark:bg-[#0E172A] border border-surface-variant/40 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-secondary text-xs font-bold mb-2">
                  <span className="material-symbols-outlined text-[15px]">local_cafe</span>
                  <span>Community Network</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-on-surface">
                  Registered Members
                </h1>
                <p className="text-on-surface-variant text-sm mt-1">
                  Connect live with creators, developers, and thinkers on the Berojgar network.
                </p>
              </div>

              {/* Real-time Stats Counters */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-surface-container-low dark:bg-slate-800/60 border border-surface-variant/30 dark:border-slate-700/60 text-center">
                  <div className="text-lg font-bold text-on-surface">{registeredUsers.length}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Registered</div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-surface-container-low dark:bg-slate-800/60 border border-surface-variant/30 dark:border-slate-700/60 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineCount}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Online Now</div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-surface-container-low dark:bg-slate-800/60 border border-surface-variant/30 dark:border-slate-700/60 text-center">
                  <div className="text-lg font-bold text-secondary">6</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Active Tapris</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search registered members by name, @handle, or location..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-low dark:bg-slate-800/50 border border-surface-variant/40 dark:border-slate-700 text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-on-surface transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['All', 'Online', 'Chai'] as const).map((filter) => {
                  const labels: Record<string, string> = {
                    All: `All (${registeredUsers.length})`,
                    Online: `Online (${onlineCount})`,
                    Chai: 'Available for Chai ☕',
                  };
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        selectedFilter === filter
                          ? 'bg-secondary-container text-on-secondary-container shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Members Grid (Only Real-Time Registered Users) */}
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mb-3" />
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Syncing registered users in real time...
              </div>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMembers.map((member) => {
                const isOnline = member.status === 'online';
                const hasVibe = !!member.customVibeTag;
                const location = member.customLocation || member.city || 'India';

                return (
                  <div
                    key={member.uid}
                    className="bg-surface-container-lowest dark:bg-[#0E172A] border border-surface-variant/40 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Bar: Avatar & Realtime Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="relative">
                          <UserAvatar
                            name={member.displayName}
                            username={member.username}
                            photoURL={member.photoURL}
                            size="lg"
                            showStatus
                            isOnline={isOnline}
                          />
                        </div>

                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isOnline
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-surface-container-low dark:bg-slate-800/60 border border-surface-variant/40 dark:border-slate-700 text-on-surface-variant'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                      </div>

                      {/* Name & Handle */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-on-surface text-base">
                            {member.displayName}
                          </h3>
                          <CheckCircle2 size={15} className="text-secondary fill-secondary/10 shrink-0" />
                        </div>
                        <div className="text-xs font-semibold text-on-surface-variant">@{member.username}</div>
                        {hasVibe && (
                          <div className="text-xs font-semibold text-secondary pt-1 flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>{member.customVibeTag}</span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-on-surface-variant mt-2.5 line-clamp-2 leading-relaxed">
                        {member.bio || 'Member of the Berojgar community.'}
                      </p>

                      {/* Location & Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-slate-800 text-[11px] font-semibold text-on-surface-variant">
                          📍 {location}
                        </span>
                        {member.customStatusEmoji && (
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-low dark:bg-slate-800 text-[11px]">
                            {member.customStatusEmoji}
                          </span>
                        )}
                        {member.allowVoicePings !== false && (
                          <span className="px-2.5 py-1 rounded-full bg-secondary-container/40 text-[11px] font-bold text-secondary border border-secondary-container/60">
                            ☕ Open for Chai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-4 border-t border-surface-variant/30 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onStartChat(member)}
                        className="flex-1 py-2.5 rounded-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <MessageSquare size={13} />
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenTapri('chai_n_code')}
                        title="Join Chai Tapri"
                        className="p-2.5 rounded-full border border-surface-variant/40 dark:border-slate-700 hover:bg-surface-container text-on-surface-variant text-xs transition-colors cursor-pointer"
                      >
                        <Coffee size={14} className="text-secondary" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewProfile(member.username)}
                        title="View Profile"
                        className="p-2.5 rounded-full border border-surface-variant/40 dark:border-slate-700 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-[#0E172A] rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No members found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No registered members match "${searchQuery}". Try a different name or handle.`
                  : 'Currently no other registered users in this category. As users register and log in, they will appear here live.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer (Tapri Pass & Live Sessions) */}
      <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] p-6 hidden xl:flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {/* Tapri Pass Card */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-8 translate-x-8" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-orange-100">
                Member Pass
              </span>
              <Award size={18} className="text-amber-200" />
            </div>
            <div>
              <div className="text-lg font-bold">Tapri Unlimited Pass</div>
              <div className="text-xs text-orange-100 mt-0.5">
                Full access to all 6 Community Tapris and instant audio huddles.
              </div>
            </div>
            <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs font-mono">
              <span>Status: ACTIVE</span>
              <span className="font-bold">#BP-8921</span>
            </div>
          </div>
        </div>

        {/* Real-time Online Partners */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Live Members
            </h3>
            <span className="text-[10px] text-orange-600 font-semibold">
              {registeredUsers.length} Registered
            </span>
          </div>

          <div className="space-y-2.5">
            {registeredUsers.slice(0, 5).map((m) => (
              <div
                key={`sugg_${m.uid}`}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={m.displayName}
                    username={m.username}
                    photoURL={m.photoURL}
                    size="sm"
                    showStatus
                    isOnline={m.status === 'online'}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {m.displayName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">@{m.username}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onStartChat(m)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <MessageSquare size={13} />
                </button>
              </div>
            ))}

            {registeredUsers.length === 0 && !isLoading && (
              <div className="text-center py-4 text-xs text-slate-400 font-mono">
                No other members registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Live Community Sessions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
            Live Community Sessions
          </h3>

          <div className="space-y-2.5">
            <div
              onClick={() => onOpenTapri('chai_n_code')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-500/50 transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Chai & Code</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live (4)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Silent programming lounge with background lofi rain.
              </p>
            </div>

            <div
              onClick={() => onOpenTapri('startup_fumbles')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-500/50 transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Startup Fumbles</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live (2)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Raw stories of pivots, failed launches, and tea breaks.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

