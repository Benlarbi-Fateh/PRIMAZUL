'use client'

import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { getConversations, searchUsers, createConversation } from '@/lib/api';
import { getSocket } from '@/services/socket';
import { LogOut, Search, MessageCircle, Users, MoreVertical, Archive, Trash2, Pin, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Sidebar({ activeConversationId }) {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  
  const searchTimeoutRef = useRef(null);

  // Calcul des utilisateurs à afficher basé sur l'état actuel
  const usersToDisplay = useMemo(() => {
    if (!showUsers || !searchTerm.trim()) {
      return [];
    }
    return searchResults;
  }, [showUsers, searchTerm, searchResults]);

  // Charger les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await getConversations();
        setConversations(response.data.conversations || []);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    const socket = getSocket();
    
    if (socket && user) {
      console.log('📊 Sidebar écoute les mises à jour de conversations');
      
      socket.on('conversation-updated', (updatedConversation) => {
        console.log('📬 Conversation mise à jour reçue dans Sidebar:', updatedConversation._id);
        
        setConversations((prevConversations) => {
          const existingIndex = prevConversations.findIndex(
            (conv) => conv._id === updatedConversation._id
          );

          if (existingIndex !== -1) {
            const newConversations = [...prevConversations];
            newConversations[existingIndex] = updatedConversation;
            return newConversations.sort((a, b) => 
              new Date(b.updatedAt) - new Date(a.updatedAt)
            );
          } else {
            return [updatedConversation, ...prevConversations];
          }
        });
      });

      return () => {
        socket.off('conversation-updated');
      };
    }
  }, [user]);

  // Recherche d'utilisateurs (debounce)
  useEffect(() => {
    if (!showUsers || !searchTerm.trim()) {
      return;
    }

    clearTimeout(searchTimeoutRef.current);
    
    const performSearch = async () => {
      try {
        setLoading(true);
        const response = await searchUsers(searchTerm);
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error('Erreur recherche:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchTimeoutRef.current = setTimeout(performSearch, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm, showUsers]);

  const handleTabChange = (isUsersTab) => {
    if (isUsersTab !== showUsers) {
      setShowUsers(isUsersTab);
      if (!isUsersTab) {
        setSearchTerm('');
        setSearchResults([]);
      }
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults([]);
    }
  };

  const handleCreateConversation = async (userId) => {
    try {
      setLoading(true);
      const response = await createConversation(userId);
      
      console.log('✅ Conversation créée:', response.data.conversation);
      
      setConversations((prevConversations) => {
        const exists = prevConversations.some(
          (conv) => conv._id === response.data.conversation._id
        );
        if (!exists) {
          return [response.data.conversation, ...prevConversations];
        }
        return prevConversations;
      });
      
      setShowUsers(false);
      setSearchTerm('');
      setSearchResults([]);
      setLoading(false);
      router.push(`/chat/${response.data.conversation._id}`);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      setLoading(false);
      alert('Erreur lors de la création de la conversation');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find(p => p._id !== userId);
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return 'Démarrer la conversation';
    
    const lastMsg = conv.lastMessage;
    
    if (lastMsg.type === 'image') return '🖼️ Image';
    if (lastMsg.type === 'file') return `📄 ${lastMsg.fileName || 'Fichier'}`;
    if (lastMsg.type === 'audio') return '🎤 Message vocal';
    
    const preview = lastMsg.content || '';
    return preview.length > 40 ? preview.substring(0, 40) + '...' : preview;
  };

  const formatMessageTime = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: false, 
        locale: fr 
      }).replace('environ ', '');
    } catch {
      return '';
    }
  };

  const getMessageStatus = (conv) => {
    const userId = user?._id || user?.id;
    if (conv.lastMessage?.sender?._id === userId) {
      return conv.lastMessage.status || 'sent';
    }
    return null;
  };

  const renderStatusIcon = (status) => {
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-blue-500" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-gray-400" />;
    if (status === 'sent') return <Check className="w-4 h-4 text-gray-400" />;
    return null;
  };

  const handleDeleteConversation = async (conversationId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      try {
        // Implémentez ici votre logique de suppression
        console.log('Suppression de la conversation:', conversationId);
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        setMenuOpen(null);
        
        // Rediriger si la conversation active est supprimée
        if (activeConversationId === conversationId) {
          router.push('/chat');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  return (
    <div className="w-full lg:w-96 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <p className="text-xs text-gray-500">{user?.name || 'Utilisateur'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full transition-all transform hover:scale-110"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => handleTabChange(false)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
              !showUsers
                ? 'bg-white text-green-600 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chats
          </button>
          <button
            onClick={() => handleTabChange(true)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
              showUsers
                ? 'bg-white text-green-600 shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Contacts
          </button>
        </div>

        {/* Search Bar */}
        {showUsers && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-500"></div>
              <MessageCircle className="w-6 h-6 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-sm text-gray-500">Chargement...</p>
          </div>
        ) : showUsers ? (
          // Onglet Contacts
          <div>
            {!searchTerm.trim() ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-medium text-gray-700">Rechercher des contacts</p>
                <p className="text-sm mt-2">Tapez un nom ou email</p>
              </div>
            ) : usersToDisplay.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-medium text-gray-700">Aucun résultat</p>
                <p className="text-sm mt-2">Essayez un autre terme</p>
              </div>
            ) : (
              <div className="p-2">
                {usersToDisplay.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleCreateConversation(contact._id)}
                    className="w-full p-3 hover:bg-white rounded-xl transition-all flex items-center gap-3 group"
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contact.profilePicture?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=10b981&color=fff`}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-green-500 transition-all"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=10b981&color=fff`;
                        }}
                      />
                      {contact.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Onglet Conversations
          <div>
            {conversations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="font-medium text-gray-700 mb-2">Aucune conversation</p>
                <p className="text-sm text-gray-500 mb-4">Commencez à discuter avec vos contacts</p>
                <button
                  onClick={() => handleTabChange(true)}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  Rechercher des contacts
                </button>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conv) => {
                  const contact = getOtherParticipant(conv);
                  const isActive = conv._id === activeConversationId;
                  const messageStatus = getMessageStatus(conv);
                  const lastMessageTime = formatMessageTime(conv.updatedAt);

                  if (!contact) {
                    console.warn('⚠️ Conversation sans contact valide:', conv._id);
                    return null;
                  }

                  return (
                    <div
                      key={conv._id}
                      className="relative group mb-1"
                      onMouseLeave={() => setMenuOpen(null)}
                    >
                      <button
                        onClick={() => router.push(`/chat/${conv._id}`)}
                        className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 ${
                          isActive 
                            ? 'bg-white shadow-md ring-2 ring-green-500' 
                            : 'hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={contact?.profilePicture?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=10b981&color=fff`}
                            alt={contact?.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=10b981&color=fff`;
                            }}
                          />
                          {contact?.isOnline && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate pr-2">
                              {contact?.name}
                            </h3>
                            {lastMessageTime && (
                              <span className="text-xs text-gray-400 shrink-0">
                                {lastMessageTime}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {messageStatus && renderStatusIcon(messageStatus)}
                            <p className={`text-sm truncate ${
                              conv.unreadCount > 0 
                                ? 'font-semibold text-gray-900' 
                                : 'text-gray-500'
                            }`}>
                              {getLastMessagePreview(conv)}
                            </p>
                          </div>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-5 text-center">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === conv._id ? null : conv._id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {menuOpen === conv._id && (
                        <div className="absolute right-2 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 w-48">
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Pin className="w-4 h-4 text-gray-500" />
                            Épingler
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Archive className="w-4 h-4 text-gray-500" />
                            Archiver
                          </button>
                          <hr className="my-1" />
                          <button 
                            onClick={() => handleDeleteConversation(conv._id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}