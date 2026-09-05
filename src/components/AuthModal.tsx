import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import {
  signUpWithUsername,
  signInWithUsername,
  checkUsernameAvailable,
  sanitizeUsername,
  generateDefaultAvatar,
} from '../lib/socialChatService';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Atlas&backgroundColor=0d0d0d',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Echo&backgroundColor=141414',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Nova&backgroundColor=1f1f1f',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Cipher&backgroundColor=050505',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pulse&backgroundColor=111827',
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('Available on Ciao');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [showPassword, setShowPassword] = useState(false);

  // Validation & async availability states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounced username availability check
  useEffect(() => {
    if (mode !== 'signup') {
      setIsUsernameAvailable(null);
      return;
    }

    const clean = sanitizeUsername(username);
    if (clean.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(clean);
        setIsUsernameAvailable(available);
      } catch {
        setIsUsernameAvailable(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const clean = sanitizeUsername(username);
      if (!clean) {
        throw new Error('Please enter a valid username');
      }

      if (mode === 'signup') {
        if (clean.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (isUsernameAvailable === false) {
          throw new Error('This username is already taken. Choose another.');
        }

        const profile = await signUpWithUsername(
          clean,
          displayName.trim() || clean,
          password,
          bio,
          selectedAvatar
        );
        onSuccess(profile);
      } else {
        if (!password) {
          throw new Error('Please enter your password');
        }
        const profile = await signInWithUsername(clean, password);
        onSuccess(profile);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoUser: string, demoName: string) => {
    setUsername(demoUser);
    setPassword('ciao1234');
    if (mode === 'signup') {
      setDisplayName(demoName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glowing aura */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#d6ff62]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#7342E2]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d6ff62] text-black flex items-center justify-center font-bold font-mono text-base shadow-[0_0_20px_rgba(214,255,98,0.3)]">
              C
            </div>
            <div>
              <span className="font-serif italic text-2xl font-bold text-white tracking-tight">Ciao</span>
              <span className="ml-2 font-mono text-[10px] text-[#d6ff62] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#d6ff62]/10 border border-[#d6ff62]/20">
                Social
              </span>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-white/40 hover:text-white text-xs font-mono px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg font-bold transition-all ${
              mode === 'signup'
                ? 'bg-[#d6ff62] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg font-bold transition-all ${
              mode === 'signin'
                ? 'bg-[#d6ff62] text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector (Signup only) */}
          {mode === 'signup' && (
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#d6ff62] mb-2 shadow-lg">
                <img src={selectedAvatar} alt="Selected avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(preset)}
                    className={`w-7 h-7 rounded-lg overflow-hidden border transition-transform ${
                      selectedAvatar === preset ? 'border-[#d6ff62] scale-110' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username Input (Instagram style) */}
          <div>
            <label className="block font-mono text-[11px] text-white/70 uppercase tracking-wider mb-1.5">
              Unique Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40 font-mono text-sm">
                @
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                placeholder="username (e.g. ayush)"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-2.5 text-sm text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-[#d6ff62] transition-colors"
              />

              {mode === 'signup' && username.length >= 3 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isCheckingUsername ? (
                    <div className="w-4 h-4 border-2 border-[#d6ff62] border-t-transparent rounded-full animate-spin" />
                  ) : isUsernameAvailable ? (
                    <CheckCircle2 size={16} className="text-[#d6ff62]" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
            {mode === 'signup' && username.length >= 3 && (
              <p className={`font-mono text-[10px] mt-1 ${isUsernameAvailable ? 'text-[#d6ff62]' : 'text-red-400'}`}>
                {isCheckingUsername
                  ? 'Checking availability...'
                  : isUsernameAvailable
                  ? '✓ Username is available'
                  : '✕ Username already registered'}
              </p>
            )}
          </div>

          {/* Display Name (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block font-mono text-[11px] text-white/70 uppercase tracking-wider mb-1.5">
                Full / Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ayush Sharma"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#d6ff62] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block font-mono text-[11px] text-white/70 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-[#d6ff62] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs flex items-center gap-2">
              <XCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && isUsernameAvailable === false)}
            className="w-full py-3 bg-[#d6ff62] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#e4ff8f] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(214,255,98,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Ciao Account' : 'Sign In to Ciao'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fillers for Instant Testing */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <span className="block font-mono text-[10px] text-white/40 uppercase tracking-widest text-center mb-2">
            Quick 1-Click Test Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('alex_ciao', 'Alex Rivera')}
              className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck size={12} className="text-[#d6ff62]" />
              <span>@alex_ciao</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('sarah_tech', 'Sarah Connor')}
              className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck size={12} className="text-[#d6ff62]" />
              <span>@sarah_tech</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
