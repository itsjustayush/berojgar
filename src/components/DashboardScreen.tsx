import { useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent, KeyboardEvent } from 'react';
import { ArrowRight, Check, ClipboardPaste, KeyRound, LockKeyhole, Plus, Radio, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { ViewMode, UserSession } from '../types';

interface DashboardScreenProps {
  session: UserSession;
  onCreateRoom: () => void;
  onJoinRoom: (otpCode: string) => Promise<void>;
  joinError?: string | null;
  setView: (view: ViewMode) => void;
  onUpdateNickname?: (newName: string) => void;
}

const guarantees = [
  'No account or contact list required',
  'Room expires when the last peer leaves',
  'Files remain in local memory until wiped',
];

export function DashboardScreen({ session, onCreateRoom, onJoinRoom, joinError, onUpdateNickname }: DashboardScreenProps) {
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [editingNick, setEditingNick] = useState(false);
  const [nickVal, setNickVal] = useState(session.identifier);
  const [isJoining, setIsJoining] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleOtpChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const incoming = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const next = [...otpValues];
    if (incoming.length > 1) {
      incoming.slice(0, 6).split('').forEach((char, offset) => { next[offset] = char; });
      setOtpValues(next);
      inputRefs.current[Math.min(incoming.length, 5)]?.focus();
      return;
    }
    next[index] = incoming;
    setOtpValues(next);
    if (incoming && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpValues[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleJoin = async () => {
    const code = otpValues.join('');
    if (code.length !== 6 || isJoining) return;
    setIsJoining(true);
    try {
      await onJoinRoom(code);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSaveNick = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = nickVal.trim().replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 18);
    if (cleanName && onUpdateNickname) onUpdateNickname(cleanName);
    setEditingNick(false);
  };

  return (
    <div className="page-reveal mx-auto w-full max-w-[1440px] px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-16 text-on-surface">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[.2em] text-primary">
            <Sparkles size={13} /> Private realtime rooms
          </div>
          <h1 className="text-[clamp(3.25rem,8vw,7.8rem)] font-semibold leading-[.88] tracking-[-.085em] text-on-surface">
            Move work<br />
            <em className="font-display font-normal not-italic text-on-surface-variant/60">without a trace.</em>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-on-surface-variant sm:text-lg">
            Berojgar Vault gives teams a temporary place to talk and move files together. No profile graph, no archive, no friction between a room and the people in it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[.16em] text-on-surface-variant">
            <span className="inline-flex items-center gap-2"><Radio size={14} className="text-primary" /> Live transport</span>
            <span className="inline-flex items-center gap-2"><LockKeyhole size={14} className="text-primary" /> Memory-first</span>
            <span className="inline-flex items-center gap-2"><Users size={14} className="text-primary" /> Guest access</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-low border border-outline-variant/30 p-5 sm:p-7 shadow-xs">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between border-b border-outline-variant/30 pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-on-surface-variant">Your session identity</p>
              <p className="mt-2 text-xl font-medium tracking-[-.04em] text-on-surface">{session.identifier}</p>
            </div>
            <button
              onClick={() => { setNickVal(session.identifier); setEditingNick((editing) => !editing); }}
              className="rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
            >
              {editingNick ? 'Close' : 'Edit'}
            </button>
          </div>
          {editingNick && (
            <form onSubmit={handleSaveNick} className="relative mt-4 flex gap-2">
              <label htmlFor="dashboard-nickname" className="sr-only">Guest nickname</label>
              <input
                id="dashboard-nickname"
                value={nickVal}
                onChange={(event) => setNickVal(event.target.value)}
                maxLength={18}
                className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors cursor-pointer"
                aria-label="Save nickname"
              >
                <Check size={17} />
              </button>
            </form>
          )}
          <div className="relative mt-5 grid grid-cols-3 gap-2 text-center font-mono text-[9px] uppercase tracking-[.12em] text-on-surface-variant">
            <div className="rounded-xl bg-surface-container px-2 py-3 border border-outline-variant/20"><span className="block text-on-surface font-semibold">RAM</span>storage</div>
            <div className="rounded-xl bg-surface-container px-2 py-3 border border-outline-variant/20"><span className="block text-on-surface font-semibold">P2P</span>preferred</div>
            <div className="rounded-xl bg-surface-container px-2 py-3 border border-outline-variant/20"><span className="block text-on-surface font-semibold">0</span>accounts</div>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 lg:grid-cols-2 lg:gap-5">
        <article className="stagger-reveal group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[2rem] border border-primary/30 bg-primary p-6 text-on-primary shadow-lg sm:p-8" style={{ '--delay': '120ms' } as CSSProperties}>
          <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full border-[32px] border-white/10 transition-transform duration-500 group-hover:scale-110 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[.18em] opacity-80">
              <span>01 / Create</span>
              <Plus size={18} />
            </div>
            <h2 className="mt-12 max-w-sm text-4xl font-semibold leading-[.92] tracking-[-.07em] sm:text-5xl">
              Start a room<br />
              <em className="font-display font-normal not-italic opacity-90">in seconds.</em>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 opacity-85">
              Generate a short-lived room and bring people in with a code or link. The host controls the room’s first connection.
            </p>
          </div>
          <button
            onClick={onCreateRoom}
            className="relative mt-8 inline-flex w-full items-center justify-between rounded-full bg-surface text-on-surface px-5 py-4 text-sm font-semibold transition-transform duration-200 hover:scale-[1.015] active:scale-[.98] shadow-sm cursor-pointer"
          >
            <span>Create private room</span>
            <ArrowRight size={18} />
          </button>
        </article>

        <article className="stagger-reveal group flex min-h-[360px] flex-col justify-between rounded-[2rem] bg-surface-container-low border border-outline-variant/30 p-6 sm:p-8 shadow-xs" style={{ '--delay': '200ms' } as CSSProperties}>
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[.18em] text-on-surface-variant">
              <span>02 / Join</span>
              <KeyRound size={18} className="text-primary" />
            </div>
            <h2 className="mt-12 max-w-sm text-4xl font-semibold leading-[.92] tracking-[-.07em] text-on-surface sm:text-5xl">
              Enter the<br />
              <em className="font-display font-normal not-italic text-on-surface-variant/60">room code.</em>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-on-surface-variant">
              Use the six-character code from your host. The code is only an invitation, not a password or a permanent identity.
            </p>
          </div>
          <div className="mt-8">
            <div className="flex gap-2 sm:gap-3" role="group" aria-label="Six-character room code">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(element) => { inputRefs.current[index] = element; }}
                  value={value}
                  onChange={(event) => handleOtpChange(index, event)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  aria-label={`Room code character ${index + 1}`}
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={1}
                  className="h-14 min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container text-center font-mono text-xl text-on-surface outline-none transition-all focus:border-primary focus:bg-primary/10"
                />
              ))}
            </div>
            <button
              onClick={handleJoin}
              disabled={otpValues.join('').length !== 6 || isJoining}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-sm font-semibold text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <ClipboardPaste size={16} />
              <span>{isJoining ? 'Checking active room…' : 'Enter room'}</span>
              {!isJoining && <ArrowRight size={16} />}
            </button>
            {joinError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[.08em] text-red-600 dark:text-red-400">
                {joinError}
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-3 border-t border-outline-variant/30 pt-7 sm:grid-cols-3">
        {guarantees.map((guarantee, index) => (
          <div
            key={guarantee}
            className="stagger-reveal flex items-start gap-3 text-sm text-on-surface-variant"
            style={{ '--delay': `${280 + index * 70}ms` } as CSSProperties}
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/30 text-primary">
              <Check size={11} />
            </span>
            {guarantee}
          </div>
        ))}
      </section>

      <div className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-on-surface-variant/70">
        <ShieldCheck size={14} className="text-primary" /> We do not retain room content. Signaling remains transient while peers are online.
      </div>
    </div>
  );
}
