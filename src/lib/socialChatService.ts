import {
  db,
  auth,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  addDoc,
  getDocs,
  deleteDoc,
  arrayUnion,
  increment,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from './firebase';
import { UserProfile, Conversation, SocialMessage, CallSession, GuestbookNote } from '../types';
import { generateSvgAvatar } from './avatarGenerator';

// Converts any username to standard format: lowercase alphanumeric and underscore only
export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

// Map username to synthetic internal auth email for Firebase Auth
function usernameToEmail(username: string): string {
  const clean = sanitizeUsername(username);
  return `${clean}@berozgar-app.io`;
}

// Generate default avatar if user doesn't provide one (returns empty string so UserAvatar component renders standard minimal avatar)
export function generateDefaultAvatar(_name?: string, _username?: string): string {
  return '';
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const clean = sanitizeUsername(username);
  if (!clean || clean.length < 3) return false;
  try {
    const docRef = doc(db, 'usernames', clean);
    const snap = await getDoc(docRef);
    return !snap.exists();
  } catch (err) {
    console.error('Error checking username availability:', err);
    return true;
  }
}

/**
 * Register account with unique username and password (Instagram style)
 */
export async function signUpWithUsername(
  rawUsername: string,
  displayName: string,
  password: string,
  bio = 'Available on Berozgar',
  avatarUrl?: string
): Promise<UserProfile> {
  const cleanUsername = sanitizeUsername(rawUsername);
  if (cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 alphanumeric characters or underscores.');
  }

  // Check username uniqueness
  const isAvailable = await checkUsernameAvailable(cleanUsername);
  if (!isAvailable) {
    throw new Error(`@${cleanUsername} is already taken. Please choose another username.`);
  }

  const email = usernameToEmail(cleanUsername);
  // Clean safe photoURL: never pass oversized data strings to Firebase Auth updateProfile
  const safePhoto = (avatarUrl && avatarUrl.startsWith('http') && avatarUrl.length < 500) ? avatarUrl : '';

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Firebase Auth updateProfile only requires valid short attributes
  await updateProfile(userCredential.user, {
    displayName: displayName.trim() || `@${cleanUsername}`,
  });

  const profile: UserProfile = {
    uid,
    username: cleanUsername,
    displayName: displayName.trim() || `@${cleanUsername}`,
    photoURL: safePhoto,
    bio: bio.trim() || 'Available on Berozgar',
    status: 'online',
    lastSeen: Date.now(),
    createdAt: Date.now(),
  };

  // Save in /users/{uid}
  await setDoc(doc(db, 'users', uid), profile);

  // Claim username in /usernames/{username}
  await setDoc(doc(db, 'usernames', cleanUsername), {
    uid,
    createdAt: Date.now(),
  });

  return profile;
}

/**
 * Sign in using unique username and password
 */
export async function signInWithUsername(
  rawUsername: string,
  password: string
): Promise<UserProfile> {
  const cleanUsername = sanitizeUsername(rawUsername);
  if (!cleanUsername) {
    throw new Error('Please enter your username.');
  }

  const email = usernameToEmail(cleanUsername);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  let profile = await getCurrentUserProfile(uid);

  if (!profile) {
    // Self-heal profile if needed
    profile = {
      uid,
      username: cleanUsername,
      displayName: userCredential.user.displayName || `@${cleanUsername}`,
      photoURL: '',
      bio: 'Available on Berozgar',
      status: 'online',
      lastSeen: Date.now(),
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', uid), profile);
  } else {
    await updateDoc(doc(db, 'users', uid), {
      status: 'online',
      lastSeen: Date.now(),
    });
    profile.status = 'online';
    profile.lastSeen = Date.now();
  }

  return profile;
}

/**
 * Sign out current user and set status to offline
 */
export async function signOutUser(currentUid?: string): Promise<void> {
  if (currentUid) {
    try {
      await updateDoc(doc(db, 'users', currentUid), {
        status: 'offline',
        lastSeen: Date.now(),
      });
    } catch {
      // Ignore if offline
    }
  }
  await signOut(auth);
}

/**
 * Fetch a user profile by UID
 */
export async function getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates);
}

