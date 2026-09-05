export type ViewMode = 'CHATS' | 'ROOM' | 'PROFILE' | 'SETTINGS' | 'AUTH' | 'DASHBOARD' | 'HISTORY';

export interface UserProfile {
  uid: string;
  username: string; // unique, lowercase alphanumeric + _
  displayName: string;
  photoURL?: string;
  bio?: string;
  status: 'online' | 'offline';
  lastSeen: number;
  createdAt: number;
}

export interface UserSession {
  id: string;
  email: string;
  identifier: string;
  authenticated: boolean;
  nodeType: string;
  encryptionAlgorithm: 'AES-256-GCM';
}

export interface SocialMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'call_log';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaDuration?: number; // seconds for voice notes
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  seenBy?: string[];
  readAt?: Record<string, number>;
  reactions?: Record<string, string[]>; // emoji -> array of uids
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  timestamp: number;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  participantDetails: Record<string, {
    uid: string;
    username: string;
    displayName: string;
    photoURL?: string;
    status?: 'online' | 'offline';
    lastSeen?: number;
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    type: string;
  };
  typing?: Record<string, number>; // uid -> timestamp
  unreadCounts?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface CallSession {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'busy';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  callerCandidates?: RTCIceCandidateInit[];
  receiverCandidates?: RTCIceCandidateInit[];
  createdAt: number;
  endedAt?: number;
  duration?: number;
}

export interface Peer {
  id: string;
  name: string;
  isYou: boolean;
  status: 'ONLINE' | 'TRANSFERRING' | 'IDLE';
  latencyMs: number;
  ip: string;
}

export interface BundleItem {
  id: string;
  name: string;
  size: number;
  type: string;
  fileTypeLabel: string;
  fileId: string;
  dimensions?: string;
  sha256: string;
  encryptedHash: string;
  blobUrl?: string;
  rawBlob?: Blob;
  textContent?: string;
  uploaderId: string;
  uploaderName: string;
  timestamp: number;
  carbonFootprintGrams: number;
  peerSeeds: number;
  encryptionStatus: 'WEBRTC DTLS TRANSPORT' | 'WEBRTC-DTLS VERIFIED' | 'AES-256-GCM VERIFIED';
}

export interface TransferProgress {
  active: boolean;
  fileName: string;
  fileSize: number;
  transferredBytes: number;
  progressPercent: number;
  currentSpeedMBps: number;
  etaSeconds: number;
  targetPeerId: string;
  mode: 'PACKAGE' | 'BUNDLE';
  carbonEmittedGrams: number;
  encryptedChunksCount: number;
  totalChunks: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  label: string;
  value: string;
  type: 'info' | 'success' | 'warning' | 'encryption';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type?: 'text' | 'system' | 'file_notice';
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  encryptedHash?: string;
  reactions?: Record<string, string[]>;
  attachment?: {
    fileName: string;
    fileSize: number;
    fileId: string;
    blobUrl?: string;
    fileTypeLabel?: string;
  };
}

export interface RoomState {
  id: string;
  createdAt: number;
  hostId: string;
  activePeers: Peer[];
  bundleItems: BundleItem[];
  messages?: ChatMessage[];
  selectedTargetPeerId: string;
}
