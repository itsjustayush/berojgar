import React, { useState } from 'react';
import { X, Users, Lock, Globe, Sparkles, Copy, Check, Coffee } from 'lucide-react';
import { UserProfile, Conversation } from '../types';
import { getOrCreateTapri, sanitizeTapriName } from '../lib/socialChatService';

interface CreateTapriModalProps {
  currentUser: UserProfile;
  onSuccess?: (tapri: Conversation) => void;
  onCreated?: (tapri: Conversation) => void;
  onClose: () => void;
}

export const CreateTapriModal: React.FC<CreateTapriModalProps> = ({
  currentUser,
  onSuccess,
  onCreated,
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

      if (onCreated) onCreated(tapri);
      else if (onSuccess) onSuccess(tapri);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-lowest dark:bg-[#0d1c2d] border border-surface-variant/40 dark:border-white/10 shadow-2xl p-6 text-on-surface dark:text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs">
            <Coffee size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-sans text-on-surface dark:text-white">Open a New Tapri</h2>
            <p className="text-xs text-on-surface-variant">
              Late-night audio & text lounge for your crew
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-error-container text-on-error-container text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Tapri Handle */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 font-mono">
              Tapri Handle (Unique Name)
            </label>
            <div className="flex items-center gap-2 bg-surface-container-low dark:bg-[#051424] border border-surface-variant/30 dark:border-white/10 rounded-2xl px-3 py-2.5 focus-within:border-secondary transition-colors">
              <span className="text-sm font-bold text-secondary font-mono">#</span>
              <input
                type="text"
                value={tapriName}
                onChange={(e) => setTapriName(e.target.value)}
                placeholder="e.g. chai_n_code, midnight_bugs"
                className="bg-transparent flex-1 text-sm text-on-surface dark:text-white placeholder:text-on-surface-variant/50 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Display Title */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 font-mono">
              Display Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chai & Code Delhi Chapter"
              className="w-full bg-surface-container-low dark:bg-[#051424] border border-surface-variant/30 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-on-surface dark:text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 font-mono">
              Topic / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What are we talking or venting about?"
              className="w-full bg-surface-container-low dark:bg-[#051424] border border-surface-variant/30 dark:border-white/10 rounded-2xl px-3.5 py-2 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary resize-none transition-colors"
            />
          </div>

          {/* Privacy Switcher */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2 font-mono">
              Privacy Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isPublic
                    ? 'bg-secondary-container/20 border-secondary text-on-surface dark:text-white shadow-xs'
                    : 'bg-surface-container-low dark:bg-[#051424] border-surface-variant/30 dark:border-white/10 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface dark:text-white">
                  <Globe size={14} className="text-emerald-500" />
                  <span>Public Tapri</span>
                </div>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Anyone with the link can join freely
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  !isPublic
                    ? 'bg-secondary-container/20 border-secondary text-on-surface dark:text-white shadow-xs'
                    : 'bg-surface-container-low dark:bg-[#051424] border-surface-variant/30 dark:border-white/10 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface dark:text-white">
                  <Lock size={14} className="text-secondary" />
                  <span>Private Tapri</span>
                </div>
                <span className="text-[10px] text-on-surface-variant leading-tight">
                  Only invited chillers can see chats
                </span>
              </button>
            </div>
          </div>

          {/* Sharable Join Link Preview */}
          <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-[#051424] border border-surface-variant/30 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-on-surface-variant font-mono">Instant Join Link</span>
              <span className="text-xs font-mono text-on-surface dark:text-[#CBD5E1] truncate">{previewUrl}</span>
            </div>
            <button
              type="button"
              onClick={copyInviteLink}
              className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer flex-shrink-0 border border-surface-variant/30"
              title="Copy join link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !cleanName}
              className="px-5 py-2.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed disabled:opacity-40 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-on-secondary-container border-t-transparent rounded-full animate-spin" />
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
