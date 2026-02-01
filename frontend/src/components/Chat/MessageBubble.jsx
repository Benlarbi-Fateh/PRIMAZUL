"use client";


import { useState, useRef, useEffect, useContext } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Image as ImageIcon,
  File,
  Mic,
  Download,
  ExternalLink,
  Check,
  CheckCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  MoreVertical,
  Trash2,
  Edit2,
  Languages,
  X,
  RotateCcw,
  Reply,
  
} from "lucide-react";
import Image from "next/image";
import VoiceMessage from "./VoiceMessage";
import ReactionPicker from "./ReactionPicker";
import MessageReactions from "./MessageReactions";
import { AuthContext } from "@/context/AuthProvider";
import { emitToggleReaction } from "@/services/socket";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";



// ========================================
// 📅 DATE SEPARATOR COMPONENT
// ========================================
export function DateSeparator({ date }) {
  const { isDark } = useTheme();


  const formatDate = (d) => {
    const dateObj = new Date(d);
    if (isToday(dateObj)) return "Aujourd'hui";
    if (isYesterday(dateObj)) return "Hier";
    return format(dateObj, "EEEE d MMMM yyyy", { locale: fr });
  };


  return (
    <div className="flex items-center justify-center my-4">
      <div
        className={`px-3 py-1 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
      >
        <span
          className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"} capitalize`}
        >
          {formatDate(date)}
        </span>
      </div>
    </div>
  );
}


