// frontend/src/context/CallContext.js
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { AuthContext } from "@/context/AuthProvider";
import { getSocket } from "@/services/socket";
import api from "@/lib/api";
import { Phone, PhoneOff, Video, Users } from "lucide-react";

// Import dynamique pour éviter les erreurs SSR avec Agora
const VideoCall = dynamic(() => import("@/components/Chat/VideCall"), {
  ssr: false,
});

export const CallContext = createContext();

// Générer un UID numérique pour Agora (car Agora n'accepte pas les strings MongoDB)
// ✅ NOUVELLE VERSION (génère toujours le MÊME UID pour le même ID)
const generateNumericUid = (mongoId) => {
  if (!mongoId) {
    console.error("❌ generateNumericUid: mongoId manquant");
    return Math.floor(Math.random() * 100000);
  }
  
  const str = mongoId.toString();
  
  // Utiliser une fonction de hash stable
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32-bit
  }
  
  // S'assurer que c'est toujours positif et dans la limite d'Agora (2^32)
  const uid = Math.abs(hash) >>> 0;
  
  console.log(`🔢 UID généré: ${str.substring(0, 8)}... → ${uid}`);
  
  return uid;
};

// ============================================
// ALTERNATIVE SI ÇA NE MARCHE PAS :
// Utiliser directement les 8 derniers chiffres de l'ID MongoDB
// ============================================

const generateNumericUidAlternative = (mongoId) => {
  if (!mongoId) {
    return Math.floor(Math.random() * 100000);
  }
  
  const str = mongoId.toString();
  
  // Prendre les 8 derniers caractères et les convertir en nombre
  const lastChars = str.slice(-8);
  
  // Convertir en nombre hexadécimal puis en décimal
  const uid = parseInt(lastChars, 16) % 2147483647; // Max safe integer pour Agora
  
  console.log(`🔢 UID MongoDB: ${str} → ${uid}`);
  
  return uid;
};

