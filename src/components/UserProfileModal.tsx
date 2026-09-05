import React, { useState } from 'react';
import { User, Sparkles, Check, X, Shield, Calendar, Edit3 } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile, setUserPresence } from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';

interface UserProfileModalProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onUpdate,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || 'Available on Berozgar');
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
        photoURL: '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0e1933] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Mukta, sans-serif' }}>
              Your Berozgar Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Simple Minimal Avatar */}
          <div className="flex flex-col items-center py-2">
            <UserAvatar
              name={displayName || user.username}
              username={user.username}
              size="2xl"
              showStatus
              isOnline={status === 'online'}
              className="mb-2 shadow-xl"
            />
            <span className="font-mono text-xs text-[#EF4E22]">@{user.username}</span>
          </div>

          {/* Username (Immutable identity) */}
          <div>
            <label className="block font-mono text-[11px] text-white/50 uppercase tracking-wider mb-1">
              Username (Unique ID)
            </label>
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#EF4E22] flex items-center justify-between">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#EF4E22]"
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
              placeholder="e.g. Chatting on Berozgar"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#EF4E22]"
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
                    ? 'bg-[#EF4E22]/15 border-[#EF4E22] text-[#EF4E22]'
                    : 'border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#EF4E22]" />
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
              <Shield size={12} className="text-[#EF4E22]" />
              <span>Berozgar Network</span>
            </span>
            <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-[#EF4E22] text-[#FFF9F3] font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#f3643d] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
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
