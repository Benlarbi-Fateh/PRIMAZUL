// frontend/src/app/status/page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import Image from "next/image";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Send,
  Eye,
  Type,
  Image as ImageIcon,
  Video,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Upload,
  Clock,
  MessageCircle,
  Heart,
  CircleDashed,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "👍"];

// ============================================
// UTILITAIRES
// ============================================
const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return `${API_URL}/${url}`;
};

const getAvatarUrl = (user) => {
  if (!user) {
    return `https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&bold=true&size=128`;
  }

  const profilePic =
    user.profilePicture || user.avatar || user.image || user.photo;

  if (profilePic) {
    if (profilePic.startsWith("http")) {
      return profilePic;
    }
    if (profilePic.startsWith("/")) {
      return `${API_URL}${profilePic}`;
    }
    return `${API_URL}/${profilePic}`;
  }

  const name = user.name || user.username || user.email || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=3b82f6&color=fff&bold=true&size=128`;
};

// ============================================
// COMPOSANT AVATAR SÉCURISÉ
// ============================================
const SafeAvatar = ({ user, size = 40, className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(user);
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || "User"
  )}&background=3b82f6&color=fff&bold=true&size=128`;

  return (
    <Image
      src={imgError ? fallbackUrl : avatarUrl}
      alt={user?.name || "User"}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setImgError(true)}
      unoptimized
    />
  );
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function StatusPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  // États principaux
  const [myStatuses, setMyStatuses] = useState([]);
  const [friendsStatuses, setFriendsStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // États du viewer
  const [viewingGroup, setViewingGroup] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // États création
  const [showCreator, setShowCreator] = useState(false);
  const [createType, setCreateType] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // États stats/réponse
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showReactions, setShowReactions] = useState(false);

  // État mobile sidebar
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Refs
  const videoRef = useRef(null);
  const progressTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ============================================
  // NAVIGATION RETOUR
  // ============================================
  const handleGoBack = () => {
    router.back();
  };

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  const fetchStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Statuts chargés:", data);
        setMyStatuses(data.myStatuses || []);
        setFriendsStatuses(data.friendsStatuses || []);
      } else {
        console.error("Erreur API:", response.status);
      }
    } catch (error) {
      console.error("Erreur chargement statuts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchStatuses();
  }, [user, fetchStatuses]);

  // ============================================
  // GESTION DU VIEWER
  // ============================================
  const currentStatus = viewingGroup?.statuses?.[currentIndex];
  const isMyStatus = viewingGroup?.user?._id === user?._id;

  // Timer de progression
  useEffect(() => {
    if (!viewingGroup || isPaused || showStats || showReactions) return;

    setProgress(0);
    const duration = currentStatus?.type === "video" ? 15000 : 5000;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        progressTimerRef.current = requestAnimationFrame(updateProgress);
      } else {
        handleNext();
      }
    };

    progressTimerRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressTimerRef.current) {
        cancelAnimationFrame(progressTimerRef.current);
      }
    };
  }, [viewingGroup, currentIndex, isPaused, showStats, showReactions]);

  // Marquer comme vu
  useEffect(() => {
    if (!currentStatus || isMyStatus) return;

    const markViewed = async () => {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/status/${currentStatus._id}/view`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Erreur marquage vue:", error);
      }
    };

    const timer = setTimeout(markViewed, 1000);
    return () => clearTimeout(timer);
  }, [currentStatus, isMyStatus]);

  const handleNext = useCallback(() => {
    setReplyText("");
    setShowReactions(false);

    if (currentIndex < viewingGroup?.statuses?.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      closeViewer();
    }
  }, [currentIndex, viewingGroup]);

  const handlePrev = () => {
    setReplyText("");
    setShowReactions(false);

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const closeViewer = () => {
    setViewingGroup(null);
    setCurrentIndex(0);
    setProgress(0);
    setShowStats(false);
    setShowReactions(false);
    setReplyText("");
    setShowMobileSidebar(true);
    fetchStatuses();
  };

  const openViewer = (group) => {
    setViewingGroup(group);
    setCurrentIndex(0);
    setProgress(0);
    setShowMobileSidebar(false);
  };

  // ============================================
  // ACTIONS (Réaction, Réponse, Suppression)
  // ============================================
  const handleReact = async (emoji) => {
    if (!currentStatus) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/status/${currentStatus._id}/react`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reaction: emoji }),
        }
      );

      if (response.ok) {
        setShowReactions(false);
      }
    } catch (error) {
      console.error("Erreur réaction:", error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentStatus) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/status/${currentStatus._id}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: replyText }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReplyText("");
        closeViewer();

        if (data.conversationId) {
          router.push(`/chat/${data.conversationId}`);
        }
      }
    } catch (error) {
      console.error("Erreur réponse:", error);
    }
  };

  const handleDelete = async () => {
    if (!currentStatus || !confirm("Supprimer cette story ?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/status/${currentStatus._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const updatedStatuses = viewingGroup.statuses.filter(
          (s) => s._id !== currentStatus._id
        );

        if (updatedStatuses.length === 0) {
          closeViewer();
        } else {
          setViewingGroup({ ...viewingGroup, statuses: updatedStatuses });
          if (currentIndex >= updatedStatuses.length) {
            setCurrentIndex(Math.max(0, updatedStatuses.length - 1));
          }
        }
        fetchStatuses();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const loadStats = async () => {
    if (!currentStatus) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/status/${currentStatus._id}/views`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
        setShowStats(true);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  };

  // ============================================
  // CRÉATION DE STATUT
  // ============================================
  const handleCreateStatus = async () => {
    if (createType === "text" && !textContent.trim()) return;
    if ((createType === "image" || createType === "video") && !mediaFile)
      return;

    setIsUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("type", createType);

      if (createType === "text") {
        formData.append("content", textContent);
      } else {
        formData.append("media", mediaFile);
        if (textContent) formData.append("content", textContent);
      }

      const response = await fetch(`${API_URL}/api/status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        resetCreator();
        fetchStatuses();
      } else {
        const error = await response.json();
        alert("Erreur: " + (error.message || error.error));
      }
    } catch (error) {
      console.error("Erreur création:", error);
      alert("Erreur lors de la publication");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize =
      createType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(
        `Fichier trop volumineux. Max: ${
          createType === "video" ? "50" : "10"
        }MB`
      );
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const resetCreator = () => {
    setShowCreator(false);
    setCreateType("text");
    setTextContent("");
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview("");
    setShowMobileSidebar(true);
  };

  const openCreator = () => {
    setShowCreator(true);
    setShowMobileSidebar(false);
  };

  // ============================================
  // STYLES
  // ============================================
  const bgMain = isDark ? "bg-slate-950" : "bg-gray-100";
  const bgSidebar = isDark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const itemHover = isDark ? "hover:bg-slate-800" : "hover:bg-gray-50";
  const borderColor = isDark ? "border-slate-800" : "border-gray-200";

  if (!user) return null;

  return (
    <div className={`flex h-screen ${bgMain}`}>
      <MainSidebar />

      {/* ============================================ */}
      {/* SIDEBAR LISTE DES STATUTS */}
      {/* ============================================ */}
      <div
        className={`
          ${showMobileSidebar ? "flex" : "hidden"} 
          md:flex
          w-full md:w-80 lg:w-96 
          flex-col border-r ${bgSidebar}
          absolute md:relative
          inset-0 md:inset-auto
          z-40 md:z-auto
        `}
      >
        {/* Header avec bouton retour */}
        <div
          className={`p-4 md:p-5 border-b ${borderColor} flex items-center gap-3`}
        >
          {/* ✅ BOUTON RETOUR */}
          <button
            onClick={handleGoBack}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? "hover:bg-slate-800 text-slate-300"
                : "hover:bg-gray-100 text-slate-600"
            }`}
            title="Retour"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 className={`text-xl md:text-2xl font-bold ${textPrimary} flex-1`}>
            Statuts
          </h1>

          <button
            onClick={openCreator}
            className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
            title="Créer un statut"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6">
          {/* Mon statut */}
          <div
            className={`flex items-center gap-3 md:gap-4 p-3 rounded-xl cursor-pointer transition ${itemHover}`}
            onClick={() => {
              if (myStatuses.length > 0) {
                openViewer({ user, statuses: myStatuses });
              } else {
                openCreator();
              }
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 ${
                  myStatuses.length > 0
                    ? "border-blue-500 p-[2px]"
                    : "border-slate-300"
                }`}
              >
                <SafeAvatar user={user} size={56} className="w-full h-full" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCreator();
                }}
                className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 border-2 border-white hover:bg-blue-600"
              >
                <Plus size={10} className="text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${textPrimary} truncate`}>
                Mon statut
              </h3>
              <p className={`text-sm ${textSecondary} truncate`}>
                {myStatuses.length > 0
                  ? `${myStatuses.length} publication${
                      myStatuses.length > 1 ? "s" : ""
                    }`
                  : "Ajouter un statut"}
              </p>
            </div>
          </div>

          <hr className={borderColor} />

          {/* Statuts des amis */}
          <div>
            <h4
              className={`text-xs md:text-sm font-bold mb-3 md:mb-4 uppercase ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Mises à jour récentes
            </h4>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : friendsStatuses.length === 0 ? (
              <div className={`text-center py-8 ${textSecondary}`}>
                <CircleDashed size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun statut disponible</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {friendsStatuses.map((group) => (
                  <div
                    key={group.user._id}
                    onClick={() => openViewer(group)}
                    className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl cursor-pointer transition ${itemHover}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-11 h-11 md:w-12 md:h-12 rounded-full p-[2px] ${
                          group.hasUnviewed
                            ? "bg-gradient-to-tr from-blue-500 to-cyan-400"
                            : "bg-slate-400"
                        }`}
                      >
                        <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden">
                          <SafeAvatar
                            user={group.user}
                            size={48}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                      {group.hasUnviewed && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${textPrimary} truncate`}>
                        {group.user.name}
                      </h3>
                      <p className={`text-xs ${textSecondary} truncate`}>
                        {formatDistanceToNow(new Date(group.latestAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs ${textSecondary} flex-shrink-0 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full`}
                    >
                      {group.statuses.length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ZONE PRINCIPALE */}
      {/* ============================================ */}
      <div
        className={`
          flex-1 flex items-center justify-center bg-black relative overflow-hidden
          ${showMobileSidebar ? "hidden md:flex" : "flex"}
        `}
      >
        {/* État par défaut - Desktop only */}
        {!viewingGroup && !showCreator && (
          <div className="text-center text-gray-500 p-4">
            <CircleDashed
              size={48}
              className="mx-auto mb-4 opacity-50 md:w-16 md:h-16"
            />
            <p className="text-base md:text-lg">
              Sélectionnez un statut pour le voir
            </p>
            <button
              onClick={openCreator}
              className="mt-4 px-5 py-2.5 md:px-6 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex items-center gap-2 mx-auto text-sm md:text-base"
            >
              <Plus size={18} />
              Créer un statut
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* CRÉATEUR DE STATUT - RESPONSIVE */}
        {/* ============================================ */}
        {showCreator && (
          <div className="w-full h-full flex flex-col bg-slate-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-800">
              <button
                onClick={resetCreator}
                className="p-2 hover:bg-slate-800 rounded-full"
              >
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-base md:text-lg font-bold">
                Créer un statut
              </h2>
              <div className="w-10" />
            </div>

            {/* Sélection du type */}
            <div className="flex justify-center gap-2 md:gap-4 p-3 md:p-4 border-b border-slate-800">
              {[
                { type: "text", icon: Type, label: "Texte" },
                { type: "image", icon: ImageIcon, label: "Photo" },
                { type: "video", icon: Video, label: "Vidéo" },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => {
                    setCreateType(type);
                    setMediaFile(null);
                    setMediaPreview("");
                  }}
                  className={`flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl transition flex-1 max-w-[100px] md:max-w-none ${
                    createType === type
                      ? "bg-blue-600"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  <Icon size={20} className="md:w-6 md:h-6" />
                  <span className="text-xs md:text-sm">{label}</span>
                </button>
              ))}
            </div>

            {/* Zone de contenu - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-center min-h-full p-4 md:p-8">
                {createType === "text" ? (
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Quoi de neuf ?"
                    className="w-full max-w-2xl h-48 md:h-64 bg-transparent text-2xl md:text-4xl text-center font-bold placeholder-gray-600 focus:outline-none resize-none"
                    maxLength={280}
                  />
                ) : (
                  <div className="text-center w-full max-w-lg">
                    {mediaPreview ? (
                      <div className="relative inline-block">
                        {createType === "video" ? (
                          <video
                            src={mediaPreview}
                            controls
                            className="max-h-[40vh] md:max-h-[50vh] rounded-lg shadow-2xl w-auto max-w-full"
                          />
                        ) : (
                          <img
                            src={mediaPreview}
                            alt="Aperçu"
                            className="max-h-[40vh] md:max-h-[50vh] rounded-lg shadow-2xl w-auto max-w-full"
                          />
                        )}
                        <button
                          onClick={() => {
                            setMediaFile(null);
                            URL.revokeObjectURL(mediaPreview);
                            setMediaPreview("");
                          }}
                          className="absolute top-2 right-2 bg-red-500 p-2 rounded-full hover:bg-red-600 shadow-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-3 md:gap-4 p-8 md:p-16 border-2 border-dashed border-gray-600 rounded-xl hover:bg-slate-800 transition mx-4">
                        <Upload
                          size={40}
                          className="text-gray-400 md:w-12 md:h-12"
                        />
                        <span className="text-gray-400 text-sm md:text-base text-center">
                          Cliquez pour ajouter{" "}
                          {createType === "video" ? "une vidéo" : "une image"}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {createType === "video" ? "Max 50MB" : "Max 10MB"}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={
                            createType === "video" ? "video/*" : "image/*"
                          }
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}

                    {mediaPreview && (
                      <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Ajouter une légende..."
                        className="mt-4 w-full max-w-md bg-slate-800 p-3 md:p-4 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer - TOUJOURS VISIBLE */}
            <div className="flex-shrink-0 p-4 md:p-6 border-t border-slate-800 bg-slate-900">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} className="md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">
                    Visible pendant 24h
                  </span>
                </div>
                <button
                  onClick={handleCreateStatus}
                  disabled={
                    isUploading ||
                    (createType === "text" ? !textContent.trim() : !mediaFile)
                  }
                  className="w-full sm:w-auto px-6 py-2.5 md:px-8 md:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold flex items-center justify-center gap-2 transition text-sm md:text-base"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white" />
                      <span>Publication...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className="md:w-[18px] md:h-[18px]" />
                      <span>Publier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* VIEWER DE STATUT - RESPONSIVE */}
        {/* ============================================ */}
        {viewingGroup && currentStatus && (
          <div className="w-full h-full relative flex flex-col">
            {/* Barres de progression */}
            <div className="absolute top-2 left-2 right-2 md:left-4 md:right-4 flex gap-1 z-30">
              {viewingGroup.statuses.map((_, idx) => (
                <div
                  key={idx}
                  className="h-0.5 md:h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75"
                    style={{
                      width:
                        idx < currentIndex
                          ? "100%"
                          : idx === currentIndex
                          ? `${progress}%`
                          : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 md:top-8 left-0 right-0 px-2 md:px-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={closeViewer}
                  className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition"
                >
                  <ChevronLeft className="text-white" size={22} />
                </button>
                <SafeAvatar
                  user={viewingGroup.user}
                  size={36}
                  className="border-2 border-white md:w-10 md:h-10"
                />
                <div>
                  <h3 className="text-white font-bold text-sm md:text-base">
                    {viewingGroup.user.name}
                  </h3>
                  <p className="text-gray-300 text-[10px] md:text-xs">
                    {formatDistanceToNow(new Date(currentStatus.createdAt), {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>

              {/* Actions propriétaire */}
              {isMyStatus && (
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={loadStats}
                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition"
                  >
                    <Eye className="text-white" size={18} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 md:p-2 hover:bg-red-500/50 rounded-full transition"
                  >
                    <Trash2 className="text-white" size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 flex items-center justify-center">
              {currentStatus.type === "text" ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
                  <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-relaxed max-w-4xl">
                    {currentStatus.content}
                  </p>
                </div>
              ) : currentStatus.type === "video" ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={getMediaUrl(currentStatus.mediaUrl)}
                    className="max-h-full max-w-full object-contain"
                    autoPlay
                    playsInline
                    muted={isMuted}
                    onEnded={handleNext}
                    onClick={() => setIsPaused(!isPaused)}
                  />

                  {/* Contrôles vidéo */}
                  <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-3 md:gap-4">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-2.5 md:p-3 bg-black/50 rounded-full hover:bg-black/70 transition"
                    >
                      {isPaused ? (
                        <Play className="text-white" size={20} />
                      ) : (
                        <Pause className="text-white" size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2.5 md:p-3 bg-black/50 rounded-full hover:bg-black/70 transition"
                    >
                      {isMuted ? (
                        <VolumeX className="text-white" size={20} />
                      ) : (
                        <Volume2 className="text-white" size={20} />
                      )}
                    </button>
                  </div>

                  {currentStatus.content && (
                    <div className="absolute bottom-28 md:bottom-32 bg-black/60 px-4 py-1.5 md:px-6 md:py-2 rounded-full text-white backdrop-blur-md text-sm md:text-base max-w-[90%] text-center">
                      {currentStatus.content}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <img
                    src={getMediaUrl(currentStatus.mediaUrl)}
                    alt="Status"
                    className="max-h-full max-w-full object-contain"
                  />
                  {currentStatus.content && (
                    <div className="absolute bottom-20 md:bottom-24 bg-black/60 px-4 py-1.5 md:px-6 md:py-2 rounded-full text-white backdrop-blur-md text-sm md:text-base max-w-[90%] text-center">
                      {currentStatus.content}
                    </div>
                  )}
                </div>
              )}

              {/* Zones de navigation tactile */}
              {!showStats && !showReactions && (
                <>
                  <div
                    className="absolute top-0 left-0 w-1/3 h-full cursor-pointer z-10"
                    onClick={handlePrev}
                  />
                  <div
                    className="absolute top-0 right-0 w-1/3 h-full cursor-pointer z-10"
                    onClick={handleNext}
                  />
                </>
              )}
            </div>

            {/* Zone de réponse (pour les statuts des autres) */}
            {!isMyStatus && !showStats && (
              <div className="absolute bottom-4 md:bottom-6 left-0 right-0 px-3 md:px-4 z-50">
                {/* Barre de réactions */}
                {showReactions && (
                  <div className="flex justify-center gap-1 md:gap-2 mb-3 md:mb-4 animate-fade-in overflow-x-auto pb-2">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="text-2xl md:text-3xl hover:scale-110 active:scale-95 transition-transform p-1.5 md:p-2 bg-black/30 rounded-full backdrop-blur-sm flex-shrink-0"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input de réponse */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-1.5 md:gap-2 w-full max-w-lg bg-black/40 backdrop-blur-md p-1.5 md:p-2 rounded-full border border-white/20">
                    <button
                      onClick={() => setShowReactions(!showReactions)}
                      className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition flex-shrink-0"
                    >
                      <Heart className="text-white" size={18} />
                    </button>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReply()}
                      placeholder="Répondre..."
                      className="flex-1 bg-transparent text-white px-2 md:px-3 focus:outline-none placeholder-gray-300 text-sm md:text-base min-w-0"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="p-1.5 md:p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 transition flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton stats (pour mes statuts) */}
            {isMyStatus && !showStats && (
              <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40">
                <button
                  onClick={loadStats}
                  className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition text-sm md:text-base"
                >
                  <Eye size={16} />
                  <span>{currentStatus.views?.length || 0} vues</span>
                </button>
              </div>
            )}

            {/* Panel des statistiques - RESPONSIVE */}
            {showStats && statsData && (
              <div className="absolute inset-x-0 bottom-0 h-[70%] md:h-[60%] bg-slate-900 rounded-t-3xl z-50 animate-slide-up border-t border-slate-700">
                <div className="flex justify-between items-center p-3 md:p-4 border-b border-slate-700">
                  <h3 className="text-white font-bold text-base md:text-lg">
                    Statistiques
                  </h3>
                  <div className="flex gap-1 md:gap-2">
                    <button
                      onClick={handleDelete}
                      className="p-1.5 md:p-2 hover:bg-red-500/20 rounded-full text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => setShowStats(false)}
                      className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6 max-h-[calc(70vh-70px)] md:max-h-[calc(60vh-80px)]">
                  {/* Réactions */}
                  {statsData.reactions?.length > 0 && (
                    <div>
                      <h4 className="text-slate-400 text-xs uppercase font-bold mb-2 md:mb-3">
                        Réactions ({statsData.reactions.length})
                      </h4>
                      <div className="space-y-2 md:space-y-3">
                        {statsData.reactions.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-white"
                          >
                            <div className="flex items-center gap-2 md:gap-3">
                              <SafeAvatar user={r.userId} size={32} />
                              <span className="text-sm md:text-base truncate">
                                {r.userId?.name || "Utilisateur"}
                              </span>
                            </div>
                            <span className="text-xl md:text-2xl flex-shrink-0">
                              {r.reaction}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Réponses */}
                  {statsData.replies?.length > 0 && (
                    <div>
                      <h4 className="text-slate-400 text-xs uppercase font-bold mb-2 md:mb-3">
                        Réponses ({statsData.replies.length})
                      </h4>
                      <div className="space-y-2 md:space-y-3">
                        {statsData.replies.map((r, i) => (
                          <div
                            key={i}
                            className="bg-slate-800 p-2.5 md:p-3 rounded-xl"
                          >
                            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                              <SafeAvatar user={r.userId} size={24} />
                              <span className="text-white text-xs md:text-sm font-medium truncate">
                                {r.userId?.name || "Utilisateur"}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm md:text-base">
                              {r.replyMessage}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vues */}
                  <div>
                    <h4 className="text-slate-400 text-xs uppercase font-bold mb-2 md:mb-3">
                      Vues ({statsData.totalViews || 0})
                    </h4>
                    {statsData.views?.length === 0 ? (
                      <p className="text-slate-500 italic text-sm">
                        Aucune vue pour le moment
                      </p>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        {statsData.views?.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-white"
                          >
                            <div className="flex items-center gap-2 md:gap-3">
                              <SafeAvatar user={v.userId} size={32} />
                              <div className="min-w-0">
                                <p className="font-medium text-sm md:text-base truncate">
                                  {v.userId?.name || "Utilisateur"}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-400">
                                  {formatDistanceToNow(new Date(v.viewedAt), {
                                    locale: fr,
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Styles CSS pour animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
