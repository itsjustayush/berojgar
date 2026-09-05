import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity,
  ChevronDown,
  Edit3,
  FolderClock,
  MessageSquare,
  Save,
  ShieldCheck,
  X,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { ViewMode, UserSession, UserProfile } from '../types';

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
  session,
  currentUser,
  onOpenProfile,
  onOpenAuth,
  onUpdateNickname,
  latencyMs,
}: NavbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(session.identifier);
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

  const handleSaveName = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = nameInput.trim().replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 18);
    if (cleanName) onUpdateNickname(cleanName);
    setIsEditingName(false);
  };

  const navigate = (view: ViewMode) => {
    setView(view);
    setMenuOpen(false);
  };

  const navItems: Array<{ view: ViewMode; label: string; icon: typeof MessageSquare }> = [
    { view: 'CHATS', label: 'Ciao Chats', icon: MessageSquare },
    { view: 'DASHBOARD', label: 'Vault Rooms', icon: Activity },
    { view: 'HISTORY', label: 'History', icon: FolderClock },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/85 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          {/* Logo & Brand */}
          <button
            onClick={() => navigate('CHATS')}
            className="group flex items-center gap-3 text-left cursor-pointer"
            aria-label="Go to Ciao Chats"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/[.08] shadow-[0_0_24px_rgba(214,255,98,.12)] transition-transform duration-200 group-hover:scale-105">
              <span className="font-serif italic text-lg font-bold text-[#d6ff62]">C</span>
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif italic text-xl font-bold tracking-tight text-white">Ciao</span>
                <span className="font-mono text-[9px] text-[#d6ff62] px-1.5 py-0.2 rounded bg-[#d6ff62]/10 border border-[#d6ff62]/20 font-bold uppercase tracking-wider">
                  Social
                </span>
              </div>
              <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[.22em] text-white/40">
                Real-time & private
              </span>
            </div>
          </button>

          {/* Right Header Status & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Realtime link latency badge */}
            <div
              className="hidden items-center gap-2 rounded-full border border-[#d6ff62]/20 bg-[#d6ff62]/[.06] px-3 py-1.5 lg:flex"
              title="Firebase real-time synchronization link"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#d6ff62] shadow-[0_0_10px_#d6ff62] animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[.16em] text-[#d6ff62]">
                Firebase Live
              </span>
            </div>

            {/* Profile / Auth Button */}
            {currentUser ? (
              <button
                onClick={onOpenProfile}
                className="group flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 transition-colors hover:border-[#d6ff62]/40 hover:bg-white/[.1] cursor-pointer"
                title="Your Ciao Profile"
              >
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#d6ff62]">
                  <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-mono text-white/90 group-hover:text-[#d6ff62] max-w-[100px] truncate hidden sm:inline">
                  @{currentUser.username}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-full bg-[#d6ff62] text-black px-4 py-1.5 text-xs font-mono font-bold hover:bg-[#e4ff8f] transition-all cursor-pointer shadow-md"
              >
                <UserIcon size={13} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {menuOpen ? <X size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div
          id="mobile-nav"
          className={`border-t border-white/10 bg-[#080808] px-5 py-4 md:hidden ${
            menuOpen ? 'block' : 'hidden'
          }`}
        >
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navItems.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => navigate(view)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${
                  currentView === view
                    ? 'bg-[#d6ff62] text-black font-bold'
                    : 'text-white/65 hover:bg-white/[.08] hover:text-white'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px] text-white/45">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-[#d6ff62]" />
              <span>Ciao Social Platform • Firebase</span>
            </span>
            {currentUser && (
              <span className="text-[#d6ff62]">@{currentUser.username}</span>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
