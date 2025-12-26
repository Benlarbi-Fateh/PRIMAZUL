'use client'
import { useState, useEffect, useRef, useContext } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, X, Image, FileText, Download, 
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
  Check ,
  ChevronDown, 
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

// ✅ AJOUT DE onVideoCall ET onAudioCall DANS LES PROPS
export default function ChatHeader({ contact, conversation, onBack, onSearchOpen, onVideoCall, onAudioCall }) {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [mediaType, setMediaType] = useState('images');
  const [mediaData, setMediaData] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [settings, setSettings] = useState({
    muted: false
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const groupImageInputRef = useRef(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(true);

  
  const { 
    isBlocked, 
    blockStatus, 
    loading: blockLoading,
    error: blockError,
    refresh: refreshBlockStatus 
  } = useBlockCheck(contact?._id);

  const formatMessageDateLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'à l\'instant';
    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    return d.toLocaleDateString('fr-FR');
  };

  // Fonction améliorée pour télécharger les fichiers
  const downloadFile = async (file) => {
    try {
      console.log('📥 Téléchargement:', file);
      
      if (file.url) {
        // Pour les URLs externes, ouvrir dans un nouvel onglet
        if (file.url.startsWith('http')) {
          window.open(file.url, '_blank');
        } else {
          // Pour les fichiers locaux, utiliser fetch
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
      // Fallback: ouvrir dans un nouvel onglet
      if (file.url) {
        window.open(file.url, '_blank');
      }
    }
  };

  // Fonction pour télécharger une image
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

      // Fallback: ouvrir dans un nouvel onglet
      window.open(image.url, '_blank');
    }
  };

  // Fonction pour formater la taille des fichiers
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fonction pour ouvrir une image en plein écran
  const openImage = (image) => {
    setSelectedImage(image);
  };


  // Fonction corrigée pour charger les médias
  // 🔁 Charger TOUS les médias d'un coup (images, fichiers, vidéos, liens)
const loadAllMedia = async () => {
  if (!conversation?._id) return;

  setLoadingMedia(true);
  try {
    console.log('📥 Chargement de tous les médias pour la conversation :', conversation._id);

    // 👉 SANS "type" dans l'URL, on récupère tout
    const response = await api.get(
      `/message-settings/conversations/${conversation._id}/media`
    );
    const data = response.data;

    console.log('✅ Données médias reçues :', data);

    if (data && data.success) {
      setMediaData({
        images: data.images || [],
        files: data.files || [],
        videos: data.videos || [],
        links: data.links || [],
      });
    } else {
      setMediaData({
        images: [],
        files: [],
        videos: [],
        links: [],
      });
    }
  } catch (err) {
    console.error('❌ Erreur chargement média:', err);
    setMediaData({
      images: [],
      files: [],
      videos: [],
      links: [],
    });
  } finally {
    setLoadingMedia(false);
  }
};


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

  useEffect(() => {
    if (contact?._id) {
      setOnlineUsers(new Set([contact._id]));
    }
  }, [contact?._id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
    
    // 🔥 MESSAGES DE CONFIRMATION AMÉLIORÉS
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
        // 1️⃣ Rafraîchir le statut de blocage
        await refreshBlockStatus();
        
        // 2️⃣ Émettre l'événement pour rafraîchir la sidebar
        window.dispatchEvent(new CustomEvent('block-status-changed'));
        
        // 3️⃣ Fermer le menu
        setShowMenu(false);
        
        // 4️⃣ Message de succès différent selon l'action
        if (blockStatus?.iBlocked) {
          // DÉBLOCAGE
          alert(`✅ ${contact.name} a été débloqué

💡 Prochaines étapes :
1. Allez dans l'onglet "Contacts"
2. Recherchez ${contact.name}
3. Envoyez-lui une invitation
4. Une fois acceptée, la conversation réapparaîtra avec tout l'historique`);
        } else {
          // BLOCAGE
          alert(`🚫 ${contact.name} a été bloqué et retiré de vos contacts

✅ Actions effectuées :
- Contact supprimé
- Conversation masquée
- Messages bloqués`);
          
          // 5️⃣ Rediriger vers la page d'accueil après blocage
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

    // 🆕 Message adapté
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
        
        // ✅ Fermer le menu
        setShowMenu(false);
        
        // 🔥 NE PAS supprimer de la sidebar, juste rafraîchir pour montrer qu'elle est vide
        window.dispatchEvent(new CustomEvent('conversation-cleared', {
          detail: { conversationId: conversation._id }
        }));
        
        // ✅ Message de succès
        alert('✅ Discussion vidée\n\n💡 La discussion reste dans votre liste. Les nouveaux messages apparaîtront normalement.');
        
        // 🔥 Rediriger vers l'accueil et revenir pour recharger proprement
if (onBack) {
  onBack();
} else {
  router.push('/');
}
      } else {
        throw new Error(response.data.message || 'Erreur inconnue');
      }
      
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      alert('❌ Erreur lors du vidage: ' + (err.response?.data?.message || err.message));
    }
  };

  // ==========================================
  // 🆕 FONCTIONS DE GESTION DE GROUPE
  // ==========================================

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
    
    // ✅ CORRECTION : Récupérer userId de plusieurs sources
    const userId = user?._id?.toString() || 
                   user?.id?.toString() || 
                   JSON.parse(localStorage.getItem('user'))?._id?.toString() ||
                   JSON.parse(localStorage.getItem('user'))?.id?.toString();
    
    if (!userId) {
      console.error('❌ userId introuvable:', user);
      return false;
    }
    
    console.log('🔍 userId trouvé:', userId);
    console.log('🔍 groupAdmin:', conversation.groupAdmin?._id?.toString());
    const isCreator = conversation.groupAdmin?._id?.toString() === userId || 
                     conversation.groupAdmin?.toString() === userId;
    const isAdmin = conversation.groupAdmins?.some(
      a => (a._id?.toString() || a.toString()) === userId
    );
    
    return isCreator || isAdmin;
  };

  const isUserCreator = () => {
    if (!conversation?.isGroup) return false;
    
    // ✅ CORRECTION
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

  // Fonction pour recharger le groupe après ajout de membres
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
  setMediaType('images');     // onglet actif par défaut
  await loadAllMedia();       // on charge TOUT d'un coup
};

  
  // ✅ CORRECTION : Écouter les changements de statut de blocage
  useEffect(() => {
    const handleBlockStatusChange = () => {
      // Recharger les données si nécessaire
      console.log('🔄 Statut blocage changé');
    };

    window.addEventListener('block-status-changed', handleBlockStatusChange);
    
    return () => {
      window.removeEventListener('block-status-changed', handleBlockStatusChange);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadSocketModule = async () => {
      try {
        const socketModule = await import('../../services/socket');
        const { onOnlineUsersUpdate, requestOnlineUsers } = socketModule;
        
        const unsubscribe = onOnlineUsersUpdate((userIds) => {
          setOnlineUsers(new Set(userIds));
        });
        requestOnlineUsers();
        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur chargement socket:', error);
      }
    };
    
    loadSocketModule();
  }, [user]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  // Styles basés sur le thème (comme dans la sidebar)
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
    : "ring-white/50 group-hover:ring-white/80";

  const borderStyle = isDark
    ? "border-blue-600"
    : "border-blue-700";

  const onlineDot = isDark
    ? "bg-cyan-400"
    : "bg-emerald-400";

  const groupBadge = isDark
    ? "bg-gradient-to-br from-blue-700 to-blue-800 border-blue-600"
    : "bg-gradient-to-br from-purple-500 to-pink-500 border-blue-700";

  // Fonction pour obtenir l'autre participant
  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find(p => (p._id || p.id) !== userId);
  };

  // Fonction pour gérer le clic sur la photo
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

  // Fonction pour obtenir le titre de l'info-bulle
  const getProfileTitle = () => {
    if (!contact && !conversation) return "Voir mon profil";
    if (conversation?.isGroup) return "Voir les détails du groupe";
    return "Voir le profil";
  };

  if (!contact && !conversation) {
    return (
      
      <div className={`relative overflow-hidden ${headerBg} shadow-lg`}>
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${isDark ? 'opacity-10' : 'opacity-20'}`}></div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            {/* VOTRE photo de profil */}
            <div 
              className="relative shrink-0 cursor-pointer group" 
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div className={`w-10 h-10 rounded-xl ring-2 ${ringStyle} shadow-lg overflow-hidden transition-all`}>
                <ImageComponent
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=${isDark ? '0ea5e9' : '3b82f6'}&color=fff&bold=true`}
                  alt={user?.name || 'Utilisateur'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=fff&color=3b82f6&bold=true&size=128`;
                  }}
                />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${onlineDot} rounded-full border-2 ${borderStyle}`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-base drop-shadow truncate ${textPrimary}`}>
                {user?.name}
              </h2>
              <p className={`text-xs font-medium flex items-center gap-2 ${textSecondary}`}>
                <span className={`w-2 h-2 ${onlineDot} rounded-full animate-pulse`}></span>
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
    ? (conversation?.groupName || 'Groupe sans nom')
    : (contact?.name || 'Utilisateur');
  
  const displayImage = isGroup
    ? (conversation?.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation?.groupName || 'Groupe')}&background=${isDark ? '6366f1' : '6366f1'}&color=fff&bold=true`)
    : (contact?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=${isDark ? '0ea5e9' : '3b82f6'}&color=fff&bold=true`);

  const participantsCount = isGroup ? (conversation?.participants?.length || 0) : null;
  const contactIsOnline = !isGroup && contact?._id && isUserOnline(contact._id);
  
  return (
    <>
      <div className={`relative overflow-hidden ${headerBg} shadow-lg`}>
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${isDark ? 'opacity-10' : 'opacity-20'}`}></div>
        
        <div className="relative p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack || (() => router.push('/'))}
              className={`p-2 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0 ${buttonStyle}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Photo du CONTACT ou GROUPE */}
            <div 
              className="relative shrink-0 cursor-pointer group"
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div className={`w-10 h-10 rounded-xl ring-2 ${ringStyle} shadow-lg overflow-hidden transition-all`}>
                <ImageComponent
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
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${onlineDot} rounded-full border-2 ${borderStyle}`}></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-base drop-shadow truncate ${textPrimary}`}>
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isGroup ? (
                  <p className={`text-xs truncate font-medium ${textSecondary}`}>
                    {participantsCount} participant{participantsCount > 1 ? 's' : ''}
                  </p>
                ) : blockLoading ? (
                  <p className={`text-xs truncate ${textMuted} flex items-center gap-1`}>
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></span>
                    Chargement...
                  </p>
                ) : blockStatus?.blockedMe ? ( // ✅ CORRIGÉ
                  <p className={`text-xs truncate font-medium text-red-200 flex items-center gap-1`}>
                    <Lock className="w-3 h-3" />
                    Vous êtes bloqué
                  </p>
                ) : blockStatus?.iBlocked ? ( // ✅ CORRIGÉ
                  <p className={`text-xs truncate font-medium text-yellow-200 flex items-center gap-1`}>
                    <Shield className="w-3 h-3" />
                    Bloqué
                  </p>
                ) : contactIsOnline ? (
                  <>
                    <span className={`w-2 h-2 ${onlineDot} rounded-full animate-pulse`}></span>
                    <p className={`text-xs truncate font-medium ${textSecondary}`}>
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
            {/* ✅ BOUTONS D'APPEL AVEC onClick */}
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

            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-xl transition-all ${buttonStyle}`}>
                <Info className="w-4 h-4" />
              </button>
              {showMenu && (
  <div
    className={`
      fixed right-4 top-20 w-96 rounded-3xl shadow-2xl z-50 overflow-hidden border
      ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-100 text-gray-900'}
    `}
  >
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
{/* 🆕 SECTION MEMBRES DU GROUPE - repliable */}
{isGroup && (
  <div
    className={`
      space-y-3 pb-3 mb-3 border-b
      ${isDark ? 'border-slate-700' : 'border-gray-200'}
    `}
  >
    {/* En-tête cliquable "Membres du groupe" */}
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setShowGroupMembers((prev) => !prev)}
        className="flex items-center gap-2 flex-1 text-left group"
      >
        <Users className="w-5 h-5 text-blue-600" />
        <span
          className={`font-bold ${
            isDark ? 'text-slate-100' : 'text-gray-800'
          }`}
        >
          Membres du groupe
        </span>
        <ChevronDown
          className={`
            w-4 h-4 text-blue-600 ml-auto transition-transform duration-200
            ${showGroupMembers ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </button>

      {isUserAdmin() && (
        <button
          onClick={() => {
            console.log('🎯 Clic bouton ajout');
            setShowMenu(false);
            setShowAddMembersModal(true);
          }}
          className={`
            ml-2 p-2 rounded-lg transition-all group
            ${isDark ? 'hover:bg-slate-800' : 'hover:bg-blue-50'}
          `}
          title="Ajouter des membres"
        >
          <UserPlus className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
        </button>
      )}
    </div>

    {/* LISTE DES MEMBRES (repliable) */}
    {showGroupMembers && (
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {conversation.participants?.map((participant) => {
          const isCreator =
            conversation.groupAdmin?._id?.toString() === participant._id?.toString() ||
            conversation.groupAdmin?.toString() === participant._id?.toString();
          const isAdmin = !isCreator && isParticipantAdmin(participant._id);
          const isMe = participant._id?.toString() === user?._id?.toString();

          return (
            <div
              key={participant._id}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${isDark
                  ? 'bg-slate-800 hover:bg-slate-700'
                  : 'bg-gray-50 hover:bg-gray-100'}
              `}
            >
              <div className="relative">
                <img
                  src={
                    participant.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      participant.name || 'User'
                    )}&background=0ea5e9&color=fff`
                  }
                  alt={participant.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-200"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      participant.name || 'User'
                    )}&background=0ea5e9&color=fff`;
                  }}
                />
                {isUserOnline(participant._id) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={`
                      font-semibold truncate
                      ${isDark ? 'text-slate-100' : 'text-gray-800'}
                    `}
                  >
                    {participant.name}
                    {isMe && (
                      <span className="text-xs text-gray-500 ml-1">
                        (Vous)
                      </span>
                    )}
                  </p>
                  {isCreator && (
                    <Crown
                      className="w-4 h-4 text-amber-500"
                      title="Créateur"
                    />
                  )}
                  {isAdmin && (
                    <Shield
                      className="w-4 h-4 text-blue-500"
                      title="Administrateur"
                    />
                  )}
                </div>
                <p
                  className={`
                    text-xs truncate
                    ${isDark ? 'text-slate-400' : 'text-gray-500'}
                  `}
                >
                  {participant.email}
                </p>
              </div>

              {/* ACTIONS ADMIN (inchangées) */}
              {isUserAdmin() && !isMe && !isCreator && (
                <div className="flex gap-1">
                  {/* Promouvoir/Rétrograder admin */}
                  {isUserCreator() &&
                    (isAdmin ? (
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
                    ))}

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
    )}

    {/* SECTION MODIFICATION NOM/IMAGE DU GROUPE (design très légèrement ajusté pour dark) */}
    {isUserAdmin() && (
      <div
        className={`
          space-y-2 pt-3 border-t
          ${isDark ? 'border-slate-700' : 'border-gray-200'}
        `}
      >
        {/* Modifier le nom */}
        <div className="space-y-2">
          {editingGroupName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nouveau nom"
                className={`
                  flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500
                  ${isDark
                    ? 'bg-slate-800 border-slate-600 text-slate-100'
                    : 'bg-white border-gray-300 text-gray-900'}
                `}
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
                className={`
                  px-3 py-2 rounded-lg transition-all
                  ${isDark
                    ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
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
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all group
                ${isDark
                  ? 'bg-slate-800 hover:bg-slate-700'
                  : 'bg-blue-50 hover:bg-blue-100'}
              `}
            >
              <Edit className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
              <span
                className={`
                  font-medium
                  ${isDark ? 'text-slate-100' : 'text-blue-700'}
                `}
              >
                Modifier le nom du groupe
              </span>
            </button>
          )}
        </div>

        {/* Modifier l'image */}
        <button
          onClick={() => groupImageInputRef.current?.click()}
          disabled={uploadingImage}
          className={`
            w-full flex items-center gap-3 p-3 rounded-xl transition-all group disabled:opacity-50
            ${isDark
              ? 'bg-slate-800 hover:bg-slate-700'
              : 'bg-purple-50 hover:bg-purple-100'}
          `}
        >
          {uploadingImage ? (
            <>
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span
                className={`
                  font-medium
                  ${isDark ? 'text-slate-100' : 'text-purple-700'}
                `}
              >
                Envoi...
              </span>
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
              <span
                className={`
                  font-medium
                  ${isDark ? 'text-slate-100' : 'text-purple-700'}
                `}
              >
                Modifier l'image du groupe
              </span>
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
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl transition-all group
        ${isDark
          ? 'bg-red-900/40 hover:bg-red-900/60'
          : 'bg-red-50 hover:bg-red-100'}
      `}
    >
      <UserMinus className="w-5 h-5 text-red-600 group-hover:text-red-700" />
      <span
        className={`
          font-medium
          ${isDark ? 'text-red-200' : 'text-red-700'}
        `}
      >
        Quitter le groupe
      </span>
    </button>
  </div>
)}

      {/* ✨ ACTION 1 : Multimédia */}
<button
  onClick={openMediaPanel}
  className={`
    group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98]
    ${
      isDark
        ? 'bg-slate-800/70 hover:bg-slate-700 border-slate-700'
        : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-100/50'
    }
  `}
>
  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
    <Image className="w-5 h-5 text-white" />
  </div>
  <div className="flex-1 text-left">
    <div
      className={`font-semibold ${
        isDark ? 'text-slate-100' : 'text-gray-800'
      }`}
    >
      Multimédia
    </div>
    <div
      className={`text-xs mt-0.5 ${
        isDark ? 'text-slate-400' : 'text-gray-500'
      }`}
    >
      Photos, fichiers et liens
    </div>
  </div>
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
  className={`
    group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98]
    ${
      isDark
        ? 'bg-slate-800/70 hover:bg-slate-700 border-slate-700'
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-100/50'
    }
  `}
>
  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
    <Search className="w-5 h-5 text-white" />
  </div>
  <div className="flex-1 text-left">
    <div
      className={`font-semibold ${
        isDark ? 'text-slate-100' : 'text-gray-800'
      }`}
    >
      Rechercher
    </div>
    <div
      className={`text-xs mt-0.5 ${
        isDark ? 'text-slate-400' : 'text-gray-500'
      }`}
    >
      Trouver un message
    </div>
  </div>
  <div className="text-blue-400 group-hover:translate-x-1 transition-transform">
    →
  </div>
</button>

      {/* ✨ ACTION 2 : Notifications */}
<button
  onClick={toggleMute}
  className={`
    group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98]
    ${
      settings.muted
        ? isDark
          ? 'bg-slate-800/70 hover:bg-slate-700 border-slate-700'
          : 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-100/50'
        : isDark
        ? 'bg-slate-800/70 hover:bg-slate-700 border-slate-700'
        : 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-100/50'
    }
  `}
>
  <div
    className={`
      p-3 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300
      ${
        settings.muted
          ? 'bg-gradient-to-br from-orange-500 to-amber-500'
          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
      }
    `}
  >
    <Phone className="w-5 h-5 text-white" />
  </div>
  <div className="flex-1 text-left">
    <div
      className={`font-semibold ${
        isDark ? 'text-slate-100' : 'text-gray-800'
      }`}
    >
      {settings.muted
        ? 'Réactiver les notifications'
        : 'Désactiver les notifications'}
    </div>
    <div
      className={`text-xs mt-0.5 ${
        isDark ? 'text-slate-400' : 'text-gray-500'
      }`}
    >
      {settings.muted ? 'Recevoir les alertes' : 'Mode silencieux'}
    </div>
  </div>
  <div
    className={`
      px-2 py-1 rounded-lg text-xs font-medium
      ${
        settings.muted
          ? isDark
            ? 'bg-orange-900 text-orange-200'
            : 'bg-orange-200 text-orange-700'
          : isDark
          ? 'bg-blue-900 text-blue-200'
          : 'bg-blue-200 text-blue-700'
      }
    `}
  >
    {settings.muted ? 'OFF' : 'ON'}
  </div>
</button>

      {/* ✨ ACTION 3 : Bloquer/Débloquer (uniquement pour conversations individuelles) */}
{!isGroup && (
  <button
    onClick={toggleBlock}
    disabled={blockLoading}
    className={`
      group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98]
      ${
        blockLoading
          ? isDark
            ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700'
            : 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
          : blockStatus?.iBlocked
          ? isDark
            ? 'bg-emerald-900/40 hover:bg-emerald-900/60 border-emerald-900/60'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-100/50'
          : isDark
          ? 'bg-red-900/40 hover:bg-red-900/60 border-red-900/60'
          : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-100/50'
      }
    `}
  >
    <div
      className={`
        p-3 rounded-xl shadow-md transition-all duration-300
        ${
          blockLoading
            ? isDark
              ? 'bg-slate-600'
              : 'bg-gray-300'
            : blockStatus?.iBlocked
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 group-hover:shadow-lg group-hover:scale-110'
            : 'bg-gradient-to-br from-red-500 to-rose-500 group-hover:shadow-lg group-hover:scale-110'
        }
      `}
    >
      {blockLoading ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      ) : blockStatus?.iBlocked ? (
        <Unlock className="w-5 h-5 text-white" />
      ) : (
        <Shield className="w-5 h-5 text-white" />
      )}
    </div>
    <div className="flex-1 text-left">
      <div
        className={`font-semibold ${
          isDark ? 'text-slate-100' : 'text-gray-800'
        }`}
      >
        {blockLoading
          ? 'Chargement...'
          : blockStatus?.iBlocked
          ? 'Débloquer le contact'
          : 'Bloquer le contact'}
      </div>
      <div
        className={`text-xs mt-0.5 ${
          isDark ? 'text-slate-400' : 'text-gray-500'
        }`}
      >
        {blockLoading
          ? 'Vérification...'
          : blockStatus?.iBlocked
          ? 'Autoriser les messages'
          : 'Empêcher tout contact'}
      </div>
    </div>
    {!blockLoading && (
      <div
        className={`
          px-2 py-1 rounded-lg text-xs font-medium
          ${
            blockStatus?.iBlocked
              ? isDark
                ? 'bg-emerald-900 text-emerald-200'
                : 'bg-green-200 text-green-700'
              : isDark
              ? 'bg-red-900 text-red-200'
              : 'bg-red-200 text-red-700'
          }
        `}
      >
        {blockStatus?.iBlocked ? 'BLOQUÉ' : 'ACTIF'}
      </div>
    )}
  </button>
)}

      {/* ✨ ACTION 4 : Supprimer la conversation */}
<button
  onClick={handleDeleteConversation}
  className={`
    group flex items-center gap-4 w-full p-4 rounded-2xl border transition-all duration-300 hover:shadow-md active:scale-[0.98]
    ${
      isDark
        ? 'bg-red-900/30 hover:bg-red-900/50 border-red-900/60'
        : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-100/50'
    }
  `}
>
  <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
    <Trash2 className="w-5 h-5 text-white" />
  </div>
  <div className="flex-1 text-left">
    <div
      className={`font-semibold ${
        isDark ? 'text-red-200' : 'text-red-700'
      }`}
    >
      Supprimer la discussion
    </div>
    <div
      className={`text-xs mt-0.5 ${
        isDark ? 'text-slate-400' : 'text-gray-500'
      }`}
    >
      Uniquement pour vous
    </div>
  </div>
  <AlertCircle
    className={`
      w-5 h-5
      ${
        isDark
          ? 'text-red-300 group-hover:text-red-200'
          : 'text-red-400 group-hover:text-red-500'
      }
    `}
  />
</button>
      
    </div>
  </div>
)}
            </div>
          </div>
        </div>
      </div>
      
      {openPanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-80 bg-white h-full shadow-2xl flex flex-col">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl">Profil</h2>
                <button onClick={() => setOpenPanel(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center border-b">
              <img src={displayImage} alt={displayName} className="w-28 h-28 rounded-2xl object-cover shadow-xl mb-4" />
              <h3 className="font-bold text-2xl text-gray-900">{displayName}</h3>
              {!isGroup && (
                <p className={`text-sm mt-2 ${contactIsOnline ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {contactIsOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                </p>
              )}
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              <h4 className="font-bold text-gray-900 mb-4">Informations</h4>
              {!isGroup && contact && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{contact.email || 'Non disponible'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

            {showMediaPanel && (
        <div
    className={`fixed inset-0 backdrop-blur-sm z-[70] flex justify-end ${
      isDark ? 'bg-black/80' : 'bg-black/60'
    }`}
  >
          <div
            className={`
              relative w-full h-full md:max-w-3xl md:ml-auto
              flex flex-col shadow-2xl
              ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}
            `}
          >
            {/* HEADER */}
            <div
              className={`
                flex items-center justify-between px-4 py-3
                border-b
                ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`
                    flex items-center justify-center w-9 h-9 rounded-xl
                    ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}
                  `}
                >
                  <Image className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`
                      text-sm font-semibold truncate
                      ${isDark ? 'text-slate-100' : 'text-gray-900'}
                    `}
                  >
                    Multimédia
                  </p>
                  <p
                    className={`
                      text-xs
                      ${isDark ? 'text-slate-400' : 'text-gray-500'}
                    `}
                  >
                    Images, documents, vidéos et liens partagés
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMediaPanel(false)}
                className={`
                  p-2 rounded-full transition-colors
                  ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-gray-100 text-gray-600'}
                `}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ONGLET : 4 onglets, icônes seules en mobile, texte à partir de sm/md */}
            <div
              className={`
                flex gap-2 px-3 py-2 border-b
                ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}
              `}
            >
              {[
                { id: 'images', label: 'Images', icon: Image },
                { id: 'files', label: 'Fichiers', icon: FileText },
                { id: 'videos', label: 'Vidéos', icon: Play },
                { id: 'links', label: 'Liens', icon: Link },
              ].map((tab) => {
                const count = mediaData?.[tab.id]?.length || 0;
                const isActive = mediaType === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setMediaType(tab.id)}
                    className={`
                      relative flex-1 flex flex-col items-center gap-1
                      py-1.5 rounded-xl border text-[11px] sm:text-xs
                      transition-colors
                      ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : isDark
                          ? 'bg-slate-800 text-slate-200 border-slate-700'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }
                    `}
                  >
                    {/* Icône dans un cercle */}
                    <div
                      className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        ${
                          isActive
                            ? 'bg-white/20'
                            : isDark
                            ? 'bg-slate-900/60'
                            : 'bg-white'
                        }
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                    </div>

                    {/* Label : caché sur mobile, visible à partir de sm */}
                    <span className="hidden sm:inline mt-0.5">
                      {tab.label}
                    </span>

                    {/* Compteur en badge */}
                    {count > 0 && (
                      <span
                        className={`
                          absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full
                          text-[10px] font-semibold
                          ${isActive ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}
                        `}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CONTENU */}
            <div
              className={`
                flex-1 overflow-y-auto
                ${isDark ? 'bg-slate-900' : 'bg-gray-50'}
              `}
            >
              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p
                    className={`
                      text-sm font-medium
                      ${isDark ? 'text-slate-300' : 'text-gray-600'}
                    `}
                  >
                    Chargement des fichiers...
                  </p>
                </div>
              ) : (
                <div className="p-3 sm:p-4 md:p-6 space-y-6">
                  {/* IMAGES */}
                  {mediaType === 'images' && (
                    <>
                      {mediaData?.images?.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                          {mediaData.images.map((img) => (
                            <div
                              key={img.id}
                              className={`
                                group relative aspect-square rounded-xl overflow-hidden
                                ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}
                                cursor-pointer
                              `}
                              onClick={() => openImage(img)}
                            >
                              <img
                                src={img.url}
                                alt={img.name || ''}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />

                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                                <p className="text-xs text-white font-medium truncate">
                                  {img.name || 'Image'}
                                </p>
                                <p className="text-[10px] text-white/70">
                                  {formatFileSize(img.size)}
                                </p>
                              </div>

                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openImage(img);
                                  }}
                                  className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
                                >
                                  <Expand className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(img);
                                  }}
                                  className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div
                            className={`
                              p-4 rounded-2xl mb-3
                              ${isDark ? 'bg-slate-800' : 'bg-white shadow'}
                            `}
                          >
                            <Image
                              className={`
                                w-10 h-10
                                ${isDark ? 'text-slate-400' : 'text-gray-400'}
                              `}
                            />
                          </div>
                          <p
                            className={`
                              text-sm font-semibold mb-1
                              ${isDark ? 'text-slate-200' : 'text-gray-700'}
                            `}
                          >
                            Aucune image
                          </p>
                          <p
                            className={`
                              text-xs
                              ${isDark ? 'text-slate-500' : 'text-gray-500'}
                            `}
                          >
                            Les images partagées apparaîtront ici.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* FICHIERS */}
                  {mediaType === 'files' && (
                    <>
                      {mediaData?.files?.length > 0 ? (
                        <div className="space-y-3">
                          {mediaData.files.map((file) => (
                            <div
                              key={file.id}
                              className={`
                                flex items-center gap-3 p-3 rounded-xl
                                border
                                ${isDark
                                  ? 'bg-slate-900 border-slate-800'
                                  : 'bg-white border-gray-200 shadow-sm'}
                              `}
                            >
                              <div
                                className={`
                                  flex items-center justify-center w-10 h-10 rounded-lg
                                  ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}
                                `}
                              >
                                <FileText className="w-5 h-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`
                                    text-sm font-medium truncate
                                    ${isDark ? 'text-slate-100' : 'text-gray-900'}
                                  `}
                                >
                                  {file.name || 'Fichier'}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] mt-1">
                                  <span
                                    className={`
                                      ${isDark ? 'text-slate-400' : 'text-gray-500'}
                                    `}
                                  >
                                    {formatFileSize(file.size)}
                                  </span>
                                  {file.createdAt && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-gray-400/60" />
                                      <span
                                        className={`
                                          ${isDark ? 'text-slate-500' : 'text-gray-400'}
                                        `}
                                      >
                                        {formatMessageDate(file.createdAt)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => downloadFile(file)}
                                className={`
                                  p-2 rounded-full
                                  ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-gray-100 text-gray-600'}
                                `}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div
                            className={`
                              p-4 rounded-2xl mb-3
                              ${isDark ? 'bg-slate-800' : 'bg-white shadow'}
                            `}
                          >
                            <FileText
                              className={`
                                w-10 h-10
                                ${isDark ? 'text-slate-400' : 'text-gray-400'}
                              `}
                            />
                          </div>
                          <p
                            className={`
                              text-sm font-semibold mb-1
                              ${isDark ? 'text-slate-200' : 'text-gray-700'}
                            `}
                          >
                            Aucun fichier
                          </p>
                          <p
                            className={`
                              text-xs
                              ${isDark ? 'text-slate-500' : 'text-gray-500'}
                            `}
                          >
                            Les documents partagés apparaîtront ici.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* VIDÉOS */}
                  {mediaType === 'videos' && (
                    <>
                      {mediaData?.videos?.length > 0 ? (
                        <div className="space-y-3">
                          {mediaData.videos.map((video) => (
                            <div
                              key={video.id}
                              className={`
                                flex items-center gap-3 p-3 rounded-xl
                                border
                                ${isDark
                                  ? 'bg-slate-900 border-slate-800'
                                  : 'bg-white border-gray-200 shadow-sm'}
                              `}
                            >
                              <div className="relative w-20 h-14 rounded-lg overflow-hidden flex items-center justify-center bg-black/10">
                                <Play className="w-6 h-6 text-white drop-shadow" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/50 to-transparent" />
                                {video.thumbnail && (
                                  <img
                                    src={video.thumbnail}
                                    alt={video.name || ''}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                                  />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`
                                    text-sm font-medium truncate
                                    ${isDark ? 'text-slate-100' : 'text-gray-900'}
                                  `}
                                >
                                  {video.name || 'Vidéo'}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] mt-1">
                                  {video.size && (
                                    <span
                                      className={`
                                        ${isDark ? 'text-slate-400' : 'text-gray-500'}
                                      `}
                                    >
                                      {formatFileSize(video.size)}
                                    </span>
                                  )}
                                  {video.duration && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-gray-400/60" />
                                      <span
                                        className={`
                                          ${isDark ? 'text-slate-500' : 'text-gray-400'}
                                        `}
                                      >
                                        {Math.floor(video.duration / 60)}:
                                        {(video.duration % 60)
                                          .toString()
                                          .padStart(2, '0')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => window.open(video.url, '_blank')}
                                  className={`
                                    px-3 py-1.5 rounded-lg text-xs font-medium
                                    flex items-center gap-1 justify-center
                                    ${isDark
                                      ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                                  `}
                                >
                                  <Play className="w-3 h-3" />
                                  <span className="hidden sm:inline">Lire</span>
                                </button>
                                <button
                                  onClick={() => downloadFile(video)}
                                  className={`
                                    px-3 py-1.5 rounded-lg text-xs font-medium
                                    flex items-center gap-1 justify-center
                                    ${isDark
                                      ? 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                                  `}
                                >
                                  <Download className="w-3 h-3" />
                                  <span className="hidden sm:inline">Télécharger</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div
                            className={`
                              p-4 rounded-2xl mb-3
                              ${isDark ? 'bg-slate-800' : 'bg-white shadow'}
                            `}
                          >
                            <Play
                              className={`
                                w-10 h-10
                                ${isDark ? 'text-slate-400' : 'text-gray-400'}
                              `}
                            />
                          </div>
                          <p
                            className={`
                              text-sm font-semibold mb-1
                              ${isDark ? 'text-slate-200' : 'text-gray-700'}
                            `}
                          >
                            Aucune vidéo
                          </p>
                          <p
                            className={`
                              text-xs
                              ${isDark ? 'text-slate-500' : 'text-gray-500'}
                            `}
                          >
                            Les vidéos partagées apparaîtront ici.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* LIENS */}
                  {mediaType === 'links' && (
                    <>
                      {mediaData?.links?.length > 0 ? (
                        <div className="space-y-3">
                          {mediaData.links.map((link) => (
                            <div
                              key={link.id}
                              className={`
                                p-3 rounded-xl border
                                ${isDark
                                  ? 'bg-slate-900 border-slate-800'
                                  : 'bg-white border-gray-200 shadow-sm'}
                              `}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`
                                    flex items-center justify-center w-9 h-9 rounded-lg
                                    ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}
                                  `}
                                >
                                  <Link className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0 space-y-1.5">
                                  {link.links?.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`
                                        block text-xs sm:text-sm truncate
                                        ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-500'}
                                      `}
                                    >
                                      {url}
                                    </a>
                                  ))}

                                  <div
                                    className={`
                                      flex items-center gap-2 pt-1 text-[11px]
                                      ${isDark ? 'text-slate-500' : 'text-gray-400'}
                                    `}
                                  >
                                    {link.sender?.name && (
                                      <span>Par {link.sender.name}</span>
                                    )}
                                    {link.createdAt && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-gray-400/60" />
                                        <span>{formatMessageDate(link.createdAt)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div
                            className={`
                              p-4 rounded-2xl mb-3
                              ${isDark ? 'bg-slate-800' : 'bg-white shadow'}
                            `}
                          >
                            <Link
                              className={`
                                w-10 h-10
                                ${isDark ? 'text-slate-400' : 'text-gray-400'}
                              `}
                            />
                          </div>
                          <p
                            className={`
                              text-sm font-semibold mb-1
                              ${isDark ? 'text-slate-200' : 'text-gray-700'}
                            `}
                          >
                            Aucun lien
                          </p>
                          <p
                            className={`
                              text-xs
                              ${isDark ? 'text-slate-500' : 'text-gray-500'}
                            `}
                          >
                            Les liens partagés apparaîtront ici.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export function MobileHeader(props) {
  // on réutilise exactement ChatHeader, mais caché en desktop
  return (
    <div className="lg:hidden">
      <ChatHeader {...props} />
    </div>
  );
}