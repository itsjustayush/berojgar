import React, { useState } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Check,
  CheckCheck,
  User,
  LogOut,
  Sparkles,
  Phone,
  Video,
  Settings,
  Circle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { searchUsers, getOrCreateDirectConversation } from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';
import { BerozgarLogo } from './BerozgarLogo';

interface ChatListSidebarProps {
  currentUser: UserProfile;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onStartNewDirectChat: (targetUser: UserProfile) => void;
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
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingNetwork, setIsSearchingNetwork] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    // Check other participant
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

    if (conv.lastMessage?.text.toLowerCase().includes(q)) {
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
        username: 'unknown',
        displayName: 'User',
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

  const renderNewChatModal = () => {
    if (!showNewChatModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
        <div className="w-full max-w-md bg-[#101c36] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BerozgarLogo variant="icon" size="sm" />
              <h3 className="font-extrabold text-lg text-white" style={{ fontFamily: 'Mukta, sans-serif' }}>
                Start a New Chat
              </h3>
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="text-white/40 hover:text-white font-mono text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-white/60 mb-4 font-sans">
            Enter any Instagram-style @username to connect and message on Berozgar instantly.
          </p>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search @username or name..."
              value={searchQuery}
              onChange={(e) => handleSearchNetwork(e.target.value)}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 font-mono focus:outline-none focus:border-[#EF4E22]"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-white/5 flex-1 custom-scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => {
                    onStartNewDirectChat(user);
                    setShowNewChatModal(false);
                    setSearchQuery('');
                  }}
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <div className="shrink-0">
                    <UserAvatar
                      name={user.displayName}
                      username={user.username}
                      photoURL={user.photoURL}
                      size="sm"
                      showStatus
                      isOnline={user.status === 'online'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{user.displayName}</span>
                    <span className="text-[10px] font-mono text-[#EF4E22] block truncate">@{user.username}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-[#EF4E22] text-[#FFF9F3] font-mono text-[10px] font-bold shadow-sm">
                    Message
                  </span>
                </button>
              ))
            ) : searchQuery ? (
              <div className="p-4 text-center text-xs text-white/40 font-mono">
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-white/40 font-mono">
                Type a username above to search registered Berozgar users
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-[72px] h-full flex flex-col bg-[#0b1326] border-r border-white/10 select-none items-center py-3 justify-between">
        {/* Top Controls: Expand toggle and New Chat */}
        <div className="flex flex-col items-center gap-2.5 w-full px-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#EF4E22] flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-xs"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="w-10 h-10 rounded-xl bg-[#EF4E22]/15 hover:bg-[#EF4E22]/25 text-[#EF4E22] border border-[#EF4E22]/30 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            title="Start new chat with @username"
            aria-label="Start new chat"
          >
            <Plus size={18} />
          </button>

          <div className="w-8 h-[1px] bg-white/10 my-0.5" />
        </div>

        {/* Middle: Conversation Avatars */}
        <div className="flex-1 w-full overflow-y-auto py-1 px-2 space-y-2.5 flex flex-col items-center custom-scrollbar">
          {filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversationId;
            const unreadCount = conv.unreadCounts?.[currentUser.uid] || 0;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`relative p-1 rounded-2xl transition-all group cursor-pointer ${
                  isActive
                    ? 'ring-2 ring-[#EF4E22] bg-[#EF4E22]/20 shadow-[0_0_12px_rgba(239,78,34,0.35)]'
                    : 'hover:bg-white/10'
                }`}
                title={`${other.displayName} (@${other.username})`}
              >
                <UserAvatar
                  name={other.displayName || other.username}
                  username={other.username}
                  photoURL={other.photoURL}
                  size="md"
                  showStatus
                  isOnline={other.status === 'online'}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4E22] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: Profile & Logout */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 w-full px-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title={`Profile: ${currentUser.displayName} (@${currentUser.username})`}
          >
            <UserAvatar
              name={currentUser.displayName}
              username={currentUser.username}
              photoURL={currentUser.photoURL}
              size="sm"
              showStatus
              isOnline={currentUser.status === 'online'}
            />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>

        {renderNewChatModal()}
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#0b1326] border-r border-white/10 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#101c36]/70">
        <div className="flex items-center gap-2">
          <BerozgarLogo variant="compact" size="sm" />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="w-8 h-8 rounded-lg bg-[#EF4E22]/15 hover:bg-[#EF4E22]/25 text-[#EF4E22] border border-[#EF4E22]/30 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
            title="Start new chat with @username"
          >
            <Plus size={16} />
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex w-8 h-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 border border-white/10 items-center justify-center transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
            <Search size={14} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchNetwork(e.target.value)}
            placeholder="Search chats or @username..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#EF4E22] font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Conversations / Search Results list */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {/* Network User Search Results */}
        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="p-2 bg-white/2 border-b border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#EF4E22] px-2 py-1 block">
              Global Users ({searchResults.length})
            </span>
            {searchResults.map((user) => (
              <button
                key={user.uid}
                onClick={() => {
                  onStartNewDirectChat(user);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
              >
                <div className="shrink-0">
                  <UserAvatar
                    name={user.displayName}
                    username={user.username}
                    photoURL={user.photoURL}
                    size="md"
                    showStatus
                    isOnline={user.status === 'online'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{user.displayName}</span>
                  <span className="text-[11px] font-mono text-[#EF4E22]/90 block truncate">@{user.username}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#EF4E22]/15 text-[#EF4E22] border border-[#EF4E22]/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  Chat
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Existing Conversations */}
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const isActive = conv.id === activeConversationId;
            const unreadCount = conv.unreadCounts?.[currentUser.uid] || 0;
            const otherUid = other.uid;
            const isTyping = conv.typing?.[otherUid] && Date.now() - conv.typing[otherUid] < 4000;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-3.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#18284c]/70 border-l-2 border-[#EF4E22]'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Avatar with live status dot */}
                <div className="shrink-0">
                  <UserAvatar
                    name={other.displayName || other.username}
                    username={other.username}
                    photoURL={other.photoURL}
                    size="lg"
                    showStatus
                    isOnline={other.status === 'online'}
                  />
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white truncate">{other.displayName}</span>
                    <span className="text-[10px] font-mono text-white/40 shrink-0">
                      {formatTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {isTyping ? (
                      <span className="text-xs text-[#EF4E22] font-mono animate-pulse flex items-center gap-1">
                        <span>typing</span>
                        <span className="animate-bounce">...</span>
                      </span>
                    ) : (
                      <p className="text-xs text-white/60 truncate max-w-[180px]">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                    )}

                    {unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-[#EF4E22] text-[#FFF9F3] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center text-white/40">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-30 text-[#EF4E22]" />
            <p className="font-mono text-xs mb-1 text-white/70">No chats yet</p>
            <p className="text-[11px] text-white/40 mb-4">Search users above to start a conversation</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4E22] text-[#FFF9F3] font-mono text-xs font-bold hover:bg-[#f3643d] transition-colors shadow-md"
            >
              <Plus size={14} />
              <span>Find People</span>
            </button>
          </div>
        )}
      </div>

      {/* User Profile Bar at Bottom */}
      <div className="p-3 border-t border-white/10 bg-[#0c162b] flex items-center justify-between">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition-colors text-left flex-1 min-w-0 group cursor-pointer"
        >
          <div className="shrink-0">
            <UserAvatar
              name={currentUser.displayName}
              username={currentUser.username}
              photoURL={currentUser.photoURL}
              size="sm"
              showStatus
              isOnline={currentUser.status === 'online'}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-white block truncate group-hover:text-[#EF4E22] transition-colors">
              {currentUser.displayName}
            </span>
            <span className="text-[10px] font-mono text-white/50 block truncate">@{currentUser.username}</span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Profile & Settings"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* New Chat Dialog / Discover Modal */}
      {renderNewChatModal()}
    </div>
  );
};
