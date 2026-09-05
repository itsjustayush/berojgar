import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Settings,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Wifi,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { UserProfile, CallSession } from '../types';
import {
  getAvailableMediaDevices,
  getOptimizedMediaStream,
  setAudioOutputDevice,
  AudioMeterNode,
  estimatePreCallNetwork,
  DeviceInfo,
  NetworkQualityStats,
} from '../lib/webrtcMedia';
import { soundEffects } from '../lib/callSoundEffects';
import { UserAvatar } from './UserAvatar';

export interface GreenRoomReadyConfig {
  stream: MediaStream | null;
  audioDeviceId: string;
  videoDeviceId: string;
  speakerDeviceId: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  callType: 'voice' | 'video';
}

interface GreenRoomModalProps {
  currentUser: UserProfile;
  targetUser: {
    uid: string;
    displayName: string;
    photoURL?: string;
    username?: string;
  };
  initialCallType: 'voice' | 'video';
  isIncoming?: boolean;
  onJoinCall: (config: GreenRoomReadyConfig) => void;
  onCancel: () => void;
}

export const GreenRoomModal: React.FC<GreenRoomModalProps> = ({
  currentUser,
  targetUser,
  initialCallType,
  isIncoming = false,
  onJoinCall,
  onCancel,
}) => {
  const [callType, setCallType] = useState<'voice' | 'video'>(initialCallType);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(initialCallType === 'voice');

  // Media Devices
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<DeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [selectedCamId, setSelectedCamId] = useState('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState('');

  // Audio VU Level Meter
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Network Quality Pre-check
  const [networkStats, setNetworkStats] = useState<NetworkQualityStats | null>(null);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true);

  // Permissions & Hardware state
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [isSpeakerTesting, setIsSpeakerTesting] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioMeterRef = useRef<AudioMeterNode | null>(null);

  // Safe Web Audio unlock on mount
  useEffect(() => {
    soundEffects.unlockContext();
  }, []);

  // 1. Initial Device Enumeration & Network Probe
  useEffect(() => {
    let mounted = true;

    async function initGreenRoom() {
      // Estimate network in parallel
      estimatePreCallNetwork().then((stats) => {
        if (mounted) {
          setNetworkStats(stats);
          setIsCheckingNetwork(false);
          // If poor network, gracefully suggest audio-only
          if (stats.quality === 'poor' && callType === 'video') {
            // Suggest degradation
          }
        }
      });

      await refreshDevices();
      await requestAndBindStream();
    }

    initGreenRoom();

    // Listen to physical device additions / removals (headset unplugged etc.)
    const handleDeviceChange = async () => {
      await refreshDevices();
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      mounted = false;
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      stopCurrentStream();
    };
  }, []);

  const refreshDevices = async () => {
    const { microphones: mics, cameras: cams, speakers: spks } = await getAvailableMediaDevices();
    setMicrophones(mics);
    setCameras(cams);
    setSpeakers(spks);

    if (mics.length > 0 && !selectedMicId) setSelectedMicId(mics[0].deviceId);
    if (cams.length > 0 && !selectedCamId) setSelectedCamId(cams[0].deviceId);
    if (spks.length > 0 && !selectedSpeakerId) setSelectedSpeakerId(spks[0].deviceId);
  };

  const stopCurrentStream = () => {
    if (audioMeterRef.current) {
      audioMeterRef.current.destroy();
      audioMeterRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 2. Contextual stream request
  const requestAndBindStream = async (overrideAudioId?: string, overrideCamId?: string) => {
    setIsLoadingStream(true);
    setPermissionError(null);
    stopCurrentStream();

    const needVideo = callType === 'video' && !isVideoOff;
    const { stream, error } = await getOptimizedMediaStream({
      audio: true, // Always request mic in staging
      video: needVideo,
      audioDeviceId: overrideAudioId || selectedMicId,
      videoDeviceId: overrideCamId || selectedCamId,
      videoQuality: 'hd',
    });

    setIsLoadingStream(false);

    if (error || !stream) {
      setPermissionError(error || 'Failed to acquire media stream');
      return;
    }

    streamRef.current = stream;

    // Attach to video preview element
    if (videoPreviewRef.current && needVideo) {
      videoPreviewRef.current.srcObject = stream;
    }

    // Set initial track states
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isAudioMuted;
    }

    // Attach Audio VU Meter
    audioMeterRef.current = new AudioMeterNode(stream, (volume, speaking) => {
      setAudioLevel(volume);
      setIsSpeaking(speaking);
    });
  };

  // Rebind stream when call type changes
  const handleToggleCallType = (type: 'voice' | 'video') => {
    setCallType(type);
    if (type === 'voice') {
      setIsVideoOff(true);
    } else {
      setIsVideoOff(false);
    }
    setTimeout(() => {
      requestAndBindStream();
    }, 50);
  };

  const handleToggleMic = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    soundEffects.playMuteSound(nextMuted);

    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !nextMuted;
      }
    }
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !nextVideoOff;
      } else if (!nextVideoOff) {
        // Need to acquire video track
        requestAndBindStream();
      }
    }
  };

  const handleSwitchMic = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    await requestAndBindStream(deviceId, selectedCamId);
  };

  const handleSwitchCam = async (deviceId: string) => {
    setSelectedCamId(deviceId);
    await requestAndBindStream(selectedMicId, deviceId);
  };

  const handleSwitchSpeaker = async (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    if (audioTestRef.current) {
      await setAudioOutputDevice(audioTestRef.current, deviceId);
    }
  };

  const handleTestSpeaker = () => {
    setIsSpeakerTesting(true);
    soundEffects.playTestChime(selectedSpeakerId);
    setTimeout(() => setIsSpeakerTesting(false), 1200);
  };

  const handleConfirmJoin = () => {
    // Stop local staging meter but keep stream for call modal handover
    if (audioMeterRef.current) {
      audioMeterRef.current.destroy();
      audioMeterRef.current = null;
    }

    soundEffects.playJoinSound();

    onJoinCall({
      stream: streamRef.current,
      audioDeviceId: selectedMicId,
      videoDeviceId: selectedCamId,
      speakerDeviceId: selectedSpeakerId,
      isAudioMuted,
      isVideoOff: callType === 'voice' || isVideoOff,
      callType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <audio ref={audioTestRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-[#0b1326] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#070c1a]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4E22] animate-pulse" />
            <h2
              className="text-base sm:text-lg font-bold text-white tracking-wide"
              style={{ fontFamily: 'Mukta, sans-serif' }}
            >
              The Green Room • Pre-Call Staging
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* Target User Info Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                name={targetUser.displayName}
                photoURL={targetUser.photoURL}
                username={targetUser.username}
                size="md"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {isIncoming ? 'Incoming Call from' : 'Ready to call'}{' '}
                  <span className="text-[#EF4E22]">{targetUser.displayName}</span>
                </span>
                <span className="text-[11px] font-mono text-white/40 block truncate">
                  @{targetUser.username || 'user'} • {callType === 'video' ? 'Video Call' : 'Voice Only'}
                </span>
              </div>
            </div>

            {/* Call Type Switcher Pills */}
            <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleCallType('video')}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  callType === 'video'
                    ? 'bg-[#EF4E22] text-[#FFF9F3] shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Video size={13} />
                <span>Video</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleCallType('voice')}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  callType === 'voice'
                    ? 'bg-[#EF4E22] text-[#FFF9F3] shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Mic size={13} />
                <span>Audio Only</span>
              </button>
            </div>
          </div>

          {/* Video Preview & Stage */}
          <div className="relative w-full aspect-video sm:aspect-16/9 bg-black/60 rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center shadow-inner">
            {callType === 'video' && !isVideoOff && !permissionError ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform ${
                  isMirrored ? '-scale-x-100' : 'scale-x-100'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-3">
                  <UserAvatar
                    name={currentUser.displayName}
                    photoURL={currentUser.photoURL}
                    username={currentUser.username}
                    size="2xl"
                    className="shadow-[0_0_30px_rgba(239,78,34,0.3)]"
                  />
                  {isSpeaking && !isAudioMuted && (
                    <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/80 animate-ping pointer-events-none" />
                  )}
                </div>
                <h4 className="text-white font-bold text-sm font-sans">{currentUser.displayName}</h4>
                <span className="font-mono text-xs text-white/50 mt-0.5">
                  {isVideoOff ? 'Camera is off (Audio only)' : 'Video preview standby'}
                </span>
              </div>
            )}

            {/* Video Controls Overlay Bar */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 z-20">
              <div className="flex items-center gap-2">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAudioMuted
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                  title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isAudioMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} />}
                  <span>{isAudioMuted ? 'Muted' : 'Mic On'}</span>
                </button>

                {/* Video toggle */}
                {callType === 'video' && (
                  <button
                    type="button"
                    onClick={handleToggleVideo}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isVideoOff
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                    title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                  >
                    {isVideoOff ? <VideoOff size={14} className="text-red-400" /> : <Video size={14} />}
                    <span>{isVideoOff ? 'Cam Off' : 'Cam On'}</span>
                  </button>
                )}

                {callType === 'video' && !isVideoOff && (
                  <button
                    type="button"
                    onClick={() => setIsMirrored((m) => !m)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Mirror self-view"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>

              {/* Hardware Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowSettingsDrawer((s) => !s)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-mono text-xs ${
                  showSettingsDrawer
                    ? 'bg-[#EF4E22] text-[#FFF9F3]'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
                title="Audio & Video Settings"
              >
                <Settings size={14} />
                <span className="hidden sm:inline">Devices</span>
              </button>
            </div>
          </div>

          {/* Real-time Microphone Audio VU Meter */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white/80 font-mono">
                <Mic size={14} className={isSpeaking && !isAudioMuted ? 'text-emerald-400 animate-pulse' : 'text-white/50'} />
                <span>Microphone Level:</span>
              </div>
              <span className={`font-mono text-[11px] font-bold ${isAudioMuted ? 'text-red-400' : isSpeaking ? 'text-emerald-400' : 'text-white/40'}`}>
                {isAudioMuted ? 'Muted' : isSpeaking ? 'Speaking Detected' : 'Quiet'}
              </span>
            </div>

            {/* VU Meter Track */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10 flex p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isAudioMuted
                    ? 'w-0 bg-transparent'
                    : audioLevel > 0.65
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-emerald-500 to-[#EF4E22]'
                }`}
                style={{ width: `${isAudioMuted ? 0 : Math.round(audioLevel * 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-white/40">
              Speak into your microphone to verify the audio level indicator responds.
            </p>
          </div>

          {/* Pre-Call Network Quality & Graceful Degradation Warning */}
          {networkStats && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                networkStats.quality === 'poor'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-white/5 border-white/10 text-white/80'
              }`}
            >
              <Wifi
                size={16}
                className={
                  networkStats.quality === 'excellent'
                    ? 'text-emerald-400 shrink-0 mt-0.5'
                    : networkStats.quality === 'good'
                    ? 'text-cyan-400 shrink-0 mt-0.5'
                    : 'text-amber-400 shrink-0 mt-0.5'
                }
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">
                    Network: {networkStats.quality.toUpperCase()} ({networkStats.latencyMs}ms RTT)
                  </span>
                  <span className="font-mono text-[10px] opacity-70">
                    Jitter: {networkStats.jitterMs}ms
                  </span>
                </div>
                {networkStats.recommendation && (
                  <p className="mt-1 font-sans text-xs text-amber-300/90 leading-relaxed">
                    {networkStats.recommendation}
                  </p>
                )}
                {networkStats.quality === 'poor' && callType === 'video' && (
                  <button
                    type="button"
                    onClick={() => handleToggleCallType('voice')}
                    className="mt-2 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Switch to Audio-Only Mode
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Clear Permission Fallback Diagnostics (if denied) */}
          {permissionError && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-red-300 font-bold text-sm">
                <AlertTriangle size={18} className="shrink-0 text-red-400" />
                <span>Camera or Microphone Access Needed</span>
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed font-sans">
                {permissionError}
              </p>
              <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-[11px] font-mono text-white/80 space-y-1">
                <p className="font-bold text-white">How to fix this in your browser:</p>
                <p>1. Click the lock 🔒 or site settings icon in the browser address bar.</p>
                <p>2. Set "Camera" and "Microphone" permissions to "Allow".</p>
                <p>3. Click the Retry Access button below.</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => requestAndBindStream()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Retry Permission
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleCallType('voice');
                    requestAndBindStream();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-all cursor-pointer"
                >
                  Continue Audio-Only
                </button>
              </div>
            </div>
          )}

          {/* Hardware Device Selection Drawer */}
          {showSettingsDrawer && (
            <div className="p-4 rounded-2xl bg-[#091024] border border-white/15 space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Hardware Selection
                </span>
                <button
                  type="button"
                  onClick={refreshDevices}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                >
                  <RefreshCw size={11} /> Refresh
                </button>
              </div>

              {/* Microphone select */}
              <div>
                <label className="block text-[11px] font-mono text-white/70 mb-1">
                  Microphone (Audio Input)
                </label>
                <select
                  value={selectedMicId}
                  onChange={(e) => handleSwitchMic(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#EF4E22] cursor-pointer"
                >
                  {microphones.map((mic) => (
                    <option key={mic.deviceId} value={mic.deviceId} className="bg-[#0b1326] text-white">
                      {mic.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Camera select */}
              {callType === 'video' && (
                <div>
                  <label className="block text-[11px] font-mono text-white/70 mb-1">
                    Camera (Video Input)
                  </label>
                  <select
                    value={selectedCamId}
                    onChange={(e) => handleSwitchCam(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#EF4E22] cursor-pointer"
                  >
                    {cameras.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId} className="bg-[#0b1326] text-white">
                        {cam.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speaker select & test button */}
              <div>
                <label className="block text-[11px] font-mono text-white/70 mb-1">
                  Speaker (Audio Output)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSpeakerId}
                    onChange={(e) => handleSwitchSpeaker(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#EF4E22] cursor-pointer"
                  >
                    {speakers.length > 0 ? (
                      speakers.map((spk) => (
                        <option key={spk.deviceId} value={spk.deviceId} className="bg-[#0b1326] text-white">
                          {spk.label}
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-[#0b1326] text-white">
                        Default System Speaker
                      </option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={handleTestSpeaker}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title="Play test chime"
                  >
                    <Volume2 size={13} className={isSpeakerTesting ? 'text-[#EF4E22] animate-bounce' : ''} />
                    <span>{isSpeakerTesting ? 'Playing...' : 'Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070c1a]/95 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmJoin}
            disabled={isLoadingStream && !streamRef.current}
            className="flex-1 sm:flex-initial px-6 sm:px-8 py-3 rounded-xl bg-[#EF4E22] hover:bg-[#f3643d] text-[#FFF9F3] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,78,34,0.4)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{isIncoming ? 'Join Call with Settings' : 'Start Call Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
