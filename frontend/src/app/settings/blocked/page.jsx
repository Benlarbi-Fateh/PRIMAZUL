'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainSidebar from '@/components/Layout/MainSidebar.client';
import { useTheme } from '@/hooks/useTheme';
import { Search, UserX, ArrowLeft, Shield, AlertCircle, Loader, Unlock } from 'lucide-react';
import api from '@/lib/api';

export default function BlockedContactsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Charger les utilisateurs bloqués au démarrage
  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // Rechercher des utilisateurs quand la query change
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setAvailableUsers([]);
    }
  }, [searchQuery]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/message-settings/blocked');
      
      if (response.data.success) {
        setBlockedUsers(response.data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Erreur chargement bloqués:', error);
      alert('Erreur lors du chargement des contacts bloqués');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
  try {
    setSearching(true);
    
    // ✅ Utiliser la nouvelle route de recherche
    const response = await api.get('/profile/search', {
      params: { query: searchQuery }
    });
    
    if (response.data.success) {
      // Filtrer les utilisateurs déjà bloqués
      const filtered = response.data.users.filter(
        user => !blockedUsers.some(blocked => blocked._id === user._id)
      );
      setAvailableUsers(filtered);
    }
  } catch (error) {
    console.error('Erreur recherche:', error);
    setAvailableUsers([]);
  } finally {
    setSearching(false);
  }
};

  const handleBlock = async (userId) => {
    const user = availableUsers.find(u => u._id === userId);
    if (!confirm(`Bloquer ${user?.name} ?\n\n⚠️ Il sera retiré de vos contacts et ne pourra plus vous contacter.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      
      const response = await api.post('/message-settings/block', {
        targetUserId: userId
      });

      if (response.data.success) {
        alert(`✅ ${user?.name} a été bloqué`);
        await fetchBlockedUsers();
        setSearchQuery('');
        setAvailableUsers([]);
        
        // Émettre événement de blocage
        window.dispatchEvent(new CustomEvent('block-status-changed'));
      }
    } catch (error) {
      console.error('Erreur blocage:', error);
      alert('Erreur lors du blocage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userId) => {
  const user = blockedUsers.find(u => u._id === userId);
  
  // 🔥 MESSAGE DE CONFIRMATION AMÉLIORÉ
  if (!confirm(`Débloquer ${user?.name} ?

💡 Important :
- ${user?.name} ne sera PAS automatiquement rajouté à vos contacts
- Vous devrez lui renvoyer une invitation depuis l'onglet "Contacts"
- La conversation réapparaîtra après acceptation de l'invitation`)) {
    return;
  }

  try {
    setActionLoading(userId);
    
    const response = await api.post('/message-settings/unblock', {
      targetUserId: userId
    });

    if (response.data.success) {
      // 🔥 MESSAGE DE SUCCÈS AMÉLIORÉ
      alert(`✅ ${user?.name} a été débloqué

📋 Prochaines étapes :
1. Allez dans l'onglet "Contacts" → "Ajouter"
2. Recherchez "${user?.name}"
3. Cliquez sur "Inviter"
4. Une fois l'invitation acceptée, la conversation réapparaîtra

💡 Astuce : La conversation n'a pas été supprimée, elle est juste masquée temporairement`);
      
      await fetchBlockedUsers();
      
      // Émettre événement de déblocage
      window.dispatchEvent(new CustomEvent('block-status-changed'));
    }
  } catch (error) {
    console.error('Erreur déblocage:', error);
    alert('Erreur lors du déblocage');
  } finally {
    setActionLoading(null);
  }
};

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-sky-50 to-slate-50'}`}>
        <MainSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className={`border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'hover:bg-slate-700 text-slate-300' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Contacts bloqués
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Gérez vos contacts bloqués
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Section recherche pour bloquer */}
              <div className={`rounded-2xl p-6 border ${
                isDark 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Bloquer un contact
                  </h2>
                </div>
                
                {/* Barre de recherche */}
                <div className="relative mb-4">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur à bloquer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500'
                    }`}
                  />
                  {searching && (
                    <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
                  )}
                </div>

                {/* Résultats de recherche */}
                {searchQuery && (
  <div className="space-y-2 max-h-64 overflow-y-auto">
    {availableUsers.length > 0 ? (
      availableUsers.map(user => (
        <div
          key={user._id}
          className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
            isDark
              ? 'hover:bg-slate-700'
              : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* ✅ AJOUT : Photo de profil */}
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=0ea5e9&color=fff&bold=true`;
                }}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                isDark ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {user.name[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user.name}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleBlock(user._id)}
            disabled={actionLoading === user._id}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {actionLoading === user._id ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <UserX className="w-4 h-4" />
            )}
            Bloquer
          </button>
        </div>
      ))
    ) : (
      <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {searching ? 'Recherche...' : 'Aucun utilisateur trouvé'}
      </p>
    )}
  </div>
)}
              </div>
              
              {/* Liste des contacts bloqués */}
<div className={`rounded-2xl p-6 border ${
  isDark 
    ? 'bg-slate-800 border-slate-700' 
    : 'bg-white border-slate-200'
}`}>
  <div className="flex items-center gap-3 mb-4">
    <UserX className="w-5 h-5 text-red-500" />
    <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
      Contacts bloqués ({blockedUsers.length})
    </h2>
  </div>

  {loading ? (
    <div className="flex items-center justify-center py-12">
      <Loader className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ) : blockedUsers.length > 0 ? (
    <div className="space-y-2">
      {blockedUsers.map(user => (
        <div
          key={user._id}
          className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
            isDark
              ? 'bg-slate-700/50 hover:bg-slate-700'
              : 'bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* ✅ AJOUT : Photo de profil */}
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=0ea5e9&color=fff&bold=true`;
                }}
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                isDark ? 'bg-slate-600 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                {user.name[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user.name}
              </p>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {user.email}
              </p>
              {/* ✅ AJOUT : Date de blocage */}
              {user.blockedAt && (
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Bloqué le {new Date(user.blockedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => handleUnblock(user._id)}
            disabled={actionLoading === user._id}
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {actionLoading === user._id ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            Débloquer
          </button>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-12">
      <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${
        isDark ? 'text-slate-600' : 'text-slate-400'
      }`} />
      <p className={`text-lg font-medium mb-1 ${
        isDark ? 'text-slate-300' : 'text-slate-600'
      }`}>
        Aucun contact bloqué
      </p>
      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        Vous n'avez bloqué aucun utilisateur
      </p>
    </div>
  )}
</div>

            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}