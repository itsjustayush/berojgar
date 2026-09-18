import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Coffee,
} from 'lucide-react';
import { UserProfile, Conversation, CallSession, ViewMode } from '../types';
import {
  subscribeToUserConversations,
  subscribeToIncomingCalls,
  initiateCall,
  getOrCreateDirectConversation,
  getOrCreateTapri,
  setUserPresence,
} from '../lib/socialChatService';
import { UnifiedSidebar } from './UnifiedSidebar';
import { SocialChatView } from './SocialChatView';
import { CallModal } from './CallModal';
import { GreenRoomModal, GreenRoomReadyConfig } from './GreenRoomModal';
import { UserProfileModal } from './UserProfileModal';
import { PreferencesModal } from './PreferencesModal';
import { AuthModal } from './AuthModal';
import { LandingPage } from './LandingPage';
import { DirectoryScreen } from './DirectoryScreen';

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
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [prefilledUsername, setPrefilledUsername] = useState('');
  const [currentRailView, setCurrentRailView] = useState<ViewMode>('CHATS');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('berozgar_theme');
      if (stored) return stored === 'dark';
      return false; // Default to the light warmth aesthetic shown in the images
    } catch {
      return false;
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('berozgar_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Sync dark mode class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('berozgar_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('berozgar_theme', 'light');
      } catch {}
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Handle target Tapri auto-join when loaded via URL /tapri=name
  useEffect(() => {
    if (!targetTapriName || !currentUser) return;
    let isCancelled = false;

    getOrCreateTapri(targetTapriName, currentUser)
      .then((tapriConv) => {
        if (isCancelled) return;
        setActiveConversationId(tapriConv.id);
        setCurrentRailView('CHATS');
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
        setCurrentRailView('CHATS');
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

    setUserPresence(currentUser.uid, true);

    const handleBeforeUnload = () => {
      setUserPresence(currentUser.uid, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const unsubConvs = subscribeToUserConversations(currentUser.uid, (convList) => {
      setConversations(convList);
      if (!activeConversationId && convList.length > 0 && window.innerWidth >= 768) {
        setActiveConversationId(convList[0].id);
      }
    });

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

  // Total unread messages calculation
  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (conv.unreadCounts?.[currentUser?.uid || ''] || 0);
  }, 0);

  // Adapt site title to reflect number of new unread messages
  useEffect(() => {
    if (!currentUser) {
      document.title = 'Berozgar';
      return;
    }
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Berozgar`;
    } else {
      document.title = 'Berozgar';
    }
  }, [totalUnread, currentUser]);

  // Start new direct chat
  const handleStartNewChat = async (targetUser: UserProfile) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    try {
      const convId = await getOrCreateDirectConversation(currentUser, targetUser);
      setActiveConversationId(convId);
      setCurrentRailView('CHATS');
    } catch (err) {
      console.error('Failed to create direct chat:', err);
    }
  };

  // Start outgoing call
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

  // If user is not logged in, render atmospheric landing page
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
    <div className="h-[calc(100dvh-64px)] flex bg-[#F8F9FA] dark:bg-[#080F21] overflow-hidden min-h-[500px] transition-colors">
      {/* COMBINED UNIFIED SIDEBAR (Navigation Rail + Chat & Circle Directory) */}
      <div
        className={`h-full shrink-0 transition-[width] duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-full md:w-80 lg:w-[350px]'
        } ${activeConversationId && currentRailView === 'CHATS' ? 'hidden md:flex' : 'flex'}`}
      >
        <UnifiedSidebar
          currentView={currentRailView}
          onNavigate={(view) => setCurrentRailView(view)}
          currentUser={currentUser}
          onOpenSettings={() => setShowPreferencesModal(true)}
          onOpenProfile={() => {
            if (onNavigateToProfile && currentUser) {
              onNavigateToProfile(currentUser.username);
            } else {
              setShowProfileModal(true);
            }
          }}
          onOpenAuth={() => setShowAuthModal(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          unreadCount={totalUnread}
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

      {/* VIEW SWITCHER: DIRECTORY vs CHATS */}
      {currentRailView === 'DIRECTORY' ? (
        <DirectoryScreen
          currentUser={currentUser}
          onStartChat={(targetUser) => handleStartNewChat(targetUser)}
          onOpenTapri={async (tapriName) => {
            try {
              const tapriConv = await getOrCreateTapri(tapriName, currentUser);
              setActiveConversationId(tapriConv.id);
              setCurrentRailView('CHATS');
            } catch (err) {
              console.warn('Failed to join tapri from directory:', err);
            }
          }}
          onViewProfile={(username) => {
            if (onNavigateToProfile) onNavigateToProfile(username);
          }}
        />
      ) : (
        <>
          {/* ACTIVE CONVERSATION & DETAILS DRAWER */}
          <div
            className={`h-full flex-1 min-w-0 ${
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
                onViewProfile={onNavigateToProfile}
              />
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-[#F8F9FA] dark:bg-[#080F21]">
                <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400 shadow-xs">
                  <Coffee size={28} />
                </div>
                <h2 className="font-bold text-xl text-slate-900 dark:text-white mb-1.5">
                  Select a Chat or Join a Tapri
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">
                  Select a contact from your recent conversations, drop by a live Chai Tapri, or search the Berozgar network.
                </p>
                {isSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-orange-500 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Expand Sidebar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

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

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={currentUser}
          onUpdate={(updated) => onLogin(updated)}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Preferences Hub Modal (Image 5(1)) */}
      {showPreferencesModal && (
        <PreferencesModal
          user={currentUser}
          onUpdate={(updated) => onLogin(updated)}
          onClose={() => setShowPreferencesModal(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
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
