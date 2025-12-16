"use client";

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useRouter } from "next/navigation"; // ✅ Pour la redirection
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import api from "@/lib/api";
import {
  Plus,
  Image as ImageIcon,
  Type,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Send,
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

const getFullMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
};

const getAvatarUrl = (user) => {
  return (
    user?.profilePicture ||
    `https://ui-avatars.com/api/?name=${user?.name || "User"}`
  );
};

export default function StatusPage() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter(); // ✅ Router pour redirection

  // Données
  const [myStatuses, setMyStatuses] = useState([]);
  const [friendsStatuses, setFriendsStatuses] = useState([]);

  // Viewer
  const [viewingUser, setViewingStatus] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  // Réponse
  const [replyText, setReplyText] = useState("");

  // Création
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- CHARGEMENT ---
  const fetchStatuses = async () => {
    try {
      const { data } = await api.get("/status");
      const myOwn = [];
      const friendsMap = {};

      data.forEach((status) => {
        if (status.user._id === user._id) {
          myOwn.push(status);
        } else {
          if (!friendsMap[status.user._id]) {
            friendsMap[status.user._id] = { user: status.user, items: [] };
          }
          friendsMap[status.user._id].items.push(status);
        }
      });

      setMyStatuses(myOwn);
      setFriendsStatuses(Object.values(friendsMap));
    } catch (e) {
      console.error("Erreur chargement statuts", e);
    }
  };

  useEffect(() => {
    if (user) fetchStatuses();
  }, [user]);

  // --- NAVIGATION VIEWER ---
  const handleNext = useCallback(() => {
    if (!viewingUser) return;
    setReplyText(""); // Reset réponse

    if (currentIndex < viewingUser.items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setViewingStatus(null);
      setProgress(0);
      setCurrentIndex(0);
    }
  }, [currentIndex, viewingUser]);

  const handlePrev = () => {
    setReplyText("");
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  // --- TIMER (15s pour images, durée réelle pour vidéo) ---
  useEffect(() => {
    if (!viewingUser) return;

    setProgress(0);
    const currentItem = viewingUser.items[currentIndex];

    // Pause si on tape une réponse
    if (replyText.length > 0) return;

    // Si vidéo, on laisse le onTimeUpdate gérer
    if (currentItem.type === "video") return;

    // Timer standard
    const STORY_DURATION = 5000; // 5 secondes
    const INTERVAL = 50;
    const STEP = 100 / (STORY_DURATION / INTERVAL);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + STEP;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [viewingUser, currentIndex, handleNext, replyText]);

  const handleVideoProgress = () => {
    if (replyText.length > 0) return;
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) setProgress((currentTime / duration) * 100);
    }
  };

  const handleVideoEnded = () => handleNext();

  // --- ACTIONS ---

  const handleCreateStatus = async () => {
    if (createType === "text" && !textContent.trim()) return;
    if ((createType === "image" || createType === "video") && !mediaFile)
      return;

    setLoading(true);
    const formData = new FormData();
    formData.append("type", createType);

    if (createType === "text") {
      formData.append("content", textContent);
    } else {
      formData.append("file", mediaFile);
      formData.append("content", textContent);
    }

    try {
      await api.post("/status", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsCreating(false);
      setTextContent("");
      setMediaFile(null);
      fetchStatuses();
    } catch (e) {
      console.error(e);
      alert("Erreur publication");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (id) => {
    // 1. Confirmation
    if (!confirm("Voulez-vous vraiment supprimer cette story ?")) return;

    try {
      // 2. Appel API
      await api.delete(`/status/${id}`);

      // 3. Mise à jour Locale (Pour ne pas avoir à recharger)
      setMyStatuses((prev) => prev.filter((s) => s._id !== id));

      // 4. Gestion du Viewer (Si on est en train de regarder)
      if (viewingUser) {
        // On enlève la story supprimée de la liste en cours de visionnage
        const updatedItems = viewingUser.items.filter((s) => s._id !== id);

        if (updatedItems.length === 0) {
          // S'il n'y a plus de story, on ferme le viewer
          setViewingStatus(null);
        } else {
          // Sinon, on met à jour la liste et on ajuste l'index
          setViewingStatus({ ...viewingUser, items: updatedItems });
          // Si on supprimait la dernière, on recule d'un cran
          if (currentIndex >= updatedItems.length) {
            setCurrentIndex(Math.max(0, updatedItems.length - 1));
          }
        }
      }

      // 5. Rafraîchir globalement (Optionnel mais recommandé pour être sûr)
      fetchStatuses();
    } catch (e) {
      console.error("Erreur suppression story:", e);
      alert("Impossible de supprimer la story.");
    }
  };

  // ✅ REPONSE & REDIRECTION
  const handleSendReply = async () => {
    if (!replyText.trim() || !viewingUser) return;
    const currentStatusId = viewingUser.items[currentIndex]._id;

    try {
      const { data } = await api.post(`/status/${currentStatusId}/reply`, {
        message: replyText,
      });

      setReplyText("");
      setViewingStatus(null); // Ferme la story

      // ✅ Redirection vers la conversation
      if (data.conversationId) {
        router.push(`/chat/${data.conversationId}`);
      }
    } catch (e) {
      console.error("Erreur réponse:", e);
      alert("Impossible d'envoyer la réponse");
    }
  };

  // Styles
  const bgMain = isDark ? "bg-slate-950" : "bg-gray-100";
  const bgSidebar = isDark
    ? "bg-slate-900 border-r border-slate-800"
    : "bg-white border-r border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const itemHover = isDark ? "hover:bg-slate-800" : "hover:bg-gray-50";

  return (
    <ProtectedRoute>
      <div className={`flex h-screen ${bgMain}`}>
        <MainSidebar />

        {/* LISTE STATUTS */}
        <div className={`w-96 flex flex-col ${bgSidebar}`}>
          <div
            className={`p-5 border-b ${
              isDark ? "border-slate-800" : "border-gray-200"
            }`}
          >
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Statuts</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Moi */}
            <div
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() =>
                myStatuses.length > 0
                  ? (setViewingStatus({ user, items: myStatuses }),
                    setCurrentIndex(0))
                  : setIsCreating(true)
              }
            >
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full overflow-hidden border-2 ${
                    myStatuses.length > 0
                      ? "border-blue-500 p-[2px]"
                      : "border-slate-300"
                  }`}
                >
                  <Image
                    src={getAvatarUrl(user)}
                    alt="Moi"
                    width={56}
                    height={56}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
                {myStatuses.length === 0 && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white">
                    <Plus size={12} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${textPrimary}`}>Mon statut</h3>
                <p className={`text-sm ${textSecondary}`}>
                  {myStatuses.length > 0
                    ? `${myStatuses.length} publications`
                    : "Ajouter un statut"}
                </p>
              </div>
            </div>
            <hr className={isDark ? "border-slate-800" : "border-gray-200"} />

            {/* Amis */}
            <div>
              <h4
                className={`text-sm font-bold mb-4 uppercase ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Récentes mises à jour
              </h4>
              <div className="space-y-4">
                {friendsStatuses.map((group) => (
                  <div
                    key={group.user._id}
                    onClick={() => {
                      setViewingStatus(group);
                      setCurrentIndex(0);
                    }}
                    className={`flex items-center gap-4 p-2 rounded-xl cursor-pointer transition ${itemHover}`}
                  >
                    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-cyan-400">
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                        <Image
                          src={getAvatarUrl(group.user)}
                          alt={group.user.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-semibold ${textPrimary}`}>
                        {group.user.name}
                      </h3>
                      <p className={`text-xs ${textSecondary}`}>
                        {formatDistanceToNow(
                          new Date(group.items[0].createdAt),
                          { addSuffix: true, locale: fr }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black">
          {/* CREATEUR */}
          {isCreating && (
            <div className="w-full h-full flex flex-col bg-slate-900 text-white animate-fade-in relative">
              <button
                onClick={() => setIsCreating(false)}
                className="absolute top-6 left-6 p-2 bg-black/50 rounded-full hover:bg-black/80 z-20"
              >
                <X />
              </button>

              <div className="absolute top-6 right-6 flex gap-4 z-20">
                <button
                  onClick={() => setCreateType("text")}
                  className={`p-3 rounded-full ${
                    createType === "text" ? "bg-blue-600" : "bg-black/50"
                  }`}
                >
                  <Type />
                </button>
                <button
                  onClick={() => setCreateType("image")}
                  className={`p-3 rounded-full ${
                    createType === "image" ? "bg-blue-600" : "bg-black/50"
                  }`}
                >
                  <ImageIcon />
                </button>
                <button
                  onClick={() => setCreateType("video")}
                  className={`p-3 rounded-full ${
                    createType === "video" ? "bg-blue-600" : "bg-black/50"
                  }`}
                >
                  <Video />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center p-8">
                {createType === "text" ? (
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Tapez votre statut..."
                    className="w-full max-w-2xl h-64 bg-transparent text-4xl text-center font-bold placeholder-gray-600 focus:outline-none resize-none"
                    maxLength={250}
                  />
                ) : (
                  <div className="text-center">
                    {mediaFile ? (
                      <div className="relative">
                        {createType === "video" ? (
                          <video
                            src={URL.createObjectURL(mediaFile)}
                            controls
                            className="max-h-[60vh] rounded-lg shadow-2xl"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={URL.createObjectURL(mediaFile)}
                            alt="Preview"
                            className="max-h-[60vh] rounded-lg shadow-2xl"
                          />
                        )}
                        <button
                          onClick={() => setMediaFile(null)}
                          className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-4 p-10 border-2 border-dashed border-gray-600 rounded-xl hover:bg-gray-800 transition">
                        {createType === "video" ? (
                          <Video size={48} className="text-gray-400" />
                        ) : (
                          <ImageIcon size={48} className="text-gray-400" />
                        )}
                        <span className="text-gray-400">
                          Cliquez pour ajouter{" "}
                          {createType === "video" ? "une vidéo" : "une image"}
                        </span>
                        <input
                          type="file"
                          accept={
                            createType === "video" ? "video/*" : "image/*"
                          }
                          className="hidden"
                          onChange={(e) => setMediaFile(e.target.files[0])}
                        />
                      </label>
                    )}
                    <input
                      type="text"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Ajouter une légende..."
                      className="mt-6 w-full bg-slate-800 p-4 rounded-xl text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 flex justify-end bg-black/20">
                <button
                  onClick={handleCreateStatus}
                  disabled={loading || (createType === "text" && !textContent)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    "Envoi..."
                  ) : (
                    <>
                      <Send size={18} /> Publier
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VIEWER */}
          {viewingUser && viewingUser.items[currentIndex] && (
            <div className="w-full h-full relative flex flex-col items-center justify-center bg-black">
              {/* Barres Progression */}
              <div className="absolute top-2 left-0 w-full flex gap-1 px-4 z-30">
                {viewingUser.items.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-white transition-all duration-75 ease-linear"
                      style={{
                        width:
                          idx < currentIndex
                            ? "100%"
                            : idx === currentIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-6 w-full px-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewingStatus(null)}
                    className="text-white hover:bg-white/10 p-2 rounded-full"
                  >
                    <ChevronLeft />
                  </button>
                  <Image
                    src={getAvatarUrl(viewingUser.user)}
                    alt="User"
                    width={40}
                    height={40}
                    className="rounded-full border border-white"
                  />
                  <div>
                    <h3 className="text-white font-bold">
                      {viewingUser.user.name}
                    </h3>
                    <p className="text-gray-300 text-xs">
                      {formatDistanceToNow(
                        new Date(viewingUser.items[currentIndex].createdAt),
                        { locale: fr }
                      )}
                    </p>
                  </div>
                </div>
                {viewingUser.user._id === user._id && (
                  <button
                    onClick={() =>
                      handleDeleteStatus(viewingUser.items[currentIndex]._id)
                    }
                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full"
                  >
                    <Trash2 />
                  </button>
                )}
              </div>

              {/* Contenu */}
              <div className="w-full h-full flex items-center justify-center relative">
                {viewingUser.items[currentIndex].type === "text" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                    <p className="text-3xl md:text-5xl font-bold text-white text-center px-10 leading-relaxed">
                      {viewingUser.items[currentIndex].content}
                    </p>
                  </div>
                ) : viewingUser.items[currentIndex].type === "video" ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={getFullMediaUrl(
                        viewingUser.items[currentIndex].mediaUrl
                      )}
                      className="max-h-full max-w-full object-contain"
                      autoPlay
                      playsInline
                      onTimeUpdate={handleVideoProgress}
                      onEnded={handleVideoEnded}
                    />
                    {viewingUser.items[currentIndex].content && (
                      <div className="absolute bottom-20 bg-black/60 px-6 py-2 rounded-full text-white text-lg backdrop-blur-md max-w-[80%] text-center">
                        {viewingUser.items[currentIndex].content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <img
                      src={getFullMediaUrl(
                        viewingUser.items[currentIndex].mediaUrl
                      )}
                      alt="Status"
                      className="max-h-full max-w-full object-contain"
                    />
                    {viewingUser.items[currentIndex].content && (
                      <div className="absolute bottom-20 bg-black/60 px-6 py-2 rounded-full text-white text-lg backdrop-blur-md max-w-[80%] text-center">
                        {viewingUser.items[currentIndex].content}
                      </div>
                    )}
                  </div>
                )}

                {/* Zones tactiles */}
                <div
                  className="absolute top-0 left-0 w-1/3 h-full cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                ></div>
                <div
                  className="absolute top-0 right-0 w-1/3 h-full cursor-pointer z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                ></div>
              </div>

              {/* ✅ ZONE REPONSE (Si c'est pas moi) */}
              {viewingUser.user._id !== user._id && (
                <div
                  className="absolute bottom-4 w-full px-4 z-50 flex justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2 w-full max-w-lg bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                    <input
                      type="text"
                      placeholder="Répondre..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                      className="flex-1 bg-transparent text-white px-4 focus:outline-none placeholder-gray-300"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="p-2.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 transition"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isCreating && !viewingUser && (
            <div className="text-center text-gray-500">
              <p>Sélectionnez un statut pour le voir</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
