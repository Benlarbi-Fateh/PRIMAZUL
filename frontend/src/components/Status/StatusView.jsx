'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001';

const StatusView = ({ userStatus, onClose, onStatusUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [showViews, setShowViews] = useState(false);
  const [views, setViews] = useState([]);
  const [loadingViews, setLoadingViews] = useState(false);
  const { user } = useAuth();
  const progressRef = useRef();

  const currentStatus = userStatus?.statuses?.[currentIndex];
  const isMyStatus = userStatus?.user?._id === user?._id;

  // DEBUG: Afficher les infos
  console.log('🔍 StatusView - Informations:');
  console.log('   - UserStatus:', userStatus);
  console.log('   - isMyStatus:', isMyStatus);
  console.log('   - Current user ID:', user?._id);
  console.log('   - Status owner ID:', userStatus?.user?._id);
  console.log('   - Total statuses:', userStatus?.statuses?.length);
  console.log('   - Current index:', currentIndex);
  console.log('   - Current status:', currentStatus);

  // Marquer comme vu et charger les vues si c'est mon statut
  useEffect(() => {
    if (!currentStatus) return;

    console.log('👁️ Traitement du statut:', currentStatus._id);
    
    if (!isMyStatus) {
      // Marquer comme vu si ce n'est pas mon statut
      console.log('👁️ Marquage comme vu (pas mon statut)');
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
          onStatusUpdate?.();
        }
      })
      .catch(error => console.error('❌ Erreur marquage vue:', error));
    } else {
      // Charger les vues si c'est mon statut
      console.log('👁️ Chargement des vues (mon statut)');
      loadViews();
    }
  }, [currentIndex, currentStatus]);

  const loadViews = async () => {
    if (!isMyStatus || !currentStatus) return;
    
    try {
      setLoadingViews(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/status/${currentStatus._id}/views`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setViews(data.views);
      }
    } catch (error) {
      console.error('💥 Erreur chargement vues:', error);
    } finally {
      setLoadingViews(false);
    }
  };

  // Progression automatique
  useEffect(() => {
    setProgress(0);
    if (showViews || !userStatus?.statuses?.length) return;

    const startTime = Date.now();
    const duration = 5000;

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
  }, [currentIndex, showViews, userStatus]);

  const nextStatus = () => {
    if (currentIndex < userStatus?.statuses?.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowViews(false);
    } else {
      onClose();
    }
  };

  const prevStatus = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowViews(false);
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

  if (!userStatus || !userStatus.statuses || userStatus.statuses.length === 0) {
    console.log('❌ StatusView - Pas de statuts à afficher');
    return null;
  }

  if (!currentStatus) {
    console.log('❌ StatusView - Statut courant non trouvé');
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

      {/* Header avec infos utilisateur */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center">
        <img 
          src={userStatus.user.profilePicture || '/default-avatar.png'} 
          alt={userStatus.user.name}
          className="w-8 h-8 rounded-full"
        />
        <div className="ml-3 flex-1">
          <h3 className="text-white font-medium">{userStatus.user.name}</h3>
          <p className="text-gray-300 text-xs">
            {new Date(currentStatus.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Bouton vues pour mes propres statuts */}
        {isMyStatus && (
          <button 
            onClick={() => setShowViews(!showViews)}
            className="text-white bg-black bg-opacity-50 rounded-full p-2 mr-2 hover:bg-opacity-70 transition-all"
            title="Voir qui a vu votre story"
          >
            <span className="text-xs font-medium flex items-center gap-1">
              👁️ <span>{currentStatus.views?.length || 0}</span>
            </span>
          </button>
        )}

        <button 
          onClick={onClose}
          className="text-white text-2xl hover:opacity-80 transition-opacity"
        >
          ✕
        </button>
      </div>

      {/* Contenu de la story OU liste des vues */}
      {showViews ? (
        <div className="bg-white rounded-lg w-80 max-h-96 overflow-hidden animate-scale-in">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Vues</h3>
            <p className="text-sm text-gray-500">
              {views.length} personne{views.length !== 1 ? 's' : ''}
            </p>
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
              views.map((view, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <img 
                    src={view.userId.profilePicture || '/default-avatar.png'} 
                    alt={view.userId.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-800">{view.userId.name}</p>
                    <p className="text-xs text-gray-500">
                      Vu à {new Date(view.viewedAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => setShowViews(false)}
            className="w-full p-3 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors border-t border-gray-200"
          >
            Retour à la story
          </button>
        </div>
      ) : (
        /* Contenu normal de la story */
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStatus.type === 'text' ? (
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl max-w-md mx-4 animate-fade-in">
              <p className="text-white text-2xl text-center font-medium leading-relaxed">
                {currentStatus.content}
              </p>
            </div>
          ) : (
            <img 
              src={currentStatus.content} 
              alt="Story"
              className="max-w-full max-h-full object-contain animate-fade-in"
            />
          )}
        </div>
      )}

      {/* Zones de navigation invisibles (seulement quand on ne voit pas les vues) */}
      {!showViews && (
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