import React from 'react';
import {
  MessageSquare,
  Users,
  Compass,
  Bookmark,
  Settings,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import { UserAvatar } from './UserAvatar';

interface LeftNavRailProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentUser: UserProfile | null;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  unreadCount?: number;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenSettings,
  onOpenProfile,
  onOpenAuth,
  isDarkMode,
  onToggleDarkMode,
  unreadCount = 0,
}) => {
  return (
    <aside
      aria-label="Navigation rail"
      className="w-16 md:w-[68px] shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col items-center py-4 justify-between z-30 select-none transition-colors"
    >
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <button
          type="button"
          onClick={() => onNavigate('CHATS')}
          title="Berozgar - Home"
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        >
          <Coffee size={20} className="stroke-[2.2] group-hover:rotate-6 transition-transform" />
        </button>

        {/* Navigation Item Stack */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {/* Chats */}
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            title="Messages"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
              currentView === 'CHATS'
                ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70'
            }`}
          >
            <MessageSquare size={19} className="stroke-[2]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#0B1120]" />
            )}
          </button>

          {/* Chai Circles / Tapris */}
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            title="Chai Circles"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70`}
          >
            <Users size={19} className="stroke-[2]" />
          </button>

          {/* Directory & Network */}
          <button
            type="button"
            onClick={() => onNavigate('DIRECTORY')}
            title="Directory & Network"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
              currentView === 'DIRECTORY'
                ? 'bg-slate-900 text-white dark:bg-orange-500 dark:text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70'
            }`}
          >
            <Compass size={19} className="stroke-[2]" />
          </button>

          {/* Pinned Items */}
          <button
            type="button"
            onClick={() => onNavigate('CHATS')}
            title="Pinned Items"
            className="w-11 h-11 rounded-2xl flex items-center justify-center relative text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70 transition-all cursor-pointer"
          >
            <Bookmark size={19} className="stroke-[2]" />
          </button>

          {/* Preferences Hub */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Account & Preferences Hub"
            className="w-11 h-11 rounded-2xl flex items-center justify-center relative text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/70 transition-all cursor-pointer"
          >
            <Settings size={19} className="stroke-[2]" />
          </button>
        </nav>
      </div>

      {/* Bottom Actions: Theme Toggle & Avatar */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Switch to Light Warmth ☕' : 'Switch to Deep Navy 🌙'}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        {/* User Profile Avatar */}
        {currentUser ? (
          <button
            type="button"
            onClick={onOpenProfile}
            title={`@${currentUser.username} (${currentUser.displayName})`}
            className="relative rounded-full ring-2 ring-emerald-500/80 ring-offset-2 dark:ring-offset-[#0B1120] transition-transform hover:scale-105 cursor-pointer"
          >
            <UserAvatar
              name={currentUser.displayName}
              username={currentUser.username}
              photoURL={currentUser.photoURL}
              size="sm"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1120]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            title="Sign In"
            className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Sign
          </button>
        )}
      </div>
    </aside>
  );
};
