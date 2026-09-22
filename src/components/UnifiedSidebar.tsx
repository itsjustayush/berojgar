import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Coffee,
  CheckCircle2,
  Check,
  CheckCheck,
  Users,
  Compass,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Volume2,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Conversation, UserProfile, ViewMode } from '../types';
import {
  searchUsers,
  GLOBAL_TAPRI_DEFINITIONS,
  getOrCreateTapri,
} from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';
import { CreateTapriModal } from './CreateTapriModal';

export interface UnifiedSidebarProps {
  // Navigation & Rail Props
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentUser: UserProfile;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  unreadCount?: number;

  // Conversations & Chat List Props
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onLogout: () => void;
  onStartNewDirectChat: (targetUser: UserProfile) => void;
  onJoinTapri?: (tapriName: string) => void;
  onViewTapriPage?: (tapriName: string) => void;

  // Collapse State
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenSettings,
  onOpenProfile,
  onOpenAuth,
  isDarkMode,
  onToggleDarkMode,
  unreadCount = 0,
  conversations,
  activeConversationId,
  onSelectConversation,
  onLogout,
  onStartNewDirectChat,
  onJoinTapri,
  onViewTapriPage,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingNetwork, setIsSearchingNetwork] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateTapriModal, setShowCreateTapriModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DMS' | 'CIRCLES' | 'PINNED'>('ALL');
  const [now, setNow] = useState<number>(Date.now());

  // 1-second ticker to reactively evaluate typing timestamps
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'CIRCLES' && conv.type !== 'group') return false;
    if (activeTab === 'DMS' && conv.type === 'group') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (conv.type === 'group') {
      if (
        conv.tapriName?.toLowerCase().includes(q) ||
        conv.tapriTitle?.toLowerCase().includes(q) ||
        conv.tapriDescription?.toLowerCase().includes(q)
      ) {
        return true;
      }
    }

    const otherUid = conv.participants.find((p) => p !== currentUser.uid) || '';
    const other = conv.participantDetails?.[otherUid];
    if (other) {
      if (
        other.displayName.toLowerCase().includes(q) ||
        other.username.toLowerCase().includes(q)
      ) {
        return true;
      }
    }

    if (conv.lastMessage?.text?.toLowerCase().includes(q)) {
      return true;
    }

    return false;
  });

  const handleSearchNetwork = async (queryText: string) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      setIsSearchingNetwork(false);
      return;
    }

    setIsSearchingNetwork(true);
    try {
      const results = await searchUsers(queryText, currentUser.uid);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    const otherUid = conv.participants.find((p) => p !== currentUser.uid) || '';
    return (
      conv.participantDetails?.[otherUid] || {
        uid: otherUid,
        username: 'user',
        displayName: 'Berozgar User',
        photoURL: '',
        status: 'offline' as const,
      }
    );
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Render New Direct Chat Modal
  const renderNewChatModal = () => {
    if (!showNewChatModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white dark:bg-[#0E172A] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                <MessageSquare size={16} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">New Direct Message</h3>
            </div>
            <button
              onClick={() => {
                setShowNewChatModal(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={searchQuery}
              onChange={(e) => handleSearchNetwork(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1 custom-scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => {
                    onStartNewDirectChat(user);
                    setShowNewChatModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full p-2.5 rounded-2xl flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                >
                  <UserAvatar
                    name={user.displayName}
                    username={user.username}
                    photoURL={user.photoURL}
                    size="md"
                    showStatus
                    isOnline={user.status === 'online'}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{user.displayName}</span>
                    <span className="text-[11px] font-mono text-orange-600 dark:text-orange-400 block truncate">@{user.username}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Message
                  </span>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                No users found matching "@{searchQuery}"
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                Type a handle above to search the network
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Collapsed Rail View
  if (isCollapsed) {
    return (
      <aside
        id="unified-sidebar"
        aria-label="Unified Navigation Sidebar (Collapsed)"
        className="relative w-[72px] h-full shrink-0 flex flex-col bg-surface-container-lowest border-r border-surface-variant/30 text-on-surface select-none items-center justify-between transition-colors z-20"
      >
        {/* Floating edge expand pill on the sidebar border */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
            className="absolute top-3.5 -right-3.5 z-30 w-7 h-7 rounded-full bg-surface-container-lowest border border-surface-variant/50 shadow-md text-on-surface-variant hover:text-secondary hover:border-secondary/50 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-secondary"
          >
            <ChevronRight size={14} className="stroke-[2.5] ml-0.5" />
          </button>
        )}

        <div className="flex flex-col items-center gap-3 w-full">
          {/* Top Header Row matching expanded hierarchy */}
          <div className="w-full px-2 py-3 border-b border-surface-variant/30 flex items-center justify-between gap-1 bg-surface-container-lowest">
            <div className="flex items-center justify-center">
              {/* Logo */}
              <button
                type="button"
                onClick={() => onNavigate('CHATS')}
                title="Berozgar - Home"
                className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              >
                <Coffee size={18} className="stroke-[2.2] group-hover:rotate-6 transition-transform" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Hidden placeholder buttons 1 and 2 to preserve DOM selector structure */}
              <span className="hidden" aria-hidden="true" />
              <span className="hidden" aria-hidden="true" />
              {onToggleCollapse && (
                <button
                  id="unified-sidebar-expand-btn"
                  type="button"
                  onClick={onToggleCollapse}
                  title="Expand Sidebar"
                  aria-label="Expand Sidebar"
                  className="p-1.5 rounded-xl border border-surface-variant/40 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-all cursor-pointer flex items-center justify-center shadow-2xs hover:shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-secondary"
                >
                  <ChevronRight size={16} className="stroke-[2.2]" />
                </button>
              )}
            </div>
          </div>

          {/* Primary View Navigation */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => onNavigate('CHATS')}
              title="Messages"
              className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                currentView === 'CHATS'
                  ? 'bg-secondary-container text-on-secondary-container shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-surface" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('DIRECTORY')}
              title="Directory & Network"
              className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                currentView === 'DIRECTORY'
                  ? 'bg-secondary-container text-on-secondary-container shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <Compass size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              className="w-10 h-10 rounded-2xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Start New Direct Chat"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Collapsed Chats List */}
        <div className="flex-1 w-full overflow-y-auto py-3 space-y-2 flex flex-col items-center custom-scrollbar">
          {filteredConversations.map((conv) => {
            const isGroup = conv.type === 'group';
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversationId;
            const convUnread = conv.unreadCounts?.[currentUser.uid] || 0;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  onNavigate('CHATS');
                  onSelectConversation(conv.id);
                }}
                className={`relative p-1 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'ring-2 ring-secondary bg-surface-container'
                    : 'hover:bg-surface-container'
                }`}
                title={isGroup ? (conv.tapriTitle || `#${conv.tapriName}`) : `${other.displayName} (@${other.username})`}
              >
                {isGroup ? (
                  <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-mono font-bold text-sm shadow-xs">
                    <Coffee size={17} />
                  </div>
                ) : (
                  <UserAvatar
                    name={other.displayName || other.username}
                    username={other.username}
                    photoURL={other.photoURL}
                    size="md"
                    showStatus
                    isOnline={other.status === 'online'}
                  />
                )}
                {convUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {convUnread > 9 ? '9+' : convUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-2 border-t border-surface-variant/30">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Warmth ☕' : 'Switch to Nocturnal Lounge 🌙'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun size={17} className="text-secondary" /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & Preferences"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Settings size={17} />
          </button>

          {currentUser && (
            <button
              id="unified-sidebar-logout-btn"
              type="button"
              onClick={() => onLogout()}
              title="Log Out of Berojgar"
              aria-label="Log Out of Berojgar"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer active:scale-95"
            >
              <LogOut size={17} />
            </button>
          )}

          {currentUser ? (
            <button
              type="button"
              onClick={onOpenProfile}
              title={`@${currentUser.username} (${currentUser.displayName})`}
              className="relative rounded-full ring-2 ring-secondary/80 ring-offset-2 ring-offset-surface transition-transform hover:scale-105 cursor-pointer"
            >
              <UserAvatar
                name={currentUser.displayName}
                username={currentUser.username}
                photoURL={currentUser.photoURL}
                size="sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold shadow-xs hover:bg-secondary-fixed transition-colors cursor-pointer"
            >
              Sign
            </button>
          )}
        </div>

        {renderNewChatModal()}
      </aside>
    );
  }

  // Expanded Combined Sidebar View
  return (
    <aside
      id="unified-sidebar"
      aria-label="Unified Navigation and Chat Sidebar"
      className="w-full h-full flex flex-col bg-surface-container-lowest border-r border-surface-variant/30 text-on-surface select-none overflow-hidden transition-colors"
    >
      {/* 1. TOP HEADER: Brand Logo, Status & Direct Actions */}
      <div className="px-3.5 py-3 border-b border-surface-variant/30 flex items-center justify-between gap-2 bg-surface-container-lowest">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            title="Berozgar - Home"
            className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Coffee size={18} className="stroke-[2.2]" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-on-surface tracking-tight truncate leading-tight">
              Berojgar
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-mono font-bold border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Live Tapri
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateTapriModal(true)}
            title="Create Chai Circle / Tapri"
            className="p-1.5 rounded-xl border border-surface-variant/40 hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
          >
            <Coffee size={15} className="text-secondary" />
          </button>

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            title="New Direct Message"
            className="p-1.5 rounded-xl border border-surface-variant/40 hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <Plus size={15} />
          </button>

          {onToggleCollapse && (
            <button
              id="unified-sidebar-collapse-btn"
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
              className="p-1.5 rounded-xl border border-surface-variant/40 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-all cursor-pointer flex items-center justify-center shadow-2xs hover:shadow-xs active:scale-95 focus-visible:outline-2 focus-visible:outline-secondary"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. PRIMARY VIEW SWITCHER SEGMENT (Chats vs Directory) */}
      <div className="p-2 pb-1 border-b border-surface-variant/30 bg-surface-container-lowest">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-variant/40">
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'CHATS'
                ? 'bg-secondary-container text-on-secondary-container font-bold shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chats</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-secondary" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('DIRECTORY')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'DIRECTORY'
                ? 'bg-secondary-container text-on-secondary-container font-bold shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Compass size={14} />
            <span>Directory</span>
          </button>
        </div>
      </div>

      {/* 3. SEARCH INPUT */}
      <div className="p-3 pb-2 bg-surface-container-lowest">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-on-surface-variant/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchNetwork(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8.5 pr-10 py-2 rounded-xl bg-surface-container-low border border-surface-variant/40 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary-container/30 focus:border-secondary-container transition-all"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded-md bg-surface-container text-[9px] font-mono text-on-surface-variant pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 4. FILTER CHIPS (All, DMs, Chai Circles, Pinned) */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-surface-variant/30 overflow-x-auto custom-scrollbar bg-surface-container-lowest">
        {(['ALL', 'DMS', 'CIRCLES', 'PINNED'] as const).map((tab) => {
          const labels: Record<string, string> = {
            ALL: 'All',
            DMS: 'DMs',
            CIRCLES: 'Circles',
            PINNED: 'Pinned',
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (currentView !== 'CHATS') onNavigate('CHATS');
                setActiveTab(tab);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 5. MAIN SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-surface-variant/20 bg-surface-container-lowest">
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
              Recent Conversations
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant">
              {filteredConversations.length} total
            </span>
          </div>

          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId && currentView === 'CHATS';
              const convUnread = conv.unreadCounts?.[currentUser.uid] || 0;
              const isGroupTapri = conv.type === 'group';

              if (isGroupTapri) {
                const tapriTitle = conv.tapriTitle || `#${conv.tapriName || 'Tapri'}`;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      onNavigate('CHATS');
                      onSelectConversation(conv.id);
                    }}
                    className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                      isActive
                        ? 'bg-surface-container border-secondary/30 shadow-xs border-l-4 border-l-secondary-container'
                        : 'border-transparent hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-2xs">
                      <Coffee size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {tapriTitle}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant shrink-0">
                          {formatTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {conv.typing &&
                        Object.entries(conv.typing).some(
                          ([uid, ts]) => uid !== currentUser.uid && typeof ts === 'number' && now - ts < 4000
                        ) ? (
                          <div className="flex items-center gap-1.5 text-xs text-secondary font-medium truncate">
                            <span className="italic">typing</span>
                            <span className="inline-flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1 h-1 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1 h-1 rounded-full bg-secondary animate-bounce" />
                            </span>
                          </div>
                        ) : (
                          <p className={`text-xs truncate max-w-[170px] ${convUnread > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                            {conv.lastMessage?.text || 'Chai Circle Lounge'}
                          </p>
                        )}
                        {convUnread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold shrink-0">
                            {convUnread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              }

              // Direct message item
              const other = getOtherParticipant(conv);
              const hasAudio = conv.lastMessage?.type === 'audio';
              const isOtherUserTyping =
                conv.typing &&
                Object.entries(conv.typing).some(
                  ([uid, ts]) => uid !== currentUser.uid && typeof ts === 'number' && now - ts < 4000
                );
              const isLastMessageFromYou = conv.lastMessage?.senderId === currentUser.uid;
              const isLastMsgSeen =
                isLastMessageFromYou &&
                (conv.lastMessage?.status === 'seen' ||
                  (conv.lastMessage?.seenBy && conv.lastMessage.seenBy.includes(other.uid)) ||
                  (conv.unreadCounts?.[other.uid] === 0 && (conv.lastMessage?.timestamp || 0) <= (conv.updatedAt || 0)));
              const isLastMsgDelivered = isLastMessageFromYou && conv.lastMessage?.status === 'delivered';

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    onNavigate('CHATS');
                    onSelectConversation(conv.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                    isActive
                      ? 'bg-surface-container border-secondary/30 shadow-xs border-l-4 border-l-secondary-container'
                      : 'border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      name={other.displayName || other.username}
                      username={other.username}
                      photoURL={other.photoURL}
                      size="md"
                      showStatus
                      isOnline={other.status === 'online'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {other.displayName}
                        </span>
                        <CheckCircle2 size={13} className="text-secondary shrink-0" />
                      </div>
                      <span className="text-[10px] font-mono text-on-surface-variant shrink-0">
                        {formatTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {isOtherUserTyping ? (
                        <div className="flex items-center gap-1.5 text-xs text-secondary font-medium truncate">
                          <span className="italic">typing</span>
                          <span className="inline-flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1 h-1 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1 h-1 rounded-full bg-secondary animate-bounce" />
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 min-w-0 max-w-[170px]">
                          {isLastMessageFromYou && (
                            <span className="shrink-0 flex items-center">
                              {isLastMsgSeen ? (
                                <CheckCheck size={14} className="text-secondary stroke-[2.4]" title="Seen" />
                              ) : isLastMsgDelivered ? (
                                <CheckCheck size={13} className="text-on-surface-variant/70" title="Delivered" />
                              ) : (
                                <Check size={12} className="text-on-surface-variant/70" title="Sent" />
                              )}
                            </span>
                          )}
                          <p className={`text-xs truncate ${convUnread > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                            {hasAudio ? (
                              <span className="inline-flex items-center gap-1 text-secondary font-medium">
                                <Volume2 size={12} />
                                <span>Voice Note</span>
                              </span>
                            ) : (
                              conv.lastMessage?.text || 'Say hi over a cup of chai ☕'
                            )}
                          </p>
                        </div>
                      )}
                      {convUnread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold shrink-0">
                          {convUnread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-on-surface-variant">
              <Coffee size={24} className="mx-auto mb-2 opacity-50 text-secondary" />
              <div className="text-xs font-semibold text-on-surface">No chats found</div>
              <div className="text-[11px] text-on-surface-variant mt-1">Start a conversation or join an active tapri</div>
            </div>
          )}
        </div>
      </div>

      {/* 6. BOTTOM FOOTER: User Profile, Theme Toggle & Settings */}
      <div className="p-3 border-t border-surface-variant/30 bg-surface-container-low flex items-center justify-between gap-2">
        {currentUser ? (
          <button
            type="button"
            onClick={onOpenProfile}
            title={`Open Profile (@${currentUser.username})`}
            className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 -ml-1 rounded-2xl hover:bg-surface-container transition-colors text-left cursor-pointer group"
          >
            <div className="relative shrink-0">
              <UserAvatar
                name={currentUser.displayName}
                username={currentUser.username}
                photoURL={currentUser.photoURL}
                size="sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-on-surface block truncate leading-tight group-hover:text-secondary transition-colors">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant block truncate">
                @{currentUser.username}
              </span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex-1 py-2 px-3 rounded-full bg-secondary-container text-on-secondary-container font-bold text-xs text-center hover:bg-secondary-fixed transition-colors cursor-pointer shadow-2xs"
          >
            Sign In
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Warmth ☕' : 'Switch to Nocturnal Lounge 🌙'}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun size={16} className="text-secondary" /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Preferences & Settings"
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Settings size={16} />
          </button>

          {currentUser && (
            <button
              id="unified-sidebar-expanded-logout-btn"
              type="button"
              onClick={() => onLogout()}
              title="Log Out of Berojgar"
              aria-label="Log Out of Berojgar"
              className="p-2 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer active:scale-95"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {renderNewChatModal()}

      {showCreateTapriModal && (
        <CreateTapriModal
          currentUser={currentUser}
          onClose={() => setShowCreateTapriModal(false)}
          onCreated={(newTapri) => {
            setShowCreateTapriModal(false);
            onNavigate('CHATS');
            onSelectConversation(newTapri.id);
          }}
        />
      )}
    </aside>
  );
};
