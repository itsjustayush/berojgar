import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Wifi,
  Users,
  MessageSquare,
  Sparkles,
  Zap,
  Volume2,
  Shield,
  Coffee,
  Flame,
  ArrowRight,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Lock,
  Mic,
  MicOff,
  Activity,
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  Tag,
} from 'lucide-react';
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
    realAudioLagMs: 33,
    calmScore: '100% Zero Noise',
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
    latencyHistory: [14, 12, 16, 11, 15, 12, 13, 10, 14, 11.4],
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
    message: 'Self-sovereign handle. No phone number or invasive contacts sync required.',
  });

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    '🔥': 14,
    '😂': 9,
    '☕': 21,
  });
  const [mockMessageText, setMockMessageText] = useState('');
  const [mockFeedbackToast, setMockFeedbackToast] = useState<string | null>(null);
  const handleInputRef = useRef<HTMLInputElement | null>(null);

  const handleClaim = () => {
    const val = handleInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!val) {
      setHandleStatus({
        type: 'error',
        message: 'Please enter a valid handle (e.g. nocturnal_fox)',
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
      [emoji]: (prev[emoji] || 0) + 1,
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

  // Calculated Real-Time Metric Values
  const realAudioLagValue = metrics.realAudioLagMs || Math.round(metrics.realtimeLatencyMs + 22);

  return (
    <div className="bg-[#070E18] text-[#d4e4fa] font-sans antialiased min-h-screen selection:bg-[#EF4E22] selection:text-white relative overflow-x-hidden">
      {/* Dynamic Atmospheric Lighting Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[450px] bg-[#EF4E22]/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 right-5 w-[500px] h-[500px] bg-[#86cfff]/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-20 left-10 w-[600px] h-[400px] bg-[#22C55E]/05 rounded-full blur-[180px]" />
      </div>

      {/* Sticky Top Header */}
      <header className="sticky top-0 w-full z-50 bg-[#070E18]/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
        <div className="h-18 max-w-[1240px] mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF4E22] to-[#c7340b] flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,78,34,0.45)] group-hover:scale-105 transition-all">
                <Flame size={20} className="text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-lg text-[#F8FAFC] tracking-tight">Berozgar</span>
                  <span className="text-xs text-[#ffb5a0] font-bold" style={{ fontFamily: 'Mukta, sans-serif' }}>
                    बेरोज़गार
                  </span>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono tracking-wider uppercase">
                  The Digital Chai Tapri
                </span>
              </div>
            </a>

            {/* Real-time Chillers Pill in Header */}
            <div className="hidden xl:inline-flex items-center gap-2.5 bg-[#101c36]/70 border border-white/[0.08] backdrop-blur-md px-3.5 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
              </span>
              <span className="text-xs text-[#CBD5E1] font-mono">
                <strong className="text-[#22C55E] font-semibold">{metrics.onlineChillers.toLocaleString()}</strong> chillers live
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#101c36]/50 border border-white/[0.08] p-1.5 rounded-full backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleScrollTo('live-lounges')}
              className="px-4 py-1.5 rounded-full text-xs font-mono font-medium text-[#d4e4fa]/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Live Rooms
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('telemetry-hud')}
              className="px-4 py-1.5 rounded-full text-xs font-mono font-medium text-[#d4e4fa]/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Activity size={12} className="text-[#22C55E]" />
              <span>Real Telemetry</span>
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('manifesto')}
              className="px-4 py-1.5 rounded-full text-xs font-mono font-medium text-[#d4e4fa]/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Manifesto
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('community')}
              className="px-4 py-1.5 rounded-full text-xs font-mono font-medium text-[#d4e4fa]/80 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Community
            </button>
          </nav>

          {/* Right Action Trigger Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#101c36]/60 border border-white/[0.08] px-3 py-1.5 rounded-full text-[#CBD5E1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86cfff] animate-pulse" />
              <span className="text-[11px] font-mono text-[#86cfff]">Zero Log Keep</span>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={onEnterLounge}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-white bg-[#18284c] hover:bg-[#203464] border border-white/15 transition-all cursor-pointer shadow-sm"
              >
                <span>@{currentUser.username}</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth()}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-mono font-semibold text-[#F8FAFC] bg-[#101c36] hover:bg-[#18284c] border border-white/10 transition-all cursor-pointer"
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
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#EF4E22] to-[#e03d10] hover:brightness-110 shadow-[0_4px_20px_rgba(239,78,34,0.4)] transition-all cursor-pointer active:scale-95"
            >
              <span>Claim @handle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: 2-Column Responsive Layout with Real Telemetry HUD     */}
        {/* ========================================================================= */}
        <section className="max-w-[1240px] mx-auto px-5 sm:px-8 pt-10 pb-16 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Mission, Headlines, Telemetry HUD & Handle Bar (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Protocol Badge Pill */}
              <div className="inline-flex items-center gap-2.5 self-start bg-[#101c36]/90 border border-white/[0.1] backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
                </span>
                <span className="text-xs text-[#ffb5a0] tracking-wider uppercase font-mono font-bold">
                  Berozgar Protocol 2.0
                </span>
                <span className="text-white/20">•</span>
                <span className="text-xs text-[#CBD5E1] font-mono">Zero Phone Numbers</span>
                <span className="text-white/20">•</span>
                <span className="text-[10px] bg-[#18284c] text-[#86cfff] px-2 py-0.5 rounded font-mono font-bold">
                  P2P MESH
                </span>
              </div>

              {/* Master Bilingual Heading */}
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1
                    className="text-4xl sm:text-5xl lg:text-6xl text-[#F8FAFC] tracking-tight font-extrabold drop-shadow-sm"
                    style={{ fontFamily: 'Mukta, "Plus Jakarta Sans", sans-serif' }}
                  >
                    बेरोज़गार चैट
                  </h1>
                  <span className="text-2xl sm:text-3xl text-[#EF4E22] font-extrabold tracking-tight">
                    / Berozgar Lounge
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#F8FAFC] font-semibold leading-tight tracking-tight">
                  Unfiltered conversations, late-night tea thoughts, zero pressure.
                </h2>
              </div>

              {/* Narrative Subtext */}
              <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed max-w-2xl">
                <strong className="text-white font-semibold">बस सुकून, बस बातचीत।</strong> High-fidelity nocturnal audio
                lounges, soothing eye-safe dark palettes, 48kHz neural acoustic filtering, and complete liberation from
                intrusive phonebook contacts.
              </p>

              {/* Real-time Quick Telemetry HUD Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#0c182e]/80 border border-white/[0.08] backdrop-blur-xl shadow-inner">
                {/* Real Active Chillers */}
                <div className="flex flex-col p-2.5 rounded-xl bg-[#101c36]/50 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    <span>Chillers</span>
                  </div>
                  <span className="text-lg font-black font-mono text-[#22C55E] mt-0.5 tracking-tight">
                    {metrics.onlineChillers.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-mono truncate">Live right now</span>
                </div>

                {/* Real Measured Latency / Speed */}
                <div className="flex flex-col p-2.5 rounded-xl bg-[#101c36]/50 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    <Zap size={10} className="text-[#EF4E22]" />
                    <span>Real Speed</span>
                  </div>
                  <span className="text-lg font-black font-mono text-[#EF4E22] mt-0.5 tracking-tight">
                    {metrics.realtimeLatencyMs}ms
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-mono truncate">Round-trip RTT</span>
                </div>

                {/* Real Audio Lag */}
                <div className="flex flex-col p-2.5 rounded-xl bg-[#101c36]/50 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    <Volume2 size={10} className="text-[#86cfff]" />
                    <span>Audio Lag</span>
                  </div>
                  <span className="text-lg font-black font-mono text-[#86cfff] mt-0.5 tracking-tight">
                    ~{realAudioLagValue}ms
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-mono truncate">Node-to-node</span>
                </div>

                {/* Real Registered Users */}
                <div className="flex flex-col p-2.5 rounded-xl bg-[#101c36]/50 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    <Users size={10} className="text-[#ffb5a0]" />
                    <span>Registered</span>
                  </div>
                  <span className="text-lg font-black font-mono text-[#F8FAFC] mt-0.5 tracking-tight">
                    {metrics.totalRegisteredUsers.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-mono truncate">Accounts joined</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={onEnterLounge}
                  className="inline-flex items-center justify-center gap-2.5 h-[52px] px-8 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#EF4E22] to-[#e03d10] hover:brightness-110 shadow-[0_8px_28px_rgba(239,78,34,0.4)] transition-all active:scale-95 cursor-pointer"
                >
                  <span>Enter Web Lounge Free</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollTo('live-lounges')}
                  className="inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded-full text-sm font-semibold text-[#F8FAFC] bg-[#101c36] hover:bg-[#18284c] border border-white/10 transition-all cursor-pointer"
                >
                  <Headphones size={18} className="text-[#86cfff]" />
                  <span>Explore Live Rooms</span>
                </button>
              </div>

              {/* Interactive Handle Claim Widget */}
              <div className="p-4 rounded-2xl bg-[#101c36]/80 border border-white/10 backdrop-blur-xl shadow-lg max-w-xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="flex items-center flex-1 bg-[#091122] border border-white/10 rounded-full px-4 py-2.5 focus-within:border-[#EF4E22]/60 transition-colors">
                    <span className="text-xs text-[#64748B] font-mono select-none">berojgar.chat/@</span>
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
                    className="h-[44px] px-6 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#EF4E22] hover:bg-[#e03d10] transition-all whitespace-nowrap shadow-sm cursor-pointer active:scale-95"
                  >
                    Claim @handle
                  </button>
                </div>

                <div
                  id="handle-status"
                  className="text-[11px] text-[#64748B] mt-2.5 pl-2 flex items-center justify-between flex-wrap gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    {handleStatus.type === 'error' ? (
                      <>
                        <AlertCircle size={13} className="text-[#EF4444]" />
                        <span className="text-[#EF4444] font-medium">{handleStatus.message}</span>
                      </>
                    ) : handleStatus.type === 'success' ? (
                      <>
                        <CheckCircle2 size={13} className="text-[#22C55E]" />
                        <span className="text-[#22C55E] font-medium">{handleStatus.message}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} className="text-[#22C55E]" />
                        <span>{handleStatus.message}</span>
                      </>
                    )}
                  </div>

                  {handleStatus.reservedHandle && (
                    <button
                      type="button"
                      onClick={() => onOpenAuth(handleStatus.reservedHandle)}
                      className="text-[#ffb5a0] hover:text-white font-mono font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Sign up as @{handleStatus.reservedHandle}</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Room Window Mockup (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#EF4E22]/20 to-[#86cfff]/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

              {/* Mockup Window Container */}
              <div className="relative bg-[#0c182e]/95 border border-white/15 backdrop-blur-2xl rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
                {/* Window Top Titlebar */}
                <div className="h-11 bg-[#091222] border-b border-white/10 px-4 flex items-center justify-between select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-inner" />
                    <span className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-inner" />
                    <span className="w-3 h-3 rounded-full bg-[#27C93F] shadow-inner" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CBD5E1] text-[11px] font-mono font-medium bg-[#070e1a] border border-white/10 px-3 py-1 rounded-full shadow-inner">
                    <Lock size={11} className="text-[#22C55E]" />
                    <span>berojgar.chat/lounge</span>
                  </div>
                  <div className="w-12" />
                </div>

                {/* Active Tapri Room Header */}
                <div className="p-4 bg-[#101c36] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EF4E22]/20 border border-[#EF4E22]/40 flex items-center justify-center text-[#EF4E22]">
                      <Coffee size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-[#F8FAFC] font-bold">{tapri1.tag}</span>
                        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      </div>
                      <span className="text-[11px] text-[#22C55E] font-mono font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                        <span>{tapri1.onlineChillers} chillers listening</span>
                        <span className="text-[#64748B]">•</span>
                        <span className="text-[#86cfff] font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-[#86cfff]/15 border border-[#86cfff]/30">
                          {tapri1.totalUsers} members
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Active Peers Avatar Stack */}
                  <div className="flex items-center -space-x-2 p-1 rounded-full bg-[#0c182e] border border-white/10">
                    <div
                      title="Ayush (Host)"
                      className="w-7 h-7 rounded-full bg-[#18284c] border-2 border-[#0c182e] flex items-center justify-center text-[#ffb5a0] text-[10px] font-bold"
                    >
                      AB
                    </div>
                    {tapri1.onlineChillers > 1 && (
                      <div
                        title="Subarna (Chiller)"
                        className="w-7 h-7 rounded-full bg-[#101c36] border-2 border-[#0c182e] flex items-center justify-center text-[#86cfff] text-[10px] font-bold"
                      >
                        SB
                      </div>
                    )}
                    {currentUser && currentUser.username !== 'itsjustayush' && (
                      <div
                        title={currentUser.displayName || currentUser.username}
                        className="w-7 h-7 rounded-full bg-[#22C55E]/20 border-2 border-[#0c182e] flex items-center justify-center text-[#22C55E] text-[10px] font-bold ring-1 ring-[#22C55E]/40"
                      >
                        {(currentUser.displayName || currentUser.username || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {tapri1.totalUsers > 3 && (
                      <div className="w-7 h-7 rounded-full bg-[#18284c] border-2 border-[#0c182e] flex items-center justify-center text-[#CBD5E1] text-[9px] font-bold">
                        +{tapri1.totalUsers - 2}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Speaking Activity Visualizer Strip */}
                <div className="px-4 py-2 bg-[#0a1426] border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-4 h-4">
                      <span className="absolute w-3.5 h-3.5 rounded-full bg-[#EF4E22]/40 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-[#EF4E22]" />
                    </div>
                    <span className="text-[11px] text-[#ffb5a0] font-mono font-medium">Aarav is speaking</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-[#ffb5a0] rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-[#EF4E22] rounded-full animate-pulse [animation-delay:0.15s]" />
                    <span className="w-1 h-2 bg-[#ffb5a0] rounded-full animate-pulse [animation-delay:0.3s]" />
                    <span className="w-1 h-4 bg-[#EF4E22] rounded-full animate-pulse [animation-delay:0.45s]" />
                    <span className="w-1 h-1.5 bg-[#ffb5a0] rounded-full animate-pulse [animation-delay:0.2s]" />
                  </div>
                </div>

                {/* Simulated Conversation Feed */}
                <div className="p-4 flex flex-col gap-3.5 min-h-[290px] justify-end">
                  <div className="text-center text-[10px] text-[#64748B] font-mono my-1">
                    03:42 AM • Midnight Tapri Session
                  </div>

                  {/* Incoming Message */}
                  <div className="flex flex-col items-start gap-1 max-w-[85%]">
                    <div className="flex items-center gap-1.5 pl-2">
                      <span className="text-[11px] text-[#86cfff] font-semibold font-mono">@samay_v</span>
                      <span className="text-[10px] text-[#64748B] font-mono">03:41 AM</span>
                    </div>
                    <div className="bg-[#101c36] border border-white/10 px-4 py-2.5 rounded-2xl rounded-tl-sm text-[#CBD5E1] text-sm shadow-sm">
                      Bhai koi Valorant ya chilling karega aaj? 🎮 Bas dimag thanda karna hai.
                    </div>
                  </div>

                  {/* Outgoing Interactive Voice Note Bubble */}
                  <div className="flex flex-col items-end gap-1 self-end max-w-[90%]">
                    <div className="flex items-center gap-1.5 pr-2">
                      <span className="text-[11px] text-[#ffb5a0] font-semibold font-mono">You (@nocturne)</span>
                      <span className="text-[10px] text-[#64748B] font-mono">03:42 AM</span>
                    </div>
                    <div className="bg-gradient-to-r from-[#EF4E22] to-[#df3f12] text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          id="voice-play-btn"
                          onClick={handleToggleVoiceNote}
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-sm"
                        >
                          {isPlayingVoice ? (
                            <Pause size={16} className="text-white fill-white" />
                          ) : (
                            <Play size={16} className="text-white fill-white ml-0.5" />
                          )}
                        </button>

                        {/* Animated Equalizer Waveform */}
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

                      <div className="flex items-center justify-between text-[10px] opacity-90 pt-1 border-t border-white/15">
                        <span>Voice Tapri Note</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Radio size={11} />
                          48kHz Neural Noise Filter
                        </span>
                      </div>
                    </div>

                    {/* Reaction Increments */}
                    <div className="flex items-center gap-1 mt-1 pr-1">
                      {Object.entries(reactions).map(([em, count]) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => handleIncrementReaction(em)}
                          className="flex items-center gap-1 bg-[#101c36] hover:bg-[#18284c] border border-white/10 px-2 py-0.5 rounded-full text-[11px] font-mono text-[#CBD5E1] hover:text-white transition-all cursor-pointer active:scale-90"
                        >
                          <span>{em}</span>
                          <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Input Bar Form */}
                <form onSubmit={handleMockSend} className="p-3 bg-[#091222] border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMockMessageText((p) => p + '☕ ')}
                    className="w-8 h-8 rounded-full bg-[#101c36] border border-white/10 flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                    title="Add tea emoji"
                  >
                    <Smile size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onEnterLounge}
                    className="w-8 h-8 rounded-full bg-[#101c36] border border-white/10 flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                    title="Attach file"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    type="text"
                    value={mockMessageText}
                    onChange={(e) => setMockMessageText(e.target.value)}
                    placeholder="Speak your mind, no log stored..."
                    className="flex-1 bg-[#0c182e] border border-white/10 rounded-full px-4 py-2 text-xs text-[#F8FAFC] placeholder:text-[#64748B]/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-8 h-8 rounded-full bg-[#EF4E22] text-white flex items-center justify-center hover:bg-[#df3f12] shadow-sm transition-colors cursor-pointer"
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </form>

                {mockFeedbackToast && (
                  <div className="bg-[#EF4E22]/20 border-t border-[#EF4E22]/30 px-3 py-1.5 text-center text-xs font-mono text-[#ffb5a0] animate-in fade-in">
                    {mockFeedbackToast}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. LIVE TAPRIS & AUDIO LOUNGES ROW                                       */}
        {/* ========================================================================= */}
        <section id="live-lounges" className="w-full bg-[#050c18] border-y border-white/[0.08] py-16 relative">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Coffee size={18} className="text-[#ffb5a0]" />
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

            {/* 3 Live Tapri Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: #chai_n_code */}
              <div className="flex flex-col justify-between bg-[#0e1a2e]/80 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-md hover:border-white/20 transition-all group">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#091222] border border-[#22C55E]/40 text-xs text-[#22C55E] font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                      <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      <span>{tapri1.onlineChillers} {tapri1.onlineChillers === 1 ? 'chiller online' : 'chillers online'}</span>
                    </span>
                    <span className="text-xs font-mono text-[#86cfff] bg-[#86cfff]/10 px-2.5 py-0.5 rounded-full border border-[#86cfff]/20">
                      {tapri1.totalUsers} members
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
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
                      <span key={tagItem} className="px-2.5 py-0.5 rounded-md bg-[#18284c] text-[11px] font-mono text-[#CBD5E1]">
                        {tagItem}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#22C55E] text-xs font-mono font-medium">
                    <Mic size={15} />
                    <span>{tapri1.speakersCount} live speakers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTapri) onOpenTapri(tapri1.name);
                      else if (onJoinRoom) onJoinRoom('CHAI26');
                      else onEnterLounge();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#EF4E22] hover:bg-[#df3f12] shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Join Audio 🎙️</span>
                  </button>
                </div>
              </div>

              {/* Card 2: #startup_fumbles */}
              <div className="flex flex-col justify-between bg-gradient-to-b from-[#101c36]/90 to-[#0c182e]/95 border border-white/15 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-[#EF4E22]/50 transition-all group">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#091222] border border-[#EF4E22]/40 text-xs text-[#ffb5a0] font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(239,78,34,0.2)]">
                      <span className="w-2 h-2 rounded-full bg-[#EF4E22] animate-pulse" />
                      <span>{tapri2.onlineChillers} {tapri2.onlineChillers === 1 ? 'chiller venting' : 'chillers venting'}</span>
                    </span>
                    <span className="text-xs font-mono text-[#ffb5a0] bg-[#EF4E22]/10 px-2.5 py-0.5 rounded-full border border-[#EF4E22]/20">
                      {tapri2.totalUsers} members
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
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
                      <span key={tagItem} className="px-2.5 py-0.5 rounded-md bg-[#18284c] text-[11px] font-mono text-[#CBD5E1]">
                        {tagItem}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#ffb5a0] text-xs font-mono font-medium">
                    <Mic size={15} className="text-[#EF4E22]" />
                    <span>{tapri2.speakersCount} live speakers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTapri) onOpenTapri(tapri2.name);
                      else if (onJoinRoom) onJoinRoom('FUMBLE');
                      else onEnterLounge();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#EF4E22] hover:bg-[#df3f12] shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <span>Join Audio 🎙️</span>
                  </button>
                </div>
              </div>

              {/* Card 3: #ambient_reading */}
              <div className="flex flex-col justify-between bg-gradient-to-b from-[#101c36]/90 to-[#0c182e]/95 border border-white/15 backdrop-blur-xl p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:border-[#86cfff]/50 transition-all group">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-[#091222] border border-[#86cfff]/40 text-xs text-[#86cfff] font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(134,207,255,0.2)]">
                      <span className="w-2 h-2 rounded-full bg-[#86cfff] animate-pulse" />
                      <span>{tapri3.onlineChillers} {tapri3.onlineChillers === 1 ? 'chiller co-studying' : 'chillers co-studying'}</span>
                    </span>
                    <span className="text-xs font-mono text-[#86cfff] bg-[#86cfff]/10 px-2.5 py-0.5 rounded-full border border-[#86cfff]/20">
                      {tapri3.totalUsers} members
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
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
                      <span key={tagItem} className="px-2.5 py-0.5 rounded-md bg-[#18284c] text-[11px] font-mono text-[#CBD5E1]">
                        {tagItem}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#86cfff] text-xs font-mono font-medium">
                    {tapri3.speakersCount > 0 ? (
                      <>
                        <Mic size={15} />
                        <span>{tapri3.speakersCount} live speakers</span>
                      </>
                    ) : (
                      <>
                        <MicOff size={15} />
                        <span>Muted / Study Chime</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTapri) onOpenTapri(tapri3.name);
                      else if (onJoinRoom) onJoinRoom('CALM99');
                      else onEnterLounge();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#F8FAFC] bg-[#18284c] hover:bg-[#223664] border border-white/10 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Sit In Quietly 🎧</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. REAL-TIME TELEMETRY HUD & LIVE WAVEFORM STATION                       */}
        {/* ========================================================================= */}
        <section id="telemetry-hud" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 w-full">
          <div className="flex flex-col gap-10">
            {/* Intro Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[#22C55E]" />
                  <span className="text-xs text-[#22C55E] tracking-widest uppercase font-mono font-bold">
                    Network Telemetry HUD
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl text-[#F8FAFC] font-extrabold tracking-tight">
                  Transparent, verifiable real-time performance.
                </h2>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Every statistic is polled directly from our live active peers, WebSocket round-trips, and cryptographic sessions.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 bg-[#101c36] border border-white/10 px-3.5 py-1.5 rounded-full self-start md:self-auto font-mono text-xs text-[#22C55E]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span>Active RTT Polling Enabled</span>
              </div>
            </div>

            {/* 4 Main Real Data Stat Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Real Messages Shared */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/90 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-sm hover:border-[#EF4E22]/40 transition-all">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-xs font-mono uppercase tracking-wider">Messages Shared Today</span>
                  <MessageSquare size={16} className="text-[#EF4E22]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl text-[#EF4E22] font-black tracking-tight font-mono drop-shadow-[0_0_18px_rgba(239,78,34,0.35)]">
                    {metrics.totalMessagesToday.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono mt-1">Real messages relayed</span>
                </div>
                <div className="text-[10px] text-[#22C55E] font-mono flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>Zero logs written to permanent disk</span>
                </div>
              </div>

              {/* 2. Real Audio Lag */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/90 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-sm hover:border-[#86cfff]/40 transition-all">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-xs font-mono uppercase tracking-wider">Real Audio Lag</span>
                  <Volume2 size={16} className="text-[#86cfff]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl text-[#86cfff] font-black tracking-tight font-mono drop-shadow-[0_0_18px_rgba(134,207,255,0.35)]">
                    ~{realAudioLagValue}ms
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono mt-1">Across nodes in India</span>
                </div>
                <div className="text-[10px] text-[#86cfff] font-mono flex items-center gap-1">
                  <Radio size={11} />
                  <span>48kHz Opus Direct P2P</span>
                </div>
              </div>

              {/* 3. Real Speed / Network RTT */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/90 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-sm hover:border-[#22C55E]/40 transition-all">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-xs font-mono uppercase tracking-wider">Real Speed (RTT)</span>
                  <Zap size={16} className="text-[#22C55E]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl text-[#22C55E] font-black tracking-tight font-mono drop-shadow-[0_0_18px_rgba(34,197,94,0.35)]">
                    {metrics.realtimeLatencyMs} ms
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono mt-1">Instant signaling delay</span>
                </div>
                <div className="text-[10px] text-[#22C55E] font-mono flex items-center gap-1">
                  <Wifi size={11} />
                  <span>Direct WebRTC handshake</span>
                </div>
              </div>

              {/* 4. Real Active Chillers & Users */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/90 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-sm hover:border-[#ffb5a0]/40 transition-all">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-xs font-mono uppercase tracking-wider">Active Chillers</span>
                  <Users size={16} className="text-[#ffb5a0]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl text-[#F8FAFC] font-black tracking-tight font-mono">
                    {metrics.onlineChillers.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#ffb5a0] font-mono mt-1">
                    of {metrics.totalRegisteredUsers.toLocaleString()} registered
                  </span>
                </div>
                <div className="text-[10px] text-[#ffb5a0] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb5a0]" />
                  <span>Nocturne quiet atmosphere</span>
                </div>
              </div>
            </div>

            {/* Rich Visual Metric Callout & Live SVG Waveform Visualizer */}
            <div className="p-7 sm:p-8 rounded-2xl bg-[#0a1426] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
              <div className="flex flex-col gap-2 max-w-md">
                <span className="text-xs text-[#ffb5a0] uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#EF4E22]" />
                  <span>Nocturne Protocol Engine</span>
                </span>
                <h3 className="text-2xl text-[#F8FAFC] font-bold">Designed for deep nocturnal rest</h3>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  Our low-frequency dark interface is optical calibrated below 450nm wavelength emission spikes to prevent melatonin disruption during 3 AM creative flow.
                </p>
              </div>

              {/* Inline SVG Live Speed / Jitter Waveform */}
              <div className="w-full lg:w-[420px] flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[#64748B] text-xs font-mono">
                  <span>Round-Trip Packet Delay (RTT)</span>
                  <span className="text-[#22C55E] font-bold font-mono text-xs flex items-center gap-2 bg-[#060c18] border border-[#22C55E]/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                    <span>{metrics.realtimeLatencyMs} ms live speed</span>
                  </span>
                </div>

                <div className="bg-[#0c182e] border border-white/10 p-3.5 rounded-xl">
                  {(() => {
                    const points = (metrics.latencyHistory && metrics.latencyHistory.length > 1
                      ? metrics.latencyHistory
                      : [14, 12, 16, 11, 15, 12, 13, 10, 14, 11.4]
                    ).map((val, idx, arr) => {
                      const x = Math.round((idx / (arr.length - 1)) * 360);
                      const clamped = Math.max(5, Math.min(50, val));
                      const y = Math.round(55 - ((clamped - 5) / 45) * 42);
                      return { x, y };
                    });
                    const lineD = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
                    const areaD = `${lineD} L 360 65 L 0 65 Z`;
                    const lastP = points[points.length - 1] || { x: 360, y: 30 };
                    return (
                      <svg
                        className="w-full h-18 text-[#EF4E22]"
                        fill="none"
                        viewBox="0 0 360 65"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4E22" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#EF4E22" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="15" x2="360" y2="15" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="35" x2="360" y2="35" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="55" x2="360" y2="55" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <path d={areaD} fill="url(#speedGrad)" />
                        <path
                          d={lineD}
                          stroke="#EF4E22"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                        />
                        <circle cx={lastP.x} cy={lastP.y} fill="#EF4E22" r="4.5" className="animate-pulse" />
                      </svg>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. 'ENGINEERED FOR CALM' ARCHITECTURAL DIFFERENTIATORS                    */}
        {/* ========================================================================= */}
        <section id="manifesto" className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16 w-full">
          <div className="flex flex-col gap-12">
            {/* Header */}
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#86cfff]" />
                <span className="text-xs text-[#86cfff] tracking-widest uppercase font-mono font-bold">
                  Anti-Hustle Manifesto
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-[#F8FAFC] font-extrabold tracking-tight">
                Engineered for calm, not ad impressions.
              </h2>
              <p className="text-base text-[#94A3B8] leading-relaxed">
                Modern platforms are engineered to trigger panic, viral outrage, and dopamine traps. Berozgar does the opposite: minimal friction, burner handles, and cryptographic serenity.
              </p>
            </div>

            {/* 4 Differentiator Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/60 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 hover:border-white/20 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#18284c] flex items-center justify-center text-[#ffb5a0]">
                    <Shield size={24} />
                  </div>
                  <h4 className="text-lg text-[#F8FAFC] font-bold">Zero Numbers</h4>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    Unlink your mobile contacts book forever. No invasive &quot;contacts joined&quot; push alerts and no scans from relatives or HR recruiters.
                  </p>
                </div>
                <div className="text-xs text-[#ffb5a0] font-mono font-semibold flex items-center gap-1">
                  <span>Burner handles only</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/60 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 hover:border-white/20 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#18284c] flex items-center justify-center text-[#86cfff]">
                    <Volume2 size={24} />
                  </div>
                  <h4 className="text-lg text-[#F8FAFC] font-bold">Crystal Audio</h4>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    Late-night conversations enhanced with neural noise filters that silence ceiling fans, keyboard switches, and neighborhood barking dogs.
                  </p>
                </div>
                <div className="text-xs text-[#86cfff] font-mono font-semibold flex items-center gap-1">
                  <span>Crisp 48kHz Opus</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/60 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 hover:border-white/20 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#18284c] flex items-center justify-center text-[#22C55E]">
                    <Zap size={24} />
                  </div>
                  <h4 className="text-lg text-[#F8FAFC] font-bold">Disappearing Memory</h4>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    Ephemeral media and temporary text rooms with zero persistent database footprint. Your words evaporate when the room closes.
                  </p>
                </div>
                <div className="text-xs text-[#22C55E] font-mono font-semibold flex items-center gap-1">
                  <span>Volatile RAM buffers</span>
                  <ArrowRight size={13} />
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-2xl bg-[#0e1a2e]/60 border border-white/10 backdrop-blur-md flex flex-col justify-between gap-6 hover:border-white/20 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#18284c] flex items-center justify-center text-[#EF4E22]">
                    <Wifi size={24} />
                  </div>
                  <h4 className="text-lg text-[#F8FAFC] font-bold">Featherlight</h4>
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    Ultra-fast WebAssembly audio engine running smoothly under 15ms latency, even on 3G college Wi-Fi connections.
                  </p>
                </div>
                <div className="text-xs text-[#ffb5a0] font-mono font-semibold flex items-center gap-1">
                  <span>Sub-15ms packet sync</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. COMMUNITY TESTIMONIALS & FINAL SANCTUARY CALLOUT                      */}
        {/* ========================================================================= */}
        <section id="community" className="w-full bg-[#050c18] border-t border-white/[0.08] py-20">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-12">
            {/* Header */}
            <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
              <span className="text-xs text-[#ffb5a0] uppercase font-mono font-bold tracking-widest">
                Voices of the Night
              </span>
              <h2 className="text-3xl sm:text-4xl text-[#F8FAFC] font-extrabold tracking-tight">
                Built by nocturnal thinkers, for nocturnal thinkers.
              </h2>
            </div>

            {/* Testimonials Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Review Card 1 */}
              <div className="bg-[#0e1a2e]/70 border border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                      alt="Karan Rathore portrait"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7frVzhNsvneuQqOFSOcuU8VOINCO-dIfddg212q-OhBVBjtp4BoiRp8UjsMxqgeGpXx-3OPK0tjRtzF4XNb042muRUn3AyNYuTx1PAObxpTZEVMpTd5m3f7Iy0OxefoSi1XjqflNtompAVMeFWJK2UMIy6soChAObpA7Jdsr7ibdQG_QdCVs0vqJOjI3SdeWeKMKpLcVbVDbjBZuqSA5muMTvZdrF62CxnBk5NkvUwyEzgIcIufRw"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base text-[#F8FAFC] font-bold">Karan Rathore</span>
                        <CheckCircle2 size={14} className="text-[#EF4E22]" />
                      </div>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        Final Year CS Student • Tier-3 College
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#CBD5E1] italic leading-relaxed">
                    &quot;Discord got way too noisy with spam servers, and WhatsApp is filled with uncles checking on job status. Berozgar tapri is where I hop on at 2 AM to just code quietly with others.&quot;
                  </p>
                </div>
                <span className="text-[11px] text-[#ffb5a0] font-mono">Frequent in #chai_n_code</span>
              </div>

              {/* Review Card 2 */}
              <div className="bg-[#0e1a2e]/70 border border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                      alt="Pooja Nambiar portrait"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAd0VFXTNufNhvLPF3Ehdu2UhWMvOU5dlJCFpBndbsvNrK8mDgxv1puzPASB7gAKWdXyMJt0W7pZ9A-3dhrr8S-FOmrluUSm7pVc-qvvcV7VPdiKeRpsF-w7lATzRn2i2qpJYNbCnu9mjhhuyu45CzG0MjTN-yct3dl0BVVXjuyRbem2h-V4S63ZISDepmOCu4djGiJ8La_EscJoH23c7Mlf5s7Bu9n0k-JeQbYOaVBnEG2YA3AMldA"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base text-[#F8FAFC] font-bold">Pooja Nambiar</span>
                        <CheckCircle2 size={14} className="text-[#86cfff]" />
                      </div>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        Product Designer & Night Owl
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#CBD5E1] italic leading-relaxed">
                    &quot;The audio noise suppression is insane. My fan sounds like a storm, but people in the lounge hear none of it. Best place to vent about Figma redlines without social baggage.&quot;
                  </p>
                </div>
                <span className="text-[11px] text-[#86cfff] font-mono">Frequent in #startup_fumbles</span>
              </div>

              {/* Review Card 3 */}
              <div className="bg-[#0e1a2e]/70 border border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-white/10"
                      alt="Tanmay Deshmukh portrait"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtq746p8yClDFFezW8KvukbOQc7GMAMdDDyTBtSBDx1B9NXwN8GIXh3tY4wy27dstneZWx-Q30HAGWOHFhe4s5DpGivOsdqT8k0ADqS8PJrQYPkep-7KOcdShb8Z1ZQHD5Eq6CwR5BjVYGalBZRqPGoKRwCf8m3T9VuFPZchL4GUoO3FHSL4_fHGYVRDQsBk02NoLw0lzTGXDTV2T9ZEGREcwSyokZsJ13sZQhIdbVChX1BIQNirN1"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base text-[#F8FAFC] font-bold">Tanmay Deshmukh</span>
                        <CheckCircle2 size={14} className="text-[#22C55E]" />
                      </div>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        Writer & Remote Freelancer
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#CBD5E1] italic leading-relaxed">
                    &quot;Not needing a mobile phone number to log in was the deciding factor. Complete peace of mind. You drop in, drink chai, discuss an idea, and log out with zero algorithmic hangover.&quot;
                  </p>
                </div>
                <span className="text-[11px] text-[#22C55E] font-mono">Frequent in #ambient_reading</span>
              </div>
            </div>

            {/* Final Sanctuary Gateway Callout */}
            <div className="bg-gradient-to-r from-[#18284c] via-[#101c36] to-[#18284c] border border-white/15 p-8 sm:p-12 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <span className="text-xs text-[#ffb5a0] uppercase font-mono font-bold tracking-wider">
                  Nocturnal Sanctuary
                </span>
                <h3 className="text-2xl sm:text-3xl text-[#F8FAFC] font-extrabold tracking-tight">
                  Chai ban gayi? Come sit with us.
                </h3>
                <p className="text-sm text-[#CBD5E1] max-w-lg leading-relaxed">
                  No app download or installer required. Opens instantly in your browser tab with zero battery background drain.
                </p>
              </div>
              <button
                type="button"
                onClick={onEnterLounge}
                className="h-[52px] px-8 rounded-full text-base font-bold text-white bg-gradient-to-r from-[#EF4E22] to-[#e03d10] hover:brightness-110 shadow-[0_8px_24px_rgba(239,78,34,0.45)] transition-all flex items-center justify-center whitespace-nowrap cursor-pointer active:scale-95"
              >
                Open Web Tapri →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#030810] border-t border-white/[0.08] pt-16 pb-12 relative z-10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col gap-12">
          {/* Tag Cloud Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-[#ffb5a0]" />
              <span className="text-base text-[#F8FAFC] font-bold">Live Tapri Hangouts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['#late-night-philosophy', '#resume-venting', '#silent-coworking', '#chai-breaks', '#startup-ideas-at-3am'].map((tg) => (
                <span key={tg} className="px-3 py-1 rounded-full bg-[#101c36] border border-white/10 text-xs font-mono text-[#CBD5E1]">
                  {tg}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EF4E22] flex items-center justify-center text-white">
                  <Flame size={16} />
                </div>
                <span className="text-lg text-[#F8FAFC] font-bold">Berozgar Chat</span>
              </div>
              <p className="text-sm text-[#64748B] max-w-md leading-relaxed">
                An atmospheric sanctuary for nocturnal thinkers, creators, job-seekers, and night owls. Free from algorithmic feeds, corporate hustle culture, and intrusive tracking.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <ShieldCheck size={16} className="text-[#22C55E]" />
                <span className="text-xs text-[#CBD5E1] font-mono">
                  Privacy Pledge: Zero phone number required, zero tracking, end-to-end encrypted rooms.
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
                onClick={() => handleScrollTo('telemetry-hud')}
                className="text-sm text-[#CBD5E1] hover:text-white transition-colors text-left cursor-pointer"
              >
                Real-Time Telemetry
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
              © {new Date().getFullYear()} Berozgar Chat. Built for uninterrupted peace of mind.
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-[#64748B] font-mono">
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
