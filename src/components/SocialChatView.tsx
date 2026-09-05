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
} from 'lucide-react';
import { Conversation, SocialMessage, UserProfile } from '../types';
import {
  subscribeToMessages,
  sendSocialMessage,
  markMessagesAsSeen,
  setTypingStatus,
  toggleMessageReaction,
} from '../lib/socialChatService';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { VoiceRecorder } from './VoiceRecorder';

interface SocialChatViewProps {
  conversation: Conversation;
  currentUser: UserProfile;
  onBackToSidebar: () => void;
  onStartCall: (type: 'voice' | 'video', targetUser: UserProfile) => void;
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
    displayName: 'Ciao User',
    photoURL: '',
    status: 'offline' as const,
    lastSeen: 0,
  };

  const isOtherTyping =
    conversation.typing?.[otherUid] && Date.now() - (conversation.typing[otherUid] || 0) < 4000;

  // Real-time messages subscription
  useEffect(() => {
    const unsub = subscribeToMessages(conversation.id, (loadedMessages) => {
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
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToSidebar}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>

          {/* User Avatar with status */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0 bg-neutral-900">
            <img
              src={otherUser.photoURL || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=ciao'}
              alt={otherUser.displayName}
              className="w-full h-full object-cover"
            />
            {otherUser.status === 'online' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#d6ff62] border-2 border-black shadow-[0_0_8px_#d6ff62]" />
            )}
          </div>

          {/* User Identity & Active Status */}
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>{otherUser.displayName}</span>
              <span className="text-[10px] font-mono text-white/40 hidden sm:inline">@{otherUser.username}</span>
            </h2>
            <div className="text-[11px] font-mono flex items-center gap-1.5">
              {isOtherTyping ? (
                <span className="text-[#d6ff62] font-bold animate-pulse flex items-center gap-1">
                  <span>typing</span>
                  <span className="animate-bounce">...</span>
                </span>
              ) : otherUser.status === 'online' ? (
                <span className="text-[#d6ff62] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d6ff62] animate-pulse" />
                  <span>Active now</span>
                </span>
              ) : (
                <span className="text-white/40">{formatLastSeen(otherUser.lastSeen)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls: Voice Call, Video Call, Search */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStartCall('voice', otherUser as UserProfile)}
            className="p-2 rounded-xl text-white/70 hover:text-[#d6ff62] hover:bg-white/5 transition-colors cursor-pointer"
            title="Start Voice Call"
          >
            <Phone size={18} />
          </button>

          <button
            type="button"
            onClick={() => onStartCall('video', otherUser as UserProfile)}
            className="p-2 rounded-xl text-white/70 hover:text-[#d6ff62] hover:bg-white/5 transition-colors cursor-pointer"
            title="Start Video Call"
          >
            <Video size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowInChatSearch(!showInChatSearch)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showInChatSearch ? 'text-[#d6ff62] bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* In-chat Search Bar Drawer */}
      {showInChatSearch && (
        <div className="p-2.5 bg-[#0f0f0f] border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2">
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
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Sparkles size={24} className="text-[#d6ff62]" />
            </div>
            <h3 className="font-serif italic text-lg text-white font-bold mb-1">
              End-to-End Chat with {otherUser.displayName}
            </h3>
            <p className="font-mono text-xs max-w-sm text-white/50">
              Real-time messaging, seen receipts, photos, voice notes, and audio/video calls. Say ciao!
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
                {/* Message Header */}
                <div className="flex items-center gap-1.5 mb-1 px-1">
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
                            hasReacted ? 'bg-[#d6ff62]/30 scale-110' : 'hover:bg-white/10'
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
                        ? 'bg-[#181818] border border-white/15 text-white rounded-tr-none'
                        : 'bg-[#121212] border border-white/10 text-white rounded-tl-none'
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
                      <div className="flex items-center justify-between gap-3 p-2.5 bg-black/30 border border-white/10 rounded-xl mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={18} className="text-[#d6ff62] shrink-0" />
                          <span className="font-mono text-xs truncate">{msg.mediaName || 'Document'}</span>
                        </div>
                        {msg.mediaUrl && (
                          <a
                            href={msg.mediaUrl}
                            download={msg.mediaName || 'download'}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-[#d6ff62] hover:text-black text-white transition-colors"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Call Log Info Notice */}
                    {msg.type === 'call_log' && (
                      <div className="flex items-center gap-2 text-xs font-mono text-[#d6ff62]">
                        <Phone size={14} />
                        <span>{msg.text}</span>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.type !== 'call_log' && msg.text && (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Active Reactions list */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
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
                                isMyReaction
                                  ? 'bg-[#d6ff62] text-black font-bold shadow-sm'
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
                      <div className="mt-1 pt-1 flex items-center justify-end gap-1 text-[10px] font-mono">
                        {msg.status === 'sending' && (
                          <span className="text-white/40 flex items-center gap-1">
                            <span className="w-2.5 h-2.5 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                            <span>Sending</span>
                          </span>
                        )}
                        {msg.status === 'sent' && (
                          <span className="text-white/50 flex items-center gap-0.5" title="Sent (Single check)">
                            <Check size={12} />
                            <span>Sent</span>
                          </span>
                        )}
                        {msg.status === 'delivered' && (
                          <span className="text-white/70 flex items-center gap-0.5" title="Delivered (Double check)">
                            <CheckCheck size={13} />
                            <span>Delivered</span>
                          </span>
                        )}
                        {msg.status === 'seen' && (
                          <span className="text-[#d6ff62] font-bold flex items-center gap-0.5" title="Seen (Double check in neon lime)">
                            <CheckCheck size={13} />
                            <span>Seen</span>
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
      <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#d6ff62] transition-colors"
              />
            </div>

            {/* Voice Record Button (or Send Button when text is present) */}
            {inputText.trim() ? (
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#d6ff62] text-black hover:bg-[#e4ff8f] transition-all shadow-[0_0_15px_rgba(214,255,98,0.2)] active:scale-95 cursor-pointer"
                title="Send Message"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#d6ff62] text-white hover:text-black transition-all cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl bg-[#d6ff62] text-black font-mono text-xs font-bold hover:bg-[#e4ff8f] transition-colors flex items-center gap-1.5"
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
