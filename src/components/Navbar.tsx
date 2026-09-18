import { useEffect, useState } from 'react';
import {
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  X,
  User as UserIcon,
  Coffee,
  Compass,
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
    { view: 'CHATS', label: 'Messages & Tapris', icon: MessageSquare },
    { view: 'DIRECTORY', label: 'Directory & Network', icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('CHATS')}
            className="group flex items-center gap-3 text-left cursor-pointer"
            aria-label="Go to Berozgar Chats"
          >
            <BerozgarLogo variant="horizontal" size="md" showTagline />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => navigate('CHATS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                currentView === 'CHATS'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => navigate('DIRECTORY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                currentView === 'DIRECTORY'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Directory
            </button>
          </nav>
        </div>

        {/* Right Header Status & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Profile / Auth Button */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="group flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 transition-all hover:border-orange-500/50 cursor-pointer"
              title="Your Berozgar Profile"
            >
              <UserAvatar
                name={currentUser.displayName}
                username={currentUser.username}
                photoURL={currentUser.photoURL}
                size="xs"
              />
              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 max-w-[120px] truncate hidden sm:inline">
                @{currentUser.username}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <UserIcon size={13} />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 md:hidden cursor-pointer"
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
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] px-5 py-4 md:hidden animate-in slide-in-from-top-2"
        >
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navItems.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => navigate(view)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm cursor-pointer transition-colors ${
                  currentView === view
                    ? 'bg-slate-900 text-white dark:bg-orange-500 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 font-mono text-[10px] text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-orange-500" />
              <span>Berozgar Network</span>
            </span>
            {currentUser && (
              <span className="text-orange-600 font-semibold">@{currentUser.username}</span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