/**
 * Update presence
 */
export async function setUserPresence(uid: string, isOnline: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      status: isOnline ? 'online' : 'offline',
      lastSeen: Date.now(),
    });
  } catch {
    // Ignore error
  }
}

/**
 * Search users by username or display name
 */
export async function searchUsers(searchTerm: string, currentUid: string): Promise<UserProfile[]> {
  const term = searchTerm.trim().toLowerCase().replace(/^@/, '');
  if (!term) return [];

  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(query(usersRef, limit(30)));
    const results: UserProfile[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      if (data.uid === currentUid) return;

      const uName = (data.username || '').toLowerCase();
      const dName = (data.displayName || '').toLowerCase();

      if (uName.includes(term) || dName.includes(term)) {
        results.push(data);
      }
    });

    return results;
  } catch (err) {
    console.error('Error searching users:', err);
    return [];
  }
}

/**
 * Direct conversation helper: get existing or create new
 */
export async function getOrCreateDirectConversation(
  currentUser: UserProfile,
  targetUser: UserProfile
): Promise<string> {
  // Deterministic ID for 1:1 conversation so both participants find the exact same chat
  const sortedUids = [currentUser.uid, targetUser.uid].sort();
  const convId = `dm_${sortedUids[0]}_${sortedUids[1]}`;

  const convRef = doc(db, 'conversations', convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    const newConv: Conversation = {
      id: convId,
      type: 'direct',
      participants: sortedUids,
      participantDetails: {
        [currentUser.uid]: {
          uid: currentUser.uid,
          username: currentUser.username,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          status: currentUser.status,
          lastSeen: currentUser.lastSeen,
        },
        [targetUser.uid]: {
          uid: targetUser.uid,
          username: targetUser.username,
          displayName: targetUser.displayName,
          photoURL: targetUser.photoURL,
          status: targetUser.status,
          lastSeen: targetUser.lastSeen,
        },
      },
      lastMessage: {
        text: 'Started conversation',
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp: Date.now(),
        type: 'system',
      },
      typing: {},
      unreadCounts: {
        [currentUser.uid]: 0,
        [targetUser.uid]: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(convRef, newConv);
  } else {
    // Keep participant status and details refreshed
    await updateDoc(convRef, {
      [`participantDetails.${currentUser.uid}.status`]: currentUser.status,
      [`participantDetails.${currentUser.uid}.lastSeen`]: currentUser.lastSeen,
      [`participantDetails.${currentUser.uid}.photoURL`]: currentUser.photoURL,
      [`participantDetails.${currentUser.uid}.displayName`]: currentUser.displayName,
    });
  }

  return convId;
}

/**
 * Subscribe to all conversations for current user
 */
export function subscribeToUserConversations(
  currentUid: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const convsRef = collection(db, 'conversations');
  const q = query(
    convsRef,
    where('participants', 'array-contains', currentUid),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const convList: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        convList.push(docSnap.data() as Conversation);
      });
      callback(convList);
    },
    (err) => {
      console.error('Error subscribing to conversations:', err);
    }
  );
}

/**
 * Subscribe to messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: SocialMessage[]) => void
): () => void {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(150));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: SocialMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push(docSnap.data() as SocialMessage);
      });
      callback(msgs);
    },
    (err) => {
      console.error('Error subscribing to messages:', err);
    }
  );
}

/**
 * Send a message
 */
