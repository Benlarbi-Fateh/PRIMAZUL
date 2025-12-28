// frontend/src/components/Chat/VideoCall.jsx
"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
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
  RotateCcw,
  Volume2,
  VolumeX,
  MonitorUp,
  XSquare,
  LayoutGrid,
  Layout,
} from "lucide-react";
import { CallContext } from "@/context/Callcontext";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    : `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// ==========================================
// COMPOSANT VIDÉO DISTANT
// ==========================================
const RemoteVideoPlayer = React.memo(
  ({ user, getUserInfo, isMini, onClick }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (user.videoTrack && videoRef.current) {
        try {
          user.videoTrack.play(videoRef.current);
        } catch (err) {}
      }
    }, [user.videoTrack]);

    const info = getUserInfo(user.uid);
    const name = info?.name || `User ${user.uid}`;
    const pic = info?.profilePicture;

    return (
      <div
        onClick={onClick}
        className={`relative w-full h-full bg-gray-900 overflow-hidden border border-gray-700 cursor-pointer transition-all ${
          isMini
            ? "rounded-lg border-0"
            : "rounded-2xl shadow-lg hover:border-blue-500"
        }`}
      >
        <div
          ref={videoRef}
          className={`w-full h-full object-contain ${
            !user.videoTrack ? "hidden" : "block"
          }`}
        />

        {!user.videoTrack && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            {pic && !isMini ? (
              <img
                src={pic}
                className="w-16 h-16 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {name.charAt(0)}
              </div>
            )}
            {!isMini && <p className="text-gray-400 text-xs mt-2">{name}</p>}
          </div>
        )}
        {!isMini && (
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs">
            {name}
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.user.uid === next.user.uid &&
    prev.user.videoTrack === next.user.videoTrack &&
    prev.isMini === next.isMini
);

RemoteVideoPlayer.displayName = "RemoteVideoPlayer";

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
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
}) {
  const { generateNumericUid } = useContext(CallContext);

  const [remoteUsers, setRemoteUsers] = useState([]);
  const remoteUsersRef = useRef([]);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ✅ GESTION DU SPOTLIGHT (Vue Principale)
  const [spotlightUser, setSpotlightUser] = useState(null); // null = mode grille auto
  const [layoutMode, setLayoutMode] = useState("grid"); // "grid" ou "spotlight"

  const [position, setPosition] = useState({
    x: window.innerWidth - 340,
    y: window.innerHeight - 260,
  });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const clientRef = useRef(null);
  const localTracksRef = useRef({
    audio: null,
    video: null,
    screenVideo: null,
  });
  const localVideoRef = useRef(null);
  const screenTrackRef = useRef(null);
  const mountedRef = useRef(true);
  const joiningRef = useRef(false);

  const getUserInfo = useCallback(
    (agoraUid) => {
      if (!callData?.participants) return null;
      const participants = Array.isArray(callData.participants)
        ? callData.participants
        : [callData.participants];
      return participants.find(
        (p) => String(generateNumericUid(p._id || p.id)) === String(agoraUid)
      );
    },
    [callData, generateNumericUid]
  );

  const updateRemoteUsers = (action, user) => {
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
      remoteUsersRef.current = newList;
      return newList;
    });
  };

  // ✅ DÉTECTION AUTOMATIQUE DU PARTAGE D'ÉCRAN DISTANT
  // Agora ne dit pas explicitement "c'est un écran", mais souvent le profil vidéo est différent.
  // Ici, on va simplifier : Si un utilisateur active sa vidéo alors qu'il n'en avait pas, on le met en spotlight.
  useEffect(() => {
    remoteUsers.forEach((user) => {
      // Si on détecte une nouvelle vidéo active, on peut supposer que c'est important
      if (user.videoTrack && layoutMode === "grid" && !spotlightUser) {
        // Optionnel : Activer auto-spotlight ici si vous voulez
      }
    });
  }, [remoteUsers]);

  // --- INITIALISATION AGORA ---
  useEffect(() => {
    if (!token || !channelName) return;
    mountedRef.current = true;

    const initAgora = async () => {
      if (joiningRef.current) return;
      joiningRef.current = true;

      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        AgoraRTC.setLogLevel(3);

        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
          });
        }
        const client = clientRef.current;
        client.removeAllListeners();

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          updateRemoteUsers("update", {
            uid: user.uid,
            [mediaType + "Track"]: user[mediaType + "Track"],
          });
          if (mediaType === "audio" && speakerOn) user.audioTrack?.play();

          // ✅ AUTO-SPOTLIGHT : Si quelqu'un partage une vidéo, on le met en grand
          if (mediaType === "video") {
            setSpotlightUser({ uid: user.uid });
            setLayoutMode("spotlight");
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          updateRemoteUsers("update", {
            uid: user.uid,
            [mediaType + "Track"]: null,
          });
        });

        client.on("user-left", (user) => {
          updateRemoteUsers("remove", user);
          // Si le spotlight part, retour grille
          if (spotlightUser?.uid === user.uid) {
            setSpotlightUser(null);
            setLayoutMode("grid");
          }
        });

        const joinChannel = async (retryCount = 0) => {
          if (!mountedRef.current) return;
          try {
            if (client.connectionState === "CONNECTED") return;
            await client.join(APP_ID, channelName, token, uid);

            if (
              !localTracksRef.current.audio &&
              !localTracksRef.current.video
            ) {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              let videoTrack;
              if (callType === "video")
                videoTrack = await AgoraRTC.createCameraVideoTrack();

              localTracksRef.current = { audio: audioTrack, video: videoTrack };
              const tracks = [audioTrack];
              if (videoTrack) tracks.push(videoTrack);

              if (client.connectionState === "CONNECTED")
                await client.publish(tracks);
              if (mountedRef.current) setLocalVideoReady(true);
            }
          } catch (error) {
            if (
              (error.code === "UID_CONFLICT" ||
                error.message?.includes("UID_CONFLICT")) &&
              retryCount < 3
            ) {
              await client.leave();
              setTimeout(() => joinChannel(retryCount + 1), 1000);
            }
          }
        };
        await joinChannel();
      } catch (err) {
        console.error("❌ Init Error:", err);
      } finally {
        joiningRef.current = false;
      }
    };
    initAgora();

    return () => {
      mountedRef.current = false;
      const leave = async () => {
        if (screenTrackRef.current) {
          const tracks = Array.isArray(screenTrackRef.current)
            ? screenTrackRef.current
            : [screenTrackRef.current];
          tracks.forEach((t) => {
            t.stop();
            t.close();
          });
        }
        localTracksRef.current.audio?.close();
        localTracksRef.current.video?.close();
        localTracksRef.current = {
          audio: null,
          video: null,
          screenVideo: null,
        };
        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current = null;
        }
      };
      leave();
    };
  }, [channelName, token, uid, callType]);

  // --- LECTURE LOCALE ---
  useEffect(() => {
    if (!localVideoReady || !localVideoRef.current) return;
    try {
      if (isScreenSharing && localTracksRef.current.screenVideo) {
        localTracksRef.current.screenVideo.play(localVideoRef.current);
      } else if (camOn && localTracksRef.current.video) {
        localTracksRef.current.video.play(localVideoRef.current);
      }
    } catch (e) {}
  }, [localVideoReady, camOn, isScreenSharing]);

  // --- ACTIONS ---
  const toggleMic = async () => {
    if (localTracksRef.current.audio) {
      const newState = !micOn;
      await localTracksRef.current.audio.setEnabled(newState);
      setMicOn(newState);
    }
  };

  const toggleCam = async () => {
    if (!localTracksRef.current.video) {
      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      try {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localTracksRef.current.video = videoTrack;
        if (
          clientRef.current &&
          clientRef.current.connectionState === "CONNECTED"
        ) {
          await clientRef.current.publish(videoTrack);
        }
        setLocalVideoReady(true);
        setCamOn(true);
      } catch (e) {}
      return;
    }
    const newState = !camOn;
    await localTracksRef.current.video.setEnabled(newState);
    setCamOn(newState);
  };

  const toggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    remoteUsers.forEach((u) => u.audioTrack?.[!speakerOn ? "play" : "stop"]());
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: "1080p_1" },
          "auto"
        );

        if (Array.isArray(screenTrack)) {
          screenTrack[0].on("track-ended", () => stopScreenShare());
          screenTrackRef.current = screenTrack;
        } else {
          screenTrack.on("track-ended", () => stopScreenShare());
          screenTrackRef.current = screenTrack;
        }

        if (clientRef.current) {
          if (localTracksRef.current.video)
            await clientRef.current.unpublish(localTracksRef.current.video);
          const tracksToPublish = Array.isArray(screenTrack)
            ? screenTrack
            : [screenTrack];
          await clientRef.current.publish(tracksToPublish);
          localTracksRef.current.screenVideo = Array.isArray(screenTrack)
            ? screenTrack[0]
            : screenTrack;

          setLocalVideoReady(false);
          setTimeout(() => setLocalVideoReady(true), 100);
        }
        setIsScreenSharing(true);
        // ✅ Quand JE partage mon écran, je passe en mode Spotlight sur moi-même pour voir ce que je diffuse (optionnel)
        setSpotlightUser({ uid: "local", isLocal: true });
        setLayoutMode("spotlight");
      }
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  const stopScreenShare = async () => {
    if (screenTrackRef.current) {
      const tracks = Array.isArray(screenTrackRef.current)
        ? screenTrackRef.current
        : [screenTrackRef.current];
      tracks.forEach((t) => {
        t.stop();
        t.close();
      });
      if (clientRef.current) await clientRef.current.unpublish(tracks);
      screenTrackRef.current = null;
    }
    if (localTracksRef.current.video && clientRef.current && camOn) {
      await clientRef.current.publish(localTracksRef.current.video);
    }
    localTracksRef.current.screenVideo = null;
    setIsScreenSharing(false);
    setLocalVideoReady(false);
    setTimeout(() => setLocalVideoReady(true), 100);

    // Retour mode grille si on arrête le partage
    if (spotlightUser?.isLocal) {
      setSpotlightUser(null);
      setLayoutMode("grid");
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };
  const handleMouseMove = useCallback((e) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
  }, []);
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (isMinimized) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMinimized, handleMouseMove]);

  // --- RENDU MINIMISÉ ---
  if (isMinimized) {
    // Priorité: Spotlight > Remote > Local
    let miniUser = null;
    if (spotlightUser && !spotlightUser.isLocal) {
      miniUser = remoteUsers.find((u) => u.uid === spotlightUser.uid);
    }
    if (!miniUser && remoteUsers.length > 0) miniUser = remoteUsers[0];

    return (
      <div
        className="fixed w-48 h-72 bg-gray-900 rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500 z-[9999] cursor-move flex flex-col"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-0 right-0 p-1 z-20">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsMinimized(false)}
            className="p-1 bg-black/50 rounded-full hover:bg-blue-600 text-white"
          >
            <Maximize2 size={12} />
          </button>
        </div>
        <div className="relative w-full h-full">
          {miniUser ? (
            <RemoteVideoPlayer
              user={miniUser}
              getUserInfo={getUserInfo}
              isMini={true}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-xs">
              {camOn || isScreenSharing ? (
                <div
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                />
              ) : (
                "Moi"
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDU MODE SPOTLIGHT (1 Gros + Liste latérale) ---
  if (layoutMode === "spotlight" && spotlightUser) {
    const isLocalSpotlight = spotlightUser.isLocal;
    const remoteSpotlightUser = !isLocalSpotlight
      ? remoteUsers.find((u) => u.uid === spotlightUser.uid)
      : null;

    // Liste des autres (à afficher en petit)
    const others = remoteUsers.filter((u) => u.uid !== spotlightUser.uid);
    if (!isLocalSpotlight) {
      // Si le spotlight est distant, je suis dans la liste "others"
      // (ajouté manuellement dans le rendu)
    }

    return (
      <div className="fixed inset-0 bg-gray-950 z-[9999] flex flex-col animate-fade-in">
        {/* HEADER */}
        <div className="absolute top-0 w-full p-4 flex justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div className="text-white font-mono bg-black/40 px-3 py-1 rounded-full">
            {formatTime(callDuration)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLayoutMode("grid")}
              className="p-2 bg-black/40 rounded hover:bg-white/20 text-white"
              title="Mode Grille"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 bg-black/40 rounded hover:bg-white/20 text-white"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* ZONE PRINCIPALE (SPOTLIGHT) */}
          <div className="flex-1 bg-black relative flex items-center justify-center p-2">
            {isLocalSpotlight ? (
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                {(camOn || isScreenSharing) && localVideoReady ? (
                  <div
                    ref={localVideoRef}
                    className={`w-full h-full object-contain ${
                      !isScreenSharing ? "transform scale-x-[-1]" : ""
                    }`}
                  />
                ) : (
                  <div className="text-white">Caméra coupée</div>
                )}
                <div className="absolute bottom-4 left-4 bg-blue-600 px-3 py-1 rounded text-white text-sm">
                  Mon écran (Spotlight)
                </div>
              </div>
            ) : remoteSpotlightUser ? (
              <RemoteVideoPlayer
                user={remoteSpotlightUser}
                getUserInfo={getUserInfo}
              />
            ) : (
              <div className="text-white">Utilisateur parti</div>
            )}
          </div>

          {/* BARRE LATÉRALE (AUTRES) */}
          <div className="w-64 bg-gray-900 border-l border-gray-800 p-2 flex flex-col gap-2 overflow-y-auto">
            {/* MOI (si je ne suis pas le spotlight) */}
            {!isLocalSpotlight && (
              <div
                onClick={() => {
                  setSpotlightUser({ isLocal: true });
                  setLayoutMode("spotlight");
                }}
                className="relative h-36 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-500"
              >
                {(camOn || isScreenSharing) && localVideoReady ? (
                  <div
                    ref={localVideoRef}
                    className={`w-full h-full object-cover ${
                      !isScreenSharing ? "transform scale-x-[-1]" : ""
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs">
                    Moi
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/50 px-2 rounded text-white text-[10px]">
                  Moi
                </div>
              </div>
            )}

            {/* LES AUTRES */}
            {others.map((user) => (
              <div
                key={user.uid}
                onClick={() => setSpotlightUser({ uid: user.uid })}
                className="h-36 cursor-pointer hover:border-blue-500 border border-transparent rounded-lg"
              >
                <RemoteVideoPlayer
                  user={user}
                  getUserInfo={getUserInfo}
                  isMini={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex justify-center items-center gap-4">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full ${
              micOn ? "bg-gray-700" : "bg-red-500 text-white"
            }`}
          >
            {micOn ? <Mic /> : <MicOff />}
          </button>
          <button
            onClick={onHangup}
            className="p-4 bg-red-600 rounded-full text-white"
          >
            <PhoneOff />
          </button>
          <button
            onClick={toggleCam}
            className={`p-3 rounded-full ${
              camOn ? "bg-gray-700" : "bg-red-500 text-white"
            }`}
          >
            {camOn ? <Video /> : <VideoOff />}
          </button>
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${
              isScreenSharing ? "bg-green-500 text-white" : "bg-gray-700"
            }`}
          >
            {isScreenSharing ? <XSquare /> : <MonitorUp />}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDU : MODE GRILLE (Classique)
  // ==========================================
  const totalUsers = remoteUsers.length + 1;
  const gridClass =
    totalUsers <= 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-2 md:grid-cols-3";

  return (
    <div className="fixed inset-0 bg-gray-950 z-[9999] flex flex-col animate-fade-in">
      {/* HEADER */}
      <div className="absolute top-0 w-full p-4 flex justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex gap-2">
          <div className="text-white bg-black/40 px-3 py-1 rounded-full text-sm">
            {callData?.name}
          </div>
          <div className="text-green-400 bg-black/40 px-3 py-1 rounded-full text-sm font-mono">
            {formatTime(callDuration)}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLayoutMode("spotlight")}
            className="p-2 bg-black/40 rounded hover:bg-white/20 text-white"
            title="Mode Spotlight"
          >
            <Layout size={20} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 bg-black/40 rounded hover:bg-white/20 text-white"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      </div>

      {/* ERROR */}
      {callError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full z-50">
          {callError}
        </div>
      )}

      {/* GRID */}
      <div className="flex-1 p-4 pt-20 pb-28 flex items-center justify-center">
        <div className={`grid gap-4 w-full h-full ${gridClass} max-w-6xl`}>
          {/* MOI */}
          <div
            onClick={() => {
              setSpotlightUser({ isLocal: true });
              setLayoutMode("spotlight");
            }}
            className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 cursor-pointer hover:border-blue-500 transition-all"
          >
            {(camOn || isScreenSharing) && localVideoReady ? (
              <div
                ref={localVideoRef}
                className={`w-full h-full object-cover ${
                  !isScreenSharing ? "transform scale-x-[-1]" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2">
                  <Users size={32} />
                </div>
                <p>Caméra désactivée</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-blue-600/90 px-3 py-1 rounded-lg text-white text-xs backdrop-blur-sm">
              Moi {micOn ? "" : "(Micro off)"}
            </div>
          </div>

          {/* AUTRES */}
          {remoteUsers.map((user) => (
            <RemoteVideoPlayer
              key={user.uid}
              user={user}
              getUserInfo={getUserInfo}
              onClick={() => {
                setSpotlightUser({ uid: user.uid });
                setLayoutMode("spotlight");
              }}
            />
          ))}
        </div>
      </div>

      {/* BARRE DE CONTRÔLE (Toujours visible) */}
      <div className="absolute bottom-0 w-full p-6 flex justify-center items-center gap-4 bg-gradient-to-t from-black/95 to-transparent">
        <button
          onClick={toggleSpeaker}
          className={`p-4 rounded-full transition-all ${
            speakerOn ? "bg-gray-700 text-white" : "bg-white text-black"
          }`}
          title="Speaker"
        >
          {speakerOn ? <Volume2 /> : <VolumeX />}
        </button>
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${
            micOn ? "bg-gray-700 text-white" : "bg-red-500 text-white"
          }`}
          title="Micro"
        >
          {micOn ? <Mic /> : <MicOff />}
        </button>
        <button
          onClick={onHangup}
          className="p-5 bg-red-600 rounded-full text-white hover:bg-red-700 shadow-xl hover:scale-110 transition-all mx-4"
          title="Raccrocher"
        >
          <PhoneOff size={32} fill="currentColor" />
        </button>
        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition-all ${
            camOn ? "bg-gray-700 text-white" : "bg-red-500 text-white"
          }`}
          title="Caméra"
        >
          {camOn ? <Video /> : <VideoOff />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-all hidden md:block ${
            isScreenSharing
              ? "bg-green-500 text-white"
              : "bg-gray-700 text-white"
          }`}
          title="Partager écran"
        >
          {isScreenSharing ? <XSquare /> : <MonitorUp />}
        </button>
      </div>
    </div>
  );
}
