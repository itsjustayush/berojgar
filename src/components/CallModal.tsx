import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Settings,
  Hand,
  Wifi,
  AlertTriangle,
  Users,
  Send,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CallSession, UserProfile } from '../types';
import {
  answerCall,
  addCallIceCandidate,
  endCallSession,
  subscribeToCallSession,
  admitGuestToCall,
  setCallHostMessage,
  toggleCallHandRaise,
  recordIceRestart,
} from '../lib/socialChatService';
import {
  getAvailableMediaDevices,
  getOptimizedMediaStream,
  setAudioOutputDevice,
  AudioMeterNode,
  optimizeSessionDescription,
  VIDEO_PRESETS,
  DeviceInfo,
  NetworkQualityStats,
} from '../lib/webrtcMedia';
import { soundEffects } from '../lib/callSoundEffects';
import { UserAvatar } from './UserAvatar';
import { GreenRoomReadyConfig } from './GreenRoomModal';

interface CallModalProps {
  call: CallSession;
  currentUser: UserProfile;
  preConfig?: GreenRoomReadyConfig | null;
  onClose: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 4,
};

export const CallModal: React.FC<CallModalProps> = ({
  call,
  currentUser,
  preConfig,
  onClose,
}) => {
  const isCaller = call.callerId === currentUser.uid;
  const targetName = isCaller ? call.receiverName : call.callerName;
  const targetPhoto = isCaller ? call.receiverPhoto : call.callerPhoto;

  const [callSession, setCallSession] = useState<CallSession>(call);
  const [callStatus, setCallStatus] = useState<CallSession['status']>(call.status);
  const [isMuted, setIsMuted] = useState(preConfig?.isAudioMuted || false);
  const [isVideoOff, setIsVideoOff] = useState(preConfig?.isVideoOff || call.type === 'voice');
  const [callDuration, setCallDuration] = useState(0);

  // Hardware devices
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<DeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState(preConfig?.audioDeviceId || '');
  const [selectedCamId, setSelectedCamId] = useState(preConfig?.videoDeviceId || '');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(preConfig?.speakerDeviceId || '');
  const [showHardwareMenu, setShowHardwareMenu] = useState(false);

  // Mute & Speech detection
  const [isSpeakingWhileMuted, setIsSpeakingWhileMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Hand raise
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Waiting Room & Host controls
  const [showWaitingPanel, setShowWaitingPanel] = useState(false);
  const [hostCustomMessage, setHostCustomMessage] = useState(call.hostMessage || '');
  const [isBroadcastingMsg, setIsBroadcastingMsg] = useState(false);

  // Network & Bandwidth adaptivity
  const [networkStats, setNetworkStats] = useState<NetworkQualityStats>({
    latencyMs: 50,
    quality: 'excellent',
    packetLossPercent: 0,
    jitterMs: 12,
    bitrateKbps: 1200,
  });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isDegradedToAudio, setIsDegradedToAudio] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(preConfig?.stream || null);
  const durationTimerRef = useRef<number | null>(null);
  const statsTimerRef = useRef<number | null>(null);
  const audioMeterRef = useRef<AudioMeterNode | null>(null);

  // Load hardware devices
  useEffect(() => {
    getAvailableMediaDevices().then(({ microphones: m, cameras: c, speakers: s }) => {
      setMicrophones(m);
      setCameras(c);
      setSpeakers(s);
      if (m.length > 0 && !selectedMicId) setSelectedMicId(m[0].deviceId);
      if (c.length > 0 && !selectedCamId) setSelectedCamId(c[0].deviceId);
      if (s.length > 0 && !selectedSpeakerId) setSelectedSpeakerId(s[0].deviceId);
    });
  }, []);

  // Ringtone management on mount
  useEffect(() => {
    if (call.status === 'ringing') {
      soundEffects.startRingtone();
    }
    return () => {
      soundEffects.stopRingtone();
    };
  }, []);

  // Initialize WebRTC & Media Stream
  useEffect(() => {
    let active = true;

    async function setupWebRTC() {
      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Acquire or use preConfig stream
        let stream = localStreamRef.current;
        if (!stream) {
          const res = await getOptimizedMediaStream({
            audio: true,
            video: call.type === 'video' && !isVideoOff,
            audioDeviceId: selectedMicId,
            videoDeviceId: selectedCamId,
          });
          stream = res.stream;
          localStreamRef.current = stream;
        }

        if (stream) {
          // Bind video element
          if (localVideoRef.current && call.type === 'video') {
            localVideoRef.current.srcObject = stream;
          }

          // Initial track states
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) audioTrack.enabled = !isMuted;
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) videoTrack.enabled = !isVideoOff;

          // Add tracks to PeerConnection
          stream.getTracks().forEach((track) => pc.addTrack(track, stream!));

          // Attach Audio Level Meter for speaking-while-muted detection
          audioMeterRef.current = new AudioMeterNode(stream, (volume, speaking) => {
            setAudioLevel(volume);
            if (isMuted && speaking) {
              setIsSpeakingWhileMuted(true);
            } else {
              setIsSpeakingWhileMuted(false);
            }
          });
        }

        // On Remote Track
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            if (selectedSpeakerId) {
              setAudioOutputDevice(remoteVideoRef.current, selectedSpeakerId);
            }
          }
        };

        // ICE Candidate dispatch
        pc.onicecandidate = (event) => {
          if (event.candidate && active) {
            addCallIceCandidate(
              call.id,
              isCaller ? 'caller' : 'receiver',
              event.candidate.toJSON()
            );
          }
        };

        // Silent Reconnection & Connection State Monitoring
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          if (state === 'disconnected' || state === 'failed') {
            triggerSilentReconnection();
          } else if (state === 'connected' || state === 'completed') {
            setIsReconnecting(false);
            setReconnectAttempt(0);
          }
        };

        // If caller and ringing/accepted, generate offer with optimized SDP
        if (isCaller) {
          const offer = await pc.createOffer();
          const optimizedSdp = optimizeSessionDescription(offer.sdp || '');
          const finalOffer: RTCSessionDescriptionInit = {
            type: offer.type,
            sdp: optimizedSdp,
          };
          await pc.setLocalDescription(finalOffer);
        } else if (call.offer) {
          // If receiver, handle initial offer
          await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
        }
      } catch (err) {
        console.warn('WebRTC initialization notice:', err);
      }
    }

    setupWebRTC();

    // Subscribe to Firestore call session updates
    const unsub = subscribeToCallSession(call.id, async (updatedCall) => {
      if (!updatedCall || updatedCall.status === 'ended' || updatedCall.status === 'declined') {
        soundEffects.stopRingtone();
        soundEffects.playLeaveSound();
        cleanup();
        onClose();
        return;
      }

      setCallSession(updatedCall);
      setCallStatus(updatedCall.status);

      // Stop ringtone when accepted
      if (updatedCall.status === 'accepted') {
        soundEffects.stopRingtone();
        if (!durationTimerRef.current) {
          soundEffects.playJoinSound();
          durationTimerRef.current = window.setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      }

      // Check remote hand raise state
      const otherUid = isCaller ? updatedCall.receiverId : updatedCall.callerId;
      if (updatedCall.handRaised?.[otherUid] && !callSession.handRaised?.[otherUid]) {
        soundEffects.playHandRaiseSound();
      }

      // Handle Answer on caller side
      if (isCaller && updatedCall.answer && pcRef.current && !pcRef.current.currentRemoteDescription) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(updatedCall.answer));
        } catch (e) {
          console.warn('Set remote answer notice:', e);
        }
      }

      // Handle ICE Candidates
      if (pcRef.current && pcRef.current.remoteDescription) {
        const candidates = isCaller
          ? updatedCall.receiverCandidates
          : updatedCall.callerCandidates;

        if (candidates && candidates.length > 0) {
          candidates.forEach((cand) => {
            try {
              pcRef.current?.addIceCandidate(new RTCIceCandidate(cand));
            } catch {}
          });
        }
      }
    });

    // Start Bandwidth Adaptivity & WebRTC Stats loop
    startStatsMonitoring();

    return () => {
      active = false;
      unsub();
      cleanup();
    };
  }, [call.id]);

  // Periodic WebRTC stats monitor for bandwidth adaptivity & quality degradation
  const startStatsMonitoring = () => {
    if (statsTimerRef.current) clearInterval(statsTimerRef.current);

    statsTimerRef.current = window.setInterval(async () => {
      if (!pcRef.current || pcRef.current.connectionState !== 'connected') return;

      try {
        const stats = await pcRef.current.getStats();
        let totalPacketsLost = 0;
        let totalPacketsReceived = 0;
        let rtt = 45;
        let jitter = 10;
        let bitrate = 950;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            totalPacketsLost = report.packetsLost || 0;
            totalPacketsReceived = report.packetsReceived || 0;
            jitter = Math.round((report.jitter || 0.01) * 1000);
          } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = Math.round((report.currentRoundTripTime || 0.045) * 1000);
          }
        });

        const packetLossPercent =
          totalPacketsReceived > 0
            ? Math.min(15, Math.round((totalPacketsLost / (totalPacketsLost + totalPacketsReceived)) * 100))
            : 0;

        let quality: NetworkQualityStats['quality'] = 'excellent';
        if (packetLossPercent > 5 || rtt > 350) {
          quality = 'poor';
        } else if (packetLossPercent > 2 || rtt > 200) {
          quality = 'fair';
        } else if (rtt > 100) {
          quality = 'good';
        }

        setNetworkStats({
          latencyMs: rtt,
          quality,
          packetLossPercent,
          jitterMs: jitter,
          bitrateKbps: bitrate,
        });

        // Graceful degradation: If network conditions drop into 'poor' with severe packet loss
        if (quality === 'poor' && call.type === 'video' && !isVideoOff && !isDegradedToAudio) {
          // Adaptively lower video constraints to lowBandwidth preset
          if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.applyConstraints(VIDEO_PRESETS.lowBandwidth).catch(() => {});
            }
          }
        }
      } catch {}
    }, 2500);
  };

  // Silent Reconnection Engine
  const triggerSilentReconnection = async () => {
    if (!pcRef.current || isReconnecting) return;

    setIsReconnecting(true);
    const nextAttempt = reconnectAttempt + 1;
    setReconnectAttempt(nextAttempt);
    recordIceRestart(call.id, nextAttempt);

    try {
      if (typeof pcRef.current.restartIce === 'function') {
        pcRef.current.restartIce();
        if (isCaller) {
          const offer = await pcRef.current.createOffer({ iceRestart: true });
          await pcRef.current.setLocalDescription(offer);
        }
      }
    } catch (err) {
      console.warn('Silent ICE restart notice:', err);
    }

    // Safety timeout to reset state if recovered
    setTimeout(() => {
      if (pcRef.current?.iceConnectionState === 'connected') {
        setIsReconnecting(false);
      }
    }, 8000);
  };

  const cleanup = () => {
    soundEffects.stopRingtone();
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    if (audioMeterRef.current) {
      audioMeterRef.current.destroy();
      audioMeterRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  // Mute / Unmute with audio cue
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEffects.playMuteSound(nextMuted);

    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !nextMuted;
      }
    }
  };

  // Video On / Off
  const toggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !nextVideoOff;
      }
    }
  };

  // Hand Raise Toggle with chime
  const handleToggleHandRaise = async () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (nextState) {
      soundEffects.playHandRaiseSound();
    }
    await toggleCallHandRaise(call.id, currentUser.uid, nextState);
  };

  // Hardware switching during call
  const handleSwitchMicrophone = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    try {
      const res = await getOptimizedMediaStream({
        audio: true,
        video: false,
        audioDeviceId: deviceId,
      });
      if (res.stream && pcRef.current) {
        const newAudioTrack = res.stream.getAudioTracks()[0];
        newAudioTrack.enabled = !isMuted;

        const senders = pcRef.current.getSenders();
        const audioSender = senders.find((s) => s.track?.kind === 'audio');
        if (audioSender) {
          await audioSender.replaceTrack(newAudioTrack);
        }
      }
    } catch {}
  };

  const handleSwitchCamera = async (deviceId: string) => {
    setSelectedCamId(deviceId);
    try {
      const res = await getOptimizedMediaStream({
        audio: false,
        video: true,
        videoDeviceId: deviceId,
      });
      if (res.stream && pcRef.current) {
        const newVideoTrack = res.stream.getVideoTracks()[0];
        newVideoTrack.enabled = !isVideoOff;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = res.stream;
        }

        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }
    } catch {}
  };

  const handleSwitchSpeaker = async (deviceId: string) => {
    setSelectedSpeakerId(deviceId);
    if (remoteVideoRef.current) {
      await setAudioOutputDevice(remoteVideoRef.current, deviceId);
    }
  };

  // Host Controls: Admit Guest from Waiting Room
  const handleAdmitGuest = async (guestUid?: string) => {
    await admitGuestToCall(call.id, guestUid);
    soundEffects.playJoinSound();
  };

  const handleBroadcastHostMessage = async () => {
    if (!hostCustomMessage.trim()) return;
    setIsBroadcastingMsg(true);
    await setCallHostMessage(call.id, hostCustomMessage.trim());
    setIsBroadcastingMsg(false);
  };

  const handleEndCall = async () => {
    soundEffects.stopRingtone();
    soundEffects.playLeaveSound();
    cleanup();
    await endCallSession(call.id, 'ended', callDuration);
    onClose();
  };

  const handleAcceptIncoming = async () => {
    soundEffects.stopRingtone();
    soundEffects.playJoinSound();

    if (pcRef.current && call.offer) {
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(call.offer));
        const answer = await pcRef.current.createAnswer();
        const optimizedAnswer: RTCSessionDescriptionInit = {
          type: answer.type,
          sdp: optimizeSessionDescription(answer.sdp || ''),
        };
        await pcRef.current.setLocalDescription(optimizedAnswer);
        await answerCall(call.id, optimizedAnswer);
        setCallStatus('accepted');
      } catch (err) {
        console.warn('Accept call issue:', err);
      }
    }
  };

  const handleDeclineIncoming = async () => {
    soundEffects.stopRingtone();
    cleanup();
    await endCallSession(call.id, 'declined');
    onClose();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Check if someone's hand is raised
  const isOtherHandRaised = isCaller
    ? callSession.handRaised?.[callSession.receiverId]
    : callSession.handRaised?.[callSession.callerId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0b1326] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center max-h-[95vh]">
        {/* Call Top Header */}
        <div className="w-full p-3 sm:p-4 flex items-center justify-between border-b border-white/10 bg-[#070c1a]/85">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                callStatus === 'accepted' ? 'bg-emerald-400' : 'bg-[#EF4E22] animate-pulse'
              }`}
            />
            <span className="font-mono text-xs uppercase tracking-wider text-[#EF4E22] font-bold">
              {call.type === 'video' ? 'Berozgar Video' : 'Berozgar Voice'}
            </span>

            {/* Network Health Badge */}
            {callStatus === 'accepted' && (
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  networkStats.quality === 'excellent'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : networkStats.quality === 'good'
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}
                title={`RTT: ${networkStats.latencyMs}ms | Loss: ${networkStats.packetLossPercent}% | Jitter: ${networkStats.jitterMs}ms`}
              >
                <Wifi size={11} />
                <span>{networkStats.quality.toUpperCase()}</span>
                <span>• {networkStats.latencyMs}ms</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-white/80">
            {/* Host Controls Waiting Room pill */}
            {isCaller && callSession.waitingGuests && callSession.waitingGuests.length > 0 && (
              <button
                type="button"
                onClick={() => setShowWaitingPanel((w) => !w)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse cursor-pointer"
              >
                <Users size={12} />
                <span>Waiting ({callSession.waitingGuests.length})</span>
              </button>
            )}

            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/90">
              {callStatus === 'accepted' ? formatDuration(callDuration) : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* Silent Reconnection Warning Banner */}
        {isReconnecting && (
          <div className="w-full bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2 font-mono">
              <RefreshCw size={13} className="animate-spin text-amber-400" />
              <span>Connection interrupted. Silently reconnecting... (Attempt {reconnectAttempt}/3)</span>
            </div>
          </div>
        )}

        {/* Hand Raised Remote Banner */}
        {isOtherHandRaised && (
          <div className="w-full bg-[#EF4E22]/20 border-b border-[#EF4E22]/30 px-4 py-1.5 flex items-center gap-2 text-xs text-[#FFF9F3] font-mono animate-in fade-in">
            <Hand size={14} className="text-[#EF4E22] animate-bounce" />
            <span>{targetName} raised their hand</span>
          </div>
        )}

        {/* Video / Audio Stage */}
        <div className="relative w-full aspect-video sm:aspect-16/10 bg-[#080f21] flex items-center justify-center overflow-hidden">
          {call.type === 'video' ? (
            <>
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video Picture-in-Picture */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-28 h-20 sm:w-44 sm:h-32 bg-[#101930] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white/60">
                    <VideoOff size={18} />
                    <span className="text-[10px] font-mono mt-1">Camera off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Mode Avatar Stage */
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center z-10">
              <div className="relative mb-4 sm:mb-6">
                <UserAvatar
                  name={targetName}
                  photoURL={targetPhoto}
                  size="2xl"
                  className="shadow-[0_0_40px_rgba(239,78,34,0.35)]"
                />
                {callStatus === 'accepted' && (
                  <div className="absolute -inset-3 rounded-full border-2 border-[#EF4E22]/50 animate-ping pointer-events-none" />
                )}
              </div>

              <h2 className="text-xl font-bold text-white font-sans">{targetName}</h2>
              <p className="font-mono text-xs text-[#EF4E22] mt-1">
                {callStatus === 'accepted' ? 'Call in progress' : 'Connecting to contact...'}
              </p>
            </div>
          )}

          {/* Talking While Muted Toast Alert */}
          {isSpeakingWhileMuted && (
            <div className="absolute top-4 inset-x-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex items-center justify-center">
              <button
                type="button"
                onClick={toggleMute}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-mono text-xs font-bold flex items-center gap-2 shadow-2xl animate-bounce cursor-pointer border border-amber-400"
              >
                <AlertTriangle size={15} />
                <span>You are speaking while muted. Click to unmute!</span>
              </button>
            </div>
          )}

          {/* Incoming Ringing Screen for Receiver */}
          {!isCaller && callStatus === 'ringing' && (
            <div className="absolute inset-0 bg-black/85 z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              <div className="mb-4 animate-bounce">
                <UserAvatar
                  name={targetName}
                  photoURL={targetPhoto}
                  size="2xl"
                  className="shadow-2xl"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{targetName}</h3>
              <p className="font-mono text-sm text-[#EF4E22] mb-8">
                Incoming {call.type} call on Berozgar...
              </p>

              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={handleDeclineIncoming}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Decline"
                >
                  <PhoneOff size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleAcceptIncoming}
                  className="w-14 h-14 rounded-full bg-[#EF4E22] hover:bg-[#f3643d] text-[#FFF9F3] flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title="Accept"
                >
                  <Phone size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Waiting Room Guest Screen (when guest is waiting for host to admit) */}
          {!isCaller && callStatus === 'waiting_room' && (
            <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EF4E22]/20 text-[#EF4E22] flex items-center justify-center animate-pulse border border-[#EF4E22]/30">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">The Waiting Room</h3>
                <p className="font-mono text-xs text-white/60 mt-1 max-w-sm">
                  Please wait, the host (<span className="text-[#EF4E22]">{targetName}</span>) will admit you to the call shortly.
                </p>
              </div>

              {/* Host custom broadcast message */}
              {callSession.hostMessage && (
                <div className="max-w-md p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-amber-300">
                  <span className="font-bold text-white block mb-0.5">Message from Host:</span>
                  {callSession.hostMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleEndCall}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs transition-colors cursor-pointer"
              >
                Leave Waiting Room
              </button>
            </div>
          )}
        </div>

        {/* Host Waiting Room Drawer (when host views waiting list) */}
        {showWaitingPanel && isCaller && (
          <div className="w-full bg-[#080f24] border-t border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Waiting Room Attendees ({callSession.waitingGuests?.length || 0})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdmitGuest()}
                  className="px-3 py-1 rounded-lg bg-[#EF4E22] hover:bg-[#f3643d] text-white font-mono text-xs font-bold cursor-pointer"
                >
                  Admit All
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaitingPanel(false)}
                  className="text-white/40 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Waiting list */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {callSession.waitingGuests && callSession.waitingGuests.length > 0 ? (
                callSession.waitingGuests.map((g) => (
                  <div
                    key={g.uid}
                    className="p-2 rounded-xl bg-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar name={g.name} photoURL={g.photo} size="sm" />
                      <span className="text-xs text-white truncate font-medium">{g.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdmitGuest(g.uid)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold cursor-pointer"
                    >
                      Admit
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-white/40 py-2 text-center">
                  No guests currently waiting
                </div>
              )}
            </div>

            {/* Custom host announcement message */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <input
                type="text"
                placeholder="Send note to waiting guests..."
                value={hostCustomMessage}
                onChange={(e) => setHostCustomMessage(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#EF4E22]"
              />
              <button
                type="button"
                onClick={handleBroadcastHostMessage}
                disabled={isBroadcastingMsg}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Send update"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Hardware Selection Popover */}
        {showHardwareMenu && (
          <div className="w-full bg-[#080f24] border-t border-white/10 p-4 space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                In-Call Hardware Settings
              </span>
              <button
                type="button"
                onClick={() => setShowHardwareMenu(false)}
                className="text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-white/60 mb-1">Microphone</label>
                <select
                  value={selectedMicId}
                  onChange={(e) => handleSwitchMicrophone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-[#EF4E22]"
                >
                  {microphones.map((m) => (
                    <option key={m.deviceId} value={m.deviceId} className="bg-[#0b1326] text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {call.type === 'video' && (
                <div>
                  <label className="block text-[10px] font-mono text-white/60 mb-1">Camera</label>
                  <select
                    value={selectedCamId}
                    onChange={(e) => handleSwitchCamera(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-[#EF4E22]"
                  >
                    {cameras.map((c) => (
                      <option key={c.deviceId} value={c.deviceId} className="bg-[#0b1326] text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-white/60 mb-1">Speaker</label>
                <select
                  value={selectedSpeakerId}
                  onChange={(e) => handleSwitchSpeaker(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-[#EF4E22]"
                >
                  {speakers.map((s) => (
                    <option key={s.deviceId} value={s.deviceId} className="bg-[#0b1326] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Primary Call Controls Bar */}
        <div className="w-full p-3.5 sm:p-4 bg-black/70 border-t border-white/10 flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
          {/* Mute Button with clear visual distinction */}
          <button
            type="button"
            onClick={toggleMute}
            className={`h-12 px-4 rounded-full flex items-center gap-2 font-mono text-xs font-bold transition-all cursor-pointer ${
              isMuted
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-400/50'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* Video Button */}
          {call.type === 'video' && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoOff
                  ? 'bg-red-600/80 text-white border border-red-500/50'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isVideoOff ? 'Turn video on' : 'Turn video off'}
            >
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
          )}

          {/* Hand Raise Button */}
          <button
            type="button"
            onClick={handleToggleHandRaise}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isHandRaised
                ? 'bg-[#EF4E22] text-[#FFF9F3] shadow-[0_0_15px_rgba(239,78,34,0.5)]'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand size={18} />
          </button>

          {/* Hardware Device Settings Button */}
          <button
            type="button"
            onClick={() => setShowHardwareMenu((h) => !h)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              showHardwareMenu ? 'bg-white/30 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Audio & Video Settings"
          >
            <Settings size={18} />
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="px-6 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ml-1 sm:ml-2"
            title="End Call"
          >
            <PhoneOff size={18} />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