// ========================================
// 💬 MESSAGE BUBBLE COMPONENT
// ========================================
export default function MessageBubble({
  message,
  isMine,
  isGroup,
  isLast = false,
  onDelete,
  onEdit,
  onTranslate,
  onReply,
  onDeleteForMe,
  onClickMessage, // ✅ C'est la fonction "Vu par"
}) {
  // ========================================
  // 📦 ÉTATS
  // ========================================
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [translatedReplyText, setTranslatedReplyText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);


  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const currentUserId = user?._id || user?.id;
  const router = useRouter();


  // ========================================
  // 🆕 LOGIQUE INTELLIGENTE (MOBILE vs PC)
  // ========================================
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const isTouchInteraction = useRef(false); // 🆕 Pour savoir si c'est un doigt ou une souris


  // Variable visibilité : Survol (PC) OU Clic activé (Mobile)
  const areControlsVisible = isHovered || showMobileOptions;
  


  // 1. DÉTECTION DU TOUCHER (Pour Mobile)
  const handleTouchStart = () => {
    isTouchInteraction.current = true; // ✅ On sait maintenant que c'est un mobile
    isLongPress.current = false;
   
    // Timer pour l'appui long (Mobile uniquement)
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      if (onClickMessage) onClickMessage(); // Lance "Vu par" (Appui long mobile)
    }, 500);
  };


  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    // On laisse isTouchInteraction à true un petit moment pour gérer le click qui suit
    setTimeout(() => { isTouchInteraction.current = false; }, 1000);
  };


  const handleTouchMove = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };


  // 2. GESTION DU CLIC (HYBRIDE PC / MOBILE)
  const handleInteractionClick = (e) => {
    // Si c'était un appui long mobile, on arrête tout
    if (isLongPress.current) return;

    // Sur mobile, le clic sert uniquement à TOGGLE (Ouvrir/Fermer) les options
    if (isTouchInteraction.current) {
      e.stopPropagation(); // ⛔️ Empêche le clic de remonter
      e.preventDefault(); 

      // ✅ LOGIQUE AJOUTÉE : Si on va ouvrir le menu, on prévient les autres de se fermer
      if (!showMobileOptions) {
        const event = new CustomEvent("close-other-bubbles", { 
          detail: { id: message._id } 
        });
        window.dispatchEvent(event);
      }

      setShowMobileOptions((prev) => !prev);
    } else {
      // Sur PC, comportement classique (Vu par)
      if (onClickMessage) onClickMessage();
    }
  };


  // Fermer les options mobiles si on clique ailleurs
    // Fermer les options mobiles si on clique ailleurs
  useEffect(() => {
    if (!showMobileOptions) return; // Ne rien faire si le menu est fermé


    const handleClickOutside = () => {
      setShowMobileOptions(false);
    };


    // ⚡️ CORRECTION MOBILE : Délai de 200ms pour éviter le "Ghost Click"
    // Cela empêche le clic d'ouverture d'être détecté comme un clic de fermeture
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 200);


    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMobileOptions]);




  // ========================================
  // 🎨 FORMATAGE
  // ========================================
  const formatTime = (date) => {
    try {
      return format(new Date(date), "HH:mm", { locale: fr });
    } catch {
      return "";
    }
  };


  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };


  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  // ========================================
  // 🎯 GESTION DES FICHIERS
  // ========================================
  const getFileType = () => {
    if (message.type === "image") return "image";
    if (message.type === "audio") return "audio";
    if (message.type === "file") return "file";
    if (message.type === "voice") return "voice";
    if (message.type === "video") return "video";
    return "text";
  };


  const handleOpenFile = () => {
    if (message.fileUrl) {
      window.open(message.fileUrl, "_blank");
    }
  };


  const handleDownload = async () => {
    if (!message.fileUrl) return;


    try {
      const response = await fetch(message.fileUrl);
      if (!response.ok) {
        throw new Error("Erreur réseau");
      }


      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);


      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = message.fileName || "download";
      document.body.appendChild(a);
      a.click();


      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("❌ Erreur téléchargement :", error);
      window.open(message.fileUrl, "_blank");
    }
  };


  const handleOpenStoryFromReply = (e) => {
    e.stopPropagation();
    const statusId = message.storyReply?.statusId;
    if (!statusId) return;


    router.push(`/status?statusId=${statusId}`);
  };


  // ========================================
  // 🎥 GESTION VIDÉO
  // ========================================
  const togglePlay = () => {
    if (!videoRef.current) return;


    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };


  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };


  const handleVideoClick = () => {
    if (!showControls) {
      setShowControls(true);
      setTimeout(() => setShowControls(false), 3000);
    }
  };


  const handleFullscreen = () => {
    if (!videoRef.current) return;


    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen().catch((err) => {
        console.error(`Erreur fullscreen: ${err.message}`);
      });
    }
  };


  // ========================================
  // 😊 GESTION DES RÉACTIONS
  // ========================================
  const handleReaction = (emoji) => {
    emitToggleReaction({
      messageId: message._id,
      emoji,
      userId: currentUserId,
      conversationId: message.conversationId,
    });
  };


  // ========================================
  // 🗑️ GESTION DU MENU 3 POINTS
  // ========================================
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };


  const handleDelete = (e) => {
    e.stopPropagation();


    if (
      window.confirm("Voulez-vous vraiment supprimer ce message pour tous ?")
    ) {
      if (onDelete) {
        onDelete(message._id);
      }
    }


    setShowMenu(false);
  };


  // ✅ NOUVELLE FONCTION : SUPPRIMER POUR MOI
  const handleDeleteForMe = (e) => {
    e.stopPropagation();
    console.log("🔍 DEBUT handleDeleteForMe");


    if (window.confirm("Supprimer ce message pour vous uniquement ?")) {
      if (onDeleteForMe) {
        console.log("✅ onDeleteForMe existe, appel en cours...");
        onDeleteForMe(message._id);
      } else {
        console.error("❌ onDeleteForMe est undefined !");
      }
    }


    setShowMenu(false);
  };


  const handleEdit = (e) => {
    e.stopPropagation();


    if (onEdit) {
      onEdit(message._id, message.content);
    }


    setShowMenu(false);
  };


  const handleReply = (e) => {
    e.stopPropagation();


    if (onReply) {
      onReply(message._id, message.content, message.sender);
    }


    setShowMenu(false);
  };


  // ========================================
  // 🌍 GESTION DE LA TRADUCTION
  // ========================================
  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "Anglais", flag: "🇬🇧" },
    { code: "es", name: "Espagnol", flag: "🇪🇸" },
    { code: "de", name: "Allemand", flag: "🇩🇪" },
    { code: "it", name: "Italien", flag: "🇮🇹" },
    { code: "ar", name: "Arabe", flag: "🇸🇦" },
    { code: "zh", name: "Chinois", flag: "🇨🇳" },
    { code: "ja", name: "Japonais", flag: "🇯🇵" },
  ];


  const handleTranslateClick = (e) => {
    e.stopPropagation();


    if (isTranslated) {
      setIsTranslated(false);
      setShowLanguageMenu(false);
    } else {
      setShowLanguageMenu(!showLanguageMenu);
    }
  };


  // ========================================
