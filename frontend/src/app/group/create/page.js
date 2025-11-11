'use client'

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { searchUsers, createGroup } from '@/lib/api';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { Users, Search, X, ArrowLeft, Check } from 'lucide-react';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Recherche d'utilisateurs
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await searchUsers(searchQuery);
        const results = response.data.users || [];
        
        // Filtrer l'utilisateur actuel
        const filtered = results.filter(u => u._id !== (user._id || user.id));
        setSearchResults(filtered);
      } catch (error) {
        console.error('❌ Erreur recherche:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery, user]);

  const toggleUserSelection = (selectedUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === selectedUser._id);
      if (isSelected) {
        return prev.filter(u => u._id !== selectedUser._id);
      }
      return [...prev, selectedUser];
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Veuillez entrer un nom de groupe');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Veuillez sélectionner au moins un participant');
      return;
    }

    try {
      setCreating(true);
      
      const participantIds = selectedUsers.map(u => u._id);
      
      const response = await createGroup({
        groupName: groupName.trim(),
        participantIds
      });

      console.log('✅ Groupe créé:', response.data.group);
      
      // Rediriger vers la conversation du groupe
      router.push(`/chat/${response.data.group._id}`);
      
    } catch (error) {
      console.error('❌ Erreur création groupe:', error);
      alert('Erreur lors de la création du groupe');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-b from-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-full hover:bg-white transition"
            >
              <ArrowLeft className="w-6 h-6 text-blue-600" />
            </button>
            <h1 className="text-2xl font-bold text-blue-900">Créer un groupe</h1>
          </div>

          {/* Nom du groupe */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Nom du groupe
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Famille, Amis, Travail..."
              className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              maxLength={50}
            />
            <p className="text-xs text-blue-600 mt-2">{groupName.length}/50</p>
          </div>

          {/* Participants sélectionnés */}
          {selectedUsers.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                Participants sélectionnés ({selectedUsers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(u => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-full"
                  >
                    <span className="text-sm font-medium">{u.name}</span>
                    <button
                      onClick={() => toggleUserSelection(u)}
                      className="hover:bg-blue-200 rounded-full p-1 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recherche d'utilisateurs */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des utilisateurs..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Résultats */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-center text-blue-600 py-4">Recherche...</p>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p className="text-center text-blue-600 py-4">Aucun utilisateur trouvé</p>
              ) : (
                searchResults.map(u => {
                  const isSelected = selectedUsers.some(su => su._id === u._id);
                  return (
                    <button
                      key={u._id}
                      onClick={() => toggleUserSelection(u)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                        isSelected
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'hover:bg-blue-50 border-2 border-transparent'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0ea5e9&color=fff`}
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-blue-900">{u.name}</p>
                        <p className="text-sm text-blue-600">{u.email}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-6 h-6 text-blue-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Bouton Créer */}
          <button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
            className="w-full mt-6 py-4 bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Créer le groupe
              </>
            )}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}