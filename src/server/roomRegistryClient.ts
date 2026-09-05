const MAX_REGISTRY_BYTES = 64 * 1024;
const ROOM_TTL_SECONDS = 90;
const EVENT_TTL_SECONDS = 30;
const ROOM_PATTERN = /^[A-Z0-9]{6}$/;
const PEER_PATTERN = /^[A-Za-z0-9_-]{3,80}$/;
const ALLOWED_SIGNAL_TYPES = new Set([
  'offer',
  'answer',
  'candidate',
  'chat',
  'chat_ack',
  'typing',
  'reaction',
]);

export interface RegistryPeer {
  peer_id: string;
  peer_name: string;
  is_host: boolean;
  joined_at: string;
  last_seen_at: string;
  expires_at: string;
}

export interface RegistryRoom {
  active?: boolean;
  created?: boolean;
  joined?: boolean;
  left?: boolean;
  roomClosed?: boolean;
  room_code?: string;
  host_peer_id?: string;
  created_at?: string;
  last_seen_at?: string;
  expires_at?: string;
  peers?: RegistryPeer[];
  peerCount?: number;
  error?: string;
  code?: string;
  [key: string]: unknown;
}

interface StoredEvent {
  id: number;
  room_code: string;
  target_peer_id: string;
  sender_peer_id: string;
  message_type: string;
  payload: unknown;
  created_at: string;
  expires_at: string;
}

interface StoredRoom {
  room_code: string;
  host_peer_id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  peers: Map<string, RegistryPeer>;
  events: StoredEvent[];
}

// In-memory room registry store
const memoryRooms = new Map<string, StoredRoom>();
let eventIdCounter = 1;

function normalizeCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim().toUpperCase().replace(/^ROOM-/, '');
  const clean = raw.replace(/[^A-Z0-9]/g, '');
  return ROOM_PATTERN.test(clean) ? clean : null;
}

function normalizePeerId(value: unknown): string | null {
  return typeof value === 'string' && PEER_PATTERN.test(value) ? value : null;
}

function normalizePeerName(value: unknown): string {
  if (typeof value !== 'string') return 'Guest';
  const name = value.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 32);
  return name || 'Guest';
}

function cleanupExpired() {
  const now = Date.now();
  for (const [code, room] of memoryRooms.entries()) {
    if (new Date(room.expires_at).getTime() <= now || room.peers.size === 0) {
      memoryRooms.delete(code);
      continue;
    }

    // Clean expired peers
    for (const [pId, peer] of room.peers.entries()) {
      if (new Date(peer.expires_at).getTime() <= now) {
        room.peers.delete(pId);
      }
    }

    if (room.peers.size === 0) {
      memoryRooms.delete(code);
      continue;
    }

    // Clean expired events
    room.events = room.events.filter(
      (ev) => new Date(ev.expires_at).getTime() > now
    );
  }
}

function getRoomSnapshot(room: StoredRoom): RegistryRoom {
  return {
    active: true,
    room_code: room.room_code,
    host_peer_id: room.host_peer_id,
    created_at: room.created_at,
    last_seen_at: room.last_seen_at,
    expires_at: room.expires_at,
    peers: Array.from(room.peers.values()),
    peerCount: room.peers.size,
  };
}

function pushEvent(
  room: StoredRoom,
  targetPeerId: string,
  senderPeerId: string,
  messageType: string,
  payload: unknown
) {
  const now = Date.now();
  const expiresAt = new Date(now + EVENT_TTL_SECONDS * 1000).toISOString();
  room.events.push({
    id: eventIdCounter++,
    room_code: room.room_code,
    target_peer_id: targetPeerId,
    sender_peer_id: senderPeerId,
    message_type: messageType,
    payload: payload ?? {},
    created_at: new Date(now).toISOString(),
    expires_at: expiresAt,
  });
}

function createError(message: string, status = 500, code?: string) {
  const err = new Error(message) as Error & { status: number; code?: string };
  err.status = status;
  if (code) err.code = code;
  return err;
}

