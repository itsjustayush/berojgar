import React, { useState, useEffect } from 'react';
import {
  signUpWithUsername,
  signInWithUsername,
  checkUsernameAvailable,
  sanitizeUsername,
} from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';
import { UserProfile } from '../types';
import { detectUserGeoLocation } from '../lib/locationService';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  onCancel?: () => void;
  initialUsername?: string;
  initialMode?: 'signin' | 'signup';
}

const BRAND_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AV9byNA9FQpRcjaipoJx0Wsa2-Zg_9rrkTlCjzdUg3om-SOQaPwkH1N4z0kFoe3B39efO8poxiohSM4LvMKfnSP-Froza0igkREI6qfgPzv4ddstqmGBqmvv0wHkJH7bIIdBsJvD2J_XEIxNaf1bk3qxSqlfyMd3xt0RMSjsaFpGe7F-L2pXqhjS3wolQReWlF1dBan3uhbHxj2ngxZvvV7iSylugDdb73FB4YmakFUHrgJjPLQnQgBXb0DPnIo7Gg';

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
  const [bio] = useState('Available on Berozgar');
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

  // Keyboard accessibility: Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <div
        id="auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-desc"
        className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] overflow-x-hidden text-on-surface transition-colors"
      >
        {/* Ambient Brand Glow matching Landing Page */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -z-10 pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-secondary-container/20 blur-3xl -z-10 pointer-events-none rounded-full" />

        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-primary-container shrink-0 border border-outline-variant/20">
              <img
                alt="Berojgar Logo"
                className="w-full h-full object-cover"
                src={BRAND_LOGO_URL}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  id="auth-modal-title"
                  className="text-[22px] font-extrabold tracking-tight text-on-surface"
                >
                  Berojgar
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">local_cafe</span>
                  <span>Chai</span>
                </span>
              </div>
              <span
                id="auth-modal-desc"
                className="text-[12px] font-medium text-on-surface-variant"
              >
                Where ideas brew over tea
              </span>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close authentication modal"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Mode Switcher Tabs - Styled as elegant rounded pills */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="grid grid-cols-2 p-1.5 bg-surface-container rounded-full mb-6 border border-outline-variant/30"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`min-h-[42px] py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              mode === 'signup'
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Create Account</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`min-h-[42px] py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              mode === 'signin'
                ? 'bg-surface text-on-surface shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview (Signup only) */}
          {mode === 'signup' && (
            <div className="flex flex-col items-center justify-center py-2 mb-1">
              <div className="relative mb-2">
                <UserAvatar
                  name={displayName || username || 'Berojgar'}
                  username={username}
                  size="xl"
                  className="shadow-sm ring-4 ring-primary/20"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">local_cafe</span>
                </span>
              </div>
              <span className="text-[12px] font-semibold text-on-surface-variant">
                @{username || 'your_handle'}
              </span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label htmlFor="auth-username-input" className="block text-xs font-bold text-on-surface mb-1.5">
              Unique Username
            </label>
            <div className="relative flex items-center rounded-2xl bg-surface-container border border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all text-on-surface shadow-2xs">
              <span className="pl-3.5 text-on-surface-variant font-bold text-sm">@</span>
              <input
                id="auth-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                placeholder="username (e.g. ayush)"
                required
                className="w-full bg-transparent px-2.5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-medium min-h-[44px]"
              />

              {mode === 'signup' && username.length >= 3 && (
                <div className="pr-3.5 flex items-center pointer-events-none">
                  {isCheckingUsername ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : isUsernameAvailable ? (
                    <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-red-500">
                      cancel
                    </span>
                  )}
                </div>
              )}
            </div>

            {mode === 'signup' && username.length >= 3 && (
              <p
                className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${
                  isUsernameAvailable
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isCheckingUsername ? (
                  <span>Checking handle availability...</span>
                ) : isUsernameAvailable ? (
                  <>
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>Handle is available</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    <span>Handle is already taken</span>
                  </>
                )}
              </p>
            )}
          </div>

          {/* Display Name (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-display-name-input" className="block text-xs font-bold text-on-surface mb-1.5">
                Display / Full Name
              </label>
              <div className="relative flex items-center rounded-2xl bg-surface-container border border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all text-on-surface shadow-2xs">
                <span className="material-symbols-outlined text-on-surface-variant text-[19px] pl-3.5">
                  badge
                </span>
                <input
                  id="auth-display-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ayush Bhattacharya"
                  className="w-full bg-transparent px-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-medium min-h-[44px]"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div>
            <label htmlFor="auth-password-input" className="block text-xs font-bold text-on-surface mb-1.5">
              Password
            </label>
            <div className="relative flex items-center rounded-2xl bg-surface-container border border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all text-on-surface shadow-2xs">
              <span className="material-symbols-outlined text-on-surface-variant text-[19px] pl-3.5">
                lock
              </span>
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-transparent px-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-medium min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer mr-1 focus-visible:outline-2 focus-visible:outline-primary"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined text-[19px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === 'signup' && isUsernameAvailable === false)}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-primary hover:bg-primary/90 text-on-primary shadow-md hover:shadow-lg font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">local_cafe</span>
                <span>{mode === 'signup' ? 'Create Berojgar Account' : 'Sign In to Berojgar'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fillers for Instant Testing */}
        <div className="mt-6 pt-5 border-t border-outline-variant/30">
          <span className="block text-[11px] font-bold text-on-surface-variant tracking-wider uppercase text-center mb-3">
            Quick 1-Click Test Accounts
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemoAccount('ayush_berozgar', 'Ayush Bhattacharya')}
              aria-label="Use demo account Ayush (@ayush_berozgar)"
              className="min-h-[44px] py-2.5 px-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/60 rounded-2xl text-on-surface text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                account_circle
              </span>
              <span className="font-bold text-on-surface truncate">@ayush_berozgar</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('priya_chat', 'Priya Patel')}
              aria-label="Use demo account Priya (@priya_chat)"
              className="min-h-[44px] py-2.5 px-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/60 rounded-2xl text-on-surface text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                account_circle
              </span>
              <span className="font-bold text-on-surface truncate">@priya_chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
