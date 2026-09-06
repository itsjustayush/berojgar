import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ViewMode, UserSession, RoomState, BundleItem, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { SocialPlatformScreen } from './components/SocialPlatformScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { RoomView } from './components/RoomView';
import { FilePreviewModal } from './components/FilePreviewModal';
import { HistoryScreen } from './components/HistoryScreen';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { UserProfilePage } from './components/UserProfilePage';
import { TapriPage } from './components/TapriPage';
import { generateRoomOTP, normalizeRoomId } from './lib/p2pEngine';
import { getOrCreateGuestSession, updateGuestNickname } from './lib/session';
import { callRoomRegistry } from './lib/roomRegistry';
import { auth, onAuthStateChanged } from './lib/firebase';
import {
  getCurrentUserProfile,
  signOutUser,
  setUserPresence,
  subscribeToUserConversations,
} from './lib/socialChatService';

const createInitialRoom = (session: UserSession, roomId = 'X-R92-K', hostId = session.id): RoomState => ({
  id: roomId,
  createdAt: Date.now(),
  hostId,
  activePeers: [{ id: session.id, name: session.identifier, isYou: true, status: 'ONLINE', latencyMs: 0, ip: 'P2P_DIRECT' }],
  bundleItems: [],
  messages: [],
  selectedTargetPeerId: 'ALL_BUNDLE',
});

