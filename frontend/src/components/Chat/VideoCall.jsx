"use client";
import { useEffect, useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  User,
  Minimize2,
  Maximize2,
  Clock,
  Wifi,
  Users,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export default function VideoCall({
  channelName,
  token,
  uid,
  onHangup,
  callType = "video",
  callData,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [users, setUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [ready, setReady] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoDiv = useRef(null);
  const mountedRef = useRef(false);

  // Helper pour trouver les infos
  const getParticipantInfo = (agoraUid) => {
    if (callData?.isGroup && Array.isArray(callData.participants)) {
      const found = callData.participants.find(
        (p) => String(p._id) === String(agoraUid)
      );
      if (found) return found;
    }
    if (!callData?.isGroup && callData) {
      return callData;
    }
    return null;
  };

  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => setCallDuration((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (users.length > 0) setIsConnected(true);
  }, [users]);

  useEffect(() => {
    setReady(true);
    mountedRef.current = true;

    const initAgora = async () => {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
          });
        }
        const client = clientRef.current;
        client.removeAllListeners();

        client.on("user-published", async (user, mediaType) => {
          if (String(client.uid) === String(user.uid)) return;
          await client.subscribe(user, mediaType);

          setUsers((prev) => {
            if (prev.find((u) => String(u.uid) === String(user.uid)))
              return prev;
            return [...prev, user];
          });

          if (mediaType === "audio") user.audioTrack.play();
        });

        client.on("user-unpublished", (user, mediaType) => {});

        client.on("user-left", (user) => {
          setUsers((prev) =>
            prev.filter((u) => String(u.uid) !== String(user.uid))
          );
        });

        if (client.connectionState === "DISCONNECTED") {
          await client.join(APP_ID, channelName, token, uid || null);
        }

        if (!localTracksRef.current.audio) {
          let audioTrack, videoTrack;
          if (callType === "video") {
            [audioTrack, videoTrack] =
              await AgoraRTC.createMicrophoneAndCameraTracks();
          } else {
            audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          }

          if (!mountedRef.current) {
            audioTrack.close();
            if (videoTrack) videoTrack.close();
            return;
          }

          localTracksRef.current = {
            audio: audioTrack,
            video: videoTrack || null,
          };

          if (callType === "video" && videoTrack && localVideoDiv.current) {
            localVideoDiv.current.innerHTML = "";
            videoTrack.play(localVideoDiv.current);
          }

          const tracks = [audioTrack];
          if (videoTrack) tracks.push(videoTrack);
          await client.publish(tracks);
        }
      } catch (error) {
        console.error("Erreur Agora:", error);
      }
    };

    const timer = setTimeout(() => initAgora(), 100);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callType]);

  const cleanup = async () => {
    if (localTracksRef.current.audio) {
      localTracksRef.current.audio.stop();
      localTracksRef.current.audio.close();
    }
    if (localTracksRef.current.video) {
      localTracksRef.current.video.stop();
      localTracksRef.current.video.close();
    }
    localTracksRef.current = { audio: null, video: null };
    if (clientRef.current) {
      try {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      } catch (e) {}
      clientRef.current = null;
    }
  };

  const toggleMic = async () => {
    if (localTracksRef.current.audio) {
      await localTracksRef.current.audio.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };
  const toggleCam = async () => {
    if (localTracksRef.current.video) {
      await localTracksRef.current.video.setEnabled(!camOn);
      setCamOn(!camOn);
    }
  };
  const handleHangup = async () => {
    await cleanup();
    onHangup();
  };

  const RemoteVideoPlayer = ({ user }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (user.videoTrack && ref.current) {
        ref.current.innerHTML = "";
        user.videoTrack.play(ref.current);
      }
    }, [user]);

    const info = getParticipantInfo(user.uid);
    const displayName =
      info?.name || `Utilisateur ${String(user.uid).slice(-4)}`;
    const displayImage = info?.profilePicture;

    return (
      <div
        className={`relative w-full h-full flex items-center justify-center overflow-hidden ${styles.videoBg}`}
      >
        <div ref={ref} className="w-full h-full object-cover"></div>
        {!user.videoTrack && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${styles.videoBg}`}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/10 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <span className="text-2xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <p className="mt-4 text-white/70 animate-pulse font-medium">
              Audio uniquement
            </p>
          </div>
        )}
        <div
          className={`absolute bottom-3 left-3 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-md border border-white/10 ${styles.badgeBg}`}
        >
          <User size={12} />
          <span className="text-xs font-bold">{displayName}</span>
        </div>
      </div>
    );
  };

  if (!ready) return null;

  // --- STYLES DYNAMIQUES ---
  const styles = {
    container: isDark ? "bg-slate-950/95" : "bg-gray-100/95",
    card: isDark
      ? "bg-slate-900 border-white/10"
      : "bg-white border-gray-200 shadow-2xl",
    textMain: isDark ? "text-white" : "text-gray-900",
    textSub: isDark ? "text-gray-400" : "text-gray-500",
    videoBg: isDark ? "bg-black" : "bg-gray-900",
    controlsBg: isDark
      ? "bg-black/60 border-white/10"
      : "bg-white/80 border-gray-200 shadow-lg",
    iconColor: isDark ? "text-white" : "text-gray-700",
    badgeBg: isDark
      ? "bg-black/60 text-white"
      : "bg-white/80 text-gray-800 shadow-sm",
  };

  // --- CALCUL DE LA GRILLE (Variable qui manquait) ---
  const totalUsers = users.length + 1;
  let gridLayout = "grid-cols-1";
  if (totalUsers === 2) gridLayout = "grid-cols-1 md:grid-cols-2";
  else if (totalUsers > 2 && totalUsers <= 4) gridLayout = "grid-cols-2";
  else if (totalUsers > 4) gridLayout = "grid-cols-2 md:grid-cols-3";

  // Classes conteneur
  const containerClass = isMinimized
    ? `fixed bottom-4 right-4 w-72 h-auto z-[9999] rounded-2xl shadow-2xl overflow-hidden border pointer-events-auto transition-all duration-300 hover:scale-105 ${styles.card}`
    : `fixed inset-0 z-[9999] backdrop-blur-md flex flex-col pointer-events-auto transition-all duration-300 ${styles.container}`;

  return (
    <div className={containerClass}>
      <div
        className={`relative flex flex-col overflow-hidden ${
          isMinimized
            ? "w-full h-full"
            : `w-full max-w-6xl h-[90vh] rounded-3xl border shadow-2xl ${styles.card}`
        }`}
      >
        {/* HEADER */}
        <div
          className={`absolute top-0 left-0 right-0 z-20 p-3 flex justify-between items-start ${
            isDark
              ? "bg-gradient-to-b from-black/80 to-transparent"
              : "bg-gradient-to-b from-white/90 to-transparent"
          }`}
        >
          <div
            className={`flex items-center gap-2 px-3 py-1 backdrop-blur rounded-full text-xs border border-white/10 ${styles.badgeBg}`}
          >
            {callData?.isGroup ? <Users size={14} /> : <Wifi size={14} />}
            <span className="font-bold">
              {callData?.isGroup ? callData.name : "Appel en cours"}
            </span>
            <span className="opacity-70 mx-1">|</span>
            <Clock size={12} />
            <span>
              {isConnected ? formatTime(callDuration) : "Connexion..."}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-2 rounded-full backdrop-blur transition border border-white/10 ${styles.badgeBg}`}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={18} />}
          </button>
        </div>

        {/* --- GRILLE PRINCIPALE --- */}
        <div
          className={`relative flex-1 p-2 overflow-auto ${
            isMinimized ? "h-40" : ""
          } ${isDark ? "bg-gray-900" : "bg-gray-100"}`}
        >
          {users.length > 0 ? (
            <div className={`grid gap-2 h-full ${gridLayout} auto-rows-fr`}>
              {/* MOI */}
              <div
                className={`relative rounded-xl overflow-hidden shadow-lg border ${
                  isDark ? "border-white/10" : "border-gray-300"
                } ${styles.videoBg}`}
              >
                {callType === "video" ? (
                  <div
                    ref={localVideoDiv}
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                    <div className="p-6 rounded-full bg-white/20 border border-white/30 animate-pulse">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
                <div
                  className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs border border-white/20 ${styles.badgeBg}`}
                >
                  Moi
                </div>
              </div>

              {/* AUTRES */}
              {users.map((remoteUser, idx) => (
                <div
                  key={remoteUser.uid}
                  className={`relative rounded-xl overflow-hidden shadow-lg border ${
                    isDark ? "border-white/10" : "border-gray-300"
                  }`}
                >
                  <RemoteVideoPlayer user={remoteUser} />
                </div>
              ))}
            </div>
          ) : (
            // EN ATTENTE
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 ${
                    isDark
                      ? "bg-slate-800 border-white/10"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {callData?.isGroup ? (
                    <Users size={40} className={styles.textSub} />
                  ) : callData?.profilePicture ? (
                    <img
                      src={callData.profilePicture}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={40} className={styles.textSub} />
                  )}
                </div>
                {!isMinimized && (
                  <p className={`font-medium ${styles.textMain} animate-pulse`}>
                    En attente de réponse...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className={`flex items-center justify-center gap-4 border-t ${
            styles.card
          } ${isMinimized ? "p-2" : "p-6"}`}
        >
          <button
            onClick={toggleMic}
            className={`rounded-full flex items-center justify-center transition ${
              isMinimized ? "p-2" : "p-4 hover:scale-105"
            } ${
              micOn
                ? `${
                    isDark
                      ? "bg-white/10 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`
                : "bg-red-500 text-white shadow-lg shadow-red-500/30"
            }`}
          >
            {micOn ? (
              <Mic size={isMinimized ? 16 : 24} />
            ) : (
              <MicOff size={isMinimized ? 16 : 24} />
            )}
          </button>
          <button
            onClick={handleHangup}
            className={`rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 ${
              isMinimized ? "p-2" : "p-4 hover:scale-110 transition"
            }`}
          >
            <PhoneOff size={isMinimized ? 18 : 32} fill="currentColor" />
          </button>
          {callType === "video" && (
            <button
              onClick={toggleCam}
              className={`rounded-full flex items-center justify-center transition ${
                isMinimized ? "p-2" : "p-4 hover:scale-105"
              } ${
                camOn
                  ? `${
                      isDark
                        ? "bg-white/10 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`
                  : "bg-red-500 text-white shadow-lg shadow-red-500/20"
              }`}
            >
              {camOn ? (
                <VideoIcon size={isMinimized ? 16 : 24} />
              ) : (
                <VideoOff size={isMinimized ? 16 : 24} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
