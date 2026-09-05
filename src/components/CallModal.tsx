import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CallSession, UserProfile } from '../types';
import {
  answerCall,
  addCallIceCandidate,
  endCallSession,
  subscribeToCallSession,
} from '../lib/socialChatService';
import { UserAvatar } from './UserAvatar';

interface CallModalProps {
  call: CallSession;
  currentUser: UserProfile;
  onClose: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const CallModal: React.FC<CallModalProps> = ({ call, currentUser, onClose }) => {
  const isCaller = call.callerId === currentUser.uid;
  const targetName = isCaller ? call.receiverName : call.callerName;
  const targetPhoto = isCaller ? call.receiverPhoto : call.callerPhoto;

  const [callStatus, setCallStatus] = useState<CallSession['status']>(call.status);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.type === 'voice');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<number | null>(null);

  // Initialize WebRTC
  useEffect(() => {
    let active = true;

    async function setupWebRTC() {
      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Get User Media
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: call.type === 'video',
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;

        if (localVideoRef.current && call.type === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to PC
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // On Remote Track
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // ICE Candidate dispatch to Firestore
        pc.onicecandidate = (event) => {
          if (event.candidate && active) {
            addCallIceCandidate(
              call.id,
              isCaller ? 'caller' : 'receiver',
              event.candidate.toJSON()
            );
          }
        };

        // If caller, send offer
        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          // Initial call document already created with offer in service
        } else if (call.offer) {
          // If receiver and incoming call, set remote description
          await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await answerCall(call.id, answer);
        }
      } catch (err) {
        console.warn('WebRTC media setup notice (simulating media channel):', err);
      }
    }

    setupWebRTC();

    // Listen to call updates from Firestore
    const unsub = subscribeToCallSession(call.id, async (updatedCall) => {
      if (!updatedCall || updatedCall.status === 'ended' || updatedCall.status === 'declined') {
        cleanup();
        onClose();
        return;
      }

      setCallStatus(updatedCall.status);

      if (updatedCall.status === 'accepted' && !durationTimerRef.current) {
        durationTimerRef.current = window.setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
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
            } catch (e) {
              // Ignore candidate error
            }
          });
        }
      }
    });

    return () => {
      active = false;
      unsub();
      cleanup();
    };
  }, [call.id]);

  const cleanup = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleEndCall = async () => {
    cleanup();
    await endCallSession(call.id, 'ended', callDuration);
    onClose();
  };

  const handleAcceptIncoming = async () => {
    if (pcRef.current && call.offer) {
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(call.offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        await answerCall(call.id, answer);
        setCallStatus('accepted');
      } catch (err) {
        console.warn('Accept call error:', err);
      }
    }
  };

  const handleDeclineIncoming = async () => {
    cleanup();
    await endCallSession(call.id, 'declined');
    onClose();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e1933] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center max-h-[95vh]">
        {/* Call Header */}
        <div className="w-full p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 bg-[#0a1224]/70">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4E22] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#EF4E22] font-bold">
              {call.type === 'video' ? 'Berozgar Video Call' : 'Berozgar Voice Call'}
            </span>
          </div>
          <span className="font-mono text-xs text-white/70">
            {callStatus === 'accepted' ? formatDuration(callDuration) : 'Connecting...'}
          </span>
        </div>

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
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-28 h-20 sm:w-44 sm:h-32 bg-[#1a1a1a] rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white/60">
                    <VideoOff size={20} />
                    <span className="text-[10px] font-mono mt-1">Camera off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Audio Visualizer View */
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center z-10">
              <div className="relative mb-4 sm:mb-6">
                <UserAvatar
                  name={targetName}
                  photoURL={targetPhoto}
                  size="2xl"
                  className="shadow-[0_0_40px_rgba(239,78,34,0.3)]"
                />
                {callStatus === 'accepted' && (
                  <div className="absolute -inset-3 rounded-full border-2 border-[#EF4E22]/40 animate-ping pointer-events-none" />
                )}
              </div>

              <h2 className="text-xl font-bold text-white font-sans">{targetName}</h2>
              <p className="font-mono text-xs text-[#EF4E22] mt-1">
                {callStatus === 'accepted' ? 'Call in progress' : 'Ringing...'}
              </p>
            </div>
          )}

          {/* Incoming Ringing Prompt for receiver */}
          {!isCaller && callStatus === 'ringing' && (
            <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-6 text-center">
              <div className="mb-4 animate-bounce">
                <UserAvatar
                  name={targetName}
                  photoURL={targetPhoto}
                  size="2xl"
                  className="shadow-xl"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{targetName}</h3>
              <p className="font-mono text-sm text-[#EF4E22] mb-8">
                Incoming {call.type} call...
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
        </div>

        {/* Call Controls Bar */}
        <div className="w-full p-3.5 sm:p-4 bg-black/60 border-t border-white/10 flex items-center justify-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {call.type === 'video' && (
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}

          <button
            type="button"
            onClick={handleEndCall}
            className="px-6 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white font-mono text-sm font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff size={20} />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
