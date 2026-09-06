import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Phone,
  Video,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Download,
  X,
  Sparkles,
  Coffee,
  Share2,
  Users,
  Copy,
  Globe,
  Lock,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Conversation, SocialMessage, UserProfile } from '../types';
import {
  subscribeToMessages,
  sendSocialMessage,
  markMessagesAsSeen,
  setTypingStatus,
  toggleMessageReaction,
} from '../lib/socialChatService';
import { db, doc, onSnapshot } from '../lib/firebase';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { VoiceRecorder } from './VoiceRecorder';
import { UserAvatar } from './UserAvatar';
import { soundEffects } from '../lib/callSoundEffects';

interface SocialChatViewProps {
  conversation: Conversation;
  currentUser: UserProfile;
  onBackToSidebar: () => void;
  onStartCall: (type: 'voice' | 'video', targetUser: UserProfile) => void;
  onViewTapriPage?: (tapriName: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🚀'];
const EMOJI_PALETTE = [
  '😀', '😂', '🤣', '😍', '🥰', '😘', '😎', '🥳', '🤔', '🤫',
  '👍', '👎', '👏', '🙌', '🤝', '🔥', '✨', '🎉', '💯', '❤️',
  '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🚀', '⭐', '⚡',
];

export const SocialChatView: React.FC<SocialChatViewProps> = ({
  conversation,
  currentUser,
  onBackToSidebar,
  onStartCall,
  onViewTapriPage,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [activeMediaPreview, setActiveMediaPreview] = useState<{ url: string; name: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Identify remote participant
  const otherUid = conversation.participants.find((p) => p !== currentUser.uid) || '';
  const otherUser = conversation.participantDetails?.[otherUid] || {
    uid: otherUid,
    username: 'user',
    displayName: 'Berozgar User',
    photoURL: '',
    status: 'offline' as const,
    lastSeen: 0,
  };

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const otherTypingTimeoutRef = useRef<number | null>(null);

  // Instantaneous conversation typing status listener
  useEffect(() => {
    if (!conversation.id || !otherUid) return;

    const convDocRef = doc(db, 'conversations', conversation.id);
    const unsub = onSnapshot(convDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const typingTimestamp = data.typing?.[otherUid];
        if (typingTimestamp && Date.now() - typingTimestamp < 4000) {
          setIsOtherTyping(true);
          if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
          otherTypingTimeoutRef.current = window.setTimeout(() => {
            setIsOtherTyping(false);
          }, 3500);
        } else {
          setIsOtherTyping(false);
        }
      }
    });

    return () => {
      unsub();
      if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
    };
  }, [conversation.id, otherUid]);

  const initialMountTime = useRef(Date.now());
  const prevMsgCountRef = useRef(0);

  // Real-time messages subscription
  useEffect(() => {
    const unsub = subscribeToMessages(conversation.id, (loadedMessages) => {
      if (prevMsgCountRef.current > 0 && loadedMessages.length > prevMsgCountRef.current) {
        const latest = loadedMessages[loadedMessages.length - 1];
        if (latest && latest.senderId !== currentUser.uid && latest.timestamp > initialMountTime.current - 1000) {
          soundEffects.playMessageDing();
        }
      }
      prevMsgCountRef.current = loadedMessages.length;
      setMessages(loadedMessages);
      markMessagesAsSeen(conversation.id, currentUser.uid);
    });

    return () => unsub();
  }, [conversation.id, currentUser.uid]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // Handle typing indicator
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

  // Send standard text message
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

  // Send media file
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

  // Filter messages for in-chat search
  const [copiedTapriLink, setCopiedTapriLink] = useState(false);
  const isGroupTapri = conversation.type === 'group';
  const tapriShareUrl = `https://berojgarchat.vercel.app/tapri=${conversation.tapriName || 'lounge'}`;

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

  const formatLastSeen = (ts?: number) => {
    if (!ts) return 'Offline';
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 1) return 'Active just now';
    if (diffMin < 60) return `Active ${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    return 'Offline';
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050505] text-white relative select-none">
      {/* Chat Header */}
      <div className="h-16 px-4 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToSidebar}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Back to chats"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Group Tapri vs 1-on-1 Avatar */}
          {isGroupTapri ? (
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff5722] to-[#b32b00] flex items-center justify-center text-white shadow-md font-mono font-bold text-lg">
              #
            </div>
          ) : (
            <div className="shrink-0">
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

          {/* Identity & Active Status */}
          <div className="min-w-0">
            {isGroupTapri ? (
              <>
                <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <span>#{conversation.tapriName || conversation.tapriTitle || 'Tapri'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff5722]/15 text-[#ffb5a0] border border-[#ff5722]/30 flex items-center gap-1">
                    {conversation.tapriIsPublic !== false ? (
                      <>
                        <Globe size={10} className="text-[#22C55E]" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={10} className="text-[#ffb5a0]" />
                        <span>Private</span>
                      </>
                    )}
                  </span>
                </h2>
                <div className="text-[11px] font-mono text-white/50 flex items-center gap-1.5">
                  <Users size={12} className="text-[#ff5722]" />
                  <span>{conversation.participants.length} chillers in Tapri</span>
                  <span className="hidden sm:inline text-white/30">•</span>
                  <span className="hidden sm:inline text-white/40 truncate">
                    {conversation.tapriDescription || 'Late-night chill lounge'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <span>{otherUser.displayName}</span>
                  <span className="text-[10px] font-mono text-white/40 hidden sm:inline">@{otherUser.username}</span>
                </h2>
                <div className="text-[11px] font-mono flex items-center gap-1.5">
                  {isOtherTyping ? (
                    <span className="text-[#EF4E22] font-bold animate-pulse flex items-center gap-1">
                      <span>typing</span>
                      <span className="animate-bounce">...</span>
                    </span>
                  ) : otherUser.status === 'online' ? (
                    <span className="text-[#EF4E22] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4E22] animate-pulse" />
                      <span>Active now</span>
                    </span>
                  ) : (
                    <span className="text-white/40">{formatLastSeen(otherUser.lastSeen)}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {isGroupTapri ? (
            <>
              {/* Dedicated Tapri Page */}
              {conversation.tapriName && onViewTapriPage && (
                <button
                  type="button"
                  onClick={() => onViewTapriPage(conversation.tapriName!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono transition-colors cursor-pointer border border-white/10"
                  title="View dedicated Tapri page (creator, realtime online members, creation date)"
                >
                  <Info size={14} className="text-[#38bdf8]" />
                  <span className="hidden sm:inline">Tapri Info</span>
                </button>
              )}

              {/* Copy Join Link */}
              <button
                type="button"
                onClick={handleCopyTapriLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono transition-colors cursor-pointer border border-white/10"
                title="Copy shareable Tapri link"
              >
                {copiedTapriLink ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                <span className="hidden sm:inline">{copiedTapriLink ? 'Copied!' : 'Share Link'}</span>
              </button>

              {/* Quick Send Chai */}
              <button
                type="button"
                onClick={handleQuickChai}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff5722]/15 hover:bg-[#ff5722]/25 text-[#ff5722] text-xs font-semibold transition-colors cursor-pointer border border-[#ff5722]/30"
                title="Send Chai to Tapri"
              >
                <Coffee size={14} />
                <span className="hidden sm:inline">Chai ☕</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onStartCall('voice', otherUser as UserProfile)}
                className="p-2 rounded-xl text-white/70 hover:text-[#EF4E22] hover:bg-white/5 transition-colors cursor-pointer"
                title="Start Voice Call"
              >
                <Phone size={18} />
              </button>

              <button
                type="button"
                onClick={() => onStartCall('video', otherUser as UserProfile)}
                className="p-2 rounded-xl text-white/70 hover:text-[#EF4E22] hover:bg-white/5 transition-colors cursor-pointer"
                title="Start Video Call"
              >
                <Video size={18} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowInChatSearch(!showInChatSearch)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showInChatSearch ? 'text-[#EF4E22] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* In-chat Search Bar Drawer */}
      {showInChatSearch && (
        <div className="p-2.5 bg-[#101c36] border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Search size={14} className="text-white/40 ml-2" />
          <input
            type="text"
            placeholder="Search within this chat..."
            value={inChatSearchQuery}
            onChange={(e) => setInChatSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-xs text-white font-mono focus:outline-none placeholder:text-white/30"
          />
          {inChatSearchQuery && (
            <span className="font-mono text-[10px] text-white/40">
              {displayedMessages.length} match{displayedMessages.length === 1 ? '' : 'es'}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowInChatSearch(false);
              setInChatSearchQuery('');
            }}
            className="p-1 text-white/40 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/40">
            {isGroupTapri ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center mb-3 text-[#ff5722]">
                  <Coffee size={28} />
                </div>
                <h3 className="font-extrabold text-lg text-white mb-1" style={{ fontFamily: 'Mukta, sans-serif' }}>
                  Welcome to #{conversation.tapriName || conversation.tapriTitle || 'Tapri'}
                </h3>
                <p className="font-mono text-xs max-w-sm text-white/50 mb-3">
                  {conversation.tapriDescription || 'Late-night chill group chat. Chai, code, and midnight banter.'}
                </p>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#CBD5E1]">
                  <span>berojgarchat.vercel.app/tapri={conversation.tapriName}</span>
                  <button
                    type="button"
                    onClick={handleCopyTapriLink}
                    className="p-1 text-[#ff5722] hover:text-white cursor-pointer"
                    title="Copy Tapri Link"
                  >
                    {copiedTapriLink ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-[#EF4E22]/10 border border-[#EF4E22]/20 flex items-center justify-center mb-3">
                  <Sparkles size={24} className="text-[#EF4E22]" />
                </div>
                <h3 className="font-extrabold text-lg text-white mb-1" style={{ fontFamily: 'Mukta, sans-serif' }}>
                  Chat with {otherUser.displayName}
                </h3>
                <p className="font-mono text-xs max-w-sm text-white/50">
                  Real-time messaging, seen receipts, photos, voice notes, and calls on Berozgar.
                </p>
              </>
            )}
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isYou = msg.senderId === currentUser.uid;

            return (
              <div
                key={msg.id}
                className={`flex flex-col relative group/msg ${isYou ? 'items-end' : 'items-start'}`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {isGroupTapri && !isYou && (
                    <span className="font-mono text-[11px] font-bold text-[#ffb5a0] mr-0.5">
                      @{msg.senderUsername || 'chiller'}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-white/40">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Bubble Container */}
                <div className="relative max-w-[85%] sm:max-w-[70%] group/bubble">
                  {/* Floating Quick Reaction Toolbar */}
                  <div
                    className={`absolute -top-7 z-20 flex items-center gap-1 bg-[#141414] border border-white/20 rounded-full px-2 py-0.5 shadow-xl transition-all duration-200 opacity-0 scale-95 group-hover/bubble:opacity-100 group-hover/bubble:scale-100 pointer-events-none group-hover/bubble:pointer-events-auto ${
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
                          onClick={() => toggleMessageReaction(conversation.id, msg.id, currentUser.uid, emoji)}
                          className={`text-sm hover:scale-125 transition-transform p-0.5 rounded-full cursor-pointer ${
                            hasReacted ? 'bg-[#EF4E22]/30 scale-110' : 'hover:bg-white/10'
                          }`}
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>

                  {/* Message Bubble Content */}
                  <div
                    className={`p-3.5 rounded-2xl text-sm font-sans leading-relaxed break-words shadow-md transition-all ${
                      isYou
                        ? 'bg-[#EF4E22] text-white rounded-tr-none shadow-[0_2px_14px_rgba(239,78,34,0.3)] border border-[#ff673d]/30'
                        : 'bg-[#18284c] border border-white/10 text-[#FFF9F3] rounded-tl-none'
                    }`}
                  >
                    {/* Media: Image */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        <img
                          src={msg.mediaUrl}
                          alt={msg.mediaName || 'Image'}
                          onClick={() => setActiveMediaPreview({ url: msg.mediaUrl!, name: msg.mediaName || 'Photo' })}
                          className="max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Media: Video */}
                    {msg.type === 'video' && msg.mediaUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black">
                        <video src={msg.mediaUrl} controls className="max-h-72 w-full" />
                      </div>
                    )}

                    {/* Media: Audio / Voice Note */}
                    {msg.type === 'audio' && msg.mediaUrl && (
                      <div className="mb-1">
                        <AudioMessagePlayer src={msg.mediaUrl} duration={msg.mediaDuration} isYou={isYou} />
                      </div>
                    )}

                    {/* Media: File / Document */}
                    {msg.type === 'file' && (
                      <div className={`flex items-center justify-between gap-3 p-2.5 rounded-xl mb-2 ${
                        isYou ? 'bg-black/25 border border-white/20' : 'bg-black/30 border border-white/10'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={18} className={isYou ? "text-white shrink-0" : "text-[#EF4E22] shrink-0"} />
                          <span className="font-mono text-xs truncate text-white">{msg.mediaName || 'Document'}</span>
                        </div>
                        {msg.mediaUrl && (
                          <a
                            href={msg.mediaUrl}
                            download={msg.mediaName || 'download'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isYou
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-white/10 hover:bg-[#EF4E22] hover:text-[#FFF9F3] text-white'
                            }`}
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Call Log Info Notice */}
                    {msg.type === 'call_log' && (
                      <div className={`flex items-center gap-2 text-xs font-mono ${
                        isYou
                          ? 'text-white font-medium bg-black/25 px-2.5 py-1.5 rounded-lg border border-white/20'
                          : 'text-[#ff9274] font-medium bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10'
                      }`}>
                        <Phone size={14} className={isYou ? 'text-white' : 'text-[#EF4E22]'} />
                        <span>{msg.text}</span>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.type !== 'call_log' && msg.text && (
                      <p className={`whitespace-pre-wrap font-sans text-sm ${isYou ? 'text-white font-normal' : 'text-[#FFF9F3] font-normal'} leading-relaxed`}>
                        {msg.text}
                      </p>
                    )}

                    {/* Active Reactions list */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex flex-wrap gap-1.5 mt-2 pt-2 border-t ${isYou ? 'border-white/25' : 'border-white/10'}`}>
                        {Object.entries(msg.reactions).map(([emoji, reactorsVal]) => {
                          const reactors = (reactorsVal as string[]) || [];
                          const count = reactors.length;
                          if (count === 0) return null;
                          const isMyReaction = reactors.includes(currentUser.uid);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleMessageReaction(conversation.id, msg.id, currentUser.uid, emoji)}
                              className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                                isYou
                                  ? isMyReaction
                                    ? 'bg-black/40 text-white font-bold border border-white/35 shadow-xs'
                                    : 'bg-black/20 hover:bg-black/30 text-white/90 border border-white/15'
                                  : isMyReaction
                                  ? 'bg-[#EF4E22] text-[#FFF9F3] font-bold shadow-sm'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Seen Receipts & Delivery Status */}
                    {isYou && (
                      <div className="mt-1.5 pt-1 flex items-center justify-end gap-1.5 text-[10px] font-mono">
                        {msg.status === 'sending' && (
                          <span className="text-white/80 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                            <span>Sending</span>
                          </span>
                        )}
                        {msg.status === 'sent' && (
                          <span className="text-white/85 flex items-center gap-0.5" title="Sent (Single check)">
                            <Check size={12} />
                            <span>Sent</span>
                          </span>
                        )}
                        {msg.status === 'delivered' && (
                          <span className="text-white/95 flex items-center gap-0.5 font-medium" title="Delivered (Double check)">
                            <CheckCheck size={13} />
                            <span>Delivered</span>
                          </span>
                        )}
                        {msg.status === 'seen' && (
                          <span className="text-white font-semibold flex items-center gap-1 bg-black/25 px-1.5 py-0.5 rounded-md border border-white/20 shadow-xs" title="Seen">
                            <CheckCheck size={13} className="text-amber-300" />
                            <span className="text-white">Seen</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Remote User Typing Indicator Bubble */}
        {isOtherTyping && (
          <div className="flex items-end gap-2 text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
            <UserAvatar
              name={otherUser.displayName || otherUser.username}
              username={otherUser.username}
              photoURL={otherUser.photoURL}
              size="sm"
            />
            <div className="bg-[#18233c] border border-white/10 rounded-2xl rounded-bl-xs px-4 py-3 shadow-md flex items-center gap-2">
              <span className="text-xs font-mono text-white/70">
                {otherUser.displayName} is typing
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4E22] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4E22] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4E22] animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-3 bg-[#141414] border border-white/15 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-6 gap-2 max-w-xs">
            {EMOJI_PALETTE.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + em);
                  setShowEmojiPicker(false);
                }}
                className="text-xl p-1.5 hover:scale-125 transition-transform rounded-lg hover:bg-white/10"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Chat Input Bar */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0b1326]/95 backdrop-blur-md">
        {isRecordingVoice ? (
          <VoiceRecorder
            onSendVoice={handleSendVoiceNote}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Media Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Attach photos, videos, or documents"
            >
              <Paperclip size={18} />
            </button>

            {/* Emoji Picker Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Emoji Palette"
            >
              <Smile size={18} />
            </button>

            {/* Message Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Message ${otherUser.displayName}...`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#EF4E22] transition-colors"
              />
            </div>

            {/* Voice Record Button (or Send Button when text is present) */}
            {inputText.trim() ? (
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#EF4E22] text-[#FFF9F3] hover:bg-[#f3643d] transition-all shadow-[0_0_15px_rgba(239,78,34,0.3)] active:scale-95 cursor-pointer"
                title="Send Message"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#EF4E22] text-white hover:text-[#FFF9F3] transition-all cursor-pointer"
                title="Record Voice Note"
              >
                <Mic size={18} />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Media Fullscreen Viewer */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setActiveMediaPreview(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>
          <img
            src={activeMediaPreview.url}
            alt={activeMediaPreview.name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
          <div className="mt-4 flex items-center gap-4">
            <span className="font-mono text-xs text-white/70">{activeMediaPreview.name}</span>
            <a
              href={activeMediaPreview.url}
              download={activeMediaPreview.name}
              className="px-3 py-1.5 rounded-xl bg-[#EF4E22] text-[#FFF9F3] font-mono text-xs font-bold hover:bg-[#f3643d] transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Download</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
