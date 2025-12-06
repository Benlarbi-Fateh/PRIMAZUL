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
} from "lucide-react";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

export default function GroupVideoCall({
  channelName,
  token,
  uid,
  callType = "video",
  onHangup,
}) {
  // 📊 États
  const [remoteUsers, setRemoteUsers] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [ready, setReady] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // 📦 Refs pour Agora
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoDiv = useRef(null);
  const mountedRef = useRef(false);

  // ============================================
  // 🚀 INITIALISATION AGORA
  // ============================================
  useEffect(() => {
    setReady(true);
    mountedRef.current = true;

    const initAgora = async () => {
      try {
        console.log("🎬 Initialisation Agora pour groupe...");
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

        // Créer le client
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
          });
        }
        const client = clientRef.current;
        client.removeAllListeners();

        // 🎧 ÉCOUTEUR : Publication d'un utilisateur distant
        client.on("user-published", async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);
            console.log(`✅ Abonné à ${user.uid} pour ${mediaType}`);

            setRemoteUsers((prev) => {
              const existing = prev[user.uid] || {};

              return {
                ...prev,
                [user.uid]: {
                  videoTrack:
                    mediaType === "video"
                      ? user.videoTrack
                      : existing.videoTrack || null,
                  audioTrack:
                    mediaType === "audio"
                      ? user.audioTrack
                      : existing.audioTrack || null,
                },
              };
            });

            // ✅ JOUER L'AUDIO IMMÉDIATEMENT
            if (mediaType === "audio" && user.audioTrack) {
              user.audioTrack.play();
              console.log(`🔊 Audio de ${user.uid} en lecture`);
            }
          } catch (error) {
            console.error(`❌ Erreur subscribe ${user.uid}:`, error);
          }
        });

        // 🎧 ÉCOUTEUR : Dépublication d'un track
        client.on("user-unpublished", (user, mediaType) => {
          console.log(`❌ ${user.uid} a dépublié ${mediaType}`);
          setRemoteUsers((prev) => {
            const updated = { ...prev };
            if (updated[user.uid]) {
              if (mediaType === "video") {
                updated[user.uid].videoTrack = null;
              } else if (mediaType === "audio") {
                updated[user.uid].audioTrack = null;
              }
            }
            return updated;
          });
        });

        // 🎧 ÉCOUTEUR : Utilisateur quitte
        client.on("user-left", (user) => {
          console.log(`👋 ${user.uid} a quitté`);
          setRemoteUsers((prev) => {
            const updated = { ...prev };
            delete updated[user.uid];
            return updated;
          });
        });

        // ✅ CONNEXION AU CHANNEL
        if (client.connectionState === "DISCONNECTED") {
          await client.join(APP_ID, channelName, token, uid || null);
          console.log("✅ Connecté au channel:", channelName);
        }

        // ✅ CRÉATION DES TRACKS LOCAUX
        if (!localTracksRef.current.audio) {
          let audioTrack, videoTrack;

          if (callType === "video") {
            // Vidéo : Créer micro + caméra
            [audioTrack, videoTrack] =
              await AgoraRTC.createMicrophoneAndCameraTracks();
          } else {
            // Audio : Créer seulement le micro
            audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          }

          // Vérifier si toujours monté
          if (!mountedRef.current) {
            audioTrack.close();
            if (videoTrack) videoTrack.close();
            return;
          }

          localTracksRef.current = {
            audio: audioTrack,
            video: videoTrack || null,
          };

          // Afficher ma vidéo localement
          if (callType === "video" && videoTrack && localVideoDiv.current) {
            localVideoDiv.current.innerHTML = "";
            videoTrack.play(localVideoDiv.current);
          }

          // Publier mes tracks
          const tracks = [audioTrack];
          if (videoTrack) tracks.push(videoTrack);
          await client.publish(tracks);
          console.log("✅ Tracks publiés");
        }
      } catch (error) {
        console.error("❌ Erreur Agora:", error);
        alert("Erreur lors de l'initialisation de l'appel: " + error.message);
      }
    };

    const timer = setTimeout(() => initAgora(), 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callType, channelName, token, uid]);

  // ============================================
  // 🧹 NETTOYAGE
  // ============================================
  const cleanup = async () => {
    console.log("🧹 Nettoyage Agora...");

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
      } catch (e) {
        console.error("Erreur déconnexion:", e);
      }
      clientRef.current = null;
    }
  };

  // ============================================
  // 🎛️ CONTRÔLES
  // ============================================
  const toggleMic = async () => {
    if (localTracksRef.current.audio) {
      await localTracksRef.current.audio.setEnabled(!micOn);
      setMicOn(!micOn);
      console.log("🎤 Micro:", !micOn ? "ON" : "OFF");
    }
  };

  const toggleCam = async () => {
    if (localTracksRef.current.video) {
      await localTracksRef.current.video.setEnabled(!camOn);
      setCamOn(!camOn);
      console.log("📹 Caméra:", !camOn ? "ON" : "OFF");
    }
  };

  const handleHangup = async () => {
    console.log("📞 Raccrochage...");
    await cleanup();
    onHangup();
  };

  // ============================================
  // 🎥 COMPOSANT VIDÉO DISTANTE
  // ============================================
  const RemoteVideoPlayer = ({ user }) => {
    const ref = useRef(null);

    useEffect(() => {
      if (user.videoTrack && ref.current) {
        ref.current.innerHTML = "";
        user.videoTrack.play(ref.current);
      }
    }, [user]);

    return (
      <div
        ref={ref}
        className="w-full h-full object-cover bg-black rounded-xl"
      />
    );
  };

  if (!ready) return null;

  // ============================================
  // 🎨 CALCUL DES PARTICIPANTS
  // ============================================
  const remoteUsersList = Object.entries(remoteUsers);
  const totalParticipants = remoteUsersList.length + 1; // +1 pour moi

  // Grille : 2x2 si ≤4 personnes, sinon 3x3
  const gridCols = totalParticipants <= 4 ? "grid-cols-2" : "grid-cols-3";

  // ============================================
  // 🎨 STYLES & RENDU
  // ============================================
  const containerClass = isMinimized
    ? "fixed bottom-4 right-4 w-80 h-52 z-[9999] rounded-2xl shadow-2xl overflow-hidden border border-white/20 bg-slate-900"
    : "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm";

  return (
    <div className={containerClass}>
      <div
        className={`relative flex flex-col bg-slate-950 overflow-hidden ${
          isMinimized
            ? "w-full h-full"
            : "w-full max-w-6xl h-[85vh] rounded-3xl border border-white/10 shadow-2xl"
        }`}
      >
        {/* ============================================
            📋 HEADER
            ============================================ */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
          <span className="px-3 py-1.5 bg-black/40 backdrop-blur rounded-lg text-xs text-white/90 border border-white/10 font-medium">
            {isMinimized
              ? "Appel groupe"
              : `Appel de groupe • ${totalParticipants} participant${
                  totalParticipants > 1 ? "s" : ""
                }`}
          </span>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={18} />}
          </button>
        </div>

        {/* ============================================
            🎥 GRILLE VIDÉO
            ============================================ */}
        <div
          className={`flex-1 p-4 ${
            isMinimized ? "hidden" : `grid ${gridCols} gap-3`
          }`}
        >
          {/* 🎥 MA VIDÉO (Locale) */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-white/10 shadow-lg">
            {callType === "video" ? (
              <div
                ref={localVideoDiv}
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              // Mode audio : Avatar
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-2">
                  <Mic className="w-8 h-8 text-white animate-pulse" />
                </div>
                <p className="text-white text-sm">Vous (Audio)</p>
              </div>
            )}

            {/* Badge "Vous" */}
            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur font-medium">
              Vous
            </span>

            {/* Indicateur micro */}
            {!micOn && (
              <div className="absolute top-2 left-2 bg-red-500/90 p-1.5 rounded-full">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* 🎥 VIDÉOS DISTANTES */}
          {remoteUsersList.map(([uid, data]) => (
            <div
              key={uid}
              className="relative bg-gray-900 rounded-xl overflow-hidden border border-white/10 shadow-lg"
            >
              {data.videoTrack ? (
                <RemoteVideoPlayer user={data} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                  <User className="w-10 h-10 text-white/70" />
                  <p className="text-sm text-white/70 mt-2">Audio seulement</p>
                </div>
              )}

              {/* Badge participant */}
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur font-medium">
                Participant {uid}
              </span>
            </div>
          ))}

          {/* Placeholder si personne d'autre */}
          {remoteUsersList.length === 0 && (
            <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
              <div className="flex flex-col items-center text-gray-500">
                <User className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">En attente de participants...</p>
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            🎛️ CONTRÔLES
            ============================================ */}
        <div
          className={`flex items-center justify-center gap-4 bg-slate-900 border-t border-white/10 ${
            isMinimized ? "p-2" : "p-6"
          }`}
        >
          {/* Bouton Micro */}
          <button
            onClick={toggleMic}
            className={`rounded-full flex items-center justify-center transition ${
              isMinimized
                ? "p-2 bg-slate-800"
                : "p-4 bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {micOn ? (
              <Mic size={isMinimized ? 16 : 24} className="text-white" />
            ) : (
              <MicOff size={isMinimized ? 16 : 24} className="text-red-500" />
            )}
          </button>

          {/* Bouton Raccrocher */}
          <button
            onClick={handleHangup}
            className={`rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition ${
              isMinimized ? "p-2" : "p-4 hover:scale-110"
            }`}
          >
            <PhoneOff size={isMinimized ? 18 : 32} fill="currentColor" />
          </button>

          {/* Bouton Caméra (si vidéo) */}
          {callType === "video" && (
            <button
              onClick={toggleCam}
              className={`rounded-full flex items-center justify-center transition ${
                isMinimized
                  ? "p-2 bg-slate-800"
                  : "p-4 bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {camOn ? (
                <VideoIcon
                  size={isMinimized ? 16 : 24}
                  className="text-white"
                />
              ) : (
                <VideoOff
                  size={isMinimized ? 16 : 24}
                  className="text-red-500"
                />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}