export async function sendSocialMessage(
  conversationId: string,
  messageData: Omit<SocialMessage, 'id' | 'timestamp' | 'status'>
): Promise<string> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const msgDocRef = doc(messagesRef);
  const timestamp = Date.now();

  const fullMessage: SocialMessage = {
    ...messageData,
    id: msgDocRef.id,
    conversationId,
    timestamp,
    status: 'delivered',
    seenBy: [messageData.senderId],
    reactions: {},
  };

  await setDoc(msgDocRef, fullMessage);

  // Update conversation last message, increment unread count for other participants, and reset typing
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  const convData = convSnap.exists() ? (convSnap.data() as Conversation) : null;

  const updatePayload: Record<string, unknown> = {
    lastMessage: {
      text: fullMessage.type === 'image'
        ? '📷 Photo'
        : fullMessage.type === 'video'
        ? '🎥 Video'
        : fullMessage.type === 'audio'
        ? '🎤 Voice message'
        : fullMessage.type === 'file'
        ? `📎 ${fullMessage.mediaName || 'File'}`
        : fullMessage.text,
      senderId: fullMessage.senderId,
      senderName: fullMessage.senderName,
      timestamp,
      type: fullMessage.type,
    },
    updatedAt: timestamp,
    [`typing.${messageData.senderId}`]: 0,
  };

  if (convData && convData.participants) {
    convData.participants.forEach((uid) => {
      if (uid !== messageData.senderId) {
        updatePayload[`unreadCounts.${uid}`] = increment(1);
      }
    });
  }

  await updateDoc(convRef, updatePayload);

  return msgDocRef.id;
}

/**
 * Mark messages as seen
 */
