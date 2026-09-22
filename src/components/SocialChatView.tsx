import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Search,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Coffee,
  X,
  ArrowLeft,
  FileText,
  Download,
  Copy,
  Users,
  Lock,
  Globe,
  Info,
  CheckCircle2,
  PanelRight,
  PanelRightClose,
  Flame,
  ExternalLink,
  BellOff,
  Folder,
  Sparkles,
} from 'lucide-react';
import { Conversation, SocialMessage, UserProfile } from '../types';
import {
  sendSocialMessage,
  subscribeToMessages,
  subscribeToConversation,
  markMessagesAsSeen,
  setTypingStatus,
  toggleMessageReaction,
} from '../lib/socialChatService';
import { soundEffects } from '../lib/callSoundEffects';
import { UserAvatar } from './UserAvatar';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { VoiceRecorder } from './VoiceRecorder';

interface SocialChatViewProps {
  conversation: Conversation;
  currentUser: UserProfile;
  onBackToSidebar?: () => void;
  onStartCall: (type: 'voice' | 'video', targetUser: UserProfile) => void;
  onViewTapriPage?: (tapriName: string) => void;
  onViewProfile?: (username: string) => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '👏', '☕', '💡'];
const EMOJI_PALETTE = ['☕', '🔥', '✨', '🚀', '💡', '❤️', '👏', '🎉', '😂', '👍', '🙏', '💯'];

