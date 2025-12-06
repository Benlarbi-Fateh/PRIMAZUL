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
const GroupVideoCall = dynamic(() => import("@/components/Chat/GroupVideoCall"), { ssr: false });

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { playMessageSound } = useNotifications();

  // --- ÉTATS GLOBAUX ---
  const [inCall, setInCall] = useState(false);
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video"); // 'video' | 'audio'
   const [isGroupCall, setIsGroupCall] = useState(false); // 🆕 Est-ce un groupe ?

  const [incomingCall, setIncomingCall] = useState(null); // L'appel qu'on reçoit
  const [callPartnerId, setCallPartnerId] = useState(null); // Avec qui on parle

 // 1️⃣ NETTOYAGE GLOBAL
  // ============================================
  const endCallCleanup = useCallback(
    (emitSocket = true) => {
      console.log("📞 Fin de l'appel (Cleanup context)");

      if (emitSocket) {
        const socket = getSocket();
        if (socket) {
          if (isGroupCall) {
            // Appel de groupe : Notifier tous les participants
            console.log("📢 Notification de fin d'appel de groupe");
            socket.emit("end-group-call", { conversationId: channelName });
          } else {
            // Appel simple : Notifier le partenaire
            const targetId = callPartnerId || incomingCall?.from;
            if (targetId) {
              socket.emit("end-call", { to: targetId });
            }
          }
        }
      }

      // Reset total
      setInCall(false);
      setAgoraToken(null);
      setChannelName(null);
      setIncomingCall(null);
      setCallPartnerId(null);
      setCallType("video");
      setIsGroupCall(false);
    },
    [callPartnerId, incomingCall, channelName, isGroupCall]
  );
  // 🔧 CORRECTION #1: Accolade manquante fermée ici (votre code avait une erreur de syntaxe)



  // 2. LANCER UN APPEL (Appelant)
  const initiateCall = async (channel, contactId, type = "video") => {
    if (!user) return;

    try {
      // On définit le type tout de suite
      setCallType(type);
      setCallPartnerId(contactId);
      setIsGroupCall(false); // C'est un appel simple

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
        console.log("✅ Appel simple lancé:", { channel, type });
      // 🔧 CORRECTION #2: Ajout d'un log pour mieux déboguer
    } catch (error) {
      console.error("Erreur appel:", error);
       alert("Impossible de lancer l'appel: " + error.message);
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
 // ============================================
  //  FONCTION 2 : LANCER UN APPEL DE GROUPE 🆕
  // ============================================
  const initiateGroupCall = async (conversationId, participants, type = "video") => {
    if (!user) return;

    try {
      console.log(`📞 Lancement appel de groupe ${type} dans ${conversationId}`);
      console.log(`👥 Participants:`, participants);

      setCallType(type);
      setIsGroupCall(true); // C'est un appel de groupe
      setChannelName(conversationId);

      // 👮‍♂️ Demander un ticket au Backend
      const { data } = await api.post("/agora/token", {
        channelName: conversationId,
         uid: 0,
      });
       
      setAgoraToken(data.token);
      setInCall(true); // Affiche le composant GroupVideoCall

      // 📡 Prévenir TOUS les participants via Socket
      const socket = getSocket();
      socket.emit("call-group", {
        conversationId,
        signalData: { channelName: conversationId, callType: type },
        fromUserId: user._id || user.id,
        fromUserName: user.name || "Utilisateur",
        participants: participants.map(p => p._id || p), // Liste des IDs
         
      });

      console.log("✅ Signal de groupe envoyé à tous les participants");
    } catch (error) {
      console.error("❌ Erreur lors du lancement de l'appel de groupe:", error);
      alert("Impossible de lancer l'appel de groupe: " + error.message);
      endCallCleanup(false);
    }
  };


  // 4. ACCEPTER L'APPEL
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const channel = incomingCall.signal.channelName;
      const type = incomingCall.signal.callType || "video"; // ✅ Récupère le type reçu
      // 🆕 Détecter si c'est un appel de groupe
      const isGroup = incomingCall.conversationId !== undefined;

      console.log(`✅ Acceptation de l'appel ${isGroup ? "de groupe" : "simple"}`);
    
      setCallType(type);
      setIsGroupCall(isGroup);
       setChannelName(channel);
          if (!isGroup) {
        setCallPartnerId(incomingCall.from);
      }
        
    
      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: 0,
      });

      setAgoraToken(data.token);
      setInCall(true); // Lance Agora
      setIncomingCall(null); // Ferme la modale

      const socket = getSocket();
       if (isGroup) {
        // 🆕 Notifier que je rejoins le groupe
        socket.emit("join-group-call", {
          conversationId: channel,
          userId: user._id || user.id,
          userName: user.name || "Utilisateur",
        });
      } else {

      socket.emit("answer-call", {
        to: incomingCall.from,
        signal: { channelName: channel },
      });
    }
     console.log("✅ Appel accepté, composant vidéo ouvert");
   } catch (error) {
      console.error("Erreur acceptation:", error);
       alert("Impossible d'accepter l'appel: " + error.message);
    }
  };

  // 5. REFUSER L'APPEL
  const rejectCall = () => {
    const socket = getSocket();
    if (incomingCall && !incomingCall.conversationId){
       // Appel simple : prévenir l'autre
     socket.emit("end-call", { to: incomingCall.from });
    } // Pour les groupes, on ignore simplement (pas de notification)
    setIncomingCall(null);
  };

    // ============================================
  // 🎧 ÉCOUTEURS SOCKET (Actifs en permanence)
  // ============================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    // 📞 APPEL SIMPLE ENTRANT
    const handleCallMade = (data) => {
      if (inCall) {
        console.log("⚠️ Déjà en appel, appel simple ignoré");
        return;
      }
      console.log("📞 Appel simple reçu de", data.name);
      setIncomingCall(data);
      playMessageSound();
    };

    // 📞 APPEL DE GROUPE ENTRANT 🆕
    const handleGroupCallIncoming = (data) => {
      if (inCall) {
        console.log("⚠️ Déjà en appel, appel de groupe ignoré");
        return;
      }
      console.log("📞 Appel de groupe reçu de", data.name);
      setIncomingCall({ 
        ...data, 
        conversationId: data.conversationId // Marque comme groupe
      });
      playMessageSound();
    };

    // 📴 FIN D'APPEL SIMPLE
    const handleCallEnded = () => {
      console.log("📴 L'autre a raccroché (appel simple)");
      endCallCleanup(false); // Ne pas renvoyer de signal
    };

    // 📴 FIN D'APPEL DE GROUPE 🆕
    const handleGroupCallEnded = () => {
      console.log("📴 Appel de groupe terminé");
      endCallCleanup(false);
    };

    // 👤 NOUVEAU PARTICIPANT DANS LE GROUPE 🆕
    const handleUserJoinedGroup = (data) => {
      console.log("✅ Nouveau participant:", data.userName);
      // GroupVideoCall.jsx gère automatiquement l'ajout via Agora
    };

    // 👤 PARTICIPANT A QUITTÉ LE GROUPE 🆕
    const handleUserLeftGroup = (data) => {
      console.log("❌ Participant parti:", data.userId);
      // GroupVideoCall.jsx gère automatiquement le retrait via Agora
    };

    // 📡 Enregistrement des écouteurs
    socket.on("call-made", handleCallMade);
    socket.on("call-ended", handleCallEnded);
    socket.on("group-call-incoming", handleGroupCallIncoming); // 🆕
    socket.on("group-call-ended", handleGroupCallEnded); // 🆕
    socket.on("user-joined-group-call", handleUserJoinedGroup); // 🆕
    socket.on("user-left-group-call", handleUserLeftGroup); // 🆕

    // 🧹 Nettoyage à la déconnexion
    return () => {
      socket.off("call-made", handleCallMade);
      socket.off("call-ended", handleCallEnded);
      socket.off("group-call-incoming", handleGroupCallIncoming);
      socket.off("group-call-ended", handleGroupCallEnded);
      socket.off("user-joined-group-call", handleUserJoinedGroup);
      socket.off("user-left-group-call", handleUserLeftGroup);
    };
  }, [user, inCall, endCallCleanup, playMessageSound]);



  return (
    <CallContext.Provider value={{ initiateCall, initiateGroupCall ,inCall }}>
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
             {/* Titre */}
            <h3 className="text-xl font-bold mb-2 dark:text-white">
              {incomingCall.conversationId ? "Appel de groupe" : "Appel"} entrant
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {incomingCall.name}
               </span>
              {incomingCall.conversationId ? " lance un appel de groupe" : " vous appelle"}
            </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              {incomingCall.signal?.callType === "audio" ? "Appel audio" : "Appel vidéo"}
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
        isGroupCall ? (
          // 🆕 APPEL DE GROUPE : Grille de vidéos
          <GroupVideoCall
            channelName={channelName}
            token={agoraToken}
            uid={null}
            callType={callType}
            onHangup={() => endCallCleanup(true)}
          />
        ) : (
          // APPEL SIMPLE : 1 vidéo + PiP
          <VideoCall
            channelName={channelName}
            token={agoraToken}
            uid={null}
            callType={callType}
            onHangup={() => endCallCleanup(true)}
          />
        )
      )}
    </CallContext.Provider>
  );
};