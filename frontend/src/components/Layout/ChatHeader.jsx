'use client'
import { useState, useEffect, useRef, useContext } from 'react';
import { ArrowLeft, MoreVertical, Phone,  Video, Users, X, Image, FileText, Music, Download, 
  Trash2, 
  AlertCircle, 
  Link, 
  Play, 
  Pause, 
  Expand, 
  Upload, 
  Shield, 
  Lock, 
  Unlock, 
  Info, 
  UserPlus, 
  UserMinus, 
  Crown, 
  Edit, 
  Camera, 
  Search,
  Check 
} from 'lucide-react';
import useBlockCheck from '../../hooks/useBlockCheck';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  removeParticipantFromGroup,
  promoteToAdmin,
  removeAdminFromGroup,
  updateGroupName,
  updateGroupImage
} from '@/lib/api';
import { AuthContext } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { onOnlineUsersUpdate, requestOnlineUsers } from '@/services/socket';
import { formatMessageDate } from '@/utils/dateFormatter';
import ImageComponent from 'next/image';
import MessageSearch from '@/components/Chat/MessageSearch';
import AddMembersModal from '@/components/Group/AddMembersModal';

export default function ChatHeader({ contact, conversation, onBack, onVideoCall, onAudioCall, onSearchOpen }) {
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
  const fileInputRef = useRef(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const groupImageInputRef = useRef(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  
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
    try {
      const response = await api.get(file.url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
  };
  
  const downloadImage = async (image) => {
    try {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = image.name || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
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
    if (!audio.url) return;
    
    if (playingAudio === audio.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
      }
      return;
    }
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const newAudio = new Audio(audio.url);
      audioRef.current = newAudio;
      setPlayingAudio(audio.id);
      
      newAudio.onended = () => {
        setPlayingAudio(null);
      };
      
      newAudio.onerror = () => {
        setPlayingAudio(null);
        alert('Erreur lors de la lecture audio');
      };
      
      await newAudio.play();
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      setPlayingAudio(null);
    }
  };
  
  const loadMedia = async (type) => {
    setMediaType(type);
    setLoadingMedia(true);
    
    try {
      // Simuler un chargement de données
      // Dans une implémentation réelle, vous feriez un appel API
      setTimeout(() => {
        setMediaData({
          images: [],
          files: [],
          audio: [],
          videos: [],
          links: []
        });
        setLoadingMedia(false);
      }, 500);
    } catch (error) {
      console.error('Erreur chargement média:', error);
      setLoadingMedia(false);
    }
  };

  // ... (UseEffects INCHANGÉS) ...
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);
  
  useEffect(() => {
    // Charger les paramètres initiaux
    const loadSettings = async () => {
      if (conversation?._id) {
        try {
          const response = await api.get(`/message-settings/conversations/${conversation._id}`);
          if (response.data.success) {
            setSettings(response.data.settings);
          }
        } catch (error) {
          console.error('Erreur chargement settings:', error);
        }
      }
    };
    loadSettings();
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

  const openMediaPanel = async () => {
    setShowMediaPanel(true);
    setShowMenu(false);
    await loadMedia("images");
  };

  // ✅ CORRECTION : Écouter les changements de statut de blocage
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
      // Gérer le clic sur un groupe
      setShowMenu(true);
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
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack || (() => router.push("/"))}
              className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm ${buttonStyle}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1"></div>
          </div>
        </div>
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
                <div className="fixed right-4 top-20 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  {/* 🆕 HEADER COMPACT - Plus simple, bouton X intégré */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-6">
                    {/* Pattern de fond subtil */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0L60 60M60 0L0 60' stroke='%23fff' stroke-width='1' opacity='0.1'/%3E%3C/svg%3E")`
                      }}></div>
                    </div>

                    {/* Contenu du header */}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Photo de profil */}
                        <div className="relative">
                          <img 
                            src={displayImage} 
                            alt={displayName} 
                            className="w-14 h-14 rounded-2xl object-cover shadow-xl ring-4 ring-white/30" 
                          />
                          {contactIsOnline && !isGroup && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        
                        {/* Infos utilisateur */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-white truncate drop-shadow-sm">
                            {displayName}
                          </h2>
                          
                          {/* Statut */}
                          <div className="flex items-center gap-2 text-sm mt-1">
                            {isGroup ? (
                              <div className="flex items-center gap-1.5 text-white/90">
                                <Users className="w-3.5 h-3.5" />
                                <span>{participantsCount} participant{participantsCount > 1 ? 's' : ''}</span>
                              </div>
                            ) : blockLoading ? (
                              <div className="flex items-center gap-1.5 text-white/70">
                                <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                                <span>Chargement...</span>
                              </div>
                            ) : (blockStatus?.blockedMe || false) ? (
                              <div className="flex items-center gap-1.5 text-red-200">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Vous êtes bloqué</span>
                              </div>
                            ) : (blockStatus?.iBlocked || false) ? (
                              <div className="flex items-center gap-1.5 text-yellow-200">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Bloqué</span>
                              </div>
                            ) : contactIsOnline ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                                <span className="text-white/90">En ligne</span>
                              </>
                            ) : (
                              <span className="text-white/70">Hors ligne</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 🆕 BOUTON X - Maintenant dans le header */}
                      <button 
                        onClick={() => setShowMenu(false)} 
                        className="p-2.5 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-sm active:scale-95"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 🆕 CONTENU - Actions sans scroll, design épuré */}
                  <div className="p-5 space-y-3 max-h-[calc(85vh-120px)] overflow-y-auto">
                    
                    {/* 🆕 SECTION MEMBRES DU GROUPE - À INSÉRER AU DÉBUT DU MENU */}
                    {isGroup && (
                      <div className="space-y-3 pb-3 border-b border-gray-200 mb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Membres du groupe
                          </h3>
                          {isUserAdmin() && (
                            <button
                              onClick={() => {
                                console.log('🎯 Clic bouton ajout');
                                setShowMenu(false);
                                setShowAddMembersModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-all group"
                              title="Ajouter des membres"
                            >
                              <UserPlus className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                            </button>
                          )}
                        </div>

                        {/* LISTE DES MEMBRES */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {conversation.participants?.map((participant) => {
                            const isCreator = conversation.groupAdmin?._id?.toString() === participant._id?.toString() || 
                                             conversation.groupAdmin?.toString() === participant._id?.toString();
                            const isAdmin = !isCreator && isParticipantAdmin(participant._id);
                            const isMe = participant._id?.toString() === user?._id?.toString();

                            return (
                              <div 
                                key={participant._id} 
                                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                              >
                                <div className="relative">
                                  <img
                                    src={participant.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name || 'User')}&background=0ea5e9&color=fff`}
                                    alt={participant.name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200"
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name || 'User')}&background=0ea5e9&color=fff`;
                                    }}
                                  />
                                  {isUserOnline(participant._id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800 truncate">
                                      {participant.name}
                                      {isMe && <span className="text-xs text-gray-500 ml-1">(Vous)</span>}
                                    </p>
                                    {isCreator && (
                                      <Crown className="w-4 h-4 text-amber-500" title="Créateur" />
                                    )}
                                    {isAdmin && (
                                      <Shield className="w-4 h-4 text-blue-500" title="Administrateur" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                                </div>

                                {/* ACTIONS ADMIN - AJOUTEZ CE BLOC ICI */}
                                {isUserAdmin() && !isMe && !isCreator && (
                                  <div className="flex gap-1">
                                    {/* Promouvoir/Rétrograder admin */}
                                    {isUserCreator() && (
                                      isAdmin ? (
                                        <button
                                          onClick={() => handleRemoveAdmin(participant._id)}
                                          className="p-1.5 hover:bg-orange-100 rounded-lg transition-all group"
                                          title="Rétrograder"
                                        >
                                          <Shield className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handlePromoteToAdmin(participant._id)}
                                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-all group"
                                          title="Promouvoir admin"
                                        >
                                          <UserPlus className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                                        </button>
                                      )
                                    )}

                                    {/* Retirer du groupe */}
                                    <button
                                      onClick={() => handleRemoveParticipant(participant._id)}
                                      className="p-1.5 hover:bg-red-100 rounded-lg transition-all group"
                                      title="Retirer du groupe"
                                    >
                                      <UserMinus className="w-4 h-4 text-red-500 group-hover:text-red-600" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* SECTION MODIFICATION NOM/IMAGE DU GROUPE */}
                        {isUserAdmin() && (
                          <div className="space-y-2 pt-3 border-t border-gray-200">
                            {/* Modifier le nom */}
                            <div className="space-y-2">
                              {editingGroupName ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Nouveau nom"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleUpdateGroupName}
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingGroupName(false);
                                      setNewGroupName('');
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingGroupName(true);
                                    setNewGroupName(conversation.groupName || '');
                                  }}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all group"
                                >
                                  <Edit className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                                  <span className="font-medium text-blue-700">Modifier le nom du groupe</span>
                                </button>
                              )}
                            </div>

                            {/* Modifier l'image */}
                            <button
                              onClick={() => groupImageInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all group disabled:opacity-50"
                            >
                              {uploadingImage ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="font-medium text-purple-700">Envoi...</span>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
                                  <span className="font-medium text-purple-700">Modifier l'image du groupe</span>
                                </>
                              )}
                            </button>
                            <input
                              ref={groupImageInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleUpdateGroupImage}
                            />
                          </div>
                        )}

                        {/* BOUTON QUITTER LE GROUPE */}
                        <button
                          onClick={async () => {
                            if (!confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;
                            
                            try {
                              await api.delete(`/groups/${conversation._id}/leave`);
                              alert('✅ Vous avez quitté le groupe');
                              setShowMenu(false);
                              router.push('/');
                            } catch (error) {
                              console.error('❌ Erreur:', error);
                              alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-all group"
                        >
                          <UserMinus className="w-5 h-5 text-red-600 group-hover:text-red-700" />
                          <span className="font-medium text-red-700">Quitter le groupe</span>
                        </button>
                      </div>
                    )}

                    {/* ✨ ACTION 1 : Multimédia */}
                    <button 
                      onClick={openMediaPanel} 
                      className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-100/50 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                        <Image className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800">Multimédia</div>
                        <div className="text-xs text-gray-500 mt-0.5">Photos, fichiers et liens</div>
                      </div>
                      {/* Indicateur visuel */}
                      <div className="text-purple-400 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </button>

                    {/* ✨ ACTION 2 : Rechercher dans la conversation */}
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        if (onSearchOpen) {
                          onSearchOpen();
                        }
                      }}
                      className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100/50 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800">Rechercher</div>
                        <div className="text-xs text-gray-500 mt-0.5">Trouver un message</div>
                      </div>
                      <div className="text-blue-400 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </button>

                    {/* ✨ ACTION 3 : Notifications */}
                    <button 
                      onClick={toggleMute} 
                      className={`group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98] ${
                        settings.muted 
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-100/50' 
                          : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-100/50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ${
                        settings.muted 
                          ? 'bg-gradient-to-br from-orange-500 to-amber-500' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800">
                          {settings.muted ? 'Réactiver les notifications' : 'Désactiver les notifications'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {settings.muted ? 'Recevoir les alertes' : 'Mode silencieux'}
                        </div>
                      </div>
                      {/* Badge de statut */}
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        settings.muted 
                          ? 'bg-orange-200 text-orange-700' 
                          : 'bg-blue-200 text-blue-700'
                      }`}>
                        {settings.muted ? 'OFF' : 'ON'}
                      </div>
                    </button>

                    {/* ✨ ACTION 4 : Bloquer/Débloquer (uniquement pour conversations individuelles) */}
                    {!isGroup && (
                      <button
                        onClick={toggleBlock}
                        disabled={blockLoading}
                        className={`group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98] ${
                          blockLoading 
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' 
                            : blockStatus?.iBlocked 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-100/50' 
                              : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-100/50'
                        }`}
                      >
                        <div className={`p-3 rounded-xl shadow-md transition-all duration-300 ${
                          blockLoading 
                            ? 'bg-gray-300' 
                            : blockStatus?.iBlocked 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500 group-hover:shadow-lg group-hover:scale-110' 
                              : 'bg-gradient-to-br from-red-500 to-rose-500 group-hover:shadow-lg group-hover:scale-110'
                        }`}>
                          {blockLoading ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : blockStatus?.iBlocked ? (
                            <Unlock className="w-5 h-5 text-white" />
                          ) : (
                            <Shield className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-800">
                            {blockLoading 
                              ? 'Chargement...' 
                              : blockStatus?.iBlocked 
                                ? 'Débloquer le contact' 
                                : 'Bloquer le contact'
                            }
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {blockLoading 
                              ? 'Vérification...' 
                              : blockStatus?.iBlocked 
                                ? 'Autoriser les messages' 
                                : 'Empêcher tout contact'
                            }
                          </div>
                        </div>
                        {/* Badge de statut */}
                        {!blockLoading && (
                          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            blockStatus?.iBlocked 
                              ? 'bg-green-200 text-green-700' 
                              : 'bg-red-200 text-red-700'
                          }`}>
                            {blockStatus?.iBlocked ? 'BLOQUÉ' : 'ACTIF'}
                          </div>
                        )}
                      </button>
                    )}

                    {/* ✨ ACTION 5 : Supprimer la conversation */}
                    <button 
                      onClick={handleDeleteConversation} 
                      className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border border-red-100/50 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                    >
                      <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-red-700">Supprimer la discussion</div>
                        <div className="text-xs text-gray-500 mt-0.5">Uniquement pour vous</div>
                      </div>
                      {/* Icône d'avertissement */}
                      <AlertCircle className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal pour l'image en plein écran */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {/* Ajout du bouton de téléchargement */}
            <button
              onClick={() => downloadImage(selectedImage)}
              className="absolute top-4 right-16 text-white p-2 hover:bg-white/20 rounded-full z-10"
              title="Télécharger"
            >
              <Download className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm">{selectedImage.name}</p>
              <p className="text-xs text-gray-300">{formatFileSize(selectedImage.size)}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Panel de médias */}
      {showMediaPanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-full md:w-96 bg-white h-full shadow-2xl flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">Médias, fichiers et liens</h2>
                <button 
                  onClick={() => setShowMediaPanel(false)} 
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Onglets en bleu */}
            <div className="flex border-b bg-gradient-to-r from-gray-50 to-white overflow-x-auto scrollbar-hide">
              {[
                { id: 'images', label: 'Images', icon: Image },
                { id: 'files', label: 'Fichiers', icon: FileText },
                { id: 'audio', label: 'Audio', icon: Music },
                { id: 'videos', label: 'Vidéos', icon: Play },
                { id: 'links', label: 'Liens', icon: Link }
              ].map((tab) => {
                const count = mediaData?.[tab.id]?.length || 0;
                const isActive = mediaType === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => loadMedia(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-4 font-semibold whitespace-nowrap transition-all duration-300 group ${
                      isActive 
                        ? 'text-blue-600' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}>
                      <tab.icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                    </div>
                    
                    <span className="text-sm sm:text-base">{tab.label}</span>
                    
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                      }`}>
                        {count}
                      </span>
                    )}
                    
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-500 font-medium">Chargement...</p>
                </div>
              ) : (
                <div className="p-6">
                  
                  {/* IMAGES */}
                  {mediaType === 'images' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {mediaData?.images?.length > 0 ? (
                        mediaData.images.map((img, index) => (
                          <div 
                            key={img.id} 
                            className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                          >
                            <img 
                              src={img.url} 
                              alt="" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onClick={() => openImage(img)}
                            />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <p className="text-white text-sm font-medium truncate mb-1">
                                  {img.name || 'Image'}
                                </p>
                                <p className="text-white/70 text-xs">
                                  {formatFileSize(img.size)}
                                </p>
                              </div>
                              
                              <div className="absolute top-3 right-3 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openImage(img);
                                  }}
                                  className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
                                >
                                  <Expand className="w-4 h-4 text-white" />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(img);
                                  }}
                                  className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-full transition-all shadow-lg hover:scale-110 active:scale-95"
                                >
                                  <Download className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-20">
                          <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl mb-4">
                            <Image className="w-16 h-16 text-blue-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">Aucune image</p>
                          <p className="text-gray-400 text-sm">Les images partagées apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FICHIERS */}
                  {mediaType === 'files' && (
                    <div className="space-y-3">
                      {mediaData?.files?.length > 0 ? (
                        mediaData.files.map((file, index) => (
                          <div 
                            key={file.id} 
                            className="group flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300"
                          >
                            <div className="relative">
                              <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                                <FileText className="w-7 h-7 text-white" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-md shadow">
                                {file.type?.toUpperCase() || 'FILE'}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500">
                                  {formatFileSize(file.size)}
                                </span>
                                {file.createdAt && (
                                  <>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="text-sm text-gray-400">
                                      {formatMessageDate(file.createdAt)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => downloadFile(file)}
                              className="p-3 hover:bg-blue-50 rounded-xl transition-all group/btn active:scale-95"
                            >
                              <Download className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 transition-colors" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl mb-4">
                            <FileText className="w-16 h-16 text-blue-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">Aucun fichier</p>
                          <p className="text-gray-400 text-sm">Les documents partagés apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AUDIO */}
                  {mediaType === 'audio' && (
                    <div className="space-y-3">
                      {mediaData?.audio?.length > 0 ? (
                        mediaData.audio.map((audio, index) => (
                          <div 
                            key={audio.id} 
                            className="group flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300"
                          >
                            <div className="relative">
                              <div className={`p-4 rounded-xl shadow-md transition-all ${
                                playingAudio === audio.id 
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse' 
                                  : 'bg-gradient-to-br from-blue-400 to-cyan-400 group-hover:scale-110'
                              }`}>
                                <Music className="w-7 h-7 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {audio.name || `Audio ${audio.duration}s`}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500">
                                  {formatFileSize(audio.size)}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-sm text-blue-600 font-medium">
                                  {Math.floor(audio.duration / 60)}:{(audio.duration % 60).toString().padStart(2, '0')}
                                </span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => playAudio(audio)}
                              className={`p-3.5 rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                                playingAudio === audio.id 
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' 
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              }`}
                            >
                              {playingAudio === audio.id ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl mb-4">
                            <Music className="w-16 h-16 text-blue-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">Aucun audio</p>
                          <p className="text-gray-400 text-sm">Les fichiers audio partagés apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VIDÉOS */}
                  {mediaType === 'videos' && (
                    <div className="space-y-3">
                      {mediaData?.videos?.length > 0 ? (
                        mediaData.videos.map((video, index) => (
                          <div 
                            key={video.id} 
                            className="group flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300"
                          >
                            <div className="relative shrink-0">
                              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20"></div>
                                <Play className="w-10 h-10 text-blue-500 relative z-10" />
                              </div>
                              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-bold rounded-md backdrop-blur-sm">
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {video.name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500">
                                  {formatFileSize(video.size)}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-sm text-blue-600 font-medium">
                                  {Math.floor(video.duration / 60)}min {video.duration % 60}s
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => window.open(video.url, '_blank')}
                                className="p-3 hover:bg-blue-50 rounded-xl transition-all group/btn active:scale-95"
                              >
                                <Play className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 transition-colors" />
                              </button>
                              <button 
                                onClick={() => downloadFile(video)}
                                className="p-3 hover:bg-blue-50 rounded-xl transition-all group/btn active:scale-95"
                              >
                                <Download className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 transition-colors" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl mb-4">
                            <Play className="w-16 h-16 text-blue-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">Aucune vidéo</p>
                          <p className="text-gray-400 text-sm">Les vidéos partagées apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LIENS */}
                  {mediaType === 'links' && (
                    <div className="space-y-3">
                      {mediaData?.links?.length > 0 ? (
                        mediaData.links.map((link, index) => (
                          <div 
                            key={link.id} 
                            className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md shrink-0">
                                <Link className="w-6 h-6 text-white" />
                              </div>
                              
                              <div className="flex-1 min-w-0 space-y-2">
                                {link.links.map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group/link flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                                  >
                                    <span className="truncate font-medium">{url}</span>
                                    <svg className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                ))}
                                
                                <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t">
                                  <span>Par {link.sender?.name}</span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                  <span>{formatMessageDate(link.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <div className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl mb-4">
                            <Link className="w-16 h-16 text-blue-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg mb-2">Aucun lien</p>
                            <p className="text-gray-400 text-sm">Les liens partagés apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal d'ajout de membres */}
      {showAddMembersModal && conversation?.isGroup && (
        <AddMembersModal
          groupId={conversation._id}
          existingMembers={conversation.participants || []}
          onClose={() => setShowAddMembersModal(false)}
          onSuccess={reloadGroup}
        />
      )}
    </>
  );
}