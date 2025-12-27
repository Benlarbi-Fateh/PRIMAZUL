"use client";

import { useEffect, useState, useRef, useContext, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Minimize2,
  Maximize2,
  Clock,
  Users,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  RotateCcw,
  PhoneIncoming,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CallContext } from "@/context/Callcontext";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// Formater le temps
const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Indicateur réseau
const NetworkIndicator = ({ quality }) => {
  const getColor = () => {
    switch (quality) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-green-400";
      case "medium":
        return "bg-yellow-500";
      case "poor":
        return "bg-orange-500";
      case "bad":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };
  const getBars = () => {
    switch (quality) {
      case "excellent":
        return 4;
      case "good":
        return 3;
      case "medium":
        return 2;
      case "poor":
        return 1;
      default:
        return 0;
    }
  };
  const bars = getBars();
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all ${
            i <= bars ? getColor() : "bg-white/30"
          }`}
          style={{ height: `${i * 25}%` }}
        />
      ))}
    </div>
  );
};

export default function VideoCall({
  channelName,
  token,
  uid,
  onHangup,
  callType = "video",
  callData,
  callState = "connecting",
  callDuration = 0,
  callError = null,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { generateNumericUid } = useContext(CallContext);

  // États
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionState, setConnectionState] = useState("CONNECTING");
  const [networkQuality, setNetworkQuality] = useState("good");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Refs
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoRef = useRef(null);
  const mountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const isJoiningRef = useRef(false); // ✅ Verrou pour éviter le double join

  // Obtenir infos participant
  const getParticipantInfo = useCallback(
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

  // =========================================================
  // 1. CLEANUP & HANGUP
  // =========================================================
  const cleanup = useCallback(async () => {
    console.log("🧹 Nettoyage Agora...");
    try {
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
        // Supprimer les listeners avant de quitter
        clientRef.current.removeAllListeners();

        // On ne quitte que si on est connecté ou en connexion
        if (clientRef.current.connectionState !== "DISCONNECTED") {
          await clientRef.current.leave();
        }
        clientRef.current = null;
      }
      setRemoteUsers([]);
      setLocalVideoReady(false);
      isJoiningRef.current = false;
    } catch (e) {
      console.error("Erreur Cleanup:", e);
    }
  }, []);

  const handleHangup = useCallback(async () => {
    await cleanup();
    if (onHangup) onHangup();
  }, [cleanup, onHangup]);

  // =========================================================
  // 2. INITIALISATION AGORA (CORRIGÉE)
  // =========================================================
  // frontend/src/components/Chat/VideoCall.jsx

const initAgora = useCallback(async () => {
  if (!channelName || !token) {
    console.log("⚠️ Pas de channelName ou token, abandon");
    return;
  }
  if (isJoiningRef.current) {
    console.log("⚠️ Jointure déjà en cours, abandon");
    return;
  }

  try {
    isJoiningRef.current = true;
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    AgoraRTC.setLogLevel(3);

    // Créer le client une seule fois
    if (!clientRef.current) {
      console.log("🔧 Création du client Agora");
      clientRef.current = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });
    }
    const client = clientRef.current;

    // Éviter les double listeners
    client.removeAllListeners();

    // ===== LISTENERS (votre code existant) =====
    client.on("connection-state-change", (curState, prevState, reason) => {
      console.log(`📡 État connexion: ${prevState} → ${curState} (${reason || 'normal'})`);
      if (mountedRef.current) setConnectionState(curState);

      if (curState === "RECONNECTING") setIsReconnecting(true);
      else if (curState === "CONNECTED") {
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
      } else if (curState === "DISCONNECTED" && reason === "NETWORK_ERROR") {
        handleReconnect();
      }
    });

    client.on("network-quality", (stats) => {
      const quality = Math.round(
        (stats.uplinkNetworkQuality + stats.downlinkNetworkQuality) / 2
      );
      if (quality <= 1) setNetworkQuality("excellent");
      else if (quality <= 2) setNetworkQuality("good");
      else if (quality <= 4) setNetworkQuality("medium");
      else setNetworkQuality("poor");
    });

    client.on("user-published", async (user, mediaType) => {
      console.log(`👤 Utilisateur ${user.uid} a publié ${mediaType}`);
      if (String(user.uid) === String(uid)) return;
      
      try {
        await client.subscribe(user, mediaType);
        console.log(`✅ Souscrit à ${mediaType} de ${user.uid}`);

        if (mountedRef.current) {
          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === user.uid);
            if (exists) {
              return prev.map((u) =>
                u.uid === user.uid
                  ? { ...u, [mediaType + "Track"]: user[mediaType + "Track"] }
                  : u
              );
            }
            return [...prev, user];
          });
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
          console.log(`🔊 Lecture audio de ${user.uid}`);
        }
      } catch (error) {
        console.error(`❌ Erreur souscription ${mediaType}:`, error);
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      console.log(`👤 Utilisateur ${user.uid} a dépublié ${mediaType}`);
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, [mediaType + "Track"]: null } : u
        )
      );
    });

    client.on("user-left", (user) => {
      console.log(`👋 Utilisateur ${user.uid} a quitté`);
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    client.on("token-privilege-did-expire", () => {
      console.error("❌ Token expiré");
      handleHangup();
    });

    // ===== JOINTURE DU CANAL =====
    if (client.connectionState === "DISCONNECTED") {
      console.log(`🚀 Jointure du canal ${channelName} avec UID ${uid}`);
      await client.join(APP_ID, channelName, token, uid);
      console.log("✅ Canal rejoint avec succès");
    } else {
      console.log(`ℹ️ Déjà connecté (état: ${client.connectionState})`);
    }

    if (!mountedRef.current) {
      console.log("⚠️ Composant démonté, abandon");
      return;
    }

    // ===== CRÉATION DES PISTES LOCALES =====
    console.log("🎤 Création des pistes audio/vidéo locales...");
    
    // ✅ FIX: Vérifier que les pistes existent AVANT de les fermer
    if (localTracksRef.current.audio) {
      try {
        localTracksRef.current.audio.stop();
        localTracksRef.current.audio.close();
        console.log("🗑️ Ancienne piste audio fermée");
      } catch (e) {
        console.warn("Erreur fermeture audio:", e);
      }
    }
    if (localTracksRef.current.video) {
      try {
        localTracksRef.current.video.stop();
        localTracksRef.current.video.close();
        console.log("🗑️ Ancienne piste vidéo fermée");
      } catch (e) {
        console.warn("Erreur fermeture vidéo:", e);
      }
    }

    // Créer l'audio
    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: "music_standard",
      AEC: true,
      ANS: true,
      AGC: true,
    });
    console.log("✅ Piste audio créée");

    let videoTrack = null;
    if (callType === "video") {
      try {
        const cameras = await AgoraRTC.getCameras();
        if (cameras.length > 0) {
          const cameraId = selectedCamera || cameras[0]?.deviceId;
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "720p_2",
            cameraId,
          });
          console.log("✅ Piste vidéo créée");
        } else {
          console.warn("⚠️ Aucune caméra détectée");
        }
      } catch (e) {
        console.error("❌ Erreur création vidéo:", e);
      }
    }

    if (!mountedRef.current) {
      audioTrack?.close();
      videoTrack?.close();
      console.log("⚠️ Composant démonté après création pistes");
      return;
    }

    localTracksRef.current = { audio: audioTrack, video: videoTrack };

    if (videoTrack) {
      setLocalVideoReady(true);
    }

    // ===== PUBLICATION =====
    if (client.connectionState === "CONNECTED") {
      const tracks = [audioTrack];
      if (videoTrack) tracks.push(videoTrack);
      
      console.log(`📤 Publication de ${tracks.length} piste(s)...`);
      await client.publish(tracks);
      console.log("✅ Pistes publiées avec succès");
      console.log(`📊 Participants dans le canal: ${client.remoteUsers.length + 1}`);
    } else {
      console.error(`❌ Impossible de publier: État client = ${client.connectionState}`);
    }
  } catch (error) {
    console.error("❌ Erreur Agora Init:", error);
    console.error("Détails:", error.message, error.code);
  } finally {
    isJoiningRef.current = false;
  }
}, [channelName, token, uid, callType, selectedCamera, handleHangup]);

  const handleReconnect = async () => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      console.log(`Reconnexion tentative ${reconnectAttemptsRef.current}...`);
      try {
        await initAgora();
      } catch (e) {
        setTimeout(handleReconnect, 2000);
      }
    } else {
      handleHangup();
    }
  };

  // =========================================================
  // 3. EFFETS & RENDER
  // =========================================================

  // Lecture vidéo locale une fois la div prête
  useEffect(() => {
    if (
      localVideoReady &&
      localTracksRef.current.video &&
      localVideoRef.current
    ) {
      console.log("▶️ Lecture vidéo locale");
      localTracksRef.current.video.play(localVideoRef.current);
    }
  }, [localVideoReady, camOn]);

  // Montage initial
  useEffect(() => {
    mountedRef.current = true;

    // Petit délai pour laisser le temps au DOM de se stabiliser
    const timer = setTimeout(() => {
      initAgora();
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  const toggleMic = async () => {
    if (localTracksRef.current.audio) {
      const newState = !micOn;
      await localTracksRef.current.audio.setEnabled(newState);
      setMicOn(newState);
    }
  };

  const toggleCam = async () => {
    if (localTracksRef.current.video) {
      const newState = !camOn;
      await localTracksRef.current.video.setEnabled(newState);
      setCamOn(newState);
    }
  };

  const toggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    remoteUsers.forEach((u) => {
      if (u.audioTrack) {
        speakerOn ? u.audioTrack.stop() : u.audioTrack.play();
      }
    });
  };

  const switchCamera = async () => {
    if (!localTracksRef.current.video) return;
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
    const cameras = await AgoraRTC.getCameras();
    if (cameras.length < 2) return;

    const current = cameras.findIndex((c) => c.deviceId === selectedCamera);
    const next = cameras[(current + 1) % cameras.length];

    await localTracksRef.current.video.setDevice(next.deviceId);
    setSelectedCamera(next.deviceId);
  };

  // Composant Video Distant
  const RemoteVideoPlayer = ({ user }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (user.videoTrack && ref.current) {
        user.videoTrack.play(ref.current);
      }
    }, [user.videoTrack]);

    const info = getParticipantInfo(user.uid);
    const name = info?.name || "Participant";
    const pic = info?.profilePicture;

    return (
      <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
        {user.videoTrack ? (
          <div ref={ref} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            {pic ? (
              <img
                src={pic}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-3xl text-white font-bold">
                  {name.charAt(0)}
                </span>
              </div>
            )}
            <p className="mt-4 text-white font-medium">{name}</p>
            <p className="text-white/50 text-sm">Audio uniquement</p>
          </div>
        )}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur rounded-full text-white text-sm">
          {name}
        </div>
      </div>
    );
  };

  // Styles & Grid
  const containerClass = isMinimized
    ? "fixed bottom-4 right-4 w-80 z-[9999] rounded-2xl shadow-2xl overflow-hidden border border-white/10"
    : "fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col";

  const totalUsers = remoteUsers.length + 1;
  let gridClass = "grid-cols-1";
  if (totalUsers === 2) gridClass = "grid-cols-1 md:grid-cols-2";
  else if (totalUsers > 2) gridClass = "grid-cols-2";

  return (
    <div className={containerClass}>
      <div
        className={`relative flex flex-col overflow-hidden ${
          isMinimized ? "w-full h-auto" : "w-full h-full"
        } ${isDark ? "bg-slate-950" : "bg-gray-900"}`}
      >
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              {callData?.isGroup ? (
                <Users size={14} className="text-purple-400" />
              ) : (
                <PhoneIncoming size={14} className="text-green-400" />
              )}
              <span className="text-white text-sm font-medium">
                {callData?.name || "Appel"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              <NetworkIndicator quality={networkQuality} />
              <span className="text-white text-sm font-mono">
                {formatTime(callDuration)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 bg-black/40 rounded-full"
          >
            {isMinimized ? (
              <Maximize2 size={16} className="text-white" />
            ) : (
              <Minimize2 size={16} className="text-white" />
            )}
          </button>
        </div>

        {/* VIDEOS */}
        <div
          className={`flex-1 p-2 md:p-4 overflow-hidden ${
            isMinimized ? "h-52" : "pt-16 pb-24"
          }`}
        >
          {remoteUsers.length > 0 ? (
            <div className={`grid gap-2 md:gap-4 h-full ${gridClass}`}>
              {/* MOI */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg bg-slate-800">
                {callType === "video" && camOn && localVideoReady ? (
                  <div
                    ref={localVideoRef}
                    className="w-full h-full object-cover transform rotate-y-180"
                    style={{ transform: "rotateY(180deg)" }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                    <div className="p-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                      {callType === "video" ? (
                        <VideoOff className="w-10 h-10 text-white" />
                      ) : (
                        <Mic className="w-10 h-10 text-white animate-pulse" />
                      )}
                    </div>
                    {!isMinimized && (
                      <p className="mt-4 text-white/80 text-sm">
                        {callType === "video"
                          ? "Caméra désactivée"
                          : "Appel audio"}
                      </p>
                    )}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-600/80 backdrop-blur-sm rounded-full text-white text-sm">
                  Moi
                </div>
              </div>

              {/* AUTRES */}
              {remoteUsers.map((user) => (
                <RemoteVideoPlayer key={user.uid} user={user} />
              ))}
            </div>
          ) : (
            /* EN ATTENTE */
            <div className="h-full flex items-center justify-center text-center">
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-green-500 animate-pulse overflow-hidden bg-slate-800">
                  {callData?.profilePicture ? (
                    <img
                      src={callData.profilePicture}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-16 h-16 text-white m-auto mt-7" />
                  )}
                </div>
              </div>
              <h2 className="text-white text-xl font-bold">{callData?.name}</h2>
              <p className="text-white/60 text-sm">
                {callState === "ringing" ? "Sonnerie..." : "Connexion..."}
              </p>
            </div>
          )}
        </div>

        {/* CONTROLES */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-5 pb-6 pt-10 bg-gradient-to-t from-black/90 to-transparent ${
            isMinimized ? "hidden" : ""
          }`}
        >
          <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full transition hover:scale-105 ${
              speakerOn ? "bg-white/10 text-white" : "bg-white text-black"
            }`}
          >
            {speakerOn ? <Volume2 /> : <VolumeX />}
          </button>
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition hover:scale-105 ${
              micOn ? "bg-white/10 text-white" : "bg-red-500 text-white"
            }`}
          >
            {micOn ? <Mic /> : <MicOff />}
          </button>
          <button
            onClick={handleHangup}
            className="p-5 bg-red-600 rounded-full text-white hover:bg-red-700 transition hover:scale-110 shadow-lg"
          >
            <PhoneOff size={28} />
          </button>
          {callType === "video" && (
            <button
              onClick={toggleCam}
              className={`p-4 rounded-full transition hover:scale-105 ${
                camOn ? "bg-white/10 text-white" : "bg-red-500 text-white"
              }`}
            >
              {camOn ? <VideoIcon /> : <VideoOff />}
            </button>
          )}
          {callType === "video" && camOn && (
            <button
              onClick={switchCamera}
              className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 md:block hidden"
            >
              <RotateCcw />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
