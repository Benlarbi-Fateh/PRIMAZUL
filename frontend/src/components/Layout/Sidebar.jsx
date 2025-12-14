"use client";

import { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { AuthContext } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import {
  addContact,
  getConversations,
  searchUsers,
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
} from "@/lib/api";
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
  onOnlineUsersUpdate,
} from "@/services/socket";
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
  Sparkles,
  UsersRound,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Contacts from "../Contacts/Contacts";

export default function Sidebar({ activeConversationId }) {
  const { user, logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [menuOpen, setMenuOpen] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [invitationTab, setInvitationTab] = useState("received");

  const searchTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  const usersToDisplay = useMemo(() => {
    if (activeTab !== "contacts" || !searchTerm.trim()) {
      return [];
    }
    return searchResults;
  }, [activeTab, searchTerm, searchResults]);

  // Styles basés sur le thème avec identité bleue
  const sidebarBg = isDark
    ? "bg-gradient-to-b from-blue-950/95 via-blue-950/90 to-blue-950/95 backdrop-blur-xl border-r border-blue-800/30"
    : "bg-white/95 backdrop-blur-xl border-r border-blue-100";

  const headerBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 shadow-lg"
    : "bg-gradient-to-br from-blue-700 via-blue-700 to-blue-800 shadow-lg";

  const tabBg = isDark
    ? "bg-blue-900/70 backdrop-blur-md"
    : "bg-white/15 backdrop-blur-md";

  const activeTabStyle = isDark
    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg transform scale-[1.02]"
    : "bg-white text-blue-600 shadow-lg transform scale-[1.02]";

  const inactiveTabStyle = isDark
    ? "text-blue-200 hover:bg-blue-800/50"
    : "text-white/90 hover:bg-white/10";

  const loadingBg = isDark
    ? "bg-gradient-to-br from-blue-900/80 to-blue-950/80 border-blue-800/30"
    : "bg-gradient-to-br from-blue-100 to-cyan-100";

  const emptyStateBg = isDark
    ? "bg-gradient-to-br from-blue-900/80 to-blue-950/80 border-blue-800/30"
    : "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200";

  const textPrimary = isDark ? "text-blue-50" : "text-slate-900";
  const textSecondary = isDark ? "text-blue-200" : "text-slate-600";
  const textMuted = isDark ? "text-blue-300" : "text-slate-500";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-cyan-400 shadow-cyan-500/40"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-sky-500/40";

  const conversationCard = (isActive, hasUnread) => {
    if (isActive) {
      return isDark
        ? "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg ring-2 ring-cyan-400 transform scale-[1.02]"
        : "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg ring-2 ring-blue-300 transform scale-[1.02]";
    }
    
    if (hasUnread) {
      return isDark
        ? "bg-gradient-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800 hover:to-blue-900 border-2 border-transparent hover:border-blue-700 shadow-sm hover:shadow-md"
        : "bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-md";
    }
    
    return isDark
      ? "bg-gradient-to-r from-blue-900/60 to-blue-800/60 hover:from-blue-800/80 hover:to-blue-900/80 border-2 border-transparent hover:border-blue-700/50 shadow-sm hover:shadow-md"
      : "bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-transparent hover:border-blue-200 shadow-sm hover:shadow-md";
  };

  const fetchInvitations = async () => {
    try {
      const [received, sent] = await Promise.all([
        getReceivedInvitations(),
        getSentInvitations(),
      ]);
      setReceivedInvitations(received.data.invitations || []);
      setSentInvitations(sent.data.invitations || []);
    } catch (error) {
      console.error("Erreur chargement invitations:", error);
    }
  };

  // REMPLACEZ LA FONCTION fetchConversations PAR CELLE-CI :
const fetchConversations = useCallback(async () => {
  try {
    const response = await getConversations();
    setConversations(response.data.conversations || []);
    setLoading(false);
  } catch (error) {
    console.error('Erreur lors du chargement des conversations:', error);
    setLoading(false);
  }
}, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchInvitations();
      
      // Rafraîchir périodiquement SAUF les conversations (évite de recharger les supprimées)
      const interval = setInterval(() => {
        // Ne rafraîchir QUE les invitations
        fetchInvitations();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!user) return;

    const handleInvitationReceived = (invitation) => {
      setReceivedInvitations((prev) => [invitation, ...prev]);
    };

    const handleInvitationAccepted = ({ invitation, conversation }) => {
      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id)
      );
      setConversations((prev) => [conversation, ...prev]);
    };

    const handleInvitationRejected = (invitation) => {
      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id)
      );
    };

    const handleInvitationCancelled = (invitationId) => {
      setReceivedInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId)
      );
    };

    onInvitationReceived(handleInvitationReceived);
    onInvitationAccepted(handleInvitationAccepted);
    onInvitationRejected(handleInvitationRejected);
    onInvitationCancelled(handleInvitationCancelled);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onOnlineUsersUpdate((userIds) => {
      console.log("📡 Sidebar - Mise à jour utilisateurs en ligne:", userIds);
      setOnlineUsers(new Set(userIds));
    });

    requestOnlineUsers();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    const socket = getSocket();

    if (socket && user) {
      socket.on("conversation-updated", (updatedConversation) => {
        setConversations((prevConversations) => {
          const existingIndex = prevConversations.findIndex(
            (conv) => conv._id === updatedConversation._id
          );

          if (existingIndex !== -1) {
            const newConversations = [...prevConversations];
            newConversations[existingIndex] = updatedConversation;
            return newConversations.sort(
              (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            );
          } else {
            return [updatedConversation, ...prevConversations];
          }
        });
      });

      socket.on("group-created", (group) => {
        setConversations((prevConversations) => {
          const exists = prevConversations.some(
            (conv) => conv._id === group._id
          );
          if (!exists) {
            return [group, ...prevConversations];
          }
          return prevConversations;
        });
      });

      socket.on("conversation-read", ({ conversationId }) => {
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
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
        socket.off("conversation-updated");
        socket.off("group-created");
        socket.off("conversation-read");
        socket.off("should-refresh-conversations");
        clearTimeout(refreshTimeoutRef.current);
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== "contacts" || !searchTerm.trim()) {
      return;
    }

    clearTimeout(searchTimeoutRef.current);

    const performSearch = async () => {
      try {
        setLoading(true);
        const response = await searchUsers(searchTerm);
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error("Erreur recherche:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchTimeoutRef.current = setTimeout(performSearch, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm, activeTab]);

useEffect(() => {
    // Fonction pour rafraîchir les conversations UNIQUEMENT si demandé explicitement
    const handleRefreshConversations = (event) => {
      console.log('🔄 Rafraîchissement explicite des conversations');
      fetchConversations();
    };
    
    // Écouter l'événement
    window.addEventListener('refresh-sidebar-conversations', handleRefreshConversations);
    
    // Nettoyer à la destruction
    return () => {
      window.removeEventListener('refresh-sidebar-conversations', handleRefreshConversations);
    };
  }, [fetchConversations]);

  // 🔥 NOUVEAU : Écouter les événements de blocage/déblocage
  useEffect(() => {
    const handleBlockStatusChanged = async () => {
      console.log('🔄 Événement block-status-changed détecté, rafraîchissement...');
      
      // Rafraîchir la liste des conversations
      await fetchConversations();
      
      // Si on est dans l'onglet contacts, rafraîchir aussi la recherche
      if (activeTab === 'contacts' && searchTerm.trim()) {
        try {
          const response = await searchUsers(searchTerm);
          setSearchResults(response.data.users || []);
        } catch (error) {
          console.error('Erreur rafraîchissement recherche:', error);
        }
      }
    };

    // Écouter l'événement global
    window.addEventListener('block-status-changed', handleBlockStatusChanged);
    
    return () => {
      window.removeEventListener('block-status-changed', handleBlockStatusChanged);
    };
  }, [activeTab, searchTerm, fetchConversations]);

   // 🔥 NOUVEAU : Rafraîchir automatiquement quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'chats') {
      // Rafraîchir les conversations quand on revient sur l'onglet Chats
      fetchConversations();
    }
  }, [activeTab, fetchConversations]);

// ✅ ÉCOUTER LES SUPPRESSIONS DE CONVERSATIONS
useEffect(() => {
  const handleConversationDeleted = (event) => {
    const { conversationId } = event.detail || {};
    
    if (conversationId) {
      console.log('🗑️ Sidebar: Conversation supprimée localement:', conversationId);
      
      // Supprimer de la liste
      setConversations((prev) => 
        prev.filter(conv => conv._id !== conversationId)
      );
    }
  };

  window.addEventListener('conversation-deleted-local', handleConversationDeleted);

  return () => {
    window.removeEventListener('conversation-deleted-local', handleConversationDeleted);
  };
}, []);

// ✅ ÉCOUTER LES SUPPRESSIONS VIA SOCKET.IO
useEffect(() => {
  const socket = getSocket();

  if (socket && user) {
    socket.on('conversation-deleted', ({ conversationId }) => {
      console.log('🗑️ Sidebar: Conversation supprimée via Socket.io:', conversationId);
      
      setConversations((prev) => 
        prev.filter(conv => conv._id !== conversationId)
      );
    });

    return () => {
      socket.off('conversation-deleted');
    };
  }
}, [user]);

// 🆕 ÉCOUTER LES RÉGÉNÉRATIONS DE CONVERSATIONS
useEffect(() => {
  const socket = getSocket();

  if (socket && user) {
    socket.on('conversation-regenerated', ({ oldConversationId, newConversation }) => {
      console.log('🔄 Sidebar: Conversation régénérée:', oldConversationId, '→', newConversation._id);
      
      setConversations((prev) => {
        // Supprimer l'ancienne conversation
        const filtered = prev.filter(conv => conv._id !== oldConversationId);
        
        // Ajouter la nouvelle conversation en haut
        return [newConversation, ...filtered];
      });
    });

    return () => {
      socket.off('conversation-regenerated');
    };
  }
}, [user]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      if (tab !== "contacts") {
        setSearchTerm("");
        setSearchResults([]);
      } else {
        // Rafraîchir les conversations quand on va dans l'onglet contacts
        fetchConversations();
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

      setSentInvitations((prev) => [response.data.invitation, ...prev]);

      emitInvitationSent({
        receiverId: userId,
        invitation: response.data.invitation,
      });

      setActiveTab("invitations");
      setInvitationTab("sent");
      setSearchTerm("");
      setSearchResults([]);
      setLoading(false);

      alert("✅ Invitation envoyée avec succès !");
    } catch (error) {
      console.error("Erreur envoi invitation:", error);
      setLoading(false);
      alert(
        error.response?.data?.error || "Erreur lors de l'envoi de l'invitation"
      );
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
  try {
    setLoading(true);
    
    const response = await acceptInvitation(invitationId);
    const { invitation, conversation } = response.data || {};

    if (!invitation || invitation.status !== 'accepted') {
      throw new Error('Invitation non valide');
    }

    // 1. Supprimer l'invitation des listes frontend
    setReceivedInvitations((prev) =>
      prev.filter((inv) => inv._id !== invitationId)
    );

    // 2. Ajouter la conversation à la liste SI elle n'existe pas déjà
    if (conversation) {
      setConversations((prev) => {
        const exists = prev.some((conv) => conv._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
    }

    // 3. Émettre l'événement socket
    if (invitation && conversation) {
      emitInvitationAccepted({
        senderId: invitation.sender._id,
        invitation,
        conversation,
      });
    }

    // 4. Rafraîchir la liste des conversations (important)
    setTimeout(() => {
      fetchConversations();
    }, 500);

    // 5. Naviguer vers la conversation
    setActiveTab("chats");
    if (conversation?._id) {
      router.push(`/chat/${conversation._id}`);
    }

    // 6. Afficher un message de succès
    alert("✅ Invitation acceptée avec succès !");
    
  } catch (error) {
    console.error("Erreur acceptation invitation:", error);
    
    // Gestion spécifique des erreurs
    if (error.response?.status === 409) {
      // Invitation déjà traitée
      alert("Cette invitation a déjà été acceptée ou n'est plus valable.");
      
      // Rafraîchir les données
      await fetchInvitations();
      await fetchConversations();
      
    } else if (error.response?.data?.error?.includes("déjà ce contact")) {
      // Contact déjà existant (normal, car le backend l'a créé)
      alert("✅ Contact ajouté avec succès !");
      
      // Rafraîchir quand même
      await fetchInvitations();
      await fetchConversations();
      
    } else {
      // Erreur générale
      alert(
        error.response?.data?.error ||
        error.message ||
        "Erreur lors de l'acceptation de l'invitation"
      );
    }
  } finally {
    setLoading(false);
  }
};

  const handleRejectInvitation = async (invitationId, senderId) => {
    try {
      const response = await rejectInvitation(invitationId);

      setReceivedInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId)
      );

      emitInvitationRejected({
        senderId: senderId,
        invitation: response.data.invitation,
      });
    } catch (error) {
      console.error("Erreur refus invitation:", error);
      alert("Erreur lors du refus de l'invitation");
    }
  };

  const handleCancelInvitation = async (invitationId, receiverId) => {
    try {
      await cancelInvitation(invitationId);

      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId)
      );

      emitInvitationCancelled({
        receiverId: receiverId,
        invitationId: invitationId,
      });
    } catch (error) {
      console.error("Erreur annulation invitation:", error);
      alert("Erreur lors de l'annulation de l'invitation");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getDisplayName = (conv) => {
    if (conv.isGroup) {
      return conv.groupName || "Groupe sans nom";
    }
    const contact = getOtherParticipant(conv);
    return contact?.name || "Utilisateur";
  };

  const getDisplayImage = (conv) => {
    if (conv.isGroup) {
      return (
        conv.groupImage ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          conv.groupName || "Groupe"
        )}&background=6366f1&color=fff`
      );
    }
    const contact = getOtherParticipant(conv);

    const hasValidProfilePicture =
      contact?.profilePicture && contact.profilePicture.trim() !== "";

    return hasValidProfilePicture
      ? contact.profilePicture
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          contact?.name || "User"
        )}&background=3b82f6&color=fff&bold=true`;
  };

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    const participant = conv.participants?.find(
      (p) => (p._id || p.id) !== userId
    );
    return participant;
  };

  const isUserOnline = (userId) => {
    if (!userId) return false;
    const online = onlineUsers.has(userId);
    return online;
  };

  const getLastMessagePreview = (conv) => {
    if (!conv.lastMessage) return "Démarrer la conversation";

    const lastMsg = conv.lastMessage;

    if (lastMsg.type === "image") return "🖼️ Image";
    if (lastMsg.type === "video") return "🎬 Vidéo";
    if (lastMsg.type === "file") return `📄 ${lastMsg.fileName || "Fichier"}`;
    if (lastMsg.type === "voice") return "🎤 Message vocal";

    const preview = lastMsg.content || "";
    return preview.length > 40 ? preview.substring(0, 40) + "..." : preview;
  };

  const formatMessageTime = (date) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: false,
        locale: fr,
      }).replace("environ ", "");
    } catch {
      return "";
    }
  };

  const getMessageStatus = (conv) => {
    const userId = user?._id || user?.id;
    if (conv.lastMessage?.sender?._id === userId) {
      return conv.lastMessage.status || "sent";
    }
    return null;
  };

  const renderStatusIcon = (status) => {
    if (status === "read")
      return <CheckCheck className="w-4 h-4 text-cyan-400" />;
    if (status === "delivered")
      return <CheckCheck className="w-4 h-4 text-blue-400" />;
    if (status === "sent") return <Check className="w-4 h-4 text-blue-400" />;
    return null;
  };

  const handleDeleteConversation = async (conversationId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      try {
        // Supprimer immédiatement de la sidebar
        setConversations((prev) =>
          prev.filter((conv) => conv._id !== conversationId)
        );
        setMenuOpen(null);

        // Rediriger si c'est la conversation active
        if (activeConversationId === conversationId) {
          router.push("/");
        }

        // Émettre l'événement pour informer les autres composants
        window.dispatchEvent(
          new CustomEvent('conversation-deleted-local', {
            detail: { conversationId }
          })
        );
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const totalInvitations = receivedInvitations.length;

  return (
    <div className={`w-full lg:w-96 ${sidebarBg} flex flex-col h-screen shadow-xl relative`}>
      {/* Header avec gradient bleu */}
      <div className={`relative overflow-hidden ${headerBg}`}>
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${isDark ? 'opacity-10' : 'opacity-20'}`}></div>

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Photo de profil utilisateur */}
              <div
                className="relative shrink-0 cursor-pointer group"
                onClick={() => router.push("/profile")}
                title="Voir mon profil"
              >
                {user?.profilePicture && user.profilePicture.trim() !== "" ? (
                  <div className={`w-15 h-15 rounded-full overflow-hidden shadow-lg ring-2 ${isDark ? 'ring-blue-700/50 group-hover:ring-blue-500/80' : 'ring-white/50 group-hover:ring-white/80'} animate-scale-in transition-all`}>
                    <Image
                      src={user.profilePicture}
                      alt={user?.name || "User"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.name || "User"
                        )}&background=${isDark ? '0ea5e9' : 'ffffff'}&color=${isDark ? 'ffffff' : '0ea5e9'}&bold=true`;
                      }}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-linear-to-br from-blue-800/50 to-blue-900/30 backdrop-blur-sm' : 'bg-linear-to-br from-white/30 to-white/10 backdrop-blur-sm'} flex items-center justify-center ${isDark ? 'text-cyan-100' : 'text-white'} font-bold text-lg shadow-lg ring-2 ${isDark ? 'ring-blue-700/50 group-hover:ring-blue-500/80' : 'ring-white/50 group-hover:ring-white/80'} animate-scale-in transition-all`}>
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-blue-600 shadow-md"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`text-xl font-bold drop-shadow-lg truncate ${isDark ? 'text-cyan-50' : 'text-white'}`}>
                  Messages
                </h1>
                <p className={`text-xs font-medium truncate ${isDark ? 'text-blue-200' : 'text-blue-100'}`}>
                  {user?.name || "Utilisateur"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`p-2.5 rounded-xl transition-all transform hover:scale-110 active:scale-95 backdrop-blur-sm shrink-0 ${isDark ? 'hover:bg-blue-800/30 text-cyan-100' : 'hover:bg-white/20 text-white'}`}
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs modernes bleus */}
          <div className={`flex gap-2 ${tabBg} p-1.5 rounded-2xl`}>
            <button
              onClick={() => handleTabChange("chats")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "chats"
                  ? activeTabStyle
                  : inactiveTabStyle
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chats</span>
            </button>
            <button
              onClick={() => handleTabChange("contacts")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "contacts"
                  ? activeTabStyle
                  : inactiveTabStyle
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </button>
            <button
              onClick={() => handleTabChange("invitations")}
              className={`relative flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "invitations"
                  ? activeTabStyle
                  : inactiveTabStyle
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Invit.</span>
              {totalInvitations > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-linear-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse-glow">
                  {totalInvitations > 9 ? "9+" : totalInvitations}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden">
        {loading && activeTab !== "invitations" ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative">
              <div className={`animate-spin rounded-full h-16 w-16 border-4 ${isDark ? 'border-blue-800/50 border-t-cyan-400' : 'border-blue-100 border-t-blue-600'}`}></div>
              <Sparkles className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-blue-600'} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse`} />
            </div>
            <p className={`mt-6 text-sm font-semibold ${isDark ? 'text-cyan-300' : 'text-blue-600'}`}>
              Chargement...
            </p>
          </div>
        ) : activeTab === "contacts" ? (
          <div className="animate-fade-in">
            <Contacts></Contacts>
            {!searchTerm.trim() ? (
              <></>
            ) : usersToDisplay.length === 0 ? (
              <div className="p-12 text-center">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}>
                  <Users className={`w-12 h-12 ${isDark ? 'text-blue-400' : 'text-slate-400'}`} />
                </div>
                <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                  Aucun résultat
                </p>
                <p className={`text-sm ${textSecondary}`}>
                  Essayez un autre terme de recherche
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {usersToDisplay.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleSendInvitation(contact._id)}
                    className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 group border-2 border-transparent shadow-sm hover:shadow-lg transform hover:scale-[1.02] animate-slide-in-left ${
                      isDark 
                        ? 'bg-linear-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800 hover:to-blue-900 hover:border-blue-700' 
                        : 'bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-200'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 transition-all ${
                        isDark 
                          ? 'ring-blue-800 group-hover:ring-cyan-500' 
                          : 'ring-blue-100 group-hover:ring-blue-400'
                      }`}>
                        <Image
                          src={
                            contact.profilePicture?.trim() ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              contact.name || "User"
                            )}&background=0ea5e9&color=fff&bold=true`
                          }
                          alt={contact.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              contact.name || "User"
                            )}&background=0ea5e9&color=fff&bold=true`;
                          }}
                          unoptimized
                        />
                      </div>
                      {isUserOnline(contact._id) && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 border-2 border-blue-900 rounded-full shadow-md"></span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className={`font-bold truncate transition-colors ${
                        isDark 
                          ? 'text-cyan-100 group-hover:text-cyan-300' 
                          : 'text-slate-800 group-hover:text-blue-600'
                      }`}>
                        {contact.name}
                      </h3>
                      <p className={`text-sm truncate ${isDark ? 'text-blue-300' : 'text-slate-500'}`}>
                        {contact.email}
                      </p>
                    </div>
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isDark 
                        ? 'bg-blue-800 group-hover:bg-cyan-500' 
                        : 'bg-blue-100 group-hover:bg-blue-500'
                    }`}>
                      <UserPlus className={`w-5 h-5 transition-colors ${
                        isDark 
                          ? 'text-cyan-300 group-hover:text-blue-950' 
                          : 'text-blue-500 group-hover:text-white'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "invitations" ? (
          <div className="animate-fade-in">
            <div className={`p-4 flex gap-2 sticky top-0 z-10 backdrop-blur-sm ${
              isDark 
                ? 'bg-linear-to-b from-blue-950/50 to-transparent' 
                : 'bg-linear-to-b from-blue-50/50 to-transparent'
            }`}>
              <button
                onClick={() => setInvitationTab("received")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  invitationTab === "received"
                    ? `${buttonStyle} text-white shadow-lg transform scale-[1.02]`
                    : `${isDark ? 'bg-linear-to-r from-blue-900/80 to-blue-800/80 text-blue-200 hover:from-blue-800 hover:to-blue-900' : 'bg-white text-slate-600 hover:bg-slate-50'} shadow-sm`
                }`}
              >
                Reçues{" "}
                {receivedInvitations.length > 0 &&
                  `(${receivedInvitations.length})`}
              </button>
              <button
                onClick={() => setInvitationTab("sent")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                  invitationTab === "sent"
                    ? `${buttonStyle} text-white shadow-lg transform scale-[1.02]`
                    : `${isDark ? 'bg-linear-to-r from-blue-900/80 to-blue-800/80 text-blue-200 hover:from-blue-800 hover:to-blue-900' : 'bg-white text-slate-600 hover:bg-slate-50'} shadow-sm`
                }`}
              >
                Envoyées{" "}
                {sentInvitations.length > 0 && `(${sentInvitations.length})`}
              </button>
            </div>

            {invitationTab === "received" ? (
              receivedInvitations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}>
                    <Bell className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                  </div>
                  <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                    Aucune invitation reçue
                  </p>
                  <p className={`text-sm ${textSecondary}`}>
                    Les invitations apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {receivedInvitations.map((invitation) => (
                    <div
                      key={invitation._id}
                      className={`p-5 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all animate-slide-in-left ${
                        isDark 
                          ? 'bg-linear-to-r from-blue-900/80 to-blue-800/80 border-blue-800' 
                          : 'bg-white border-blue-100'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative shrink-0">
                          <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${
                            isDark ? 'ring-blue-800' : 'ring-blue-100'
                          }`}>
                            <Image
                              src={
                                invitation.sender?.profilePicture ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  invitation.sender?.name || "User"
                                )}&background=0ea5e9&color=fff&bold=true`
                              }
                              alt={invitation.sender?.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  invitation.sender?.name || "User"
                                )}&background=0ea5e9&color=fff&bold=true`;
                              }}
                              unoptimized
                            />
                          </div>
                          {isUserOnline(invitation.sender?._id) && (
                            <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 border-2 border-blue-900 rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold truncate ${textPrimary}`}>
                            {invitation.sender?.name}
                          </h3>
                          <p className={`text-sm truncate ${textSecondary}`}>
                            {invitation.sender?.email}
                          </p>
                          <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${isDark ? 'text-cyan-400' : 'text-blue-500'}`}>
                            <Clock className="w-3 h-3" />
                            {formatMessageTime(invitation.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className={`text-sm p-3 rounded-xl mb-4 ${
                          isDark 
                            ? 'text-blue-200 bg-blue-900/50' 
                            : 'text-slate-700 bg-blue-50'
                        }`}>
                          {invitation.message}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvitation(invitation._id)}
                          className="flex-1 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          <UserCheck className="w-5 h-5" />
                          Accepter
                        </button>
                        <button
                          onClick={() =>
                            handleRejectInvitation(
                              invitation._id,
                              invitation.sender?._id
                            )
                          }
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
            ) : sentInvitations.length === 0 ? (
              <div className="p-12 text-center">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}>
                  <Send className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-slate-400'}`} />
                </div>
                <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                  Aucune invitation envoyée
                </p>
                <p className={`text-sm ${textSecondary}`}>
                  Envoyez des invitations depuis l&apos;onglet Contacts
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {sentInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className={`p-5 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all animate-slide-in-left ${
                      isDark 
                        ? 'bg-linear-to-r from-blue-900/80 to-blue-800/80 border-blue-800' 
                        : 'bg-white border-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${
                          isDark ? 'ring-blue-800' : 'ring-blue-100'
                        }`}>
                          <Image
                            src={
                              invitation.receiver?.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                invitation.receiver?.name || "User"
                              )}&background=0ea5e9&color=fff&bold=true`
                            }
                            alt={invitation.receiver?.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                invitation.receiver?.name || "User"
                              )}&background=0ea5e9&color=fff&bold=true`;
                            }}
                            unoptimized
                          />
                        </div>
                        {isUserOnline(invitation.receiver?._id) && (
                          <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 border-2 border-blue-900 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold truncate ${textPrimary}`}>
                          {invitation.receiver?.name}
                        </h3>
                        <p className={`text-sm truncate ${textSecondary}`}>
                          {invitation.receiver?.email}
                        </p>
                        <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${isDark ? 'text-cyan-400' : 'text-blue-500'}`}>
                          <Clock className="w-3 h-3" />
                          {formatMessageTime(invitation.createdAt)}
                        </p>
                      </div>
                    </div>
                    {invitation.message && (
                      <p className={`text-sm p-3 rounded-xl mb-4 ${
                        isDark 
                          ? 'text-blue-200 bg-blue-900/50' 
                          : 'text-slate-700 bg-blue-50'
                      }`}>
                        {invitation.message}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        handleCancelInvitation(
                          invitation._id,
                          invitation.receiver?._id
                        )
                      }
                      className="w-full bg-linear-to-r from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    >
                      <X className="w-5 h-5" />
                      Annuler l&apos;invitation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-12 text-center animate-fade-in">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${emptyStateBg}`}>
                    <MessageCircle className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                  </div>
                  <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                    Aucune conversation
                  </p>
                  <p className={`text-sm mb-6 ${textSecondary}`}>
                    Commencez à discuter avec vos contacts
                  </p>
                  <button
                    onClick={() => handleTabChange("contacts")}
                    className={`px-8 py-3 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${buttonStyle}`}
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

                    return (
                      
                      <div
                        key={conv._id}
                        className="relative group animate-slide-in-left"
                        onMouseLeave={() => setMenuOpen(null)}
                      >
                        <button
                          onClick={() => router.push(`/chat/${conv._id}`)}
                          className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 ${conversationCard(isActive, unreadCount > 0)}`}
                        >
                          <div className="relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImage}
                              alt={displayName}
                              className={`w-14 h-14 rounded-2xl object-cover ring-2 ${
                                isDark ? 'ring-blue-800' : 'ring-blue-100'
                              }`}
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  displayName
                                )}&background=0ea5e9&color=fff&bold=true`;
                              }}
                            />
                            {!conv.isGroup &&
                              contact &&
                              isUserOnline(contact._id) && (
                                <span className="absolute bottom-0 right-0 w-4 h-4 bg-cyan-500 border-2 border-blue-900 rounded-full shadow-md"></span>
                              )}
                            {conv.isGroup && (
                              <span className="absolute bottom-0 right-0 w-6 h-6 bg-linear-to-br from-purple-500 to-pink-500 border-2 border-blue-900 rounded-full flex items-center justify-center shadow-md">
                                <Users className="w-3 h-3 text-white" />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3
                                className={`font-bold truncate pr-2 ${
                                  isActive
                                    ? "text-white"
                                    : unreadCount > 0
                                    ? (isDark ? "text-cyan-100" : "text-slate-800")
                                    : (isDark ? "text-blue-200" : "text-slate-700")
                                }`}
                              >
                                {displayName}
                              </h3>
                              {lastMessageTime && (
                                <span
                                  className={`text-xs shrink-0 font-semibold ${
                                    isActive
                                      ? "text-white/90"
                                      : unreadCount > 0
                                      ? (isDark ? "text-cyan-300" : "text-blue-600")
                                      : (isDark ? "text-blue-300" : "text-slate-400")
                                  }`}
                                >
                                  {lastMessageTime}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {messageStatus && renderStatusIcon(messageStatus)}
                              <p
                                className={`text-sm truncate ${
                                  isActive
                                    ? "text-white/90"
                                    : unreadCount > 0
                                    ? (isDark ? "font-semibold text-blue-200" : "font-semibold text-slate-700")
                                    : (isDark ? "text-blue-300" : "text-slate-500")
                                }`}
                              >
                                {getLastMessagePreview(conv)}
                              </p>
                            </div>
                          </div>

                          {unreadCount > 0 && (
                            <span className={`shrink-0 text-white text-xs font-bold px-3 py-1.5 rounded-full min-w-6 text-center shadow-md ${
                              isDark 
                                ? 'bg-linear-to-r from-blue-500 to-cyan-500' 
                                : 'bg-linear-to-r from-blue-500 to-cyan-500'
                            }`}>
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(
                              menuOpen === conv._id ? null : conv._id
                            );
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${
                            isDark 
                              ? 'hover:bg-blue-800/50' 
                              : 'hover:bg-blue-100'
                          }`}
                        >
                          <MoreVertical className={`w-5 h-5 ${
                            isDark ? 'text-cyan-300' : 'text-blue-500'
                          }`} />
                        </button>

                        {menuOpen === conv._id && (
                          <div className={`absolute right-2 top-full mt-2 rounded-2xl shadow-2xl border-2 py-2 z-20 w-52 animate-scale-in ${
                            isDark 
                              ? 'bg-linear-to-r from-blue-900 to-blue-800 border-blue-700' 
                              : 'bg-white border-blue-100'
                          }`}>
                            <button className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${
                              isDark 
                                ? 'hover:bg-blue-800/50 text-blue-200' 
                                : 'hover:bg-blue-50 text-slate-700'
                            }`}>
                              <Pin className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                              Épingler
                            </button>
                            <button className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${
                              isDark 
                                ? 'hover:bg-blue-800/50 text-blue-200' 
                                : 'hover:bg-blue-50 text-slate-700'
                            }`}>
                              <Archive className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-500'}`} />
                              Archiver
                            </button>
                            <hr className={`my-2 ${isDark ? 'border-blue-700' : 'border-slate-200'}`} />
                            <button
                              onClick={() => handleDeleteConversation(conv._id)}
                              className={`w-full px-4 py-3 text-left text-sm text-red-600 flex items-center gap-3 font-medium transition-colors ${
                                isDark 
                                  ? 'hover:bg-blue-800/50 text-red-400' 
                                  : 'hover:bg-red-50'
                              }`}
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

            {activeTab === "chats" && (
              <button
                onClick={() => router.push("/group/create")}
                className={`fixed bottom-6 right-6 w-12 h-12 text-white rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center z-50 group ${
                  isDark 
                    ? 'bg-linear-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-cyan-500/50' 
                    : 'bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50'
                }`}
                title="Créer un groupe"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}