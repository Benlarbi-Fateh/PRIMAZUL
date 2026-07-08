// frontend/src/context/CallContext.js
"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { AuthContext } from "@/context/AuthProvider";
import {
  getSocket,
  checkActiveCall as socketCheckActiveCall,
  onActiveCallFound,
  onNoActiveCall,
  onCallAlreadyExists,
  onCallParticipantJoined,
  onCallParticipantLeft,
  onCallAllDeclined,
  onCallIncoming,
  onCallAnswered,
  onCallDeclined,
  onCallCancelled,
  onCallTimeout,
  onCallEnded,
  onCallMissed,
  onCallError,
  emitCancelCall,
} from "@/services/socket";
import api from "@/lib/api";
import { Phone, PhoneOff, Video, Users, X, UserPlus } from "lucide-react";

const VideoCall = dynamic(() => import("@/components/Chat/VideCall"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
    </div>
  ),
});

export const CallContext = createContext(null);

// ============================================
// CONSTANTES
// ============================================
export const CALL_STATES = {
  IDLE: "idle",
  RINGING: "ringing",
  CONNECTING: "connecting",
  ONGOING: "ongoing",
  RECONNECTING: "reconnecting",
  ENDED: "ended",
};

const GROUP_CALL_TIMEOUT_MS = 20000;
const P2P_CALL_TIMEOUT_MS = 45000;

// ============================================
// SONS D'APPEL
// ============================================
const CALL_SOUNDS = {
  OUTGOING: "/Sounds/notifications/outgoning.wav",
  INCOMING: "/Sounds/notifications/incomingcall.wav",
  CONNECTED: "/Sounds/notifications/light.mp3",
  ENDED: "/Sounds/notifications/conclusive.mp3",
  BUSY: "/Sounds/notifications/default.mp3",
};

// ============================================
// CLASSE CALL AUDIO MANAGER
// ============================================
class CallAudioManager {
  constructor() {
    this.sounds = {};
    this.currentlyPlaying = null;
    this.initialized = false;
    this.unlocked = false;
  }

  init() {
    if (this.initialized || typeof window === "undefined") return;

    Object.entries(CALL_SOUNDS).forEach(([key, src]) => {
      try {
        const audio = new Audio(src);
        audio.preload = "auto";

        if (key === "OUTGOING" || key === "INCOMING") {
          audio.loop = true;
        } else {
          audio.loop = false;
        }

        audio.volume = key === "INCOMING" ? 1.0 : 0.7;
        audio.load();

        this.sounds[key] = audio;
      } catch (e) {
        console.warn(`❌ Impossible de créer audio ${key}:`, e);
      }
    });

    this.initialized = true;
  }

  unlock() {
    if (this.unlocked) return;

    Object.values(this.sounds).forEach((audio) => {
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
    });

    this.unlocked = true;
  }

