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
import { UserProfileModal } from './UserProfileModal';
import { AuthModal } from './AuthModal';

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Start outgoing call
  const handleStartCall = async (type: 'voice' | 'video', targetUser: UserProfile) => {
    if (!currentUser || !activeConversationId) return;

    try {
      // Create temporary offer descriptor to initiate signaling
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

      setActiveCall(session);
      pc.close();
    } catch (err) {
      console.warn('Call start issue:', err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // If user is not logged in, prompt Auth modal or show guest preview
  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-76px)] flex flex-col items-center justify-center p-6 bg-[#050505] text-center relative overflow-hidden">
        {/* Glowing background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d6ff62]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-lg z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-[#d6ff62] text-black flex items-center justify-center font-serif italic text-3xl font-bold mb-6 shadow-[0_0_30px_rgba(214,255,98,0.35)]">
            C
          </div>

          <h1 className="font-serif italic text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight">
            Welcome to Ciao
          </h1>

          <p className="font-sans text-sm text-white/70 max-w-md mb-8 leading-relaxed">
            The next-generation social messenger with real-time chatting, seen receipts, typing indicators, voice messages, reactions, and direct audio/video calling.
          </p>

          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-3.5 rounded-2xl bg-[#d6ff62] text-black font-mono text-sm font-bold uppercase tracking-wider hover:bg-[#e4ff8f] transition-all shadow-[0_0_25px_rgba(214,255,98,0.3)] active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span>Create Account or Sign In</span>
          </button>

          <span className="font-mono text-xs text-white/40 mt-4 block">
            Instagram-style username • No phone number required
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
    <div className="h-[calc(100vh-76px)] flex bg-[#050505] overflow-hidden">
      {/* Sidebar (List of chats and user search) */}
      <div
        className={`h-full w-full md:w-80 lg:w-96 shrink-0 ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatListSidebar
          currentUser={currentUser}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={onLogout}
          onStartNewDirectChat={handleStartNewChat}
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
          />
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center text-white/40 bg-[#050505]">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-[#d6ff62]">
              <MessageSquare size={28} />
            </div>
            <h2 className="font-serif italic text-2xl font-bold text-white mb-2">
              Select or Start a Chat
            </h2>
            <p className="font-mono text-xs max-w-sm text-white/50 mb-6">
              Pick a contact from the sidebar or search any @username in the network to begin messaging.
            </p>
          </div>
        )}
      </div>

      {/* Active Call Modal (Voice / Video) */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUser={currentUser}
          onClose={() => setActiveCall(null)}
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
