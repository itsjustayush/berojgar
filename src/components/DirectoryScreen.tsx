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

interface DirectoryScreenProps {
  currentUser: UserProfile | null;
  onStartChat: (targetUser: UserProfile) => void;
  onOpenTapri: (tapriName: string) => void;
  onViewProfile: (username: string) => void;
}

export const DirectoryScreen: React.FC<DirectoryScreenProps> = ({
  currentUser,
  onStartChat,
  onOpenTapri,
  onViewProfile,
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
    <div className="h-[calc(100dvh-64px)] flex overflow-hidden bg-slate-50 dark:bg-[#080F21] text-slate-900 dark:text-slate-100">
      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header & Stats Banner */}
          <div className="bg-white dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 font-mono text-xs font-semibold mb-2">
                  <Coffee size={13} />
                  <span>Real-Time Directory</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Registered Members
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Connect live with real registered community members on the UltronChat network.
                </p>
              </div>

              {/* Real-time Stats Counters */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{registeredUsers.length}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Registered</div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {onlineCount}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Online Now</div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">6</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Tapris</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search registered members by name, @handle, or location..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white transition-all"
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
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                        selectedFilter === filter
                          ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
                    className="bg-white dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
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

                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono ${
                          isOnline
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                      </div>

                      {/* Name & Handle */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {member.displayName}
                          </h3>
                          <CheckCircle2 size={15} className="text-blue-500 fill-blue-500/10 shrink-0" />
                        </div>
                        <div className="text-xs font-mono text-slate-400">@{member.username}</div>
                        {hasVibe && (
                          <div className="text-xs font-medium text-orange-600 dark:text-orange-400 pt-1 flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>{member.customVibeTag}</span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {member.bio || 'Registered user on UltronChat.'}
                      </p>

                      {/* Location & Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          📍 {location}
                        </span>
                        {member.customStatusEmoji && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px]">
                            {member.customStatusEmoji}
                          </span>
                        )}
                        {member.allowVoicePings !== false && (
                          <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[10px] font-mono text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/40">
                            ☕ Open for Chai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onStartChat(member)}
                        className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-orange-500 dark:hover:bg-orange-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenTapri('chai_n_code')}
                        title="Start Chai Huddle"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs transition-colors cursor-pointer"
                      >
                        <Coffee size={14} className="text-orange-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewProfile(member.username)}
                        title="View Profile"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
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