  play(soundKey) {
    if (!this.initialized) this.init();

    const audio = this.sounds[soundKey];
    if (!audio) return false;

    if (this.currentlyPlaying && this.currentlyPlaying !== soundKey) {
      this.stop(this.currentlyPlaying);
    }

    try {
      audio.currentTime = 0;
      audio.play().then(() => {
        this.currentlyPlaying = soundKey;
      }).catch(() => {
        setTimeout(() => audio.play().catch(() => {}), 100);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  stop(soundKey) {
    const audio = this.sounds[soundKey];
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        if (this.currentlyPlaying === soundKey) {
          this.currentlyPlaying = null;
        }
      } catch (e) {}
    }
  }

  stopAll() {
    Object.keys(this.sounds).forEach((key) => this.stop(key));
    this.currentlyPlaying = null;
  }
}

const callAudioManager = new CallAudioManager();

// ============================================
// UTILITAIRES
// ============================================
export const generateNumericUid = (str) => {
  if (!str) return Math.floor(Math.random() * 100000) + 1;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash) || 1;
};

const generateCallId = () =>
  `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// ============================================
// HOOK TIMER
// ============================================
const useCallTimer = () => {
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setDuration(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { duration, start, stop, reset };
};

// ============================================
// COMPOSANT MODAL APPEL ENTRANT
// ============================================
const IncomingCallModal = memo(function IncomingCallModal({
  incomingCall,
  onAccept,
  onReject,
}) {
  const { from, isGroup, groupName, callType, hasActiveCall } = incomingCall;
  const displayName = isGroup ? groupName : from?.name || "Inconnu";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    callAudioManager.unlock();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-slate-700/50 animate-scale-in">
        <div className="relative mb-6">
          <div className="absolute -inset-4">
            <div className="w-36 h-36 rounded-full border-2 border-green-500/30 animate-ping" />
          </div>
          <div className="absolute -inset-2">
            <div className="w-32 h-32 rounded-full border-2 border-green-500/50 animate-ping" style={{ animationDelay: "0.5s" }} />
          </div>

          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-lg shadow-green-500/30">
            {from?.profilePicture ? (
              <Image
                src={from.profilePicture}
                alt={displayName}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                {isGroup ? (
                  <Users className="w-12 h-12 text-white" />
                ) : (
                  <span className="text-3xl font-bold text-white">{initial}</span>
                )}
              </div>
            )}
          </div>

          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg animate-bounce">
            {callType === "video" ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <Phone className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-1 text-white text-center">{displayName}</h3>
        <p className="text-sm text-slate-400 mb-2">
          {hasActiveCall ? "vous invite à rejoindre un appel" : "vous appelle"}
        </p>
        <p className="text-sm text-green-400 mb-8 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          {hasActiveCall ? "Appel en cours" : `Appel ${callType === "video" ? "vidéo" : "audio"} entrant`}
        </p>

        <div className="flex gap-8 w-full justify-center">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onReject}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-slate-400">Refuser</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAccept}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-110 active:scale-95 animate-pulse"
            >
              {hasActiveCall ? <UserPlus className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </button>
            <span className="text-xs text-slate-400">{hasActiveCall ? "Rejoindre" : "Accepter"}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// COMPOSANT NOTIFICATION TOAST
// ============================================
const CallToast = memo(function CallToast({ notification, onClose }) {
  if (!notification) return null;

  const bgColors = {
    error: "bg-red-500/90 border-red-400",
    warning: "bg-yellow-500/90 border-yellow-400",
    success: "bg-green-500/90 border-green-400",
    info: "bg-blue-500/90 border-blue-400",
  };

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-slide-in">
      <div className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 min-w-[280px] border text-white ${bgColors[notification.type] || bgColors.info}`}>
        <Phone size={20} />
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

