import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stream tracks cleaned up in cleanup
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrorMsg('Microphone access denied or unavailable.');
    }
  };

  useEffect(() => {
    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (timerRef.current) clearInterval(timerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onSendVoice(base64, Math.max(1, recordingTime));
      };
      reader.readAsDataURL(audioBlob);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full bg-[#0e1933] border border-white/10 rounded-2xl px-4 py-2 text-white">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="font-mono text-sm text-red-400 font-bold">REC</span>
        <span className="font-mono text-sm text-white/90">{formatTimer(recordingTime)}</span>

        {/* Pulsing audio bars */}
        <div className="hidden sm:flex items-center gap-1 ml-2">
          {[40, 70, 30, 90, 60, 80, 45, 100, 50, 75].map((height, i) => (
            <div
              key={i}
              className="w-1 bg-[#EF4E22] rounded-full animate-pulse"
              style={{
                height: `${Math.max(6, (height * (1 + (recordingTime % 3) * 0.2)) / 4)}px`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {errorMsg ? (
        <div className="text-xs text-red-400 font-mono">{errorMsg}</div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Cancel voice note"
        >
          <Trash2 size={18} />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EF4E22] text-[#FFF9F3] font-mono text-xs font-bold rounded-xl hover:bg-[#f3643d] transition-all active:scale-95 shadow-lg cursor-pointer"
          title="Send voice note"
        >
          <Send size={14} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
