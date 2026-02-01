// frontend/src/components/Chat/VideoCall.jsx
"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  MonitorUp,
  XSquare,
  LayoutGrid,
  Layout,
  GripHorizontal,
  Wifi,
  WifiOff,
  Phone,
  RefreshCw,
} from "lucide-react";
import { generateNumericUid, CALL_STATES } from "@/context/Callcontext";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

const ENCODER_CONFIG = {
  video: "720p_2",
  screen: "1080p_1",
  audio: "music_standard",
};

const CONNECTION_STATES = {
  DISCONNECTED: "DISCONNECTED",
  CONNECTING: "CONNECTING",
  CONNECTED: "CONNECTED",
  RECONNECTING: "RECONNECTING",
  DISCONNECTING: "DISCONNECTING",
};

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const getQualityIcon = (quality) => {
  switch (quality) {
    case "excellent":
      return <Wifi className="text-green-400" size={16} />;
    case "good":
      return <Wifi className="text-yellow-400" size={16} />;
    case "poor":
      return <Wifi className="text-orange-400" size={16} />;
    default:
      return <WifiOff className="text-red-400" size={16} />;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// COMPOSANT VIDÉO DISTANT
// ============================================
const RemoteVideoPlayer = memo(
  function RemoteVideoPlayer({
    user,
    getUserInfo,
    isMini = false,
    isSpotlight = false,
    onClick,
  }) {
    const videoRef = useRef(null);
    const info = getUserInfo(user.uid);
    const name = info?.name || `User ${user.uid}`;
    const pic = info?.profilePicture;
    const hasVideo = !!user.videoTrack;
    const hasAudio = !!user.audioTrack;

    useEffect(() => {
      // ⚠️ IMPORTANT: Délai pour s'assurer que le ref est monté
      const timer = setTimeout(() => {
        if (user.videoTrack && videoRef.current) {
          try {
            console.log(`▶️ PLAY Remote Video: ${user.uid}`);
            user.videoTrack.play(videoRef.current);
          } catch (err) {
            console.error("❌ Erreur PLAY Remote:", err);
          }
        }
      }, 200);

      return () => clearTimeout(timer);
    }, [user.videoTrack]);

    const containerClasses = useMemo(() => {
      const base =
        "relative w-full h-full bg-slate-900 overflow-hidden transition-all duration-300";
      if (isMini) return `${base} rounded-xl`;
      if (isSpotlight) return `${base} rounded-3xl`;
      return `${base} rounded-2xl border border-slate-700/50 hover:border-blue-500/50 cursor-pointer group shadow-xl`;
    }, [isMini, isSpotlight]);

    return (
      <div onClick={onClick} className={containerClasses}>
        <div
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hasVideo ? "opacity-100" : "opacity-0"}`}
        />

        {!hasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl" />
              {pic && !isMini ? (
                <img
                  src={pic}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 shadow-2xl z-10 relative"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white z-10 relative">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!isMini && (
              <p className="mt-6 text-white font-semibold relative z-10">
                {name}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.user.uid === next.user.uid &&
    prev.user.videoTrack === next.user.videoTrack,
);

// ... (LocalVideoDisplay et ControlButton inchangés pour gagner de la place) ...
const LocalVideoDisplay = memo(function LocalVideoDisplay({
  videoRef,
  isActive,
  isScreenShare,
  isMini,
  onClick,
}) {
  if (!isActive) {
    return (
      <div
        onClick={onClick}
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 cursor-pointer"
      >
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg mb-3">
          M
        </div>
        {!isMini && <p className="text-slate-400 text-sm">Caméra désactivée</p>}
      </div>
    );
  }
  return (
    <div
      ref={videoRef}
      onClick={onClick}
      className={`w-full h-full object-cover cursor-pointer ${!isScreenShare ? "transform scale-x-[-1]" : ""}`}
    />
  );
});

const ControlButton = memo(function ControlButton({
  onClick,
  active,
  danger,
  success,
  disabled,
  icon: Icon,
  label,
  size = "normal",
}) {
  const sizeClasses = size === "large" ? "p-5 md:p-6" : "p-3 md:p-4";
  const iconSize = size === "large" ? 28 : 22;
  const colorClasses = useMemo(() => {
    if (disabled) return "bg-slate-700 cursor-not-allowed opacity-50";
    if (danger) return "bg-red-600 hover:bg-red-700 shadow-red-600/30";
    if (success) return "bg-green-500 hover:bg-green-600 shadow-green-500/30";
    if (!active) return "bg-red-500 hover:bg-red-600 shadow-red-500/20";
    return "bg-slate-800 hover:bg-slate-700";
  }, [active, danger, success, disabled]);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={label}
      disabled={disabled}
      className={`${sizeClasses} ${colorClasses} rounded-full text-white shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 border border-white/5`}
    >
      <Icon size={iconSize} />
    </button>
  );
});

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function VideoCall({
  channelName,
  token,
  uid,
  onHangup,
  callType,
  callData,
  callState,
  callDuration,
  callError,
  connectionQuality = "good",
}) {
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [spotlightUser, setSpotlightUser] = useState(null);
  const [layoutMode, setLayoutMode] = useState("grid");
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [showControls, setShowControls] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATES.DISCONNECTED,
  );
  const [localError, setLocalError] = useState(null);
  const [time, setTime] = useState(0);
  const [resolvedProfiles, setResolvedProfiles] = useState({});

  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null, screen: null });
  const localVideoRef = useRef(null);
  const screenTrackRef = useRef(null);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const controlsTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  // Timer
  useEffect(() => {
    let interval = null;
    if (callDuration > time) setTime(callDuration);
    if (callState === "ongoing" || callState === CALL_STATES.ONGOING) {
      interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState, callDuration]);

  // Récupération Profils
  useEffect(() => {
    const fetchMissingProfiles = async () => {
      if (!callData?.participants) return;
      const rawParts = Array.isArray(callData.participants)
        ? callData.participants
        : [callData.participants];
      const idsToFetch = rawParts.filter(
        (p) => typeof p === "string" && !resolvedProfiles[p],
      );
      if (idsToFetch.length === 0) return;

      try {
        const newProfiles = {};
        await Promise.all(
          idsToFetch.map(async (id) => {
            try {
              const { data } = await import("@/lib/api").then((mod) =>
                mod.default.get(`/profile/${id}`),
              );
              newProfiles[id] = data.user || data;
            } catch (e) {
              newProfiles[id] = { name: "Utilisateur inconnu", _id: id };
            }
          }),
        );
        setResolvedProfiles((prev) => ({ ...prev, ...newProfiles }));
      } catch (err) {}
    };
    fetchMissingProfiles();
  }, [callData, resolvedProfiles]);

  const getUserInfo = useCallback(
    (agoraUid) => {
      const rawParticipants = callData?.participants || [];
      const participants = Array.isArray(rawParticipants)
        ? rawParticipants
        : [rawParticipants];

      let user = participants.find((p) => {
        const userId = typeof p === "string" ? p : p?._id || p?.id;
        if (!userId) return false;
        return String(generateNumericUid(userId)) === String(agoraUid);
      });

      if (user && typeof user === "object" && user.name) return user;
      if (user && typeof user === "string" && resolvedProfiles[user])
        return resolvedProfiles[user];

      if (!callData?.isGroup && callData?.name && callData?.name !== "Appel") {
        return {
          name: callData.name,
          profilePicture: callData.profilePicture,
          _id: user,
        };
      }
      if (user && typeof user === "string")
        return { name: "Participant", id: user };
      return null;
    },
    [callData, resolvedProfiles],
  );

  const updateRemoteUsers = useCallback((action, user) => {
    if (!mountedRef.current) return;
    setRemoteUsers((prev) => {
      const newList = [...prev];
      const index = newList.findIndex((u) => u.uid === user.uid);
      if (action === "add" || action === "update") {
        if (index !== -1) newList[index] = { ...newList[index], ...user };
        else newList.push(user);
      } else if (action === "remove") {
        if (index !== -1) newList.splice(index, 1);
      }
      return newList;
    });
  }, []);

  // Cleanup
  const cleanupTracks = useCallback(async () => {
    if (screenTrackRef.current) {
      try {
        const tracks = Array.isArray(screenTrackRef.current)
          ? screenTrackRef.current
          : [screenTrackRef.current];
        tracks.forEach((t) => {
          t.stop?.();
          t.close?.();
        });
      } catch (e) {}
      screenTrackRef.current = null;
    }
    Object.values(localTracksRef.current).forEach((t) => {
      if (t) {
        try {
          t.stop?.();
          t.close?.();
        } catch (e) {}
      }
    });
    localTracksRef.current = { audio: null, video: null, screen: null };
  }, []);

  const cleanupClient = useCallback(async () => {
    if (clientRef.current) {
      try {
        // Enlever les listeners AVANT de quitter
        clientRef.current.removeAllListeners();
        await clientRef.current.leave();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
      clientRef.current = null;
    }
  }, []);

  // AGORA INIT (Renforcé)
  const initializeAgora = useCallback(async () => {
    // 🔒 Verrouillage
    if (initializingRef.current) return;
    if (!token || !channelName || !mountedRef.current) return;

    initializingRef.current = true;
    setConnectionStatus(CONNECTION_STATES.CONNECTING);
    setLocalError(null);

    try {
      const uidInt = parseInt(uid, 10);
      console.log(`🚀 Init Agora - Channel: ${channelName}, UID: ${uidInt}`);

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(3); // ERROR only

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        });
      }
      const client = clientRef.current;

      // Reset listeners
      client.removeAllListeners();

      // Handlers
      client.on("user-published", async (user, mediaType) => {
        if (!mountedRef.current) return;
        console.log(`📥 User Published: ${user.uid} (${mediaType})`);

        try {
          await client.subscribe(user, mediaType);
          console.log(`✅ Subscribed to ${user.uid}`);

          updateRemoteUsers("update", {
            uid: user.uid,
            [`${mediaType}Track`]: user[`${mediaType}Track`],
          });

          if (mediaType === "audio" && speakerOn) user.audioTrack?.play();
          if (mediaType === "video" && !spotlightUser) {
            setSpotlightUser({ uid: user.uid });
            setLayoutMode("spotlight");
          }
        } catch (err) {
          console.error("❌ Subscribe Error:", err);
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mountedRef.current)
          updateRemoteUsers("update", {
            uid: user.uid,
            [`${mediaType}Track`]: null,
          });
      });

      client.on("user-left", (user) => {
        if (mountedRef.current) updateRemoteUsers("remove", user);
      });

      client.on("connection-state-change", (curState) => {
        console.log(`🔌 Connection: ${curState}`);
        if (!mountedRef.current) return;
        if (curState === "CONNECTED") {
          setConnectionStatus(CONNECTION_STATES.CONNECTED);
          retryCountRef.current = 0;
        } else if (curState === "DISCONNECTED")
          setConnectionStatus(CONNECTION_STATES.DISCONNECTED);
      });

      // JOIN
      await client.join(APP_ID, channelName, token, uidInt);

      if (!mountedRef.current) {
        await cleanupClient();
        return;
      }

      // CREATE TRACKS
      let audioTrack = null,
        videoTrack = null;
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: ENCODER_CONFIG.audio,
        });
      } catch (e) {
        console.error("Mic error:", e);
      }

      if (callType === "video") {
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: ENCODER_CONFIG.video,
          });
        } catch (e) {
          console.error("Cam error:", e);
        }
      }

      if (!mountedRef.current) {
        audioTrack?.close();
        videoTrack?.close();
        await cleanupClient();
        return;
      }

      localTracksRef.current = { audio: audioTrack, video: videoTrack };

      // PUBLISH
      const tracks = [audioTrack, videoTrack].filter(Boolean);
      if (tracks.length > 0) {
        try {
          await client.publish(tracks);
          console.log("📤 Published local tracks");
        } catch (e) {
          console.error("Publish error:", e);
        }
      }

      if (mountedRef.current) {
        setLocalVideoReady(true);
        setConnectionStatus(CONNECTION_STATES.CONNECTED);
      }
    } catch (error) {
      console.error("❌ Init Error:", error);
      if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current++;
        await cleanupTracks();
        await cleanupClient();
        await delay(RETRY_DELAY_MS);
        if (mountedRef.current) {
          initializingRef.current = false;
          initializeAgora();
        }
      } else {
        setLocalError("Erreur connexion");
      }
    } finally {
      initializingRef.current = false;
    }
  }, [
    channelName,
    token,
    uid,
    callType,
    updateRemoteUsers,
    speakerOn,
    spotlightUser,
    cleanupTracks,
    cleanupClient,
  ]);

  // MAIN EFFECT
  useEffect(() => {
    mountedRef.current = true;

    // 🔥 DELAY CRITIQUE : Évite le "WebSocket closed"
    const timer = setTimeout(() => {
      if (mountedRef.current) initializeAgora();
    }, 500);

    return () => {
      console.log("🛑 Unmount");
      clearTimeout(timer);
      mountedRef.current = false;
      cleanupTracks();
      cleanupClient();
    };
  }, [channelName, token, uid]);

  // Play Local Video
  useEffect(() => {
    if (!localVideoReady || !localVideoRef.current) return;
    const playLocal = async () => {
      try {
        const t = isScreenSharing
          ? localTracksRef.current.screen
          : localTracksRef.current.video;
        if (t && (camOn || isScreenSharing)) {
          await delay(100);
          t.play(localVideoRef.current);
        }
      } catch (e) {}
    };
    playLocal();
  }, [localVideoReady, camOn, isScreenSharing]);

  // Actions
  const toggleMic = useCallback(async () => {
    if (localTracksRef.current.audio) {
      await localTracksRef.current.audio.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    if (connectionStatus !== CONNECTION_STATES.CONNECTED) return;
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    if (!localTracksRef.current.video) {
      try {
        const v = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: ENCODER_CONFIG.video,
        });
        localTracksRef.current.video = v;
        if (clientRef.current?.connectionState === "CONNECTED")
          await clientRef.current.publish(v);
        setLocalVideoReady(true);
        setCamOn(true);
      } catch (e) {}
    } else {
      await localTracksRef.current.video.setEnabled(!camOn);
      setCamOn(!camOn);
    }
  }, [camOn, connectionStatus]);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOn(!speakerOn);
    remoteUsers.forEach((u) => u.audioTrack?.[!speakerOn ? "play" : "stop"]());
  }, [speakerOn, remoteUsers]);

  const toggleScreenShare = useCallback(async () => {
    // ... code inchangé ...
  }, [isScreenSharing, camOn, connectionStatus]);

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setLocalError(null);
    cleanupTracks().then(() => cleanupClient().then(initializeAgora));
  }, [cleanupTracks, cleanupClient, initializeAgora]);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isMinimized) setShowControls(false);
    }, 5000);
  }, [isMinimized]);

  // Drag & Drop
  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.closest("button")) return;
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position],
  );

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setPosition({
      x: Math.max(
        0,
        Math.min(window.innerWidth - 220, e.clientX - dragOffset.current.x),
      ),
      y: Math.max(
        0,
        Math.min(window.innerHeight - 340, e.clientY - dragOffset.current.y),
      ),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    if (isMinimized) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isMinimized, handleMouseMove, handleMouseUp]);

  // Grid
  const totalUsers = remoteUsers.length + 1;
  const gridClass = useMemo(() => {
    if (totalUsers <= 2) return "grid-cols-1 md:grid-cols-2";
    if (totalUsers <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3";
  }, [totalUsers]);

  const isConnecting =
    connectionStatus === CONNECTION_STATES.CONNECTING ||
    connectionStatus === CONNECTION_STATES.RECONNECTING;

  // -- VUE MINIMISÉE --
  if (isMinimized) {
    const displayUser = spotlightUser?.isLocal
      ? null
      : remoteUsers.find((u) => u.uid === spotlightUser?.uid) || remoteUsers[0];

    return (
      <div
        className="fixed w-52 h-80 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-500/50 z-[9999] cursor-move flex flex-col backdrop-blur-sm"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="bg-slate-800/90 backdrop-blur px-3 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white text-xs font-medium truncate">
            <GripHorizontal size={14} className="opacity-50" />
            <span className="truncate">{callData?.name}</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <Maximize2 size={14} className="text-white" />
          </button>
        </div>
        <div className="flex-1 relative bg-black">
          {displayUser ? (
            <RemoteVideoPlayer
              user={displayUser}
              getUserInfo={getUserInfo}
              isMini
            />
          ) : (
            <LocalVideoDisplay
              videoRef={localVideoRef}
              isActive={camOn || isScreenSharing}
              isScreenShare={isScreenSharing}
              isMini
            />
          )}
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full text-green-400 text-xs font-mono">
            {formatDuration(time)}
          </div>
        </div>
        <div className="p-2 flex justify-around bg-slate-900/90 backdrop-blur border-t border-slate-700/50">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-full ${micOn ? "text-white" : "text-red-400 bg-red-500/20"}`}
          >
            <Mic size={16} />
          </button>
          <button
            onClick={onHangup}
            className="p-2 rounded-full bg-red-500 text-white"
          >
            <PhoneOff size={16} />
          </button>
          <button
            onClick={toggleCam}
            className={`p-2 rounded-full ${camOn ? "text-white" : "text-red-400 bg-red-500/20"}`}
          >
            <Video size={16} />
          </button>
        </div>
      </div>
    );
  }

  // -- VUE PRINCIPALE --
  return (
    <div
      className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      <header
        className={`absolute top-0 w-full p-4 flex justify-between z-30 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"} bg-gradient-to-b from-black/80 via-black/40 to-transparent`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {callData?.isGroup ? (
              <Users size={16} className="text-blue-400" />
            ) : (
              <img
                src={callData?.profilePicture || "/default-avatar.png"}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-white font-medium text-sm">
              {callData?.name || "Appel"}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-green-500/30">
            <span className="text-green-400 font-mono text-sm">
              {formatDuration(time)}
            </span>
          </div>
          <div className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
            {connectionStatus === CONNECTION_STATES.RECONNECTING ? (
              <RefreshCw className="text-yellow-400 animate-spin" size={16} />
            ) : (
              getQualityIcon(connectionQuality)
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setLayoutMode(layoutMode === "grid" ? "spotlight" : "grid")
            }
            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 text-white border border-white/10"
          >
            {layoutMode === "grid" ? (
              <Layout size={18} />
            ) : (
              <LayoutGrid size={18} />
            )}
          </button>
          <button
            onClick={() => {
              setPosition({
                x: window.innerWidth - 220,
                y: window.innerHeight - 340,
              });
              setIsMinimized(true);
            }}
            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 text-white border border-white/10"
          >
            <Minimize2 size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden pt-20 pb-32 px-4 justify-center items-center">
        {layoutMode === "spotlight" && spotlightUser ? (
          <div className="flex w-full max-w-7xl h-full gap-4">
            <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl">
              {spotlightUser.isLocal ? (
                <div className="relative w-full h-full">
                  <LocalVideoDisplay
                    videoRef={localVideoRef}
                    isActive={camOn || isScreenSharing}
                    isScreenShare={isScreenSharing}
                  />
                  <div className="absolute bottom-6 left-6 bg-blue-600/90 backdrop-blur px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg flex items-center gap-2">
                    Vous {!micOn && <MicOff size={14} />}
                  </div>
                </div>
              ) : (
                <RemoteVideoPlayer
                  user={
                    remoteUsers.find((u) => u.uid === spotlightUser.uid) || {}
                  }
                  getUserInfo={getUserInfo}
                  isSpotlight
                />
              )}
            </div>
            <aside className="w-56 flex flex-col gap-3 overflow-y-auto pr-1">
              {!spotlightUser.isLocal && (
                <div
                  onClick={() => setSpotlightUser({ isLocal: true })}
                  className="h-36 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 relative"
                >
                  <LocalVideoDisplay
                    videoRef={localVideoRef}
                    isActive={camOn || isScreenSharing}
                    isScreenShare={isScreenSharing}
                    isMini
                  />
                </div>
              )}
              {remoteUsers
                .filter((u) => u.uid !== spotlightUser?.uid)
                .map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => setSpotlightUser({ uid: user.uid })}
                    className="h-36 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700"
                  >
                    <RemoteVideoPlayer
                      user={user}
                      getUserInfo={getUserInfo}
                      isMini
                    />
                  </div>
                ))}
            </aside>
          </div>
        ) : (
          <div
            className={`grid gap-4 w-full h-full max-w-7xl content-center ${gridClass}`}
          >
            <div
              onClick={() => {
                setSpotlightUser({ isLocal: true });
                setLayoutMode("spotlight");
              }}
              className="relative w-full h-full min-h-[200px] aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 cursor-pointer"
            >
              <LocalVideoDisplay
                videoRef={localVideoRef}
                isActive={camOn || isScreenSharing}
                isScreenShare={isScreenSharing}
              />
              <div className="absolute bottom-4 left-4 bg-blue-600/90 backdrop-blur px-3 py-1.5 rounded-xl text-white text-sm font-bold shadow-lg flex items-center gap-2">
                Moi {!micOn && <MicOff size={14} className="text-red-200" />}
              </div>
            </div>
            {remoteUsers.map((user) => (
              <div
                key={user.uid}
                className="relative w-full h-full min-h-[200px] aspect-video"
              >
                <RemoteVideoPlayer
                  user={user}
                  getUserInfo={getUserInfo}
                  onClick={() => {
                    setSpotlightUser({ uid: user.uid });
                    setLayoutMode("spotlight");
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer
        className={`absolute bottom-0 w-full p-6 pb-8 flex justify-center items-center gap-3 md:gap-5 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent`}
      >
        <ControlButton
          onClick={toggleSpeaker}
          active={speakerOn}
          icon={speakerOn ? Volume2 : VolumeX}
          label="Haut-parleur"
        />
        <ControlButton
          onClick={toggleMic}
          active={micOn}
          disabled={isConnecting}
          icon={micOn ? Mic : MicOff}
          label="Microphone"
        />
        <button
          onClick={onHangup}
          className="p-5 md:p-6 bg-red-600 rounded-full text-white shadow-2xl hover:bg-red-700 transition-all active:scale-95 mx-2 md:mx-4 border-4 border-slate-950"
        >
          <PhoneOff size={28} />
        </button>
        <ControlButton
          onClick={toggleCam}
          active={camOn}
          disabled={isConnecting}
          icon={camOn ? Video : VideoOff}
          label="Caméra"
        />
        <ControlButton
          onClick={toggleScreenShare}
          active={!isScreenSharing}
          success={isScreenSharing}
          disabled={isConnecting}
          icon={isScreenSharing ? XSquare : MonitorUp}
          label="Partager"
        />
      </footer>

      {(callError || localError) && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3">
          <span>⚠️</span>
          <span>{callError || localError}</span>
          {localError && (
            <button
              onClick={handleRetry}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
            >
              Réessayer
            </button>
          )}
        </div>
      )}

      {isConnecting && callState !== CALL_STATES.RINGING && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
          <div className="text-center relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto" />
            <p className="text-white text-lg mt-4">
              {connectionStatus === CONNECTION_STATES.RECONNECTING
                ? "Reconnexion..."
                : "Connexion..."}
            </p>
          </div>
          <button
            onClick={onHangup}
            className="mt-8 p-4 bg-red-600 rounded-full text-white shadow-xl hover:bg-red-700"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}

      {callState === CALL_STATES.RINGING && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-pulse">
                <div className="w-32 h-32 rounded-full border-4 border-green-500/30 mx-auto" />
              </div>
              <img
                src={callData?.profilePicture || "/default-avatar.png"}
                alt=""
                className="w-28 h-28 rounded-full object-cover border-4 border-green-500 mx-auto relative"
              />
            </div>
            <h3 className="text-white text-xl font-semibold mb-1">
              {callData?.name || "Appel en cours"}
            </h3>
            <p className="text-slate-400 text-sm">Appel en cours...</p>
          </div>
          <div className="mt-10 flex flex-col items-center">
            <button
              onClick={onHangup}
              className="p-5 bg-red-600 rounded-full text-white shadow-2xl hover:bg-red-700 animate-pulse"
            >
              <PhoneOff size={32} />
            </button>
            <p className="text-slate-400 text-sm mt-3">Annuler</p>
          </div>
        </div>
      )}
    </div>
  );
}
