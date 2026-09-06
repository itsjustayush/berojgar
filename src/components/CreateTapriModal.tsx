import React, { useState } from 'react';
import { X, Users, Lock, Globe, Sparkles, Copy, Check } from 'lucide-react';
import { UserProfile, Conversation } from '../types';
import { getOrCreateTapri, sanitizeTapriName } from '../lib/socialChatService';

interface CreateTapriModalProps {
  currentUser: UserProfile;
  onSuccess: (tapri: Conversation) => void;
  onClose: () => void;
}

export const CreateTapriModal: React.FC<CreateTapriModalProps> = ({
  currentUser,
  onSuccess,
  onClose,
}) => {
  const [tapriName, setTapriName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanName = sanitizeTapriName(tapriName);
  const previewUrl = `https://berojgarchat.vercel.app/tapri=${cleanName || 'your_tapri'}`;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanName || cleanName.length < 3) {
      setError('Tapri handle must be at least 3 characters (letters, numbers, underscores).');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const tapri = await getOrCreateTapri(cleanName, currentUser, {
        title: title.trim() || `#${cleanName}`,
        description: description.trim() || `Late night Tapri group for #${cleanName}`,
        isPublic,
      });

      onSuccess(tapri);
    } catch (err: any) {
      setError(err?.message || 'Failed to create Tapri. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard?.writeText(previewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0d1c2d] border border-white/10 shadow-2xl p-6 text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#ff5722]/15 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722]">
            <span className="material-symbols-outlined text-[26px]">local_cafe</span>
          </div>
          <div>
            <h2 className="text-xl font-bold font-sans">Open a New Tapri (Group Chat)</h2>
            <p className="text-xs text-[#64748B] font-mono">
              Late-night audio & text lounge for your crew
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Tapri Handle */}
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5 font-mono">
              Tapri Handle (Unique Name)
            </label>
            <div className="flex items-center gap-2 bg-[#051424] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#ff5722]">
              <span className="text-sm font-bold text-[#ff5722] font-mono">#</span>
              <input
                type="text"
                value={tapriName}
                onChange={(e) => setTapriName(e.target.value)}
                placeholder="e.g. chai_n_code, midnight_bugs"
                className="bg-transparent flex-1 text-sm text-white placeholder:text-white/30 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Display Title */}
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5 font-mono">
              Display Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chai & Code Delhi Chapter"
              className="w-full bg-[#051424] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff5722]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5 font-mono">
              Topic / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What are we talking or venting about?"
              className="w-full bg-[#051424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff5722] resize-none"
            />
          </div>

          {/* Privacy Switcher */}
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-2 font-mono">
              Privacy Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isPublic
                    ? 'bg-[#ff5722]/15 border-[#ff5722] text-white shadow-sm'
                    : 'bg-[#051424] border-white/10 text-[#64748B] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Globe size={14} className="text-[#22C55E]" />
                  <span>Public Tapri</span>
                </div>
                <span className="text-[10px] text-[#CBD5E1] leading-tight font-mono">
                  Anyone with the link can join freely
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  !isPublic
                    ? 'bg-[#ff5722]/15 border-[#ff5722] text-white shadow-sm'
                    : 'bg-[#051424] border-white/10 text-[#64748B] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Lock size={14} className="text-[#ffb5a0]" />
                  <span>Private Tapri</span>
                </div>
                <span className="text-[10px] text-[#CBD5E1] leading-tight font-mono">
                  Only invited chillers can see chats
                </span>
              </button>
            </div>
          </div>

          {/* Sharable Join Link Preview */}
          <div className="p-3 rounded-xl bg-[#051424] border border-white/10 flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#64748B] font-mono">Instant Join Link</span>
              <span className="text-xs font-mono text-[#CBD5E1] truncate">{previewUrl}</span>
            </div>
            <button
              type="button"
              onClick={copyInviteLink}
              className="p-2 rounded-lg bg-[#1C2D46] hover:bg-[#273647] text-white transition-colors cursor-pointer flex-shrink-0"
              title="Copy join link"
            >
              {copiedLink ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !cleanName}
              className="px-5 py-2.5 rounded-full bg-[#ff5722] hover:bg-[#F4511E] disabled:opacity-40 text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(255,87,34,0.35)] cursor-pointer flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Opening Tapri...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Create Tapri</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
