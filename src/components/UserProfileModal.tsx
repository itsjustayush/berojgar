import React, { useState } from 'react';
import { User, Sparkles, Check, X, Shield, Calendar, Edit3 } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile, setUserPresence } from '../lib/socialChatService';

interface UserProfileModalProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Atlas&backgroundColor=0d0d0d',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Echo&backgroundColor=141414',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nova&backgroundColor=1f1f1f',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Cipher&backgroundColor=050505',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pulse&backgroundColor=111827',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Quantum&backgroundColor=1a1a1a',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onUpdate,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || 'Available on Ciao');
  const [photoURL, setPhotoURL] = useState(user.photoURL || AVATAR_PRESETS[0]);
  const [status, setStatus] = useState<'online' | 'offline'>(user.status);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        displayName: displayName.trim() || user.username,
        bio: bio.trim(),
        photoURL,
        status,
      };

      await updateUserProfile(user.uid, updates);
      await setUserPresence(user.uid, status === 'online');

      const updatedUser: UserProfile = {
        ...user,
        ...updates,
      };

      onUpdate(updatedUser);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-serif italic text-xl font-bold text-white">Your Ciao Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Showcase & Presets */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#d6ff62] mb-3 shadow-lg">
              <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
            </div>

            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-2">
              Choose Avatar Preset
            </span>
            <div className="flex items-center gap-2 mb-4">
              {AVATAR_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoURL(p)}
                  className={`w-7 h-7 rounded-lg overflow-hidden border transition-transform ${
                    photoURL === p ? 'border-[#d6ff62] scale-110' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt={`Avatar ${idx}`} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          {/* Username (Immutable identity) */}
          <div>
            <label className="block font-mono text-[11px] text-white/50 uppercase tracking-wider mb-1">
              Username (Unique ID)
            </label>
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#d6ff62] flex items-center justify-between">
              <span>@{user.username}</span>
              <span className="text-[10px] text-white/40 font-mono">Permanent</span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block font-mono text-[11px] text-white/70 uppercase tracking-wider mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d6ff62]"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block font-mono text-[11px] text-white/70 uppercase tracking-wider mb-1">
              Bio / Status
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Chatting on Ciao"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d6ff62]"
            />
          </div>

          {/* Online Presence Status Toggle */}
          <div>
            <label className="block font-mono text-[11px] text-white/70 uppercase tracking-wider mb-1">
              Presence Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('online')}
                className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  status === 'online'
                    ? 'bg-[#d6ff62]/10 border-[#d6ff62] text-[#d6ff62]'
                    : 'border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#d6ff62]" />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('offline')}
                className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  status === 'offline'
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span>Appear Offline</span>
              </button>
            </div>
          </div>

          {/* Meta details */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
            <span className="flex items-center gap-1">
              <Shield size={12} className="text-[#d6ff62]" />
              <span>Firebase Cloud Auth</span>
            </span>
            <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#d6ff62] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#e4ff8f] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : savedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
