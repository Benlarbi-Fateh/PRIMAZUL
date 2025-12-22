"use client";

import { useState, useEffect, useRef, useContext } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, X, Image as ImageIcon, FileText, Music, Download, 
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
import { AuthContext } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { onOnlineUsersUpdate, requestOnlineUsers } from '@/services/socket';
import { formatMessageDate } from '@/utils/dateFormatter';
import Image from 'next/image';
import MessageSearch from '@/components/Chat/MessageSearch';
import AddMembersModal from '@/components/Group/AddMembersModal';

export default function MobileHeader({ contact, conversation, onBack, onVideoCall, onAudioCall }) {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [mediaType, setMediaType] = useState('images');
  const [mediaData, setMediaData] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [settings, setSettings] = useState({ muted: false });
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  const audioRef = useRef(null);
  const menuRef = useRef(null);
  const groupImageInputRef = useRef(null);

  const { 
    isBlocked, 
    blockStatus, 
    loading: blockLoading,
    error: blockError,
    refresh: refreshBlockStatus 
  } = useBlockCheck(contact?._id);

  // Charger le statut mute
  useEffect(() => {
    if (!conversation?._id) return;
    
    const loadMutedStatus = async () => {
      try {
        const response = await api.get(`/message-settings/conversations/${conversation._id}/settings`);
        const data = response.data;
        if (data.success) {
          setSettings({ muted: data.settings.isMuted });
        }
      } catch (err) {
        console.error('Erreur chargement settings:', err);
      }
    };
    
    loadMutedStatus();
  }, [conversation?._id]);

  // Gestion des utilisateurs en ligne
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onOnlineUsersUpdate((userIds) => {
      setOnlineUsers(new Set(userIds));
    });
    requestOnlineUsers();
    return () => unsubscribe();
  }, [user]);

  // Fermer le menu si clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Nettoyer l'audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Écouter les changements de statut de blocage
  useEffect(() => {
    const handleBlockStatusChange = () => {
      console.log('🔄 Statut blocage changé');
    };

    window.addEventListener('block-status-changed', handleBlockStatusChange);
    return () => {
      window.removeEventListener('block-status-changed', handleBlockStatusChange);
    };
  }, []);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = async (file) => {
    try {
      console.log('📥 Téléchargement:', file);
      
      if (file.url) {
        if (file.url.startsWith('http')) {
          window.open(file.url, '_blank');
        } else {
          const response = await fetch(file.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = file.name || 'download';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      if (file.url) {
        window.open(file.url, '_blank');
      }
    }
  };

  const downloadImage = async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = image.name || `image-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement image:', error);
      window.open(image.url, '_blank');
    }
  };

  const openImage = (image) => {
    setSelectedImage(image);
  };

  const playAudio = async (audio) => {
    try {
      if (playingAudio === audio.id) {
        if (audioRef.current) {
          audioRef.current.pause();
          setPlayingAudio(null);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audioElement = new Audio(audio.url);
        audioRef.current = audioElement;

        audioElement.addEventListener('ended', () => {
          setPlayingAudio(null);
        });

        audioElement.addEventListener('error', () => {
          console.error('Erreur lecture audio');
          setPlayingAudio(null);
        });

        await audioElement.play();
        setPlayingAudio(audio.id);
      }
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      alert('Impossible de lire l\'audio');
    }
  };

  const loadMedia = async (type) => {
    setLoadingMedia(true);
    setMediaType(type);
    try {
      console.log(`📥 Chargement des médias de type: ${type} pour conversation:`, conversation._id);
      
      const response = await api.get(`/message-settings/conversations/${conversation._id}/media?type=${type}`);
      const data = response.data;
      
      console.log(`✅ Données reçues pour ${type}:`, data);
      
      if (data && data.success) {
        setMediaData({
          images: data.images || [],
          files: data.files || [],
          audio: data.audio || [],
          videos: data.videos || [],
          links: data.links || []
        });
      } else {
        setMediaData({
          images: [],
          files: [],
          audio: [],
          videos: [],
          links: []
        });
      }
    } catch (err) {
      console.error('❌ Erreur chargement média:', err);
      setMediaData({
        images: [],
        files: [],
        audio: [],
        videos: [],
        links: []
      });
    }
    setLoadingMedia(false);
  };

  const toggleMute = async () => {
    if (!conversation?._id) {
      alert('❌ Conversation non définie');
      return;
    }

    try {
      const endpoint = settings.muted 
        ? `/message-settings/conversations/${conversation._id}/unmute`
        : `/message-settings/conversations/${conversation._id}/mute`;
      
      const response = await api.post(endpoint);
      const data = response.data;
      
      if (data.success) {
        setSettings(prev => ({ ...prev, muted: !prev.muted }));
        
        const msg = settings.muted 
          ? '✅ Notifications réactivées' 
          : '🔕 Notifications désactivées';
        
        alert(msg);
      }
    } catch (err) {
      console.error('❌ Erreur toggle mute:', err);
      alert('Erreur lors de la modification des notifications');
    }
  };

  const toggleBlock = async () => {
    if (!contact?._id) {
      alert('❌ Contact non défini');
      return;
    }

    const action = blockStatus?.iBlocked ? 'débloquer' : 'bloquer';
    
    const confirmMsg = blockStatus?.iBlocked 
      ? `Êtes-vous sûr de vouloir débloquer ${contact.name} ?

💡 Après le déblocage :
- Il ne sera PAS automatiquement rajouté à vos contacts
- Vous devrez lui renvoyer une invitation
- La conversation réapparaîtra une fois qu'il accepte l'invitation`
      : `Êtes-vous sûr de vouloir bloquer ${contact.name} ?

⚠️ Conséquences :
- ${contact.name} sera RETIRÉ de vos contacts
- Votre conversation sera MASQUÉE (pas supprimée)
- Vous ne recevrez plus ses messages
- Il ne pourra plus vous contacter`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const endpoint = blockStatus?.iBlocked 
        ? '/message-settings/unblock' 
        : '/message-settings/block';
      
      const response = await api.post(endpoint, { targetUserId: contact._id });
      
      if (response.data.success) {
        await refreshBlockStatus();
        window.dispatchEvent(new CustomEvent('block-status-changed'));
        setShowMenu(false);
        
        if (blockStatus?.iBlocked) {
          alert(`✅ ${contact.name} a été débloqué

💡 Prochaines étapes :
1. Allez dans l'onglet "Contacts"
2. Recherchez ${contact.name}
3. Envoyez-lui une invitation
4. Une fois acceptée, la conversation réapparaîtra avec tout l'historique`);
        } else {
          alert(`🚫 ${contact.name} a été bloqué et retiré de vos contacts

✅ Actions effectuées :
- Contact supprimé
- Conversation masquée
- Messages bloqués`);
          
          setTimeout(() => {
            if (onBack) {
              onBack();
            } else {
              router.push('/');
            }
          }, 1000);
        }
        
      } else {
        throw new Error(response.data.message || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('❌ Erreur toggle block:', err);
      
      let errorMessage = `Erreur lors du ${action} : `;
      
      if (err.response?.status === 404) {
        errorMessage += 'Route API non trouvée.';
      } else if (err.response?.status === 401) {
        errorMessage += 'Non autorisé. Reconnectez-vous.';
        setTimeout(() => router.push('/login'), 2000);
      } else if (err.response?.status === 500) {
        errorMessage += 'Erreur serveur.';
      } else {
        errorMessage += err.message || 'Erreur réseau';
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversation?._id) {
      alert('❌ Conversation non définie');
      return;
    }

    const confirmMessage = `Vider cette discussion ?

⚠️ Actions :
- Tous vos messages seront supprimés
- La discussion restera dans votre liste (vierge)
- L'autre personne conservera son historique
- Les nouveaux messages apparaîtront normalement`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🗑️ Vidage conversation:', conversation._id);
      
      const response = await api.delete(`/message-settings/conversations/${conversation._id}/delete`);
      
      console.log('📦 Réponse suppression:', response.data);
      
      if (response.data.success) {
        console.log('✅ Conversation vidée avec succès');
        
        setShowMenu(false);
        
        window.dispatchEvent(new CustomEvent('conversation-cleared', {
          detail: { conversationId: conversation._id }
        }));
        
        alert('✅ Discussion vidée\n\n💡 La discussion reste dans votre liste. Les nouveaux messages apparaîtront normalement.');
        
        window.location.reload();
      } else {
        throw new Error(response.data.message || 'Erreur inconnue');
      }
      
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      alert('❌ Erreur lors du vidage: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fonctions de gestion de groupe
  const handleRemoveParticipant = async (participantId) => {
    if (!confirm('Retirer ce membre du groupe ?')) return;

    try {
      const response = await api.post('/groups/remove-participant', {
        groupId: conversation._id,
        participantId
      });

      if (response.data.success) {
        alert('✅ Membre retiré');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handlePromoteToAdmin = async (participantId) => {
    if (!confirm('Promouvoir ce membre en admin ?')) return;

    try {
      const response = await api.post('/groups/promote-admin', {
        groupId: conversation._id,
        participantId
      });

      if (response.data.success) {
        alert('✅ Membre promu admin');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    if (!confirm('Rétrograder cet admin ?')) return;

    try {
      const response = await api.post('/groups/remove-admin', {
        groupId: conversation._id,
        adminId
      });

      if (response.data.success) {
        alert('✅ Admin rétrogradé');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim()) {
      alert('❌ Le nom ne peut pas être vide');
      return;
    }

    try {
      const response = await api.put('/groups/update-name', {
        groupId: conversation._id,
        groupName: newGroupName.trim()
      });

      if (response.data.success) {
        alert('✅ Nom modifié');
        setEditingGroupName(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateGroupImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ L\'image ne doit pas dépasser 5 MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('groupImage', file);

      const response = await api.put(`/groups/${conversation._id}/update-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('✅ Image modifiée');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const isUserAdmin = () => {
    if (!conversation?.isGroup) return false;
    
    const userId = user?._id?.toString() || 
                   user?.id?.toString() || 
                   JSON.parse(localStorage.getItem('user'))?._id?.toString() ||
                   JSON.parse(localStorage.getItem('user'))?.id?.toString();
    
    if (!userId) {
      console.error('❌ userId introuvable:', user);
      return false;
    }
    
    const isCreator = conversation.groupAdmin?._id?.toString() === userId || 
                     conversation.groupAdmin?.toString() === userId;
    const isAdmin = conversation.groupAdmins?.some(
      a => (a._id?.toString() || a.toString()) === userId
    );
    
    return isCreator || isAdmin;
  };

  const isUserCreator = () => {
    if (!conversation?.isGroup) return false;
    
    const userId = user?._id?.toString() || 
                   user?.id?.toString() || 
                   JSON.parse(localStorage.getItem('user'))?._id?.toString() ||
                   JSON.parse(localStorage.getItem('user'))?.id?.toString();
    
    if (!userId) return false;
    return conversation.groupAdmin?._id?.toString() === userId || 
           conversation.groupAdmin?.toString() === userId;
  };

  const isParticipantAdmin = (participantId) => {
    if (!conversation?.isGroup) return false;
    
    const pId = participantId._id?.toString() || participantId.toString();
    const creatorId = conversation.groupAdmin?._id?.toString() || 
                     conversation.groupAdmin?.toString();
    
    if (pId === creatorId) return true;
    
    return conversation.groupAdmins?.some(
      a => (a._id?.toString() || a.toString()) === pId
    );
  };

  const reloadGroup = async () => {
    try {
      console.log('🔄 Rechargement du groupe:', conversation._id);
      window.location.reload();
    } catch (error) {
      console.error('❌ Erreur rechargement:', error);
      alert('Erreur lors du rechargement du groupe');
    }
  };

  const openMediaPanel = async () => {
    setShowMediaPanel(true);
    setShowMenu(false);
    await loadMedia('images');
  };

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find(p => (p._id || p.id) !== userId);
  };

  const handleProfileClick = () => {
    if (!contact && !conversation) {
      router.push('/profile');
    } else if (conversation?.isGroup) {
      // router.push(`/group/${conversation._id}`);
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

  const onlineDot = isDark ? "bg-cyan-400" : "bg-emerald-300";

  const onlineDotBg = isDark ? "bg-cyan-400" : "bg-emerald-400";

  const groupBadge = isDark
    ? "bg-gradient-to-br from-blue-700 to-blue-800 border-blue-600"
    : "bg-gradient-to-br from-purple-500 to-pink-500 border-blue-700";

  if (!contact && !conversation) {
    return (
      <div
        className={`lg:hidden relative overflow-hidden ${headerBg} shadow-lg`}
      >
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${
            isDark ? "opacity-10" : "opacity-20"
          }`}
        ></div>
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            <div 
              className="relative shrink-0 cursor-pointer group" 
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div
                className={`w-10 h-10 rounded-xl ring-2 ${ringStyle} shadow-lg overflow-hidden`}
              >
                <Image
                  src={
                    user?.profilePicture ||
                    `https://ui-avatars.com/api/?name=User`
                  }
                  alt="User"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  unoptimized={true}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className={`font-bold text-base drop-shadow truncate ${textPrimary}`}
              >
                {user?.name}
              </h2>
              <p
                className={`text-xs font-medium flex items-center gap-2 ${textSecondary}`}
              >
                <span
                  className={`w-2 h-2 ${onlineDot} rounded-full animate-pulse`}
                ></span>{" "}
                En ligne
              </p>
            </div>
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
        conversation?.groupName || 'Groupe'
      )}&background=${isDark ? '6366f1' : '6366f1'}&color=fff&bold=true`
    : contact?.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        contact?.name || 'User'
      )}&background=${isDark ? '0ea5e9' : '3b82f6'}&color=fff&bold=true`;
  const participantsCount = isGroup ? (conversation?.participants?.length || 0) : null;
  const contactIsOnline = !isGroup && contact?._id && isUserOnline(contact._id);

  return (
    <>
      <div className={`lg:hidden relative overflow-hidden ${headerBg} shadow-lg`}>
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MkiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMTAgMCBMIDAgMCAwIDEwIiBmaWxsPSJub25lIiBzdHJva2U9Iidoc2woMjEwLCA4MCUsIDUwJSknIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${isDark ? 'opacity-10' : 'opacity-20'}`}></div>
        
        <div className="relative p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack || (() => router.push('/'))}
              className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0 ${buttonStyle}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div 
              className="relative shrink-0 cursor-pointer group"
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div className={`w-10 h-10 rounded-xl ring-2 ${ringStyle} shadow-lg overflow-hidden transition-all`}>
                <Image
                  src={displayImage}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  onError={(e) => {
                    e.target.src = isGroup
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${isDark ? '6366f1' : '6366f1'}&color=fff&bold=true`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${isDark ? '0ea5e9' : '3b82f6'}&color=fff&bold=true`;
                  }}
                />
              </div>
              {isGroup && (
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${groupBadge} rounded-full border-2 flex items-center justify-center`}>
                  <Users className="w-2 h-2 text-white" />
                </div>
              )}
              {!isGroup && contactIsOnline && (
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${onlineDotBg} rounded-full border-2 ${borderStyle}`}></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-base drop-shadow truncate ${textPrimary}`}>
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isGroup ? (
                  <p className={`text-xs font-medium truncate ${textSecondary}`}>
                    {participantsCount} participant{participantsCount > 1 ? 's' : ''}
                  </p>
                ) : blockLoading ? (
                  <p className={`text-xs truncate ${textMuted} flex items-center gap-1`}>
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></span>
                    Chargement...
                  </p>
                ) : blockStatus?.blockedMe ? (
                  <p className={`text-xs truncate font-medium text-red-200 flex items-center gap-1`}>
                    <Lock className="w-3 h-3" />
                    Vous êtes bloqué
                  </p>
                ) : blockStatus?.iBlocked ? (
                  <p className={`text-xs truncate font-medium text-yellow-200 flex items-center gap-1`}>
                    <Shield className="w-3 h-3" />
                    Bloqué
                  </p>
                ) : contactIsOnline ? (
                  <>
                    <span className={`w-2 h-2 ${onlineDot} rounded-full animate-pulse`}></span>
                    <p className={`text-xs font-medium truncate ${textSecondary}`}>
                      En ligne
                    </p>
                  </>
                ) : (
                  <p className={`text-xs truncate ${textMuted}`}>
                    {contact?.lastSeen ? `Vu ${formatMessageDate(contact.lastSeen)}` : 'Hors ligne'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isGroup && (
              <>
                <button 
                  onClick={onAudioCall} 
                  className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm ${buttonStyle}`}
                  title="Appel audio"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  onClick={onVideoCall} 
                  className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm ${buttonStyle}`}
                  title="Appel vidéo"
                >
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm ${buttonStyle}`}>
                <Info className="w-4 h-4" />
              </button>

              {/* MENU DÉROULANT - Version mobile optimisée */}
              {showMenu && (
                <div className="fixed inset-x-4 top-20 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[80vh] overflow-y-auto">
                  {/* Header du menu */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-6">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0L60 60M60 0L0 60' stroke='%23fff' stroke-width='1' opacity='0.1'/%3E%3C/svg%3E")`
                      }}></div>
                    </div>

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
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
                        
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-white truncate drop-shadow-sm">
                            {displayName}
                          </h2>
                          
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

                      <button 
                        onClick={() => setShowMenu(false)} 
                        className="p-2.5 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-sm active:scale-95"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenu du menu */}
                  <div className="p-5 space-y-3">
                    
                    {/* Section membres du groupe */}
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

                        {/* Liste des membres */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
                                  />
                                  {isUserOnline(participant._id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-800 truncate text-sm">
                                      {participant.name}
                                      {isMe && <span className="text-xs text-gray-500 ml-1">(Vous)</span>}
                                    </p>
                                    {isCreator && (
                                      <Crown className="w-3 h-3 text-amber-500" title="Créateur" />
                                    )}
                                    {isAdmin && (
                                      <Shield className="w-3 h-3 text-blue-500" title="Administrateur" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                                </div>

                                {isUserAdmin() && !isMe && !isCreator && (
                                  <div className="flex gap-1">
                                    {isUserCreator() && (
                                      isAdmin ? (
                                        <button
                                          onClick={() => handleRemoveAdmin(participant._id)}
                                          className="p-1.5 hover:bg-orange-100 rounded-lg transition-all group"
                                          title="Rétrograder"
                                        >
                                          <Shield className="w-3 h-3 text-orange-500 group-hover:text-orange-600" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handlePromoteToAdmin(participant._id)}
                                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-all group"
                                          title="Promouvoir admin"
                                        >
                                          <UserPlus className="w-3 h-3 text-blue-500 group-hover:text-blue-600" />
                                        </button>
                                      )
                                    )}

                                    <button
                                      onClick={() => handleRemoveParticipant(participant._id)}
                                      className="p-1.5 hover:bg-red-100 rounded-lg transition-all group"
                                      title="Retirer du groupe"
                                    >
                                      <UserMinus className="w-3 h-3 text-red-500 group-hover:text-red-600" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Modification nom/image du groupe */}
                        {isUserAdmin() && (
                          <div className="space-y-2 pt-3 border-t border-gray-200">
                            {editingGroupName ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newGroupName}
                                  onChange={(e) => setNewGroupName(e.target.value)}
                                  placeholder="Nouveau nom"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={handleUpdateGroupName}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingGroupName(false);
                                    setNewGroupName('');
                                  }}
                                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                                >
                                  <X className="w-3 h-3" />
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
                                <Edit className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                                <span className="font-medium text-blue-700 text-sm">Modifier le nom</span>
                              </button>
                            )}

                            <button
                              onClick={() => groupImageInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all group disabled:opacity-50"
                            >
                              {uploadingImage ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="font-medium text-purple-700 text-sm">Envoi...</span>
                                </>
                              ) : (
                                <>
                                  <Camera className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                                  <span className="font-medium text-purple-700 text-sm">Modifier l'image</span>
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
                          <UserMinus className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                          <span className="font-medium text-red-700 text-sm">Quitter le groupe</span>
                        </button>
                      </div>
                    )}

                    {/* Actions principales */}
                    <button 
                      onClick={openMediaPanel} 
                      className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-100/50 transition-all"
                    >
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md">
                        <ImageIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800 text-sm">Multimédia</div>
                        <div className="text-xs text-gray-500 mt-0.5">Photos, fichiers et liens</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        if (onSearchOpen) {
                          onSearchOpen();
                        }
                      }}
                      className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100/50 transition-all"
                    >
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800 text-sm">Rechercher</div>
                        <div className="text-xs text-gray-500 mt-0.5">Trouver un message</div>
                      </div>
                    </button>

                    <button 
                      onClick={toggleMute} 
                      className={`group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all ${
                        settings.muted 
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-100/50' 
                          : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-100/50'
                      }`}
                    >
                      <div className={`p-3 rounded-xl shadow-md ${
                        settings.muted 
                          ? 'bg-gradient-to-br from-orange-500 to-amber-500' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-800 text-sm">
                          {settings.muted ? 'Réactiver notifications' : 'Désactiver notifications'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {settings.muted ? 'Recevoir les alertes' : 'Mode silencieux'}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        settings.muted 
                          ? 'bg-orange-200 text-orange-700' 
                          : 'bg-blue-200 text-blue-700'
                      }`}>
                        {settings.muted ? 'OFF' : 'ON'}
                      </div>
                    </button>

                    {!isGroup && (
                      <button
                        onClick={toggleBlock}
                        disabled={blockLoading}
                        className={`group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all ${
                          blockLoading 
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' 
                            : blockStatus?.iBlocked 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-100/50' 
                              : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-100/50'
                        }`}
                      >
                        <div className={`p-3 rounded-xl shadow-md ${
                          blockLoading 
                            ? 'bg-gray-300' 
                            : blockStatus?.iBlocked 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-br from-red-500 to-rose-500'
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
                          <div className="font-semibold text-gray-800 text-sm">
                            {blockLoading 
                              ? 'Chargement...' 
                              : blockStatus?.iBlocked 
                                ? 'Débloquer' 
                                : 'Bloquer'
                            }
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {blockLoading 
                              ? 'Vérification...' 
                              : blockStatus?.iBlocked 
                                ? 'Autoriser messages' 
                                : 'Empêcher contact'
                            }
                          </div>
                        </div>
                      </button>
                    )}

                    <button 
                      onClick={handleDeleteConversation} 
                      className="group flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border border-red-100/50 transition-all"
                    >
                      <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-md">
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-red-700 text-sm">Supprimer</div>
                        <div className="text-xs text-gray-500 mt-0.5">Uniquement pour vous</div>
                      </div>
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </button>
                    
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panel média mobile */}
      {showMediaPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden">
          <div className="absolute inset-0" onClick={() => setShowMediaPanel(false)}></div>
          
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Multimédia</h2>
                    <p className="text-sm text-white/80">Tous vos fichiers partagés</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowMediaPanel(false)} 
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-all text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Images', count: mediaData?.images?.length || 0, icon: ImageIcon },
                  { label: 'Fichiers', count: mediaData?.files?.length || 0, icon: FileText },
                  { label: 'Audio', count: mediaData?.audio?.length || 0, icon: Music },
                  { label: 'Vidéos', count: mediaData?.videos?.length || 0, icon: Play },
                  { label: 'Liens', count: mediaData?.links?.length || 0, icon: Link },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center text-white">
                    <stat.icon className="w-3.5 h-3.5 mx-auto mb-1" />
                    <div className="text-lg font-bold">{stat.count}</div>
                    <div className="text-[9px] font-medium opacity-90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Onglets */}
            <div className="flex border-b bg-gray-50 overflow-x-auto scrollbar-hide">
              {[
                { id: 'images', label: 'Images', icon: ImageIcon },
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
                    className={`relative flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-all ${
                      isActive 
                        ? 'text-blue-600 bg-white' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-200 text-gray-600'
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

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-500">Chargement...</p>
                </div>
              ) : (
                <div>
                  {/* Images */}
                  {mediaType === 'images' && (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaData?.images?.length > 0 ? (
                        mediaData.images.map((img) => (
                          <div 
                            key={img.id} 
                            className="relative aspect-square rounded-xl overflow-hidden shadow"
                            onClick={() => openImage(img)}
                          >
                            <img 
                              src={img.url} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-10">
                          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Aucune image</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fichiers */}
                  {mediaType === 'files' && (
                    <div className="space-y-2">
                      {mediaData?.files?.length > 0 ? (
                        mediaData.files.map((file) => (
                          <div key={file.id} className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                              <button 
                                onClick={() => downloadFile(file)}
                                className="p-2 hover:bg-gray-200 rounded-lg"
                              >
                                <Download className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Aucun fichier</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio */}
                  {mediaType === 'audio' && (
                    <div className="space-y-2">
                      {mediaData?.audio?.length > 0 ? (
                        mediaData.audio.map((audio) => (
                          <div key={audio.id} className="p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <Music className="w-5 h-5 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{audio.name || 'Audio'}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(audio.size)}</p>
                              </div>
                              <button 
                                onClick={() => playAudio(audio)}
                                className={`p-2 rounded-full ${playingAudio === audio.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                              >
                                {playingAudio === audio.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Music className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Aucun audio</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Liens */}
                  {mediaType === 'links' && (
                    <div className="space-y-2">
                      {mediaData?.links?.length > 0 ? (
                        mediaData.links.map((link) => (
                          <div key={link.id} className="p-3 bg-gray-50 rounded-xl">
                            {link.links.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-sm truncate block mb-1"
                              >
                                {url}
                              </a>
                            ))}
                            <p className="text-xs text-gray-500">Par {link.sender?.name}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Link className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Aucun lien</p>
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

      {/* Modal image en plein écran (mobile) */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black z-[60] lg:hidden">
          <div className="relative h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white p-3 bg-black/50 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => downloadImage(selectedImage)}
              className="absolute top-4 left-4 text-white p-3 bg-black/50 rounded-full z-10"
              title="Télécharger"
            >
              <Download className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-sm truncate">{selectedImage.name}</p>
              <p className="text-xs text-gray-300">{formatFileSize(selectedImage.size)}</p>
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