function parseRouteFromLocation(): {
  view: ViewMode;
  profileUsername?: string;
  tapriName?: string;
} {
  const path = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;

  // 1. Check for Tapri parameter in URL:
  // e.g. /tapri=chai_n_code, /tapri/chai_n_code, ?tapri=chai_n_code, or #tapri=chai_n_code
  const tapriMatch =
    path.match(/[/.]*tapri=([^/?#]+)/i) ||
    path.match(/^\/tapri\/([^/?#]+)/i) ||
    search.match(/[?&]tapri=([^&#]+)/i) ||
    hash.match(/[#&]tapri=([^&#]+)/i);

  if (tapriMatch && tapriMatch[1]) {
    const tapriName = decodeURIComponent(tapriMatch[1]).trim().toLowerCase().replace(/^#/, '');
    return { view: 'TAPRI_PAGE', tapriName };
  }

  // 2. Check for Username profile page in URL:
  // e.g. /itsjustayush or /@itsjustayush
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const systemRoutes = ['chats', 'dashboard', 'room', 'history', 'landing', 'auth', 'api'];
  if (cleanPath && !systemRoutes.includes(cleanPath.toLowerCase()) && !cleanPath.includes('/')) {
    const username = decodeURIComponent(cleanPath).replace(/^@/, '').trim().toLowerCase();
    return { view: 'USER_PROFILE', profileUsername: username };
  }

  if (cleanPath.toLowerCase() === 'landing') return { view: 'LANDING' };
  if (cleanPath.toLowerCase() === 'dashboard') return { view: 'DASHBOARD' };
  if (cleanPath.toLowerCase() === 'room') return { view: 'ROOM' };
  if (cleanPath.toLowerCase() === 'history') return { view: 'HISTORY' };

  return { view: 'CHATS' };
}

async function findActiveRoom(roomId: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`/api/signal/rooms/${encodeURIComponent(roomId)}`);
    if (response.ok) return response.json();
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Room not found or expired.');
}

function clearRoomQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export default function App() {
  const [initialRoute] = useState(() => parseRouteFromLocation());
  const [session, setSession] = useState<UserSession>(() => getOrCreateGuestSession());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(initialRoute.view);
  const [profileUsername, setProfileUsername] = useState<string>(initialRoute.profileUsername || 'itsjustayush');
  const [tapriPageName, setTapriPageName] = useState<string>(initialRoute.tapriName || 'chai_n_code');
  const [targetTapri, setTargetTapri] = useState<string | null>(initialRoute.tapriName || null);
  const [pendingDirectChatUser, setPendingDirectChatUser] = useState<UserProfile | null>(null);
  const [latencyMs] = useState(12);
  const [room, setRoom] = useState<RoomState>(() => createInitialRoom(session));
  const [previewFile, setPreviewFile] = useState<BundleItem | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPrefillUsername, setAuthPrefillUsername] = useState('');

  const navigateToView = useCallback((view: ViewMode, options?: { username?: string; tapri?: string }) => {
    setCurrentView(view);
    if (view === 'USER_PROFILE' && options?.username) {
      setProfileUsername(options.username);
      window.history.pushState({}, '', `/${options.username}`);
    } else if (view === 'TAPRI_PAGE' && options?.tapri) {
      setTapriPageName(options.tapri);
      window.history.pushState({}, '', `/tapri=${options.tapri}`);
    } else if (view === 'CHATS' && options?.tapri) {
      setTargetTapri(options.tapri);
      window.history.pushState({}, '', `/`);
    } else if (view === 'CHATS') {
      window.history.pushState({}, '', '/');
    } else if (view === 'LANDING') {
      window.history.pushState({}, '', '/landing');
    } else if (view === 'DASHBOARD') {
      window.history.pushState({}, '', '/dashboard');
    } else if (view === 'HISTORY') {
      window.history.pushState({}, '', '/history');
    }
  }, []);

  // Listen to browser history navigation (Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromLocation();
      setCurrentView(route.view);
      if (route.profileUsername) setProfileUsername(route.profileUsername);
      if (route.tapriName) {
        setTapriPageName(route.tapriName);
        setTargetTapri(route.tapriName);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getCurrentUserProfile(user.uid);
        if (profile) {
          setCurrentUser(profile);
          setUserPresence(profile.uid, true);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsub();
  }, []);

  // Adapt site title to reflect number of new unread messages
  useEffect(() => {
    if (!currentUser) {
      document.title = 'Berozgar';
      return;
    }
    const unsub = subscribeToUserConversations(currentUser.uid, (convList) => {
      const totalUnread = convList.reduce((sum, conv) => {
        return sum + (conv.unreadCounts?.[currentUser.uid] || 0);
      }, 0);
      if (totalUnread > 0) {
        document.title = `(${totalUnread}) Berozgar`;
      } else {
        document.title = 'Berozgar';
      }
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // Check URL params for room joins
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const cleanRoom = roomParam ? normalizeRoomId(roomParam) : '';
    if (cleanRoom.length !== 6) return;

    let cancelled = false;
    findActiveRoom(cleanRoom)
      .then(async (activeRoom) => {
        if (cancelled) return;
        const registry = await callRoomRegistry('join', { roomCode: cleanRoom, peerId: session.id, peerName: session.identifier });
        setRoom(createInitialRoom(session, cleanRoom, registry.host_peer_id || activeRoom.hostPeerId || 'HOST_NODE'));
        clearRoomQuery();
        setCurrentView('ROOM');
      })
      .catch(() => {
        if (!cancelled) setJoinError('This room is no longer active. Ask the host for a fresh code.');
      });

    return () => { cancelled = true; };
  }, [session]);

  const handleUpdateNickname = (newName: string) => {
    const updated = updateGuestNickname(newName);
    setSession(updated);
    setRoom((prev) => ({ ...prev, activePeers: prev.activePeers.map((peer) => peer.isYou ? { ...peer, name: updated.identifier } : peer) }));
  };

  const handleCreateRoom = async () => {
    const newOtp = normalizeRoomId(generateRoomOTP());
    setJoinError(null);
    try {
      const registry = await callRoomRegistry('create', { roomCode: newOtp, peerId: session.id, peerName: session.identifier });
      if (!registry.active || registry.room_code !== newOtp) throw new Error('The shared room registry did not confirm room creation.');
      setRoom({ ...createInitialRoom(session, newOtp, registry.host_peer_id || session.id), messages: [{ id: `sys-${Date.now()}`, senderId: 'SYSTEM', senderName: 'BEROZGAR SYSTEM', text: `Private room ${newOtp} created. This room is now shared across active instances.`, timestamp: Date.now(), type: 'system' }] });
      setCurrentView('ROOM');
    } catch {
      setJoinError('Could not create a shared room right now. Please try again.');
    }
  };

  const handleJoinRoom = async (otpCode: string) => {
    const cleanOtp = normalizeRoomId(otpCode);
    if (cleanOtp.length !== 6) return;
    setJoinError(null);

    try {
      const activeRoom = await findActiveRoom(cleanOtp);
      const registry = await callRoomRegistry('join', { roomCode: cleanOtp, peerId: session.id, peerName: session.identifier });
      setRoom({ ...createInitialRoom(session, cleanOtp, registry.host_peer_id || activeRoom.hostPeerId || 'HOST_NODE'), messages: [{ id: `sys-${Date.now()}`, senderId: 'SYSTEM', senderName: 'BEROZGAR SYSTEM', text: `Joined room ${cleanOtp}. This instance is mapped to the shared active room.`, timestamp: Date.now(), type: 'system' }] });
      clearRoomQuery();
      setCurrentView('ROOM');
    } catch {
      setJoinError('No active room matches that code. Check the code or ask the host to reopen the room.');
    }
  };

  const handleLeaveRoom = () => {
    void callRoomRegistry('leave', { roomCode: room.id, peerId: session.id }).catch(() => {});
    setPreviewFile(null);
    setRoom(createInitialRoom(session));
    setCurrentView('DASHBOARD');
  };

  const handleAddBundleItem = (item: BundleItem) => setRoom((prev) => ({ ...prev, bundleItems: [item, ...prev.bundleItems] }));

  const handleDownloadFile = (file: BundleItem) => {
    if (!file.blobUrl) return;
    const anchor = document.createElement('a');
    anchor.href = file.blobUrl;
    anchor.download = file.name;
    anchor.rel = 'noreferrer';
    anchor.click();
  };

  const handleWipeSession = () => {
    if (!window.confirm('Wipe this tab’s in-memory files and messages? This cannot be undone.')) return;
    setRoom((prev) => ({ ...prev, bundleItems: [], messages: [{ id: `sys-${Date.now()}`, senderId: 'SYSTEM', senderName: 'BEROZGAR SYSTEM', text: 'Local session memory wiped.', timestamp: Date.now(), type: 'system' }] }));
  };

  const handleLogout = async () => {
    await signOutUser(currentUser?.uid);
    setCurrentUser(null);
  };

  return (
    <div className="app-shell min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <div className="noise-overlay" aria-hidden="true" />
      {currentView !== 'LANDING' && (
        <Navbar
          currentView={currentView}
          setView={(v) => navigateToView(v)}
          session={session}
          currentUser={currentUser}
          onOpenProfile={() => {
            if (currentUser) {
              navigateToView('USER_PROFILE', { username: currentUser.username });
            } else {
              setShowAuthModal(true);
            }
          }}
          onOpenAuth={() => {
            setAuthPrefillUsername('');
            setShowAuthModal(true);
          }}
          onUpdateNickname={handleUpdateNickname}
          latencyMs={latencyMs}
        />
      )}

      <main className="relative z-10 flex-1">
        {currentView === 'LANDING' && (
          <LandingPage
            currentUser={currentUser}
            onEnterLounge={() => navigateToView('CHATS')}
            onOpenAuth={(reserved) => {
              if (reserved) setAuthPrefillUsername(reserved);
              setShowAuthModal(true);
            }}
            onJoinRoom={(roomId) => {
              handleJoinRoom(roomId);
            }}
            onOpenTapri={(tapriName) => {
              setTargetTapri(tapriName);
              navigateToView('CHATS', { tapri: tapriName });
            }}
            onNavigateToTapriPage={(tapriName) => {
              navigateToView('TAPRI_PAGE', { tapri: tapriName });
            }}
          />
        )}

        {currentView === 'CHATS' && (
          <SocialPlatformScreen
            currentUser={currentUser}
            onLogin={(user) => {
              setCurrentUser(user);
              setShowAuthModal(false);
            }}
            onLogout={handleLogout}
            targetTapriName={targetTapri}
            onClearTargetTapriName={() => setTargetTapri(null)}
            pendingDirectChatUser={pendingDirectChatUser}
            onClearPendingDirectChatUser={() => setPendingDirectChatUser(null)}
            onNavigateToProfile={(username) => {
              navigateToView('USER_PROFILE', { username });
            }}
            onNavigateToTapriPage={(tapriName) => {
              navigateToView('TAPRI_PAGE', { tapri: tapriName });
            }}
          />
        )}

        {currentView === 'TAPRI_PAGE' && (
          <TapriPage
            tapriName={tapriPageName}
            currentUser={currentUser}
            onEnterTapriChat={(name) => {
              setTargetTapri(name);
              navigateToView('CHATS', { tapri: name });
            }}
            onNavigateHome={() => navigateToView('CHATS')}
            onViewUserProfile={(username) => {
              navigateToView('USER_PROFILE', { username });
            }}
          />
        )}

        {currentView === 'USER_PROFILE' && (
          <UserProfilePage
            username={profileUsername}
            currentUser={currentUser}
            onNavigateHome={() => navigateToView('CHATS')}
            onJoinTapri={(tapriName) => navigateToView('CHATS', { tapri: tapriName })}
            onStartDirectChat={(targetUser) => {
              setPendingDirectChatUser(targetUser);
              navigateToView('CHATS');
            }}
          />
        )}

        {(currentView === 'DASHBOARD' || currentView === 'AUTH') && (
          <DashboardScreen
            session={session}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            joinError={joinError}
            setView={setCurrentView}
            onUpdateNickname={handleUpdateNickname}
          />
        )}

        {currentView === 'ROOM' && (
          <RoomView
            room={room}
            session={session}
            onLeaveRoom={handleLeaveRoom}
            onPreviewFile={setPreviewFile}
            onAddBundleItem={handleAddBundleItem}
          />
        )}

        {currentView === 'HISTORY' && (
          <HistoryScreen
            bundleItems={room.bundleItems}
            onWipeSession={handleWipeSession}
          />
        )}
      </main>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownloadFile}
        />
      )}

      {showAuthModal && (
        <AuthModal
          initialUsername={authPrefillUsername}
          initialMode={authPrefillUsername ? 'signup' : 'signin'}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
          onCancel={() => setShowAuthModal(false)}
        />
      )}

      {currentView !== 'CHATS' && currentView !== 'LANDING' && (
        <footer className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-4 border-t border-white/10 px-5 py-5 font-mono text-[10px] uppercase tracking-[.16em] text-white/35 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <span>Berozgar / Social Messaging Platform</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={13} className="text-[#EF4E22]" />
                <span>Berozgar Network</span>
              </span>
              <span className="text-white/45">Realtime • Audio/Video WebRTC • Instagram-style Auth</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