// Générer un ID d'appel unique temporaire (le vrai viendra du backend)
const generateCallId = () => {
  return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // ============================================
  // ÉTATS
  // ============================================
  const [inCall, setInCall] = useState(false);
  const [callState, setCallState] = useState("idle"); // idle, ringing, connecting, ongoing, ended
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callData, setCallData] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState(null);
  const [agoraUid, setAgoraUid] = useState(null);
  // Refs pour gestion audio et timers
  const callStartTimeRef = useRef(null);
  const ringtoneRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // ============================================
  // GESTION SONNERIE & TIMER
  // ============================================
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("/sounds/ringtone.mp3");
        ringtoneRef.current.loop = true;
      }
      ringtoneRef.current.play().catch((err) => {
        console.warn("Autoplay bloqué par le navigateur:", err);
      });
    } catch (e) {
      console.log("Audio non supporté");
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    callStartTimeRef.current = Date.now();
    // Reset timer précédent si existant
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);

    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(
          Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        );
      }
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setCallDuration(0);
  }, []);

  // ============================================
  // 1. INITIER UN APPEL
  // ============================================
  const initiateCall = useCallback(
    async (
      conversationId,
      participants,
      type = "video",
      isGroup = false,
      groupName = ""
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

        // ID temporaire pour le channel Agora
        const tempCallId = generateCallId();
        const channel = `channel_${tempCallId}`;
        const myUid = generateNumericUid(user._id || user.id);
        setAgoraUid(myUid);

        // 1. Obtenir le token Agora
        const { data: tokenData } = await api.post("/agora/token", {
          channelName: channel,
          uid: myUid,
        });

        // 2. Créer le message d'appel via API (Backend)
        // ✅ CORRECTION : Utilisation de /agora/calls/initiate
        const { data: callMessageData } = await api.post(
          "/agora/calls/initiate",
          {
            conversationId,
            callType: type,
            isGroup,
            participants: Array.isArray(participants)
              ? participants
              : [participants],
          }
        );

        const targetUserIds = Array.isArray(participants)
          ? participants.map((p) => (p._id || p.id || p).toString())
          : [(participants._id || participants.id || participants).toString()];

        // 3. Mise à jour de l'état local
        setCurrentCallId(callMessageData.callId); // Utiliser l'ID généré par le backend
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

        // 4. Émettre l'appel via socket
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

        console.log(`📞 Appel initié: ${callMessageData.callId}`);
      } catch (error) {
        console.error("❌ Erreur initiation appel:", error);
        setCallError("Impossible de lancer l'appel");
        setCallState("idle");
        setInCall(false);
      }
    },
    [user]
  );

  // ============================================
  // 2. ACCEPTER UN APPEL
  // ============================================
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !user) return;

    const socket = getSocket();
    if (!socket?.connected) {
      setCallError("Connexion perdue");
      return;
    }

    try {
      stopRingtone();
      setCallState("connecting");

      const {
        callId,
        channelName: channel,
        callType: type,
        isGroup,
        groupName,
        from,
        conversationId,
        participants, // 🆕 Récupérer participants
         members,      // 🆕 Récupérer members
      } = incomingCall;
       console.log("✅ Acceptation avec participants:", participants || members);

      const myUid = generateNumericUid(user._id || user.id);
      setAgoraUid(myUid);

      // 1. Obtenir le token Agora
      const { data: tokenData } = await api.post("/agora/token", {
        channelName: channel,
        uid: myUid,
      });

      // 2. Notifier le backend
      // ✅ CORRECTION : Utilisation de /agora/calls/...
      await api.post(`/agora/calls/${callId}/answer`);

      
    // 🔥 CORRECTION : Construire la liste complète des participants
    let fullParticipantsList = [];
    
    if (participants && Array.isArray(participants)) {
      fullParticipantsList = [...participants];
    } else if (members && Array.isArray(members)) {
      fullParticipantsList = [...members];
    } else {
      // Fallback : au minimum l'initiateur
      fullParticipantsList = [from];
    }
    
    // AJOUT CRITIQUE : Ajouter VOUS-MÊME à la liste
    const meExists = fullParticipantsList.some(
      (p) => (p._id || p.id || p.userId) === (user._id || user.id)
    );
    
    if (!meExists) {
      fullParticipantsList.push({
        _id: user._id || user.id,
        id: user._id || user.id,
        name: user.name,
        profilePicture: user.profilePicture,
        email: user.email,
      });
      console.log("✅ Vous-même ajouté à la liste des participants");
    }
    
    console.log(`📊 Liste finale: ${fullParticipantsList.length} participants`);


      // 3. Mise à jour état local
      setCurrentCallId(callId);
      setChannelName(channel);
      setAgoraToken(tokenData.token);
      setCallType(type);
      setCallData({
        isGroup,
        name: isGroup ? groupName : from.name,
        profilePicture: from.profilePicture,
         participants: fullParticipantsList, //  Liste complète
         members: fullParticipantsList,      //  Liste complète
        conversationId,
      });

      // 4. Notifier via socket
      socket.emit("call-answer", { callId, channelName: channel });

      setCallState("ongoing");
      setInCall(true);
      setIncomingCall(null);

      startDurationTimer();

       console.log(`✅ Appel ${callId} accepté avec ${(participants || members || []).length} participants`);
    } catch (error) {
      console.error("❌ Erreur acceptation:", error);
      setCallError("Impossible de rejoindre l'appel");
      setCallState("idle");
      setIncomingCall(null);
    }
  }, [incomingCall, user, stopRingtone, startDurationTimer, generateNumericUid]);

  // ============================================
  // 3. REFUSER UN APPEL
  // ============================================
  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;

    const socket = getSocket();

    try {
      // Notifier le backend
      // ✅ CORRECTION : Utilisation de /agora/calls/...
      await api.post(`/agora/calls/${incomingCall.callId}/decline`);

      if (socket) {
        socket.emit("call-decline", {
          callId: incomingCall.callId,
          reason: "declined",
        });
      }
    } catch (error) {
      console.error("Erreur refus appel:", error);
    }

    stopRingtone();
    setIncomingCall(null);
    setCallState("idle");

    console.log(`❌ Appel refusé`);
  }, [incomingCall, stopRingtone]);
  

  // ============================================
  // 4. TERMINER UN APPEL
  // ============================================
  const endCall = useCallback(async () => {
    const socket = getSocket();

    // Arrêter timers et sons immédiatement
    stopRingtone();
    stopDurationTimer();

    if (currentCallId) {
      // Notifier socket
      if (socket) {
        // Si c'est un groupe, on quitte, sinon on termine
        if (callData?.isGroup) {
          socket.emit("call-leave", { callId: currentCallId });
        } else {
          socket.emit("call-end", { callId: currentCallId });
        }
      }

      // Notifier backend
      try {
        const endpoint = callData?.isGroup ? "leave" : "end";
        // ✅ CORRECTION : Utilisation de /agora/calls/...
        await api.post(`/agora/calls/${currentCallId}/${endpoint}`, {
          reason: callState === "ongoing" ? "ended" : "cancelled",
        });
      } catch (error) {
        console.error("Erreur fin appel API:", error);
      }
    }

    // Reset complet de l'état
    setInCall(false);
    setCallState("idle");
    setAgoraToken(null);
    setChannelName(null);
    setCallData(null);
    setCurrentCallId(null);
    setIncomingCall(null);
    setCallError(null);
    setAgoraUid(null);
   

    console.log(`🛑 Appel terminé localement`);
  }, [currentCallId, callState, stopRingtone, stopDurationTimer, callData]);

  // ============================================
  // ÉCOUTEURS SOCKET
  // ============================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // Appel entrant
    const handleIncomingCall = (data) => {
      if (inCall) {
        // Déjà en appel, refuser automatiquement
        socket.emit("call-decline", { callId: data.callId, reason: "busy" });
        return;
      }

      console.log("📱 Appel entrant:", data);
       // 🆕 CORRECTION : Logs détaillés
  console.log("  - CallId:", data.callId);
  console.log("  - Type:", data.callType, data.isGroup ? "(groupe)" : "(1-1)");
  console.log("  - Participants reçus:", data.participants);
  console.log("  - Members reçus:", data.members);
  console.log("  - From:", data.from);


     setIncomingCall({
    ...data,
    // S'assurer que participants est toujours un tableau
    participants: data.participants || data.members || [data.from],
    members: data.members || data.participants || [data.from],
  });
  

      setCallState("ringing");
      playRingtone();
    };

    // Appel répondu (pour l'initiateur)
    const handleCallAnswered = (data) => {
      console.log("✅ Appel répondu:", data);
      setCallState("ongoing");
      startDurationTimer();
      
  // Cas 2 : un NOUVEAU participant rejoint un appel de groupe
     const { newParticipant } = data;
  if (newParticipant) {
    console.log("👥 Nouveau participant détecté:", newParticipant);

    setCallData((prev) => {
      if (!prev) return prev;

      const alreadyExists = (prev.participants || []).some(
        (p) => (p._id || p.id) === (newParticipant._id || newParticipant.id)
      );

      if (alreadyExists) {
        console.log("ℹ️ Participant déjà présent, ignoré");
        return prev;
      }

      const updatedParticipants = [
        ...(prev.participants || []),
        newParticipant,
      ];

      return {
        ...prev,
        participants: updatedParticipants,
        members: updatedParticipants,
      };
    });
  }
};
   

    // Appel refusé
    const handleCallDeclined = (data) => {
      console.log("❌ Appel refusé:", data);
      if (data.reason === "busy") {
        setCallError("L'utilisateur est déjà en appel");
      } else {
        setCallError("Appel refusé");
      }
      setTimeout(endCall, 2000); // Laisser le temps de voir l'erreur
    };

    // Appel terminé par l'autre
    const handleCallEnded = (data) => {
      console.log("🛑 Appel terminé par distant:", data);
      setCallState("ended");
      endCall();
    };

    // Timeout (pas de réponse)
    const handleCallTimeout = (data) => {
      console.log("⏰ Appel sans réponse:", data);
      setCallError("Pas de réponse");
      setTimeout(endCall, 2000);
    };

    // Appel manqué (si reçu sur un autre appareil ou annulé)
    const handleCallMissed = (data) => {
      console.log("📵 Appel manqué/annulé:", data);
      stopRingtone();
      setIncomingCall(null);
      setCallState("idle");
    };

    // Erreur
    const handleCallError = (data) => {
      console.error("❌ Erreur appel socket:", data);
      setCallError(data.error || "Erreur d'appel");
    };

    socket.on("call-incoming", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("call-declined", handleCallDeclined);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-timeout", handleCallTimeout);
    socket.on("call-missed", handleCallMissed);
    socket.on("call-error", handleCallError);

    return () => {
      socket.off("call-incoming", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("call-declined", handleCallDeclined);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-timeout", handleCallTimeout);
      socket.off("call-missed", handleCallMissed);
      socket.off("call-error", handleCallError);
    };
  }, [user, inCall, playRingtone, stopRingtone, startDurationTimer, endCall]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      stopRingtone();
      stopDurationTimer();
    };
  }, [stopRingtone, stopDurationTimer]);
  // ============================================