// ============================================
// PROVIDER PRINCIPAL
// ============================================
export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // États principaux
  const [inCall, setInCall] = useState(false);
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callData, setCallData] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callError, setCallError] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState("good");
  const [callNotification, setCallNotification] = useState(null);
  
  // États pour appel actif
  const [activeCallInConversation, setActiveCallInConversation] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Refs
  const callTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const notificationTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Timer
  const callTimer = useCallTimer();

  // UID
  const myUid = useMemo(
    () => generateNumericUid(user?._id || user?.id),
    [user],
  );

  // ============================================
  // INITIALISATION
  // ============================================
  useEffect(() => {
    callAudioManager.init();

    const unlockHandler = () => {
      callAudioManager.unlock();
      document.removeEventListener("click", unlockHandler);
      document.removeEventListener("touchstart", unlockHandler);
    };

    document.addEventListener("click", unlockHandler);
    document.addEventListener("touchstart", unlockHandler);

    return () => {
      document.removeEventListener("click", unlockHandler);
      document.removeEventListener("touchstart", unlockHandler);
    };
  }, []);

  // ============================================
  // NOTIFICATIONS
  // ============================================
  const showCallNotification = useCallback((type, message, duration = 4000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setCallNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setCallNotification(null);
    }, duration);
  }, []);

  const hideCallNotification = useCallback(() => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setCallNotification(null);
  }, []);

  // ============================================
  // VÉRIFIER APPEL ACTIF
  // ============================================
  const checkActiveCall = useCallback((conversationId) => {
    if (conversationId) {
      socketCheckActiveCall(conversationId);
    }
  }, []);

  const setCurrentConversation = useCallback((conversationId) => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      checkActiveCall(conversationId);
    } else {
      setActiveCallInConversation(null);
    }
  }, [checkActiveCall]);

  // ============================================
  // HELPERS
  // ============================================
  const resetCallState = useCallback(() => {
    console.log("🔄 Reset de l'état d'appel");
    callAudioManager.stopAll();
    callTimer.reset();

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    setInCall(false);
    setCallState(CALL_STATES.IDLE);
    setAgoraToken(null);
    setChannelName(null);
    setCallData(null);
    setCurrentCallId(null);
    setIncomingCall(null);
    setCallError(null);
    isProcessingRef.current = false;

    if (currentConversationId) {
      checkActiveCall(currentConversationId);
    }
  }, [callTimer, currentConversationId, checkActiveCall]);

  const showError = useCallback(
    (message, autoEndCall = true) => {
      setCallError(message);
      showCallNotification("error", message);
      if (autoEndCall) {
        setTimeout(() => resetCallState(), 3000);
      }
    },
    [resetCallState, showCallNotification],
  );

  // ============================================
  // PING
  // ============================================
  const startPing = useCallback((callId) => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      api.post(`/agora/calls/${callId}/ping`).catch(() => {});
    }, 30000);
  }, []);

  // ============================================
  // REJOINDRE UN APPEL EXISTANT
  // ============================================
  const joinExistingCall = useCallback(async () => {
    if (!activeCallInConversation || !user || isProcessingRef.current) return;

    isProcessingRef.current = true;
    
    try {
      setCallState(CALL_STATES.CONNECTING);
      hideCallNotification();
      
      const { callId, channelName: channel, callType: type, isGroup, conversationId } = activeCallInConversation;
      
      const { data: tokenData } = await api.post("/agora/token", {
        callId,
        uid: myUid,
      });

      await api.post(`/agora/calls/${callId}/join`);

      setCurrentCallId(callId);
      setChannelName(channel);
      setAgoraToken(tokenData.token);
      setCallType(type);
      setCallData({
        isGroup,
        name: "Appel en cours",
        conversationId: conversationId || currentConversationId,
      });

      const socket = getSocket();
      socket?.emit("call-join", { callId });

      setInCall(true);
      setCallState(CALL_STATES.ONGOING);
      setActiveCallInConversation(null);
      
      callAudioManager.play("CONNECTED");
      showCallNotification("success", "Vous avez rejoint l'appel");
      callTimer.start();
      startPing(callId);
      
    } catch (error) {
      console.error("Erreur rejoindre appel:", error);
      if (error.response?.status === 410) {
        showCallNotification("warning", "Cet appel est terminé");
        setActiveCallInConversation(null);
      } else {
        showError("Impossible de rejoindre l'appel");
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [activeCallInConversation, user, myUid, currentConversationId, callTimer, startPing, showError, showCallNotification, hideCallNotification]);

  // ============================================
  // INITIER UN APPEL
  // ============================================
  const initiateCall = useCallback(
    async (
      conversationId,
      participants,
      type = "video",
      isGroup = false,
      groupName = "",
    ) => {
      if (!user || isProcessingRef.current) {
        return;
      }

      // Vérifier s'il y a un appel actif
      if (activeCallInConversation) {
        showCallNotification("info", "Un appel est déjà en cours. Rejoignez-le !", 5000);
        return;
      }

      isProcessingRef.current = true;

      const socket = getSocket();
      if (!socket?.connected) {
        showError("Connexion perdue. Réessayez.");
        isProcessingRef.current = false;
        return;
      }

      try {
        setCallState(CALL_STATES.CONNECTING);
        setCallType(type);
        setCallError(null);

        const participantsList = Array.isArray(participants) ? participants : [participants];
        const targetUserIds = participantsList.map((p) => (p._id || p.id || p).toString());

        const { data: callResponseData } = await api.post("/agora/calls/initiate", {
          conversationId,
          callType: type,
          isGroup,
          participants: targetUserIds,
        });

        const { data: tokenData } = await api.post("/agora/token", {
          callId: callResponseData.callId,
          uid: myUid,
        });

        const calleeName = isGroup ? groupName : participantsList[0]?.name || "Inconnu";

        setCurrentCallId(callResponseData.callId);
        setChannelName(callResponseData.channelName);
        setAgoraToken(tokenData.token);
        setCallData({
          isGroup,
          name: calleeName,
          participants: participantsList,
          profilePicture: !isGroup ? participantsList[0]?.profilePicture : null,
          conversationId,
        });

        socket.emit("call-initiate", {
          callId: callResponseData.callId,
          conversationId,
          channelName: callResponseData.channelName,
          callType: type,
          isGroup,
          groupName,
          targetUserIds,
          callerName: user.name,
          callerImage: user.profilePicture,
        });

        setCallState(CALL_STATES.RINGING);
        setInCall(true);

        callAudioManager.play("OUTGOING");
        showCallNotification("info", `Appel vers ${calleeName}...`);

        const timeoutDuration = isGroup ? GROUP_CALL_TIMEOUT_MS : P2P_CALL_TIMEOUT_MS;
        
        callTimeoutRef.current = setTimeout(() => {
          callAudioManager.stopAll();
          showError("Pas de réponse");
        }, timeoutDuration);

      } catch (error) {
        console.error("❌ Erreur initiation:", error);
        callAudioManager.stopAll();
        
        if (error.response?.status === 409) {
          showCallNotification("warning", "Un appel est déjà en cours");
          if (error.response.data?.canJoin) {
            setActiveCallInConversation(error.response.data.callDetails);
          }
        } else {
          showError(error.response?.data?.message || "Impossible de lancer l'appel");
        }
      } finally {
        isProcessingRef.current = false;
      }
    },
    [user, myUid, activeCallInConversation, showError, showCallNotification],
  );

  // ============================================
  // ACCEPTER UN APPEL
  // ============================================
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user || isProcessingRef.current) return;

    isProcessingRef.current = true;

    const socket = getSocket();
    if (!socket?.connected) {
      showError("Connexion perdue");
      isProcessingRef.current = false;
      return;
    }

    try {
      callAudioManager.stop("INCOMING");
      hideCallNotification();
      setCallState(CALL_STATES.CONNECTING);

      const {
        callId,
        channelName: channel,
        callType: type,
        isGroup,
        groupName,
        from,
        conversationId,
        participants,
      } = incomingCall;

      const { data: tokenData } = await api.post("/agora/token", {
        callId,
        uid: myUid,
      });

      await api.post(`/agora/calls/${callId}/answer`);

      setCurrentCallId(callId);
      setChannelName(channel);
      setAgoraToken(tokenData.token);
      setCallType(type);

      const allParticipants = isGroup ? participants || [from] : [from];
      setCallData({
        isGroup,
        name: isGroup ? groupName : from?.name,
        profilePicture: from?.profilePicture,
        participants: allParticipants,
        conversationId,
      });

      setInCall(true);
      setCallState(CALL_STATES.ONGOING);
      setIncomingCall(null);

      socket.emit("call-answer", {
        callId,
        channelName: channel,
        userId: user._id || user.id,
      });

      callAudioManager.play("CONNECTED");
      showCallNotification("success", "Appel connecté");
      callTimer.start();
      startPing(callId);

    } catch (error) {
      console.error("❌ Erreur acceptation:", error);
      callAudioManager.stopAll();
      showError("Impossible de rejoindre l'appel");
    } finally {
      isProcessingRef.current = false;
    }
  }, [incomingCall, user, myUid, callTimer, startPing, showError, hideCallNotification, showCallNotification]);

  // ============================================
  // REFUSER UN APPEL
  // ============================================
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    const socket = getSocket();
    const callId = incomingCall.callId;
    const callerName = incomingCall.from?.name || "Inconnu";

    callAudioManager.stop("INCOMING");
    hideCallNotification();

    try {
      await api.post(`/agora/calls/${callId}/decline`);
      socket?.emit("call-decline", { callId, reason: "declined" });
    } catch (error) {
      console.error("Erreur refus:", error);
    }

    showCallNotification("info", `Appel de ${callerName} refusé`);
    setIncomingCall(null);
    setCallState(CALL_STATES.IDLE);
  }, [incomingCall, hideCallNotification, showCallNotification]);

  // ============================================
  // TERMINER UN APPEL
  // ============================================
  const endCall = useCallback(async () => {
    const socket = getSocket();
    const callId = currentCallId;
    const isGroupCall = callData?.isGroup || incomingCall?.isGroup;
    const wasRinging = callState === CALL_STATES.RINGING;
    const wasOngoing = callState === CALL_STATES.ONGOING;
    const duration = callTimer.duration;

    callAudioManager.stopAll();
    callTimer.stop();

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (callId && socket) {
      if (wasRinging) {
        socket.emit("call-cancel", { callId });
      } else {
        const event = isGroupCall ? "call-leave" : "call-end";
        socket.emit(event, { callId });
      }
    }

    if (callId) {
      const endpoint = isGroupCall && wasOngoing ? "leave" : "end";
      api.post(`/agora/calls/${callId}/${endpoint}`, {
        reason: wasRinging ? "cancelled" : "ended",
        duration: wasOngoing ? duration : 0,
      }).catch((err) => console.error("Erreur API fin appel:", err));
    }

    if (wasOngoing) {
      callAudioManager.play("ENDED");
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

      const msg = isGroupCall
        ? "Vous avez quitté l'appel de groupe"
        : `Appel terminé (${durationStr})`;
      showCallNotification("info", msg);

      setTimeout(() => resetCallState(), 500);
    } else {
      showCallNotification("info", "Appel annulé");
      resetCallState();
    }
  }, [currentCallId, callState, callData, incomingCall, callTimer, resetCallState, showCallNotification]);

  // ============================================
  // SOCKET HANDLERS
  // ============================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // Appel actif trouvé
    const unsubActiveFound = onActiveCallFound((data) => {
      console.log("📞 Appel actif trouvé:", data);
      setActiveCallInConversation(data);
    });

    // Pas d'appel actif
    const unsubNoActive = onNoActiveCall(() => {
      setActiveCallInConversation(null);
    });

    // Appel déjà existant
    const unsubAlreadyExists = onCallAlreadyExists((data) => {
      showCallNotification("warning", "Un appel est déjà en cours");
      if (data.canJoin) {
        setActiveCallInConversation(data);
      }
      resetCallState();
    });

    // Tout le monde a refusé
    const unsubAllDeclined = onCallAllDeclined(() => {
      callAudioManager.stopAll();
      showCallNotification("warning", "Personne n'a répondu à l'appel");
      setTimeout(() => resetCallState(), 2000);
    });

    // Participant rejoint
    const unsubParticipantJoined = onCallParticipantJoined((data) => {
      showCallNotification("info", `${data.userName || 'Un participant'} a rejoint l'appel`);
    });

    // Appel entrant
    const unsubIncoming = onCallIncoming((data) => {
      console.log("📱 APPEL ENTRANT:", data);

      if (inCall) {
        socket.emit("call-decline", { callId: data.callId, reason: "busy" });
        showCallNotification("warning", `Appel manqué de ${data.from?.name || "Inconnu"} (occupé)`);
        return;
      }

      setIncomingCall(data);
      setCallState(CALL_STATES.RINGING);
      callAudioManager.play("INCOMING");
    });

    // Appel répondu
    const unsubAnswered = onCallAnswered((data) => {
      console.log("✅ APPEL RÉPONDU:", data);

      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      callAudioManager.stop("OUTGOING");
      callAudioManager.play("CONNECTED");

      hideCallNotification();
      showCallNotification("success", "Appel connecté");
      setCallState(CALL_STATES.ONGOING);
      callTimer.start();
      
      if (currentCallId) {
        startPing(currentCallId);
      }
    });

    // Appel refusé
    const unsubDeclined = onCallDeclined((data) => {
      callAudioManager.stop("OUTGOING");

      if (data.reason === "busy") {
        callAudioManager.play("BUSY");
        showCallNotification("warning", "L'utilisateur est déjà en appel");
      } else {
        showCallNotification("warning", "Appel refusé");
      }

      setTimeout(() => resetCallState(), 2000);
    });

    // Appel terminé
    const unsubEnded = onCallEnded((data) => {
      callAudioManager.stopAll();
      callAudioManager.play("ENDED");
      showCallNotification("info", "Appel terminé");
      setTimeout(() => resetCallState(), 500);
    });

    // Appel annulé
    const unsubCancelled = onCallCancelled(() => {
      callAudioManager.stopAll();
      showCallNotification("info", "L'appelant a annulé");
      setIncomingCall(null);
      setCallState(CALL_STATES.IDLE);
    });

    // Timeout
    const unsubTimeout = onCallTimeout((data) => {
      callAudioManager.stopAll();
      
      if (data.isGroup) {
        showCallNotification("warning", "Aucune réponse après 20 secondes");
      } else {
        showCallNotification("warning", "Pas de réponse");
      }
      
      setTimeout(() => resetCallState(), 2000);
    });

    // Appel manqué
    const unsubMissed = onCallMissed((data) => {
      callAudioManager.stopAll();
      showCallNotification("info", `Appel manqué`);
      setIncomingCall(null);
      setCallState(CALL_STATES.IDLE);
    });

    // Erreur
    const unsubError = onCallError((data) => {
      callAudioManager.stopAll();
      const message = typeof data === "string" ? data : data?.error || "Erreur d'appel";
      showCallNotification("error", message);
      setTimeout(() => resetCallState(), 3000);
    });

    return () => {
      unsubActiveFound?.();
      unsubNoActive?.();
      unsubAlreadyExists?.();
      unsubAllDeclined?.();
      unsubParticipantJoined?.();
      unsubIncoming?.();
      unsubAnswered?.();
      unsubDeclined?.();
      unsubEnded?.();
      unsubCancelled?.();
      unsubTimeout?.();
      unsubMissed?.();
      unsubError?.();
    };
  }, [user, inCall, currentCallId, callTimer, startPing, resetCallState, showCallNotification, hideCallNotification]);

  // Cleanup
  useEffect(() => {
    return () => {
      callAudioManager.stopAll();
      callTimer.reset();
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [callTimer]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const contextValue = useMemo(
    () => ({
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      joinExistingCall,
      checkActiveCall,
      setCurrentConversation,
      inCall,
      callState,
      callDuration: callTimer.duration,
      callError,
      connectionQuality,
      activeCallInConversation,
      generateNumericUid,
      CALL_STATES,
    }),
    [
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      joinExistingCall,
      checkActiveCall,
      setCurrentConversation,
      inCall,
      callState,
      callTimer.duration,
      callError,
      connectionQuality,
      activeCallInConversation,
    ],
  );

  return (
    <CallContext.Provider value={contextValue}>
      {children}

      <CallToast notification={callNotification} onClose={hideCallNotification} />

      {incomingCall && !inCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {inCall && agoraToken && channelName && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={myUid}
          callType={callType}
          callData={callData}
          callState={callState}
          callDuration={callTimer.duration}
          callError={callError}
          connectionQuality={connectionQuality}
          onHangup={endCall}
        />
      )}
    </CallContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
