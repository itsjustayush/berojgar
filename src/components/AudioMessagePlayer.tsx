import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioMessagePlayerProps {
  src: string;
  duration?: number;
  isYou: boolean;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  src,
  duration = 0,
  isYou,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Audio playback error:', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const total = audioDuration || duration || 1;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / total) * 100));

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl select-none ${
      isYou ? 'bg-black/25 text-white' : 'bg-white/10 text-white'
    }`}>
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0 bg-[#EF4E22] text-[#FFF9F3] hover:bg-[#f3643d] shadow-md cursor-pointer"
        title={isPlaying ? 'Pause' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-[120px]">
        {/* Fake animated waveform / scrubber */}
        <div className="relative flex items-center h-5">
          <input
            type="range"
            min={0}
            max={total}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#EF4E22]"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono opacity-70 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 size={10} />
            <span>{formatTime(total)}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-white/15 hover:bg-white/25 text-white/90 shrink-0 transition-colors"
        title="Playback speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
};
