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

  // Extract other user
  const otherUid = conversation.participants.find((p) => p !== currentUser.uid) || '';
  const otherUser = conversation.participantDetails?.[otherUid] || {
    uid: otherUid,
    username: 'radermiler',
    displayName: 'Rader Miler',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'online' as const,
    role: 'Lead Product Designer',
    city: 'Bangalore (IST • 11:15 AM)',
  };

  const isOtherTyping =
    conversation.typing?.[otherUid] &&
    Date.now() - (conversation.typing[otherUid] || 0) < 4000;

  // Realtime messages subscription
  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversation.id, (incoming) => {
      setMessages(incoming);
      markMessagesAsSeen(conversation.id, currentUser.uid);
    });

    markMessagesAsSeen(conversation.id, currentUser.uid);

    return () => {
      unsubscribe();
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

  const isGroupTapri = conversation.type === 'group';
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
    <div className="flex-1 h-full flex overflow-hidden bg-[#F8F9FA] dark:bg-[#080F21] text-slate-900 dark:text-slate-100 relative">
      {/* Center Chat Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden border-r border-slate-200/80 dark:border-slate-800">
        {/* 1. CHAT HEADER BAR */}
        <header className="px-5 py-3.5 bg-white dark:bg-[#0B1120] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between z-10 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {onBackToSidebar && (
              <button
                type="button"
                onClick={onBackToSidebar}
                className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {/* Avatar */}
            {isGroupTapri ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 shadow-xs font-mono font-bold">
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
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {isGroupTapri
                    ? `#${conversation.tapriName || conversation.tapriTitle || 'Tapri'}`
                    : otherUser.displayName}
                </h2>
                {!isGroupTapri && (
                  <CheckCircle2 size={14} className="text-blue-500 fill-blue-500/10 shrink-0" />
                )}
                {!isGroupTapri && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/40 text-[10px] font-semibold">
                    Chai Partner
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                {isGroupTapri ? (
                  <>
                    <Users size={12} className="text-orange-500" />
                    <span>{conversation.participants.length} chillers in Tapri</span>
                  </>
                ) : isOtherTyping ? (
                  <span className="text-orange-600 font-semibold animate-pulse">
                    Typing a message...
                  </span>
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
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Start Voice Call"
                >
                  <Phone size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => onStartCall('video', otherUser as UserProfile)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
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
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Coffee size={14} />
                <span>Send Chai ☕</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowInChatSearch(!showInChatSearch)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Search conversation"
            >
              <Search size={15} />
            </button>

            <button
              type="button"
              onClick={() => setShowDetailsSidebar(!showDetailsSidebar)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showDetailsSidebar
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-orange-500 dark:border-orange-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Toggle Profile Details"
            >
              <PanelRight size={15} />
            </button>
          </div>
        </header>

        {/* In-Chat Search Drawer */}
        {showInChatSearch && (
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={inChatSearchQuery}
              onChange={(e) => setInChatSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
            />
            {inChatSearchQuery && (
              <span className="text-[11px] font-mono text-slate-400">
                {displayedMessages.length} match(es)
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setShowInChatSearch(false);
                setInChatSearchQuery('');
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* 2. MESSAGES FEED STREAM */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Date separator */}
          <div className="flex items-center justify-center my-3">
            <span className="px-3.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-medium shadow-2xs">
              Today, Oct 24
            </span>
          </div>

          {displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 flex items-center justify-center mb-3 text-orange-600 dark:text-orange-400 shadow-xs">
                <Coffee size={28} />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Say hello over a hot cup of tea!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Drop wireframes, voice notes, code snippets, or share ideas in real-time.
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isYou = msg.senderId === currentUser.uid;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col relative group/msg ${isYou ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender name for group tapri */}
                  {isGroupTapri && !isYou && (
                    <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400 mb-1 ml-1">
                      @{msg.senderUsername || 'chiller'}
                    </span>
                  )}

                  <div className="relative max-w-[85%] sm:max-w-[70%] group/bubble">
                    {/* Floating Reaction Bar */}
                    <div
                      className={`absolute -top-7 z-20 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-lg transition-all duration-200 opacity-0 scale-95 group-hover/bubble:opacity-100 group-hover/bubble:scale-100 pointer-events-none group-hover/bubble:pointer-events-auto ${
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
                              hasReacted ? 'bg-orange-100 dark:bg-orange-950/60 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
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
                          ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white rounded-tr-xs shadow-xs'
                          : 'bg-white dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      {/* Image Preview */}
                      {msg.type === 'image' && msg.mediaUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
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
                              : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-bold truncate block">
                                {msg.mediaName || 'Document'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {msg.mediaSize ? `${(msg.mediaSize / (1024 * 1024)).toFixed(1)} MB` : '14.2 MB'} • File
                              </span>
                            </div>
                          </div>
                          {msg.mediaUrl && (
                            <a
                              href={msg.mediaUrl}
                              download={msg.mediaName || 'download'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isYou ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-orange-500 hover:text-white'
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
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-black/10 dark:border-white/10">
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
                                    ? 'bg-orange-500 text-white font-bold'
                                    : isYou
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
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
                      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] font-mono opacity-70">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isYou && (
                          <span>
                            {msg.status === 'seen' ? (
                              <CheckCheck size={13} className="text-amber-300 inline" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck size={13} className="inline" />
                            ) : (
                              <Check size={12} className="inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing bubble */}
          {isOtherTyping && (
            <div className="flex items-center gap-2 text-left animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-xs flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {otherUser.displayName} is typing
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Emoji Palette Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-24 left-6 z-30 p-3 bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in">
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_PALETTE.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + em);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl p-1.5 hover:scale-125 transition-transform rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. FLOATING BOTTOM COMPOSER DOCK */}
        <div className="p-4 bg-white/90 dark:bg-[#0B1120]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800">
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
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                title="Attach media or files"
              >
                <Paperclip size={17} />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              {/* Voice Note Button or Send Button */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  className="p-2.5 rounded-2xl bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white transition-all shadow-sm cursor-pointer"
                  title="Send message"
                >
                  <Send size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
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
        <aside className="w-80 lg:w-[320px] shrink-0 h-full bg-white dark:bg-[#0B1120] border-l border-slate-200/80 dark:border-slate-800 flex flex-col justify-between overflow-y-auto custom-scrollbar p-6 z-20">
          <div className="space-y-6">
            {/* Header with Close */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Details</h3>
              <button
                type="button"
                onClick={() => setShowDetailsSidebar(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile Spotlight */}
            <div className="flex flex-col items-center text-center space-y-2.5">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                  <img
                    src={otherUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt={otherUser.displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {otherUser.status === 'online' && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-3 ring-white dark:ring-[#0B1120]" />
                )}
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {otherUser.displayName}
                  </h4>
                  <CheckCircle2 size={15} className="text-blue-500 fill-blue-500/10 shrink-0" />
                </div>
                <div className="text-xs font-mono text-slate-400">@{otherUser.username}</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
                  {otherUser.role || 'Lead Product Designer'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {otherUser.city || 'Bangalore (IST • 11:15 AM)'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons Row */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onStartCall('voice', otherUser as UserProfile)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Phone size={14} />
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => onStartCall('video', otherUser as UserProfile)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Video size={14} />
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Video</span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <BellOff size={14} />
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Mute</span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                  <Folder size={14} />
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Files</span>
              </button>
            </div>

            {/* Chai Streak Card */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm space-y-1">
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
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <div className="flex items-center gap-3">
                  {(['media', 'links', 'docs'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSharedTab(tab)}
                      className={`text-xs font-semibold pb-1 cursor-pointer capitalize ${
                        sharedTab === tab
                          ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-400">View all</span>
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
                    className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group cursor-pointer"
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
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Pinned Resources
              </span>
              <div className="space-y-2">
                <a
                  href="https://figma.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/50 transition-all text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    Berozgar Mobile Canvas V2
                  </span>
                  <ExternalLink size={13} className="text-slate-400 shrink-0" />
                </a>

                <a
                  href="https://notion.so"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-orange-500/50 transition-all text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    Audio Protocol Specs
                  </span>
                  <ExternalLink size={13} className="text-slate-400 shrink-0" />
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
