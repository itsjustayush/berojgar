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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-surface-container-lowest dark:bg-[#0e1933] border border-surface-variant/40 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh] text-on-surface dark:text-white">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-sans text-on-surface dark:text-white">
              Your Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
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
              className="mb-2 shadow-md"
            />
            <span className="font-mono text-xs font-bold text-secondary">@{user.username}</span>
          </div>

          {/* Username (Immutable identity) */}
          <div>
            <label className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
              Username (Unique ID)
            </label>
            <div className="px-3.5 py-2.5 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-surface-variant/30 dark:border-white/10 text-xs font-mono text-secondary flex items-center justify-between">
              <span>@{user.username}</span>
              <span className="text-[10px] text-on-surface-variant font-mono">Permanent</span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-white/5 border border-surface-variant/30 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
              Bio / Status
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Chatting on Berozgar"
              className="w-full bg-surface-container-low dark:bg-white/5 border border-surface-variant/30 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-on-surface dark:text-white placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Online Presence Status Toggle */}
          <div>
            <label className="block font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">
              Presence Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('online')}
                className={`py-2 px-3 rounded-full border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  status === 'online'
                    ? 'bg-secondary-container text-on-secondary-container border-secondary shadow-xs'
                    : 'bg-surface-container-low border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('offline')}
                className={`py-2 px-3 rounded-full border font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  status === 'offline'
                    ? 'bg-surface-container text-on-surface border-surface-variant shadow-xs'
                    : 'bg-surface-container-low border-surface-variant/30 text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>Appear Offline</span>
              </button>
            </div>
          </div>

          {/* Meta details */}
          <div className="pt-2 border-t border-surface-variant/30 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Shield size={12} className="text-secondary" />
              <span>Berojgar Network</span>
            </span>
            <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-secondary-container text-on-secondary-container font-mono font-bold text-xs uppercase tracking-wider rounded-full hover:bg-secondary-fixed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
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