export async function roomRegistry(
  action: string,
  payload: Record<string, unknown>
): Promise<RegistryRoom & { messages?: unknown[]; delivered?: number; ok?: boolean }> {
  const bodyLength = JSON.stringify(payload).length;
  if (bodyLength > MAX_REGISTRY_BYTES) {
    throw createError('Room registry payload is too large', 413);
  }

  cleanupExpired();

  const roomCode = normalizeCode(payload.roomCode || payload.roomId);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const expiresIso = new Date(now + ROOM_TTL_SECONDS * 1000).toISOString();

  switch (action) {
    case 'create': {
      if (!roomCode) throw createError('Invalid room code', 400);
      const peerId = normalizePeerId(payload.peerId);
      if (!peerId) throw createError('Invalid peer identity', 400);
      const peerName = normalizePeerName(payload.peerName);

      const existing = memoryRooms.get(roomCode);
      if (existing && new Date(existing.expires_at).getTime() > now && existing.peers.size > 0) {
        throw createError('Room code is already active', 409, 'ROOM_EXISTS');
      }

      const hostPeer: RegistryPeer = {
        peer_id: peerId,
        peer_name: peerName,
        is_host: true,
        joined_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiresIso,
      };

      const peersMap = new Map<string, RegistryPeer>();
      peersMap.set(peerId, hostPeer);

      const newRoom: StoredRoom = {
        room_code: roomCode,
        host_peer_id: peerId,
        created_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiresIso,
        peers: peersMap,
        events: [],
      };

      memoryRooms.set(roomCode, newRoom);
      return { active: true, created: true, ...getRoomSnapshot(newRoom) };
    }

    case 'join': {
      if (!roomCode) throw createError('Invalid room code', 400);
      const peerId = normalizePeerId(payload.peerId);
      if (!peerId) throw createError('Invalid peer identity', 400);
      const peerName = normalizePeerName(payload.peerName);

      const room = memoryRooms.get(roomCode);
      if (!room || new Date(room.expires_at).getTime() <= now || room.peers.size === 0) {
        throw createError('Room not found or expired', 404);
      }

      const existingPeer = room.peers.get(peerId);
      if (existingPeer) {
        existingPeer.last_seen_at = nowIso;
        existingPeer.expires_at = expiresIso;
        room.last_seen_at = nowIso;
        room.expires_at = expiresIso;
        return { active: true, joined: true, ...getRoomSnapshot(room) };
      }

      const newPeer: RegistryPeer = {
        peer_id: peerId,
        peer_name: peerName,
        is_host: false,
        joined_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiresIso,
      };

      // Notify existing peers
      for (const existing of room.peers.values()) {
        pushEvent(room, existing.peer_id, peerId, 'room_state', {
          event: 'peer_joined',
          peerId,
          peerName,
          hostPeerId: room.host_peer_id,
          roomSize: room.peers.size + 1,
        });
      }

      room.peers.set(peerId, newPeer);
      room.last_seen_at = nowIso;
      room.expires_at = expiresIso;

      return { active: true, joined: true, ...getRoomSnapshot(room) };
    }

    case 'heartbeat': {
      if (!roomCode) throw createError('Invalid room code', 400);
      const peerId = normalizePeerId(payload.peerId);
      if (!peerId) throw createError('Invalid peer identity', 400);

      const room = memoryRooms.get(roomCode);
      if (!room || !room.peers.has(peerId)) {
        throw createError('Peer is not joined to this room', 403);
      }

      const peer = room.peers.get(peerId)!;
      peer.last_seen_at = nowIso;
      peer.expires_at = expiresIso;
      room.last_seen_at = nowIso;
      room.expires_at = expiresIso;

      return { active: true, ...getRoomSnapshot(room) };
    }

    case 'leave': {
      if (!roomCode) return { active: false, left: true };
      const peerId = normalizePeerId(payload.peerId);
      if (!peerId) return { active: false, left: true };

      const room = memoryRooms.get(roomCode);
      if (!room) return { active: false, left: true };

      const leavingPeer = room.peers.get(peerId);
      if (!leavingPeer) {
        return { active: true, left: true, ...getRoomSnapshot(room) };
      }

      room.peers.delete(peerId);

      if (room.peers.size === 0) {
        memoryRooms.delete(roomCode);
        return { active: false, left: true, roomClosed: true };
      }

      let hostPeerId = room.host_peer_id;
      if (hostPeerId === peerId) {
        const nextHost = room.peers.values().next().value as RegistryPeer;
        hostPeerId = nextHost.peer_id;
        room.host_peer_id = hostPeerId;
        nextHost.is_host = true;

        for (const remaining of room.peers.values()) {
          pushEvent(room, remaining.peer_id, peerId, 'room_state', {
            event: 'host_changed',
            hostPeerId,
            roomSize: room.peers.size,
          });
        }
      }

      for (const remaining of room.peers.values()) {
        pushEvent(room, remaining.peer_id, peerId, 'room_state', {
          event: 'peer_left',
          peerId,
          hostPeerId,
          roomSize: room.peers.size,
        });
      }

      room.last_seen_at = nowIso;
      room.expires_at = expiresIso;

      return { active: true, left: true, ...getRoomSnapshot(room) };
    }

    case 'poll': {
      if (!roomCode) throw createError('Invalid room code', 400);
      const peerId = normalizePeerId(payload.peerId);
      if (!peerId) throw createError('Invalid peer identity', 400);

      const room = memoryRooms.get(roomCode);
      if (!room || !room.peers.has(peerId)) {
        throw createError('Peer is not joined to this room', 403);
      }

      const peer = room.peers.get(peerId)!;
      peer.last_seen_at = nowIso;
      peer.expires_at = expiresIso;
      room.last_seen_at = nowIso;
      room.expires_at = expiresIso;

      const targeted: StoredEvent[] = [];
      const remainingEvents: StoredEvent[] = [];
      for (const ev of room.events) {
        if (ev.target_peer_id === peerId) {
          targeted.push(ev);
        } else {
          remainingEvents.push(ev);
        }
      }
      room.events = remainingEvents;

      return {
        active: true,
        messages: targeted.map((ev) => ({
          type: ev.message_type,
          peerId: ev.sender_peer_id,
          data: ev.payload,
          timestamp: new Date(ev.created_at).getTime(),
        })),
      };
    }

    case 'signal': {
      if (!roomCode) throw createError('Invalid room code', 400);
      const peerId = normalizePeerId(payload.peerId);
      const type = typeof payload.type === 'string' ? payload.type : '';
      if (!peerId || !ALLOWED_SIGNAL_TYPES.has(type)) {
        throw createError('Invalid signaling payload', 400);
      }

      const room = memoryRooms.get(roomCode);
      if (!room || !room.peers.has(peerId)) {
        throw createError('Peer is not joined to this room', 403);
      }

      const targetPeerId = normalizePeerId(payload.targetPeerId);
      const targets: RegistryPeer[] = [];
      if (targetPeerId) {
        const target = room.peers.get(targetPeerId);
        if (target) targets.push(target);
      } else {
        for (const p of room.peers.values()) {
          if (p.peer_id !== peerId) targets.push(p);
        }
      }

      for (const target of targets) {
        pushEvent(room, target.peer_id, peerId, type, payload.data ?? {});
      }

      return { active: true, ok: true, delivered: targets.length };
    }

    case 'lookup': {
      if (!roomCode) throw createError('Invalid room code', 400);
      const room = memoryRooms.get(roomCode);
      if (!room || new Date(room.expires_at).getTime() <= now || room.peers.size === 0) {
        throw createError('Room not found or expired', 404);
      }
      return { active: true, ...getRoomSnapshot(room) };
    }

    default:
      throw createError(`Unknown action: ${action}`, 400);
  }
}
