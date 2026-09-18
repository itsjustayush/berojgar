import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LandingPageProps {
  currentUser?: UserProfile | null;
  onEnterLounge: () => void;
  onOpenAuth: (prefilledUsername?: string) => void;
  onJoinRoom?: (roomId: string) => void;
  onOpenTapri?: (tapriName: string) => void;
  onNavigateToTapriPage?: (tapriName: string) => void;
  onNavigateToDirectory?: () => void;
  onNavigateToSettings?: () => void;
}

const LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-AV9byNA9FQpRcjaipoJx0Wsa2-Zg_9rrkTlCjzdUg3om-SOQaPwkH1N4z0kFoe3B39efO8poxiohSM4LvMKfnSP-Froza0igkREI6qfgPzv4ddstqmGBqmvv0wHkJH7bIIdBsJvD2J_XEIxNaf1bk3qxSqlfyMd3xt0RMSjsaFpGe7F-L2pXqhjS3wolQReWlF1dBan3uhbHxj2ngxZvvV7iSylugDdb73FB4YmakFUHrgJjPLQnQgBXb0DPnIo7Gg';

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onEnterLounge,
  onOpenAuth,
  onOpenTapri,
  onNavigateToTapriPage,
  onNavigateToDirectory,
  onNavigateToSettings,
}) => {
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
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  const handleOpenChats = () => {
    onEnterLounge();
  };

  const handleOpenDirectory = () => {
    if (onNavigateToDirectory) {
      onNavigateToDirectory();
    } else {
      onEnterLounge();
    }
  };

  const handleOpenSettings = () => {
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      onEnterLounge();
    }
  };

  const handleJoinTapriDirect = (tapriName: string) => {
    if (onOpenTapri) {
      onOpenTapri(tapriName);
    } else if (onNavigateToTapriPage) {
      onNavigateToTapriPage(tapriName);
    } else {
      onEnterLounge();
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface flex flex-col selection:bg-secondary-container text-on-surface antialiased font-sans">
      {/* Sticky Brand Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface/90 transition-all duration-200 border-b border-surface-variant/30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={handleOpenChats}
              className="flex items-center gap-3 group text-left cursor-pointer bg-transparent border-0 p-0"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs flex items-center justify-center bg-primary-container">
                <img
                  alt="Berojgar Logo"
                  className="w-full h-full object-cover"
                  src={LOGO_URL}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] font-bold tracking-tight text-on-surface">Berojgar</span>
                <span className="text-[11px] font-bold text-on-surface-variant -mt-1 hidden sm:inline-block">
                  Where ideas brew
                </span>
              </div>
            </button>
            <nav className="hidden lg:flex items-center gap-8">
              <a
                className="text-[14px] font-semibold text-on-surface hover:text-secondary transition-colors"
                href="#features"
              >
                Features
              </a>
              <button
                type="button"
                onClick={() => handleJoinTapriDirect('chai_n_code')}
                className="text-[14px] font-semibold text-on-surface hover:text-secondary transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
              >
                <span>Chai Tapri</span>
                <span className="bg-secondary-container text-on-secondary-container text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Live
                </span>
              </button>
              <button
                type="button"
                onClick={handleOpenDirectory}
                className="text-[14px] font-semibold text-on-surface hover:text-secondary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Directory
              </button>
              <a
                className="text-[14px] font-semibold text-on-surface hover:text-secondary transition-colors"
                href="#hero"
              >
                How it Works
              </a>
              <button
                type="button"
                onClick={handleOpenSettings}
                className="text-[14px] font-semibold text-on-surface hover:text-secondary transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Settings
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleDark}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              title="Toggle theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            {currentUser ? (
              <button
                type="button"
                onClick={handleOpenChats}
                className="hidden sm:inline-flex text-[14px] font-semibold px-5 py-2.5 rounded-full text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Open Chats
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth()}
                className="hidden sm:inline-flex text-[14px] font-semibold px-5 py-2.5 rounded-full text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenChats}
              className="text-[14px] font-semibold px-6 py-2.5 rounded-full bg-primary-container text-on-primary hover:bg-primary shadow-xs hover:shadow-sm transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 px-6" id="hero">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-secondary-fixed/40 via-surface-variant/50 to-primary-fixed/30 blur-3xl -z-10 rounded-full opacity-70 pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-container text-on-surface-variant shadow-xs mb-8">
            <span className="material-symbols-outlined text-secondary text-[18px]">local_cafe</span>
            <span className="text-[12px] font-semibold tracking-normal">
              Where smart ideas brew over casual conversations
            </span>
          </div>
          <h1 className="text-[38px] leading-[44px] sm:text-[56px] sm:leading-[64px] tracking-tight text-on-surface font-bold max-w-4xl">
            Connect, collaborate, and share ideas over a{' '}
            <span className="relative inline-block text-secondary underline decoration-secondary-container decoration-wavy decoration-2">
              virtual cup of tea.
            </span>
          </h1>
          <p className="mt-6 text-[17px] leading-[26px] text-on-surface-variant max-w-3xl">
            A sleek, calm communication workspace blending real-time messaging, ambient voice tapris, rich
            audio notes, and curated communities for makers, freelancers, and creative design teams.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={handleOpenChats}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed shadow-md hover:shadow-lg text-[14px] font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">local_cafe</span>
              <span>Start Brewing Free</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={handleOpenChats}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high shadow-xs text-[14px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-secondary text-[20px]">play_circle</span>
              <span>Watch 1-min Tour</span>
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-on-surface-variant text-[12px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">block</span>
              <span>Zero ads & tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">group</span>
              <span>Used by 45,000+ indie builders</span>
            </div>
          </div>

          {/* Layered Interactive Mockup preview */}
          <div className="mt-16 w-full relative max-w-5xl">
            <div className="relative bg-surface-container-lowest rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 text-left border border-surface-variant/40">
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error inline-block opacity-80" />
                  <span className="w-3 h-3 rounded-full bg-secondary-container inline-block" />
                  <span className="w-3 h-3 rounded-full bg-surface-tint/40 inline-block" />
                  <span className="ml-4 text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    berojgar.app/tapri/designers-den
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleJoinTapriDirect('designers_den')}
                  className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-bold text-secondary flex items-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                  Tapri Live: 8 In Lounge
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-4">
                  {/* Incoming Msg */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-xs">
                      <img
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvRxCcm3LIlO1h9Hf36mv9-xrbXBpDCOD1JqadDV9jg3gJDRX0Ne2eYC7hB6LCPPed7txx60oFdSuVhTeHQEgrV4cwvTUcbP9saM0n5e2w70HHaVfyRrYbh-jFcO27ZjWGIV_4-RPFXTmiyKfwbZousqXaup1O70_XQL63us0iiPlPFg5Iv_e38eCOnMw8q2_Ex2ibB_foJcdF0p_shHrT6g8ZtzcVVNYfyDDDKmDaN-ZjSIMOudeq"
                        alt="Ananya"
                      />
                    </div>
                    <div className="flex flex-col max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-bold text-on-surface">Ananya Sen</span>
                        <span className="text-[11px] text-on-surface-variant">10:42 AM</span>
                      </div>
                      <div className="bg-surface-container p-4 rounded-2xl rounded-tl-xs shadow-xs text-on-surface text-[14px]">
                        Just pushed the v2 prototypes for the Berojgar mobile experience! Let me know if the chai
                        animation needs extra steam ☕
                      </div>
                      <div
                        onClick={handleOpenChats}
                        className="mt-2 bg-surface-container-low p-3 rounded-xl shadow-xs flex items-center gap-3 cursor-pointer hover:bg-surface-container transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-inverse-surface flex items-center justify-center text-on-primary">
                          <span className="material-symbols-outlined text-[22px]">category</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-on-surface font-semibold truncate">
                            Design_System_Tokens_v2.fig
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            Figma File • 14 Components • Updated 12m ago
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
                      </div>
                    </div>
                  </div>

                  {/* Outgoing Msg */}
                  <div className="flex items-start justify-end gap-3 mt-2">
                    <div className="flex flex-col items-end max-w-md w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-on-surface-variant">10:44 AM</span>
                        <span className="text-[14px] font-bold text-on-surface">You</span>
                      </div>
                      <div className="w-full bg-primary-container text-on-primary p-4 rounded-2xl rounded-tr-xs shadow-md">
                        <p className="text-[14px] mb-3">
                          Loved the huddle ideas! Recorded a quick breakdown of the haptic response feedback:
                        </p>
                        <div className="bg-primary/50 p-3 rounded-xl flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleOpenChats}
                            className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                          </button>
                          <div className="flex-1 flex items-center gap-1 h-6">
                            <div className="w-1 h-3 bg-secondary-container rounded-full" />
                            <div className="w-1 h-5 bg-secondary-container rounded-full" />
                            <div className="w-1 h-6 bg-secondary-container rounded-full" />
                            <div className="w-1 h-4 bg-secondary-container rounded-full" />
                            <div className="w-1 h-2 bg-on-primary/30 rounded-full" />
                            <div className="w-1 h-5 bg-on-primary/30 rounded-full" />
                            <div className="w-1 h-6 bg-on-primary/30 rounded-full" />
                          </div>
                          <span className="text-[11px] text-on-primary/70">0:42 / 1:18</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel Widgets */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="bg-surface-container-low p-4 rounded-2xl shadow-xs border border-surface-variant/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                        Chai Streak Status
                      </span>
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        local_fire_department
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[28px]">coffee_maker</span>
                      </div>
                      <div>
                        <h2 className="text-[18px] font-bold text-on-surface">18 Days Running</h2>
                        <p className="text-[13px] text-on-surface-variant">Regular Huddle Partner</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-2xl shadow-xs border border-surface-variant/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                        Chai Tapri Audio
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                        Active Room
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-on-surface mb-3">
                      "Coffee to Chai Migration & Sprints"
                    </p>
                    <button
                      type="button"
                      onClick={() => handleJoinTapriDirect('chai_n_code')}
                      className="w-full py-2.5 rounded-full bg-primary text-on-primary text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-inverse-surface transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">volume_up</span>
                      <span>Join Audio Lounge</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full py-20 px-6 bg-surface-container-low" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] text-secondary uppercase font-bold tracking-widest">
              Built for Thoughtful Minds
            </span>
            <h2 className="mt-2 text-[32px] font-bold text-on-surface">
              Designed like a cozy tea shop, engineered like high-performance software.
            </h2>
            <p className="mt-4 text-[15px] text-on-surface-variant">
              Traditional team messengers feel like frantic open offices. Berojgar creates intentional room for
              spontaneous serendipity and quiet deep work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-variant/30">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed-variant mb-6 shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">local_cafe</span>
                </div>
                <h3 className="text-[20px] font-bold text-on-surface">Chai Circles & Tapri</h3>
                <p className="mt-3 text-[14px] text-on-surface-variant leading-relaxed">
                  Drop into spontaneous audio lounges with spatial presence. No scheduling links, no camera
                  pressure. Just ambient, warm huddles when you need an afternoon recharge.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenChats}
                className="mt-6 flex items-center gap-2 text-[12px] text-secondary font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
              >
                <span>Explore Tapri mechanics</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-variant/30">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary mb-6 shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">graphic_eq</span>
                </div>
                <h3 className="text-[20px] font-bold text-on-surface">Fluid Voice & Audio Notes</h3>
                <p className="mt-3 text-[14px] text-on-surface-variant leading-relaxed">
                  Express nuanced thoughts naturally. Tactile interactive waveforms, automatic inline transcriptions,
                  smart 1.5x pacing, and cross-device listening memory.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenChats}
                className="mt-6 flex items-center gap-2 text-[12px] text-secondary font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
              >
                <span>Listen to audio samples</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-variant/30">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-surface-variant flex items-center justify-center text-on-surface mb-6 shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">shield</span>
                </div>
                <h3 className="text-[20px] font-bold text-on-surface">Thoughtful Craft & Privacy</h3>
                <p className="mt-3 text-[14px] text-on-surface-variant leading-relaxed">
                  End-to-end encrypted conversations, rich wireframe and Markdown embeds, zero advertiser
                  tracking, and effortless harmony between light and dark palettes.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenSettings}
                className="mt-6 flex items-center gap-2 text-[12px] text-secondary font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
              >
                <span>Review security settings</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-16 px-6 bg-surface-container text-on-surface border-t border-surface-variant/40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container">
                <img alt="Berojgar Logo" className="w-full h-full object-cover" src={LOGO_URL} />
              </div>
              <span className="text-[20px] font-bold">Berojgar</span>
            </div>
            <p className="text-[14px] text-on-surface-variant max-w-sm mb-6">
              The intentional communication hub designed for creative freelancers, independent thinkers, and modern
              remote squads.
            </p>
            <p className="text-[11px] font-bold text-on-surface-variant">
              © 2025 Berojgar Technologies Inc. Handcrafted with tea and curiosity.
            </p>
          </div>
          <div>
            <h4 className="text-[14px] font-bold mb-4 text-on-surface">App</h4>
            <ul className="space-y-2.5 text-[14px] text-on-surface-variant">
              <li>
                <button
                  type="button"
                  onClick={handleOpenChats}
                  className="hover:text-secondary cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Messages
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenDirectory}
                  className="hover:text-secondary cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Directory
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenSettings}
                  className="hover:text-secondary cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Preferences
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-bold mb-4 text-on-surface">Communities</h4>
            <ul className="space-y-2.5 text-[14px] text-on-surface-variant">
              <li>
                <button
                  type="button"
                  onClick={handleOpenDirectory}
                  className="hover:text-secondary cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Indie Hackers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenDirectory}
                  className="hover:text-secondary cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  UI/UX Guild
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenDirectory}
                  className="hover:text-secondary cursor-pointer bg-transparent border-0 p-0 text-left"
                >
                  Freelance Writers
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-bold mb-4 text-on-surface">Theme Mode</h4>
            <button
              type="button"
              onClick={toggleDark}
              className="px-4 py-2 bg-surface-container-highest rounded-full text-[12px] font-bold flex items-center gap-2 hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{isDark ? 'Light Warmth' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
