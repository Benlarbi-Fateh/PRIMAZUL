'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001';

const StatusList = () => {
  const [allStatuses, setAllStatuses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Récupérer l'ID utilisateur - essayer différentes propriétés
  const currentUserId = user?.id?.toString() || user?._id?.toString();

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/status/friends`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllStatuses(data);
      } else {
        setError(`Erreur ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur récupération statuts:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
    
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer les statuts
  const myStatuses = allStatuses.filter(status => {
    const statusOwnerId = status.userId?._id?.toString();
    return statusOwnerId === currentUserId;
  });

  const contactStatuses = allStatuses.filter(status => {
    const statusOwnerId = status.userId?._id?.toString();
    return statusOwnerId !== currentUserId;
  });

  // Grouper les statuts des contacts
  const groupedContactStatuses = contactStatuses.reduce((acc, status) => {
    const userId = status.userId?._id?.toString();
    if (!userId) return acc;
    
    if (!acc[userId]) {
      acc[userId] = {
        user: status.userId,
        statuses: [],
        hasUnviewed: false
      };
    }
    
    const hasViewed = status.views && status.views.some(view => 
      view.userId && view.userId._id?.toString() === currentUserId
    );
    
    if (!hasViewed) {
      acc[userId].hasUnviewed = true;
    }

    acc[userId].statuses.push(status);
    return acc;
  }, {});

  const contactStatusesGrouped = Object.values(groupedContactStatuses);

  // Trier les statuts - MODIFICATION PRINCIPALE ICI
  contactStatusesGrouped.forEach(userStatus => {
    // Anciens en premier : tri ascendant (du plus vieux au plus récent)
    userStatus.statuses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  });

  // Trier les statuts personnels aussi : anciens en premier
  const mySortedStatuses = [...myStatuses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const hasMyStatuses = myStatuses.length > 0;

  // Trier les groupes d'utilisateurs par le statut le plus ancien
  const sortedContactStatusesGrouped = [...contactStatusesGrouped].sort((a, b) => {
    const aOldest = a.statuses.length > 0 ? new Date(a.statuses[0].createdAt) : new Date(0);
    const bOldest = b.statuses.length > 0 ? new Date(b.statuses[0].createdAt) : new Date(0);
    return aOldest - bOldest; // Anciens en premier
  });

  // Composants modals
  const StatusView = React.lazy(() => import('./StatusView.jsx'));
  const CreateStatus = React.lazy(() => import('./CreateStatus'));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header simple */}
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

      {/* SECTION 1 : MON STATUT */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all group">
          <div 
            className="relative"
            onClick={() => {
              if (hasMyStatuses) {
                setSelectedUser({
                  user: user,
                  statuses: mySortedStatuses // Utiliser le tableau trié
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
          
          <div 
            className="ml-4 flex-1"
            onClick={() => {
              if (hasMyStatuses) {
                setSelectedUser({
                  user: user,
                  statuses: mySortedStatuses // Utiliser le tableau trié
                });
              } else {
                setShowCreate(true);
              }
            }}
          >
            <h3 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors">
              Mon statut
            </h3>
            <p className="text-sm text-gray-500">
              {hasMyStatuses ? 
                `${myStatuses.length} statut${myStatuses.length > 1 ? 's' : ''} • Ajouter` : 
                'Ajouter un statut'
              }
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2 : STATUTS RÉCENTS */}
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
              Vos contacts n'ont pas encore publié de statuts
            </p>
          </div>
        ) : (
          sortedContactStatusesGrouped.map((userStatus) => ( // Utiliser sortedContactStatusesGrouped
            <div 
              key={userStatus.user._id}
              className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer mb-2 transition-all"
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
                    src={userStatus.user.profilePicture || '/default-avatar.png'} 
                    alt={userStatus.user.name}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userStatus.user.name || "User"
                      )}&background=3b82f6&color=fff&bold=true`;
                    }}
                  />
                </div>
                {userStatus.hasUnviewed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">{userStatus.user.name}</h3>
                <p className="text-sm text-gray-500">
                  {userStatus.statuses.length} statut{userStatus.statuses.length > 1 ? 's' : ''}
                  {userStatus.hasUnviewed && ' • Nouveau'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
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