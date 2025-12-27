"use client";

import { useEffect, useState, useRef, useContext, useCallback } from "react";
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  Minimize2, Maximize2, Users, Volume2, VolumeX, AlertCircle
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { CallContext } from "@/context/Callcontext";
import api from "@/lib/api";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const NetworkIndicator = ({ quality }) => {
  const bars = quality === "excellent" ? 4 : quality === "good" ? 3 : quality === "medium" ? 2 : 1;
  const color = quality === "excellent" ? "bg-green-500" : quality === "good" ? "bg-green-400" : quality === "medium" ? "bg-yellow-500" : "bg-orange-500";
  
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`w-1 rounded-sm ${i <= bars ? color : "bg-white/30"}`} style={{ height: `${i * 25}%` }} />
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
  callError: externalCallError = null // 🔥 Renommer pour éviter conflit
}) {
  const { theme } = useTheme();
  const { generateNumericUid } = useContext(CallContext);

  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [networkQuality, setNetworkQuality] = useState("good");
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [usersInfo, setUsersInfo] = useState({});
  
  // 🔥 AJOUT : État local pour les erreurs
  const [internalError, setInternalError] = useState(null);

  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoRef = useRef(null);
  const mountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // 🔥 Utiliser l'erreur externe OU interne
  const displayError = externalCallError || internalError;

  // ============================================
  // MAPPING DES PARTICIPANTS
  // ============================================
  useEffect(() => {
    if (!callData) return;
    
    console.log("📊 CallData:", callData);
    
    let allParticipants = [];
    
    if (callData.participants) {
      const parts = Array.isArray(callData.participants) 
        ? callData.participants 
        : [callData.participants];
      allParticipants = [...parts];
    }
    
    if (callData.members) {
      allParticipants = [...allParticipants, ...callData.members];
    }
    
    const mapping = {};
    
    allParticipants.forEach((p) => {
      if (!p) return;
      
      const mongoId = p._id || p.id || p.userId;
      if (!mongoId) return;
      
      const agoraUid = generateNumericUid(mongoId);
      
      mapping[agoraUid] = {
        name: p.name || p.username || "Utilisateur",
        profilePicture: p.profilePicture || p.avatar,
        userId: mongoId
      };
      
      console.log(`✅ ${mapping[agoraUid].name} → ${agoraUid}`);
    });
    
    if (!mapping[uid]) {
      mapping[uid] = {
        name: "Vous",
        profilePicture: null,
        userId: "local"
      };
    }
    
    setUsersInfo(mapping);
  }, [callData, generateNumericUid, uid]);

  // ============================================
  // CLEANUP
  // ============================================
  const cleanup = useCallback(async () => {
    console.log("🧹 Cleanup...");
    
    isInitializingRef.current = false;
    isInitializedRef.current = false;
    
    try {
      // 🔥 Arrêter tracks AVANT de les fermer
      if (localTracksRef.current.audio) {
        try {
          await localTracksRef.current.audio.setEnabled(false);
          localTracksRef.current.audio.stop();
          localTracksRef.current.audio.close();
        } catch (e) {
          console.warn("⚠️ Erreur audio cleanup:", e);
        }
      }
      
      if (localTracksRef.current.video) {
        try {
          await localTracksRef.current.video.setEnabled(false);
          localTracksRef.current.video.stop();
          localTracksRef.current.video.close();
        } catch (e) {
          console.warn("⚠️ Erreur vidéo cleanup:", e);
        }
      }
      
      localTracksRef.current = { audio: null, video: null };

      if (clientRef.current) {
        try {
          const state = clientRef.current.connectionState;
          
          if (state === "CONNECTED") {
            await clientRef.current.unpublish().catch(e => console.warn("unpublish:", e));
          }
          
          if (state !== "DISCONNECTED") {
            await clientRef.current.leave().catch(e => console.warn("leave:", e));
          }
        } catch (e) {
          console.warn("⚠️ Cleanup client:", e);
        }
        
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      
      setRemoteUsers([]);
      setLocalVideoReady(false);
      setInternalError(null);
      
      console.log("✅ Cleanup OK");
    } catch (e) {
      console.error("❌ Cleanup error:", e);
    }
  }, []);

  // ============================================
  // HANGUP
  // ============================================
  const handleHangup = useCallback(async () => {
    await cleanup();
    if (onHangup) onHangup();
  }, [cleanup, onHangup]);

  // ============================================
  // INIT AGORA
  // ============================================
  const initAgora = useCallback(async () => {
    if (isInitializingRef.current || isInitializedRef.current) {
      console.log("⏭️ Init déjà en cours/terminée");
      return;
    }

    if (!channelName || !token || !APP_ID) {
      console.warn("⚠️ Paramètres manquants");
      return;
    }

    try {
      isInitializingRef.current = true;
      console.log("\n🎥 === INIT AGORA ===");
      console.log("Channel:", channelName);
      console.log("UID:", uid);
      console.log("Type:", callType);

      const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
      AgoraRTC.setLogLevel(1);

      if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ 
          mode: "rtc", 
          codec: "vp8"
        });
        console.log("✅ Client créé");
      }

      const client = clientRef.current;
      client.removeAllListeners();

      // ============================================
      // LISTENERS
      // ============================================
      client.on("connection-state-change", (curState, prevState, reason) => {
        console.log(`📡 ${prevState} → ${curState} (${reason})`);
        
        if (curState === "RECONNECTING") {
          setIsReconnecting(true);
        } else if (curState === "CONNECTED") {
          setIsReconnecting(false);
        } else if (curState === "DISCONNECTED" && reason !== "LEAVE") {
          console.error("⚠️ Déconnexion inattendue");
          setInternalError("Connexion perdue");
        }
      });

      client.on("network-quality", (stats) => {
        const q = Math.round((stats.uplinkNetworkQuality + stats.downlinkNetworkQuality) / 2);
        setNetworkQuality(
          q <= 1 ? "excellent" : 
          q <= 2 ? "good" : 
          q <= 4 ? "medium" : "poor"
        );
      });

      client.on("exception", (event) => {
        console.error("⚠️ Exception:", event);
      });

      // USER PUBLISHED
      client.on("user-published", async (user, mediaType) => {
        console.log(`📥 ${user.uid} published ${mediaType}`);
        
        try {
          await client.subscribe(user, mediaType);
          console.log(`✅ Subscribed ${user.uid} ${mediaType}`);
          
          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === user.uid);
            if (exists) {
              return prev.map((u) => 
                u.uid === user.uid 
                  ? { ...u, [mediaType + "Track"]: user[mediaType + "Track"] } 
                  : u
              );
            }
            return [...prev, { 
              uid: user.uid, 
              videoTrack: mediaType === "video" ? user.videoTrack : null, 
              audioTrack: mediaType === "audio" ? user.audioTrack : null 
            }];
          });

          // 🔥 IMPORTANT : Play audio APRÈS mise à jour du state
          if (mediaType === "audio" && user.audioTrack) {
            setTimeout(async () => {
              try {
                await user.audioTrack.play();
                console.log(`🔊 Audio ${user.uid} playing`);
              } catch (err) {
                console.warn(`⚠️ Audio play ${user.uid}:`, err);
              }
            }, 100);
          }
        } catch (err) {
          console.error("❌ Subscribe error:", err);
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        console.log(`📤 ${user.uid} unpublished ${mediaType}`);
        setRemoteUsers((prev) => 
          prev.map((u) => 
            u.uid === user.uid 
              ? { ...u, [mediaType + "Track"]: null } 
              : u
          )
        );
      });

      client.on("user-left", (user) => {
        console.log(`👋 ${user.uid} left`);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      // ============================================
      // JOIN
      // ============================================
      if (client.connectionState === "DISCONNECTED") {
        console.log("🔌 Joining...");
        await client.join(APP_ID, channelName, token, uid);
        console.log("✅ Joined");
      }

      if (!mountedRef.current) {
        await cleanup();
        return;
      }

      // ============================================
      // CREATE TRACKS
      // ============================================
      console.log("🎤 Creating tracks...");
      
      try {
        // 🔥 Créer audio EN PREMIER
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "speech_standard",
        });
        console.log("✅ Audio track OK");
        
        let videoTrack = null;
        
        // 🔥 Vidéo seulement si nécessaire
        if (callType === "video") {
          try {
            videoTrack = await AgoraRTC.createCameraVideoTrack({
              encoderConfig: "480p_1",
            });
            console.log("✅ Video track OK");
          } catch (videoError) {
            console.error("❌ Video track error:", videoError);
            
            if (videoError.code === "NOT_READABLE") {
              setInternalError("Caméra occupée par une autre application");
            } else if (videoError.code === "PERMISSION_DENIED") {
              setInternalError("Accès caméra refusé");
            } else {
              setInternalError("Erreur caméra");
            }
            
            // Continuer avec audio seulement
            videoTrack = null;
          }
        }

        if (!mountedRef.current) {
          audioTrack?.close();
          videoTrack?.close();
          return;
        }

        localTracksRef.current = { audio: audioTrack, video: videoTrack };
        
        if (videoTrack) {
          setLocalVideoReady(true);
        }

        // ============================================
        // PUBLISH
        // ============================================
        if (client.connectionState === "CONNECTED") {
          const tracks = videoTrack ? [audioTrack, videoTrack] : [audioTrack];
          await client.publish(tracks);
          console.log("✅ Published:", tracks.map(t => t.trackMediaType).join(", "));
        }

        isInitializedRef.current = true;
        console.log("✅ Init complete");
        
      } catch (trackError) {
        console.error("❌ Track creation error:", trackError);
        
        if (trackError.code === "PERMISSION_DENIED" || trackError.name === "NotAllowedError") {
          setInternalError("Accès micro/caméra refusé");
        } else if (trackError.code === "NOT_READABLE" || trackError.name === "NotReadableError") {
          setInternalError("Micro/caméra déjà utilisé");
        } else {
          setInternalError("Erreur d'accès aux médias");
        }
        
        setTimeout(handleHangup, 3000);
      }

    } catch (error) {
      console.error("❌ Init error:", error);
      
      if (error.code === "INVALID_OPERATION") {
        console.log("🔄 Cleanup...");
        await cleanup();
      }
      
      setInternalError("Échec de connexion");
      setTimeout(handleHangup, 3000);
      
    } finally {
      isInitializingRef.current = false;
    }
  }, [channelName, token, uid, callType, cleanup, handleHangup]);

  // ============================================
  // PLAY LOCAL VIDEO
  // ============================================
  useEffect(() => {
    if (localVideoReady && localTracksRef.current.video && localVideoRef.current && camOn) {
      try {
        localTracksRef.current.video.play(localVideoRef.current);
      } catch (e) {
        console.warn("⚠️ Local video play:", e);
      }
    }
  }, [localVideoReady, camOn]);

  // ============================================
  // REMOTE VIDEO PLAYER
  // ============================================
  const RemoteVideoPlayer = ({ user }) => {
    const videoRef = useRef(null);
    const playedRef = useRef(false);
    
    const info = usersInfo[user.uid];
    const name = info?.name || `User ${user.uid}`;
    const pic = info?.profilePicture;

    useEffect(() => {
      if (!user.videoTrack || !videoRef.current || playedRef.current) {
        return;
      }

      console.log(`🎬 Playing video ${user.uid} (${name})`);
      
      const playVideo = async () => {
        try {
          await user.videoTrack.play(videoRef.current);
          playedRef.current = true;
          console.log(`✅ Video ${user.uid} OK`);
        } catch (err) {
          console.error(`❌ Video play ${user.uid}:`, err);
        }
      };

      const timer = setTimeout(playVideo, 150);
      
      return () => {
        clearTimeout(timer);
        playedRef.current = false;
      };
    }, [user.videoTrack, user.uid, name]);

    return (
      <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden">
        {user.videoTrack ? (
          <div 
            ref={videoRef}
            className="w-full h-full bg-black"
            style={{ minHeight: "200px" }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            {pic ? (
              <img src={pic} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-3xl text-white font-bold">{name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <p className="mt-4 text-white font-medium">{name}</p>
          </div>
        )}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur rounded-full text-white text-sm">
          {name}
        </div>
      </div>
    );
  };

  // ============================================
  // INIT & CLEANUP
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        initAgora();
      }
    }, 300);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  // ============================================
  // TOKEN RENEWAL
  // ============================================
  useEffect(() => {
    if (!clientRef.current || !channelName || !uid) return;

    const client = clientRef.current;

    const handleTokenWillExpire = async () => {
      console.log("⚠️ Token expiring...");
      try {
        const { data: tokenData } = await api.post("/agora/token", {
          channelName,
          uid,
        });
        await client.renewToken(tokenData.token);
        console.log("✅ Token renewed");
      } catch (error) {
        console.error("❌ Token renewal:", error);
      }
    };

    const handleTokenExpired = async () => {
      console.log("❌ Token expired!");
      setInternalError("Session expirée");
      setTimeout(handleHangup, 3000);
    };

    client.on("token-privilege-will-expire", handleTokenWillExpire);
    client.on("token-privilege-did-expire", handleTokenExpired);

    return () => {
      client.off("token-privilege-will-expire", handleTokenWillExpire);
      client.off("token-privilege-did-expire", handleTokenExpired);
    };
  }, [channelName, uid, handleHangup]);

  // ============================================
  // CONTROLS
  // ============================================
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

  const toggleSpeaker = () => {
    setSpeakerOn(!speakerOn);
    remoteUsers.forEach((u) => {
      if (u.audioTrack) {
        speakerOn ? u.audioTrack.stop() : u.audioTrack.play();
      }
    });
  };

  const totalUsers = remoteUsers.length + 1;
  const gridClass = totalUsers === 2 ? "grid-cols-2" : totalUsers >= 3 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className={isMinimized ? "fixed bottom-4 right-4 w-80 z-[9999] rounded-2xl" : "fixed inset-0 z-[9999] bg-black/95"}>
      <div className={`relative flex flex-col ${isMinimized ? "w-full h-auto" : "w-full h-full"} bg-slate-950`}>
        
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
              <Users size={14} className="text-purple-400" />
              <span className="text-white text-sm">{callData?.name || "Appel"}</span>
              {remoteUsers.length > 0 && <span className="text-white/60 text-xs">({remoteUsers.length + 1})</span>}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
              <NetworkIndicator quality={networkQuality} />
              <span className="text-white text-sm font-mono">{formatTime(callDuration)}</span>
            </div>
          </div>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition">
            {isMinimized ? <Maximize2 size={16} className="text-white" /> : <Minimize2 size={16} className="text-white" />}
          </button>
        </div>

        {/* VIDEOS */}
        <div className={`flex-1 p-4 ${isMinimized ? "h-52" : "pt-16 pb-24"}`}>
          <div className={`grid gap-4 h-full ${gridClass}`}>
            
            {/* REMOTE VIDEOS */}
            {remoteUsers.map((user) => (
              <RemoteVideoPlayer key={user.uid} user={user} />
            ))}

            {/* LOCAL VIDEO */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-800">
              {callType === "video" && camOn && localVideoReady ? (
                <div
                  ref={localVideoRef}
                  className="w-full h-full"
                  style={{ transform: "rotateY(180deg)" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                  <VideoOff className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-600 rounded-full text-white text-sm">
                Moi
              </div>
            </div>

          </div>
        </div>

        {/* CONTROLS */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-5 pb-6 pt-10 bg-gradient-to-t from-black/90 ${isMinimized ? "hidden" : ""}`}>
          <button onClick={toggleSpeaker} className={`p-4 rounded-full transition-all ${speakerOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
            {speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button onClick={toggleMic} className={`p-4 rounded-full transition-all ${micOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button onClick={handleHangup} className="p-5 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all">
            <PhoneOff size={28} />
          </button>
          {callType === "video" && (
            <button onClick={toggleCam} className={`p-4 rounded-full transition-all ${camOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
              {camOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
          )}
        </div>

        {/* ERRORS */}
        {displayError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-30 flex items-center gap-2 shadow-lg">
            <AlertCircle size={18} />
            <span>{displayError}</span>
          </div>
        )}
        
        {isReconnecting && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-lg z-30 shadow-lg">
            Reconnexion...
          </div>
        )}
      </div>
    </div>
  );
}