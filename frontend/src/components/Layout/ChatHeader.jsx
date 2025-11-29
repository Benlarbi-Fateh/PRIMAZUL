'use client'
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users, X, Image, FileText, Music, Download, Trash2, AlertCircle, Link, Play, Pause, Expand, Upload } from 'lucide-react';
import useBlockCheck from '../../hooks/useBlockCheck';

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
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [mediaType, setMediaType] = useState('images');
  const [mediaData, setMediaData] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [settings, setSettings] = useState({ muted: false, blocked: false, iBlocked: false, blockedMe: false });
  const [theme, setTheme] = useState({ id: 'default', primary: '#2563eb', bg: '', bubbleRadius: '14px', darkMode: false });
  const [selectedImage, setSelectedImage] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [showCustomBgUpload, setShowCustomBgUpload] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const audioRef = useRef(null);
  const menuRef = useRef(null);
  const urlInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isBlocked, blockStatus } = useBlockCheck(contact?._id);

  // ✅ CORRECTION : Utiliser process.env au lieu de window
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const fetchAPI = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  try {
    const fullUrl = `${API_URL}${endpoint}`;
    console.log('🔄 Fetching:', fullUrl, options);

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // ✅ MODIFICATION : Moins de logs bruyants pour les 404
      if (response.status === 404) {
        console.log('⚠️ Route non disponible:', endpoint);
        return {};
      }
      
      console.error(`❌ HTTP ${response.status} pour ${endpoint}:`, errorText);
      
      if (response.status === 500) {
        console.log('⚠️ Erreur serveur 500 - utilisation du fallback');
        return {};
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('⚠️ Réponse non-JSON - probablement route inexistante');
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erreur fetchAPI pour', endpoint, ':', error.message);
    return {};
  }
};


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

  // Fonction pour télécharger un fichier
  const downloadFile = async (file) => {
    try {
      if (file.url) {
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
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
  };
  //Fonction pour télécharger une image
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

  // Charger les médias
  const loadMedia = async (type) => {
    setLoadingMedia(true);
    setMediaType(type);
    try {
      const data = await fetchAPI(`/message-settings/conversations/${conversation._id}/media?type=${type}`);
      
      if (!data || Object.keys(data).length === 0) {
        const mockData = {
          images: type === 'images' ? [
            { id: 1, url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400', name: 'image1.jpg', size: 1024000 },
            { id: 2, url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400', name: 'image2.jpg', size: 2048000 }
          ] : [],
          files: type === 'files' ? [
            { id: 1, url: '/api/files/1', name: 'document.pdf', size: 2500000, type: 'pdf' },
            { id: 2, url: '/api/files/2', name: 'rapport.docx', size: 1800000, type: 'docx' }
          ] : [],
          audio: type === 'audio' ? [
            { id: 1, url: '/api/audio/1', name: 'message_audio.mp3', duration: 45, size: 4500000 },
            { id: 2, url: '/api/audio/2', name: 'note_vocale.mp3', duration: 30, size: 3000000 }
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
      console.error('Erreur chargement média:', err);
      const mockData = {
        images: type === 'images' ? [
          { id: 1, url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400', name: 'image1.jpg', size: 1024000 },
          { id: 2, url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400', name: 'image2.jpg', size: 2048000 }
        ] : [],
        files: type === 'files' ? [
          { id: 1, url: '/api/files/1', name: 'document.pdf', size: 2500000, type: 'pdf' },
          { id: 2, url: '/api/files/2', name: 'rapport.docx', size: 1800000, type: 'docx' }
        ] : [],
        audio: type === 'audio' ? [
          { id: 1, url: '/api/audio/1', name: 'message_audio.mp3', duration: 45, size: 4500000 },
          { id: 2, url: '/api/audio/2', name: 'note_vocale.mp3', duration: 30, size: 3000000 }
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
    const loadSettings = async () => {
      try {
        const data = await fetchAPI(`/message-settings/conversations/${conversation._id}/settings`);
        if (data.success) {
          const s = data.settings;
          setSettings({ muted: s.isMuted, blocked: s.iBlocked, iBlocked: s.iBlocked, blockedMe: s.blockedMe });
        }
      } catch (err) {
        console.error('Erreur chargement settings:', err);
      }
    };
    loadSettings();
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
    try {
      const endpoint = settings.muted ? `/message-settings/conversations/${conversation._id}/unmute` : `/message-settings/conversations/${conversation._id}/mute`;
      const data = await fetchAPI(endpoint, { method: 'POST' });
      if (data.success) {
        setSettings(prev => ({ ...prev, muted: !prev.muted }));
      }
    } catch (err) {
      console.error('Erreur toggle mute:', err);
      alert('Erreur lors de la modification');
    }
  };

  const toggleBlock = async () => {
  if (!contact?._id) return;
  try {
    const endpoint = settings.iBlocked ? '/message-settings/unblock' : '/message-settings/block';
    const data = await fetchAPI(endpoint, { method: 'POST', body: JSON.stringify({ targetUserId: contact._id }) });
    if (data.success) {
      setSettings(prev => ({ ...prev, iBlocked: !prev.iBlocked, blocked: !prev.iBlocked }));
      setShowMenu(false);
      
      // 🆕 FORCER LE RECHARGEMENT DE LA PAGE POUR ACTUALISER LE HOOK
      window.location.reload();
    }
  } catch (err) {
    console.error('Erreur toggle block:', err);
    alert('Erreur lors du blocage');
  }
};

  const handleDeleteConversation = async () => {
    if (!confirm('Supprimer cette discussion ? Elle ne sera supprimée que pour vous.')) return;
    try {
      const data = await fetchAPI(`/message-settings/conversations/${conversation._id}/delete`, { method: 'DELETE' });
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

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  if (!contact && !conversation) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 shadow-xl">
        <div className="relative p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-4 ring-white/40 shadow-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.[0] || 'U'}
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
  const blockedStatus = isBlocked || settings.iBlocked || settings.blockedMe;
  
  return (
    <>
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 shadow-xl">
        <div className="relative p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={onBack} className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0 shadow-md">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="relative shrink-0">
              <img src={displayImage} alt={displayName} className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ring-4 ring-white/40 shadow-2xl object-cover" />
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
  ) : blockedStatus ? ( // 🆕 AJOUTER CE CAS
    <p className="text-xs sm:text-sm text-red-200 font-semibold truncate">
      🔒 Bloqué
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
                <div className="fixed right-4 top-20 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[85vh] flex flex-col">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                      <img src={displayImage} alt={displayName} className="w-12 h-12 rounded-xl object-cover shadow-md ring-2 ring-white" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{displayName}</h3>
                        <p className="text-xs text-gray-600 truncate mt-0.5">
                          {isGroup ? `${participantsCount} membres` : contactIsOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                        </p>
                      </div>
                      <button onClick={() => setShowMenu(false)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    <button onClick={() => { setOpenPanel(true); setShowMenu(false); }} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-blue-50 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-700">Voir le profil</span>
                    </button>
                    <button onClick={openMediaPanel} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-purple-50 transition-colors">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Image className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-700">Multimédia</span>
                    </button>
                    <button onClick={toggleMute} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-orange-50 transition-colors">
                      <div className={`p-2 rounded-lg ${settings.muted ? 'bg-orange-200' : 'bg-orange-100'}`}>
                        <Phone className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-medium text-gray-700">{settings.muted ? '🔕 Réactiver' : '🔔 Mettre en silence'}</span>
                    </button>
                    {!isGroup && (
                      <button onClick={toggleBlock} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 transition-colors">
                        <div className={`p-2 rounded-lg ${settings.iBlocked ? 'bg-red-200' : 'bg-red-100'}`}>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="font-medium text-gray-700">{settings.iBlocked ? 'Débloquer' : 'Bloquer'}</span>
                      </button>
                    )}
                    <button onClick={handleDeleteConversation} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 transition-colors">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-medium text-red-600">Supprimer</span>
                    </button>
                    
                    {/* Section Personnalisation */}
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 px-2 mb-3 flex items-center gap-2">
                        🎨 Personnalisation
                        {savingTheme && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </h4>
                      <div className="space-y-3 px-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Thèmes</label>
                          <div className="grid grid-cols-3 gap-2">
                            {PRESET_THEMES.map((preset) => (
                              <button 
                                key={preset.id} 
                                onClick={() => applyPreset(preset)}
                                disabled={savingTheme}
                                className={`relative h-14 rounded-lg border-2 transition-all ${
                                  theme.id === preset.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                } ${savingTheme ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{ background: `linear-gradient(135deg, ${preset.primary}20, ${preset.primary}40)` }}
                              >
                                {theme.id === preset.id && (
                                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full"></div>
                                )}
                                <div className="w-full h-1.5 absolute bottom-0 left-0 rounded-b-lg" style={{ backgroundColor: preset.primary }} />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Couleur</label>
                          <input 
                            type="color" 
                            value={theme.primary} 
                            onChange={(e) => { 
                              const newTheme = { ...theme, primary: e.target.value, id: 'custom' }; 
                              setTheme(newTheme); 
                              persistTheme(newTheme); 
                            }} 
                            disabled={savingTheme}
                            className={`w-full h-10 rounded-lg cursor-pointer border border-gray-300 ${
                              savingTheme ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Arrière-plan</label>
                          <div className="flex gap-2 mb-2 flex-wrap">
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
                                className={`w-16 h-16 rounded-lg border-2 ${
                                  theme.bg === bg ? 'border-blue-500' : 'border-gray-200'
                                } ${savingTheme ? 'opacity-50 cursor-not-allowed' : ''} relative group`}
                              >
                                {bg ? (
                                  <>
                                    <img src={bg} alt="" className="w-full h-full object-cover rounded-lg" />
                                    {index >= 3 && (
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-bold">
                                          {index === 3 ? 'Montagnes' : index === 4 ? 'Plage' : ''}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <X className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </button>
                            ))}
                            
                            <button 
                              onClick={() => !savingTheme && setShowCustomBgUpload(!showCustomBgUpload)}
                              disabled={savingTheme}
                              className={`w-16 h-16 rounded-lg border-2 border-dashed ${
                                theme.bg && !PRESET_BACKGROUNDS.includes(theme.bg) 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-300 hover:border-blue-400'
                              } ${savingTheme ? 'opacity-50 cursor-not-allowed' : ''} flex flex-col items-center justify-center transition-all relative group`}
                            >
                              <Upload className="w-5 h-5 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">Personnalisé</span>
                              
                              {theme.bg && !PRESET_BACKGROUNDS.includes(theme.bg) && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                              )}
                            </button>
                          </div>

                          {showCustomBgUpload && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-blue-700">Ajouter votre image</span>
                                <button 
                                  onClick={() => setShowCustomBgUpload(false)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <X className="w-4 h-4" />
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
                                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                📁 Choisir une image
                              </button>
                              
                              <p className="text-xs text-blue-600 mt-2 text-center">
                                PNG, JPG, WEBP (max 5MB)
                              </p>
                            </div>
                          )}

                          {theme.bg && !PRESET_BACKGROUNDS.includes(theme.bg) && (
                            <button
                              onClick={removeCustomBackground}
                              disabled={savingTheme}
                              className={`w-full mt-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                savingTheme ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer l'arrière-plan personnalisé
                            </button>
                          )}
                        </div>
                        
                        {/* Indicateur que le thème est partagé */}
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg text-center">
                          🎨 Ce thème sera visible par les deux participants
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
                    <button onClick={() => setShowMenu(false)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
   {blockedStatus && (
  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-center py-3 text-sm font-medium shadow-lg">
    <div className="flex items-center justify-center gap-2">
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      <span>
        {blockStatus.blockedMe 
          ? '❌ Vous êtes bloqué - Messages désactivés' 
          : '🚫 Utilisateur bloqué - Messages désactivés'
        }
      </span>
    </div>
  </div>
)}
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
            
            <div className="flex border-b bg-white">
              {[
                { id: 'images', label: 'Images', icon: Image },
                { id: 'files', label: 'Fichiers', icon: FileText },
                { id: 'audio', label: 'Audio', icon: Music },
                { id: 'links', label: 'Liens', icon: Link }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => loadMedia(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold ${
                    mediaType === tab.id 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-600'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
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