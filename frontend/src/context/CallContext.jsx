"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import { AuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { getSocket } from "@/services/socket";
import api from "@/lib/api";
import { PhoneIncoming, PhoneOff, Phone, Video } from "lucide-react";

// Import du composant Vidéo (qui gère aussi l'audio)
const VideoCall = dynamic(() => import("@/components/Chat/VideoCall"), {
  ssr: false,
});

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { playMessageSound } = useNotifications();

  // --- ÉTATS GLOBAUX ---
  const [inCall, setInCall] = useState(false);
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video"); // 'video' | 'audio'

  const [incomingCall, setIncomingCall] = useState(null); // L'appel qu'on reçoit
  const [callPartnerId, setCallPartnerId] = useState(null); // Avec qui on parle

  // 1. NETTOYAGE GLOBAL (Fin d'appel)
  const endCallCleanup = useCallback(
    (emitSocket = true) => {
      console.log("📞 Fin de l'appel (Cleanup context)");

      if (emitSocket) {
        const socket = getSocket();
        if (socket) {
          // On priorise l'ID du partenaire actif, sinon l'appelant entrant
          const targetId = callPartnerId || incomingCall?.from;
          if (targetId) {
            socket.emit("end-call", { to: targetId });
          }
        }
      }

      // Reset total
      setInCall(false);
      setAgoraToken(null);
      setChannelName(null);
      setIncomingCall(null);
      setCallPartnerId(null);
      setCallType("video"); // Reset défaut
    },
    [callPartnerId, incomingCall]
  );

  // 2. LANCER UN APPEL (Appelant)
  const initiateCall = async (channel, contactId, type = "video") => {
    if (!user) return;

    try {
      // On définit le type tout de suite
      setCallType(type);
      setCallPartnerId(contactId);

      // Token
      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: 0,
      });
      setAgoraToken(data.token);
      setChannelName(channel);
      setInCall(true); // Affiche le composant VideoCall

      // Signal Socket
      const socket = getSocket();
      socket.emit("call-user", {
        userToCallId: contactId,
        signalData: { channelName: channel, callType: type }, // ✅ On envoie le type !
        fromUserId: user._id || user.id,
        fromUserName: user.name || "Utilisateur",
      });
    } catch (error) {
      console.error("Erreur appel:", error);
      alert("Impossible de lancer l'appel.");
      endCallCleanup(false);
    }
  };

  // 3. RECEVOIR UN APPEL (Récepteur - Socket)
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleCallMade = (data) => {
      if (inCall) {
        // Occupé ? On pourrait émettre un signal "busy"
        return;
      }
      console.log("📞 Appel reçu de type :", data.signal.callType);
      setIncomingCall(data);
      playMessageSound();
    };

    const handleCallEnded = () => {
      console.log("📴 L'autre a raccroché.");
      endCallCleanup(false); // Ne pas renvoyer le signal
    };

    const handleCallAnswered = (data) => {
      // Optionnel : L'appelant reçoit confirmation que ça a décroché
      console.log("Appel décroché");
    };

    socket.on("call-made", handleCallMade);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-answered", handleCallAnswered);

    return () => {
      socket.off("call-made", handleCallMade);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-answered", handleCallAnswered);
    };
  }, [user, inCall, endCallCleanup, playMessageSound]);

  // 4. ACCEPTER L'APPEL
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const channel = incomingCall.signal.channelName;
      const type = incomingCall.signal.callType || "video"; // ✅ Récupère le type reçu

      setCallType(type);
      setCallPartnerId(incomingCall.from);

      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: 0,
      });

      setAgoraToken(data.token);
      setChannelName(channel);
      setInCall(true); // Lance Agora
      setIncomingCall(null); // Ferme la modale

      const socket = getSocket();
      socket.emit("answer-call", {
        to: incomingCall.from,
        signal: { channelName: channel },
      });
    } catch (error) {
      console.error("Erreur acceptation:", error);
    }
  };

  // 5. REFUSER L'APPEL
  const rejectCall = () => {
    const socket = getSocket();
    if (incomingCall) socket.emit("end-call", { to: incomingCall.from });
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider value={{ initiateCall, inCall }}>
      {children}

      {/* === MODALE APPEL ENTRANT (Globale) === */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-white/10">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
              {incomingCall.signal?.callType === "audio" ? (
                <PhoneIncoming className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <Video className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              {incomingCall.signal?.callType === "audio"
                ? "Appel Audio"
                : "Appel Vidéo"}{" "}
              entrant...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {incomingCall.name}
              </span>{" "}
              vous appelle.
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={rejectCall}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
              >
                <PhoneOff size={20} /> Refuser
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/20"
              >
                <Phone size={20} /> Accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === COMPOSANT AGORA (Global & Miniaturisable) === */}
      {inCall && agoraToken && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={null}
          callType={callType} // ✅ Passe le bon type (audio ou video)
          onHangup={() => endCallCleanup(true)}
        />
      )}
    </CallContext.Provider>
  );
};
