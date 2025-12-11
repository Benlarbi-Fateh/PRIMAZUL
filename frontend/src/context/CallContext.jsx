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
import { PhoneIncoming, PhoneOff, Phone, Video, Users } from "lucide-react";

const VideoCall = dynamic(() => import("@/components/Chat/VideoCall"), {
  ssr: false,
});

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { playMessageSound } = useNotifications();

  // --- ÉTATS ---
  const [inCall, setInCall] = useState(false);
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video");
  const [incomingCall, setIncomingCall] = useState(null);

  // ✅ MODIFIÉ : Peut stocker un contact unique OU des infos de groupe
  const [callData, setCallData] = useState(null);

  // 1. NETTOYAGE
  const endCallCleanup = useCallback(
    (emitSocket = true) => {
      const socket = getSocket();

      if (emitSocket && socket) {
        // Si c'était un appel entrant, on refuse
        if (incomingCall) {
          socket.emit("end-call", { to: incomingCall.from });
        }
        // Si c'était un appel de groupe (on est l'initiateur ou participant)
        else if (callData?.isGroup) {
          // Dans un groupe, on quitte juste, on ne tue pas l'appel pour les autres
          // Mais si on veut prévenir, on peut émettre un event 'leave-call'
        }
        // Si c'était un P2P
        else if (callData?._id) {
          socket.emit("end-call", { to: callData._id });
        }
      }

      setInCall(false);
      setAgoraToken(null);
      setChannelName(null);
      setIncomingCall(null);
      setCallData(null);
      setCallType("video");
    },
    [callData, incomingCall]
  );

  // 2. LANCER UN APPEL (P2P ou GROUPE)
  // participants = Tableau d'IDs si groupe, ou Objet Contact si P2P
  const initiateCall = async (
    channel,
    participantsOrContact,
    type = "video",
    isGroup = false,
    groupName = ""
  ) => {
    if (!user) return;

    try {
      setCallType(type);

      // On prépare les données d'affichage
      if (isGroup) {
        setCallData({
          isGroup: true,
          name: groupName,
          participants: participantsOrContact,
        });
      } else {
        setCallData(participantsOrContact); // C'est l'objet contact simple
      }

      // Token Agora
      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: 0,
      });
      setAgoraToken(data.token);
      setChannelName(channel);
      setInCall(true);

      const socket = getSocket();

      // 🚀 ENVOI DES SIGNAUX
      if (isGroup) {
        // Si Groupe : On boucle sur tous les IDs pour les sonner
        // (participantsOrContact est ici un tableau d'IDs)
        participantsOrContact.forEach((participantId) => {
          if (participantId !== user._id) {
            socket.emit("call-user", {
              userToCallId: participantId,
              signalData: {
                channelName: channel,
                callType: type,
                isGroup: true,
                groupName: groupName,
                callerName: user.name,
                callerImage: user.profilePicture,
              },
              fromUserId: user._id || user.id,
              fromUserName: user.name || "Utilisateur",
            });
          }
        });
      } else {
        // Si P2P
        socket.emit("call-user", {
          userToCallId: participantsOrContact._id,
          signalData: {
            channelName: channel,
            callType: type,
            callerName: user.name,
            callerImage: user.profilePicture,
          },
          fromUserId: user._id || user.id,
          fromUserName: user.name || "Utilisateur",
        });
      }
    } catch (error) {
      console.error("Erreur appel:", error);
      alert("Impossible de lancer l'appel.");
      endCallCleanup(false);
    }
  };

  // 3. RECEPTION APPEL
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleCallMade = (data) => {
      if (inCall) return;
      console.log("📞 Appel reçu :", data);
      setIncomingCall(data);
      playMessageSound();
    };

    const handleCallEnded = () => {
      // En P2P, si l'autre raccroche, ça coupe tout.
      // En Groupe, c'est plus complexe, mais pour l'instant on garde ça simple.
      console.log("📴 Fin d'appel reçue");
      endCallCleanup(false);
    };

    socket.on("call-made", handleCallMade);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("call-made", handleCallMade);
      socket.off("call-ended", handleCallEnded);
    };
  }, [user, inCall, endCallCleanup, playMessageSound]);

  // 4. ACCEPTER
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const channel = incomingCall.signal.channelName;
      const type = incomingCall.signal.callType || "video";
      const isGroup = incomingCall.signal.isGroup;

      setCallType(type);

      if (isGroup) {
        setCallData({
          isGroup: true,
          name: incomingCall.signal.groupName || "Groupe",
          participants: [], // On ne connaît pas forcément les autres IDs ici, mais ce n'est pas grave pour l'affichage
        });
      } else {
        setCallData({
          _id: incomingCall.from,
          name: incomingCall.signal.callerName || incomingCall.name,
          profilePicture: incomingCall.signal.callerImage || null,
        });
      }

      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: 0,
      });
      setAgoraToken(data.token);
      setChannelName(channel);
      setInCall(true);
      setIncomingCall(null);

      // On prévient l'appelant qu'on arrive (surtout utile en P2P)
      const socket = getSocket();
      socket.emit("answer-call", {
        to: incomingCall.from,
        signal: { channelName: channel },
      });
    } catch (error) {
      console.error("Erreur acceptation:", error);
    }
  };

  const rejectCall = () => {
    const socket = getSocket();
    if (incomingCall) socket.emit("end-call", { to: incomingCall.from });
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider value={{ initiateCall, inCall }}>
      {children}

      {/* MODALE APPEL ENTRANT */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-white/10">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
              {incomingCall.signal?.isGroup ? (
                <Users className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              ) : incomingCall.signal?.callType === "audio" ? (
                <PhoneIncoming className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <Video className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-1 dark:text-white">
              {incomingCall.signal?.isGroup
                ? incomingCall.signal.groupName
                : incomingCall.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center">
              {incomingCall.signal?.isGroup
                ? `Appel de groupe lancé par ${incomingCall.name}`
                : incomingCall.signal?.callType === "audio"
                ? "Appel Audio entrant..."
                : "Appel Vidéo entrant..."}
            </p>
            <div className="flex gap-4 w-full">
              <button
                onClick={rejectCall}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl flex justify-center gap-2 transition"
              >
                <PhoneOff /> Refuser
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl flex justify-center gap-2 transition"
              >
                <Phone /> Accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO CALL */}
      {inCall && agoraToken && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={null}
          callType={callType}
          callData={callData} // ✅ On passe l'objet générique (Groupe ou User)
          onHangup={() => endCallCleanup(true)}
        />
      )}
    </CallContext.Provider>
  );
};
