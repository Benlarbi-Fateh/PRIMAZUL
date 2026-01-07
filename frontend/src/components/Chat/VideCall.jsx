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
  GripHorizontal,
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
// COMPOSANT VIDÉO DISTANT (DESIGN CARTE)
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
    const name = info?.name || `Participant`;
    const pic = info?.profilePicture;

    return (
      <div
        onClick={onClick}
        className={`
            relative w-full h-full bg-slate-900 overflow-hidden 
            ${
              isMini
                ? "rounded-none border-0"
                : "rounded-3xl border border-slate-700/50 shadow-2xl cursor-pointer hover:border-blue-500/50 transition-all duration-300 group"
            }
        `}
      >
        {/* Vidéo */}
        <div
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${
            !user.videoTrack ? "hidden" : "block"
          }`}
        />

        {/* Fallback (Avatar) */}
        {!user.videoTrack && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 z-10 p-4">
            <div className="relative group/avatar">
              <div
                className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-20 group-hover/avatar:opacity-40 transition duration-500`}
              ></div>
              {pic && !isMini ? (
                <img
                  src={pic}
                  className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-800 shadow-2xl"
                  alt={name}
                />
              ) : (
                <div
                  className={`relative ${
                    isMini
                      ? "w-12 h-12 text-sm"
                      : "w-24 h-24 sm:w-32 sm:h-32 text-3xl sm:text-5xl"
                  } bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold shadow-inner border-4 border-slate-800`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {!isMini && (
              <div className="mt-6 text-center">
                <h3 className="text-white font-bold text-lg sm:text-xl tracking-wide drop-shadow-md">
                  {name}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium backdrop-blur-sm flex items-center gap-1.5">
                    <VideoOff size={12} /> Caméra coupée
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badge Nom (sur vidéo active) */}
        {!isMini && user.videoTrack && (
          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-sm font-medium border border-white/10 flex items-center gap-2 shadow-lg z-20 pointer-events-none transition-opacity group-hover:opacity-100">
            {name}
            {!user.audioTrack && <MicOff size={14} className="text-red-400" />}
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

  const [spotlightUser, setSpotlightUser] = useState(null);
  const [layoutMode, setLayoutMode] = useState("grid");
  const [position, setPosition] = useState({ x: 20, y: 20 });
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
  const isJoiningRef = useRef(false);

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
      return newList;
    });
  };

  // --- INITIALISATION ---
  useEffect(() => {
    if (!token || !channelName) return;
    mountedRef.current = true;

    const initAgora = async () => {
      if (isJoiningRef.current) return;
      isJoiningRef.current = true;

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
          if (mediaType === "video" && !spotlightUser) {
            setSpotlightUser({ uid: user.uid });
            setLayoutMode("spotlight");
          }
        });

        client.on("user-unpublished", (user, mediaType) =>
          updateRemoteUsers("update", {
            uid: user.uid,
            [mediaType + "Track"]: null,
          })
        );
        client.on("user-left", (user) => {
          updateRemoteUsers("remove", user);
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

            if (!localTracksRef.current.audio) {
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                encoderConfig: "music_standard",
              });
              let videoTrack;
              if (callType === "video")
                videoTrack = await AgoraRTC.createCameraVideoTrack({
                  encoderConfig: "720p_2",
                });

              localTracksRef.current = { audio: audioTrack, video: videoTrack };
              const tracks = [audioTrack];
              if (videoTrack) tracks.push(videoTrack);

              if (client.connectionState === "CONNECTED")
                await client.publish(tracks);
              if (mountedRef.current) setLocalVideoReady(true);
            }
          } catch (error) {
            if (error.code === "UID_CONFLICT" && retryCount < 3) {
              await client.leave();
              setTimeout(() => joinChannel(retryCount + 1), 1000);
            }
          }
        };
        await joinChannel();
      } catch (err) {
        console.error("Init Error", err);
      } finally {
        isJoiningRef.current = false;
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
        localTracksRef.current = { audio: null, video: null };
        if (clientRef.current) {
          await clientRef.current.leave();
          clientRef.current = null;
        }
      };
      leave();
    };
  }, [channelName, token, uid, callType]);

  useEffect(() => {
    if (localVideoReady && localVideoRef.current) {
      try {
        if (isScreenSharing && localTracksRef.current.screenVideo)
          localTracksRef.current.screenVideo.play(localVideoRef.current);
        else if (camOn && localTracksRef.current.video)
          localTracksRef.current.video.play(localVideoRef.current);
      } catch (e) {}
    }
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
        if (clientRef.current?.connectionState === "CONNECTED")
          await clientRef.current.publish(videoTrack);
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
        if (screenTrackRef.current) {
          const tracks = Array.isArray(screenTrackRef.current)
            ? screenTrackRef.current
            : [screenTrackRef.current];
          tracks.forEach((t) => {
            t.stop();
            t.close();
          });
          await clientRef.current?.unpublish(tracks);
        }
        if (localTracksRef.current.video && camOn)
          await clientRef.current?.publish(localTracksRef.current.video);
        setIsScreenSharing(false);
        setSpotlightUser(null);
        setLayoutMode("grid");
      } else {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: "1080p_1" },
          "auto"
        );
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
        track.on("track-ended", () => toggleScreenShare());
        screenTrackRef.current = screenTrack;
        if (localTracksRef.current.video)
          await clientRef.current?.unpublish(localTracksRef.current.video);
        await clientRef.current?.publish(screenTrack);
        localTracksRef.current.screenVideo = track;
        setIsScreenSharing(true);
        setSpotlightUser({ isLocal: true });
        setLayoutMode("spotlight");
      }
      setLocalVideoReady(false);
      setTimeout(() => setLocalVideoReady(true), 100);
    } catch (e) {
      console.error(e);
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
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
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
    const userToShow = spotlightUser?.isLocal
      ? null
      : remoteUsers.find((u) => u.uid === spotlightUser?.uid) || remoteUsers[0];
    return (
      <div
        className="fixed w-52 h-80 bg-slate-900 rounded-xl shadow-2xl overflow-hidden border-2 border-blue-500 z-[9999] cursor-move flex flex-col"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="bg-slate-800 p-2 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 text-xs font-bold truncate px-1">
            <GripHorizontal size={14} className="opacity-50" /> {callData?.name}
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsMinimized(false)}
            className="hover:bg-white/20 rounded p-1"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        <div className="flex-1 relative bg-black">
          {userToShow ? (
            <RemoteVideoPlayer
              user={userToShow}
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
        <div className="p-2 flex justify-around bg-slate-900 border-t border-slate-700">
          <button
            onClick={toggleMic}
            className={`p-2 rounded-full ${
              micOn ? "text-white" : "text-red-500 bg-red-500/10"
            }`}
          >
            <Mic size={16} />
          </button>
          <button
            onClick={onHangup}
            className="p-2 rounded-full text-red-500 hover:bg-red-500/10"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </div>
    );
  }

  const totalUsers = remoteUsers.length + 1;
  const gridClass =
    totalUsers <= 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-2 md:grid-cols-3";

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col animate-fade-in font-sans">
      {/* HEADER */}
      <div className="absolute top-0 w-full p-4 flex justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex gap-2">
          <div className="text-white bg-black/40 backdrop-blur px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-white/10">
            <Users size={14} className="text-blue-400" /> {callData?.name}
          </div>
          <div className="text-green-400 bg-black/40 backdrop-blur px-3 py-1 rounded-full text-sm font-mono border border-green-500/30">
            {formatTime(callDuration)}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setLayoutMode(layoutMode === "grid" ? "spotlight" : "grid")
            }
            className="p-2.5 bg-black/40 rounded-full hover:bg-white/20 text-white transition border border-white/10"
          >
            {layoutMode === "grid" ? (
              <Layout size={20} />
            ) : (
              <LayoutGrid size={20} />
            )}
          </button>
          <button
            onClick={() => {
              setPosition({
                x: window.innerWidth - 220,
                y: window.innerHeight - 320,
              });
              setIsMinimized(true);
            }}
            className="p-2.5 bg-black/40 rounded-full hover:bg-white/20 text-white transition border border-white/10"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      </div>

      {/* ZONE VIDÉO */}
      <div className="flex-1 flex overflow-hidden pt-20 pb-28 px-4 justify-center">
        {layoutMode === "spotlight" && spotlightUser ? (
          <div className="flex w-full max-w-7xl gap-4 h-full">
            <div className="flex-1 bg-black rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl">
              {spotlightUser.isLocal ? (
                <div className="w-full h-full relative">
                  {(camOn || isScreenSharing) && localVideoReady ? (
                    <div
                      ref={localVideoRef}
                      className={`w-full h-full object-contain ${
                        !isScreenSharing ? "transform scale-x-[-1]" : ""
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                      <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-lg shadow-blue-500/20">
                        M
                      </div>
                      <p className="text-lg font-medium text-slate-300">
                        Caméra désactivée
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6 bg-blue-600/90 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg backdrop-blur-md">
                    Vous (Spotlight)
                  </div>
                </div>
              ) : (
                <RemoteVideoPlayer
                  user={
                    remoteUsers.find((u) => u.uid === spotlightUser.uid) || {}
                  }
                  getUserInfo={getUserInfo}
                  isMini={false}
                />
              )}
            </div>

            <div className="w-64 flex flex-col gap-3 overflow-y-auto pr-1">
              {!spotlightUser.isLocal && (
                <div
                  onClick={() => setSpotlightUser({ isLocal: true })}
                  className="h-40 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-blue-500 cursor-pointer bg-slate-900 relative shadow-md transition-all"
                >
                  {(camOn || isScreenSharing) && localVideoReady ? (
                    <div
                      ref={localVideoRef}
                      className={`w-full h-full object-cover ${
                        !isScreenSharing ? "transform scale-x-[-1]" : ""
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs bg-slate-800 font-bold">
                      Moi
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-lg text-white text-[10px] font-bold backdrop-blur-sm">
                    Moi
                  </div>
                </div>
              )}
              {remoteUsers
                .filter((u) => u.uid !== spotlightUser?.uid)
                .map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => setSpotlightUser({ uid: u.uid })}
                    className="h-40 shrink-0"
                  >
                    <RemoteVideoPlayer
                      user={u}
                      getUserInfo={getUserInfo}
                      isMini={true}
                      onClick={() => setSpotlightUser({ uid: u.uid })}
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-4 w-full h-full max-w-7xl content-center transition-all duration-500 ${gridClass}`}
          >
            <div
              onClick={() => {
                setSpotlightUser({ isLocal: true });
                setLayoutMode("spotlight");
              }}
              className="relative w-full h-full min-h-[250px] aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-700/50 cursor-pointer hover:border-blue-500 transition-all shadow-xl group"
            >
              {(camOn || isScreenSharing) && localVideoReady ? (
                <div
                  ref={localVideoRef}
                  className={`w-full h-full object-cover ${
                    !isScreenSharing ? "transform scale-x-[-1]" : ""
                  }`}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner border-4 border-slate-800">
                    <Users size={40} className="text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-medium bg-slate-800/50 px-4 py-1 rounded-full text-sm">
                    Caméra désactivée
                  </p>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-blue-600/90 px-3 py-1.5 rounded-xl text-white text-sm font-bold backdrop-blur-sm shadow-lg border border-blue-500/30 flex items-center gap-2">
                Moi {micOn ? "" : <MicOff size={14} className="text-red-200" />}
              </div>
            </div>
            {remoteUsers.map((user) => (
              <div
                key={user.uid}
                className="relative w-full h-full min-h-[250px] aspect-video"
              >
                <RemoteVideoPlayer
                  key={user.uid}
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
      </div>

      <div className="absolute bottom-0 w-full p-6 pb-8 flex justify-center items-center gap-4 md:gap-8 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent pointer-events-auto">
        <button
          onClick={toggleSpeaker}
          className={`p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-white/5 ${
            speakerOn
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-white text-slate-900 hover:bg-gray-200"
          }`}
          title="Haut-parleur"
        >
          {speakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-white/5 ${
            micOn
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
          }`}
          title="Micro"
        >
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button
          onClick={onHangup}
          className="p-6 bg-red-600 rounded-full text-white shadow-2xl shadow-red-600/30 hover:bg-red-700 hover:scale-110 transition-all duration-300 active:scale-95 mx-2 md:mx-6 border-4 border-slate-950"
          title="Raccrocher"
        >
          <PhoneOff size={32} fill="currentColor" />
        </button>
        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-white/5 ${
            camOn
              ? "bg-slate-800 text-white hover:bg-slate-700"
              : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
          }`}
          title="Caméra"
        >
          {camOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border border-white/5 ${
            isScreenSharing
              ? "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
          title="Partager écran"
        >
          {isScreenSharing ? <XSquare size={24} /> : <MonitorUp size={24} />}
        </button>
      </div>

      {callError && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce font-medium">
          {callError}
        </div>
      )}
    </div>
  );
}