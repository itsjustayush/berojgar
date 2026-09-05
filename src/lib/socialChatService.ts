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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from './firebase';
import { UserProfile, Conversation, SocialMessage, CallSession } from '../types';

// Converts any username to standard format: lowercase alphanumeric and underscore only
export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
}

// Map username to synthetic internal auth email for Firebase Auth
function usernameToEmail(username: string): string {
  const clean = sanitizeUsername(username);
  return `${clean}@ciao.internal`;
}

// Generate default avatar if user doesn't provide one
export function generateDefaultAvatar(name: string, username: string): string {
  const seed = encodeURIComponent(username || name || 'ciao');
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=0d0d0d,141414,1f1f1f`;
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
  bio = 'Available on Ciao',
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
  const photoURL = avatarUrl || generateDefaultAvatar(displayName, cleanUsername);

  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  await updateProfile(userCredential.user, {
    displayName: displayName.trim() || `@${cleanUsername}`,
    photoURL,
  });

  const profile: UserProfile = {
    uid,
    username: cleanUsername,
    displayName: displayName.trim() || `@${cleanUsername}`,
    photoURL,
    bio: bio.trim() || 'Available on Ciao',
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
      photoURL: userCredential.user.photoURL || generateDefaultAvatar(cleanUsername, cleanUsername),
      bio: 'Available on Ciao',
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

  // Update conversation last message and reset typing
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
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
  });

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
  offer: RTCSessionDescriptionInit
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
    offer,
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

function targetAvatar(user: UserProfile): string {
  return user.photoURL || generateDefaultAvatar(user.displayName, user.username);
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

export async function addCallIceCandidate(
  callId: string,
  role: 'caller' | 'receiver',
  candidate: RTCIceCandidateInit
): Promise<void> {
  const callRef = doc(db, 'calls', callId);
  const snap = await getDoc(callRef);
  if (!snap.exists()) return;

  const data = snap.data() as CallSession;
  const field = role === 'caller' ? 'callerCandidates' : 'receiverCandidates';
  const existing = data[field] || [];

  await updateDoc(callRef, {
    [field]: [...existing, candidate],
  });
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
