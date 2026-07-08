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
import Image from "next/image";
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
import { generateNumericUid, CALL_STATES } from "@/context/Callcontext"; // Assurez-vous du nom du fichier (CallContext vs Callcontext)

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// ============================================
// CONSTANTES
// ============================================
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

// ============================================
// UTILITAIRES
// ============================================
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
    const name = info?.name || "Participant";
    const pic = info?.profilePicture;
    const hasVideo = !!user.videoTrack;
    const hasAudio = !!user.audioTrack;

    useEffect(() => {
      if (user.videoTrack && videoRef.current) {
        try {
          user.videoTrack.play(videoRef.current);
        } catch (err) {
          console.error("Erreur lecture vidéo distante:", err);
        }
      }
      return () => {
        try {
          user.videoTrack?.stop();
        } catch (e) {}
      };
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
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hasVideo ? "opacity-100" : "opacity-0"
          }`}
        />

        {!hasVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl" />
              {pic && !isMini ? (
                 <Image
                   src={pic}
                   alt={name}
                   width={128}
                   height={128}
                   className={`relative rounded-full object-cover border-4 border-slate-700 shadow-2xl ${
                     isMini ? "w-12 h-12" : "w-24 h-24 sm:w-32 sm:h-32"
                  }`}
                />
              ) : (
                <div
                  className={`relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center font-bold text-white shadow-2xl ${
                    isMini
                      ? "w-12 h-12 text-lg"
                      : "w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-4xl"
                  }`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!isMini && (
              <div className="mt-6 text-center">
                <h3 className="text-white font-semibold text-lg tracking-wide">
                  {name}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 text-xs font-medium flex items-center gap-1.5">
                    <VideoOff size={12} /> Caméra désactivée
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {!isMini && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium truncate max-w-32">
              {name}
            </span>
            {!hasAudio && (
              <MicOff size={14} className="text-red-400 flex-shrink-0" />
            )}
          </div>
        )}

        {isMini && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
            <span className="bg-black/60 px-2 py-0.5 rounded text-white text-xs truncate">
              {name}
            </span>
            {!hasAudio && (
              <span className="bg-red-500/80 p-1 rounded-full">
                <MicOff size={10} className="text-white" />
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.user.uid === next.user.uid &&
    prev.user.videoTrack === next.user.videoTrack &&
    prev.user.audioTrack === next.user.audioTrack &&
    prev.isMini === next.isMini &&
    prev.isSpotlight === next.isSpotlight,
);

// ============================================
// COMPOSANT LOCAL VIDEO
// ============================================
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
      className={`w-full h-full object-cover cursor-pointer ${
        !isScreenShare ? "transform scale-x-[-1]" : ""
      }`}
    />
  );
});

// ============================================
// BOUTON CONTRÔLE
// ============================================
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
  // États
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

  // ✅ MINUTEUR LOCAL : On utilise un état local pour garantir l'affichage
  const [time, setTime] = useState(0);

  // Refs
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

  // ✅ LOGIQUE DU MINUTEUR
  useEffect(() => {
    let interval = null;

    // On synchronise avec la prop si elle est fournie et plus grande que le temps local
    // (au cas où on revient sur la fenêtre)
    setTime((prev) => (callDuration > prev ? callDuration : prev));

    // Démarrer le compteur si l'appel est en cours
    if (callState === "ongoing" || callState === CALL_STATES.ONGOING) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState, callDuration]); // On réagit si le statut change

  // ============================================
  // HELPERS
  // ============================================
  const getUserInfo = useCallback(
    (agoraUid) => {
      const participants = Array.isArray(callData?.participants)
        ? callData.participants
        : callData?.participants
          ? [callData.participants]
          : [];
      return participants.find(
        (p) => String(generateNumericUid(p._id || p.id)) === String(agoraUid),
      );
    },
    [callData],
  );

  const updateRemoteUsers = useCallback((action, user) => {
    if (!mountedRef.current) return;
    setRemoteUsers((prev) => {
      const newList = [...prev];
      const index = newList.findIndex((u) => u.uid === user.uid);

      switch (action) {
        case "add":
        case "update":
          if (index !== -1) {
            newList[index] = { ...newList[index], ...user };
          } else {
            newList.push(user);
          }
          break;
        case "remove":
          if (index !== -1) newList.splice(index, 1);
          break;
        default:
          break;
      }
      return newList;
    });
  }, []);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isMinimized) setShowControls(false);
    }, 5000);
  }, [isMinimized]);

  // ============================================
  // CLEANUP TRACKS
  // ============================================
  const cleanupTracks = useCallback(async () => {
    console.log("🧹 Nettoyage des pistes...");

    if (screenTrackRef.current) {
      try {
        const tracks = Array.isArray(screenTrackRef.current)
          ? screenTrackRef.current
          : [screenTrackRef.current];
        for (const t of tracks) {
          t.stop?.();
          t.close?.();
        }
      } catch (e) {
        console.warn("Erreur cleanup screen track:", e);
      }
      screenTrackRef.current = null;
    }

    for (const [key, track] of Object.entries(localTracksRef.current)) {
      if (track) {
        try {
          track.stop?.();
          track.close?.();
        } catch (e) {
          console.warn(`Erreur cleanup ${key} track:`, e);
        }
      }
    }
    localTracksRef.current = { audio: null, video: null, screen: null };
  }, []);

  // ============================================
  // CLEANUP CLIENT
  // ============================================
  const cleanupClient = useCallback(async () => {
    if (clientRef.current) {
      try {
        clientRef.current.removeAllListeners();
        if (clientRef.current.connectionState !== "DISCONNECTED") {
          await clientRef.current.leave();
        }
      } catch (e) {
        console.warn("Erreur leave client:", e);
      }
      clientRef.current = null;
    }
  }, []);

  // ============================================
  // INITIALISATION AGORA
  // ============================================
  const initializeAgora = useCallback(async () => {
    if (initializingRef.current) return;

    if (!token || !channelName || !mountedRef.current) return;

    initializingRef.current = true;
    setConnectionStatus(CONNECTION_STATES.CONNECTING);
    setLocalError(null);

    try {
      console.log("🚀 Initialisation Agora...", { channelName, uid });

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(3);

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        });
      }

      const client = clientRef.current;

      if (client.connectionState === "CONNECTED") {
        await client.leave();
        await delay(500);
      }

      client.removeAllListeners();

      client.on("user-published", async (user, mediaType) => {
        if (!mountedRef.current) return;
        try {
          await client.subscribe(user, mediaType);
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
          console.error("Erreur subscription:", err);
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (!mountedRef.current) return;
        updateRemoteUsers("update", {
          uid: user.uid,
          [`${mediaType}Track`]: null,
        });
      });

      client.on("user-left", (user) => {
        if (!mountedRef.current) return;
        updateRemoteUsers("remove", user);
        if (spotlightUser?.uid === user.uid) {
          setSpotlightUser(null);
          setLayoutMode("grid");
        }
      });

      client.on("connection-state-change", (curState) => {
        if (!mountedRef.current) return;
        switch (curState) {
          case "CONNECTED":
            setConnectionStatus(CONNECTION_STATES.CONNECTED);
            retryCountRef.current = 0;
            break;
          case "CONNECTING":
            setConnectionStatus(CONNECTION_STATES.CONNECTING);
            break;
          case "RECONNECTING":
            setConnectionStatus(CONNECTION_STATES.RECONNECTING);
            break;
          case "DISCONNECTED":
            setConnectionStatus(CONNECTION_STATES.DISCONNECTED);
            break;
          default:
            break;
        }
      });

      await client.join(APP_ID, channelName, token, uid);

      if (!mountedRef.current) {
        await cleanupClient();
        return;
      }

      await delay(500);

      if (client.connectionState !== "CONNECTED") {
        throw new Error("Connection lost after join");
      }

      let audioTrack = null;
      let videoTrack = null;

      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: ENCODER_CONFIG.audio,
        });
      } catch (e) {
        console.error("❌ Erreur création piste audio:", e);
      }

      if (callType === "video") {
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: ENCODER_CONFIG.video,
          });
        } catch (e) {
          console.error("❌ Erreur création piste vidéo:", e);
        }
      }

      if (!mountedRef.current) {
        audioTrack?.close();
        videoTrack?.close();
        await cleanupClient();
        return;
      }

      localTracksRef.current = { audio: audioTrack, video: videoTrack };

      const tracksToPublish = [audioTrack, videoTrack].filter(Boolean);

      if (tracksToPublish.length > 0) {
        try {
          await client.publish(tracksToPublish);
        } catch (publishError) {
          await delay(1000);
          if (client.connectionState === "CONNECTED" && mountedRef.current) {
            await client.publish(tracksToPublish);
          }
        }
      }

      if (mountedRef.current) {
        setLocalVideoReady(true);
        setConnectionStatus(CONNECTION_STATES.CONNECTED);
      }
    } catch (error) {
      console.error("❌ Erreur initialisation Agora:", error);
      if (!mountedRef.current) return;

      if (
        retryCountRef.current < MAX_RETRY_ATTEMPTS &&
        error.code !== "INVALID_PARAMS"
      ) {
        retryCountRef.current++;
        await cleanupTracks();
        await cleanupClient();
        await delay(RETRY_DELAY_MS);
        if (mountedRef.current) {
          initializingRef.current = false;
          initializeAgora();
        }
      } else {
        setLocalError("Impossible de se connecter à l'appel");
        setConnectionStatus(CONNECTION_STATES.DISCONNECTED);
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

  useEffect(() => {
    mountedRef.current = true;
    initializeAgora();
    return () => {
      mountedRef.current = false;
      const cleanup = async () => {
        await cleanupTracks();
        await cleanupClient();
      };
      cleanup();
    };
  }, [channelName, cleanupClient, cleanupTracks, initializeAgora, token, uid]);

  useEffect(() => {
    if (!localVideoReady || !localVideoRef.current) return;
    const playVideo = async () => {
      try {
        const track = isScreenSharing
          ? localTracksRef.current.screen
          : localTracksRef.current.video;
        if (track && (camOn || isScreenSharing)) {
          await delay(100);
          track.play(localVideoRef.current);
        }
      } catch (e) {}
    };
    playVideo();
  }, [localVideoReady, camOn, isScreenSharing]);

  const toggleMic = useCallback(async () => {
    const audioTrack = localTracksRef.current.audio;
    if (audioTrack) {
      try {
        const newState = !micOn;
        await audioTrack.setEnabled(newState);
        setMicOn(newState);
      } catch (e) {}
    }
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    if (connectionStatus !== CONNECTION_STATES.CONNECTED) return;
    const videoTrack = localTracksRef.current.video;
    if (!videoTrack) {
      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: ENCODER_CONFIG.video,
        });
        localTracksRef.current.video = newVideoTrack;
        if (clientRef.current?.connectionState === "CONNECTED") {
          await clientRef.current.publish(newVideoTrack);
        }
        setLocalVideoReady(true);
        setCamOn(true);
      } catch (e) {}
      return;
    }
    try {
      const newState = !camOn;
      await videoTrack.setEnabled(newState);
      setCamOn(newState);
    } catch (e) {}
  }, [camOn, connectionStatus]);

  const toggleSpeaker = useCallback(() => {
    const newState = !speakerOn;
    setSpeakerOn(newState);
    remoteUsers.forEach((u) => {
      try {
        u.audioTrack?.[newState ? "play" : "stop"]();
      } catch (e) {}
    });
  }, [speakerOn, remoteUsers]);

  const toggleScreenShare = useCallback(async () => {
    if (connectionStatus !== CONNECTION_STATES.CONNECTED) return;
    try {
      if (isScreenSharing) {
        if (screenTrackRef.current) {
          const tracks = Array.isArray(screenTrackRef.current)
            ? screenTrackRef.current
            : [screenTrackRef.current];
          if (clientRef.current?.connectionState === "CONNECTED") {
            await clientRef.current.unpublish(tracks);
          }
          tracks.forEach((t) => {
            t.stop?.();
            t.close?.();
          });
          screenTrackRef.current = null;
        }
        if (localTracksRef.current.video && camOn) {
          if (clientRef.current?.connectionState === "CONNECTED") {
            await clientRef.current.publish(localTracksRef.current.video);
          }
        }
        setIsScreenSharing(false);
        setSpotlightUser(null);
        setLayoutMode("grid");
      } else {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: ENCODER_CONFIG.screen },
          "auto",
        );
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
        track.on("track-ended", () => toggleScreenShare());
        screenTrackRef.current = screenTrack;
        localTracksRef.current.screen = track;
        if (localTracksRef.current.video) {
          if (clientRef.current?.connectionState === "CONNECTED") {
            await clientRef.current.unpublish(localTracksRef.current.video);
          }
        }
        if (clientRef.current?.connectionState === "CONNECTED") {
          await clientRef.current.publish(screenTrack);
        }
        setIsScreenSharing(true);
        setSpotlightUser({ isLocal: true });
        setLayoutMode("spotlight");
      }
      setLocalVideoReady(false);
      requestAnimationFrame(() => setLocalVideoReady(true));
    } catch (e) {}
  }, [isScreenSharing, camOn, connectionStatus]);

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setLocalError(null);
    cleanupTracks().then(() => {
      cleanupClient().then(() => {
        initializeAgora();
      });
    });
  }, [cleanupTracks, cleanupClient, initializeAgora]);

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
    const newX = Math.max(
      0,
      Math.min(window.innerWidth - 220, e.clientX - dragOffset.current.x),
    );
    const newY = Math.max(
      0,
      Math.min(window.innerHeight - 340, e.clientY - dragOffset.current.y),
    );
    setPosition({ x: newX, y: newY });
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

  const isConnecting =
    connectionStatus === CONNECTION_STATES.CONNECTING ||
    connectionStatus === CONNECTION_STATES.RECONNECTING;

  // Calculs avant les rendus conditionnels
  const totalUsers = remoteUsers.length + 1;
  const gridClass = useMemo(() => {
    if (totalUsers <= 2) return "grid-cols-1 md:grid-cols-2";
    if (totalUsers <= 4) return "grid-cols-2";
    return "grid-cols-2 md:grid-cols-3";
  }, [totalUsers]);

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

          {connectionStatus === CONNECTION_STATES.RECONNECTING && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <RefreshCw className="text-yellow-400 animate-spin" size={24} />
            </div>
          )}
        </div>

        <div className="p-2 flex justify-around bg-slate-900/90 backdrop-blur border-t border-slate-700/50">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-full transition-colors ${
              micOn
                ? "text-white hover:bg-white/10"
                : "text-red-400 bg-red-500/20"
            }`}
          >
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button
            onClick={onHangup}
            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneOff size={16} />
          </button>
          <button
            onClick={toggleCam}
            className={`p-2 rounded-full transition-colors ${
              camOn
                ? "text-white hover:bg-white/10"
                : "text-red-400 bg-red-500/20"
            }`}
          >
            {camOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
    >
      <header
        className={`absolute top-0 w-full p-4 flex justify-between z-30 transition-all duration-300 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        } bg-gradient-to-b from-black/80 via-black/40 to-transparent`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            {callData?.isGroup ? (
              <Users size={16} className="text-blue-400" />
            ) : callData?.profilePicture ? (
               <Image
                 src={callData.profilePicture}
                 alt=""
                 width={24}
                 height={24}
                 className="w-6 h-6 rounded-full object-cover"
               />
            ) : null}
            <span className="text-white font-medium text-sm">
              {callData?.name || "Appel"}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-green-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-400 font-mono text-sm">
              {/* ✅ Utilisation du temps local */}
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
            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 text-white transition-colors border border-white/10"
            title={layoutMode === "grid" ? "Mode spotlight" : "Mode grille"}
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
            className="p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/10 text-white transition-colors border border-white/10"
            title="Minimiser"
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
                    Vous {isScreenSharing && "(Partage d'écran)"}
                    {!micOn && <MicOff size={14} />}
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
                  className="h-36 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-blue-500 cursor-pointer bg-slate-900 relative transition-all shadow-lg"
                >
                  <LocalVideoDisplay
                    videoRef={localVideoRef}
                    isActive={camOn || isScreenSharing}
                    isScreenShare={isScreenSharing}
                    isMini
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
                    Moi
                  </div>
                </div>
              )}

              {remoteUsers
                .filter((u) => u.uid !== spotlightUser?.uid)
                .map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => setSpotlightUser({ uid: user.uid })}
                    className="h-36 shrink-0 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-blue-500 cursor-pointer transition-all shadow-lg"
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
              className="relative w-full h-full min-h-[200px] aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 cursor-pointer hover:border-blue-500/50 transition-all shadow-xl group"
            >
              <LocalVideoDisplay
                videoRef={localVideoRef}
                isActive={camOn || isScreenSharing}
                isScreenShare={isScreenSharing}
              />
              <div className="absolute bottom-4 left-4 bg-blue-600/90 backdrop-blur px-3 py-1.5 rounded-xl text-white text-sm font-bold shadow-lg flex items-center gap-2">
                Moi
                {!micOn && <MicOff size={14} className="text-red-200" />}
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
        className={`absolute bottom-0 w-full p-6 pb-8 flex justify-center items-center gap-3 md:gap-5 transition-all duration-300 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        } bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent`}
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
          className="p-5 md:p-6 bg-red-600 rounded-full text-white shadow-2xl shadow-red-600/40 hover:bg-red-700 hover:scale-110 transition-all duration-200 active:scale-95 mx-2 md:mx-4 border-4 border-slate-950"
          title="Raccrocher"
        >
          <PhoneOff size={28} fill="currentColor" />
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
          label="Partager l'écran"
        />
      </footer>

      {(callError || localError) && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl z-50 font-medium flex items-center gap-3">
          <span>⚠️</span>
          <span>{callError || localError}</span>
          {localError && (
            <button
              onClick={handleRetry}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      )}

      {isConnecting && callState !== CALL_STATES.RINGING && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto" />
              {connectionStatus === CONNECTION_STATES.RECONNECTING && (
                <RefreshCw
                  className="absolute inset-0 m-auto text-yellow-400"
                  size={24}
                />
              )}
            </div>
            <p className="text-white text-lg mt-4">
              {connectionStatus === CONNECTION_STATES.RECONNECTING
                ? "Reconnexion..."
                : "Connexion en cours..."}
            </p>
            {retryCountRef.current > 0 && (
              <p className="text-slate-400 text-sm mt-1">
                Tentative {retryCountRef.current}/{MAX_RETRY_ATTEMPTS}
              </p>
            )}
          </div>

          <button
            onClick={onHangup}
            className="mt-8 p-4 bg-red-600 rounded-full text-white shadow-xl shadow-red-600/40 hover:bg-red-700 hover:scale-110 transition-all duration-200 active:scale-95"
            title="Annuler l'appel"
          >
            <PhoneOff size={28} />
          </button>
          <p className="text-slate-400 text-sm mt-2">Annuler</p>
        </div>
      )}

      {callState === CALL_STATES.RINGING && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
          <div className="text-center">
            {callData?.profilePicture ? (
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-pulse">
                  <div className="w-32 h-32 rounded-full border-4 border-green-500/30 mx-auto" />
                </div>
                <Image
                  src={callData.profilePicture}
                  alt={callData.name}
                  width={112}
                  height={112}
                  className="w-28 h-28 rounded-full object-cover border-4 border-green-500 shadow-lg shadow-green-500/30 mx-auto relative"
                />
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/30" />
                <div
                  className="absolute inset-2 animate-ping rounded-full bg-green-500/50"
                  style={{ animationDelay: "200ms" }}
                />
                <div className="absolute inset-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  {callData?.isGroup ? (
                    <Users className="text-white" size={24} />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {(callData?.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <h3 className="text-white text-xl font-semibold mb-1">
              {callData?.name || "Appel en cours"}
            </h3>
            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Appel {callType === "video" ? "vidéo" : "audio"} en cours...
            </p>
            <p className="text-slate-500 text-xs mt-1">En attente de réponse</p>
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              onClick={onHangup}
              className="p-5 bg-red-600 rounded-full text-white shadow-2xl shadow-red-600/40 hover:bg-red-700 hover:scale-110 transition-all duration-200 active:scale-95 animate-pulse"
              title="Annuler l'appel"
            >
              <PhoneOff size={32} fill="currentColor" />
            </button>
            <p className="text-slate-400 text-sm mt-3">Appuyez pour annuler</p>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p className="text-slate-500 text-xs">
              L&lsquo;appel s&lsquo;annulera automatiquement après 45 secondes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
