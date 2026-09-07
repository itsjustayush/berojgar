import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { soundEffects } from '../lib/callSoundEffects';
import {
  subscribeToGlobalLandingData,
  RealtimeLandingMetrics,
  RealtimeGlobalTapriItem,
} from '../lib/socialChatService';

interface LandingPageProps {
  currentUser?: UserProfile | null;
  onEnterLounge: () => void;
  onOpenAuth: (prefilledUsername?: string) => void;
  onJoinRoom?: (roomId: string) => void;
  onOpenTapri?: (tapriName: string) => void;
  onNavigateToTapriPage?: (tapriName: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onEnterLounge,
  onOpenAuth,
  onJoinRoom,
  onOpenTapri,
  onNavigateToTapriPage,
}) => {
  const [metrics, setMetrics] = useState<RealtimeLandingMetrics>({
    onlineChillers: 154820,
    totalRegisteredUsers: 8420,
    totalMessagesToday: 24891,
    realtimeLatencyMs: 11.4,
    calmScore: '4.9 / 5',
    tapris: [
      {
        id: 'tapri_chai_n_code',
        name: 'chai_n_code',
        title: 'Chai & Code',
        tag: '#chai_n_code',
        description: 'Late Night Coding & Lofi. Debugging silent sessions with gentle background sitar beats and occasional PR venting.',
        isPublic: true,
        onlineChillers: 82,
        totalUsers: 82,
        speakersCount: 4,
        tags: ['Rust & Go', 'Lofi Rain', 'Zero Video'],
        icon: 'code',
        category: 'Coding & Lofi',
        themeColor: '#22C55E',
        creatorUsername: 'itsjustayush',
        creatorDisplayName: 'Ayush Bhattacharya',
        badgeLabel: 'chillers online',
      },
      {
        id: 'tapri_startup_fumbles',
        name: 'startup_fumbles',
        title: 'Startup Fumbles',
        tag: '#startup_fumbles',
        description: 'Honest pivoting stories & career rants. Failed pitches, hiring freezes, resume reviews, and unvarnished truth without LinkedIn fluff.',
        isPublic: true,
        onlineChillers: 114,
        totalUsers: 114,
        speakersCount: 7,
        tags: ['Anti-Hustle', 'Career Therapy', 'Anonymous'],
        icon: 'psychology',
        category: 'Career & Pivots',
        themeColor: '#ff5722',
        creatorUsername: 'itsjustayush',
        creatorDisplayName: 'Ayush Bhattacharya',
        badgeLabel: 'venting',
      },
      {
        id: 'tapri_ambient_reading',
        name: 'ambient_reading',
        title: 'Ambient Reading',
        tag: '#ambient_reading',
        description: 'Silent co-working & study lo-fi. Muted microphones with periodic 25-minute Pomodoro chime. Pure focused presence.',
        isPublic: true,
        onlineChillers: 63,
        totalUsers: 63,
        speakersCount: 0,
        tags: ['Deep Focus', 'Pomodoro', 'Calm Tone'],
        icon: 'auto_stories',
        category: 'Deep Focus',
        themeColor: '#86cfff',
        creatorUsername: 'tanmay_d',
        creatorDisplayName: 'Tanmay Deshmukh',
        badgeLabel: 'co-studying',
      },
    ],
  });

  useEffect(() => {
    const unsub = subscribeToGlobalLandingData((liveMetrics) => {
      setMetrics(liveMetrics);
    }, currentUser);
    return () => unsub();
  }, [currentUser]);

  const tapri1: RealtimeGlobalTapriItem = metrics.tapris[0] || {
    id: 'tapri_chai_n_code',
    name: 'chai_n_code',
    title: 'Chai & Code',
    tag: '#chai_n_code',
    description: 'Late Night Coding & Lofi. Debugging silent sessions with gentle background sitar beats and occasional PR venting.',
    isPublic: true,
    onlineChillers: 82,
    totalUsers: 82,
    speakersCount: 4,
    tags: ['Rust & Go', 'Lofi Rain', 'Zero Video'],
    icon: 'code',
    category: 'Coding & Lofi',
    themeColor: '#22C55E',
    creatorUsername: 'itsjustayush',
    creatorDisplayName: 'Ayush Bhattacharya',
    badgeLabel: 'chillers online',
  };

  const tapri2: RealtimeGlobalTapriItem = metrics.tapris[1] || {
    id: 'tapri_startup_fumbles',
    name: 'startup_fumbles',
    title: 'Startup Fumbles',
    tag: '#startup_fumbles',
    description: 'Honest pivoting stories & career rants. Failed pitches, hiring freezes, resume reviews, and unvarnished truth without LinkedIn fluff.',
    isPublic: true,
    onlineChillers: 114,
    totalUsers: 114,
    speakersCount: 7,
    tags: ['Anti-Hustle', 'Career Therapy', 'Anonymous'],
    icon: 'psychology',
    category: 'Career & Pivots',
    themeColor: '#ff5722',
    creatorUsername: 'itsjustayush',
    creatorDisplayName: 'Ayush Bhattacharya',
    badgeLabel: 'venting',
  };

  const tapri3: RealtimeGlobalTapriItem = metrics.tapris[2] || {
    id: 'tapri_ambient_reading',
    name: 'ambient_reading',
    title: 'Ambient Reading',
    tag: '#ambient_reading',
    description: 'Silent co-working & study lo-fi. Muted microphones with periodic 25-minute Pomodoro chime. Pure focused presence.',
    isPublic: true,
    onlineChillers: 63,
    totalUsers: 63,
    speakersCount: 0,
    tags: ['Deep Focus', 'Pomodoro', 'Calm Tone'],
    icon: 'auto_stories',
    category: 'Deep Focus',
    themeColor: '#86cfff',
    creatorUsername: 'tanmay_d',
    creatorDisplayName: 'Tanmay Deshmukh',
    badgeLabel: 'co-studying',
  };

  const [handleInput, setHandleInput] = useState('');
  const [handleStatus, setHandleStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    reservedHandle?: string;
  }>({
    type: 'idle',
    message: 'Self-sovereign handle. No email verification or real phone identity demanded.',
  });

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    '🔥': 12,
    '😂': 8,
    '☕': 15,
  });
  const [mockMessageText, setMockMessageText] = useState('');
  const [mockFeedbackToast, setMockFeedbackToast] = useState<string | null>(null);
  const handleInputRef = useRef<HTMLInputElement | null>(null);

  const handleClaim = () => {
    const val = handleInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!val) {
      setHandleStatus({
        type: 'error',
        message: 'Please type a handle first (e.g. nocturnal_fox)',
      });
      return;
    }
    setHandleInput(val);
    setHandleStatus({
      type: 'success',
      message: `Reserved @${val}! Ready for encrypted entry.`,
      reservedHandle: val,
    });
  };

  const handleToggleVoiceNote = () => {
    const nextState = !isPlayingVoice;
    setIsPlayingVoice(nextState);
    if (nextState) {
      soundEffects.playMessageDing();
    }
  };

  const handleIncrementReaction = (emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [emoji]: prev[emoji] + 1,
    }));
    soundEffects.playJoinSound();
  };

  const handleScrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMockSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockMessageText.trim()) return;
    setMockFeedbackToast(`Entering lounge with your note: "${mockMessageText.trim()}"`);
    soundEffects.playMessageDing();
    setTimeout(() => {
      onEnterLounge();
    }, 600);
  };

  return (
    <div className="bg-[#070E18] text-[#d4e4fa] font-sans antialiased min-h-screen selection:bg-[#ff5722] selection:text-white">
      {/* Sticky Top Header */}
      <header className="fixed top-0 w-full z-50 bg-[#070E18]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_1px_12px_rgba(0,0,0,0.35)]">
        <div className="h-20 max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#ff5722] flex items-center justify-center text-white shadow-[0_0_18px_rgba(255,87,34,0.45)] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-extrabold text-lg text-[#F8FAFC] tracking-tight">Berojgar</span>
                  <span className="text-xs text-[#ffb5a0] font-bold">बेरोज़गार</span>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono">The Digital Chai Tapri</span>
              </div>
            </a>

            <div className="hidden xl:flex items-center gap-2 bg-[#13233A]/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span className="text-xs text-[#CBD5E1] font-mono">
                <strong className="text-[#F8FAFC] font-semibold">{metrics.onlineChillers.toLocaleString()}</strong> chillers talking
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-[#13233A]/40 border border-white/10 p-1 rounded-full">
            <button
              type="button"
              onClick={() => handleScrollTo('live-lounges')}
              className="px-4 py-1.5 rounded-full text-sm text-[#d4e4fa]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Rooms
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('live-lounges')}
              className="px-4 py-1.5 rounded-full text-sm text-[#d4e4fa]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Audio Lounges
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('manifesto')}
              className="px-4 py-1.5 rounded-full text-sm text-[#d4e4fa]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Manifesto
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('community')}
              className="px-4 py-1.5 rounded-full text-sm text-[#d4e4fa]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Community
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#13233A]/60 border border-white/10 px-3 py-1 rounded-full text-[#CBD5E1]">
              <span className="material-symbols-outlined text-[16px] text-[#ffb5a0]">bedtime</span>
              <span className="text-[11px] font-mono">Nocturne Calm</span>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={onEnterLounge}
                className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold text-white bg-[#1C2D46] hover:bg-[#273647] border border-white/15 transition-all cursor-pointer"
              >
                <span>@{currentUser.username}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth()}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold text-[#F8FAFC] bg-[#1C2D46] hover:bg-[#273647] border border-white/10 transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (handleInputRef.current) {
                  handleInputRef.current.focus();
                  handleInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  onOpenAuth();
                }
              }}
              className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-bold text-white bg-[#ff5722] hover:bg-[#F4511E] shadow-[0_4px_16px_rgba(255,87,34,0.35)] transition-all cursor-pointer"
            >
              Reserve @handle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full pt-24 bg-[#070E18]">
        <div className="flex flex-col w-full">
          {/* Atmospheric Aura */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-[#ff5722]/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-40 right-10 w-[420px] h-[420px] bg-[#4c98c6]/10 rounded-full blur-[120px] pointer-events-none" />

            {/* 1. HERO SECTION: Wide 2-Column Split Desktop Layout */}
            <section className="max-w-[1200px] mx-auto px-6 pt-10 pb-20 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Column: Copy, Badges & Handle Reservation (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Live Badge Pill */}
                  <div className="inline-flex items-center gap-2 self-start bg-[#13233A]/70 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                    <span className="text-xs text-[#ffb5a0] tracking-wider uppercase font-mono font-bold">
                      Quiet Spaces 2.0
                    </span>
                    <span className="text-[#64748B]">•</span>
                    <span className="text-xs text-[#CBD5E1]">No algorithm noise</span>
                    <span className="text-[#64748B]">•</span>
                    <span className="text-[11px] bg-[#1C2D46] text-[#86cfff] px-1.5 py-0.5 rounded-md font-mono">
                      v4.8
                    </span>
                  </div>

                  {/* Master Title & Bilingual Pairing */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h1
                        className="text-4xl sm:text-5xl lg:text-6xl text-[#F8FAFC] tracking-tight font-extrabold"
                        style={{ fontFamily: 'Plus Jakarta Sans, Rozha One, Mukta, sans-serif' }}
                      >
                        बेरोज़गार चैट
                      </h1>
                      <span className="text-2xl sm:text-3xl text-[#ff5722] font-bold tracking-tight opacity-90">
                        / Berojgar Web
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl text-[#F8FAFC] max-w-2xl font-semibold leading-snug">
                      Unfiltered conversations, late-night tea thoughts, zero pressure.
                    </p>
                  </div>

                  {/* Bilingual Narrative Subtext */}
                  <p className="text-base sm:text-lg text-[#CBD5E1] max-w-xl leading-relaxed">
                    <strong className="text-[#F8FAFC] font-semibold">बस सुकून, बस बातचीत।</strong> Private nocturnal
                    spaces, eye-soothing low-fatigue dark tones, crisp drop-in audio, and absolute freedom from
                    contact-list tethering.
                  </p>

                  {/* Feature Highlight Tags Row */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-[#13233A]/80 border border-white/10 px-3 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[#ffb5a0] text-[15px]">verified_user</span>
                      <span className="text-xs text-[#CBD5E1] font-medium font-mono">Zero Phone Numbers</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#13233A]/80 border border-white/10 px-3 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[#86cfff] text-[15px]">dark_mode</span>
                      <span className="text-xs text-[#CBD5E1] font-medium font-mono">Eye Comfort Dark Mode</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#13233A]/80 border border-white/10 px-3 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[#22C55E] text-[15px]">bolt</span>
                      <span className="text-xs text-[#CBD5E1] font-medium font-mono">Instant Room Links</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#13233A]/80 border border-white/10 px-3 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[#ff5722] text-[15px]">lock</span>
                      <span className="text-xs text-[#CBD5E1] font-medium font-mono">End-to-End Privacy</span>
                    </div>
                  </div>

                  {/* Action CTA Group */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={onEnterLounge}
                      className="inline-flex items-center justify-center gap-2 h-[50px] px-8 rounded-full text-base font-bold text-white bg-[#ff5722] hover:bg-[#F4511E] shadow-[0_8px_24px_-4px_rgba(255,87,34,0.45)] transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Enter Web Lounge Free</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScrollTo('live-lounges')}
                      className="inline-flex items-center justify-center gap-2 h-[50px] px-6 rounded-full text-base font-semibold text-[#F8FAFC] bg-[#13233A] hover:bg-[#1C2D46] border border-white/10 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[#86cfff] text-[20px]">headphones</span>
                      <span>Explore Live Rooms</span>
                    </button>
                  </div>

                  {/* Micro-metric Live Tracker */}
                  <div className="flex items-center gap-2 text-[#64748B] text-xs font-mono py-1.5 px-3.5 rounded-full bg-[#13233A]/80 border border-white/10 w-fit backdrop-blur-md shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
                    <span className="text-[#F8FAFC] font-semibold tracking-wide flex items-center gap-1.5">
                      <strong className="text-[#22C55E] font-black font-mono tracking-tight text-xs sm:text-sm px-2 py-0.5 rounded-md bg-[#22C55E]/15 border border-[#22C55E]/40 shadow-[0_0_12px_rgba(34,197,94,0.25)] inline-flex items-center gap-1.5">
                        {metrics.onlineChillers.toLocaleString()}
                      </strong>
                      <span>{metrics.onlineChillers === 1 ? 'night chiller active right now' : 'night chillers active right now'}</span>
                      <span className="text-[#64748B]">•</span>
                      <span className="text-[#86cfff] font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-[#86cfff]/15 border border-[#86cfff]/30 shadow-sm">
                        ({metrics.totalRegisteredUsers.toLocaleString()} registered)
                      </span>
                    </span>
                    <span>•</span>
                    <span>Zero tracking logs kept</span>
                  </div>

                  {/* Handle Reservation Widget */}
                  <div className="mt-1 p-4 rounded-2xl bg-[#13233A]/70 border border-white/10 backdrop-blur-xl shadow-lg max-w-xl">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex items-center flex-1 bg-[#0C1929]/90 border border-white/10 rounded-full px-4 py-2.5 shadow-inner">
                        <span className="text-sm text-[#64748B] font-mono select-none">berojgar.chat/@</span>
                        <input
                          ref={handleInputRef}
                          id="handle-input"
                          type="text"
                          value={handleInput}
                          onChange={(e) => setHandleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleClaim();
                          }}
                          placeholder="username"
                          className="bg-transparent text-sm text-[#F8FAFC] font-mono focus:outline-none w-full pl-0.5 placeholder:text-[#64748B]/60"
                        />
                      </div>
                      <button
                        type="button"
                        id="claim-btn"
                        onClick={handleClaim}
                        className="h-[46px] px-6 rounded-full text-sm font-bold text-white bg-[#ff5722] hover:bg-[#F4511E] transition-colors whitespace-nowrap shadow-sm cursor-pointer active:scale-95"
                      >
                        Claim @handle
                      </button>
                    </div>

                    <div
                      id="handle-status"
                      className="text-[11px] text-[#64748B] mt-2 pl-3 flex items-center justify-between flex-wrap gap-2"
                    >
                      <div className="flex items-center gap-1.5">
                        {handleStatus.type === 'error' ? (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#EF4444]">error</span>
                            <span className="text-[#EF4444] font-medium">{handleStatus.message}</span>
                          </>
                        ) : handleStatus.type === 'success' ? (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#22C55E]">check_circle</span>
                            <span className="text-[#22C55E] font-medium">{handleStatus.message}</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#22C55E]">check_circle</span>
                            <span>{handleStatus.message}</span>
                          </>
                        )}
                      </div>

                      {handleStatus.reservedHandle && (
                        <button
                          type="button"
                          onClick={() => onOpenAuth(handleStatus.reservedHandle)}
                          className="text-[#ff5722] hover:underline font-mono font-bold text-[11px] cursor-pointer"
                        >
                          Sign up as @{handleStatus.reservedHandle} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive Desktop Lounge & Chat Mockup (5 cols) */}
                <div className="lg:col-span-5 relative">
                  {/* Ambient Glow */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-[#ff5722]/20 to-[#86cfff]/15 rounded-3xl blur-2xl opacity-60" />

                  {/* Mockup Shell Window */}
                  <div className="relative bg-[#0C1929]/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
                    {/* Window Titlebar with macOS style dots */}
                    <div className="h-11 bg-[#0d1c2d] border-b border-white/10 px-4 flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner" />
                        <span className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner" />
                        <span className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[#CBD5E1] text-[11px] font-mono font-medium bg-[#07111c] border border-white/10 px-3 py-1 rounded-full shadow-inner">
                        <span className="material-symbols-outlined text-[13px] text-[#22C55E]">lock</span>
                        <span className="text-[#CBD5E1]">https://berojgarchat.vercel.app</span>
                      </div>
                      <div className="w-12" />
                    </div>

                    {/* Active Room Header Banner */}
                    <div className="p-4 bg-[#13233A] border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#ff5722]/20 border border-[#ff5722]/30 flex items-center justify-center text-[#ff5722]">
                          <span className="material-symbols-outlined text-[20px]">local_cafe</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base text-[#F8FAFC] font-bold">{tapri1.tag}</span>
                            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                          </div>
                          <span className="text-[11px] text-[#22C55E] font-mono font-medium flex items-center gap-1.5 bg-[#0C1929]/70 px-2.5 py-1 rounded-full border border-[#22C55E]/20 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                            <span>{tapri1.onlineChillers} {tapri1.onlineChillers === 1 ? 'chiller listening quietly' : 'chillers listening quietly'}</span>
                            <span className="text-[#64748B]">•</span>
                            <span className="text-[#86cfff] font-mono font-bold text-[11px] px-2 py-0.5 rounded-full bg-[#86cfff]/15 border border-[#86cfff]/30 shadow-sm">
                              {tapri1.totalUsers} {tapri1.totalUsers === 1 ? 'member' : 'members'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Active Speaker Avatars Group */}
                      <div className="flex items-center -space-x-2 p-1 rounded-full bg-[#0C1929]/80 border border-white/10 shadow-inner">
                        <div
                          title="Ayush (Host)"
                          className="w-7 h-7 rounded-full bg-[#1C2D46] border-2 border-[#0C1929] flex items-center justify-center text-[#ffb5a0] text-[11px] font-bold shadow-md ring-1 ring-white/10"
                        >
                          AB
                        </div>
                        {tapri1.onlineChillers > 1 && (
                          <div
                            title="Subarna (Chiller)"
                            className="w-7 h-7 rounded-full bg-[#13233A] border-2 border-[#0C1929] flex items-center justify-center text-[#86cfff] text-[11px] font-bold shadow-md ring-1 ring-white/10"
                          >
                            SB
                          </div>
                        )}
                        {currentUser && currentUser.username !== 'itsjustayush' && (
                          <div
                            title={currentUser.displayName || currentUser.username}
                            className="w-7 h-7 rounded-full bg-[#22C55E]/20 border-2 border-[#0C1929] flex items-center justify-center text-[#22C55E] text-[11px] font-bold shadow-md ring-1 ring-[#22C55E]/40"
                          >
                            {(currentUser.displayName || currentUser.username || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {tapri1.totalUsers > 3 && (
                          <div className="w-7 h-7 rounded-full bg-[#1C2D46] border-2 border-[#0C1929] flex items-center justify-center text-[#CBD5E1] text-[10px] font-bold shadow-md ring-1 ring-white/10">
                            +{tapri1.totalUsers - 2}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Speaking Ripple Strip */}
                    <div className="px-4 py-2 bg-[#1c2b3c]/60 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <span className="absolute w-4 h-4 rounded-full bg-[#ff5722]/40 animate-ping" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722]" />
                        </div>
                        <span className="text-[11px] text-[#ffb5a0] font-mono font-medium">Aarav is speaking</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-[#ffb5a0] rounded-full animate-pulse" />
                        <span className="w-1 h-5 bg-[#ff5722] rounded-full animate-pulse [animation-delay:0.15s]" />
                        <span className="w-1 h-2 bg-[#ffb5a0] rounded-full animate-pulse [animation-delay:0.3s]" />
                        <span className="w-1 h-4 bg-[#ff5722] rounded-full animate-pulse [animation-delay:0.45s]" />
                        <span className="w-1 h-1.5 bg-[#ffb5a0] rounded-full animate-pulse [animation-delay:0.2s]" />
                      </div>
                    </div>

                    {/* Mockup Chat Thread Area */}
                    <div className="p-4 flex flex-col gap-4 min-h-[290px] justify-end">
                      {/* System Timestamp */}
                      <div className="text-center text-[11px] text-[#64748B] font-mono my-1">
                        03:42 AM • Midnight Tapri Session
                      </div>

                      {/* Incoming Message 1 */}
                      <div className="flex flex-col items-start gap-1 max-w-[85%]">
                        <div className="flex items-center gap-1.5 pl-2">
                          <span className="text-[11px] text-[#b7c7e5] font-semibold font-mono">@samay_v</span>
                          <span className="text-[10px] text-[#64748B] font-mono">03:41 AM</span>
                        </div>
                        <div className="bg-[#13233A] border border-white/10 px-4 py-2.5 rounded-[20px] rounded-tl-sm text-[#CBD5E1] text-sm shadow-sm">
                          Bhai koi Valorant ya chilling karega aaj? 🎮 Bas dimag thanda karna hai.
                        </div>
                      </div>

                      {/* Outgoing / Interactive Voice Note Bubble */}
                      <div className="flex flex-col items-end gap-1 self-end max-w-[90%]">
                        <div className="flex items-center gap-1.5 pr-2">
                          <span className="text-[11px] text-[#ffb5a0] font-semibold font-mono">You (@nocturne)</span>
                          <span className="text-[10px] text-[#64748B] font-mono">03:42 AM</span>
                        </div>
                        <div className="bg-[#ff5722] text-white px-4 py-3 rounded-[20px] rounded-tr-sm shadow-md flex flex-col gap-2 w-full">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              id="voice-play-btn"
                              onClick={handleToggleVoiceNote}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]" id="voice-icon">
                                {isPlayingVoice ? 'pause' : 'play_arrow'}
                              </span>
                            </button>

                            {/* Audio Waveform Visualization */}
                            <div className="flex items-center gap-1 h-6 flex-1">
                              <span className={`w-1 bg-white/60 rounded-full h-2 ${isPlayingVoice ? 'animate-bounce' : ''}`} />
                              <span className={`w-1 bg-white/90 rounded-full h-5 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.1s]' : ''}`} />
                              <span className={`w-1 bg-white rounded-full h-4 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.2s]' : ''}`} />
                              <span className={`w-1 bg-white/70 rounded-full h-6 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.3s]' : ''}`} />
                              <span className={`w-1 bg-white/85 rounded-full h-3 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.15s]' : ''}`} />
                              <span className={`w-1 bg-white rounded-full h-5 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.25s]' : ''}`} />
                              <span className={`w-1 bg-white/70 rounded-full h-2 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.05s]' : ''}`} />
                              <span className={`w-1 bg-white/90 rounded-full h-4 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.35s]' : ''}`} />
                              <span className={`w-1 bg-white/50 rounded-full h-2 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.2s]' : ''}`} />
                              <span className={`w-1 bg-white/80 rounded-full h-5 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.1s]' : ''}`} />
                              <span className={`w-1 bg-white/60 rounded-full h-3 ${isPlayingVoice ? 'animate-bounce [animation-delay:0.3s]' : ''}`} />
                            </div>
                            <span className="text-[11px] font-mono opacity-80 select-none">
                              {isPlayingVoice ? '0:07' : '0:14'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] opacity-90 pt-1 border-t border-white/15">
                            <span>Voice Tapri Note</span>
                            <span className="flex items-center gap-1 font-mono">
                              <span className="material-symbols-outlined text-[12px]">graphic_eq</span>
                              48kHz Low-latency
                            </span>
                          </div>
                        </div>

                        {/* Reaction Counters Row */}
                        <div className="flex items-center gap-1 mt-1 pr-1">
                          {Object.entries(reactions).map(([em, count]) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => handleIncrementReaction(em)}
                              className="flex items-center gap-1 bg-[#13233A] hover:bg-[#1C2D46] border border-white/10 px-2 py-0.5 rounded-full text-[11px] font-mono text-[#CBD5E1] hover:text-white transition-all cursor-pointer active:scale-90"
                            >
                              <span>{em}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Mockup Message Input Bar */}
                    <form onSubmit={handleMockSend} className="p-3 bg-[#0d1c2d] border-t border-white/10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMockMessageText((p) => p + '☕ ')}
                        className="w-8 h-8 rounded-full bg-[#13233A] border border-white/10 flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                        title="Add tea emoji"
                      >
                        <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
                      </button>
                      <button
                        type="button"
                        onClick={onEnterLounge}
                        className="w-8 h-8 rounded-full bg-[#13233A] border border-white/10 flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                        title="Attachment"
                      >
                        <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      </button>
                      <input
                        type="text"
                        value={mockMessageText}
                        onChange={(e) => setMockMessageText(e.target.value)}
                        placeholder="Speak your mind, no log stored..."
                        className="flex-1 bg-[#0C1929] border border-white/10 rounded-full px-4 py-2 text-xs text-[#F8FAFC] placeholder:text-[#64748B]/60 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-8 h-8 rounded-full bg-[#ff5722] text-white flex items-center justify-center hover:bg-[#F4511E] shadow-sm transition-colors cursor-pointer"
                        title="Enter lounge"
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </form>
                    {mockFeedbackToast && (
                      <div className="bg-[#ff5722]/20 border-t border-[#ff5722]/30 px-3 py-1.5 text-center text-xs font-mono text-[#ffb5a0] animate-in fade-in">
                        {mockFeedbackToast}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 2. LIVE QUIET LOUNGES & ROOMS ROW */}
          <section id="live-lounges" className="w-full bg-[#010f1f] border-y border-white/10 py-16 relative">
            <div className="max-w-[1200px] mx-auto px-6 flex flex-col gap-10">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb5a0] text-[20px]">surround_sound</span>
                    <span className="text-xs text-[#ffb5a0] tracking-widest uppercase font-mono font-bold">
                      Live Quiet Lounges
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#F8FAFC] font-extrabold tracking-tight">
                    Drop into real conversations. Leave anytime.
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] font-mono">No sign-up wall to listen</span>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                </div>
              </div>

              {/* 3 Live Room Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: #chai_n_code */}
                <div className="flex flex-col justify-between bg-[#13233A]/70 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-md hover:bg-[#13233A] hover:border-white/20 transition-all group">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#0C1929] border border-[#22C55E]/50 text-xs text-[#22C55E] font-mono font-bold flex items-center gap-2 shadow-[0_0_14px_rgba(34,197,94,0.22)] tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                        {tapri1.onlineChillers} {tapri1.onlineChillers === 1 ? 'chiller online' : 'chillers online'}
                      </span>
                      <span className="material-symbols-outlined text-[#64748B] group-hover:text-[#ff5722] transition-colors text-[20px]">
                        {tapri1.icon || 'code'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl text-[#F8FAFC] font-bold">{tapri1.tag}</h3>
                        {onNavigateToTapriPage && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTapriPage(tapri1.name)}
                            className="text-xs text-[#86cfff] hover:underline font-mono"
                          >
                            page ↗
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[#CBD5E1] leading-relaxed">
                        {tapri1.description}
                      </p>
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {tapri1.tags.map((tagItem) => (
                        <span key={tagItem} className="px-2 py-0.5 rounded-md bg-[#1C2D46] text-xs font-mono text-[#CBD5E1]">
                          {tagItem}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#64748B] text-xs font-mono">
                      <span className="material-symbols-outlined text-[16px] text-[#22C55E]">mic</span>
                      <span className="text-[#22C55E] font-semibold text-xs font-mono">{tapri1.speakersCount} live speakers</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTapri) onOpenTapri(tapri1.name);
                        else if (onJoinRoom) onJoinRoom('CHAI26');
                        else onEnterLounge();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#ff5722] hover:bg-[#F4511E] shadow-sm transition-all cursor-pointer"
                    >
                      <span>Join Audio 🎙️</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: #startup_fumbles */}
                <div className="flex flex-col justify-between bg-gradient-to-b from-[#13233A]/90 to-[#0c1929]/95 border border-white/15 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-[#ff5722]/50 hover:shadow-[0_8px_32px_rgba(255,87,34,0.2)] transition-all group duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#0C1929] border border-[#ff5722]/50 text-xs text-[#ffb5a0] font-mono font-bold flex items-center gap-2 shadow-[0_0_14px_rgba(255,87,34,0.22)] tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-[#ff5722] animate-pulse" />
                        {tapri2.onlineChillers} {tapri2.onlineChillers === 1 ? 'chiller venting' : 'chillers venting'}
                      </span>
                      <span className="material-symbols-outlined text-[#64748B] group-hover:text-[#ff5722] transition-colors text-[20px]">
                        {tapri2.icon || 'psychology'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl text-[#F8FAFC] font-bold">{tapri2.tag}</h3>
                        {onNavigateToTapriPage && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTapriPage(tapri2.name)}
                            className="text-xs text-[#ffb5a0] hover:underline font-mono"
                          >
                            page ↗
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[#CBD5E1] leading-relaxed">
                        {tapri2.description}
                      </p>
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {tapri2.tags.map((tagItem) => (
                        <span key={tagItem} className="px-2 py-0.5 rounded-md bg-[#1C2D46] text-xs font-mono text-[#CBD5E1]">
                          {tagItem}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#64748B] text-xs font-mono">
                      <span className="material-symbols-outlined text-[16px] text-[#ff5722]">mic</span>
                      <span className="text-[#ffb5a0] font-semibold text-xs font-mono">{tapri2.speakersCount} live speakers</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTapri) onOpenTapri(tapri2.name);
                        else if (onJoinRoom) onJoinRoom('FUMBLE');
                        else onEnterLounge();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#ff5722] hover:bg-[#F4511E] shadow-sm transition-all cursor-pointer"
                    >
                      <span>Join Audio 🎙️</span>
                    </button>
                  </div>
                </div>

                {/* Card 3: #ambient_reading */}
                <div className="flex flex-col justify-between bg-gradient-to-b from-[#13233A]/90 to-[#0c1929]/95 border border-white/15 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-[#86cfff]/50 hover:shadow-[0_8px_32px_rgba(134,207,255,0.2)] transition-all group duration-300">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#0C1929] border border-[#86cfff]/50 text-xs text-[#86cfff] font-mono font-bold flex items-center gap-2 shadow-[0_0_14px_rgba(134,207,255,0.22)] tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-[#86cfff] animate-pulse" />
                        {tapri3.onlineChillers} {tapri3.onlineChillers === 1 ? 'chiller co-studying' : 'chillers co-studying'}
                      </span>
                      <span className="material-symbols-outlined text-[#64748B] group-hover:text-[#ff5722] transition-colors text-[20px]">
                        {tapri3.icon || 'auto_stories'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl text-[#F8FAFC] font-bold">{tapri3.tag}</h3>
                        {onNavigateToTapriPage && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTapriPage(tapri3.name)}
                            className="text-xs text-[#86cfff] hover:underline font-mono"
                          >
                            page ↗
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[#CBD5E1] leading-relaxed">
                        {tapri3.description}
                      </p>
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {tapri3.tags.map((tagItem) => (
                        <span key={tagItem} className="px-2 py-0.5 rounded-md bg-[#1C2D46] text-xs font-mono text-[#CBD5E1]">
                          {tagItem}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#64748B] text-xs font-mono">
                      <span className="material-symbols-outlined text-[16px] text-[#86cfff]">
                        {tapri3.speakersCount > 0 ? 'mic' : 'mic_off'}
                      </span>
                      <span className="text-[#86cfff] font-semibold text-xs font-mono">
                        {tapri3.speakersCount > 0 ? `${tapri3.speakersCount} live speakers` : 'Silent / Audio Muted'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTapri) onOpenTapri(tapri3.name);
                        else if (onJoinRoom) onJoinRoom('CALM99');
                        else onEnterLounge();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#F8FAFC] bg-[#1C2D46] hover:bg-[#273647] border border-white/10 transition-all cursor-pointer"
                    >
                      <span>Sit In Quietly 🎧</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 'ENGINEERED FOR CALM' DIFFERENTIATOR GRID */}
          <section id="manifesto" className="max-w-[1200px] mx-auto px-6 py-20 w-full">
            <div className="flex flex-col gap-12">
              {/* Section Intro Header */}
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#86cfff] text-[20px]">spa</span>
                  <span className="text-xs text-[#86cfff] tracking-widest uppercase font-mono font-bold">
                    Nordic Architecture
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl text-[#F8FAFC] font-extrabold tracking-tight">
                  Engineered for calm, not ad impressions.
                </h2>
                <p className="text-base text-[#64748B] leading-relaxed">
                  Modern messaging systems are optimized to provoke panic. Berojgar Chat does the inverse: minimal
                  friction, unmonitored drop-ins, and cryptographic anonymity.
                </p>
              </div>

              {/* 4-Column Desktop Cards Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Differentiator 1 */}
                <div className="p-6 rounded-2xl bg-[#13233A]/50 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 shadow-sm hover:bg-[#13233A] hover:border-white/20 transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1C2D46] flex items-center justify-center text-[#ffb5a0]">
                      <span className="material-symbols-outlined text-[26px]">no_sim</span>
                    </div>
                    <h4 className="text-lg text-[#F8FAFC] font-bold">Zero Numbers</h4>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed">
                      Unlink your phone book forever. No intrusive &quot;contacts joined&quot; push alerts and no
                      awkward scans from relatives or HR recruiters.
                    </p>
                  </div>
                  <div className="text-xs text-[#ffb5a0] font-mono font-semibold flex items-center gap-1">
                    <span>Burner handles only</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                  </div>
                </div>

                {/* Differentiator 2 */}
                <div className="p-6 rounded-2xl bg-[#13233A]/50 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 shadow-sm hover:bg-[#13233A] hover:border-white/20 transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1C2D46] flex items-center justify-center text-[#86cfff]">
                      <span className="material-symbols-outlined text-[26px]">spatial_audio_off</span>
                    </div>
                    <h4 className="text-lg text-[#F8FAFC] font-bold">Crystal Audio</h4>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed">
                      Late night calls tuned with neural acoustic filters that silence ceiling fans, keyboard clatter,
                      and neighborhood barking dogs.
                    </p>
                  </div>
                  <div className="text-xs text-[#86cfff] font-mono font-semibold flex items-center gap-1">
                    <span>Crisp 48kHz Opus</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                  </div>
                </div>

                {/* Differentiator 3 */}
                <div className="p-6 rounded-2xl bg-[#13233A]/50 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 shadow-sm hover:bg-[#13233A] hover:border-white/20 transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1C2D46] flex items-center justify-center text-[#22C55E]">
                      <span className="material-symbols-outlined text-[26px]">auto_delete</span>
                    </div>
                    <h4 className="text-lg text-[#F8FAFC] font-bold">Disappearing</h4>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed">
                      View-once media and temporary text rooms with zero persistent database footprint. Your words
                      evaporate when the room closes.
                    </p>
                  </div>
                  <div className="text-xs text-[#22C55E] font-mono font-semibold flex items-center gap-1">
                    <span>Volatile RAM buffers</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                  </div>
                </div>

                {/* Differentiator 4 */}
                <div className="p-6 rounded-2xl bg-[#13233A]/50 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 shadow-sm hover:bg-[#13233A] hover:border-white/20 transition-all">
                  <div className="flex flex-col gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1C2D46] flex items-center justify-center text-[#ff5722]">
                      <span className="material-symbols-outlined text-[26px]">speed</span>
                    </div>
                    <h4 className="text-lg text-[#F8FAFC] font-bold">Featherlight</h4>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed">
                      Blazing fast WebAssembly audio engine running smoothly under 15ms latency, even on 3G college
                      Wi-Fi connections.
                    </p>
                  </div>
                  <div className="text-xs text-[#ff5722] font-mono font-semibold flex items-center gap-1">
                    <span>Sub-15ms packet sync</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                  </div>
                </div>
              </div>

              {/* Rich Visual Metric Callout & Architecture Banner */}
              <div className="p-8 rounded-2xl bg-[#0C1929] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-lg">
                <div className="flex flex-col gap-2 max-w-md">
                  <span className="text-xs text-[#ffb5a0] uppercase tracking-wider font-mono font-bold">
                    Nocturne Protocol
                  </span>
                  <h3 className="text-2xl text-[#F8FAFC] font-bold">Designed for deep nocturnal rest</h3>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    Our palettes are calibrated below 450nm wavelength emission spikes to avoid melatonin disruption
                    during 3 AM thoughts.
                  </p>
                </div>

                {/* Inline SVG Performance Chart / Wave Visualizer */}
                <div className="w-full lg:w-96 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[#64748B] text-xs font-mono">
                    <span>Packet Delay Variance (Jitter)</span>
                    <span className="text-[#22C55E] font-bold font-mono text-xs flex items-center gap-2 bg-[#07111c] border border-[#22C55E]/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.25)] tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      <span>{metrics.realtimeLatencyMs} ms live RTT speed</span>
                    </span>
                  </div>
                  <div className="bg-[#0d1c2d] border border-white/10 p-3 rounded-xl">
                    {(() => {
                      const points = (metrics.latencyHistory && metrics.latencyHistory.length > 1
                        ? metrics.latencyHistory
                        : [14, 12, 16, 11, 15, 12, 13, 10, 14, 12]
                      ).map((val, idx, arr) => {
                        const x = Math.round((idx / (arr.length - 1)) * 320);
                        const clamped = Math.max(5, Math.min(50, val));
                        const y = Math.round(50 - ((clamped - 5) / 45) * 38);
                        return { x, y };
                      });
                      const lineD = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
                      const areaD = `${lineD} L 320 60 L 0 60 Z`;
                      const lastP = points[points.length - 1] || { x: 320, y: 30 };
                      return (
                        <svg
                          className="w-full h-16 text-[#ff5722]"
                          fill="none"
                          viewBox="0 0 320 60"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d={lineD}
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeWidth="2.5"
                          />
                          <path
                            d={areaD}
                            fill="currentColor"
                            fillOpacity="0.14"
                          />
                          <circle cx={lastP.x} cy={lastP.y} fill="#FF5722" r="4.5" className="animate-pulse" />
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. COMMUNITY PROOF & PEER REVIEWS */}
          <section id="community" className="w-full bg-[#010f1f] border-t border-white/10 py-20">
            <div className="max-w-[1200px] mx-auto px-6 flex flex-col gap-12">
              {/* Key Stat Counters Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#13233A]/40 border border-white/10 p-6 rounded-2xl shadow-sm text-center">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl sm:text-4xl text-[#ff5722] font-black tracking-tight font-mono drop-shadow-[0_0_20px_rgba(255,87,34,0.45)]">
                    {metrics.totalMessagesToday.toLocaleString()}
                  </span>
                  <span className="text-sm text-[#CBD5E1] font-medium font-mono">Messages shared today</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl sm:text-4xl text-[#86cfff] font-black tracking-tight font-mono drop-shadow-[0_0_20px_rgba(134,207,255,0.45)]">
                    ~{metrics.realAudioLagMs || Math.round(metrics.realtimeLatencyMs + 22)}ms
                  </span>
                  <span className="text-sm text-[#CBD5E1] font-medium font-mono">Audio lag across India</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl sm:text-4xl text-[#22C55E] font-black tracking-tight font-mono drop-shadow-[0_0_20px_rgba(34,197,94,0.45)]">
                    {metrics.calmScore}
                  </span>
                  <span className="text-sm text-[#CBD5E1] font-medium font-mono">Night chiller calm score</span>
                </div>
              </div>

              {/* Peer Review & Testimonial Cards Mosaic */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Review Card 1 */}
                <div className="bg-[#13233A]/70 border border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover shadow-sm border border-white/10"
                        alt="Karan Rathore portrait"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7frVzhNsvneuQqOFSOcuU8VOINCO-dIfddg212q-OhBVBjtp4BoiRp8UjsMxqgeGpXx-3OPK0tjRtzF4XNb042muRUn3AyNYuTx1PAObxpTZEVMpTd5m3f7Iy0OxefoSi1XjqflNtompAVMeFWJK2UMIy6soChAObpA7Jdsr7ibdQG_QdCVs0vqJOjI3SdeWeKMKpLcVbVDbjBZuqSA5muMTvZdrF62CxnBk5NkvUwyEzgIcIufRw"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#F8FAFC] font-bold">Karan Rathore</span>
                          <span className="material-symbols-outlined text-[#ff5722] text-[16px]">verified</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] font-mono">
                          Final Year CS Student • Tier-3 College
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#CBD5E1] italic leading-relaxed">
                      &quot;Discord got way too noisy with spam servers, and WhatsApp is filled with uncles checking on
                      job status. Berojgar tapri is where I hop on at 2 AM to just code quietly with others.&quot;
                    </p>
                  </div>
                  <span className="text-[11px] text-[#ffb5a0] font-mono">Frequent in #chai_n_code</span>
                </div>

                {/* Review Card 2 */}
                <div className="bg-[#13233A]/70 border border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover shadow-sm border border-white/10"
                        alt="Pooja Nambiar portrait"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd0VFXTNufNhvLPF3Ehdu2UhWMvOU5dlJCFpBndbsvNrK8mDgxv1puzPASB7gAKWdXyMJt0W7pZ9A-3dhrr8S-FOmrluUSm7pVc-qvvcV7VPdiKeRpsF-w7lATzRn2i2qpJYNbCnu9mjhhuyu45CzG0MjTN-yct3dl0BVVXjuyRbem2h-V4S63ZISDepmOCu4djGiJ8La_EscJoH23c7Mlf5s7Bu9n0k-JeQbYOaVBnEG2YA3AMldA"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#F8FAFC] font-bold">Pooja Nambiar</span>
                          <span className="material-symbols-outlined text-[#86cfff] text-[16px]">verified</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] font-mono">Product Designer & Night Owl</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#CBD5E1] italic leading-relaxed">
                      &quot;The audio noise suppression is insane. My fan sounds like a storm, but people in the lounge
                      hear none of it. Best place to vent about Figma redlines without social baggage.&quot;
                    </p>
                  </div>
                  <span className="text-[11px] text-[#86cfff] font-mono">Frequent in #startup_fumbles</span>
                </div>

                {/* Review Card 3 */}
                <div className="bg-[#13233A]/70 border border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover shadow-sm border border-white/10"
                        alt="Tanmay Deshmukh portrait"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtq746p8yClDFFezW8KvukbOQc7GMAMdDDyTBtSBDx1B9NXwN8GIXh3tY4wy27dstneZWx-Q30HAGWOHFhe4s5DpGivOsdqT8k0ADqS8PJrQYPkep-7KOcdShb8Z1ZQHD5Eq6CwR5BjVYGalBZRqPGoKRwCf8m3T9VuFPZchL4GUoO3FHSL4_fHGYVRDQsBk02NoLw0lzTGXDTV2T9ZEGREcwSyokZsJ13sZQhIdbVChX1BIQNirN1"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-base text-[#F8FAFC] font-bold">Tanmay Deshmukh</span>
                          <span className="material-symbols-outlined text-[#22C55E] text-[16px]">verified</span>
                        </div>
                        <span className="text-[11px] text-[#64748B] font-mono">Writer & Remote Freelancer</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#CBD5E1] italic leading-relaxed">
                      &quot;Not needing a mobile phone number to log in was the deciding factor. Complete peace of mind.
                      You drop in, drink chai, discuss an idea, and log out with zero algorithmic hangover.&quot;
                    </p>
                  </div>
                  <span className="text-[11px] text-[#22C55E] font-mono">Frequent in #ambient_reading</span>
                </div>
              </div>

              {/* Final Ambient Lounge Gateway Callout */}
              <div className="bg-gradient-to-r from-[#1C2D46] via-[#13233A] to-[#1C2D46] border border-white/15 p-8 sm:p-12 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <span className="text-xs text-[#ffb5a0] uppercase font-mono font-bold tracking-wider">
                    Nocturnal Sanctuary
                  </span>
                  <h3 className="text-2xl sm:text-3xl text-[#F8FAFC] font-extrabold tracking-tight">
                    Chai ban gayi? Come sit with us.
                  </h3>
                  <p className="text-sm text-[#CBD5E1] max-w-lg leading-relaxed">
                    No installation necessary. Opens instantly in your browser tab without background battery drain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onEnterLounge}
                  className="h-[50px] px-8 rounded-full text-base font-bold text-white bg-[#ff5722] hover:bg-[#F4511E] shadow-[0_8px_24px_-4px_rgba(255,87,34,0.45)] transition-all flex items-center justify-center whitespace-nowrap cursor-pointer active:scale-95"
                >
                  Open Web Tapri →
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#010f1f] border-t border-white/10 pt-16 pb-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col gap-12">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb5a0] text-[20px]">tag</span>
              <span className="text-lg text-[#F8FAFC] font-bold">Live Tapri Hangouts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-[#13233A] border border-white/10 text-xs font-mono text-[#CBD5E1]">
                #late-night-philosophy
              </span>
              <span className="px-3 py-1 rounded-full bg-[#13233A] border border-white/10 text-xs font-mono text-[#CBD5E1]">
                #resume-venting
              </span>
              <span className="px-3 py-1 rounded-full bg-[#13233A] border border-white/10 text-xs font-mono text-[#CBD5E1]">
                #silent-coworking
              </span>
              <span className="px-3 py-1 rounded-full bg-[#13233A] border border-white/10 text-xs font-mono text-[#CBD5E1]">
                #chai-breaks
              </span>
              <span className="px-3 py-1 rounded-full bg-[#13233A] border border-white/10 text-xs font-mono text-[#CBD5E1]">
                #startup-ideas-at-3am
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#ff5722] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                </div>
                <span className="text-lg text-[#F8FAFC] font-bold">Berojgar Chat</span>
              </div>
              <p className="text-sm text-[#64748B] max-w-md leading-relaxed">
                An atmospheric sanctuary for nocturnal thinkers, job-seekers, creators, and night owls. Free from
                aggressive algorithmic feeds, corporate hustle culture, and surveillance.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-[#22C55E] text-[18px]">verified_user</span>
                <span className="text-xs text-[#CBD5E1] font-mono">
                  Privacy Pledge: Zero tracking, no phone number required, zero telemetry.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-[#ffb5a0] tracking-wider uppercase font-mono font-bold">Spaces</span>
              <button
                type="button"
                onClick={() => handleScrollTo('live-lounges')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Public Chill Rooms
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('live-lounges')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Audio Tapri Lounges
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('manifesto')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Anti-Hustle Manifesto
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('community')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Community Guidelines
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-[#ffb5a0] tracking-wider uppercase font-mono font-bold">
                Ethics & Protocol
              </span>
              <button
                type="button"
                onClick={() => handleScrollTo('manifesto')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Cryptographic Anonymity
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('manifesto')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Zero Data Retention
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('community')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Safety & Moderation
              </button>
              <button
                type="button"
                onClick={onEnterLounge}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Desktop Web Node
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10 gap-4">
            <span className="text-xs text-[#64748B] font-mono">
              © {new Date().getFullYear()} Berojgar Chat. Built for uninterrupted peace of mind.
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-xs text-[#64748B] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                End-to-End Encrypted Lounges
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
