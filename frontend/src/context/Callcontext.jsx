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
import { AuthContext } from "@/context/AuthProvider"; // Vérifie si c'est AuthContext ou AuthProvider selon ta branche
// ❌ SUPPRIME : import { useNotifications } from "@/context/NotificationsContext";
import { getSocket } from "@/services/socket";
import api from "@/lib/api";
import { PhoneIncoming, PhoneOff, Phone, Video, Users } from "lucide-react";

const VideoCall = dynamic(() => import("@/components/Chat/VideCall"), {
  ssr: false,
});

export const CallContext = createContext();

const generateNumericUid = (str) => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // ✅ REMPLACE useNotifications par ça :
  const playMessageSound = () => {
    // Tu peux remettre ton son ici plus tard
    console.log("🎵 Dring Dring !");
    try {
      const audio = new Audio("/sounds/ringtone.mp3"); // Assure-toi d'avoir un fichier son
      audio.play().catch((e) => console.log("Audio bloqué par le navigateur"));
    } catch (e) {}
  };

  // ... (Le reste du code reste exactement le même que je t'ai donné avant)
  const [inCall, setInCall] = useState(false);
  // ... tout le reste de la logique ...

  // Je te remets le début pour être sûr
  const [agoraToken, setAgoraToken] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [callType, setCallType] = useState("video");
  const [incomingCall, setIncomingCall] = useState(null);
  const [callData, setCallData] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const startTimeRef = useRef(null);
  const isInitiatorRef = useRef(false);

  const endCallCleanup = useCallback(
    async (emitSocket = true) => {
      // ... (Code identique au précédent message)
      if (isInitiatorRef.current && currentConversationId && user) {
        const endTime = Date.now();
        const duration = startTimeRef.current
          ? Math.round((endTime - startTimeRef.current) / 1000)
          : 0;
        const status = startTimeRef.current ? "ended" : "missed";
        try {
          await api.post("/messages", {
            conversationId: currentConversationId,
            type: "call",
            callDetails: { status, duration, callType },
          });
        } catch (error) {
          console.error("Erreur save:", error);
        }
      }

      if (emitSocket) {
        const socket = getSocket();
        if (socket) {
          const targetId =
            incomingCall?.from || (callData?._id ? callData._id : null);
          if (targetId && !callData?.isGroup) {
            socket.emit("end-call", { to: targetId });
          }
        }
      }

      setInCall(false);
      setAgoraToken(null);
      setChannelName(null);
      setIncomingCall(null);
      setCallData(null);
      setCallType("video");
      setCurrentConversationId(null);
      startTimeRef.current = null;
      isInitiatorRef.current = false;
    },
    [callData, incomingCall, currentConversationId, callType, user]
  );

  const initiateCall = async (
    channel,
    participantsOrContact,
    type = "video",
    isGroup = false,
    groupName = "",
    convId = null
  ) => {
    // ... (Copie le code initiateCall du message précédent)
    if (!user) return;
    try {
      setCallType(type);
      setCurrentConversationId(convId);
      isInitiatorRef.current = true;
      startTimeRef.current = null;
      if (isGroup) {
        setCallData({
          isGroup: true,
          name: groupName,
          participants: participantsOrContact,
        });
      } else {
        setCallData(participantsOrContact);
      }
      const myNumericUid = generateNumericUid(user._id || user.id);
      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: myNumericUid,
      });
      setAgoraToken(data.token);
      setChannelName(channel);
      setInCall(true);
      const socket = getSocket();
      if (isGroup) {
        participantsOrContact.forEach((p) => {
          if (p._id !== user._id) {
            socket.emit("call-user", {
              userToCallId: p._id,
              signalData: {
                channelName: channel,
                callType: type,
                isGroup: true,
                groupName,
                callerName: user.name,
                callerImage: user.profilePicture,
                participants: [user, ...participantsOrContact],
                conversationId: convId,
              },
              fromUserId: user._id || user.id,
              fromUserName: user.name || "Utilisateur",
            });
          }
        });
      } else {
        const targetId = participantsOrContact._id || participantsOrContact.id;
        if (targetId) {
          socket.emit("call-user", {
            userToCallId: targetId,
            signalData: {
              channelName: channel,
              callType: type,
              callerName: user.name,
              callerImage: user.profilePicture,
              conversationId: convId,
            },
            fromUserId: user._id || user.id,
            fromUserName: user.name || "Utilisateur",
          });
        }
      }
    } catch (error) {
      console.error("Erreur appel:", error);
      alert("Impossible de lancer l'appel.");
      endCallCleanup(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;
    const handleCallMade = (data) => {
      if (inCall) return;
      setIncomingCall(data);
      playMessageSound();
    };
    const handleCallEnded = () => {
      endCallCleanup(false);
    };
    const handleCallAnswered = () => {
      if (isInitiatorRef.current) startTimeRef.current = Date.now();
    };
    socket.on("call-made", handleCallMade);
    socket.on("call-ended", handleCallEnded);
    socket.on("answer-call", handleCallAnswered);
    return () => {
      socket.off("call-made", handleCallMade);
      socket.off("call-ended", handleCallEnded);
      socket.off("answer-call", handleCallAnswered);
    };
  }, [user, inCall, endCallCleanup]); // Retire playMessageSound des deps

  const acceptCall = async () => {
    // ... (Copie acceptCall du message précédent)
    if (!incomingCall) return;
    try {
      const {
        channelName,
        callType: type,
        isGroup,
        groupName,
        participants,
        conversationId,
      } = incomingCall.signal;
      setCallType(type || "video");
      isInitiatorRef.current = false;
      setCurrentConversationId(conversationId);
      const myNumericUid = generateNumericUid(user._id || user.id);
      if (isGroup) {
        setCallData({
          isGroup: true,
          name: groupName || "Groupe",
          participants: participants || [],
        });
      } else {
        setCallData({
          _id: incomingCall.from,
          name: incomingCall.signal.callerName || incomingCall.name,
          profilePicture: incomingCall.signal.callerImage || null,
        });
      }
      const { data } = await api.post("/agora/token", {
        channelName: channelName,
        uid: myNumericUid,
      });
      setAgoraToken(data.token);
      setChannelName(channelName);
      setInCall(true);
      setIncomingCall(null);
      const socket = getSocket();
      socket.emit("answer-call", {
        to: incomingCall.from,
        signal: { channelName: channelName },
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
    <CallContext.Provider value={{ initiateCall, inCall, generateNumericUid }}>
      {children}
      {/* ... (Copie le JSX de la Modale et du VideoCall du message précédent) ... */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 border border-white/10">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
              {incomingCall.signal?.isGroup ? (
                <Users className="w-10 h-10 text-purple-600 dark:text-purple-400" />
              ) : (
                <Video className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h3 className="text-xl font-bold mb-1 dark:text-white">
              {incomingCall.signal?.isGroup
                ? incomingCall.signal.groupName
                : incomingCall.name}
            </h3>
            <div className="flex gap-4 w-full mt-6">
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

      {inCall && agoraToken && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={generateNumericUid(user._id || user.id)}
          callType={callType}
          callData={callData}
          onHangup={() => endCallCleanup(true)}
        />
      )}
    </CallContext.Provider>
  );
};
