import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Phone,
  Video,
  Shield,
  Search,
  Plus,
} from 'lucide-react';
import { UserProfile, Conversation, CallSession } from '../types';
import {
  subscribeToUserConversations,
  subscribeToIncomingCalls,
  initiateCall,
  getOrCreateDirectConversation,
  getOrCreateTapri,
  setUserPresence,
} from '../lib/socialChatService';
import { ChatListSidebar } from './ChatListSidebar';
import { SocialChatView } from './SocialChatView';
import { CallModal } from './CallModal';
import { GreenRoomModal, GreenRoomReadyConfig } from './GreenRoomModal';
import { UserProfileModal } from './UserProfileModal';
import { AuthModal } from './AuthModal';
import { BerozgarLogo } from './BerozgarLogo';
import { LandingPage } from './LandingPage';

interface SocialPlatformScreenProps {
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  targetTapriName?: string | null;
  onClearTargetTapriName?: () => void;
  pendingDirectChatUser?: UserProfile | null;
  onClearPendingDirectChatUser?: () => void;
  onNavigateToProfile?: (username: string) => void;
  onNavigateToTapriPage?: (tapriName: string) => void;
}

export const SocialPlatformScreen: React.FC<SocialPlatformScreenProps> = ({
  currentUser,
  onLogin,
  onLogout,
  targetTapriName,
  onClearTargetTapriName,
  pendingDirectChatUser,
  onClearPendingDirectChatUser,
  onNavigateToProfile,
  onNavigateToTapriPage,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callPreConfig, setCallPreConfig] = useState<GreenRoomReadyConfig | null>(null);
  const [stagingCall, setStagingCall] = useState<{
    type: 'voice' | 'video';
    targetUser: UserProfile;
  } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [prefilledUsername, setPrefilledUsername] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('berozgar_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Handle target Tapri auto-join when loaded via URL /tapri=name
  useEffect(() => {
    if (!targetTapriName || !currentUser) return;
    let isCancelled = false;

    getOrCreateTapri(targetTapriName, currentUser)
      .then((tapriConv) => {
        if (isCancelled) return;
        setActiveConversationId(tapriConv.id);
        onClearTargetTapriName?.();
      })
      .catch((err) => console.warn('Could not auto-join target Tapri:', err));

    return () => {
      isCancelled = true;
    };
  }, [targetTapriName, currentUser, onClearTargetTapriName]);

  // Handle pending direct chat user when navigating from UserProfilePage
  useEffect(() => {
    if (!pendingDirectChatUser || !currentUser) return;
    let isCancelled = false;

    getOrCreateDirectConversation(currentUser, pendingDirectChatUser)
      .then((convId) => {
        if (isCancelled) return;
        setActiveConversationId(convId);
        onClearPendingDirectChatUser?.();
      })
      .catch((err) => console.warn('Could not start direct chat:', err));

    return () => {
      isCancelled = true;
    };
  }, [pendingDirectChatUser, currentUser, onClearPendingDirectChatUser]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('berozgar_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Subscribe to user conversations when logged in
  useEffect(() => {
    if (!currentUser) return;

    // Set online presence
    setUserPresence(currentUser.uid, true);

    const handleBeforeUnload = () => {
      setUserPresence(currentUser.uid, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const unsubConvs = subscribeToUserConversations(currentUser.uid, (convList) => {
      setConversations(convList);
      // If there's an active conversation, keep it; or default to first if none selected
      if (!activeConversationId && convList.length > 0 && window.innerWidth >= 768) {
        setActiveConversationId(convList[0].id);
      }
    });

    // Subscribe to incoming audio/video calls
    const unsubCalls = subscribeToIncomingCalls(currentUser.uid, (incoming) => {
      if (incoming && !activeCall) {
        setActiveCall(incoming);
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setUserPresence(currentUser.uid, false);
      unsubConvs();
      unsubCalls();
    };
  }, [currentUser?.uid]);

  // Adapt site title to reflect number of new unread messages
  useEffect(() => {
    if (!currentUser) {
      document.title = 'Berozgar';
      return;
    }
    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCounts?.[currentUser.uid] || 0);
    }, 0);

    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Berozgar`;
    } else {
      document.title = 'Berozgar';
    }
  }, [conversations, currentUser]);

  // Handle starting a new direct chat with a user
  const handleStartNewChat = async (targetUser: UserProfile) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      const convId = await getOrCreateDirectConversation(currentUser, targetUser);
      setActiveConversationId(convId);
    } catch (err) {
      console.error('Failed to create direct chat:', err);
    }
  };

  // Start outgoing call via Green Room staging
  const handleStartCall = (type: 'voice' | 'video', targetUser: UserProfile) => {
    if (!currentUser || !activeConversationId) return;
    setStagingCall({ type, targetUser });
  };

  const handleJoinFromGreenRoom = async (config: GreenRoomReadyConfig) => {
    if (!currentUser || !activeConversationId || !stagingCall) return;
    const { targetUser } = stagingCall;
    const type = config.callType;

    try {
      const callId = await initiateCall(
        activeConversationId,
        currentUser,
        targetUser,
        type
      );

      const session: CallSession = {
        id: callId,
        conversationId: activeConversationId,
        callerId: currentUser.uid,
        callerName: currentUser.displayName,
        callerPhoto: currentUser.photoURL,
        receiverId: targetUser.uid,
        receiverName: targetUser.displayName,
        receiverPhoto: targetUser.photoURL,
        type,
        status: 'ringing',
        createdAt: Date.now(),
      };

      setCallPreConfig(config);
      setActiveCall(session);
      setStagingCall(null);
    } catch (err) {
      console.warn('Call start issue:', err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // If user is not logged in, render the full atmospheric landing page
  if (!currentUser) {
    return (
      <div className="w-full">
        <LandingPage
          currentUser={currentUser}
          onEnterLounge={() => setShowAuthModal(true)}
          onOpenAuth={(reserved) => {
            if (reserved) setPrefilledUsername(reserved);
            setShowAuthModal(true);
          }}
        />

        {showAuthModal && (
          <AuthModal
            initialUsername={prefilledUsername}
            initialMode={prefilledUsername ? 'signup' : 'signin'}
            onSuccess={(user) => {
              onLogin(user);
              setShowAuthModal(false);
            }}
            onCancel={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-72px)] flex bg-[#080f21] overflow-hidden min-h-[500px]">
      {/* Sidebar (List of chats and user search) */}
      <div
        className={`h-full shrink-0 transition-[width] duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-full md:w-[72px] lg:w-[72px]' : 'w-full md:w-80 lg:w-96'
        } ${activeConversationId ? 'hidden md:flex' : 'flex'}`}
      >
        <ChatListSidebar
          currentUser={currentUser}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            const selected = conversations.find((c) => c.id === id);
            if (selected?.type === 'group' && selected.tapriName) {
              window.history.pushState({}, '', `/tapri=${selected.tapriName}`);
            } else {
              window.history.pushState({}, '', '/');
            }
          }}
          onOpenProfile={() => {
            if (onNavigateToProfile && currentUser) {
              onNavigateToProfile(currentUser.username);
            } else {
              setShowProfileModal(true);
            }
          }}
          onLogout={onLogout}
          onStartNewDirectChat={handleStartNewChat}
          onViewTapriPage={onNavigateToTapriPage}
          onJoinTapri={async (tapriName) => {
            try {
              const tapriConv = await getOrCreateTapri(tapriName, currentUser);
              setActiveConversationId(tapriConv.id);
            } catch (e) {
              console.warn('Failed to join tapri:', e);
            }
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Active Conversation Area */}
      <div
        className={`h-full flex-1 ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <SocialChatView
            conversation={activeConversation}
            currentUser={currentUser}
            onBackToSidebar={() => setActiveConversationId(null)}
            onStartCall={handleStartCall}
            onViewTapriPage={onNavigateToTapriPage}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center text-white/40 bg-[#080f21]">
            <div className="w-16 h-16 rounded-3xl bg-[#EF4E22]/10 border border-[#EF4E22]/20 flex items-center justify-center mb-4 text-[#EF4E22]">
              <MessageSquare size={28} />
            </div>
            <h2 className="font-extrabold text-2xl text-white mb-2" style={{ fontFamily: 'Mukta, sans-serif' }}>
              Select or Start a Chat
            </h2>
            <p className="font-mono text-xs max-w-sm text-white/50 mb-6">
              Pick a contact from the sidebar or search any @username in Berozgar to begin chatting.
            </p>
            {isSidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs transition-colors cursor-pointer border border-white/10"
              >
                <span>Expand Sidebar</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Green Room Pre-Call Staging Modal */}
      {stagingCall && currentUser && (
        <GreenRoomModal
          currentUser={currentUser}
          targetUser={stagingCall.targetUser}
          initialCallType={stagingCall.type}
          onJoinCall={handleJoinFromGreenRoom}
          onCancel={() => setStagingCall(null)}
        />
      )}

      {/* Active Call Modal (Voice / Video) */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUser={currentUser}
          preConfig={callPreConfig}
          onClose={() => {
            setActiveCall(null);
            setCallPreConfig(null);
          }}
        />
      )}

      {/* User Profile & Settings Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={currentUser}
          onUpdate={(updated) => onLogin(updated)}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onSuccess={(user) => {
            onLogin(user);
            setShowAuthModal(false);
          }}
          onCancel={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};
