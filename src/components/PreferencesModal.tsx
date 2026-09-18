import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Palette,
  Mic,
  Shield,
  Bell,
  Check,
  Coffee,
  Sun,
  Moon,
  Laptop,
  Volume2,
  Lock,
  Sparkles,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile, setUserPresence } from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';

interface PreferencesModalProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  initialTab?: 'profile' | 'appearance' | 'audio' | 'privacy' | 'notifications';
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  user,
  onUpdate,
  onClose,
  isDarkMode,
  onToggleDarkMode,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'audio' | 'privacy' | 'notifications'>(initialTab);

  // Profile fields
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || 'Available on Berozgar');
  const [status, setStatus] = useState<'online' | 'offline'>(user.status);
  const [teaPreference, setTeaPreference] = useState(user.customVibeTag || 'Kadak Masala Chai ☕');
  const [city, setCity] = useState(user.city || 'Bangalore, IST');

  // Appearance fields
  const [themeChoice, setThemeChoice] = useState<'light' | 'dark' | 'system'>(isDarkMode ? 'dark' : 'light');

  // Audio fields
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [micTestLevel, setMicTestLevel] = useState(0);
  const [isTestingMic, setIsTestingMic] = useState(false);

  // Privacy fields
  const [allowDirectHuddle, setAllowDirectHuddle] = useState(true);
  const [stealthPresence, setStealthPresence] = useState(false);

  // Notifications
  const [msgSound, setMsgSound] = useState(true);
  const [huddleAlerts, setHuddleAlerts] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Mic test simulator or Web Audio monitor
  useEffect(() => {
    let interval: number;
    if (isTestingMic) {
      interval = window.setInterval(() => {
        setMicTestLevel(Math.floor(20 + Math.random() * 65));
      }, 150);
    } else {
      setMicTestLevel(0);
    }
    return () => clearInterval(interval);
  }, [isTestingMic]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        displayName: displayName.trim() || user.username,
        bio: bio.trim(),
        status,
        customVibeTag: teaPreference,
        city: city.trim(),
      };

      await updateUserProfile(user.uid, updates);
      await setUserPresence(user.uid, status === 'online');

      onUpdate({
        ...user,
        ...updates,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTheme = (theme: 'light' | 'dark' | 'system') => {
    setThemeChoice(theme);
    if (theme === 'light' && isDarkMode) {
      onToggleDarkMode();
    } else if (theme === 'dark' && !isDarkMode) {
      onToggleDarkMode();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0E172A] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] text-slate-900 dark:text-slate-100">
        {/* Left Tabs Rail */}
        <div className="w-full md:w-60 shrink-0 bg-slate-50 dark:bg-[#0B1120] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                <Coffee size={17} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Preferences Hub</h2>
                <div className="text-[10px] font-mono text-slate-400">Settings & Identity</div>
              </div>
            </div>

            {/* Tabs List */}
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'My Profile', icon: User },
                { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
                { id: 'audio', label: 'Audio & Voice Lounge', icon: Mic },
                { id: 'privacy', label: 'Privacy & Security', icon: Shield },
                { id: 'notifications', label: 'Notifications', icon: Bell },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all text-left cursor-pointer ${
                    activeTab === id
                      ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 px-2 hidden md:block">
            <div className="text-[11px] font-mono text-slate-400">Berozgar App v2.4</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Encrypted P2P Voice & Chat</div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0E172A]">
          {/* Header Bar with Close Button */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {activeTab === 'profile' && 'My Profile & Chai Bio'}
              {activeTab === 'appearance' && 'Appearance & Canvas Theme'}
              {activeTab === 'audio' && 'Audio & Voice Lounge (Tapri)'}
              {activeTab === 'privacy' && 'Privacy & Security Shield'}
              {activeTab === 'notifications' && 'Notification Settings'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <UserAvatar
                    name={displayName || user.username}
                    username={user.username}
                    photoURL={user.photoURL}
                    size="lg"
                    showStatus
                    isOnline={status === 'online'}
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{displayName || user.username}</div>
                    <div className="text-xs font-mono text-orange-600 dark:text-orange-400">@{user.username}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Status: {status === 'online' ? 'Active now' : 'Offline'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      City / Timezone
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                      placeholder="e.g. Bangalore, IST"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Favorite Tea / Chai Style
                  </label>
                  <input
                    type="text"
                    value={teaPreference}
                    onChange={(e) => setTeaPreference(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                    placeholder="e.g. Kadak Masala Chai with Elaichi ☕"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bio & Tagline
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 dark:text-white"
                    placeholder="Tell other chai lovers what you build..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {savedSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check size={14} /> Saved successfully!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-orange-500 dark:hover:bg-orange-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Canvas Palette & Theme</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose the visual atmosphere that fits your workflow.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Light Warmth Theme */}
                  <div
                    onClick={() => handleSelectTheme('light')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      !isDarkMode
                        ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Sun size={15} />
                        </div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Light Warmth ☕</span>
                      </div>
                      {!isDarkMode && <Check size={16} className="text-orange-600" />}
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-slate-200 space-y-1.5 text-[10px] text-slate-600">
                      <div className="w-16 h-2 bg-slate-300 rounded-full" />
                      <div className="w-24 h-2 bg-orange-200 rounded-full" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                      Clean off-white canvas, slate typography, and terracotta warmth.
                    </p>
                  </div>

                  {/* Deep Navy Theme */}
                  <div
                    onClick={() => handleSelectTheme('dark')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isDarkMode
                        ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 flex items-center justify-center">
                          <Moon size={15} />
                        </div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Deep Navy 🌙</span>
                      </div>
                      {isDarkMode && <Check size={16} className="text-orange-500" />}
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#080F21] border border-slate-700 space-y-1.5 text-[10px] text-slate-300">
                      <div className="w-16 h-2 bg-slate-600 rounded-full" />
                      <div className="w-24 h-2 bg-orange-500/50 rounded-full" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
                      Atmospheric midnight blue for late night coding and low-light sessions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AUDIO TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Microphone Level Test</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Speak into your mic to test sensitivity</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTestingMic(!isTestingMic)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isTestingMic ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isTestingMic ? 'Stop Test' : 'Test Mic'}
                    </button>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 transition-all duration-100"
                      style={{ width: `${micTestLevel}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Crisp Noise Suppression</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Filters keyboard clatter and ambient fan hum</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>
              </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Allow Direct Chai Huddles</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Permit network members to invite you to voice calls</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowDirectHuddle}
                    onChange={(e) => setAllowDirectHuddle(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Stealth / Incognito Mode</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Browse Tapris and conversations without showing green dot</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stealthPresence}
                    onChange={(e) => setStealthPresence(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Message Ding Sound</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Play subtle acoustic chime when new messages arrive</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={msgSound}
                    onChange={(e) => setMsgSound(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Chai Huddle Alert Toasts</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Show notification toasts when someone starts speaking in your tapris</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={huddleAlerts}
                    onChange={(e) => setHuddleAlerts(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
