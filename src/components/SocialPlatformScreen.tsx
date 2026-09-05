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
  setUserPresence,
} from '../lib/socialChatService';
import { ChatListSidebar } from './ChatListSidebar';
import { SocialChatView } from './SocialChatView';
import { CallModal } from './CallModal';
import { GreenRoomModal, GreenRoomReadyConfig } from './GreenRoomModal';
import { UserProfileModal } from './UserProfileModal';
import { AuthModal } from './AuthModal';
import { BerozgarLogo } from './BerozgarLogo';

interface SocialPlatformScreenProps {
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const SocialPlatformScreen: React.FC<SocialPlatformScreenProps> = ({
  currentUser,
  onLogin,
  onLogout,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('berozgar_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

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
      const pc = new RTCPeerConnection();
      if (type === 'video') {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      }
      pc.addTransceiver('audio', { direction: 'sendrecv' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const offerInit: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: offer.sdp,
      };

      const callId = await initiateCall(
        activeConversationId,
        currentUser,
        targetUser,
        type,
        offerInit
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
        offer: offerInit,
        createdAt: Date.now(),
      };

      setCallPreConfig(config);
      setActiveCall(session);
      setStagingCall(null);
      pc.close();
    } catch (err) {
      console.warn('Call start issue:', err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // If user is not logged in, prompt Auth modal or show guest preview
  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center p-6 bg-[#080f21] text-center relative overflow-hidden">
        {/* Glowing background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#EF4E22]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-lg z-10 flex flex-col items-center">
          <div className="mb-6 shadow-[0_0_35px_rgba(239,78,34,0.35)] rounded-full">
            <BerozgarLogo variant="icon" size="xl" />
          </div>

          <div className="flex flex-col items-center mb-3">
            <h1
              className="text-4xl sm:text-5xl font-extrabold text-[#EF4E22] tracking-tight leading-none"
              style={{ fontFamily: 'Rozha One, Mukta, sans-serif' }}
            >
              बेरोजगार
            </h1>
            <span
              className="text-base sm:text-lg font-bold text-[#FFF9F3]/90 mt-1"
              style={{ fontFamily: 'Mukta, sans-serif' }}
            >
              चैट एप • BEROJGAR CHAT
            </span>
          </div>

          <p className="font-sans text-sm text-[#FFF9F3]/80 max-w-md mb-8 leading-relaxed">
            बस गपशप, बस बिला। Real-time messaging, photos, voice notes, seen receipts, and instant voice & video calls.
          </p>

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-3.5 rounded-2xl bg-[#EF4E22] text-[#FFF9F3] font-mono text-sm font-bold uppercase tracking-wider hover:bg-[#f3643d] transition-all shadow-[0_0_25px_rgba(239,78,34,0.4)] active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span>Create Account or Sign In</span>
          </button>

          <span className="font-mono text-xs text-white/50 mt-4 block">
            Instagram-style @username • No phone number required
          </span>
        </div>

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
          onSelectConversation={(id) => setActiveConversationId(id)}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={onLogout}
          onStartNewDirectChat={handleStartNewChat}
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
