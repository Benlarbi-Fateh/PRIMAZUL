'use client'

import { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import Image from 'next/image';
import { 
  getConversations, 
  searchUsers, 
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
  emitInvitationCancelled,
  onOnlineUsersUpdate
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
  UserX,
  Sparkles
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
  const [activeTab, setActiveTab] = useState('chats');
  const [menuOpen, setMenuOpen] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [invitationTab, setInvitationTab] = useState('received');
  
  const searchTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  const usersToDisplay = useMemo(() => {
    if (activeTab !== 'contacts' || !searchTerm.trim()) {
      return [];
    }
    return searchResults;
  }, [activeTab, searchTerm, searchResults]);

  const fetchInvitations = async () => {
    try {
      const [received, sent] = await Promise.all([
        getReceivedInvitations(),
        getSentInvitations()
      ]);
      setReceivedInvitations(received.data.invitations || []);
      setSentInvitations(sent.data.invitations || []);
    } catch (error) {
      console.error('Erreur chargement invitations:', error);
    }
  };

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

  useEffect(() => {
    if (!user) return;

    const handleInvitationReceived = (invitation) => {
      setReceivedInvitations(prev => [invitation, ...prev]);
    };

    const handleInvitationAccepted = ({ invitation, conversation }) => {
      setSentInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
      setConversations(prev => [conversation, ...prev]);
    };

    const handleInvitationRejected = (invitation) => {
      setSentInvitations(prev => prev.filter(inv => inv._id !== invitation._id));
    };

    const handleInvitationCancelled = (invitationId) => {
      setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));
    };

    onInvitationReceived(handleInvitationReceived);
    onInvitationAccepted(handleInvitationAccepted);
    onInvitationRejected(handleInvitationRejected);
    onInvitationCancelled(handleInvitationCancelled);
  }, [user]);

  // 🔥 CORRECTION CRITIQUE : Utiliser la nouvelle fonction pour écouter les utilisateurs en ligne
  useEffect(() => {
    if (!user) return;

    // S'abonner aux mises à jour des utilisateurs en ligne
    const unsubscribe = onOnlineUsersUpdate((userIds) => {
      console.log('📡 Sidebar - Mise à jour utilisateurs en ligne:', userIds);
      console.log('📡 IDs détaillés:', JSON.stringify(userIds));
      setOnlineUsers(new Set(userIds));
    });

    // Demander les utilisateurs en ligne immédiatement
    requestOnlineUsers();

    return () => {
      unsubscribe(); // Nettoyer l'écouteur
    };
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket && user) {
      socket.on('conversation-updated', (updatedConversation) => {
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
        setConversations((prevConversations) => {
          const exists = prevConversations.some(conv => conv._id === group._id);
          if (!exists) {
            return [group, ...prevConversations];
          }
          return prevConversations;
        });
      });

      socket.on('conversation-read', ({ conversationId }) => {
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv._id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      });

      onShouldRefreshConversations(() => {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
          fetchConversations();
        }, 300);
      });

      return () => {
        socket.off('conversation-updated');
        socket.off('group-created');
        socket.off('conversation-read');
        socket.off('should-refresh-conversations');
        clearTimeout(refreshTimeoutRef.current);
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

  const handleSendInvitation = async (userId) => {
    try {
      setLoading(true);
      const response = await sendInvitation({ receiverId: userId });
      
      setSentInvitations(prev => [response.data.invitation, ...prev]);
      
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

  const handleAcceptInvitation = async (invitationId) => {
    try {
      const response = await acceptInvitation(invitationId);
      
      setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      setConversations(prev => [response.data.conversation, ...prev]);
      
      emitInvitationAccepted({
        senderId: response.data.invitation.sender._id,
        invitation: response.data.invitation,
        conversation: response.data.conversation
      });
      
      setActiveTab('chats');
      router.push(`/chat/${response.data.conversation._id}`);
    } catch (error) {
      console.error('Erreur acceptation invitation:', error);
      alert('Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  const handleRejectInvitation = async (invitationId, senderId) => {
    try {
      const response = await rejectInvitation(invitationId);
      
      setReceivedInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      emitInvitationRejected({
        senderId: senderId,
        invitation: response.data.invitation
      });
    } catch (error) {
      console.error('Erreur refus invitation:', error);
      alert('Erreur lors du refus de l\'invitation');
    }
  };

  const handleCancelInvitation = async (invitationId, receiverId) => {
    try {
      await cancelInvitation(invitationId);
      
      setSentInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      
      emitInvitationCancelled({
        receiverId: receiverId,
        invitationId: invitationId
      });
    } catch (error) {
      console.error('Erreur annulation invitation:', error);
      alert('Erreur lors de l\'annulation de l\'invitation');
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
    
    const hasValidProfilePicture = contact?.profilePicture && contact.profilePicture.trim() !== '';
    
    return hasValidProfilePicture 
      ? contact.profilePicture 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
  };

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    const participant = conv.participants?.find(p => (p._id || p.id) !== userId);
    return participant;
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const online = onlineUsers.has(userId);
    console.log(`👤 User ${userId} en ligne?`, online, '| Set contient:', Array.from(onlineUsers));
    return online;
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
    <div className="w-full lg:w-96 bg-white/95 backdrop-blur-xl border-r border-blue-100 flex flex-col h-screen shadow-xl">
      {/* Header avec gradient moderne */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative shrink-0">
                
                {/* fin de changement 
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-md"></div> */}
                
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white drop-shadow-lg truncate">Messages</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 hover:bg-white/20 text-white rounded-xl transition-all transform hover:scale-110 active:scale-95 backdrop-blur-sm shrink-0"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs modernes */}
          <div className="flex gap-2 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl">
            <button
              onClick={() => handleTabChange('chats')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'chats'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-[1.02]'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chats</span>
            </button>
            <button
              onClick={() => handleTabChange('contacts')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'contacts'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-[1.02]'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </button>
            <button
              onClick={() => handleTabChange('invitations')}
              className={`relative flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'invitations'
                  ? 'bg-white text-blue-600 shadow-lg transform scale-[1.02]'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Invit.</span>
              {totalInvitations > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse-glow">
                  {totalInvitations > 9 ? '9+' : totalInvitations}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche pour Contacts */}
      {activeTab === 'contacts' && (
        <div className="p-4 bg-linear-to-b from-blue-50 to-transparent">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-600 transition-all group-focus-within:scale-110" />
            <input
              type="text"
              placeholder="Rechercher un contact..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-blue-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all text-slate-700 placeholder-blue-400 font-medium shadow-sm hover:shadow-md"
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {loading && activeTab !== 'invitations' ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
              <Sparkles className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-6 text-sm text-blue-600 font-semibold">Chargement...</p>
          </div>
        ) : activeTab === 'contacts' ? (
          <div className="animate-fade-in">
            {!searchTerm.trim() ? (
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Search className="w-12 h-12 text-blue-500" />
                </div>
                <p className="font-bold text-slate-800 text-lg mb-2">Rechercher des contacts</p>
                <p className="text-sm text-slate-500">Tapez un nom ou email pour commencer</p>
              </div>
            ) : usersToDisplay.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-linear-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-slate-400" />
                </div>
                <p className="font-bold text-slate-800 text-lg mb-2">Aucun résultat</p>
                <p className="text-sm text-slate-500">Essayez un autre terme de recherche</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {usersToDisplay.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleSendInvitation(contact._id)}
                    className="w-full p-4 bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50 rounded-2xl transition-all flex items-center gap-4 group border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-lg transform hover:scale-[1.02] animate-slide-in-left"
                  >
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={contact.profilePicture?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=3b82f6&color=fff&bold=true`}
                        alt={contact.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100 group-hover:ring-blue-400 transition-all"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'User')}&background=3b82f6&color=fff&bold=true`;
                        }}
                      />
                      {isUserOnline(contact._id) && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">{contact.email}</p>
                    </div>
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-all">
                      <UserPlus className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'chats' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-12 text-center animate-fade-in">
                  <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MessageCircle className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="font-bold text-slate-800 text-lg mb-2">Aucune conversation</p>
                  <p className="text-sm text-slate-500 mb-6">Commencez à discuter avec vos contacts</p>
                  <button
                    onClick={() => handleTabChange('contacts')}
                    className="px-8 py-3 bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Rechercher des contacts
                  </button>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {conversations.map((conv) => {
                    const isActive = conv._id === activeConversationId;
                    const messageStatus = getMessageStatus(conv);
                    const lastMessageTime = formatMessageTime(conv.updatedAt);
                    const unreadCount = conv.unreadCount || 0;
                    
                    const displayName = getDisplayName(conv);
                    const displayImage = getDisplayImage(conv);
                    const contact = getOtherParticipant(conv);
                    const contactId = contact?._id || contact?.id;
                    const contactOnline = contactId && isUserOnline(contactId);

                    return (
                      <div
                        key={conv._id}
                        className="relative group animate-slide-in-left"
                        onMouseLeave={() => setMenuOpen(null)}
                      >
                        <button
                          onClick={() => router.push(`/chat/${conv._id}`)}
                          className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 ${
                            isActive 
                              ? 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-lg ring-2 ring-blue-300 transform scale-[1.02]' 
                              : 'bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className="relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImage}
                              alt={displayName}
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&bold=true`;
                              }}
                            />
                            {!conv.isGroup && contactOnline && (
                              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md"></span>
                            )}
                            {conv.isGroup && (
                              <span className="absolute bottom-0 right-0 w-6 h-6 bg-linear-to-br from-purple-500 to-pink-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                                <Users className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`font-bold truncate pr-2 ${
                                isActive ? 'text-white' : unreadCount > 0 ? 'text-slate-800' : 'text-slate-700'
                              }`}>
                                {displayName}
                              </h3>
                              {lastMessageTime && (
                                <span className={`text-xs shrink-0 font-semibold ${
                                  isActive ? 'text-white/90' : unreadCount > 0 ? 'text-blue-600' : 'text-slate-400'
                                }`}>
                                  {lastMessageTime}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {messageStatus && renderStatusIcon(messageStatus)}
                              <p className={`text-sm truncate ${
                                isActive ? 'text-white/90' : unreadCount > 0 
                                  ? 'font-semibold text-slate-700' 
                                  : 'text-slate-500'
                              }`}>
                                {getLastMessagePreview(conv)}
                              </p>
                            </div>
                          </div>

                          {unreadCount > 0 && (
                            <span className="shrink-0 bg-linear-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-full min-w-6 text-center shadow-md">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === conv._id ? null : conv._id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical className="w-5 h-5 text-blue-500" />
                        </button>

                        {menuOpen === conv._id && (
                          <div className="absolute right-2 top-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 py-2 z-20 w-52 animate-scale-in">
                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 text-slate-700 font-medium transition-colors">
                              <Pin className="w-5 h-5 text-blue-500" />
                              Épingler
                            </button>
                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 text-slate-700 font-medium transition-colors">
                              <Archive className="w-5 h-5 text-blue-500" />
                              Archiver
                            </button>
                            <hr className="my-2 border-slate-200" />
                            <button 
                              onClick={() => handleDeleteConversation(conv._id)}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-3 font-medium transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
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
              <div className="p-4 border-t-2 border-blue-100 bg-linear-to-t from-white to-blue-50/30">
                <button
                  onClick={() => router.push('/group/create')}
                  className="w-full p-4 bg-linear-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 font-bold"
                >
                  <Plus className="w-6 h-6" />
                  Créer un groupe
                </button>
              </div>
            )}
          </div>
        ) : (
          // Tab Invitations
          <div className="animate-fade-in">
            <div className="p-4 flex gap-2 bg-linear-to-b from-blue-50/50 to-transparent sticky top-0 z-10 backdrop-blur-sm">
              <button
                onClick={() => setInvitationTab('received')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  invitationTab === 'received'
                    ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                Reçues {receivedInvitations.length > 0 && `(${receivedInvitations.length})`}
              </button>
              <button
                onClick={() => setInvitationTab('sent')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  invitationTab === 'sent'
                    ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-[1.02]'
                    : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                Envoyées {sentInvitations.length > 0 && `(${sentInvitations.length})`}
              </button>
            </div>

            {invitationTab === 'received' ? (
              receivedInvitations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Bell className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="font-bold text-slate-800 text-lg mb-2">Aucune invitation reçue</p>
                  <p className="text-sm text-slate-500">Les invitations apparaîtront ici</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {receivedInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-md hover:shadow-xl transition-all animate-slide-in-left"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={invitation.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
                            alt={invitation.sender?.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
                            }}
                          />
                          {isUserOnline(invitation.sender?._id) && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{invitation.sender?.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{invitation.sender?.email}</p>
                          <p className="text-xs text-blue-500 mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {formatMessageTime(invitation.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className="text-sm text-slate-700 bg-blue-50 p-3 rounded-xl mb-4">
                          {invitation.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvitation(invitation._id)}
                          className="flex-1 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          <UserCheck className="w-5 h-5" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRejectInvitation(invitation._id, invitation.sender?._id)}
                          className="flex-1 bg-linear-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          <UserX className="w-5 h-5" />
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              sentInvitations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-linear-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Send className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="font-bold text-slate-800 text-lg mb-2">Aucune invitation envoyée</p>
                  <p className="text-sm text-slate-500">Envoyez des invitations depuis l&apos;onglet Contacts</p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {sentInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-md hover:shadow-xl transition-all animate-slide-in-left"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={invitation.receiver?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.receiver?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
                            alt={invitation.receiver?.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.receiver?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
                            }}
                          />
                          {isUserOnline(invitation.receiver?._id) && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{invitation.receiver?.name}</h3>
                          <p className="text-sm text-slate-500 truncate">{invitation.receiver?.email}</p>
                          <p className="text-xs text-blue-500 mt-1 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {formatMessageTime(invitation.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className="text-sm text-slate-700 bg-blue-50 p-3 rounded-xl mb-4">
                          {invitation.message}
                        </p>
                      )}
                      <button
                        onClick={() => handleCancelInvitation(invitation._id, invitation.receiver?._id)}
                        className="w-full bg-linear-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        <X className="w-5 h-5" />
                        Annuler l&apos;invitation
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}