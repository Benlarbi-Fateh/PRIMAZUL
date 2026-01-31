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
import { AuthContext } from "@/context/AuthProvider";
import { getSocket } from "@/services/socket";
import api from "@/lib/api";
import { Phone, PhoneOff, Video, Users, X } from "lucide-react";

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

const CALL_TIMEOUT_MS = 45000;

// ============================================
// SONS D'APPEL (Séparés des notifications)
// ============================================
const CALL_SOUNDS = {
  // Son quand vous appelez (tonalité)
  // Note : J'ai respecté votre nom de fichier "outgoning.wav"
  OUTGOING: "/Sounds/notifications/outgoning.wav",

  // Son quand on vous appelle (sonnerie)
  INCOMING: "/Sounds/notifications/incomingcall.wav",

  // Son quand l'appel est décroché
  CONNECTED: "/Sounds/notifications/light.mp3",

  // Son quand l'appel est terminé
  ENDED: "/Sounds/notifications/conclusive.mp3",

  // Son quand c'est occupé ou refusé
  BUSY: "/Sounds/notifications/default.mp3",
};

// ============================================
// CLASSE CALL AUDIO MANAGER (Indépendant)
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

    console.log("🔊 Initialisation CallAudioManager...");

    Object.entries(CALL_SOUNDS).forEach(([key, src]) => {
      try {
        const audio = new Audio(src);
        audio.preload = "auto";

        // Configuration selon le type
        if (key === "OUTGOING" || key === "INCOMING") {
          audio.loop = true;
        } else {
          audio.loop = false;
        }

        // Volume par défaut
        audio.volume = key === "INCOMING" ? 1.0 : 0.7;

        // Précharger
        audio.load();

        // Log des erreurs de chargement
        audio.addEventListener("error", (e) => {
          console.warn(`⚠️ Erreur chargement son ${key}:`, e);
        });

        audio.addEventListener("canplaythrough", () => {
          console.log(`✅ Son ${key} prêt`);
        });

        this.sounds[key] = audio;
      } catch (e) {
        console.warn(`❌ Impossible de créer audio ${key}:`, e);
      }
    });

    this.initialized = true;
    console.log(
      "✅ CallAudioManager initialisé avec",
      Object.keys(this.sounds).length,
      "sons",
    );
  }

  // Débloquer l'audio après une interaction utilisateur
  unlock() {
    if (this.unlocked) return;

    Object.values(this.sounds).forEach((audio) => {
      if (audio) {
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {});
      }
    });

    this.unlocked = true;
    console.log("🔓 Audio débloqué");
  }

  play(soundKey) {
    if (!this.initialized) this.init();

    const audio = this.sounds[soundKey];
    if (!audio) {
      console.warn(`⚠️ Son non trouvé: ${soundKey}`);
      return false;
    }

    // Arrêter le son en cours si c'est un son différent
    if (this.currentlyPlaying && this.currentlyPlaying !== soundKey) {
      this.stop(this.currentlyPlaying);
    }

    try {
      audio.currentTime = 0;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🔊 Son ${soundKey} en lecture`);
            this.currentlyPlaying = soundKey;
          })
          .catch((error) => {
            console.warn(`🔕 Son ${soundKey} bloqué:`, error.message);

            // Tentative de fallback
            setTimeout(() => {
              audio.play().catch(() => {});
            }, 100);
          });
      }

      return true;
    } catch (e) {
      console.warn(`❌ Erreur lecture ${soundKey}:`, e);
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

        console.log(`🔇 Son ${soundKey} arrêté`);
      } catch (e) {}
    }
  }

  stopAll() {
    console.log("🔇 Arrêt de tous les sons d'appel");
    Object.keys(this.sounds).forEach((key) => this.stop(key));
    this.currentlyPlaying = null;
  }

  setVolume(soundKey, volume) {
    const audio = this.sounds[soundKey];
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  isPlaying(soundKey) {
    const audio = this.sounds[soundKey];
    return audio && !audio.paused;
  }
}

// Instance singleton
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
  const { from, isGroup, groupName, callType } = incomingCall;
  const displayName = isGroup ? groupName : from?.name || "Inconnu";
  const initial = displayName.charAt(0).toUpperCase();

  // Débloquer l'audio quand le modal apparaît (interaction implicite)
  useEffect(() => {
    callAudioManager.unlock();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-slate-700/50 animate-scale-in">
        {/* Avatar avec animation */}
        <div className="relative mb-6">
          <div className="absolute -inset-4">
            <div className="w-36 h-36 rounded-full border-2 border-green-500/30 animate-ping" />
          </div>
          <div className="absolute -inset-2">
            <div
              className="w-32 h-32 rounded-full border-2 border-green-500/50 animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
          </div>

          <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-lg shadow-green-500/30">
            {from?.profilePicture ? (
              <img
                src={from.profilePicture}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                {isGroup ? (
                  <Users className="w-12 h-12 text-white" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {initial}
                  </span>
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

        <h3 className="text-xl font-bold mb-1 text-white text-center">
          {displayName}
        </h3>
        <p className="text-sm text-slate-400 mb-2">vous appelle</p>
        <p className="text-sm text-green-400 mb-8 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Appel {callType === "video" ? "vidéo" : "audio"} entrant
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
              <Phone className="w-7 h-7" />
            </button>
            <span className="text-xs text-slate-400">Accepter</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
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
      <div
        className={`px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 min-w-[280px] border text-white ${
          bgColors[notification.type] || bgColors.info
        }`}
      >
        <Phone size={20} />
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
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

  // Refs
  const callTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const notificationTimeoutRef = useRef(null);

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

    // Débloquer l'audio au premier clic
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

    setInCall(false);
    setCallState(CALL_STATES.IDLE);
    setAgoraToken(null);
    setChannelName(null);
    setCallData(null);
    setCurrentCallId(null);
    setIncomingCall(null);
    setCallError(null);
    isProcessingRef.current = false;
  }, [callTimer]);

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
        console.log("⚠️ Impossible d'initier l'appel:", {
          user: !!user,
          processing: isProcessingRef.current,
        });
        return;
      }

      isProcessingRef.current = true;
      console.log("📞 Initiation d'appel...", {
        conversationId,
        type,
        isGroup,
      });

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

        const tempCallId = generateCallId();
        const channel = `channel_${tempCallId}`;

        const participantsList = Array.isArray(participants)
          ? participants
          : [participants];
        const targetUserIds = participantsList.map((p) =>
          (p._id || p.id || p).toString(),
        );

        // Token Agora
        const { data: tokenData } = await api.post("/agora/token", {
          channelName: channel,
          uid: myUid,
          isGroup,
        });

        // Créer l'appel
        const { data: callMessageData } = await api.post(
          "/agora/calls/initiate",
          {
            conversationId,
            callType: type,
            isGroup,
            participants: targetUserIds,
          },
        );

        const calleeName = isGroup
          ? groupName
          : participantsList[0]?.name || "Inconnu";

        setCurrentCallId(callMessageData.callId);
        setChannelName(channel);
        setAgoraToken(tokenData.token);
        setCallData({
          isGroup,
          name: calleeName,
          participants: participantsList,
          profilePicture: !isGroup ? participantsList[0]?.profilePicture : null,
          conversationId,
        });

        // Émettre via socket
        socket.emit("call-initiate", {
          callId: callMessageData.callId,
          conversationId,
          channelName: channel,
          callType: type,
          isGroup,
          groupName,
          targetUserIds,
          callerName: user.name,
          callerImage: user.profilePicture,
        });

        setCallState(CALL_STATES.RINGING);
        setInCall(true);

        // 🔊 SON POUR L'APPELANT
        console.log("🔊 Lecture son OUTGOING...");
        callAudioManager.play("OUTGOING");

        showCallNotification("info", `Appel vers ${calleeName}...`);

        // Timeout
        callTimeoutRef.current = setTimeout(() => {
          console.log("⏰ Timeout appel");
          callAudioManager.stopAll();
          showError("Pas de réponse");
        }, CALL_TIMEOUT_MS);

        console.log(`✅ Appel initié: ${callMessageData.callId}`);
      } catch (error) {
        console.error("❌ Erreur initiation:", error);
        callAudioManager.stopAll();
        showError(
          error.response?.data?.message || "Impossible de lancer l'appel",
        );
      } finally {
        isProcessingRef.current = false;
      }
    },
    [user, myUid, showError, showCallNotification],
  );

  // ============================================
  // ACCEPTER UN APPEL
  // ============================================
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user || isProcessingRef.current) {
      console.log("⚠️ Impossible d'accepter:", {
        incomingCall: !!incomingCall,
        user: !!user,
      });
      return;
    }

    isProcessingRef.current = true;
    console.log("✅ Acceptation de l'appel...");

    const socket = getSocket();
    if (!socket?.connected) {
      showError("Connexion perdue");
      isProcessingRef.current = false;
      return;
    }

    try {
      // 🔇 ARRÊTER LA SONNERIE
      console.log("🔇 Arrêt sonnerie INCOMING");
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
        channelName: channel,
        uid: myUid,
        isGroup,
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

      // 🔊 SON DE CONNEXION
      callAudioManager.play("CONNECTED");
      showCallNotification("success", "Appel connecté");
      callTimer.start();

      console.log(`✅ Appel ${callId} accepté`);
    } catch (error) {
      console.error("❌ Erreur acceptation:", error);
      callAudioManager.stopAll();
      showError("Impossible de rejoindre l'appel");
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    incomingCall,
    user,
    myUid,
    callTimer,
    showError,
    hideCallNotification,
    showCallNotification,
  ]);

  // ============================================
  // REFUSER UN APPEL
  // ============================================
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    console.log("❌ Refus de l'appel");

    const socket = getSocket();
    const callId = incomingCall.callId;
    const callerName = incomingCall.from?.name || "Inconnu";

    // 🔇 ARRÊTER LA SONNERIE
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

    console.log("🛑 Fin d'appel:", { callId, wasRinging, wasOngoing });

    // 🔇 ARRÊTER TOUS LES SONS
    callAudioManager.stopAll();
    callTimer.stop();

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Socket
    if (callId && socket) {
      if (wasRinging) {
        socket.emit("call-cancel", { callId });
      } else {
        socket.emit(isGroupCall ? "call-leave" : "call-end", { callId });
      }
    }

    // API (non bloquant)
    if (callId) {
      api
        .post(`/agora/calls/${callId}/end`, {
          reason: wasRinging ? "cancelled" : "ended",
          duration: wasOngoing ? duration : 0,
        })
        .catch(() => {});
    }

    // Notification et reset
    if (wasOngoing) {
      callAudioManager.play("ENDED");
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      showCallNotification("info", `Appel terminé (${durationStr})`);
      setTimeout(() => resetCallState(), 500);
    } else {
      showCallNotification("info", "Appel annulé");
      resetCallState();
    }
  }, [
    currentCallId,
    callState,
    callData,
    incomingCall,
    callTimer,
    resetCallState,
    showCallNotification,
  ]);

  // ============================================
  // SOCKET HANDLERS
  // ============================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) {
      console.log("⚠️ Socket ou user non disponible pour les appels");
      return;
    }

    console.log("🔌 Enregistrement des handlers d'appel");

    const handlers = {
      "call-incoming": (data) => {
        console.log("📱 APPEL ENTRANT:", data);

        if (inCall) {
          console.log("❌ Déjà en appel, refus automatique");
          socket.emit("call-decline", { callId: data.callId, reason: "busy" });
          showCallNotification(
            "warning",
            `Appel manqué de ${data.from?.name || "Inconnu"} (occupé)`,
          );
          return;
        }

        setIncomingCall(data);
        setCallState(CALL_STATES.RINGING);

        // 🔊 SONNERIE POUR LE RÉCEPTEUR
        console.log("🔊 Lecture sonnerie INCOMING");
        callAudioManager.play("INCOMING");
      },

      "call-answered": (data) => {
        console.log("✅ APPEL RÉPONDU:", data);

        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }

        // 🔇 ARRÊTER LE SON OUTGOING
        callAudioManager.stop("OUTGOING");

        // 🔊 SON DE CONNEXION
        callAudioManager.play("CONNECTED");

        hideCallNotification();
        showCallNotification("success", "Appel connecté");
        setCallState(CALL_STATES.ONGOING);
        callTimer.start();
      },

      "call-declined": (data) => {
        console.log("❌ APPEL REFUSÉ:", data);

        callAudioManager.stop("OUTGOING");

        if (data.reason === "busy") {
          callAudioManager.play("BUSY");
          showCallNotification("warning", "L'utilisateur est déjà en appel");
        } else {
          showCallNotification("warning", "Appel refusé");
        }

        setTimeout(() => resetCallState(), 2000);
      },

      "call-ended": (data) => {
        console.log("🛑 APPEL TERMINÉ PAR L'AUTRE:", data);

        callAudioManager.stopAll();
        callAudioManager.play("ENDED");
        showCallNotification("info", "Appel terminé");
        setTimeout(() => resetCallState(), 500);
      },

      "call-cancelled": (data) => {
        console.log("📵 APPEL ANNULÉ:", data);

        callAudioManager.stopAll();
        showCallNotification("info", "L'appelant a annulé");
        setIncomingCall(null);
        setCallState(CALL_STATES.IDLE);
      },

      "call-timeout": (data) => {
        console.log("⏰ TIMEOUT:", data);
        callAudioManager.stopAll();
        showCallNotification("warning", "Pas de réponse");
        setTimeout(() => resetCallState(), 2000);
      },

      "call-missed": (data) => {
        console.log("📵 APPEL MANQUÉ:", data);
        callAudioManager.stopAll();
        showCallNotification(
          "info",
          `Appel manqué de ${data.from?.name || "Inconnu"}`,
        );
        setIncomingCall(null);
        setCallState(CALL_STATES.IDLE);
      },

      "call-error": (data) => {
        console.error("❌ ERREUR APPEL:", data);
        callAudioManager.stopAll();
        const message =
          typeof data === "string" ? data : data?.error || "Erreur d'appel";
        showCallNotification("error", message);
        setTimeout(() => resetCallState(), 3000);
      },

      "call-quality": (data) => {
        setConnectionQuality(data.quality);
      },
    };

    // Enregistrer les handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      console.log("🔌 Désenregistrement des handlers d'appel");
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [
    user,
    inCall,
    callTimer,
    resetCallState,
    showCallNotification,
    hideCallNotification,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      callAudioManager.stopAll();
      callTimer.reset();
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (notificationTimeoutRef.current)
        clearTimeout(notificationTimeoutRef.current);
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
      inCall,
      callState,
      callDuration: callTimer.duration,
      callError,
      connectionQuality,
      generateNumericUid,
      CALL_STATES,
    }),
    [
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      inCall,
      callState,
      callTimer.duration,
      callError,
      connectionQuality,
    ],
  );

  return (
    <CallContext.Provider value={contextValue}>
      {children}

      {/* Toast Notification */}
      <CallToast
        notification={callNotification}
        onClose={hideCallNotification}
      />

      {/* Modal Appel Entrant */}
      {incomingCall && !inCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Composant Appel Vidéo */}
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
