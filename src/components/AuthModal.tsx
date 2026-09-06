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
} from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';
import { UserProfile } from '../types';
import { BerozgarLogo } from './BerozgarLogo';
import { detectUserGeoLocation } from '../lib/locationService';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
  initialUsername?: string;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onCancel,
  initialUsername = '',
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('Available on Berozgar');
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

        // Detect accurate fixed geographic location on signup
        let detectedLocation = '';
        let detectedTimezone = '';
        try {
          const geo = await detectUserGeoLocation();
          detectedLocation = geo.locationString;
          detectedTimezone = geo.timezone;
        } catch {
          // Fallback handled within signUpWithUsername
        }

        const profile = await signUpWithUsername(
          clean,
          displayName.trim() || clean,
          password,
          bio,
          '',
          detectedLocation,
          detectedTimezone
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
      let msg = err.message || 'Authentication failed. Please check credentials.';
      if (err.code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
        msg = 'Connection to Firebase Identity service was blocked or offline. Please check your internet connection.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This username is already registered. Switch to Sign In.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = 'Invalid username or password. Please verify your credentials.';
      } else if (err.code === 'auth/invalid-profile-attribute') {
        msg = 'Profile configuration error. Please try again with simple credentials.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoUser: string, demoName: string) => {
    setUsername(demoUser);
    setPassword('berozgar1234');
    if (mode === 'signup') {
      setDisplayName(demoName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e1933] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Glowing aura */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#EF4E22]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#EF4E22]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="flex items-center justify-between mb-5">
          <BerozgarLogo variant="horizontal" size="md" />

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
        <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#EF4E22] text-[#FFF9F3] shadow-md'
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
            className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg font-bold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#EF4E22] text-[#FFF9F3] shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Avatar Preview (Signup only) */}
          {mode === 'signup' && (
            <div className="flex flex-col items-center justify-center py-2 mb-1">
              <UserAvatar
                name={displayName || username || 'Berozgar'}
                username={username}
                size="xl"
                className="mb-1.5 shadow-md"
              />
              <span className="font-mono text-[11px] text-white/40 tracking-wide">
                @{username || 'username'}
              </span>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-2.5 text-sm text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-[#EF4E22] transition-colors"
              />

              {mode === 'signup' && username.length >= 3 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isCheckingUsername ? (
                    <div className="w-4 h-4 border-2 border-[#EF4E22] border-t-transparent rounded-full animate-spin" />
                  ) : isUsernameAvailable ? (
                    <CheckCircle2 size={16} className="text-[#EF4E22]" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>
              )}
            </div>
            {mode === 'signup' && username.length >= 3 && (
              <p className={`font-mono text-[10px] mt-1 ${isUsernameAvailable ? 'text-[#EF4E22]' : 'text-red-400'}`}>
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
                  placeholder="e.g. Ayush Bhattacharya"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#EF4E22] transition-colors"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-[#EF4E22] transition-colors"
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
            className="w-full py-3 bg-[#EF4E22] text-[#FFF9F3] font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#f3643d] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,78,34,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#FFF9F3] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Berozgar Account' : 'Sign In to Berozgar'}</span>
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
              onClick={() => fillDemoAccount('ayush_berozgar', 'Ayush Bhattacharya')}
              className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck size={12} className="text-[#EF4E22]" />
              <span>@ayush_berozgar</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('priya_chat', 'Priya Patel')}
              className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck size={12} className="text-[#EF4E22]" />
              <span>@priya_chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
