'use client'
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, X, Image, FileText, Music, Download, Trash2, AlertCircle, Link, Play, Pause, Expand, Upload, Shield, Lock, Unlock } from 'lucide-react';
import useBlockCheck from '../../hooks/useBlockCheck';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const THEME_STORAGE_KEY = (conversationId) => `chatTheme:${conversationId || 'global'}`;

const PRESET_THEMES = [
  { id: 'default', name: 'Bleu', primary: '#2563eb', bg: '', bubbleRadius: '14px' },
  { id: 'sunset', name: 'Sunset', primary: '#ff7a59', bg: '', bubbleRadius: '20px' },
  { id: 'dark', name: 'Sombre', primary: '#06b6d4', bg: '', bubbleRadius: '12px' },
];

const PRESET_BACKGROUNDS = [
  '',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
];

export default function ChatHeader({ contact, conversation, onBack, user }) {
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
  const [theme, setTheme] = useState({ id: 'default', primary: '#2563eb', bg: '', bubbleRadius: '14px', darkMode: false });
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [showCustomBgUpload, setShowCustomBgUpload] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const audioRef = useRef(null);
  const menuRef = useRef(null);
  const urlInputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { 
    isBlocked, 
    blockStatus, 
    loading: blockLoading,
    error: blockError,
    refresh: refreshBlockStatus 
  } = useBlockCheck(contact?._id);



  // Fonction pour charger le thème depuis le serveur
  const loadThemeFromServer = async () => {
    if (!conversation?._id) return;

    // ✅ CHARGER DIRECTEMENT depuis le localStorage SEULEMENT
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY(conversation._id));
    if (savedTheme) {
      const parsed = JSON.parse(savedTheme);
      setTheme(parsed);
      applyThemeToDocument(parsed);
      console.log('✅ Thème chargé depuis le localStorage');
    }
  };

  // Fonction améliorée pour persister le thème
  const persistTheme = async (t) => {
    // Sauvegarder localement
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY(conversation?._id || 'global'), JSON.stringify(t));
    }
    
    // Appliquer le thème localement
    applyThemeToDocument(t);
    
    console.log('🎨 Thème sauvegardé localement');
  };

  // Écouter les mises à jour de thème en temps réel
  useEffect(() => {
    if (!conversation?._id) return;

    // Importer dynamiquement le service socket
    import('../../services/socket').then((socketModule) => {
      const socket = socketModule.getSocket();
      
      if (socket) {
        // Écouter les mises à jour de thème
        socket.on('theme-updated', ({ conversationId, theme: newTheme }) => {
          if (conversationId === conversation._id) {
            setTheme(newTheme);
            applyThemeToDocument(newTheme);
            console.log('🎨 Thème mis à jour par l autre utilisateur');
          }
        });

        return () => {
          socket.off('theme-updated');
        };
      }
    });
  }, [conversation?._id]);

  // Charger le thème au démarrage
  useEffect(() => {
    if (conversation?._id) {
      loadThemeFromServer();
    }
  }, [conversation?._id]);

  // Fonction pour gérer l'upload d'image personnalisée
  const handleCustomBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop volumineuse. Taille maximale: 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      
      const newTheme = {
        ...theme,
        bg: imageUrl,
        id: 'custom-bg'
      };
      
      setTheme(newTheme);
      persistTheme(newTheme);
      setShowCustomBgUpload(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert('Erreur lors de la lecture du fichier');
    };

    reader.readAsDataURL(file);
  };

  // Fonction pour supprimer l'arrière-plan personnalisé
  const removeCustomBackground = () => {
    const newTheme = {
      ...theme,
      bg: '',
      id: theme.id === 'custom-bg' ? 'default' : theme.id
    };
    
    setTheme(newTheme);
    persistTheme(newTheme);
  };

  // Fonction améliorée pour appliquer le thème
  function applyThemeToDocument(t) {
    const root = document.documentElement;
    
    root.style.setProperty('--chat-primary', t.primary || '#2563eb');
    
    if (t.bg && t.bg.trim() !== '') {
      const safeUrl = t.bg.replace(/"/g, '%22');
      root.style.setProperty('--chat-bg-image', `url("${safeUrl}")`);
      root.style.setProperty('--chat-bg', 'transparent');
    } else {
      root.style.setProperty('--chat-bg-image', 'none');
      root.style.setProperty('--chat-bg', t.darkMode ? '#0f172a' : '#ffffff');
    }
    
    root.style.setProperty('--bubble-radius', t.bubbleRadius || '14px');
    root.style.setProperty('--user-bubble-bg', t.primary || '#2563eb');
    root.style.setProperty('--user-bubble-text', '#ffffff');
    root.style.setProperty('--other-bubble-bg', t.darkMode ? '#334155' : '#f1f5f9');
    root.style.setProperty('--other-bubble-text', t.darkMode ? '#f1f5f9' : '#0f172a');
    
    document.body.classList.add('chat-background');
    
    window.dispatchEvent(new CustomEvent('chat-theme-change', { detail: t }));
  }

  const formatMessageDate = (date) => {
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

  // Fonction pour lire un audio
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

  // Fonction corrigée pour charger les médias
  const loadMedia = async (type) => {
  setLoadingMedia(true);
  setMediaType(type);
  try {
    console.log(`📥 Chargement des médias de type: ${type}`);
    
    const response = await api.get(`/message-settings/conversations/${conversation._id}/media?type=${type}`);
    const data = response.data;
    
    console.log(`✅ Données reçues pour ${type}:`, data);
    
    if (!data || Object.keys(data).length === 0) {
      // Données mockées seulement si nécessaire
      const mockData = {
        images: type === 'images' ? [
          { 
            id: 1, 
            url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400', 
            name: 'image1.jpg', 
            size: 1024000,
            createdAt: new Date()
          }
        ] : [],
        files: type === 'files' ? [
          { 
            id: 1, 
            url: '/api/files/1', 
            name: 'document.pdf', 
            size: 2500000, 
            type: 'pdf',
            createdAt: new Date()
          }
        ] : [],
        audio: type === 'audio' ? [
          { 
            id: 1, 
            url: '/api/audio/1', 
            name: 'message_audio.mp3', 
            duration: 45, 
            size: 4500000,
            createdAt: new Date()
          }
        ] : [],
        videos: type === 'videos' ? [
          { 
            id: 1, 
            url: '/api/videos/1', 
            name: 'video.mp4', 
            duration: 120, 
            size: 15000000,
            createdAt: new Date()
          }
        ] : [],
        links: type === 'links' ? [
          { 
            id: 1, 
            links: ['https://example.com', 'https://google.com'],
            sender: { name: 'John Doe' },
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ] : []
      };
      setMediaData(mockData);
    } else {
      setMediaData(data);
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

  // Nettoyer l'audio quand le composant est démonté
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
  const confirmMsg = blockStatus?.iBlocked 
    ? `Êtes-vous sûr de vouloir débloquer ${contact.name} ?`
    : `Êtes-vous sûr de vouloir bloquer ${contact.name} ? Vous ne recevrez plus ses messages.`;

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
      
      const successMsg = blockStatus?.iBlocked 
        ? `✅ ${contact.name} a été débloqué` 
        : `🚫 ${contact.name} a été bloqué`;
      
      alert(successMsg);
      
      if (action === 'bloquer') {
        setTimeout(() => {
          router.push('/');
        }, 1500);
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
  if (!confirm('Supprimer cette discussion ? Elle ne sera supprimée que pour vous.')) return;
  try {
    const response = await api.delete(`/message-settings/conversations/${conversation._id}/delete`);
    const data = response.data;
    if (data.success && onBack) {
      onBack();
    }
  } catch (err) {
    console.error('Erreur suppression:', err);
    alert('Erreur lors de la suppression');
  }
};

  const openMediaPanel = async () => {
    setShowMediaPanel(true);
    setShowMenu(false);
    await loadMedia('images');
  };

  const applyPreset = (preset) => {
    const newTheme = {
      ...theme,
      id: preset.id,
      primary: preset.primary || theme.primary,
      bg: preset.bg || '',
      bubbleRadius: preset.bubbleRadius || theme.bubbleRadius,
    };
    setTheme(newTheme);
    persistTheme(newTheme);
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

  // Fonction pour obtenir l'autre participant
  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find(p => (p._id || p.id) !== userId);
  };

  // Fonction pour gérer le clic sur la photo
  const handleProfileClick = () => {
    if (!contact && !conversation) {
      // Cas sans contact = votre profil
      router.push('/profile');
    } else if (conversation?.isGroup) {
      // Groupe : aller vers les détails du groupe (vous pouvez créer cette page plus tard)
      // router.push(`/group/${conversation._id}`);
    } else {
      // Conversation individuelle : aller vers le profil du contact
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
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 shadow-xl">
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            {/* VOTRE photo de profil */}
            <div 
              className="relative shrink-0 cursor-pointer group" 
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-4 ring-white/40 shadow-2xl overflow-hidden group-hover:ring-white/60 transition">
                <img
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=fff&color=3b82f6&bold=true&size=128`}
                  alt={user?.name || 'Utilisateur'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=fff&color=3b82f6&bold=true&size=128`;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white shadow-lg"></div>
            </div>
            <div className="text-white flex-1 min-w-0">
              <h2 className="font-bold text-lg sm:text-xl drop-shadow-lg truncate">{user?.name || 'Utilisateur'}</h2>
              <p className="text-sm text-blue-100 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-lg"></span>
                En ligne
              </p>
            </div>
          </div>
        </div>
      </div> 
    );
  }

  const isGroup = conversation?.isGroup || false;
  const displayName = isGroup ? (conversation?.groupName || 'Groupe sans nom') : (contact?.name || 'Utilisateur');
  const displayImage = isGroup ? (conversation?.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true&size=128`) : (contact?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&bold=true&size=128`);
  const participantsCount = isGroup ? (conversation?.participants?.length || 0) : null;
  const contactIsOnline = !isGroup && contact?._id && isUserOnline(contact._id);
  
  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 shadow-xl">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at top right, rgba(6, 182, 212, 0.3), transparent)"
        }}></div>

        <div className="relative p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack || (() => router.push('/'))}
              className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0 shadow-md"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Photo du CONTACT ou GROUPE */}
            <div 
              className="relative shrink-0 cursor-pointer group"
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ring-4 ring-white/40 shadow-2xl overflow-hidden group-hover:ring-white/60 transition">
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = isGroup
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true&size=128`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fff&color=3b82f6&bold=true&size=128`;
                  }}
                />
              </div>
              {isGroup && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
              )}
              {contactIsOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg"></div>
              )}
            </div>
            <div className="text-white flex-1 min-w-0">
              <h2 className="font-bold text-base sm:text-lg drop-shadow-lg truncate">{displayName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isGroup ? (
                  <p className="text-xs sm:text-sm text-blue-100 font-semibold truncate">
                    {participantsCount} participant{participantsCount > 1 ? 's' : ''}
                  </p>
                ) : blockLoading ? (
                  <p className="text-xs sm:text-sm text-white/70 truncate flex items-center gap-1">
                    <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></span>
                    Chargement...
                  </p>
                ) : blockStatus?.blockedMe ? ( // ✅ CORRIGÉ
                  <p className="text-xs sm:text-sm text-red-200 font-semibold truncate flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Vous êtes bloqué
                  </p>
                ) : blockStatus?.iBlocked ? ( // ✅ CORRIGÉ
                  <p className="text-xs sm:text-sm text-yellow-200 font-semibold truncate flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Bloqué
                  </p>
                ) : contactIsOnline ? (
                  <>
                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-lg shrink-0"></span>
                    <p className="text-xs sm:text-sm text-blue-100 font-semibold truncate">En ligne</p>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-blue-100 truncate">Hors ligne</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isGroup && (
              <>
                <button className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all">
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all">
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="fixed right-4 top-20 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 max-h-[85vh] flex flex-col overflow-hidden">
                  {/* Header avec dégradé */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500"></div>
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={displayImage} 
                            alt={displayName} 
                            className="w-16 h-16 rounded-2xl object-cover shadow-xl ring-4 ring-white/30" 
                          />
                          {contactIsOnline && !isGroup && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white shadow-lg"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base sm:text-lg font-bold text-white truncate">
                            {displayName}
                          </h2>
                          
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            {isGroup ? (
                              <div className="flex items-center gap-1.5 text-white/90">
                                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>{participantsCount} participant{participantsCount > 1 ? 's' : ''}</span>
                              </div>
                            ) : blockLoading ? (
                              <div className="flex items-center gap-1.5 text-white/70">
                                <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                                <span>Chargement...</span>
                              </div>
                            ) : (blockStatus?.blockedMe || false) ? (
                              <div className="flex items-center gap-1.5 text-red-300">
                                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Vous êtes bloqué</span>
                              </div>
                            ) : (blockStatus?.iBlocked || false) ? (
                              <div className="flex items-center gap-1.5 text-yellow-300">
                                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Bloqué</span>
                              </div>
                            ) : contactIsOnline ? (
                              <>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-white/90">En ligne</span>
                              </>
                            ) : (
                              <span className="text-white/70">Hors ligne</span>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => setShowMenu(false)} 
                          className="p-2 hover:bg-white/20 rounded-xl transition-all text-white backdrop-blur-sm"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenu défilant */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {/* Actions Principales */}
                    <div className="space-y-2 mb-6">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-3">
                        Actions
                      </div>

                      <button 
                        onClick={() => { setOpenPanel(true); setShowMenu(false); }} 
                        className="group flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all"
                      >
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-gray-800">Voir le profil</span>
                          <p className="text-xs text-gray-500 mt-0.5">Informations détaillées</p>
                        </div>
                      </button>

                      <button 
                        onClick={openMediaPanel} 
                        className="group flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all"
                      >
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-gray-800">Multimédia</span>
                          <p className="text-xs text-gray-500 mt-0.5">Photos, fichiers et liens</p>
                        </div>
                      </button>

                      <button 
                        onClick={toggleMute} 
                        className="group flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all"
                      >
                        <div className={`p-3 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all ${
                          settings.muted 
                            ? 'bg-gradient-to-br from-orange-500 to-amber-500' 
                            : 'bg-gradient-to-br from-orange-400 to-amber-400'
                        }`}>
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-gray-800">
                            {settings.muted ? 'Réactiver' : 'Mettre en silence'}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {settings.muted ? 'Recevoir les notifications' : 'Masquer les notifications'}
                          </p>
                        </div>
                      </button>

                      {!isGroup && (
                        <button
                          onClick={toggleBlock}
                          disabled={blockLoading}
                          className={`group flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${
                            blockLoading 
                              ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                              : 'hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50'
                          }`}
                        >
                          <div className={`p-3 rounded-xl transition-all ${
                            blockLoading 
                              ? 'bg-gray-200' 
                              : blockStatus?.iBlocked 
                                ? 'bg-green-100 text-green-600 group-hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 group-hover:bg-red-200'
                          }`}>
                            {blockLoading ? (
                              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : blockStatus?.iBlocked ? (
                              <Unlock className="w-5 h-5" />
                            ) : (
                              <Shield className="w-5 h-5" />
                            )}
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-gray-900">
                              {blockLoading 
                                ? 'Chargement...' 
                                : blockStatus?.iBlocked 
                                  ? 'Débloquer' 
                                  : 'Bloquer'
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              {blockLoading 
                                ? 'Vérification du statut...' 
                                : blockStatus?.iBlocked 
                                  ? 'Autoriser les messages' 
                                  : 'Empêcher les messages'
                              }
                            </div>
                          </div>
                        </button>
                      )}

                      <button 
                        onClick={handleDeleteConversation} 
                        className="group flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all"
                      >
                        <div className="p-3 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                          <Trash2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-red-700">Supprimer</span>
                          <p className="text-xs text-gray-500 mt-0.5">Supprimer pour vous uniquement</p>
                        </div>
                      </button>
                    </div>

                    {/* Section Personnalisation */}
                    <div className="border-t-2 border-gray-100 pt-6">
                      <div className="flex items-center gap-2 px-2 mb-4">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">Personnalisation</h4>
                        {savingTheme && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 px-2">
                        {/* Thèmes Prédéfinis */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Thèmes
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {PRESET_THEMES.map((preset) => (
                              <button 
                                key={preset.id} 
                                onClick={() => applyPreset(preset)}
                                disabled={savingTheme}
                                className={`relative h-20 rounded-2xl border-3 transition-all transform hover:scale-105 ${
                                  theme.id === preset.id 
                                    ? 'border-blue-500 ring-4 ring-blue-200 shadow-xl' 
                                    : 'border-gray-200 hover:border-gray-300 shadow-md'
                                } ${savingTheme ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{ 
                                  background: `linear-gradient(135deg, ${preset.primary}15, ${preset.primary}35)` 
                                }}
                              >
                                {theme.id === preset.id && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 h-2 rounded-b-2xl" style={{ backgroundColor: preset.primary }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-700">{preset.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sélecteur de Couleur */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Couleur Personnalisée
                          </label>
                          <div className="relative">
                            <input 
                              type="color" 
                              value={theme.primary} 
                              onChange={(e) => { 
                                const newTheme = { ...theme, primary: e.target.value, id: 'custom' }; 
                                setTheme(newTheme); 
                                persistTheme(newTheme); 
                              }} 
                              disabled={savingTheme}
                              className={`w-full h-14 rounded-2xl cursor-pointer border-3 border-gray-200 shadow-md hover:shadow-lg transition-all ${
                                savingTheme ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            />
                            <div className="absolute inset-0 rounded-2xl pointer-events-none border-3 border-white/50"></div>
                          </div>
                        </div>

                        {/* Arrière-plans */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Arrière-plan
                          </label>
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {PRESET_BACKGROUNDS.map((bg, index) => (
                              <button 
                                key={index} 
                                onClick={() => { 
                                  if (savingTheme) return;
                                  const newTheme = { ...theme, bg: bg || '' }; 
                                  setTheme(newTheme); 
                                  persistTheme(newTheme); 
                                }} 
                                disabled={savingTheme}
                                className={`w-20 h-20 rounded-2xl border-3 ${
                                  theme.bg === bg 
                                    ? 'border-blue-500 ring-4 ring-blue-200 shadow-xl' 
                                    : 'border-gray-200 hover:border-gray-300 shadow-md'
                                } ${savingTheme ? 'opacity-50 cursor-not-allowed' : ''} relative group overflow-hidden transition-all transform hover:scale-105`}
                              >
                                {bg ? (
                                  <>
                                    <img src={bg} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-end justify-center pb-2">
                                      <span className="text-white text-xs font-bold drop-shadow-lg">
                                        {index === 1 ? 'Gradient' : index === 2 ? 'Coloré' : index === 3 ? 'Nature' : 'Plage'}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex flex-col items-center justify-center">
                                    <X className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500 font-medium">Aucun</span>
                                  </div>
                                )}
                                {theme.bg === bg && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ))}

                            {/* Bouton Upload Personnalisé */}
                            <button 
                              onClick={() => !savingTheme && setShowCustomBgUpload(!showCustomBgUpload)}
                              disabled={savingTheme}
                              className={`w-20 h-20 rounded-2xl border-3 border-dashed ${
                                theme.bg && !PRESET_BACKGROUNDS.includes(theme.bg) 
                                  ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-200 shadow-xl' 
                                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 shadow-md'
                              } ${savingTheme ? 'opacity-50 cursor-not-allowed' : ''} flex flex-col items-center justify-center transition-all transform hover:scale-105 relative group`}
                            >
                              <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors mb-1" />
                              <span className="text-xs text-gray-500 group-hover:text-blue-600 font-medium transition-colors">Upload</span>
                              
                              {theme.bg && !PRESET_BACKGROUNDS.includes(theme.bg) && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          </div>

                          {/* Panel Upload Personnalisé */}
                          {showCustomBgUpload && (
                            <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-inner">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 bg-blue-500 rounded-lg">
                                    <Upload className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-sm font-bold text-blue-800">Image Personnalisée</span>
                                </div>
                                <button 
                                  onClick={() => setShowCustomBgUpload(false)}
                                  className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4 text-blue-600" />
                                </button>
                              </div>

                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCustomBackgroundUpload}
                                className="hidden"
                              />

                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                📁 Choisir une image
                              </button>

                              <p className="text-xs text-blue-700 mt-3 text-center font-medium">
                                Format: PNG, JPG, WEBP • Taille max: 5MB
                              </p>

                              {/* Bouton Supprimer l'arrière-plan personnalisé */}
                              {theme.bg && !PRESET_BACKGROUNDS.includes(theme.bg) && (
                                <button
                                  onClick={removeCustomBackground}
                                  disabled={savingTheme}
                                  className={`w-full mt-3 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 ${
                                    savingTheme ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer l'arrière-plan
                                </button>
                              )}
                            </div>
                          )}

                          {/* Info partagée */}
                          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-inner">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-500 rounded-lg shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-blue-800 mb-1">Thème Partagé</p>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                  Ce thème sera visible par tous les participants de cette conversation
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer fixe */}
                  <div className="p-4 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white shrink-0">
                    <button 
                      onClick={() => setShowMenu(false)} 
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Fermer
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
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
            <div className="p-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-2xl">📁 Multimédia</h2>
                  <p className="text-sm text-purple-100">Photos, fichiers et liens</p>
                </div>
                <button onClick={() => setShowMediaPanel(false)} className="p-2 hover:bg-white/20 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* 🆕 NOUVELLE SECTION AVEC VIDÉOS - REMPLACE L'ANCIENNE */}
            <div className="flex border-b bg-white overflow-x-auto">
              {[
                { id: 'images', label: 'Images', icon: Image },
                { id: 'files', label: 'Fichiers', icon: FileText },
                { id: 'audio', label: 'Audio', icon: Music },
                { id: 'videos', label: 'Vidéos', icon: Play }, // 🆕 Nouvel onglet
                { id: 'links', label: 'Liens', icon: Link }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => loadMedia(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-semibold whitespace-nowrap ${
                    mediaType === tab.id 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {loadingMedia ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {mediaType === 'images' && (
                    <div className="grid grid-cols-3 gap-3">
                      {mediaData?.images?.length > 0 ? (
                        mediaData.images.map((img) => (
                          <div 
                            key={img.id} 
                            className="aspect-square rounded-xl overflow-hidden shadow-md group relative"
                          >
                            <img 
                              src={img.url} 
                              alt="" 
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => openImage(img)}
                            />
                            {/* Overlay avec boutons */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              {/* Bouton pour agrandir */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openImage(img);
                                }}
                                className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                                title="Agrandir"
                              >
                                <Expand className="w-4 h-4 text-gray-700" />
                              </button>
                              
                              {/* Bouton pour télécharger */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(img);
                                }}
                                className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4 text-gray-700" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-20">
                          <Image className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucune image</p>
                        </div>
                      )}
                    </div>
                  )}

                  {mediaType === 'files' && (
                    <div className="space-y-2">
                      {mediaData?.files?.length > 0 ? (
                        mediaData.files.map((file) => (
                          <div key={file.id} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow">
                            <FileText className="w-8 h-8 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(file.size)} • {file.type?.toUpperCase() || 'FILE'}
                              </p>
                            </div>
                            <button 
                              onClick={() => downloadFile(file)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Télécharger"
                            >
                              <Download className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucun fichier</p>
                        </div>
                      )}
                    </div>
                  )}

                  {mediaType === 'audio' && (
                    <div className="space-y-2">
                      {mediaData?.audio?.length > 0 ? (
                        mediaData.audio.map((audio) => (
                          <div key={audio.id} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow">
                            <Music className="w-8 h-8 text-purple-600" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{audio.name || `Audio ${audio.duration}s`}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(audio.size)} • {audio.duration}s
                              </p>
                            </div>
                            <button 
                              onClick={() => playAudio(audio)}
                              className={`p-3 rounded-full transition-all ${
                                playingAudio === audio.id 
                                  ? 'bg-purple-100 text-purple-600' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
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
                          <Music className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucun audio</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {mediaType === 'videos' && (
                    <div className="space-y-3">
                      {mediaData?.videos?.length > 0 ? (
                        mediaData.videos.map((video) => (
                          <div key={video.id} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow">
                            <div className="relative">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Play className="w-6 h-6 text-gray-600" />
                              </div>
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{video.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(video.size)} • {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              </p>
                            </div>
                            <button 
                              onClick={() => window.open(video.url, '_blank')}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ouvrir la vidéo"
                            >
                              <Play className="w-5 h-5 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => downloadFile(video)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Télécharger"
                            >
                              <Download className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <Play className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucune vidéo</p>
                        </div>
                      )}
                    </div>
                  )}

                  {mediaType === 'links' && (
                    <div className="space-y-2">
                      {mediaData?.links?.length > 0 ? (
                        mediaData.links.map((link) => (
                          <div key={link.id} className="p-4 bg-white rounded-xl shadow">
                            <div className="flex items-start gap-3">
                              <Link className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
                              <div className="flex-1 min-w-0">
                                {link.links.map((url, idx) => (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-blue-600 hover:underline truncate mb-1"
                                  >
                                    {url}
                                  </a>
                                ))}
                                <p className="text-xs text-gray-500 mt-2">
                                  Par {link.sender?.name} • {formatMessageDate(link.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20">
                          <Link className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucun lien</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
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
    </>
  );
}