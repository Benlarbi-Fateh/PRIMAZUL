"use client";
import { useState, useEffect, useRef, useContext } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  Users,
  X,
  Image,
  FileText,
  Music,
  Download,
  Trash2,
  AlertCircle,
  Link,
  Play,
  Pause,
  Expand,
  Shield,
  Lock,
  Unlock,
  Info,
} from "lucide-react";
import useBlockCheck from "../../hooks/useBlockCheck";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { onOnlineUsersUpdate, requestOnlineUsers } from "@/services/socket";
import { formatMessageDate } from "@/utils/dateFormatter";
import ImageComponent from "next/image";

// ✅ AJOUT DE onVideoCall ET onAudioCall DANS LES PROPS
export default function ChatHeader({
  contact,
  conversation,
  onBack,
  onVideoCall,
  onAudioCall,
}) {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [mediaType, setMediaType] = useState("images");
  const [mediaData, setMediaData] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [settings, setSettings] = useState({
    muted: false,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  const menuRef = useRef(null);

  const {
    isBlocked,
    blockStatus,
    loading: blockLoading,
    refresh: refreshBlockStatus,
  } = useBlockCheck(contact?._id);

  // ... (Toutes tes fonctions existantes RESTENT INCHANGÉES) ...
  // Je garde le code compact ici, mais dans ton fichier, ne supprime rien de la logique existante.
  const formatMessageDateLocal = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    return d.toLocaleDateString("fr-FR");
  };
  const downloadFile = async (file) => {
    /* ... */
  };
  const downloadImage = async (image) => {
    /* ... */
  };
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const openImage = (image) => {
    setSelectedImage(image);
  };
  const playAudio = async (audio) => {
    /* ... */
  };
  const loadMedia = async (type) => {
    /* ... */
  };
  const toggleMute = async () => {
    /* ... */
  };
  const toggleBlock = async () => {
    /* ... */
  };
  const handleDeleteConversation = async () => {
    /* ... */
  };
  const openMediaPanel = async () => {
    setShowMediaPanel(true);
    setShowMenu(false);
    await loadMedia("images");
  };

  // ... (UseEffects INCHANGÉS) ...
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);
  useEffect(() => {
    /* ... */
  }, [conversation?._id]);
  useEffect(() => {
    if (contact?._id) setOnlineUsers(new Set([contact._id]));
  }, [contact?._id]);
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);
  useEffect(() => {
    /* ... */
  }, []);
  useEffect(() => {
    if (!user) return;
    const loadSocketModule = async () => {
      try {
        const socketModule = await import("../../services/socket");
        const { onOnlineUsersUpdate, requestOnlineUsers } = socketModule;
        const unsubscribe = onOnlineUsersUpdate((userIds) => {
          setOnlineUsers(new Set(userIds));
        });
        requestOnlineUsers();
        return () => unsubscribe();
      } catch (error) {
        console.error("Erreur chargement socket:", error);
      }
    };
    loadSocketModule();
  }, [user]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  // Styles
  const headerBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800";
  const buttonStyle = isDark
    ? "hover:bg-blue-800/50 text-blue-200"
    : "hover:bg-white/20 text-white";
  const textPrimary = isDark ? "text-blue-50" : "text-white";
  const textSecondary = isDark ? "text-blue-200" : "text-blue-100";
  const textMuted = isDark ? "text-blue-300" : "text-blue-200";
  const ringStyle = isDark
    ? "ring-blue-700/50 group-hover:ring-blue-500/80"
    : "ring-white/50 group-hover:ring-white/70";
  const borderStyle = isDark ? "border-blue-600" : "border-blue-700";
  const onlineDot = isDark ? "bg-cyan-400" : "bg-emerald-400";
  const groupBadge = isDark
    ? "bg-gradient-to-br from-blue-700 to-blue-800 border-blue-600"
    : "bg-gradient-to-br from-purple-500 to-pink-500 border-blue-700";

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find((p) => (p._id || p.id) !== userId);
  };
  const handleProfileClick = () => {
    if (!contact && !conversation) {
      router.push("/profile");
    } else if (conversation?.isGroup) {
    } else {
      const contactUser = contact || getOtherParticipant(conversation);
      if (contactUser?._id) {
        router.push(`/profile/${contactUser._id}`);
      }
    }
  };
  const getProfileTitle = () => {
    if (!contact && !conversation) return "Voir mon profil";
    if (conversation?.isGroup) return "Voir les détails du groupe";
    return "Voir le profil";
  };

  if (!contact && !conversation) {
    return (
      <div className={`relative overflow-hidden ${headerBg} shadow-lg`}>
        {/* ... Contenu vide inchangé ... */}
        <div className="relative p-4">...</div>
      </div>
    );
  }

  const isGroup = conversation?.isGroup || false;
  const displayName = isGroup
    ? conversation?.groupName || "Groupe sans nom"
    : contact?.name || "Utilisateur";
  const displayImage = isGroup
    ? conversation?.groupImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        conversation?.groupName || "Groupe"
      )}&background=${isDark ? "6366f1" : "6366f1"}&color=fff&bold=true`
    : contact?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        contact?.name || "User"
      )}&background=${isDark ? "0ea5e9" : "3b82f6"}&color=fff&bold=true`;
  const participantsCount = isGroup
    ? conversation?.participants?.length || 0
    : null;
  const contactIsOnline = !isGroup && contact?._id && isUserOnline(contact._id);

  return (
    <>
      <div className={`relative overflow-hidden ${headerBg} shadow-lg`}>
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${
            isDark ? "opacity-10" : "opacity-20"
          }`}
        ></div>

        <div className="relative p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack || (() => router.push("/"))}
              className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0 ${buttonStyle}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div
              className="relative shrink-0 cursor-pointer group"
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div
                className={`w-10 h-10 rounded-xl ring-2 ${ringStyle} shadow-lg overflow-hidden transition-all`}
              >
                <ImageComponent
                  src={displayImage}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  onError={(e) => {
                    e.target.src = isGroup
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          displayName
                        )}&background=${
                          isDark ? "6366f1" : "6366f1"
                        }&color=fff&bold=true`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          displayName
                        )}&background=${
                          isDark ? "0ea5e9" : "3b82f6"
                        }&color=fff&bold=true`;
                  }}
                />
              </div>
              {isGroup && (
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 ${groupBadge} rounded-full border-2 flex items-center justify-center`}
                >
                  <Users className="w-2 h-2 text-white" />
                </div>
              )}
              {!isGroup && contactIsOnline && (
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 ${onlineDot} rounded-full border-2 ${borderStyle}`}
                ></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className={`font-bold text-base drop-shadow truncate ${textPrimary}`}
              >
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isGroup ? (
                  <p
                    className={`text-xs truncate font-medium ${textSecondary}`}
                  >
                    {participantsCount} participant
                    {participantsCount > 1 ? "s" : ""}
                  </p>
                ) : blockLoading ? (
                  <p
                    className={`text-xs truncate ${textMuted} flex items-center gap-1`}
                  >
                    Chargement...
                  </p>
                ) : blockStatus?.blockedMe ? (
                  <p
                    className={`text-xs truncate font-medium text-red-200 flex items-center gap-1`}
                  >
                    <Lock className="w-3 h-3" /> Vous êtes bloqué
                  </p>
                ) : blockStatus?.iBlocked ? (
                  <p
                    className={`text-xs truncate font-medium text-yellow-200 flex items-center gap-1`}
                  >
                    <Shield className="w-3 h-3" /> Bloqué
                  </p>
                ) : contactIsOnline ? (
                  <>
                    <span
                      className={`w-2 h-2 ${onlineDot} rounded-full animate-pulse`}
                    ></span>
                    <p
                      className={`text-xs truncate font-medium ${textSecondary}`}
                    >
                      En ligne
                    </p>
                  </>
                ) : (
                  <p className={`text-xs truncate ${textMuted}`}>
                    {contact?.lastSeen
                      ? `Vu ${formatMessageDate(contact.lastSeen)}`
                      : "Hors ligne"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <>
              {/* ✅ AJOUT DES ONCLICK ICI */}
              <button
                onClick={onAudioCall}
                className={`p-2 rounded-xl transition-all ${buttonStyle}`}
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={onVideoCall}
                className={`p-2 rounded-xl transition-all ${buttonStyle}`}
              >
                <Video className="w-4 h-4" />
              </button>
            </>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-xl transition-all ${buttonStyle}`}
              >
                <Info className="w-4 h-4" />
              </button>
              {showMenu && (
                /* ... TON MENU EXISTANT INCHANGÉ ... */
                <div className="fixed right-4 top-20 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  {/* ... */}
                  {/* ... Je ne remets pas tout le code du menu pour raccourcir, mais ne le supprime pas ! ... */}
                  {/* ... */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {openPanel && <div className="...">...</div>}
      {showMediaPanel && <div className="...">...</div>}
      {selectedImage && <div className="...">...</div>}
    </>
  );
}
