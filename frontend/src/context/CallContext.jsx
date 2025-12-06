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
  const [callPartnerIds, setCallPartnerIds] = useState([]);

  // État pour appels groupe
  const [groupCallData, setGroupCallData] = useState({
    channelName: null,
    participants: [],
    isGroupCall: false,
    groupName: null,
  });

  // --- CLEANUP ---
  const endCallCleanup = useCallback(
    (emitSocket = true) => {
      console.log("📞 Fin de l'appel (Cleanup context)");

      setInCall((prevInCall) => {
        if (emitSocket && prevInCall) {
          const socket = getSocket();
          if (socket) {
            setGroupCallData((prevGroupData) => {
              if (prevGroupData.isGroupCall) {
                socket.emit("user-left-group", {
                  channelName: prevGroupData.channelName,
                  userId: user._id || user.id,
                });
              } else {
                setCallPartnerIds((prevPartnerIds) => {
                  const targetId = prevPartnerIds[0];
                  if (targetId) {
                    socket.emit("end-call", { to: targetId });
                  }
                  return prevPartnerIds;
                });
              }
              return prevGroupData;
            });
          }
        }
        return false;
      });

      setAgoraToken(null);
      setChannelName(null);
      setIncomingCall(null);
      setCallPartnerIds([]);
      setGroupCallData({
        channelName: null,
        participants: [],
        isGroupCall: false,
        groupName: null,
      });
      setCallType("video");
    },
    [user]
  );

  // --- LANCER UN APPEL ---
  const initiateCall = useCallback(
    async (
      channel,
      contactIdOrIds,
      type = "video",
      groupName = null,
      conversationIdForCall = null
    ) => {
      if (!user) return;

      try {
        setCallType(type);

        const isGroup = Array.isArray(contactIdOrIds);
        const partnerIds = isGroup ? contactIdOrIds : [contactIdOrIds];

        if (isGroup) {
          // APPEL GROUPE
          setGroupCallData({
            channelName: channel,
            participants: [user._id || user.id, ...partnerIds],
            isGroupCall: true,
            groupName: groupName || "Appel Groupe",
          });

          const { data } = await api.post("/agora/token", {
            channelName: channel,
            uid: 0,
          });
          setAgoraToken(data.token);
          setChannelName(channel);
          setInCall(true);

          const socket = getSocket();
          socket.emit("group-call-initiated", {
            channelName: channel,
            callType: type,
            initiator: user._id || user.id,
            initiatorName: user.name || "Utilisateur",
            participantIds: partnerIds,
            groupName: groupName || "Appel Groupe",
          });
        } else {
          // APPEL 1-to-1
          setCallPartnerIds([contactIdOrIds]);

          const { data } = await api.post("/agora/token", {
            channelName: channel,
            uid: 0,
          });
          setAgoraToken(data.token);
          setChannelName(channel);
          setInCall(true);

          const socket = getSocket();
          socket.emit("call-user", {
            userToCallId: contactIdOrIds,
            signalData: { channelName: channel, callType: type },
            fromUserId: user._id || user.id,
            fromUserName: user.name || "Utilisateur",
            conversationId: conversationIdForCall, // ✅ Passe le conversationId
          });
        }
      } catch (error) {
        console.error("Erreur appel:", error);
        alert("Impossible de lancer l'appel.");
        endCallCleanup(false);
      }
    },
    [user, endCallCleanup]
  );

  // --- RECEVOIR UN APPEL ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleCallMade = (data) => {
      if (inCall) return;
      console.log("📞 Appel reçu de type :", data.signal.callType);
      setIncomingCall(data);
      playMessageSound();
    };

    const handleGroupCallIncoming = (data) => {
      if (inCall) return;
      console.log("👥 Appel groupe reçu:", data.groupName);
      setIncomingCall({
        ...data,
        isGroupCall: true,
        signal: { callType: data.callType, channelName: data.channelName },
      });
      playMessageSound();
    };

    const handleCallEnded = () => {
      console.log("📴 L'autre a raccroché.");
      endCallCleanup(false);
    };

    const handleUserLeftGroup = (data) => {
      console.log(`👤 ${data.userId} a quitté le groupe`);
      setGroupCallData((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p !== data.userId),
      }));
    };

    socket.on("call-made", handleCallMade);
    socket.on("group-call-incoming", handleGroupCallIncoming);
    socket.on("call-ended", handleCallEnded);
    socket.on("user-left-group", handleUserLeftGroup);

    return () => {
      socket.off("call-made", handleCallMade);
      socket.off("group-call-incoming", handleGroupCallIncoming);
      socket.off("call-ended", handleCallEnded);
      socket.off("user-left-group", handleUserLeftGroup);
    };
  }, [user, inCall, endCallCleanup, playMessageSound]);

  // --- ACCEPTER APPEL ---
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      const channel = incomingCall.signal.channelName;
      const type = incomingCall.signal.callType || "video";

      setCallType(type);

      if (incomingCall.isGroupCall) {
        setGroupCallData({
          channelName: channel,
          participants: incomingCall.participants || [],
          isGroupCall: true,
          groupName: incomingCall.groupName,
        });
      } else {
        setCallPartnerIds([incomingCall.from]);
      }

      const { data } = await api.post("/agora/token", {
        channelName: channel,
        uid: 0,
      });

      setAgoraToken(data.token);
      setChannelName(channel);
      setInCall(true);
      setIncomingCall(null);

      const socket = getSocket();
      if (incomingCall.isGroupCall) {
        socket.emit("group-call-accepted", {
          channelName: channel,
          userId: user._id || user.id,
        });
      } else {
        socket.emit("answer-call", {
          to: incomingCall.from,
          signal: { channelName: channel },
        });
      }
    } catch (error) {
      console.error("Erreur acceptation:", error);
    }
  }, [incomingCall, user]);

  // --- REFUSER APPEL ---
  const rejectCall = useCallback(() => {
    const socket = getSocket();
    if (incomingCall) {
      if (incomingCall.isGroupCall) {
        socket.emit("group-call-rejected", {
          channelName: incomingCall.signal.channelName,
          userId: user._id || user.id,
        });
      } else {
        socket.emit("end-call", { to: incomingCall.from });
      }
    }
    setIncomingCall(null);
  }, [incomingCall, user]);

  return (
    <CallContext.Provider
      value={{ initiateCall, inCall, acceptCall, rejectCall, endCallCleanup }}
    >
      {children}

      {/* === MODALE APPEL ENTRANT === */}
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
              {incomingCall.isGroupCall ? "👥 Appel Groupe" : "Appel"}
              {incomingCall.signal?.callType === "audio"
                ? " Audio"
                : " Vidéo"}{" "}
              entrant...
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
              {incomingCall.isGroupCall ? (
                <>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {incomingCall.groupName || "Appel Groupe"}
                  </span>
                  <br />
                  <span className="text-sm">
                    Lancé par{" "}
                    <span className="font-semibold">
                      {incomingCall.initiatorName}
                    </span>
                  </span>
                </>
              ) : (
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {incomingCall.name}
                </span>
              )}{" "}
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

      {/* === COMPOSANT AGORA === */}
      {inCall && agoraToken && (
        <VideoCall
          channelName={channelName}
          token={agoraToken}
          uid={null}
          callType={callType}
          onHangup={() => endCallCleanup(true)}
        />
      )}
    </CallContext.Provider>
  );
};