// 🌍 GESTION DE LA TRADUCTION (MISE À JOUR)
// ========================================
const handleTranslate = async (targetLang) => {
  setIsTranslating(true);
  setShowLanguageMenu(false);


  try {
    if (onTranslate) {
      if (!isTranslated) {
        setOriginalText(message.content);
      }


      // Préparer les promesses de traduction
      const translations = [];


      // 1. Traduire le message principal
      translations.push(
        onTranslate(message.content, message._id, targetLang)
      );


      // 2. Traduire la réponse (si elle existe)
      if (message.replyToContent) {
        // On passe un ID fictif ou le même ID pour la réponse, car onTranslate a besoin d'un ID
        translations.push(
          onTranslate(message.replyToContent, `${message._id}_reply`, targetLang)
        );
      } else {
        translations.push(Promise.resolve(null));
      }


      // Exécuter les traductions en parallèle
      const [translatedMain, translatedReply] = await Promise.all(translations);


      setTranslatedText(translatedMain);
     
      if (translatedReply) {
        setTranslatedReplyText(translatedReply);
      }


      setIsTranslated(true);
    }
  } catch (error) {
    console.error("❌ Erreur de traduction:", error);
    alert("Impossible de traduire ce message");
  } finally {
    setIsTranslating(false);
  }
};


  // ========================================
  // 🎨 FERMETURE DES MENUS
  // ========================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu || showLanguageMenu) {
        setShowMenu(false);
        setShowLanguageMenu(false);
      }
    };


    if (showMenu || showLanguageMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showMenu, showLanguageMenu]);

    // ========================================
  // 🔒 GESTION DE LA FERMETURE AUTOMATIQUE (SINGLE SELECTION)
  // ========================================
  useEffect(() => {
    const handleCloseOthers = (event) => {
      // Si l'ID du message qui vient d'être cliqué n'est pas le mien, je me ferme
      if (event.detail.id !== message._id) {
        setShowMobileOptions(false);
        // On ferme aussi les sous-menus pour être propre
        setShowMenu(false);
        setShowLanguageMenu(false);
      }
    };

    window.addEventListener("close-other-bubbles", handleCloseOthers);

    return () => {
      window.removeEventListener("close-other-bubbles", handleCloseOthers);
    };
  }, [message._id]);

  // ========================================
  // 📊 RENDU DU STATUT
  // ========================================
  const status = message.status || "sent";
  const showTimestamp = isHovered || isLast;


  const renderStatus = () => {
    if (!isMine) return null;
    if (status === "read")
      return <CheckCheck className="w-4 h-4 text-cyan-400 inline ml-1" />;
    if (status === "delivered")
      return <CheckCheck className="w-4 h-4 text-blue-200 inline ml-1" />;
    if (status === "sent")
      return <Check className="w-4 h-4 text-blue-200 inline ml-1" />;
    return null;
  };


  const renderTimestamp = () => (
    <div
      className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${showTimestamp ? "max-h-6 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"}`}
    >
      <span
        className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        {formatTime(message.createdAt)}
      </span>
      {renderStatus()}
    </div>
  );


  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    return (
      <div
        className={`flex ${isMine ? "justify-end" : "justify-start"} mt-2 mb-1`}
      >
        <MessageReactions
          reactions={message.reactions}
          onReactionClick={handleReaction}
          currentUserId={currentUserId}
          isMine={isMine}
          isDark={isDark} // 🆕 on passe le thème
        />
      </div>
    );
  };


  // ========================================
  // 🎬 RENDU MESSAGE VIDÉO (AVEC TÉLÉCHARGEMENT)
  // ========================================
  const renderVideoMessage = () => {
    const avatarUrl =
      message.sender?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || "User")}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && isGroup && (
          <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
            {message.sender?.name}
          </p>
        )}
        <div className={`flex items-start gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end mb-1">
              <Image src={avatarUrl} alt={message.sender?.name || "User"} fill sizes="32px" className="object-cover" />
            </div>
          )}
         
          {/* CONTENEUR PRINCIPAL */}
          <div
            className={`relative flex items-center gap-1 group ${isMine ? "flex-row" : "flex-row-reverse"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* 🔽 ZONE OPTIONS (Visible PC survol / Mobile Tap) 🔽 */}
            <div
              className={`flex items-center gap-1 transition-opacity duration-200
                ${isMine ? "flex-row" : "flex-row-reverse"}
                ${areControlsVisible ? "opacity-100 visible [&_*]:opacity-100" : "opacity-0 invisible"}
              `}
            >
              <div className="relative">
                <button onClick={handleMenuToggle} className="p-1 rounded-full hover:bg-gray-500 transition text-gray-600">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {showMenu && (
                  <div className={`absolute ${isMine ? "left-0" : "right-0"} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`} onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleReply} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700"><Reply className="w-4 h-4" /> Répondre</button>
                    <button onClick={handleDeleteForMe} className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600"><Trash2 className="w-4 h-4" /> Supprimer</button>
                    {isMine && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button onClick={handleEdit} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"><Edit2 className="w-4 h-4" /> Modifier</button>
                        <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Retirer</button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>

            {/* 🔽 BULLE VIDÉO 🔽 */}
            <div
              className={`max-w-xs lg:max-w-md ${isMine ? "ml-auto" : "mr-auto"}`}
              // Événements Tactiles et Clics
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={handleInteractionClick}
            >
              <div className={`rounded-3xl overflow-hidden shadow-lg ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white border-2 border-blue-100"}`}>
                
                {/* ❌ J'AI SUPPRIMÉ LA LIGNE DE TEXTE ICI ❌ */}
                {message.replyTo && (
                  <div className={`mb-2 p-2 rounded-lg border-l-4 ${isMine ? "bg-blue-700/30 border-white/50" : "bg-gray-100 border-blue-500"}`}>
                    <p className={`text-xs font-semibold ${isMine ? "text-white/80" : "text-blue-600"}`}>
                      {message.replyToSender?.name || "Utilisateur"}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${isMine ? "text-white/70" : "text-gray-600"}`}>
                      {isTranslated && translatedReplyText ? translatedReplyText : message.replyToContent}
                    </p>
                  </div>
                )}

                <div className="relative w-full h-44 sm:h-52 bg-black cursor-pointer">
                  <video
                    ref={videoRef}
                    preload="metadata"
                    className="w-full h-full object-contain"
                    // Le clic sur la vidéo déclenche les options sur mobile, ou Play/Pause via les contrôles
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  >
                    <source src={message.fileUrl} type="video/mp4" />
                    <source src={message.fileUrl} type="video/webm" />
                    Votre navigateur ne supporte pas les vidéos.
                  </video>

                  {/* Bouton Play Central */}
                  {!isPlaying && (
                    <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all hover:bg-black/50 z-10">
                      <div className="w-14 h-14 flex items-center justify-center bg-white/90 rounded-full hover:scale-105 transition-transform">
                        <Play className="w-8 h-8 text-black ml-1" fill="black" />
                      </div>
                    </button>
                  )}

                  {/* Badge "VIDÉO" */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-white text-[10px] font-bold z-10">
                    VIDÉO
                  </div>

                  {/* ✅ BOUTON TÉLÉCHARGEMENT (NOUVEAU) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche le clic de se propager (important pour mobile)
                      handleDownload();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-all z-20"
                    title="Télécharger la vidéo"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Contrôles (Play/Pause/Mute/Fullscreen) */}
                  {(showControls || isPlaying) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-3 z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:bg-white/20 p-2 rounded-full">
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="white" />}
                          </button>

                          <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20 p-2 rounded-full">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>

                          <span className="text-xs text-white font-medium">
                            {formatDuration(message.videoDuration || 0)}
                          </span>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); handleFullscreen(); }} className="text-white hover:bg-white/20 p-2 rounded-full">
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-gradient-to-b from-white to-blue-50/30">
                    <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>{message.content}</p>
                  </div>
                )}
              </div>

              <span className={`text-xs mt-1.5 flex items-center ${isMine ? "justify-end text-blue-300" : "text-slate-500"}`}>
                {formatTime(message.createdAt)} {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };


  // ========================================
  // 🎤 RENDU MESSAGE VOCAL (CORRIGÉ MOBILE)
  // ========================================
  const renderVoiceMessage = () => {
    const avatarUrl =
      message.sender?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || "User")}&background=3b82f6&color=fff&bold=true`;


    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && isGroup && (
          <span className={`text-xs font-semibold mb-1 ml-10 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
            {message.sender?.name}
          </span>
        )}
        <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
              <Image src={avatarUrl} alt={message.sender?.name || "User"} fill sizes="32px" className="object-cover" />
            </div>
          )}
         
          <div
            className={`relative flex items-center gap-1 group ${isMine ? "flex-row" : "flex-row-reverse"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* 🔽 ZONE OPTIONS 🔽 */}
            <div
              className={`flex items-center gap-1 transition-opacity duration-200
                ${isMine ? "flex-row" : "flex-row-reverse"}
                ${areControlsVisible ? "opacity-100 visible [&_*]:opacity-100" : "opacity-0 invisible"}
              `}
            >
              <div className="relative">
                <button onClick={handleMenuToggle} className="p-1 rounded-full hover:bg-gray-200 transition text-gray-600">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
                {showMenu && (
                  <div className={`absolute ${isMine ? "left-0" : "right-0"} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`} onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleReply} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700"><Reply className="w-4 h-4" /> Répondre</button>
                    <button onClick={handleDeleteForMe} className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600"><Trash2 className="w-4 h-4" /> Supprimer</button>
                    {isMine && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button onClick={handleEdit} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"><Edit2 className="w-4 h-4" /> Modifier</button>
                        <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Retirer</button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>


            {/* 🔽 BULLE VOCAL 🔽 */}
            <div
               className="flex flex-col max-w-xs lg:max-w-md"
               // 👈 ICI ON AJOUTE LES ÉVÉNEMENTS
               onTouchStart={handleTouchStart}
               onTouchEnd={handleTouchEnd}
               onTouchMove={handleTouchMove}
               onClick={handleInteractionClick}
            >
              <div className={`rounded-3xl overflow-hidden shadow-lg ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white border-2 border-blue-100"}`}>
                {message.replyTo && (
                  <div className={`p-2 border-l-4 ${isMine ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-blue-500"}`}>
                    <p className={`text-xs font-semibold ${isMine ? "text-blue-700" : "text-blue-600"}`}>{message.replyToSender?.name || "Utilisateur"}</p>
                    <p className={`text-xs mt-1 line-clamp-2 ${isMine ? "text-blue-600" : "text-gray-600"}`}>{isTranslated && translatedReplyText ? translatedReplyText : message.replyToContent}</p>
                  </div>
                )}


                <VoiceMessage voiceUrl={message.voiceUrl} voiceDuration={message.voiceDuration} isMine={isMine} isGroup={isGroup} sender={message.sender} isDark={isDark} />
              </div>


              <span className={`text-xs mt-1.5 flex items-center ${isMine ? "justify-end text-blue-300" : "text-slate-500"}`}>
                {formatTime(message.createdAt)} {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };


  // ========================================
  // 🖼️ RENDU MESSAGE IMAGE (CORRECTION CLIC RÉACTION)
  // ========================================
  const renderImageMessage = () => {
    const avatarUrl =
      message.sender?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || "User")}&background=3b82f6&color=fff&bold=true`;


    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && isGroup && (
          <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
            {message.sender?.name}
          </p>
        )}
        <div className={`flex items-start gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end">
              <Image src={avatarUrl} alt={message.sender?.name || "User"} fill sizes="32px" className="object-cover" />
            </div>
          )}
         
          {/* CONTENEUR PRINCIPAL */}
          <div
            className={`relative flex items-center gap-1 group ${isMine ? "flex-row" : "flex-row-reverse"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
           
            {/* 🔽 ZONE OPTIONS (CORRIGÉE AVEC Z-INDEX) 🔽 */}
            <div
              className={`flex items-center gap-1 transition-opacity duration-200 relative z-30
                ${isMine ? "flex-row" : "flex-row-reverse"}
                ${areControlsVisible ? "opacity-100 visible [&_*]:opacity-100" : "opacity-0 invisible"}
              `}
            >
              <div className="relative">
                <button onClick={handleMenuToggle} className="p-1 rounded-full hover:bg-gray-200 transition text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className={`absolute ${isMine ? "left-0" : "right-0"} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`} onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleReply} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700"><Reply className="w-4 h-4" /> Répondre</button>
                    <button onClick={handleDeleteForMe} className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600"><Trash2 className="w-4 h-4" /> Supprimer</button>
                    {isMine && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button onClick={handleEdit} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"><Edit2 className="w-4 h-4" /> Modifier</button>
                        <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Retirer</button>
                      </>
                    )}
                  </div>
                )}
              </div>


              {/* Wrapper explicite pour le ReactionPicker */}
              <div className="relative flex items-center pointer-events-auto">
                 <ReactionPicker onSelect={handleReaction} isMine={isMine} />
              </div>
            </div>


            {/* 🔽 BULLE IMAGE 🔽 */}
            <div
              className={`max-w-xs lg:max-w-md ${isMine ? "ml-auto" : "mr-auto"} relative z-10`} // z-10 ici (inférieur aux options)
              // Événements Tactiles et Clics
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={handleInteractionClick}
            >
              <div
                className={`rounded-3xl overflow-hidden shadow-lg border-2 ${
                  isDark ? "bg-slate-900 border-slate-700" : "bg-white border-blue-100"
                }`}
              >
                {message.replyTo && (
                  <div className={`p-2 border-l-4 ${isMine ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-blue-500"}`}>
                    <p className={`text-xs font-semibold ${isMine ? "text-blue-700" : "text-blue-600"}`}>{message.replyToSender?.name || "Utilisateur"}</p>
                    <p className={`text-xs mt-1 line-clamp-2 ${isMine ? "text-blue-600" : "text-gray-600"}`}>{isTranslated && translatedReplyText ? translatedReplyText : message.replyToContent}</p>
                  </div>
                )}


                <div className={`relative w-56 h-44 sm:w-64 sm:h-52 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Image src={message.fileUrl} alt={message.fileName || "Image"} fill sizes="(max-width: 640px) 224px, 256px" className="object-cover" />
                 
                  {/* BOUTON AGRANDIR */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsImageFullscreen(true);
                    }}
                    className="absolute top-2 left-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors z-20"
                    title="Agrandir"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>


                  {/* BOUTON TÉLÉCHARGER */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors z-20"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>


                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-linear-to-b from-white to-blue-50/30">
                    <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>{message.content}</p>
                  </div>
                )}
              </div>


              <span className={`text-xs mt-1.5 flex items-center ${isMine ? "justify-end text-blue-300" : "text-slate-500"}`}>
                {formatTime(message.createdAt)} {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}


        {/* MODALE PLEIN ÉCRAN */}
        {isImageFullscreen && (
          <div
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageFullscreen(false);
            }}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              onClick={() => setIsImageFullscreen(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <div
              className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={message.fileUrl}
                alt="Plein écran"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>
        )}
      </div>
    );
  };


    // ========================================
  // 📁 RENDU MESSAGE FICHIER (CORRIGÉ MOBILE)
  // ========================================
  const renderFileMessage = () => {
    const avatarUrl =
      message.sender?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || "User")}&background=3b82f6&color=fff&bold=true`;


    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && isGroup && (
          <span className={`text-xs font-semibold mb-1 ml-10 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
            {message.sender?.name}
          </span>
        )}
        <div className={`flex items-start gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end">
              <Image src={avatarUrl} alt={message.sender?.name || "User"} fill sizes="32px" className="object-cover" />
            </div>
          )}
         
          <div
            className={`relative flex items-center gap-1 group ${isMine ? "flex-row" : "flex-row-reverse"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* 🔽 ZONE OPTIONS 🔽 */}
            <div
              className={`flex items-center gap-1 transition-opacity duration-200
                ${isMine ? "flex-row" : "flex-row-reverse"}
                ${areControlsVisible ? "opacity-100 visible [&_*]:opacity-100" : "opacity-0 invisible"}
              `}
            >
              <div className="relative">
                <button onClick={handleMenuToggle} className="p-1 rounded-full hover:bg-gray-200 transition text-gray-600">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
                {showMenu && (
                  <div className={`absolute ${isMine ? "left-0" : "right-0"} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`} onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleReply} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700"><Reply className="w-4 h-4" /> Répondre</button>
                    <button onClick={handleDeleteForMe} className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600"><Trash2 className="w-4 h-4" /> Supprimer</button>
                    {isMine && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button onClick={handleEdit} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"><Edit2 className="w-4 h-4" /> Modifier</button>
                        <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Retirer</button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>


            {/* 🔽 BULLE FICHIER 🔽 */}
            <div
              className={`max-w-xs lg:max-w-md ${isMine ? "ml-auto" : "mr-auto"}`}
              // 👈 ICI ON AJOUTE LES ÉVÉNEMENTS
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={handleInteractionClick}
            >
              {message.replyTo && (
                <div className={`mb-2 p-2 rounded-lg border-l-4 ${isMine ? "bg-blue-100 border-blue-500" : "bg-gray-100 border-blue-500"}`}>
                  <p className={`text-xs font-semibold ${isMine ? "text-blue-700" : "text-blue-600"}`}>{message.replyToSender?.name || "Utilisateur"}</p>
                  <p className={`text-xs mt-1 line-clamp-2 ${isMine ? "text-blue-600" : "text-gray-600"}`}>{isTranslated && translatedReplyText ? translatedReplyText : message.replyToContent}</p>
                </div>
              )}


              <div className={`rounded-3xl overflow-hidden shadow-lg ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white border-2 border-blue-100"}`}>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <File className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? "text-slate-100" : "text-slate-800"}`} title={message.fileName}>{message.fileName}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{formatFileSize(message.fileSize)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => {e.stopPropagation(); handleOpenFile()}} className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors" title="Ouvrir"><ExternalLink className="w-4 h-4" /></button>
                    <button onClick={(e) => {e.stopPropagation(); handleDownload()}} className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors" title="Télécharger"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-linear-to-b from-white to-blue-50/30">
                    <p className={`text-sm font-medium ${isDark ? "text-slate-100" : "text-slate-700"}`}>{message.content}</p>
                  </div>
                )}
              </div>


              <span className={`text-xs mt-1.5 flex items-center ${isMine ? "justify-end text-blue-300" : "text-slate-500"}`}>
                {formatTime(message.createdAt)} {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };


  // ========================================
  // 🎵 RENDU MESSAGE AUDIO
  // ========================================
  const renderAudioMessage = () => {
    const avatarUrl =
      message.sender?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || "User")}&background=3b82f6&color=fff&bold=true`;


    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && isGroup && (
          <span
            className={`text-xs font-semibold mb-1 ml-10 ${isDark ? "text-blue-300" : "text-blue-700"}`}
          >
            {message.sender?.name}
          </span>
        )}
        <div
          className={`flex items-start gap-2 ${isMine ? "flex-row-reverse animate-slide-in-right" : "flex-row animate-slide-in-left"}`}
        >
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end">
              <Image
                src={avatarUrl}
                alt={message.sender?.name || "User"}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          )}
          <div
            className={`relative flex items-center gap-1 group ${isMine ? "flex-row" : "flex-row-reverse"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={`flex items-center gap-1 ${isMine ? "flex-row" : "flex-row-reverse"}`}
            >
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  // FIX MOBILE : opacity-100 par défaut (mobile), caché sur large screen sauf hover
                  className="p-1 rounded-full hover:bg-gray-200 transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>


                {showMenu && (
                  <div
                    className={`absolute ${
                      isMine ? "left-0" : "right-0"
                    } top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Répondre – pour tout le monde */}
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>


                    {/* ✅ Supprimer pour moi – pour TOUT LE MONDE (envoyé ou reçu) */}
                    <button
                      onClick={handleDeleteForMe}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>


                    {/* Options supplémentaires uniquement pour MES messages */}
                    {isMine && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleEdit}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Retirer
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>


              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>


            <div
              className={`max-w-xs lg:max-w-md ${isMine ? "ml-auto" : "mr-auto"}`}
            >
              <div
                className={`rounded-3xl overflow-hidden shadow-lg hover:border-blue-300 transition-all transform hover:scale-[1.02] ${
                  isDark
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-white border-2 border-blue-100"
                }`}
              >
                {message.replyTo && (
                  <div
                    className={`p-2 border-l-4 ${
                      isMine
                        ? "bg-blue-100 border-blue-500"
                        : "bg-gray-100 border-blue-500"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        isMine ? "text-blue-700" : "text-blue-600"
                      }`}
                    >
                      {message.replyToSender?.name || "Utilisateur"}
                    </p>
                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isMine ? "text-blue-600" : "text-gray-600"
                      }`}
                    >
                      {isTranslated && translatedReplyText ? translatedReplyText : message.replyToContent}
                    </p>
                  </div>
                )}


                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isDark ? "text-slate-100" : "text-slate-800"
                      }`}
                      title={message.fileName}
                    >
                      {message.fileName || "Fichier audio"}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {formatFileSize(message.fileSize)}
                      {message.audioDuration &&
                        ` • ${formatDuration(message.audioDuration)}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleOpenFile}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Écouter"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-linear-to-b from-white to-blue-50/30">
                    <p
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-100" : "text-slate-700"
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                )}
              </div>


              <span
                className={`text-xs mt-1.5 flex items-center ${isMine ? "justify-end text-blue-300" : "text-slate-500"}`}
              >
                {/* ✅ AFFICHER "Programmé" SI isScheduled = true */}
                {message.isScheduled && (
                  <span className="px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full">
                    ⏰ Programmé
                  </span>
                )}
                {formatTime(
                  message.isScheduled && message.scheduledFor
                    ? message.scheduledFor
                    : message.createdAt,
                )}
                {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };

  // ========================================
  // 🟢 RENDU SPÉCIAL : RÉPONSE STORY (BLOC VERT)
  // ========================================
  const renderStoryReplyBlock = () => {
    // Si le message ne contient pas d'infos de story, on n'affiche rien
    if (!message.storyReply) return null;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation(); // Empêche d'ouvrir le menu du message
          // Redirection vers la page de status avec l'ID précis
          if (message.storyReply.statusId) {
            router.push(`/status?statusId=${message.storyReply.statusId}`);
          }
        }}
        className={`
          mb-2 p-2 rounded-lg border-l-4 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden
          ${isMine 
            ? "bg-black/10 border-white/60 hover:bg-black/20" // Style sombre pour mes messages
            : "bg-green-50 border-green-500 hover:bg-green-100" // 🟢 Style VERT demandé pour les autres
          }
        `}
      >
        {/* Miniature (S'affiche si une URL existe, sinon icône générique) */}
        <div className={`w-10 h-14 rounded overflow-hidden shrink-0 border flex items-center justify-center
          ${isMine ? "border-white/30 bg-white/10" : "border-green-200 bg-green-200"}`}
        >
          {message.storyReply.mediaUrl ? (
            <Image 
              src={message.storyReply.mediaUrl} 
              alt="Story" 
              width={40} 
              height={56} 
              className="w-full h-full object-cover" 
            />
          ) : (
            // Importe ExternalLink depuis 'lucide-react' en haut du fichier si ce n'est pas fait
            <ExternalLink size={16} className={isMine ? "text-white" : "text-green-600"} />
          )}
        </div>

        {/* Texte du lien */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className={`text-xs font-bold uppercase mb-0.5 ${isMine ? "text-white/90" : "text-green-700"}`}>
            Statut
          </p>
          <p className={`text-[11px] flex items-center gap-1 font-medium ${isMine ? "text-white/70" : "text-green-600"}`}>
            Voir la story
          </p>
        </div>
      </div>
    );
  };

  // ========================================
  // 📸 RENDU SPÉCIAL : FENÊTRE VISUELLE DU STATUT
  // ========================================
  const renderStoryWindow = () => {
    // Filtre strict
    if (!message.storyReply || !message.storyReply.statusId) {
      return null;
    }

    const isVideo = message.storyReply.type === 'video' || message.storyReply.mediaUrl?.endsWith('.mp4') || message.storyReply.mediaUrl?.endsWith('.webm');

    return (
      <div
        // ✅ CORRECTION ICI : On utilise onMouseDown ou onPointerDown pour éviter les conflits de clic tactile
        // et on supprime e.preventDefault() qui peut bloquer certains comportements React
        onClick={(e) => {
          e.stopPropagation(); // On garde ça pour ne pas ouvrir le "Vu par"
          // Pas de preventDefault() ici, ça peut bloquer la mise à jour de l'UI
          router.push(`/status?statusId=${message.storyReply.statusId}`);
        }}
        className={`
          group relative w-full mb-3 rounded-xl overflow-hidden cursor-pointer shadow-sm border z-20
          ${isMine ? "border-white/20" : "border-gray-200"}
          transform transition-all duration-300 hover:brightness-110
        `}
      >
        {/* --- LE REST DU CONTENU (Image, Vidéo, etc.) RESTE IDENTIQUE --- */}
        <div className="relative w-full h-32 bg-gray-200 pointer-events-none"> 
          {/* 👆 pointer-events-none sur le contenu interne assure que le clic est bien capté par la div parente */}
          {message.storyReply.mediaUrl ? (
            <>
              {isVideo ? (
                <video 
                  src={message.storyReply.mediaUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <Image 
                  src={message.storyReply.mediaUrl} 
                  alt="Aperçu du statut" 
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              )}
              
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                  <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isMine ? "bg-slate-700" : "bg-gray-100"}`}>
               <ExternalLink className="opacity-50" />
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 pl-1">
                <div className="w-1 h-3 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                <p className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
                  Statut
                </p>
              </div>
              <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">
                <ExternalLink size={10} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  

  // ========================================
  // 💬 RENDU MESSAGE TEXTE (ICÔNES RESTAURÉES + FENÊTRE STORY)
  // ========================================
  const renderTextMessage = () => {
    const avatarUrl =
      message.sender?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        message.sender?.name || "User",
      )}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        {!isMine && isGroup && (
          <span className={`text-xs font-semibold mb-1 ml-10 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
            {message.sender?.name}
          </span>
        )}

        <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
              <Image src={avatarUrl} alt={message.sender?.name || "User"} fill sizes="32px" className="object-cover" />
            </div>
          )}

          {/* CONTENEUR PRINCIPAL */}
          <div
            className={`relative flex items-center gap-2 group ${isMine ? "flex-row" : "flex-row-reverse"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
           
            {/* 🔽 ZONE DES ICÔNES (Exactement comme dans ton ancien code) 🔽 */}
            <div
              className={`flex items-center gap-1 transition-opacity duration-200
                ${isMine ? "flex-row" : "flex-row-reverse"}
                ${areControlsVisible || showMenu || showLanguageMenu
                  ? "opacity-100 visible [&_*]:opacity-100 pointer-events-auto"
                  : "opacity-0 invisible pointer-events-none"
                }
              `}
            >
             
              {/* 1. MENU 3 POINTS */}
              <div className="relative">
                <button onClick={handleMenuToggle} className="p-1 rounded-full hover:bg-gray-200 transition text-gray-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className={`absolute ${isMine ? "left-0" : "right-0"} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`} onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleReply} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700">
                      <Reply className="w-4 h-4" /> Répondre
                    </button>
                    <button onClick={handleDeleteForMe} className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 flex items-center gap-2 text-orange-600">
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                    {isMine && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button onClick={handleEdit} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700">
                          <Edit2 className="w-4 h-4" /> Modifier
                        </button>
                        <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">
                          <Trash2 className="w-4 h-4" /> Retirer
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 2. BOUTON RÉACTION */}
              <div className="relative flex items-center">
                 <ReactionPicker onSelect={handleReaction} isMine={isMine} />
              </div>

              {/* 3. BOUTON TRADUCTION */}
              <div className="relative">
                <button
                  onClick={handleTranslateClick}
                  disabled={isTranslating}
                  className={`p-1 rounded-full transition-colors ${
                    isTranslated
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                  title="Traduire le message"
                >
                  {isTranslating ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : isTranslated ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Languages className="w-4 h-4" />
                  )}
                </button>

                {/* Menu des langues */}
                {showLanguageMenu && (
                  <div
                    className={`absolute bottom-full mb-2 ${isMine ? "right-0" : "left-0"} bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[9999] min-w-[180px]`}
                    style={{ maxHeight: "280px", overflowY: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Traduire vers</div>
                    {languages.map((lang) => (
                      <button key={lang.code} onClick={() => handleTranslate(lang.code)} className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors">
                        <span className="text-xl">{lang.flag}</span>
                        <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
            {/* 🔼 FIN ZONE DES ICÔNES 🔼 */}

            {/* 🔽 BULLE MESSAGE 🔽 */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onClick={handleInteractionClick}
             
              className={`cursor-pointer max-w-xs lg:max-w-md xl-max-w-lg px-5 py-3 rounded-3xl shadow-md transition-all transform hover:scale-[1.02] ${
                isMine
                  ? "bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white rounded-br-md"
                  : isDark
                    ? "bg-slate-800 text-slate-100 rounded-bl-md border border-slate-700"
                    : "bg-white text-slate-800 rounded-bl-md border-2 border-blue-100"
              }`}
            >
              {/* ✅ ICI : APPEL DE LA FENÊTRE STORY (filtrée) */}
              {renderStoryWindow()}

              {message.replyTo && (
                <div className={`mb-2 p-2 rounded-lg border-l-4 ${isMine ? "bg-blue-700/30 border-white/50" : "bg-gray-100 border-blue-500"}`}>
                  <p className={`text-xs font-semibold ${isMine ? "text-white/80" : "text-blue-600"}`}>
                    {message.replyToSender?.name || "Utilisateur"}
                  </p>
                  <p className={`text-xs mt-1 line-clamp-2 ${isMine ? "text-white/70" : "text-gray-600"}`}>
                    {message.replyToContent}
                  </p>
                </div>
              )}

              <p className="text-sm wrap-break-word whitespace-pre-wrap leading-relaxed">
                {isTranslated ? translatedText : message.content}
              </p>
            </div>
          </div>
        </div>
        {renderReactions()}
        {renderTimestamp()}
      </div>
    );
  };


  // ========================================
  // 🎯 RENDU PRINCIPAL
  // ========================================
  const fileType = getFileType();


  switch (fileType) {
    case "video":
      return renderVideoMessage();
    case "voice":
      return renderVoiceMessage();
    case "image":
      return renderImageMessage();
    case "file":
      return renderFileMessage();
    case "audio":
      return renderAudioMessage();
    default:
      return renderTextMessage();
  }
}



