'use client'

import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { 
  getConversations, 
  searchUsers, 
  createConversation,
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation
} from '@/lib/api';
import { 
  getSocket, 
  onShouldRefreshConversations, 
  requestOnlineUsers,
  onInvitationReceived,
  onInvitationAccepted,
  onInvitationRejected,
  onInvitationCancelled,
  emitInvitationSent,
  emitInvitationAccepted,
  emitInvitationRejected,
  emitInvitationCancelled
} from '@/services/socket';
import { 
  LogOut, 
  Search, 
  MessageCircle, 
  Users, 
  MoreVertical, 
  Archive, 
  Trash2, 
  Pin, 
  Check, 
  CheckCheck, 
  Plus,
  Bell,
  UserPlus,
  Clock,
  X,
  Send,
  UserCheck,
  UserX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Sidebar({ activeConversationId }) {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'contacts', 'invitations'
  const [menuOpen, setMenuOpen] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // 🆕 États pour les invitations
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [invitationTab, setInvitationTab] = useState('received'); // 'received' ou 'sent'
  
  const searchTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  const usersToDisplay = useMemo(() => {
    if (activeTab !== 'contacts' || !searchTerm.trim()) {
      return [];
    }
    return searchResults;
  }, [activeTab, searchTerm, searchResults]);

  // 🆕 Fetch invitations
  const fetchInvitations = async () => {
    try {
      const [received, sent] = await Promise.all([
        getReceivedInvitations(),
        getSentInvitations()
      ]);
      setReceivedInvitations(received.data.invitations || []);
      setSentInvitations(sent.data.invitations || []);
      console.log('✅ Invitations chargées:', received.data.invitations?.length, sent.data.invitations?.length);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data.conversations || []);
      setLoading(false);
      console.log('✅ Conversations chargées:', response.data.conversations?.length);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchInvitations();
      const interval = setInterval(() => {
        fetchConversations();
        fetchInvitations();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // 🆕 Socket pour invitations INSTANTANÉES
  useEffect(() => {
    if (!user) return;

    // Nouvelle invitation reçue INSTANTANÉMENT
    const handleInvitationReceived = (invitation) => {
      console.log('📨 Nouvelle invitation reçue INSTANTANÉMENT:', invitation);
      setReceivedInvitations(prev => [invitation, ...prev]);
    };

    // Invitation acceptée INSTANTANÉMENT
    const handleInvitationAccepted = ({ invitation, conversation }) => {
      console.log('✅ Invitation acceptée INSTANTANÉMENT:', invitation);
      setSentInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
      setConversations(prev => [conversation, ...prev]);
    };

    // Invitation refusée INSTANTANÉMENT
    const handleInvitationRejected = (invitation) => {
      console.log('❌ Invitation refusée INSTANTANÉMENT:', invitation);
      setSentInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
    };

    // Invitation annulée INSTANTANÉMENT
    const handleInvitationCancelled = (invitationId) => {
      console.log('🗑️ Invitation annulée INSTANTANÉMENT:', invitationId);
      setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));
    };

    // Configurer les écouteurs
    onInvitationReceived(handleInvitationReceived);
    onInvitationAccepted(handleInvitationAccepted);
    onInvitationRejected(handleInvitationRejected);
    onInvitationCancelled(handleInvitationCancelled);

    return () => {
      // Nettoyage automatique géré par les fonctions onInvitationXXX
    };
  }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 Page visible, demande de mise à jour des utilisateurs en ligne');
        requestOnlineUsers();
      }
    };

    const handleFocus = () => {
      console.log('🔍 Fenêtre en focus, demande de mise à jour des utilisateurs en ligne');
      requestOnlineUsers();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket && user) {
      console.log('👥 Sidebar écoute les statuts en ligne');
      
      socket.on('online-users-update', (userIds) => {
        console.log('📡 Liste des utilisateurs en ligne reçue:', userIds);
        setOnlineUsers(new Set(userIds));
      });

      onShouldRefreshConversations(() => {
        console.log('🔄 Refresh des conversations demandé');
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
          fetchConversations();
        }, 300);
      });

      requestOnlineUsers();

      return () => {
        socket.off('online-users-update');
        socket.off('should-refresh-conversations');
        clearTimeout(refreshTimeoutRef.current);
      };
    }
  }, [user]);

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

      socket.on('group-created', (group) => {
        console.log('👥 Nouveau groupe créé:', group._id);
        setConversations((prevConversations) => {
          const exists = prevConversations.some(conv => conv._id === group._id);
          if (!exists) {
            return [group, ...prevConversations];
          }
          return prevConversations;
        });
      });

      socket.on('conversation-read', ({ conversationId }) => {
        console.log('✅ Conversation marquée comme lue:', conversationId);
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv._id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      });

      return () => {
        socket.off('conversation-updated');
        socket.off('group-created');
        socket.off('conversation-read');
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'contacts' || !searchTerm.trim()) {
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
  }, [searchTerm, activeTab]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      if (tab !== 'contacts') {
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

  // 🆕 Envoyer une invitation INSTANTANÉE
  const handleSendInvitation = async (userId) => {
    try {
      setLoading(true);
      const response = await sendInvitation({ receiverId: userId });
      
      console.log('✅ Invitation envoyée:', response.data.invitation);
      
      // Ajouter l'invitation aux invitations envoyées
      setSentInvitations(prev => [response.data.invitation, ...prev]);
      
      // Émettre l'événement socket INSTANTANÉMENT
      emitInvitationSent({
        receiverId: userId,
        invitation: response.data.invitation
      });
      
      setActiveTab('invitations');
      setInvitationTab('sent');
      setSearchTerm('');
      setSearchResults([]);
      setLoading(false);
      
      alert('✅ Invitation envoyée avec succès !');
    } catch (error) {
      console.error('Erreur envoi invitation:', error);
      setLoading(false);
      alert(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'invitation');
    }
  };

  // 🆕 Accepter une invitation INSTANTANÉE
  const handleAcceptInvitation = async (invitationId) => {
    try {
      const response = await acceptInvitation(invitationId);
      console.log('✅ Invitation acceptée:', response.data);
      
      // Retirer l'invitation des invitations reçues
      setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // Ajouter la conversation
      setConversations(prev => [response.data.conversation, ...prev]);
      
      // Émettre l'événement socket INSTANTANÉMENT
      emitInvitationAccepted({
        senderId: response.data.invitation.sender._id,
        invitation: response.data.invitation,
        conversation: response.data.conversation
      });
      
      // Naviguer vers la conversation
      setActiveTab('chats');
      router.push(`/chat/${response.data.conversation._id}`);
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      alert('Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  // 🆕 Refuser une invitation INSTANTANÉE
  const handleRejectInvitation = async (invitationId, senderId) => {
    try {
      const response = await rejectInvitation(invitationId);
      console.log('❌ Invitation refusée:', response.data);
      
      // Retirer l'invitation
      setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // Émettre l'événement socket INSTANTANÉMENT
      emitInvitationRejected({
        senderId: senderId,
        invitation: response.data.invitation
      });
    } catch (error) {
      console.error('Erreur refus invitation:', error);
      alert('Erreur lors du refus de l\'invitation');
    }
  };

  // 🆕 Annuler une invitation envoyée INSTANTANÉE
  const handleCancelInvitation = async (invitationId, receiverId) => {
    try {
      await cancelInvitation(invitationId);
      console.log('🗑️ Invitation annulée:', invitationId);
      
      // Retirer l'invitation
      setSentInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      // Émettre l'événement socket INSTANTANÉMENT
      emitInvitationCancelled({
        receiverId: receiverId,
        invitationId: invitationId
      });
    } catch (error) {
      console.error('Erreur annulation invitation:', error);
      alert('Erreur lors de l\'annulation de l\'invitation');
    }
  };

  // Fonction existante pour créer une conversation directe (gardée pour compatibilité)
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
      
      setActiveTab('chats');
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

  const getDisplayName = (conv) => {
    if (conv.isGroup) {
      return conv.groupName || 'Groupe sans nom';
    }
    const contact = getOtherParticipant(conv);
    return contact?.name || 'Utilisateur';
  };

  const getDisplayImage = (conv) => {
    if (conv.isGroup) {
      return conv.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.groupName || 'Groupe')}&background=6366f1&color=fff`;
    }
    const contact = getOtherParticipant(conv);
    return contact?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=0ea5e9&color=fff`;
  };

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find(p => p._id !== userId);
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return 'Démarrer la conversation';
    
    const lastMsg = conv.lastMessage;
    
    if (lastMsg.type === 'image') return '🖼️ Image';
    if (lastMsg.type === 'file') return `📄 ${lastMsg.fileName || 'Fichier'}`;
    if (lastMsg.type === 'voice') return '🎤 Message vocal';
    
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
        console.log('Suppression de la conversation:', conversationId);
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        setMenuOpen(null);
        
        if (activeConversationId === conversationId) {
          router.push('/');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const totalInvitations = receivedInvitations.length;

  return (
    <div className="w-full lg:w-96 bg-gradient-to-b from-white to-blue-50 border-r border-blue-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Messages</h1>
              <p className="text-xs text-blue-600">{user?.name || 'Utilisateur'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-blue-600 hover:text-red-600 rounded-full transition-all transform hover:scale-110"
            title="Déconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 bg-blue-100 p-1 rounded-xl">
          <button
            onClick={() => handleTabChange('chats')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === 'chats'
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chats
          </button>
          <button
            onClick={() => handleTabChange('contacts')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === 'contacts'
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Contacts
          </button>
          <button
            onClick={() => handleTabChange('invitations')}
            className={`relative flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
              activeTab === 'invitations'
                ? 'bg-white text-blue-600 shadow-md transform scale-105'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            Invit.
            {totalInvitations > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalInvitations > 9 ? '9+' : totalInvitations}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar (seulement pour Contacts) */}
        {activeTab === 'contacts' && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-blue-50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-blue-900 placeholder-blue-400"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
        {loading && activeTab !== 'invitations' ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <MessageCircle className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-sm text-blue-600">Chargement...</p>
          </div>
        ) : activeTab === 'contacts' ? (
          // ========== ONGLET CONTACTS ==========
          <div>
            {!searchTerm.trim() ? (
              <div className="p-12 text-center text-blue-600">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-blue-300" />
                </div>
                <p className="font-medium text-blue-800">Rechercher des contacts</p>
                <p className="text-sm mt-2">Tapez un nom ou email</p>
              </div>
            ) : usersToDisplay.length === 0 ? (
              <div className="p-12 text-center text-blue-600">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-blue-300" />
                </div>
                <p className="font-medium text-blue-800">Aucun résultat</p>
                <p className="text-sm mt-2">Essayez un autre terme</p>
              </div>
            ) : (
              <div className="p-2">
                {usersToDisplay.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleSendInvitation(contact._id)}
                    className="w-full p-3 hover:bg-white rounded-xl transition-all flex items-center gap-3 group border border-transparent hover:border-blue-200"
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contact.profilePicture?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=0ea5e9&color=fff`}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 group-hover:ring-blue-500 transition-all"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=0ea5e9&color=fff`;
                        }}
                      />
                      {isUserOnline(contact._id) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-blue-600">{contact.email}</p>
                    </div>
                    <UserPlus className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'invitations' ? (
          // ========== ONGLET INVITATIONS ==========
          <div>
            {/* Sub-tabs */}
            <div className="p-4 flex gap-2 bg-white/50 sticky top-0 z-10">
              <button
                onClick={() => setInvitationTab('received')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  invitationTab === 'received'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Reçues {receivedInvitations.length > 0 && `(${receivedInvitations.length})`}
              </button>
              <button
                onClick={() => setInvitationTab('sent')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  invitationTab === 'sent'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Envoyées {sentInvitations.length > 0 && `(${sentInvitations.length})`}
              </button>
            </div>

            {invitationTab === 'received' ? (
              // Invitations reçues
              receivedInvitations.length === 0 ? (
                <div className="p-12 text-center text-blue-600">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-10 h-10 text-blue-300" />
                  </div>
                  <p className="font-medium text-blue-800">Aucune invitation reçue</p>
                  <p className="text-sm mt-2">Les invitations apparaîtront ici</p>
                </div>
              ) : (
                <div className="p-2">
                  {receivedInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className="bg-white p-4 rounded-xl border border-blue-200 mb-2 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={invitation.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.sender?.name || 'User')}&background=0ea5e9&color=fff`}
                            alt={invitation.sender?.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.sender?.name || 'User')}&background=0ea5e9&color=fff`;
                            }}
                          />
                          {isUserOnline(invitation.sender?._id) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">{invitation.sender?.name}</h3>
                          <p className="text-sm text-blue-600">{invitation.sender?.email}</p>
                          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatMessageTime(invitation.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-lg mb-3">
                          {invitation.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvitation(invitation._id)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRejectInvitation(invitation._id, invitation.sender?._id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Invitations envoyées
              sentInvitations.length === 0 ? (
                <div className="p-12 text-center text-blue-600">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-10 h-10 text-blue-300" />
                  </div>
                  <p className="font-medium text-blue-800">Aucune invitation envoyée</p>
                  <p className="text-sm mt-2">Envoyez des invitations depuis l&apos;onglet Contacts</p>
                </div>
              ) : (
                <div className="p-2">
                  {sentInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className="bg-white p-4 rounded-xl border border-blue-200 mb-2 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={invitation.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.receiver?.name || 'User')}&background=0ea5e9&color=fff`}
                            alt={invitation.receiver?.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.receiver?.name || 'User')}&background=0ea5e9&color=fff`;
                            }}
                          />
                          {isUserOnline(invitation.receiver?._id) && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">{invitation.receiver?.name}</h3>
                          <p className="text-sm text-blue-600">{invitation.receiver?.email}</p>
                          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatMessageTime(invitation.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-lg mb-3">
                          {invitation.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancelInvitation(invitation._id, invitation.receiver?._id)}
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Annuler l&apos;invitation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        ) : (
          // ========== ONGLET CHATS ==========
          <div className="flex flex-col h-full">
            <div className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-12 text-center text-blue-600">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-blue-600" />
                  </div>
                  <p className="font-medium text-blue-800 mb-2">Aucune conversation</p>
                  <p className="text-sm text-blue-600 mb-4">Commencez à discuter avec vos contacts</p>
                  <button
                    onClick={() => handleTabChange('contacts')}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    Rechercher des contacts
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conv) => {
                    const isActive = conv._id === activeConversationId;
                    const messageStatus = getMessageStatus(conv);
                    const lastMessageTime = formatMessageTime(conv.updatedAt);
                    const unreadCount = conv.unreadCount || 0;
                    
                    const displayName = getDisplayName(conv);
                    const displayImage = getDisplayImage(conv);
                    const contact = getOtherParticipant(conv);

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
                              ? 'bg-white shadow-md ring-2 ring-blue-500' 
                              : 'hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-200'
                          }`}
                        >
                          <div className="relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImage}
                              alt={displayName}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-100"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff`;
                              }}
                            />
                            {!conv.isGroup && contact && isUserOnline(contact._id) && (
                              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                            {conv.isGroup && (
                              <span className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white rounded-full flex items-center justify-center">
                                <Users className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`font-semibold truncate pr-2 ${
                                unreadCount > 0 ? 'text-blue-900' : 'text-blue-800'
                              }`}>
                                {displayName}
                              </h3>
                              {lastMessageTime && (
                                <span className={`text-xs shrink-0 ${
                                  unreadCount > 0 ? 'text-blue-600 font-semibold' : 'text-blue-500'
                                }`}>
                                  {lastMessageTime}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {messageStatus && renderStatusIcon(messageStatus)}
                              <p className={`text-sm truncate ${
                                unreadCount > 0 
                                  ? 'font-semibold text-blue-900' 
                                  : 'text-blue-600'
                              }`}>
                                {getLastMessagePreview(conv)}
                              </p>
                            </div>
                          </div>

                          {unreadCount > 0 && (
                            <span className="shrink-0 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-5 text-center shadow-md">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === conv._id ? null : conv._id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-blue-500" />
                        </button>

                        {menuOpen === conv._id && (
                          <div className="absolute right-2 top-full mt-1 bg-white rounded-lg shadow-xl border border-blue-200 py-1 z-20 w-48">
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-900">
                              <Pin className="w-4 h-4 text-blue-500" />
                              Épingler
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-900">
                              <Archive className="w-4 h-4 text-blue-500" />
                              Archiver
                            </button>
                            <hr className="my-1 border-blue-200" />
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

            {activeTab === 'chats' && (
              <div className="p-4 border-t border-blue-200 bg-white/50 backdrop-blur-sm">
                <button
                  onClick={() => router.push('/group/create')}
                  className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Créer un groupe
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}