export const SocialChatView: React.FC<SocialChatViewProps> = ({
  conversation,
  currentUser,
  onBackToSidebar,
  onStartCall,
  onViewTapriPage,
  onViewProfile,
}) => {
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMediaPreview, setActiveMediaPreview] = useState<{ url: string; name: string } | null>(null);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(true);
  const [sharedTab, setSharedTab] = useState<'media' | 'links' | 'docs'>('media');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  // Real-time local state of conversation to track typing & receipts instantly
  const [liveConversation, setLiveConversation] = useState<Conversation>(conversation);
  const [now, setNow] = useState<number>(Date.now());

  // Keep liveConversation updated when conversation prop changes
  useEffect(() => {
    setLiveConversation(conversation);
  }, [conversation]);

  // Subscribe to real-time conversation changes (typing, unread counts, status)
  useEffect(() => {
    const unsub = subscribeToConversation(conversation.id, (updatedConv) => {
      if (updatedConv) {
        setLiveConversation(updatedConv);
      }
    });
    return () => unsub();
  }, [conversation.id]);

  // High-frequency 1-second ticker to cleanly dismiss typing indicators after 4 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Extract other user for direct message
  const otherUid = liveConversation.participants.find((p) => p !== currentUser.uid) || '';
  const otherUser = liveConversation.participantDetails?.[otherUid] || {
    uid: otherUid,
    username: 'radermiler',
    displayName: 'Rader Miler',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'online' as const,
    role: 'Lead Product Designer',
    city: 'Bangalore (IST • 11:15 AM)',
  };

  // Determine all users who are currently typing (excluding currentUser)
  const isGroupTapri = liveConversation.type === 'group';
  const activeTypingUids = Object.entries(liveConversation.typing || {})
    .filter(([uid, ts]) => uid !== currentUser.uid && typeof ts === 'number' && now - ts < 4000)
    .map(([uid]) => uid);

  const isOtherTyping = activeTypingUids.length > 0;

  // Construct descriptive typing label
  let typingLabel = '';
  if (isOtherTyping) {
    if (!isGroupTapri) {
      typingLabel = `${otherUser.displayName} is typing...`;
    } else if (activeTypingUids.length === 1) {
      const u = liveConversation.participantDetails?.[activeTypingUids[0]];
      typingLabel = `${u?.displayName || 'A chiller'} is typing...`;
    } else if (activeTypingUids.length === 2) {
      const u1 = liveConversation.participantDetails?.[activeTypingUids[0]];
      const u2 = liveConversation.participantDetails?.[activeTypingUids[1]];
      typingLabel = `${u1?.displayName || 'Chiller 1'} and ${u2?.displayName || 'Chiller 2'} are typing...`;
    } else {
      typingLabel = `${activeTypingUids.length} chillers are typing...`;
    }
  }

  // Realtime messages subscription & automatic read receipts
  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversation.id, (incoming) => {
      setMessages(incoming);
      markMessagesAsSeen(conversation.id, currentUser.uid);
    });

    markMessagesAsSeen(conversation.id, currentUser.uid);

    // Also mark as seen when window / tab regains focus
    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        markMessagesAsSeen(conversation.id, currentUser.uid);
      }
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        setTypingStatus(conversation.id, currentUser.uid, false);
      }
    };
  }, [conversation.id, currentUser.uid]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    if (text.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        setTypingStatus(conversation.id, currentUser.uid, true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        isTypingRef.current = false;
        setTypingStatus(conversation.id, currentUser.uid, false);
      }, 2500);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        setTypingStatus(conversation.id, currentUser.uid, false);
      }
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      setTypingStatus(conversation.id, currentUser.uid, false);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setInputText('');
    setShowEmojiPicker(false);

    try {
      await sendSocialMessage(conversation.id, {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderUsername: currentUser.username,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        text: trimmed,
        type: 'text',
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      await sendSocialMessage(conversation.id, {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderUsername: currentUser.username,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        text: isImage ? '📷 Photo' : isVideo ? '🎥 Video' : `📎 ${file.name}`,
        type: isImage ? 'image' : isVideo ? 'video' : 'file',
        mediaUrl: dataUrl,
        mediaName: file.name,
        mediaSize: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send voice note
  const handleSendVoiceNote = async (audioDataUrl: string, durationSeconds: number) => {
    setIsRecordingVoice(false);
    try {
      await sendSocialMessage(conversation.id, {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderUsername: currentUser.username,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        text: '🎤 Voice message',
        type: 'audio',
        mediaUrl: audioDataUrl,
        mediaDuration: durationSeconds,
      });
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  const tapriShareUrl = `https://berojgarchat.vercel.app/tapri=${conversation.tapriName || 'lounge'}`;
  const [copiedTapriLink, setCopiedTapriLink] = useState(false);

  const handleCopyTapriLink = () => {
    navigator.clipboard?.writeText(tapriShareUrl);
    setCopiedTapriLink(true);
    setTimeout(() => setCopiedTapriLink(false), 2000);
  };

  const handleQuickChai = async () => {
    try {
      await sendSocialMessage(conversation.id, {
        conversationId: conversation.id,
        senderId: currentUser.uid,
        senderUsername: currentUser.username,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        text: '☕ Sent a hot cutting chai to the Tapri! Cheers chillers! ✨',
        type: 'text',
      });
      soundEffects.playJoinSound();
    } catch {
      // ignore
    }
  };

  const displayedMessages = inChatSearchQuery.trim()
    ? messages.filter((m) =>
        m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="flex-1 h-full flex overflow-hidden bg-surface text-on-surface relative">
      {/* Center Chat Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden border-r border-outline-variant/30">
        {/* 1. CHAT HEADER BAR */}
        <header className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between z-10 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {onBackToSidebar && (
              <button
                type="button"
                onClick={onBackToSidebar}
                className="md:hidden p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {/* Avatar */}
            {isGroupTapri ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs font-mono font-bold">
                <Coffee size={18} />
              </div>
            ) : (
              <div
                className="shrink-0 cursor-pointer"
                onClick={() => onViewProfile && onViewProfile(otherUser.username)}
              >
                <UserAvatar
                  name={otherUser.displayName || otherUser.username}
                  username={otherUser.username}
                  photoURL={otherUser.photoURL}
                  size="md"
                  showStatus
                  isOnline={otherUser.status === 'online'}
                />
              </div>
            )}

            {/* Title & Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-on-surface truncate">
                  {isGroupTapri
                    ? `#${conversation.tapriName || conversation.tapriTitle || 'Tapri'}`
                    : otherUser.displayName}
                </h2>
                {!isGroupTapri && (
                  <CheckCircle2 size={14} className="text-primary fill-primary/10 shrink-0" />
                )}
                {!isGroupTapri && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container border border-secondary/20 text-[10px] font-semibold">
                    Chai Partner
                  </span>
                )}
              </div>

              <div className="text-[11px] text-on-surface-variant truncate flex items-center gap-1.5">
                {isOtherTyping ? (
                  <span className="text-secondary font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                    <span>{typingLabel}</span>
                    <span className="inline-flex items-center gap-0.5 ml-0.5">
                      <span className="w-1 h-1 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 rounded-full bg-secondary animate-bounce" />
                    </span>
                  </span>
                ) : isGroupTapri ? (
                  <>
                    <Users size={12} className="text-secondary" />
                    <span>{liveConversation.participants.length} chillers in Tapri</span>
                  </>
                ) : otherUser.status === 'online' ? (
                  <>
                    <span>☕ Over a cup of tea</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active now</span>
                  </>
                ) : (
                  <span>Offline</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isGroupTapri && (
              <>
                <button
                  type="button"
                  onClick={() => onStartCall('voice', otherUser as UserProfile)}
                  className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                  title="Start Voice Call"
                >
                  <Phone size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => onStartCall('video', otherUser as UserProfile)}
                  className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                  title="Start Video Call"
                >
                  <Video size={15} />
                </button>
              </>
            )}

            {isGroupTapri && (
              <button
                type="button"
                onClick={handleQuickChai}
                className="px-3 py-1.5 rounded-full bg-primary hover:opacity-90 text-on-primary text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Coffee size={14} />
                <span>Send Chai ☕</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInChatSearch(!showInChatSearch)}
              className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
              title="Search conversation"
            >
              <Search size={15} />
            </button>

            <button
              type="button"
              onClick={() => setShowDetailsSidebar(!showDetailsSidebar)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showDetailsSidebar
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline-variant/40 hover:bg-surface-container text-on-surface-variant'
              }`}
              title="Toggle Profile Details"
            >
              <PanelRight size={15} />
            </button>
          </div>
        </header>

        {/* In-Chat Search Drawer */}
        {showInChatSearch && (
          <div className="px-5 py-2.5 bg-surface-container border-b border-outline-variant/30 flex items-center gap-3">
            <Search size={15} className="text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
            />
            {inChatSearchQuery && (
              <span className="text-[11px] font-mono text-on-surface-variant">
                {displayedMessages.length} match(es)
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setShowInChatSearch(false);
                setInChatSearchQuery('');
              }}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* 2. MESSAGES FEED STREAM */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Date separator */}
          <div className="flex items-center justify-center my-3">
            <span className="px-3.5 py-1 rounded-full bg-surface-container border border-outline-variant/40 text-on-surface-variant text-[11px] font-medium shadow-2xs">
              Today, Oct 24
            </span>
          </div>

          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
              <div className="w-16 h-16 rounded-3xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center justify-center mb-3 shadow-xs">
                <Coffee size={28} />
              </div>
              <h3 className="font-bold text-base text-on-surface mb-1">
                Say hello over a hot cup of tea!
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Drop wireframes, voice notes, code snippets, or share ideas in real-time.
              </p>
            </div>
          ) : (
            displayedMessages.map((msg, idx) => {
              const isYou = msg.senderId === currentUser.uid;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col relative group/msg ${isYou ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender name for group tapri */}
                  {isGroupTapri && !isYou && (
                    <span className="text-[11px] font-mono font-bold text-primary mb-1 ml-1">
                      @{msg.senderUsername || 'chiller'}
                    </span>
                  )}

                  <div className="relative max-w-[85%] sm:max-w-[70%] group/bubble">
                    {/* Floating Reaction Bar */}
                    <div
                      className={`absolute -top-7 z-20 flex items-center gap-1 bg-surface-container-high border border-outline-variant/40 rounded-full px-2 py-0.5 shadow-lg transition-all duration-200 opacity-0 scale-95 group-hover/bubble:opacity-100 group-hover/bubble:scale-100 pointer-events-none group-hover/bubble:pointer-events-auto ${
                        isYou ? 'right-2' : 'left-2'
                      }`}
                    >
                      {QUICK_REACTIONS.map((emoji) => {
                        const currentReactors = msg.reactions?.[emoji] || [];
                        const hasReacted = currentReactors.includes(currentUser.uid);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              toggleMessageReaction(conversation.id, msg.id, currentUser.uid, emoji)
                            }
                            className={`text-sm hover:scale-125 transition-transform p-0.5 rounded-full cursor-pointer ${
                              hasReacted ? 'bg-secondary-container text-on-secondary-container scale-110' : 'hover:bg-surface-container'
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed break-words shadow-xs transition-all ${
                        isYou
                          ? 'bg-primary text-on-primary rounded-tr-xs shadow-xs'
                          : 'bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-tl-xs'
                      }`}
                    >
                      {/* Image Preview */}
                      {msg.type === 'image' && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-outline-variant/20">
                          <img
                            src={msg.mediaUrl}
                            alt={msg.mediaName || 'Photo'}
                            onClick={() =>
                              setActiveMediaPreview({ url: msg.mediaUrl!, name: msg.mediaName || 'Photo' })
                            }
                            className="max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          />
                        </div>
                      )}

                      {/* Video */}
                      {msg.type === 'video' && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden">
                          <video src={msg.mediaUrl} controls className="max-h-72 w-full" />
                        </div>
                      )}

                      {/* Voice Note Player */}
                      {msg.type === 'audio' && msg.mediaUrl && (
                        <div className="mb-1">
                          <AudioMessagePlayer
                            src={msg.mediaUrl}
                            duration={msg.mediaDuration}
                            isYou={isYou}
                          />
                        </div>
                      )}

                      {/* File / Document Card (Matching Image 1 & 3) */}
                      {msg.type === 'file' && (
                        <div
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl mb-2 ${
                            isYou
                              ? 'bg-white/10 border border-white/20'
                              : 'bg-surface-container border border-outline-variant/30 text-on-surface'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-bold truncate block">
                                {msg.mediaName || 'Document'}
                              </span>
                              <span className="text-[10px] text-on-surface-variant">
                                {msg.mediaSize ? `${(msg.mediaSize / (1024 * 1024)).toFixed(1)} MB` : '14.2 MB'} • File
                              </span>
                            </div>
                          </div>
                          {msg.mediaUrl && (
                            <a
                              href={msg.mediaUrl}
                              download={msg.mediaName || 'download'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isYou ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-surface-container-high hover:bg-primary hover:text-on-primary'
                              }`}
                            >
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                      {/* Reactions */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-outline-variant/20">
                          {Object.entries(msg.reactions).map(([emoji, reactorsVal]) => {
                            const reactors = (reactorsVal as string[]) || [];
                            if (reactors.length === 0) return null;
                            const isMyReaction = reactors.includes(currentUser.uid);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  toggleMessageReaction(conversation.id, msg.id, currentUser.uid, emoji)
                                }
                                className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                                  isMyReaction
                                    ? 'bg-primary text-on-primary font-bold'
                                    : isYou
                                    ? 'bg-white/20 text-white'
                                    : 'bg-surface-container-high text-on-surface border border-outline-variant/30'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{reactors.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Timestamp & Status */}
                      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-mono opacity-80">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isYou && (() => {
                          const isMsgSeen =
                            msg.status === 'seen' ||
                            (msg.seenBy && msg.seenBy.some((uid) => uid !== currentUser.uid)) ||
                            (msg.readAt && Object.keys(msg.readAt).some((uid) => uid !== currentUser.uid));
                          const isMsgDelivered = msg.status === 'delivered';
                          const readTimestamp =
                            !isGroupTapri && otherUid && msg.readAt?.[otherUid] ? msg.readAt[otherUid] : null;
                          const tooltip = isMsgSeen
                            ? readTimestamp
                              ? `Read at ${new Date(readTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Read by recipient'
                            : isMsgDelivered
                            ? 'Delivered to device'
                            : 'Sent to server';

                          return (
                            <span title={tooltip} className="cursor-default inline-flex items-center">
                              {isMsgSeen ? (
                                <CheckCheck size={14} className="text-secondary stroke-[2.4] inline drop-shadow-xs" />
                              ) : isMsgDelivered ? (
                                <CheckCheck size={13} className="inline opacity-85" />
                              ) : (
                                <Check size={12} className="inline opacity-85" />
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Direct message read receipt beneath last message from user */}
                    {isYou && !isGroupTapri && idx === displayedMessages.length - 1 && (() => {
                      const isMsgSeen =
                        msg.status === 'seen' ||
                        (msg.seenBy && msg.seenBy.some((uid) => uid !== currentUser.uid)) ||
                        (msg.readAt && Object.keys(msg.readAt).some((uid) => uid !== currentUser.uid));
                      if (!isMsgSeen) return null;
                      const readTimestamp = otherUid && msg.readAt?.[otherUid] ? msg.readAt[otherUid] : null;
                      return (
                        <div className="flex items-center justify-end gap-1.5 mt-1 mr-1 text-[11px] font-mono text-secondary font-semibold animate-in fade-in slide-in-from-bottom-0.5">
                          <CheckCheck size={13} className="text-secondary stroke-[2.4]" />
                          <span>
                            Seen{' '}
                            {readTimestamp
                              ? new Date(readTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                          {otherUser.photoURL ? (
                            <img
                              src={otherUser.photoURL}
                              alt={otherUser.displayName}
                              className="w-3.5 h-3.5 rounded-full object-cover ring-1 ring-secondary/40"
                            />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[8px] font-bold">
                              {(otherUser.displayName || otherUser.username || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })
          )}

          {/* Real-time Typing bubble */}
          {isOtherTyping && (
            <div className="flex items-center gap-2.5 text-left animate-in fade-in slide-in-from-bottom-1 duration-200">
              {!isGroupTapri ? (
                <div className="shrink-0">
                  <UserAvatar
                    name={otherUser.displayName || otherUser.username}
                    username={otherUser.username}
                    photoURL={otherUser.photoURL}
                    size="xs"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xs font-bold shrink-0">
                  <Coffee size={13} />
                </div>
              )}
              <div className="bg-surface-container border border-outline-variant/40 rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-xs flex items-center gap-2.5">
                <span className="text-xs text-on-surface-variant font-medium">
                  {typingLabel}
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Emoji Palette Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-24 left-6 z-30 p-3 bg-surface-container-high border border-outline-variant/40 rounded-2xl shadow-xl animate-in fade-in">
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_PALETTE.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + em);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl p-1.5 hover:scale-125 transition-transform rounded-xl hover:bg-surface-container cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. FLOATING BOTTOM COMPOSER DOCK */}
        <div className="p-4 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/30">
          {isRecordingVoice ? (
            <VoiceRecorder
              onSendVoice={handleSendVoiceNote}
              onCancel={() => setIsRecordingVoice(false)}
            />
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                title="Attach media or files"
              >
                <Paperclip size={17} />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-2xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                title="Emoji"
              >
                <Smile size={17} />
              </button>

              {/* Input Field */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Message ${otherUser.displayName} or drop wireframe...`}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Voice Note Button or Send Button */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  className="p-2.5 rounded-2xl bg-primary hover:opacity-90 text-on-primary transition-all shadow-sm cursor-pointer"
                  title="Send message"
                >
                  <Send size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  className="p-2.5 rounded-2xl border border-outline-variant/40 hover:bg-secondary-container hover:text-on-secondary-container text-on-surface-variant transition-all cursor-pointer"
                  title="Record voice note"
                >
                  <Mic size={17} />
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* 4. COLUMN 3: RIGHT DETAILS DRAWER (Matching Image 1 & 3) */}
      {showDetailsSidebar && (
        <aside className="w-80 lg:w-[320px] shrink-0 h-full bg-surface-container-low border-l border-outline-variant/30 flex flex-col justify-between overflow-y-auto custom-scrollbar p-6 z-20">
          <div className="space-y-6">
            {/* Header with Close */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface">Details</h3>
              <button
                type="button"
                onClick={() => setShowDetailsSidebar(false)}
                className="p-1 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Close Details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile Spotlight */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-outline-variant/40 shadow-md">
                  <img
                    src={otherUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt={otherUser.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {otherUser.status === 'online' && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-3 ring-surface" />
                )}
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="font-bold text-base text-on-surface">
                    {otherUser.displayName}
                  </h4>
                  <CheckCircle2 size={15} className="text-primary fill-primary/10 shrink-0" />
                </div>
                <div className="text-xs font-mono text-on-surface-variant">@{otherUser.username}</div>
                <div className="text-xs font-medium text-on-surface-variant mt-1">
                  {otherUser.role || 'Lead Product Designer'}
                </div>
                <div className="text-[11px] text-on-surface-variant/80">
                  {otherUser.city || 'Bangalore (IST • 11:15 AM)'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons Row */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onStartCall('voice', otherUser as UserProfile)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <Phone size={14} />
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => onStartCall('video', otherUser as UserProfile)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <Video size={14} />
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">Video</span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center">
                  <BellOff size={14} />
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">Mute</span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center">
                  <Folder size={14} />
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">Files</span>
              </button>
            </div>

            {/* Chai Streak Card */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-primary to-orange-700 text-white shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Coffee size={14} />
                  <span>Chai Streak</span>
                </span>
                <span className="font-mono font-bold">18 Days</span>
              </div>
              <p className="text-[11px] text-orange-100">
                Regular huddle partner • 42 shared cups over Berozgar
              </p>
            </div>

            {/* Shared Media Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                <div className="flex items-center gap-3">
                  {(['media', 'links', 'docs'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSharedTab(tab)}
                      className={`text-xs font-semibold pb-1 cursor-pointer capitalize ${
                        sharedTab === tab
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">View all</span>
              </div>

              {/* 6 Photo Previews */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80',
                ].map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden bg-surface-container group cursor-pointer"
                  >
                    <img
                      src={img}
                      alt="shared"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {i === 5 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[11px] font-bold font-mono">
                        +43
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pinned Resources */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                Pinned Resources
              </span>
              <div className="space-y-2">
                <a
                  href="https://figma.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all text-xs"
                >
                  <span className="font-medium text-on-surface truncate">
                    Berozgar Mobile Canvas V2
                  </span>
                  <ExternalLink size={13} className="text-on-surface-variant shrink-0" />
                </a>

                <a
                  href="https://notion.so"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 transition-all text-xs"
                >
                  <span className="font-medium text-on-surface truncate">
                    Audio Protocol Specs
                  </span>
                  <ExternalLink size={13} className="text-on-surface-variant shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Fullscreen Media Viewer */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setActiveMediaPreview(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X size={20} />
          </button>
          <img
            src={activeMediaPreview.url}
            alt={activeMediaPreview.name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
