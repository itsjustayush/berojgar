import React, { useState } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  MessageSquarePlus,
  Coffee,
  CheckCircle2,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  Radio,
  Volume2,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import {
  searchUsers,
  GLOBAL_TAPRI_DEFINITIONS,
  getOrCreateTapri,
} from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';
import { CreateTapriModal } from './CreateTapriModal';

interface ChatListSidebarProps {
  currentUser: UserProfile;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onStartNewDirectChat: (targetUser: UserProfile) => void;
  onJoinTapri?: (tapriName: string) => void;
  onViewTapriPage?: (tapriName: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ChatListSidebar: React.FC<ChatListSidebarProps> = ({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenProfile,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                <MessageSquarePlus size={16} />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                New Conversation
              </h3>
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Search any registered @username or full name in the Berozgar network to start chatting.
          </p>

          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search @username or name..."
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
      <div className="w-[70px] h-full flex flex-col bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800 select-none items-center py-4 justify-between">
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={17} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="w-10 h-10 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Start new message"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 w-full overflow-y-auto py-2 space-y-2.5 flex flex-col items-center custom-scrollbar">
          {filteredConversations.map((conv) => {
            const isGroup = conv.type === 'group';
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversationId;
            const unreadCount = conv.unreadCounts?.[currentUser.uid] || 0;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`relative p-1 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/40'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isGroup ? (conv.tapriTitle || `#${conv.tapriName}`) : `${other.displayName} (@${other.username})`}
              >
                {isGroup ? (
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-mono font-bold text-sm">
                    #
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
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {renderNewChatModal()}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0B1120] border-r border-slate-200/80 dark:border-slate-800 select-none overflow-hidden transition-colors">
      {/* 1. TOP HEADER: Messages & Live Counter & Compose */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Messages
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live (6)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCreateTapriModal(true)}
            title="Create Chai Circle / Tapri"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Coffee size={15} className="text-orange-500" />
          </button>

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            title="New Direct Message"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Plus size={15} />
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer hidden md:flex"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 2. SEARCH INPUT WITH ⌘K BADGE */}
      <div className="p-3.5 pb-2">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchNetwork(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-11 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          <kbd className="absolute right-3 px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 3. FILTER CHIPS */}
      <div className="px-3.5 py-1.5 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto custom-scrollbar">
        {(['ALL', 'DMS', 'CIRCLES', 'PINNED'] as const).map((tab) => {
          const labels: Record<string, string> = {
            ALL: 'All',
            DMS: 'DMs',
            CIRCLES: 'Chai Circles',
            PINNED: 'Pinned',
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
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

      {/* 4. MAIN SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100/80 dark:divide-slate-800/50">
        {/* RECENT CHATS LIST */}
        <div className="p-3.5 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Recent Chats
          </span>

          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const unreadCount = conv.unreadCounts?.[currentUser.uid] || 0;
              const isGroupTapri = conv.type === 'group';

              if (isGroupTapri) {
                const tapriTitle = conv.tapriTitle || `#${conv.tapriName || 'Tapri'}`;
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Coffee size={18} />
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
                          {conv.lastMessage?.text || 'Group Tapri Lounge'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shrink-0">
                            {unreadCount}
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
                  onClick={() => onSelectConversation(conv.id)}
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
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold shrink-0">
                          {unreadCount}
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

      {renderNewChatModal()}

      {showCreateTapriModal && (
        <CreateTapriModal
          currentUser={currentUser}
          onClose={() => setShowCreateTapriModal(false)}
          onCreated={(newTapri) => {
            setShowCreateTapriModal(false);
            onSelectConversation(newTapri.id);
          }}
        />
      )}
    </div>
  );
};