export async function markMessagesAsSeen(
  conversationId: string,
  currentUid: string
): Promise<void> {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('status', 'in', ['sent', 'delivered']),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const updates: Promise<void>[] = [];

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data() as SocialMessage;
      if (msg.senderId !== currentUid) {
        updates.push(
          updateDoc(docSnap.ref, {
            status: 'seen',
            seenBy: Array.from(new Set([...(msg.seenBy || []), currentUid])),
            [`readAt.${currentUid}`]: Date.now(),
          })
        );
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
      // Reset unread count for current user
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCounts.${currentUid}`]: 0,
      });
    }
  } catch (err) {
    console.error('Error marking messages as seen:', err);
  }
}

/**
 * Set typing indicator
 */
export async function setTypingStatus(
  conversationId: string,
  currentUid: string,
  isTyping: boolean
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`typing.${currentUid}`]: isTyping ? Date.now() : 0,
    });
  } catch {
    // Silently ignore
  }
}

/**
 * Toggle emoji reaction on message
 */
export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  currentUid: string,
  emoji: string
): Promise<void> {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;

  const msg = snap.data() as SocialMessage;
  const reactions = { ...(msg.reactions || {}) };
  const currentReactors = reactions[emoji] || [];

  if (currentReactors.includes(currentUid)) {
    // Remove reaction
    reactions[emoji] = currentReactors.filter((id) => id !== currentUid);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    // Add reaction
    reactions[emoji] = [...currentReactors, currentUid];
  }

  await updateDoc(msgRef, { reactions });
}

// -------------------------------------------------------------
// WEBRTC CALLING SERVICE (Signaling via Firestore)
// -------------------------------------------------------------

export async function initiateCall(
  conversationId: string,
  caller: UserProfile,
  receiver: UserProfile,
  type: 'voice' | 'video',
  offer?: RTCSessionDescriptionInit
): Promise<string> {
  const callDocRef = doc(collection(db, 'calls'));
  const callId = callDocRef.id;

  const callData: CallSession = {
    id: callId,
    conversationId,
    callerId: caller.uid,
    callerName: caller.displayName,
    callerPhoto: caller.photoURL,
    receiverId: receiver.uid,
    receiverName: receiver.displayName,
    receiverPhoto: targetAvatar(receiver),
    type,
    status: 'ringing',
    ...(offer ? { offer } : {}),
    callerCandidates: [],
    receiverCandidates: [],
    createdAt: Date.now(),
  };

  await setDoc(callDocRef, callData);

  // Also log call message in conversation
  await sendSocialMessage(conversationId, {
    conversationId,
    senderId: caller.uid,
    senderUsername: caller.username,
    senderName: caller.displayName,
    senderPhoto: caller.photoURL,
    text: `Started ${type} call`,
    type: 'call_log',
  });

  return callId;
}

export async function updateCallOffer(
  callId: string,
  offer: RTCSessionDescriptionInit
): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { offer });
}

function targetAvatar(user: UserProfile): string {
  return user.photoURL || '';
}

export function subscribeToIncomingCalls(
  currentUid: string,
  callback: (call: CallSession | null) => void
): () => void {
  const callsRef = collection(db, 'calls');
  // Listen for calls where receiver is current user and status is ringing
  const q = query(
    callsRef,
    where('receiverId', '==', currentUid),
    where('status', '==', 'ringing'),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const call = snapshot.docs[0].data() as CallSession;
      callback(call);
    } else {
      callback(null);
    }
  });
}

export function subscribeToCallSession(
  callId: string,
  callback: (call: CallSession | null) => void
): () => void {
  const callRef = doc(db, 'calls', callId);
  return onSnapshot(callRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as CallSession);
    } else {
      callback(null);
    }
  });
}

export async function answerCall(
  callId: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    status: 'accepted',
    answer,
  });
}

export async function placeInWaitingRoom(
  callId: string,
  guest: { uid: string; name: string; photo?: string }
): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  const snap = await getDoc(callRef);
  if (!snap.exists()) return;
  const data = snap.data() as CallSession;
  const existing = data.waitingGuests || [];
  const updated = [
    ...existing.filter((g) => g.uid !== guest.uid),
    { ...guest, joinedAt: Date.now() },
  ];
  await updateDoc(callRef, {
    status: 'waiting_room',
    waitingGuests: updated,
  });
}

export async function admitGuestToCall(callId: string, guestUid?: string): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  const snap = await getDoc(callRef);
  if (!snap.exists()) return;
  const data = snap.data() as CallSession;
  const remaining = guestUid
    ? (data.waitingGuests || []).filter((g) => g.uid !== guestUid)
    : [];

  await updateDoc(callRef, {
    status: 'accepted',
    waitingGuests: remaining,
  });
}

export async function setCallHostMessage(callId: string, hostMessage: string): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { hostMessage });
}

export async function toggleCallHandRaise(
  callId: string,
  userId: string,
  raised: boolean
): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, {
    [`handRaised.${userId}`]: raised,
  });
}

export async function recordIceRestart(callId: string, count: number): Promise<void> {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, { reconnectCount: count });
  } catch {}
}

export async function addCallIceCandidate(
  callId: string,
  role: 'caller' | 'receiver',
  candidate: RTCIceCandidateInit
): Promise<void> {
  try {
    const callRef = doc(db, 'calls', callId);
    const field = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
    await updateDoc(callRef, {
      [field]: arrayUnion(candidate),
    });
  } catch (err) {
    console.warn('Error adding ICE candidate:', err);
  }
}

export async function endCallSession(
  callId: string,
  status: 'ended' | 'declined' | 'missed' = 'ended',
  duration = 0
): Promise<void> {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status,
      endedAt: Date.now(),
      duration,
    });
  } catch {
    // Ignore error
  }
}

// -------------------------------------------------------------
// TAPRI (GROUP CHAT) SERVICES & GLOBAL TAPRIS
// -------------------------------------------------------------

export function sanitizeTapriName(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim().toLowerCase();
  // Strip url prefixes or parameter prefixes
  if (clean.includes('tapri=')) {
    clean = clean.split('tapri=')[1];
  } else if (clean.includes('/tapri/')) {
    clean = clean.split('/tapri/')[1];
  }
  // Strip url encoding, query params, trailing slashes, leading hash
  clean = clean.split('?')[0].split('&')[0].split('#')[0];
  clean = clean.replace(/^\/+/, '').replace(/\/+$/, '').replace(/^#/, '');
  clean = clean.replace(/[^a-z0-9_]/g, '');
  return clean;
}

export const GLOBAL_TAPRI_DEFINITIONS = [
  {
    name: 'chai_n_code',
    title: 'Chai & Code',
    tag: '#chai_n_code',
    description: 'Late Night Coding, Rust, & Lofi beats stream. Debugging silent sessions with chill background sitar beats and occasional PR venting.',
    isPublic: true,
    activeChillersCount: 82,
    welcomeText: 'Swagat hai to #chai_n_code! ☕ Drop your late-night git diffs, coffee vs chai debates, or bugs you cannot fix.',
  },
  {
    name: 'startup_fumbles',
    title: 'Startup Fumbles',
    tag: '#startup_fumbles',
    description: 'Honest pivoting stories, career rants & unhinged debugging. Real talk without LinkedIn fluff.',
    isPublic: true,
    activeChillersCount: 114,
    welcomeText: 'Welcome to #startup_fumbles! 🔥 Share your 0-revenue moments, awkward investor calls, and lessons learned.',
  },
  {
    name: 'valorant_3am',
    title: 'Valorant 3AM',
    tag: '#valorant_3am',
    description: 'Unranked late-night chill squad. Wholesome, zero toxicity, high ping solidarity.',
    isPublic: true,
    activeChillersCount: 24,
    welcomeText: 'Squad up! 🎮 5-stack unranked late night. No rage quitting permitted.',
  },
];

export async function getOrCreateTapri(
  rawName: string,
  currentUser?: UserProfile | null,
  options?: { title?: string; description?: string; isPublic?: boolean }
): Promise<Conversation> {
  const tapriName = sanitizeTapriName(rawName) || 'chai_n_code';
  const convId = `tapri_${tapriName}`;
  const convRef = doc(db, 'conversations', convId);

  // Find matching default definition if exists
  const def = GLOBAL_TAPRI_DEFINITIONS.find((d) => d.name === tapriName);
  const title = options?.title || def?.title || `#${tapriName}`;
  const description = options?.description || def?.description || `Late night Tapri group for #${tapriName}`;
  const isPublic = options?.isPublic !== undefined ? options.isPublic : (def?.isPublic ?? true);

  try {
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const existing = snap.data() as Conversation;
      // If currentUser is provided, ensure they are in participants
      if (currentUser && !existing.participants.includes(currentUser.uid)) {
        await updateDoc(convRef, {
          participants: arrayUnion(currentUser.uid),
          [`participantDetails.${currentUser.uid}`]: {
            uid: currentUser.uid,
            username: currentUser.username,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL || '',
            status: currentUser.status || 'online',
            lastSeen: Date.now(),
          },
          updatedAt: Date.now(),
        });
        existing.participants.push(currentUser.uid);
        existing.participantDetails[currentUser.uid] = {
          uid: currentUser.uid,
          username: currentUser.username,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL || '',
          status: currentUser.status || 'online',
          lastSeen: Date.now(),
        };
      }
      return existing;
    }
  } catch (err) {
    console.warn('Tapri fetch error, bootstrapping:', err);
  }

  // Create new Tapri Conversation
  const participants = currentUser ? [currentUser.uid] : ['system_tapri_bot'];
  const participantDetails: Conversation['participantDetails'] = {
    system_tapri_bot: {
      uid: 'system_tapri_bot',
      username: 'tapri_bot',
      displayName: 'Tapri Master ☕',
      photoURL: '',
      status: 'online',
      lastSeen: Date.now(),
    },
  };

  if (currentUser) {
    participantDetails[currentUser.uid] = {
      uid: currentUser.uid,
      username: currentUser.username,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL || '',
      status: currentUser.status || 'online',
      lastSeen: Date.now(),
    };
  }

  const newTapri: Conversation = {
    id: convId,
    type: 'group',
    tapriName,
    tapriTitle: title,
    tapriTag: `#${tapriName}`,
    tapriDescription: description,
    tapriIsPublic: isPublic,
    creatorId: currentUser?.uid || 'system',
    activeChillersCount: def?.activeChillersCount || 1,
    participants,
    participantDetails,
    lastMessage: {
      text: def?.welcomeText || `Tapri #${tapriName} opened! Share the link: https://berojgarchat.vercel.app/tapri=${tapriName}`,
      senderId: 'system_tapri_bot',
      senderName: 'Tapri Master ☕',
      timestamp: Date.now(),
      type: 'system',
    },
    typing: {},
    unreadCounts: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    await setDoc(convRef, newTapri);
  } catch (e) {
    console.warn('Could not persist Tapri to Firestore, using local fallback:', e);
  }

  return newTapri;
}

