'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Heart, MessageCircle, ThumbsUp } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5001';

const StatusList = () => {
  const [allStatuses, setAllStatuses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const currentUserId = user?.id?.toString() || user?._id?.toString();

  // 🔍 Debug useEffect
  useEffect(() => {
    console.log('🔍 allStatuses mis à jour:', {
      valeur: allStatuses,
      type: typeof allStatuses,
      estTableau: Array.isArray(allStatuses),
      longueur: Array.isArray(allStatuses) ? allStatuses.length : 'N/A'
    });
  }, [allStatuses]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vous devez être connecté');
        setAllStatuses([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/status/friends`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 Réponse status/friends:', {
        status: response.status,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Données reçues de l\'API:', data);
        
        // ✅ Extraction sécurisée du tableau de statuts
        let statusesArray = [];
        
        if (Array.isArray(data)) {
          statusesArray = data;
        } else if (data && Array.isArray(data.statuses)) {
          statusesArray = data.statuses;
        } else if (data && Array.isArray(data.data)) {
          statusesArray = data.data;
        } else if (data && data.success && Array.isArray(data.statuses)) {
          statusesArray = data.statuses;
        } else if (data && data.success && Array.isArray(data.data)) {
          statusesArray = data.data;
        } else if (data && data.statuses) {
          // Si data.statuses existe mais n'est pas un tableau
          statusesArray = Array.isArray(data.statuses) ? data.statuses : [];
        }
        
        console.log(`✅ ${statusesArray.length} statuts chargés`);
        setAllStatuses(statusesArray);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API:', errorText);
        setError(`Erreur ${response.status}: ${errorText}`);
        setAllStatuses([]);
      }
    } catch (error) {
      console.error('❌ Erreur récupération statuts:', error);
      setError('Erreur de connexion au serveur');
      setAllStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
    
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteStatus = async (statusId, e) => {
    if (e) e.stopPropagation();
    
    if (!confirm('Voulez-vous vraiment supprimer ce statut ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/status/${statusId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        await fetchStatuses();
        
        if (selectedUser && selectedUser.statuses.some(s => s._id === statusId)) {
          const updatedStatuses = selectedUser.statuses.filter(s => s._id !== statusId);
          if (updatedStatuses.length === 0) {
            setSelectedUser(null);
          } else {
            setSelectedUser(prev => ({
              ...prev,
              statuses: updatedStatuses
            }));
          }
        }
        
        alert('✅ Statut supprimé avec succès');
      } else {
        alert(`❌ Erreur: ${result.error || 'Impossible de supprimer le statut'}`);
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // ✅ Utilisation sécurisée avec vérification de tableau
  const safeAllStatuses = Array.isArray(allStatuses) ? allStatuses : [];

  const myStatuses = safeAllStatuses.filter(status => {
    const statusOwnerId = status?.userId?._id?.toString() || status?.userId?.toString();
    return statusOwnerId === currentUserId;
  });

  const contactStatuses = safeAllStatuses.filter(status => {
    const statusOwnerId = status?.userId?._id?.toString() || status?.userId?.toString();
    return statusOwnerId !== currentUserId;
  });

  const groupedContactStatuses = contactStatuses.reduce((acc, status) => {
    const userId = status?.userId?._id?.toString() || status?.userId?.toString();
    if (!userId) return acc;
    
    if (!acc[userId]) {
      acc[userId] = {
        user: status.userId || { name: 'Utilisateur inconnu' },
        statuses: [],
        hasUnviewed: false,
        totalReactions: 0,
        totalReplies: 0
      };
    }
    
    const hasViewed = status.views && status.views.some(view => {
      const viewerId = view?.userId?._id?.toString() || view?.userId?.toString();
      return viewerId === currentUserId;
    });
    
    if (!hasViewed) {
      acc[userId].hasUnviewed = true;
    }

    acc[userId].statuses.push(status);
    acc[userId].totalReactions += status.totalReactions || 0;
    acc[userId].totalReplies += status.repliesCount || 0;
    
    return acc;
  }, {});

  const contactStatusesGrouped = Object.values(groupedContactStatuses);

  contactStatusesGrouped.forEach(userStatus => {
    userStatus.statuses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  });

  const mySortedStatuses = [...myStatuses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const hasMyStatuses = myStatuses.length > 0;
  const latestMyStatus = hasMyStatuses ? mySortedStatuses[mySortedStatuses.length - 1] : null;

  const sortedContactStatusesGrouped = [...contactStatusesGrouped].sort((a, b) => {
    const aOldest = a.statuses.length > 0 ? new Date(a.statuses[0].createdAt) : new Date(0);
    const bOldest = b.statuses.length > 0 ? new Date(b.statuses[0].createdAt) : new Date(0);
    return aOldest - bOldest;
  });

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

  const StatusView = React.lazy(() => import('./StatusView.jsx'));
  const CreateStatus = React.lazy(() => import('./CreateStatus'));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Statuts</h2>
      </div>

      {error && (
        <div className="p-4 border-b border-red-100 bg-red-50">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchStatuses}
            className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Votre statut */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-all group border border-gray-200 shadow-sm hover:shadow-md">
          <div 
            className="relative"
            onClick={() => {
              if (hasMyStatuses) {
                setSelectedUser({
                  user: user,
                  statuses: mySortedStatuses
                });
              } else {
                setShowCreate(true);
              }
            }}
          >
            <div className={`w-14 h-14 rounded-full p-0.5 ${
              hasMyStatuses 
                ? 'border-2 border-green-500' 
                : 'border-2 border-gray-300'
            } group-hover:border-green-600 transition-colors`}>
              <img 
                src={user?.profilePicture || '/default-avatar.png'} 
                alt="Votre avatar"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}&background=3b82f6&color=fff&bold=true`;
                }}
              />
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreate(true);
              }}
              className="absolute -bottom-1 -right-1 bg-green-500 hover:bg-green-600 rounded-full p-1.5 transition-colors shadow-md"
              title="Ajouter un statut"
            >
              <span className="text-white text-xs font-bold block w-4 h-4 flex items-center justify-center">+</span>
            </button>
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                Mon statut
              </h3>
              
              {hasMyStatuses && (
                <span className="text-xs text-gray-500">
                  {myStatuses.length} statut{myStatuses.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Afficher les réactions et réponses de mes statuts */}
            {hasMyStatuses && (
              <div className="flex items-center gap-2 mt-1">
                {myStatuses.reduce((total, status) => total + (status.totalReactions || 0), 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{myStatuses.reduce((total, status) => total + (status.totalReactions || 0), 0)}</span>
                  </div>
                )}
                {myStatuses.reduce((total, status) => total + (status.repliesCount || 0), 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <MessageCircle className="w-3 h-3" />
                    <span>{myStatuses.reduce((total, status) => total + (status.repliesCount || 0), 0)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statuts des contacts */}
      <div className="p-4">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Statuts récents ({sortedContactStatusesGrouped.length})
        </h4>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Chargement des statuts...</p>
          </div>
        ) : sortedContactStatusesGrouped.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-gray-500">Aucun statut disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              {safeAllStatuses.length === 0 
                ? "Aucun statut chargé. Essayez de vous reconnecter."
                : "Vos contacts n'ont pas encore publié de statuts"}
            </p>
            <button
              onClick={fetchStatuses}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              Actualiser
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedContactStatusesGrouped.map((userStatus) => {
              const latestStatus = userStatus.statuses[userStatus.statuses.length - 1];
              const totalReactions = userStatus.totalReactions;
              const totalReplies = userStatus.totalReplies;

              return (
                <div 
                  key={userStatus.user?._id || userStatus.user?.id || Math.random()}
                  className="flex items-center p-4 hover:bg-gray-50 rounded-lg cursor-pointer mb-2 transition-all relative group border border-gray-200 shadow-sm hover:shadow-md"
                  onClick={() => {
                    setSelectedUser(userStatus);
                  }}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full p-0.5 ${
                      userStatus.hasUnviewed 
                        ? 'border-2 border-green-500' 
                        : 'border border-gray-300'
                    }`}>
                      <img 
                        src={userStatus.user?.profilePicture || '/default-avatar.png'} 
                        alt={userStatus.user?.name || 'Contact'}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            userStatus.user?.name || "User"
                          )}&background=3b82f6&color=fff&bold=true`;
                        }}
                      />
                    </div>
                    {userStatus.hasUnviewed && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {userStatus.user?.name || 'Contact'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {userStatus.statuses.length} statut{userStatus.statuses.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Indicateurs de réactions et réponses */}
                    {(totalReactions > 0 || totalReplies > 0) && (
                      <div className="flex items-center gap-2 mt-1">
                        {totalReactions > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <ThumbsUp className="w-2.5 h-2.5" />
                            <span>{totalReactions}</span>
                          </div>
                        )}
                        {totalReplies > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <MessageCircle className="w-2.5 h-2.5" />
                            <span>{totalReplies}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <React.Suspense fallback={
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      }>
        {selectedUser && (
          <StatusView 
            userStatus={selectedUser}
            onClose={() => {
              setSelectedUser(null);
              fetchStatuses();
            }}
            onStatusUpdate={fetchStatuses}
            onDeleteStatus={handleDeleteStatus}
          />
        )}

        {showCreate && (
          <CreateStatus 
            onClose={() => setShowCreate(false)}
            onStatusCreated={() => {
              fetchStatuses();
              setShowCreate(false);
            }}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default StatusList;