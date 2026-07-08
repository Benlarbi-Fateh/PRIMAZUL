'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Search, UserPlus, Loader2, Check } from 'lucide-react';
import api from '@/lib/api';

export default function AddMembersModal({ groupId, existingMembers, onClose, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // Rechercher des utilisateurs
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setSearchLoading(true);
        console.log('🔍 Recherche utilisateurs:', searchQuery);
       const response = await api.get(`/profile/search?query=${searchQuery}`);
        console.log('📦 Réponse API:', response.data);
        if (response.data.success) {
          // Filtrer les utilisateurs déjà dans le groupe
          const existingIds = existingMembers.map(m => m._id.toString());
          const filtered = response.data.users.filter(
            u => !existingIds.includes(u._id.toString())
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('❌ Erreur recherche:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, existingMembers]);

  // Toggle sélection
  const toggleSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Ajouter les membres sélectionnés
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      alert('❌ Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      setAddingMembers(true);
      
      const response = await api.post('/groups/add-participants', {
        groupId,
        participantIds: selectedUsers
      });

      if (response.data.success) {
        alert(`✅ ${selectedUsers.length} membre(s) ajouté(s)`);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('❌ Erreur ajout:', error);
      alert('❌ ' + (error.response?.data?.error || 'Erreur lors de l\'ajout'));
    } finally {
      setAddingMembers(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-blue-600" />
              Ajouter des membres
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedUsers.length} membre(s) sélectionné(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un contact..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Liste des résultats */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : searchResults.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-8 text-gray-500">
              Aucun contact trouvé
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Recherchez un contact à ajouter
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => {
                const isSelected = selectedUsers.includes(user._id);
                
                return (
                  <button
                    key={user._id}
                    onClick={() => toggleSelection(user._id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      <Image
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff`}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer avec boutons */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0 || addingMembers}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {addingMembers ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Ajouter {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