// HOOK DE DEBUG - À AJOUTER DANS CallContext.js
// ============================================

// 1️⃣ Ce useEffect s'exécute quand le user change
useEffect(() => {
  // 2️⃣ Récupérer la connexion socket
  const socket = getSocket();
  
  // 3️⃣ Si pas de socket ou pas d'utilisateur, arrêter
  if (!socket || !user) return;

  // ============================================
  // PARTIE 1 : Afficher les infos de connexion
  // ============================================
  console.log('\n🐛 === DEBUG SOCKET CALL CONTEXT ===');
  console.log('Socket connecté:', socket.connected);    // true ou false
  console.log('User ID:', user._id || user.id);         // Votre ID utilisateur
  console.log('Socket ID:', socket.id);                 // ID de la connexion
  
  // ============================================
  // PARTIE 2 : Espionner les ENVOIS (emit)
  // ============================================
  // Sauvegarder la fonction emit originale
  const originalEmit = socket.emit.bind(socket);
  
  // Remplacer socket.emit par une version qui LOG
  socket.emit = function(event, ...args) {
    // Si l'événement commence par "call-" (call-initiate, call-answer, etc.)
    if (event.startsWith('call-')) {
      // Afficher dans la console ce qu'on envoie
      console.log(`📤 EMIT: ${event}`, args[0]);
    }
    // Appeler la vraie fonction emit
    return originalEmit(event, ...args);
  };

  // ============================================
  // PARTIE 3 : Espionner les RÉCEPTIONS (on)
  // ============================================
  // Liste de tous les événements d'appel à surveiller
  const eventsToLog = [
    'call-incoming',   // Appel entrant
    'call-answered',   // Appel répondu
    'call-declined',   // Appel refusé
    'call-ended',      // Appel terminé
    'call-timeout',    // Appel sans réponse
    'call-missed',     // Appel manqué
    'call-error'       // Erreur d'appel
  ];

  // Pour chaque événement, créer un listener qui LOG
  eventsToLog.forEach(event => {
    socket.on(event, (data) => {
      // Afficher dans la console ce qu'on reçoit
      console.log(`📥 RECEIVE: ${event}`, data);
    });
  });

  console.log('==============================\n');

  // ============================================
  // PARTIE 4 : Cleanup (nettoyage)
  // ============================================
  return () => {
    // Quand le composant se démonte, retirer tous les listeners
    eventsToLog.forEach(event => socket.off(event));
  };
}, [user]); // ⬅️ Se relance quand user change

