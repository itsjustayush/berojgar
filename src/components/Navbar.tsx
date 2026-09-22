import { useEffect, useState } from 'react';
import {
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  X,
  User as UserIcon,
  Coffee,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { ViewMode, UserSession, UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { BerozgarLogo } from './BerozgarLogo';

interface NavbarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  session: UserSession;
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onUpdateNickname: (newName: string) => void;
  latencyMs: number;
}

export function Navbar({
  currentView,
  setView,
  currentUser,
  onOpenProfile,
  onOpenAuth,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('berozgar_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('berozgar_theme', 'light');
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navigate = (view: ViewMode) => {
    setView(view);
    setMenuOpen(false);
  };

  const navItems: Array<{ view: ViewMode; label: string; icon: typeof MessageSquare }> = [
    { view: 'LANDING', label: 'Home', icon: Coffee },
    { view: 'CHATS', label: 'Messages & Tapris', icon: MessageSquare },
    { view: 'DIRECTORY', label: 'Directory & Network', icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-surface-variant/30 bg-surface/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('CHATS')}
            className="group flex items-center gap-3 text-left cursor-pointer bg-transparent border-0 p-0"
            aria-label="Go to Berozgar Chats"
          >
            <BerozgarLogo variant="horizontal" size="md" showTagline />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('LANDING')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'LANDING'
                  ? 'bg-secondary-container text-on-secondary-container shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate('CHATS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'CHATS'
                  ? 'bg-secondary-container text-on-secondary-container shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Chats & Tapris
            </button>
            <button
              onClick={() => navigate('DIRECTORY')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                currentView === 'DIRECTORY'
                  ? 'bg-secondary-container text-on-secondary-container shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              Directory
            </button>
          </nav>
        </div>

        {/* Right Header Status & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDark}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <Sun size={17} className="text-secondary" /> : <Moon size={17} />}
          </button>

          {/* Profile / Auth Button */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="group flex items-center gap-2 rounded-full border border-surface-variant/40 bg-surface-container-low px-3 py-1 transition-all hover:border-secondary/40 hover:bg-surface-container cursor-pointer"
              title="Your Berozgar Profile"
            >
              <UserAvatar
                name={currentUser.displayName}
                username={currentUser.username}
                photoURL={currentUser.photoURL}
                size="xs"
              />
              <span className="text-xs font-semibold text-on-surface group-hover:text-secondary max-w-[120px] truncate hidden sm:inline">
                @{currentUser.username}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed px-5 py-2 text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-2xs"
            >
              <UserIcon size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-surface-variant/40 bg-surface-container-low text-on-surface md:hidden cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {menuOpen ? <X size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="border-t border-surface-variant/30 bg-surface-container-lowest px-5 py-4 md:hidden animate-in slide-in-from-top-2"
        >
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navItems.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => navigate(view)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm cursor-pointer transition-colors ${
                  currentView === view
                    ? 'bg-secondary-container text-on-secondary-container font-bold shadow-2xs'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-surface-variant/30 pt-4 font-mono text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-secondary" />
              <span>Berozgar Network</span>
            </span>
            {currentUser && (
              <span className="text-secondary font-semibold">@{currentUser.username}</span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
