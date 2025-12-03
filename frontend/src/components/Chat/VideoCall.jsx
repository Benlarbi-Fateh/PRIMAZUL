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

export default function VideoCall({
  channelName,
  token,
  uid,
  onHangup,
  callType = "video",
}) {
  const [users, setUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [ready, setReady] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // ✅ État pour réduire

  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoDiv = useRef(null);
  const mountedRef = useRef(false);

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

        // --- Événements ---
        client.on("user-published", async (user, mediaType) => {
          if (client.uid === user.uid) return; // Ghost check
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            setUsers((prev) => {
              if (prev.find((u) => String(u.uid) === String(user.uid)))
                return prev;
              return [...prev, user];
            });
          }
          if (mediaType === "audio") user.audioTrack.play();
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video")
            setUsers((prev) =>
              prev.filter((u) => String(u.uid) !== String(user.uid))
            );
        });

        client.on("user-left", (user) => {
          setUsers((prev) =>
            prev.filter((u) => String(u.uid) !== String(user.uid))
          );
        });

        // --- Connexion ---
        if (client.connectionState === "DISCONNECTED") {
          await client.join(APP_ID, channelName, token, uid || null);
        }

        // --- Tracks ---
        if (!localTracksRef.current.audio) {
          let audioTrack, videoTrack;

          // ✅ Création conditionnelle selon le type
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

          // Lecture locale (si vidéo)
          if (callType === "video" && videoTrack && localVideoDiv.current) {
            localVideoDiv.current.innerHTML = "";
            videoTrack.play(localVideoDiv.current);
          }

          // Publication
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

  // --- UTILS ---
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
    return <div ref={ref} className="w-full h-full object-cover bg-black" />;
  };

  if (!ready) return null;

  // --- STYLES DYNAMIQUES (MINIMIZE) ---
  const containerClass = isMinimized
    ? "fixed bottom-4 right-4 w-72 h-auto z-[9999] rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 border border-white/20 bg-slate-900 pointer-events-auto"
    : "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-500 pointer-events-auto"; // pointer-events-auto ici car c'est une modale

  return (
    <div className={containerClass}>
      {/* Carte Principale */}
      <div
        className={`
         relative flex flex-col bg-slate-950 overflow-hidden
         ${
           isMinimized
             ? "w-full h-full"
             : "w-full max-w-5xl h-[80vh] rounded-3xl border border-white/10 shadow-2xl"
         }
      `}
      >
        {/* Header (Bouton Réduire) */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
          <span className="px-2 py-1 bg-black/40 backdrop-blur rounded text-xs text-white/80 border border-white/10">
            {isMinimized
              ? "Appel en cours"
              : callType === "video"
              ? "Appel Vidéo"
              : "Appel Audio"}
          </span>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur transition"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={18} />}
          </button>
        </div>

        {/* Zone Contenu */}
        <div
          className={`relative flex-1 bg-gray-900 ${isMinimized ? "h-40" : ""}`}
        >
          {/* --- UTILISATEUR DISTANT (Prend tout l'espace) --- */}
          {users.length > 0 ? (
            <div className="absolute inset-0 w-full h-full">
              <RemoteVideoPlayer user={users[0]} />
            </div>
          ) : (
            // Attente
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center animate-pulse">
                <User className="w-16 h-16 text-gray-600 mb-2" />
                {!isMinimized && (
                  <p className="text-gray-400 text-sm">En attente...</p>
                )}
              </div>
            </div>
          )}

          {/* --- MOI (Miniature / PiP) --- */}
          {/* Si vidéo activée, on me voit en petit coin. Si audio, juste une icône */}
          <div
            className={`
                absolute bottom-4 right-4 overflow-hidden rounded-xl border border-white/20 shadow-lg bg-gray-800 z-10
                ${isMinimized ? "w-16 h-20 bottom-2 right-2" : "w-32 h-44"}
            `}
          >
            {callType === "video" ? (
              <div
                ref={localVideoDiv}
                className="w-full h-full object-cover bg-black transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-900/50">
                <Mic className="w-6 h-6 text-white animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* --- CONTROLES --- */}
        <div
          className={`
            flex items-center justify-center gap-4 bg-slate-900 border-t border-white/10
            ${isMinimized ? "p-2" : "p-6"}
        `}
        >
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
