import React, { useState } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Coffee,
  CheckCircle2,
  Users,
  Compass,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Volume2,
  ChevronLeft,
  ChevronRight,
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
        id="unified-sidebar-collapsed"
        aria-label="Unified Navigation Sidebar"
        className="w-[72px] h-full shrink-0 flex flex-col bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800 select-none items-center py-3.5 justify-between transition-colors z-20"
      >
        <div className="flex flex-col items-center gap-4 w-full px-2">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            title="Berozgar - Home"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <Coffee size={20} className="stroke-[2.2] group-hover:rotate-6 transition-transform" />
          </button>

          {/* Primary View Navigation */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => onNavigate('CHATS')}
              title="Messages"
              className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                currentView === 'CHATS'
                  ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#0B1120]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('DIRECTORY')}
              title="Directory & Network"
              className={`w-10 h-10 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                currentView === 'DIRECTORY'
                  ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              <Compass size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onToggleCollapse) onToggleCollapse();
              }}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              className="w-10 h-10 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
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
                    ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/40'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isGroup ? (conv.tapriTitle || `#${conv.tapriName}`) : `${other.displayName} (@${other.username})`}
              >
                {isGroup ? (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-xs">
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
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {convUnread > 9 ? '9+' : convUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Warmth ☕' : 'Switch to Deep Navy 🌙'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Settings & Preferences"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <Settings size={17} />
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onOpenProfile}
              title={`@${currentUser.username} (${currentUser.displayName})`}
              className="relative rounded-full ring-2 ring-emerald-500/80 ring-offset-2 dark:ring-offset-[#0B1120] transition-transform hover:scale-105 cursor-pointer"
            >
              <UserAvatar
                name={currentUser.displayName}
                username={currentUser.username}
                photoURL={currentUser.photoURL}
                size="sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1120]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-orange-600 transition-colors cursor-pointer"
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
      className="w-full h-full flex flex-col bg-white dark:bg-[#0B1120] border-r border-slate-200/80 dark:border-slate-800 select-none overflow-hidden transition-colors"
    >
      {/* 1. TOP HEADER: Brand Logo, Status & Direct Actions */}
      <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            title="Berozgar - Home"
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 text-white flex items-center justify-center shadow-xs shadow-orange-500/20 shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Coffee size={18} className="stroke-[2.2]" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
              Berojgar
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live (6)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateTapriModal(true)}
            title="Create Chai Circle / Tapri"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Coffee size={15} className="text-orange-500" />
          </button>

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            title="New Direct Message"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Plus size={15} />
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer hidden md:flex"
            >
              <ChevronLeft size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. PRIMARY VIEW SWITCHER SEGMENT (Chats vs Directory) */}
      <div className="p-2 pb-1 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'CHATS'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chats</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('DIRECTORY')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'DIRECTORY'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass size={14} />
            <span>Directory</span>
          </button>
        </div>
      </div>

      {/* 3. SEARCH INPUT */}
      <div className="p-3 pb-2">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchNetwork(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8.5 pr-10 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-[9px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 4. FILTER CHIPS (All, DMs, Chai Circles, Pinned) */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto custom-scrollbar">
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
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* 5. MAIN SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100/80 dark:divide-slate-800/50">
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Recent Conversations
            </span>
            <span className="text-[10px] font-mono text-slate-400">
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
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Coffee size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tapriTitle}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                          {conv.lastMessage?.text || 'Chai Circle Lounge'}
                        </p>
                        {convUnread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shrink-0">
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

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    onNavigate('CHATS');
                    onSelectConversation(conv.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
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
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {other.displayName}
                        </span>
                        <CheckCircle2 size={13} className="text-blue-500 fill-blue-500/10 shrink-0" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                        {hasAudio ? (
                          <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                            <Volume2 size={12} />
                            <span>Voice Note</span>
                          </span>
                        ) : (
                          conv.lastMessage?.text || 'Say hi over a cup of chai ☕'
                        )}
                      </p>
                      {convUnread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shrink-0">
                          {convUnread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400">
              <Coffee size={24} className="mx-auto mb-2 opacity-40 text-orange-500" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">No chats found</div>
              <div className="text-[11px] text-slate-400 mt-1">Start a conversation or join an active tapri</div>
            </div>
          )}
        </div>
      </div>

      {/* 6. BOTTOM FOOTER: User Profile, Theme Toggle & Settings */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-2">
        {currentUser ? (
          <button
            type="button"
            onClick={onOpenProfile}
            title={`Open Profile (@${currentUser.username})`}
            className="flex items-center gap-2.5 min-w-0 flex-1 p-1 -ml-1 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer group"
          >
            <div className="relative shrink-0">
              <UserAvatar
                name={currentUser.displayName}
                username={currentUser.username}
                photoURL={currentUser.photoURL}
                size="sm"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1120]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate leading-tight group-hover:text-orange-500 transition-colors">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 block truncate">
                @{currentUser.username}
              </span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex-1 py-1.5 px-3 rounded-xl bg-orange-500 text-white font-semibold text-xs text-center hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Warmth ☕' : 'Switch to Deep Navy 🌙'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Preferences & Settings"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <Settings size={16} />
          </button>
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
