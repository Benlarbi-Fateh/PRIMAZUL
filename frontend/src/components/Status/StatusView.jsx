'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Play, Pause, Volume2, VolumeX, Trash2, MoreVertical, X, 
  Heart, Smile, ThumbsUp, Award, Frown, Angry, Flame,
  MessageCircle, Send, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001';

const StatusView = ({ userStatus, onClose, onStatusUpdate, onDeleteStatus }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [showViews, setShowViews] = useState(false);
  const [views, setViews] = useState([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [reactions, setReactions] = useState([]);
  const [reactionsSummary, setReactionsSummary] = useState({});
  const [currentUserReaction, setCurrentUserReaction] = useState(null);
  const [totalReactions, setTotalReactions] = useState(0);
  const [repliesCount, setRepliesCount] = useState(0);
  
  const { user } = useAuth();
  const progressRef = useRef();
  const videoRef = useRef(null);
  const optionsRef = useRef(null);
  const replyInputRef = useRef(null);
  
  const currentStatus = userStatus?.statuses?.[currentIndex];
  const isMyStatus = userStatus?.user?._id === user?._id;

  const reactionIcons = {
    like: '👍',
    love: '❤️',
    haha: '😄',
    wow: '😮',
    sad: '😢',
    angry: '😠',
    fire: '🔥',
    clap: '👏'
  };

  const reactionColors = {
    like: 'bg-blue-100 text-blue-600',
    love: 'bg-red-100 text-red-600',
    haha: 'bg-yellow-100 text-yellow-600',
    wow: 'bg-purple-100 text-purple-600',
    sad: 'bg-blue-100 text-blue-600',
    angry: 'bg-orange-100 text-orange-600',
    fire: 'bg-orange-100 text-orange-600',
    clap: 'bg-green-100 text-green-600'
  };

  // Fonction utilitaire pour obtenir l'URL complète des médias
  const getMediaUrl = (url) => {
    if (!url) return null;
    
    // Si l'URL est déjà complète
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si c'est un chemin relatif, ajouter l'URL de base
    if (url.startsWith('/')) {
      return `${API_BASE_URL}${url}`;
    }
    
    // Pour les chemins sans slash
    return `${API_BASE_URL}/${url}`;
  };

  // Fonction utilitaire pour obtenir l'avatar
  const getAvatarUrl = (user, fallbackName = 'Utilisateur') => {
    if (!user) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fallbackName
      )}&background=3b82f6&color=fff&bold=true`;
    }
    
    const profilePic = user.profilePicture;
    if (!profilePic) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name || user.username || fallbackName
      )}&background=3b82f6&color=fff&bold=true`;
    }
    
    return getMediaUrl(profilePic) || `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name || user.username || fallbackName
    )}&background=3b82f6&color=fff&bold=true`;
  };

  // Fonction pour obtenir le nom d'utilisateur
  const getUserDisplayName = (view) => {
    // Cas 1: userId est un objet avec propriétés
    if (typeof view.userId === 'object' && view.userId !== null) {
      return view.userId.name || view.userId.username || 'Utilisateur';
    }
    
    // Cas 2: On a directement les propriétés dans view
    if (view.userName) return view.userName;
    if (view.user) return view.user;
    
    // Cas 3: userId est un simple ID string
    if (view.userId && typeof view.userId === 'string') {
      return `Utilisateur (${view.userId.substring(0, 6)}...)`;
    }
    
    return 'Utilisateur';
  };

  // Fonction pour obtenir les infos utilisateur complètes
  const getUserInfo = (view) => {
    const name = getUserDisplayName(view);
    
    // Cas 1: userId est un objet complet
    if (typeof view.userId === 'object' && view.userId !== null) {
      return {
        name: name,
        avatarUrl: getAvatarUrl(view.userId, name),
        id: view.userId._id || view.userId.id || 'unknown'
      };
    }
    
    // Cas 2: On a des propriétés séparées
    if (view.user || view.userName) {
      return {
        name: name,
        avatarUrl: view.profilePicture ? getMediaUrl(view.profilePicture) : getAvatarUrl(null, name),
        id: view.userId || view._id || 'unknown'
      };
    }
    
    // Cas 3: Aucune info disponible
    return {
      name: name,
      avatarUrl: getAvatarUrl(null, name),
      id: view.userId || 'unknown'
    };
  };

  // Fonction de déduplication AVANCÉE
  const deduplicateViews = (views) => {
    console.log('🔄 Déduplication des vues...');
    console.log('📊 Avant déduplication:', views.length, 'vues');
    
    // 1. Créer un Map pour regrouper par utilisateur
    const viewsByUser = new Map();
    
    // 2. Parcourir toutes les vues
    views.forEach(view => {
      // Extraire l'ID utilisateur
      let userId;
      if (typeof view.userId === 'object' && view.userId !== null) {
        userId = view.userId._id || view.userId.id || view.userId.toString();
      } else {
        userId = view.userId || view.user || 'unknown';
      }
      
      // Si on a déjà une vue pour cet utilisateur
      if (viewsByUser.has(userId)) {
        const existingView = viewsByUser.get(userId);
        
        // Garder la vue la plus récente
        const existingDate = new Date(existingView.viewedAt || existingView.createdAt);
        const currentDate = new Date(view.viewedAt || view.createdAt);
        
        if (currentDate > existingDate) {
          viewsByUser.set(userId, view);
          console.log(`🔄 Mise à jour vue pour ${userId} (plus récente)`);
        }
      } else {
        // Première vue pour cet utilisateur
        viewsByUser.set(userId, view);
        console.log(`✅ Nouvelle vue pour ${userId}`);
      }
    });
    
    // 3. Convertir le Map en tableau
    const uniqueViews = Array.from(viewsByUser.values());
    
    // 4. Trier par date (plus récent en premier)
    uniqueViews.sort((a, b) => {
      const dateA = new Date(a.viewedAt || a.createdAt);
      const dateB = new Date(b.viewedAt || b.createdAt);
      return dateB - dateA; // Décroissant
    });
    
    console.log('👤 Utilisateurs uniques:', Array.from(viewsByUser.keys()));
    
    return uniqueViews;
  };

  // Nouvelle fonction pour nettoyer les doublons extrêmes
  const cleanDuplicateViews = (views) => {
    console.log('🧹 Nettoyage des doublons extrêmes...');
    
    // Si views est null ou undefined
    if (!views || !Array.isArray(views)) {
      console.log('⚠️ Views n\'est pas un tableau valide');
      return [];
    }
    
    // 1. Regrouper par ID utilisateur
    const groupedByUser = {};
    
    views.forEach((view, index) => {
      let userId;
      
      // Déterminer l'ID utilisateur
      if (view.userId) {
        if (typeof view.userId === 'object') {
          userId = view.userId._id || view.userId.id || JSON.stringify(view.userId);
        } else {
          userId = view.userId.toString();
        }
      } else if (view.user) {
        if (typeof view.user === 'object') {
          userId = view.user._id || view.user.id || JSON.stringify(view.user);
        } else {
          userId = view.user.toString();
        }
      } else {
        userId = `unknown-${index}`;
      }
      
      if (!groupedByUser[userId]) {
        groupedByUser[userId] = [];
      }
      groupedByUser[userId].push({ ...view, originalIndex: index });
    });
    
    // 2. Pour chaque utilisateur, garder seulement la vue la plus récente
    const cleanedViews = [];
    
    Object.keys(groupedByUser).forEach(userId => {
      const userViews = groupedByUser[userId];
      
      if (userViews.length === 1) {
        cleanedViews.push(userViews[0]);
      } else {
        console.log(`⚠️ ${userViews.length} doublons pour ${userId}`);
        
        // Trouver la vue la plus récente
        let mostRecent = userViews[0];
        userViews.forEach(view => {
          const currentDate = new Date(view.viewedAt || view.createdAt || 0);
          const mostRecentDate = new Date(mostRecent.viewedAt || mostRecent.createdAt || 0);
          
          if (currentDate > mostRecentDate) {
            mostRecent = view;
          }
        });
        
        cleanedViews.push(mostRecent);
        console.log(`✅ Gardé vue la plus récente pour ${userId}`);
      }
    });
    
    console.log('🧹 Après nettoyage:', cleanedViews.length, 'vues');
    
    return cleanedViews;
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `il y a ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `il y a ${diffDays} jour${diffDays !== 1 ? 's' : ''}`;
    }
  };

  useEffect(() => {
    if (currentStatus) {
      loadReactions();
      loadRepliesCount();
    }
  }, [currentStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
        setShowReactions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentStatus?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => {
          console.log('⚠️ Auto-play bloqué:', e);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
      
      videoRef.current.muted = isMuted;
    }
  }, [currentStatus, isPlaying, isMuted]);

  // AJOUT: Empêcher les appels multiples pour marquer la vue
  const lastStatusIdRef = useRef(null);
  const viewMarkedRef = useRef(false);

  useEffect(() => {
    if (!currentStatus) return;

    console.log('👁️ Traitement du statut:', currentStatus._id);
    
    // Si c'est le même statut et qu'on a déjà marqué la vue, ne pas re-marquer
    if (lastStatusIdRef.current === currentStatus._id && viewMarkedRef.current) {
      console.log('⏭️ Vue déjà marquée pour ce statut, skip');
      return;
    }
    
    // Réinitialiser pour nouveau statut
    if (lastStatusIdRef.current !== currentStatus._id) {
      viewMarkedRef.current = false;
      lastStatusIdRef.current = currentStatus._id;
    }
    
    if (!isMyStatus) {
      console.log('👁️ Marquage comme vu (pas mon statut)');
      
      // Empêcher les appels multiples avec un délai
      if (viewMarkedRef.current) {
        console.log('⏭️ Vue déjà marquée, skip');
        return;
      }
      
      fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/view`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          console.log('✅ Statut marqué comme vu');
          viewMarkedRef.current = true;
          onStatusUpdate?.();
        }
      })
      .catch(error => console.error('❌ Erreur marquage vue:', error));
    } else {
      console.log('👁️ Chargement des vues (mon statut)');
      loadViews();
    }
  }, [currentIndex, currentStatus]);

  const loadViews = async () => {
    if (!isMyStatus || !currentStatus) return;
    
    try {
      setLoadingViews(true);
      const token = localStorage.getItem('token');
      
      console.log('📡 Chargement des vues pour le statut:', currentStatus._id);
      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/views`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Données brutes de l\'API:', data);
        
        // Vérifier la structure des données
        let rawViews = data.views || data.viewers || data.data || [];
        
        if (!Array.isArray(rawViews)) {
          console.error('⚠️ Les vues ne sont pas un tableau:', rawViews);
          rawViews = [];
        }
        
        console.log('📊 Vues brutes:', rawViews.length, 'éléments');
        
        if (rawViews.length > 0) {
          console.log('🔍 Premier élément:', JSON.stringify(rawViews[0], null, 2));
        }
        
        // Nettoyage en plusieurs étapes
        let cleanedViews = rawViews;
        
        // Étape 1: Nettoyage de base
        cleanedViews = cleanDuplicateViews(cleanedViews);
        
        // Étape 2: Déduplication avancée
        cleanedViews = deduplicateViews(cleanedViews);
        
        // Étape 3: Vérification finale
        const userIds = cleanedViews.map(v => {
          if (typeof v.userId === 'object') return v.userId?._id || 'unknown-object';
          return v.userId || v.user || 'unknown';
        });
        
        const uniqueIds = [...new Set(userIds)];
        
        // Vérifier s'il y a encore des doublons
        if (uniqueIds.length !== cleanedViews.length) {
          console.warn('⚠️ Il reste encore des doublons potentiels');
          // Force la déduplication par ID unique
          const finalMap = new Map();
          cleanedViews.forEach(view => {
            let userId;
            if (typeof view.userId === 'object') {
              userId = view.userId?._id || 'unknown-object';
            } else {
              userId = view.userId || 'unknown';
            }
            finalMap.set(userId, view);
          });
          cleanedViews = Array.from(finalMap.values());
          console.log(`🔨 Forcé déduplication: ${cleanedViews.length} vues`);
        }
        
        setViews(cleanedViews);
        
      } else {
        console.error('❌ Erreur de réponse API:', response.status);
      }
    } catch (error) {
      console.error('💥 Erreur chargement vues:', error);
    } finally {
      setLoadingViews(false);
    }
  };

  // AJOUT: Fonction pour forcer le rechargement des vues
  const reloadViews = async () => {
    console.log('🔄 Rechargement forcé des vues');
    await loadViews();
  };

  const loadReactions = async () => {
    if (!currentStatus) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/reactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions || []);
        setReactionsSummary(data.reactionsSummary || {});
        setTotalReactions(data.totalReactions || 0);
        
        const userReaction = data.reactions?.find(
          r => r.userId === user?._id
        );
        setCurrentUserReaction(userReaction?.reaction || null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement réactions:', error);
    }
  };

  const loadRepliesCount = async () => {
    if (!currentStatus) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/replies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepliesCount(data.totalReplies || 0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement réponses:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    if (!currentStatus) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reactionType: currentUserReaction === reactionType ? null : reactionType 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUserReaction(data.reactionType);
        setReactionsSummary(data.reactionsSummary);
        setTotalReactions(data.totalReactions);
        setShowReactions(false);
        
        loadReactions();
      }
    } catch (error) {
      console.error('❌ Erreur réaction:', error);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !currentStatus) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: replyMessage.trim()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setReplyMessage('');
        setRepliesCount(data.repliesCount || repliesCount + 1);
        
        if (data.conversationId) {
          window.open(`/chat/${data.conversationId}`, '_blank');
        }
      }
    } catch (error) {
      console.error('❌ Erreur réponse:', error);
      alert('Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleDeleteCurrentStatus = async () => {
    if (!currentStatus) return;
    
    setShowOptions(false);
    
    if (!confirm('Voulez-vous vraiment supprimer cette story ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const updatedStatuses = userStatus.statuses.filter(s => s._id !== currentStatus._id);
        
        if (updatedStatuses.length === 0) {
          alert('✅ Story supprimée');
          onClose();
        } else {
          const newIndex = Math.min(currentIndex, updatedStatuses.length - 1);
          setCurrentIndex(newIndex);
          
          if (onDeleteStatus) {
            onDeleteStatus(currentStatus._id);
          }
        }
      } else {
        alert(`❌ Erreur: ${result.error || 'Impossible de supprimer la story'}`);
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
    
    if (showViews || !userStatus?.statuses?.length) return;

    const startTime = Date.now();
    const duration = currentStatus?.type === 'video' && videoRef.current 
      ? videoRef.current.duration * 1000 || 5000 
      : 5000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress < 100) {
        progressRef.current = requestAnimationFrame(updateProgress);
      } else {
        nextStatus();
      }
    };

    progressRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
    };
  }, [currentIndex, showViews, userStatus, currentStatus]);

  const nextStatus = () => {
    if (currentIndex < userStatus?.statuses?.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowViews(false);
      setIsPlaying(true);
      setShowOptions(false);
      setShowReactions(false);
      setReplyMessage('');
    } else {
      onClose();
    }
  };

  const prevStatus = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowViews(false);
      setIsPlaying(true);
      setShowOptions(false);
      setShowReactions(false);
      setReplyMessage('');
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextStatus();
      } else {
        prevStatus();
      }
    }
    setTouchStart(null);
  };

  const handleVideoEnded = () => {
    nextStatus();
  };

  const handleVideoClick = () => {
    if (currentStatus?.type === 'video') {
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // AJOUT: Effet pour recharger les vues quand on ouvre le modal des vues
  useEffect(() => {
    if (showViews && isMyStatus && currentStatus) {
      console.log('🔍 Ouverture modal vues, rechargement...');
      reloadViews();
    }
  }, [showViews, currentStatus]);

  if (!userStatus || !userStatus.statuses || userStatus.statuses.length === 0) {
    return null;
  }

  if (!currentStatus) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Barres de progression */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {userStatus.statuses.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full">
            <div 
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header avec infos utilisateur et flèche de retour */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center">
        {/* Flèche de retour à gauche */}
        <button 
          onClick={onClose}
          className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all mr-3"
          title="Retour"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center">
          <img 
            src={getAvatarUrl(userStatus.user, userStatus.user.name)}
            alt={userStatus.user.name}
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userStatus.user.name || "User"
              )}&background=3b82f6&color=fff&bold=true`;
            }}
          />
          <div className="ml-3">
            <h3 className="text-white font-medium text-sm">{userStatus.user.name}</h3>
            <p className="text-gray-300 text-xs">
              {formatTimeAgo(currentStatus.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Boutons d'actions (seulement si c'est mon statut) */}
        {isMyStatus && (
          <div className="relative" ref={optionsRef}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 w-48 animate-fade-in z-20">
                <button
                  onClick={handleDeleteCurrentStatus}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer </span>
                </button>
                
                <button
                  onClick={() => {
                    setShowViews(true);
                    setShowOptions(false);
                  }}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>
                    {views.length} vue{views.length !== 1 ? 's' : ''}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bouton vues (seulement si c'est mon statut) */}
        {isMyStatus && !showOptions && (
          <button 
            onClick={() => setShowViews(!showViews)}
            className="text-white bg-black bg-opacity-50 rounded-full p-2 ml-2 hover:bg-opacity-70 transition-all"
            title="Voir qui a vu votre story"
          >
            <Eye className="w-4 h-4" />
            {views.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {views.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Zone de réponse simple en bas - comme la première photo */}
      {!isMyStatus && !showViews && (
        <div className="absolute bottom-6 left-4 right-4 z-10">
          {/* Input de réponse toujours visible */}
          <div className="bg-transparent border-2 border-white/30 rounded-full p-1 flex items-center backdrop-blur-sm">
            <input
              ref={replyInputRef}
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Répondre..."
              className="flex-1 bg-transparent border-none rounded-full px-4 py-3 focus:outline-none text-white placeholder:text-white/70"
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
            />
            
            {/* Bouton smiley pour les réactions */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Réagir"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {showReactions && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-2xl p-2 flex gap-1 animate-scale-in">
                  {Object.entries(reactionIcons).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`p-2 rounded-full hover:scale-110 transition-transform text-xl ${
                        currentUserReaction === type ? 'bg-gray-200' : 'hover:bg-gray-100'
                      }`}
                      title={type.charAt(0).toUpperCase() + type.slice(1)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Bouton envoyer */}
            <button
              onClick={handleReply}
              disabled={!replyMessage.trim()}
              className={`p-2 rounded-full ml-1 transition-all ${
                replyMessage.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Envoyer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Réaction sélectionnée affichée */}
          {currentUserReaction && (
            <div className="mt-3 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                <span className="text-xl">{reactionIcons[currentUserReaction]}</span>
                <span className="text-white text-sm">Vous avez réagi avec {currentUserReaction}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pour mon propre statut, afficher seulement les compteurs en bas */}
      {isMyStatus && !showViews && (totalReactions > 0 || repliesCount > 0) && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center">
          <div className="flex items-center gap-4">
            {totalReactions > 0 && (
              <div className="text-white text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="flex items-center gap-1">
                  {Object.entries(reactionsSummary)
                    .filter(([type, count]) => count > 0 && type !== 'total')
                    .slice(0, 3)
                    .map(([type, count]) => (
                      <span key={type} className="mr-1">
                        {reactionIcons[type]} {count}
                      </span>
                    ))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boutons de navigation (flèches) */}
      {!showViews && !showOptions && !showReactions && (
        <>
          {/* Flèche gauche pour story précédente */}
          {currentIndex > 0 && (
            <button
              onClick={prevStatus}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-all z-10"
              title="Story précédente"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {/* Flèche droite pour story suivante */}
          {currentIndex < userStatus?.statuses?.length - 1 && (
            <button
              onClick={nextStatus}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition-all z-10"
              title="Story suivante"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </>
      )}

      {/* Contenu de la story OU liste des vues */}
      {showViews ? (
        <div className="bg-white rounded-lg w-80 max-h-96 overflow-hidden animate-scale-in">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Vues</h3>
              <p className="text-sm text-gray-500">
                {views.length} personne{views.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowViews(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loadingViews ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement des vues...</p>
              </div>
            ) : views.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">👁️</div>
                <p className="font-medium">Personne n'a vu votre story</p>
                <p className="text-sm mt-1">Elle sera visible pendant 24h</p>
              </div>
            ) : (
              <div>
                {views.map((view, index) => {
                  const userInfo = getUserInfo(view);
                  
                  return (
                    <div 
                      key={`view-${userInfo.id}-${view.viewedAt || index}`} 
                      className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <img 
                        src={userInfo.avatarUrl}
                        alt={userInfo.name}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userInfo.name
                          )}&background=3b82f6&color=fff&bold=true`;
                        }}
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-800">
                          {userInfo.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {view.reaction && (
                            <span className={`text-xs px-2 py-1 rounded-full ${reactionColors[view.reaction]}`}>
                              {reactionIcons[view.reaction]} Réagi
                            </span>
                          )}
                          {view.replyMessage && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                              <MessageCircle className="w-3 h-3 inline mr-1" />
                              Répondu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Vu à {view.viewedAt ? new Date(view.viewedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date inconnue'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowViews(false)}
            className="w-full p-3 bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            Retour à la story
          </button>
        </div>
      ) : (
        /* Contenu normal de la story */
        <div className="relative w-full h-full flex items-center justify-center mb-25">
          {currentStatus.type === 'text' ? (
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl max-w-md mx-4 animate-fade-in">
              <p className="text-white text-2xl text-center font-medium leading-relaxed">
                {currentStatus.content}
              </p>
            </div>
          ) : currentStatus.type === 'image' ? (
            <div 
              className="relative w-full h-full flex items-center justify-center cursor-pointer"
              onClick={handleVideoClick}
            >
              <img 
                src={getMediaUrl(currentStatus.mediaUrl || currentStatus.content) || '/default-image.png'} 
                alt="Statut photo"
                className="max-w-full max-h-full object-contain animate-fade-in"
                onError={(e) => {
                  console.error('❌ Erreur chargement image:', getMediaUrl(currentStatus.mediaUrl));
                  e.target.src = '/default-image.png';
                  e.target.className = 'max-w-full max-h-full object-contain animate-fade-in bg-gray-800 p-8';
                  e.target.alt = 'Image non chargée';
                }}
              />
            </div>
          ) : currentStatus.type === 'video' ? (
            <div 
              className="relative w-full h-full flex items-center justify-center bg-black"
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                src={getMediaUrl(currentStatus.mediaUrl)}
                className="max-w-full max-h-full object-contain animate-fade-in"
                controls={false}
                autoPlay
                playsInline
                muted={isMuted}
                onEnded={handleVideoEnded}
                onLoadedMetadata={(e) => {
                  console.log('📹 Vidéo chargée:', {
                    duration: e.target.duration,
                    width: e.target.videoWidth,
                    height: e.target.videoHeight
                  });
                }}
                onError={(e) => {
                  console.error('❌ Erreur chargement vidéo:', {
                    src: getMediaUrl(currentStatus.mediaUrl),
                    error: e.target.error
                  });
                }}
              >
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>

              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(!isPlaying);
                  }}
                  className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                🎥 Vidéo
              </div>

              {currentStatus.videoDuration && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(currentStatus.videoDuration)}
                </div>
              )}

              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(true);
                    }}
                    className="bg-white/20 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Play className="w-12 h-12" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Zones de navigation invisibles pour swipe */}
      {!showViews && !showOptions && !showReactions && (
        <div className="absolute inset-0 flex">
          <div 
            className="flex-1 cursor-pointer" 
            onClick={prevStatus}
            title="Story précédente"
          />
          <div 
            className="flex-1 cursor-pointer" 
            onClick={nextStatus}
            title="Story suivante"
          />
        </div>
      )}
    </div>
  );
};

export default StatusView;