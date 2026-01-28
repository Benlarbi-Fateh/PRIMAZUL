"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  Phone,
  PhoneOff,
} from "react";
import dynamic from "next/dynamic";
import { AuthContext } from "@/context/AuthProvider";
import { getSocket } from "@/services/socket";
import api from "@/lib/api";

const VideoCall = dynamic(() => import("@/components/Chat/VideCall"), {
  ssr: false,
});

export const CallContext = createContext();

const generateNumericUid = (str) => {
  if (!str) return Math.floor(Math.random() * 100000);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

const generateCallId = () => {
  return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [inCall, setInCall] = useState(false);
  const [callState, setCallState] = useState("idle");
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callData, setCallData] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState(null);

  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const incomingRingtoneRef = useRef(null);
  const outgoingRingtoneRef = useRef(null);

  // --- SONNERIES ---
  const playIncomingRingtone = useCallback(() => {
    try {
      if (!incomingRingtoneRef.current) {
        incomingRingtoneRef.current = new Audio("/sounds/appel recue '.wav");
        incomingRingtoneRef.current.loop = true;
      }
      incomingRingtoneRef.current.play().catch((err) => {
        console.warn("Autoplay bloqué:", err);
      });
    } catch (e) {
      console.log("Audio non supporté");
    }
  }, []);

  const stopIncomingRingtone = useCallback(() => {
    if (incomingRingtoneRef.current) {
      incomingRingtoneRef.current.pause();
      incomingRingtoneRef.current.currentTime = 0;
    }
  }, []);

  const playOutgoingRingtone = useCallback(() => {
    try {
      if (!outgoingRingtoneRef.current) {
        outgoingRingtoneRef.current = new Audio(
          "/sounds/quand tu appelles.wav",
        );
        outgoingRingtoneRef.current.loop = true;
        outgoingRingtoneRef.current.volume = 0.7;
      }
      outgoingRingtoneRef.current.play().catch((err) => {
        console.warn("Autoplay émetteur bloqué:", err);
      });
    } catch (e) {
      console.log("Audio émetteur non supporté");
    }
  }, []);

  const stopOutgoingRingtone = useCallback(() => {
    if (outgoingRingtoneRef.current) {
      outgoingRingtoneRef.current.pause();
      outgoingRingtoneRef.current.currentTime = 0;
    }
  }, []);

  // ✅ CORRECTION MAJEURE : Timer basé sur Date.now()
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    // On stocke le timestamp de début
    callStartTimeRef.current = Date.now();
    setCallDuration(0); // Reset visuel immédiat

    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        // Calcul précis de la durée écoulée
        const now = Date.now();
        const secondsElapsed = Math.floor(
          (now - callStartTimeRef.current) / 1000,
        );
        setCallDuration(secondsElapsed);
      }
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);
  }, []);

  // --- ACTIONS D'APPEL (Reste inchangé mais inclus pour complétude) ---
  const initiateCall = useCallback(
    async (
      conversationId,
      participants,
      type = "video",
      isGroup = false,
      groupName = "",
    ) => {
      if (!user) return;
      const socket = getSocket();
      if (!socket?.connected) {
        setCallError("Connexion perdue. Réessayez.");
        return;
      }

      try {
        setCallState("connecting");
        setCallType(type);
        setCallError(null);

        const tempCallId = generateCallId();
        const channel = `channel_${tempCallId}`;
        const myUid = generateNumericUid(user._id || user.id);

        const { data: tokenData } = await api.post("/agora/token", {
          channelName: channel,
          uid: myUid,
          isGroup,
        });

        const { data: callMessageData } = await api.post(
          "/agora/calls/initiate",
          {
            conversationId,
            callType: type,
            isGroup,
            participants: Array.isArray(participants)
              ? participants
              : [participants],
          },
        );

        const targetUserIds = Array.isArray(participants)
          ? participants.map((p) => (p._id || p.id || p).toString())
          : [(participants._id || participants.id || participants).toString()];

        setCurrentCallId(callMessageData.callId);
        setChannelName(channel);
        setAgoraToken(tokenData.token);

        setCallData({
          isGroup,
          name: isGroup
            ? groupName
            : participants.name || participants[0]?.name,
          participants: Array.isArray(participants)
            ? participants
            : [participants],
          profilePicture: !isGroup
            ? participants.profilePicture || participants[0]?.profilePicture
            : null,
          conversationId,
        });

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

        setCallState("ringing");
        setInCall(true);
        playOutgoingRingtone();
      } catch (error) {
        console.error("❌ Erreur initiation:", error);
        setCallError("Impossible de lancer l'appel");
        setCallState("idle");
        setInCall(false);
      }
    },
    [user, playOutgoingRingtone],
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user) return;
    const socket = getSocket();
    if (!socket?.connected) return;

    try {
      stopIncomingRingtone();
      stopOutgoingRingtone();
      setCallState("connecting");

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
      const myUid = generateNumericUid(user._id || user.id);

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
        name: isGroup ? groupName : from.name,
        profilePicture: from.profilePicture,
        participants: allParticipants,
        conversationId,
      });

      setInCall(true);
      setCallState("ongoing");
      setIncomingCall(null);

      socket.emit("call-answer", {
        callId,
        channelName: channel,
        userId: user._id || user.id,
      });

      startDurationTimer(); // ✅ Démarre le timer précis
    } catch (error) {
      console.error("❌ Erreur acceptation:", error);
      setCallError("Impossible de rejoindre l'appel");
      setCallState("idle");
      setInCall(false);
    }
  }, [
    incomingCall,
    user,
    stopIncomingRingtone,
    stopOutgoingRingtone,
    startDurationTimer,
  ]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    const socket = getSocket();

    try {
      await api.post(`/agora/calls/${incomingCall.callId}/decline`);
      if (socket) {
        socket.emit("call-decline", {
          callId: incomingCall.callId,
          reason: "declined",
        });
      }
    } catch (error) {
      console.error("Erreur refus:", error);
    }

    stopIncomingRingtone();
    setIncomingCall(null);
    setCallState("idle");
  }, [incomingCall, stopIncomingRingtone]);

  const endCall = useCallback(async () => {
    const socket = getSocket();
    stopIncomingRingtone();
    stopOutgoingRingtone();
    stopDurationTimer();

    if (currentCallId) {
      const isGroupCall = callData?.isGroup || incomingCall?.isGroup || false;
      if (socket) {
        if (isGroupCall) {
          socket.emit("call-leave", { callId: currentCallId });
        } else {
          socket.emit("call-end", { callId: currentCallId });
        }
      }

      try {
        const endpoint = isGroupCall ? "leave" : "end";
        await api.post(`/agora/calls/${currentCallId}/${endpoint}`, {
          reason: callState === "ongoing" ? "ended" : "cancelled",
        });
      } catch (error) {
        console.error("Erreur fin appel:", error);
      }
    }

    setInCall(false);
    setCallState("idle");
    setAgoraToken(null);
    setChannelName(null);
    setCallData(null);
    setCurrentCallId(null);
    setIncomingCall(null);
    setCallError(null);
  }, [
    currentCallId,
    callState,
    stopIncomingRingtone,
    stopOutgoingRingtone,
    stopDurationTimer,
    callData,
    incomingCall,
  ]);

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleIncomingCall = (data) => {
      if (inCall) {
        socket.emit("call-decline", { callId: data.callId, reason: "busy" });
        return;
      }
      setIncomingCall(data);
      setCallState("ringing");
      playIncomingRingtone();
    };

    const handleCallAnswered = () => {
      stopOutgoingRingtone();
      setCallState("ongoing");
      startDurationTimer(); // ✅ Démarre le timer pour l'appelant aussi
    };

    const handleCallEnded = () => {
      setCallState("ended");
      endCall();
    };

    const handleCallDeclined = (data) => {
      stopOutgoingRingtone();
      setCallError(
        data.reason === "busy" ? "Utilisateur occupé" : "Appel refusé",
      );
      setTimeout(endCall, 2000);
    };

    socket.on("call-incoming", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-declined", handleCallDeclined);

    // Ajout des listeners manquants pour la robustesse
    socket.on("call-cancelled", endCall);
    socket.on("call-timeout", () => {
      stopOutgoingRingtone();
      setCallError("Pas de réponse");
      setTimeout(endCall, 2000);
    });

    return () => {
      socket.off("call-incoming", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-declined", handleCallDeclined);
      socket.off("call-cancelled");
      socket.off("call-timeout");
    };
  }, [
    user,
    inCall,
    playIncomingRingtone,
    stopOutgoingRingtone,
    startDurationTimer,
    endCall,
  ]);

  return (
    <CallContext.Provider
      value={{
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        inCall,
        callState,
        callDuration,
        callError,
        generateNumericUid,
      }}
    >
      {children}
      {/* Modal appel entrant */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg animate-pulse">
                <img
                  src={
                    incomingCall.from?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${incomingCall.from?.name}`
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-1 dark:text-white">
              {incomingCall.isGroup
                ? incomingCall.groupName
                : incomingCall.from?.name}
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Appel {incomingCall.callType === "video" ? "vidéo" : "audio"}{" "}
              entrant...
            </p>
            <div className="flex gap-8 w-full justify-center">
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 animate-bounce"
              >
                <Phone className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Composant vidéo */}
      {inCall && agoraToken && channelName && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={generateNumericUid(user?._id || user?.id)}
          callType={callType}
          callData={callData}
          onHangup={endCall}
          callDuration={callDuration}
        />
      )}
    </CallContext.Provider>
  );
};
