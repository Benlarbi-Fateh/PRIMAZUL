'use client'

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthProvider';
import { searchUsers, createGroup } from '@/lib/api';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { Users, Search, X, ArrowLeft, Check, Sparkles, UserPlus, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function CreateGroupPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // 🆕 Calcul du nombre total de participants (créateur inclus)
  const totalParticipants = selectedUsers.length + 1; // +1 pour le créateur

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
    setError(''); // Effacer l'erreur quand l'utilisateur modifie la sélection
  };

  const handleCreateGroup = async () => {
    setError('');

    if (!groupName.trim()) {
      setError('Veuillez entrer un nom de groupe');
      return;
    }

    // 🆕 VÉRIFICATION : Minimum 2 participants sélectionnés (créateur + 2 autres = 3 personnes)
    if (selectedUsers.length < 2) {
      setError('Vous devez sélectionner au moins 2 autres personnes pour créer un groupe');
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
      router.push(`/chat/${response.data.group._id}`);
      
    } catch (error) {
      console.error('❌ Erreur création groupe:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création du groupe';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
        {/* Background décoratif */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-3xl mx-auto p-4 sm:p-6 relative z-10">
          
          {/* Header moderne */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/')}
                className="p-3 rounded-2xl bg-white hover:bg-blue-50 border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-105 active:scale-95 shadow-md"
              >
                <ArrowLeft className="w-6 h-6 text-blue-600" />
              </button>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Créer un groupe
                </h1>
                <p className="text-blue-600 mt-1 ml-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Réunissez vos amis en un seul endroit
                </p>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 animate-shake">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Carte: Nom du groupe */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-blue-100 mb-6 animate-slide-in-left hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <label className="text-lg font-bold text-blue-900">
                Nom du groupe
              </label>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-sm group-focus-within:blur-md transition-all"></div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Famille, Amis, Travail..."
                className="relative w-full px-5 py-4 rounded-2xl border-2 border-blue-200 focus:ring-4 focus:ring-blue-300 focus:border-blue-400 outline-none text-blue-900 placeholder-blue-400 font-medium bg-white transition-all"
                maxLength={50}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${groupName.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-blue-300'}`}></span>
                {groupName.length > 0 ? 'Nom valide !' : 'Donnez un nom à votre groupe'}
              </p>
              <p className={`text-sm font-bold ${groupName.length > 40 ? 'text-orange-500' : 'text-blue-600'}`}>
                {groupName.length}/50
              </p>
            </div>
          </div>

          {/* Participants sélectionnés */}
          {selectedUsers.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-purple-100 mb-6 animate-scale-in hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {totalParticipants}
                  </div>
                  Participants ({totalParticipants} au total)
                </h3>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-sm text-red-500 hover:text-red-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Tout supprimer
                </button>
              </div>
              
              {/* 🆕 Affichage du créateur */}
              <div className="mb-4">
                <p className="text-sm text-purple-700 font-medium mb-2">Créateur du groupe :</p>
                <div className="flex items-center gap-2 bg-linear-to-r from-green-100 to-emerald-100 text-green-900 px-4 py-2.5 rounded-full border-2 border-green-200 max-w-max">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true&size=32`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full ring-2 ring-white shadow-sm"
                  />
                  <span className="text-sm font-bold">{user.name} (Vous)</span>
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              {/* Participants sélectionnés */}
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(u => (
                  <div
                    key={u._id}
                    className="group flex items-center gap-2 bg-linear-to-r from-purple-100 to-pink-100 text-purple-900 px-4 py-2.5 rounded-full border-2 border-purple-200 hover:border-purple-400 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=a855f7&color=fff&bold=true&size=32`}
                      alt={u.name}
                      className="w-6 h-6 rounded-full ring-2 ring-white shadow-sm"
                    />
                    <span className="text-sm font-bold">{u.name}</span>
                    <button
                      onClick={() => toggleUserSelection(u)}
                      className="ml-1 hover:bg-purple-200 rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 🆕 Indicateur de progression */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-700 font-medium">
                    {selectedUsers.length >= 2 ? '✅ Minimum atteint' : `Encore ${2 - selectedUsers.length} personne(s) à sélectionner`}
                  </span>
                  <span className="text-purple-600 font-bold">
                    {selectedUsers.length}/2 minimum
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-linear-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((selectedUsers.length / 2) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Recherche d'utilisateurs */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-blue-100 animate-slide-in-right hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-900">
                Ajouter des participants
              </h3>
            </div>

            <div className="relative mb-5 group">
              <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-sm group-focus-within:blur-md transition-all"></div>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des utilisateurs..."
                className="relative w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-blue-200 focus:ring-4 focus:ring-blue-300 focus:border-blue-400 outline-none text-blue-900 placeholder-blue-400 font-medium bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Résultats */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-600 font-medium">Recherche en cours...</span>
                  </div>
                </div>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-blue-600 font-medium">Aucun utilisateur trouvé</p>
                  <p className="text-sm text-blue-400 mt-1">Essayez avec un autre nom ou email</p>
                </div>
              ) : searchQuery.length < 2 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-blue-600 font-medium">Commencez à taper...</p>
                  <p className="text-sm text-blue-400 mt-1">Recherchez par nom ou email</p>
                </div>
              ) : (
                searchResults.map(u => {
                  const isSelected = selectedUsers.some(su => su._id === u._id);
                  return (
                    <button
                      key={u._id}
                      onClick={() => toggleUserSelection(u)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all transform hover:scale-[1.02] ${
                        isSelected
                          ? 'bg-linear-to-r from-blue-100 to-cyan-100 border-2 border-blue-500 shadow-lg'
                          : 'hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=3b82f6&color=fff&bold=true&size=48`}
                        alt={u.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-md"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-bold text-blue-900">{u.name}</p>
                        <p className="text-sm text-blue-600">{u.email}</p>
                      </div>
                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
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
            disabled={creating || !groupName.trim() || selectedUsers.length < 2}
            className="w-full mt-8 group relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white py-5 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center gap-3"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {creating ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="animate-pulse">Création en cours...</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span>Créer le groupe ({totalParticipants} personnes)</span>
                <Sparkles className="w-5 h-5 animate-pulse" />
              </>
            )}
          </button>

          {/* Info aide */}
          <p className="text-center text-sm text-blue-600 mt-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Un groupe doit contenir au minimum 3 personnes (vous + 2 autres)
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}