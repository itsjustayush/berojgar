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
    { view: 'CHATS', label: 'Berozgar Chats', icon: MessageSquare },
    { view: 'DASHBOARD', label: 'Vault Rooms', icon: Activity },
    { view: 'HISTORY', label: 'History', icon: FolderClock },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#FFF9F3]/10 bg-[#0b1326]/90 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          {/* Logo & Brand */}
          <button
            onClick={() => navigate('CHATS')}
            className="group flex items-center gap-3 text-left cursor-pointer"
            aria-label="Go to Berozgar Chats"
          >
            <BerozgarLogo variant="horizontal" size="md" showTagline />
          </button>

          {/* Right Header Status & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile / Auth Button */}
            {currentUser ? (
              <button
                onClick={onOpenProfile}
                className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-2.5 py-1 transition-colors hover:border-[#EF4E22]/50 hover:bg-white/[.1] cursor-pointer"
                title="Your Berozgar Profile"
              >
                <UserAvatar
                  name={currentUser.displayName}
                  username={currentUser.username}
                  photoURL={currentUser.photoURL}
                  size="xs"
                />
                <span className="text-xs font-mono text-[#FFF9F3]/90 group-hover:text-[#EF4E22] max-w-[100px] truncate hidden sm:inline">
                  @{currentUser.username}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-full bg-[#EF4E22] text-[#FFF9F3] px-4 py-1.5 text-xs font-mono font-bold hover:bg-[#f3643d] transition-all cursor-pointer shadow-[0_0_20px_rgba(239,78,34,0.35)]"
              >
                <UserIcon size={13} />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white md:hidden cursor-pointer"
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
          className={`border-t border-white/10 bg-[#0e1933] px-5 py-4 md:hidden ${
            menuOpen ? 'block' : 'hidden'
          }`}
        >
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {navItems.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => navigate(view)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm cursor-pointer ${
                  currentView === view
                    ? 'bg-[#EF4E22] text-[#FFF9F3] font-bold shadow-md'
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
              <ShieldCheck size={14} className="text-[#EF4E22]" />
              <span>Berozgar • Chat</span>
            </span>
            {currentUser && (
              <span className="text-[#EF4E22]">@{currentUser.username}</span>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