export async function getGlobalTapris(currentUser?: UserProfile | null): Promise<Conversation[]> {
  const list: Conversation[] = [];
  for (const def of GLOBAL_TAPRI_DEFINITIONS) {
    try {
      const tapri = await getOrCreateTapri(def.name, currentUser, {
        title: def.title,
        description: def.description,
        isPublic: def.isPublic,
      });
      list.push(tapri);
    } catch {
      // Fallback
      list.push({
        id: `tapri_${def.name}`,
        type: 'group',
        tapriName: def.name,
        tapriTitle: def.title,
        tapriTag: def.tag,
        tapriDescription: def.description,
        tapriIsPublic: def.isPublic,
        activeChillersCount: def.activeChillersCount,
        participants: currentUser ? [currentUser.uid] : [],
        participantDetails: {},
        lastMessage: {
          text: def.welcomeText,
          senderId: 'system',
          senderName: 'Tapri Master ☕',
          timestamp: Date.now(),
          type: 'system',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }
  return list;
}

// -------------------------------------------------------------
// USER PROFILE & CUSTOM SPACE SERVICES
// -------------------------------------------------------------

export const DEFAULT_AYUSH_PROFILE: UserProfile = {
  uid: 'itsjustayush_profile_id',
  username: 'itsjustayush',
  displayName: 'Ayush Sharma',
  photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJe3nbFkQtKoCqm58K9RWFUmmJDmwlBWkKle2F7gG78lnABk7MgwBG-dT0ouL8iX_khyY95fEomvvG-Mav-viTSqG8xkGPTYmOgehmiBnAexGhUB-7p_AcfOQctOvefLN5YW0533nD1VkTSwDECqOtUD_T2elfvO72IfGYaTdk5sjMUb81TbZPmDKaVEX8CKuwhtEARdIeC0riHD1iFEnL5iYurlWarMCXcEm14KOdmmxtWoAZAXWV',
  bio: 'Building late-night side-projects & breaking state engines. Chai > Coffee ☕ | Rust, React, and Valorant at 3 AM. If my lounge mic is green, feel free to hop in and talk philosophy or bugs.',
  status: 'online',
  lastSeen: Date.now(),
  createdAt: 1700000000000,
  customHindiName: 'आयुष',
  customVibeTag: 'Late-night coder',
  customStatusEmoji: 'React 19 & Chai',
  customLocation: 'Delhi, IN • 02:45 AM',
  customThemeAura: 'aurora',
  customAudioSnippetTitle: 'vibe_snip_3am.wav',
  customAudioSnippetDate: 'Recorded yesterday',
  customAudioSnippetDuration: '0:14',
  broadcastCurrentLounge: true,
  allowVoicePings: true,
  chaiCount: 1280,
  loungeHours: 142,
  audioSnippetsCount: 48,
  favoriteLounges: ['#chai_n_code', '#startup_fumbles', '#valorant_3am'],
  guestbookNotes: [
    {
      id: 'gb_1',
      senderName: 'Samay V.',
      senderUsername: 'samay_v',
      text: 'Bhai Valorant lobby me aao, unranked 5-stack full chill scene hai. Need 1 smoke player!',
      timestamp: Date.now() - 42 * 60 * 1000,
      avatarInitials: 'SV',
    },
    {
      id: 'gb_2',
      senderName: 'Tanvi Vibes',
      senderUsername: 'tanvi_vibes',
      text: 'Awesome lofi playlist you shared in the #chai_n_code room yesterday! Kept me awake for design sprints. 🎧',
      timestamp: Date.now() - 3 * 3600 * 1000,
      avatarInitials: 'TV',
    },
  ],
};

export async function getUserProfileByUsername(rawUsername: string): Promise<UserProfile> {
  const clean = sanitizeUsername(rawUsername);

  // Check LocalStorage cache first for customizations
  let localSaved: Partial<UserProfile> = {};
  try {
    const raw = localStorage.getItem(`berozgar_custom_space_${clean}`);
    if (raw) {
      localSaved = JSON.parse(raw);
    }
  } catch {}

  // If user is Ayush Sharma
  if (clean === 'itsjustayush') {
    return {
      ...DEFAULT_AYUSH_PROFILE,
      ...localSaved,
      guestbookNotes: [
        ...(localSaved.guestbookNotes || []),
        ...DEFAULT_AYUSH_PROFILE.guestbookNotes!,
      ],
    };
  }

  // Try lookup from Firestore /usernames/{clean} -> /users/{uid}
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', clean));
    if (usernameDoc.exists()) {
      const uid = usernameDoc.data().uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        return {
          ...data,
          ...localSaved,
          guestbookNotes: [
            ...(localSaved.guestbookNotes || []),
            ...(data.guestbookNotes || []),
          ],
        };
      }
    }
  } catch (err) {
    console.warn('Profile fetch warning from Firestore:', err);
  }

  // Synthesize standard fallback profile for valid handles
  return {
    uid: `user_${clean}`,
    username: clean,
    displayName: clean.charAt(0).toUpperCase() + clean.slice(1),
    bio: 'Late-night thinker. Chilling in quiet audio lounges.',
    status: 'online',
    lastSeen: Date.now(),
    createdAt: Date.now() - 86400000 * 12,
    customHindiName: clean,
    customVibeTag: 'Late-night coder',
    customStatusEmoji: 'Listening to lofi',
    customLocation: 'India • Late Night',
    customThemeAura: 'aurora',
    customAudioSnippetTitle: 'intro_snippet.wav',
    customAudioSnippetDate: 'Active',
    customAudioSnippetDuration: '0:15',
    broadcastCurrentLounge: true,
    allowVoicePings: true,
    chaiCount: 14,
    loungeHours: 36,
    audioSnippetsCount: 5,
    favoriteLounges: ['#chai_n_code', '#startup_fumbles'],
    guestbookNotes: localSaved.guestbookNotes || [
      {
        id: 'gb_sample',
        senderName: 'Ayush Sharma',
        senderUsername: 'itsjustayush',
        text: 'Swagat hai Berojgar Chat pe! Feel free to clink chai or drop a voice note.',
        timestamp: Date.now() - 3600000 * 2,
        avatarInitials: 'AS',
      },
    ],
    ...localSaved,
  };
}

export async function saveUserProfileCustomization(
  username: string,
  customizations: Partial<UserProfile>,
  currentUid?: string
): Promise<void> {
  const clean = sanitizeUsername(username);

  // 1. Save to LocalStorage for immediate persistence
  try {
    const existing = localStorage.getItem(`berozgar_custom_space_${clean}`);
    const parsed = existing ? JSON.parse(existing) : {};
    const updated = { ...parsed, ...customizations };
    localStorage.setItem(`berozgar_custom_space_${clean}`, JSON.stringify(updated));
  } catch {}

  // 2. Save to Firestore if uid is known
  if (currentUid) {
    try {
      await updateDoc(doc(db, 'users', currentUid), customizations);
    } catch (err) {
      console.warn('Could not update Firestore user doc:', err);
    }
  }
}

export async function addGuestbookNote(
  targetUsername: string,
  note: GuestbookNote
): Promise<void> {
  const clean = sanitizeUsername(targetUsername);
  try {
    const existingRaw = localStorage.getItem(`berozgar_custom_space_${clean}`);
    const parsed = existingRaw ? JSON.parse(existingRaw) : {};
    const notes: GuestbookNote[] = parsed.guestbookNotes || [];
    notes.unshift(note);
    parsed.guestbookNotes = notes;
    localStorage.setItem(`berozgar_custom_space_${clean}`, JSON.stringify(parsed));
  } catch {}
}

export async function incrementChaiCount(targetUsername: string): Promise<number> {
  const clean = sanitizeUsername(targetUsername);
  let newCount = 1;
  try {
    const existingRaw = localStorage.getItem(`berozgar_custom_space_${clean}`);
    const parsed = existingRaw ? JSON.parse(existingRaw) : {};
    newCount = (parsed.chaiCount || (clean === 'itsjustayush' ? 1280 : 12)) + 1;
    parsed.chaiCount = newCount;
    localStorage.setItem(`berozgar_custom_space_${clean}`, JSON.stringify(parsed));
  } catch {}
  return newCount;
}