// ⚠️ IMPORTANT : Ce code est pour le DEBUG uniquement
// Une fois que tout fonctionne, commentez-le ou retirez-le

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

      {/* ============================================ */}
      {/* MODAL APPEL ENTRANT */}
      {/* ============================================ */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-white/10">
            {/* Avatar animé */}
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg animate-pulse">
                {incomingCall.from?.profilePicture ? (
                  <img
                    src={incomingCall.from.profilePicture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {incomingCall.isGroup ? (
                      <Users className="w-12 h-12 text-white" />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {(incomingCall.from?.name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Icône type d'appel */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900">
                {incomingCall.callType === "video" ? (
                  <Video className="w-5 h-5 text-white" />
                ) : (
                  <Phone className="w-5 h-5 text-white" />
                )}
              </div>
            </div>

            {/* Infos */}
            <h3 className="text-xl font-bold mb-1 dark:text-white text-center">
              {incomingCall.isGroup
                ? incomingCall.groupName
                : incomingCall.from?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Appel {incomingCall.callType === "video" ? "vidéo" : "audio"}{" "}
              entrant...
            </p>

            {/* Boutons */}
            <div className="flex gap-6 w-full justify-center">
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce"
              >
                <Phone className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* COMPOSANT APPEL VIDÉO */}
      {/* ============================================ */}
      {inCall && agoraToken && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={agoraUid}
          callType={callType}
          callData={callData}
          callState={callState}
          callDuration={callDuration}
          callError={callError}
          onHangup={endCall}
        />
      )}
    </CallContext.Provider>
  );
};
