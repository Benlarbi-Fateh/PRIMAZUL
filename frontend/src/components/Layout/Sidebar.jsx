"use client";

import {
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import api from "@/lib/api";
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
  deleteConversationForUser,
  archiveConversation,
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
  User,
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
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Contacts from "../Contacts/Contacts";

export default function Sidebar({ activeConversationId }) {
  const { user, logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUserId = user?._id || user?.id;

  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // 🔥 Optimisation : État de chargement spécifique pour les invitations
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  const isFirstLoadRef = useRef(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [menuOpen, setMenuOpen] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [invitationTab, setInvitationTab] = useState("received");
  const [hiddenConversationIds, setHiddenConversationIds] = useState(new Set());
  const [statusViewedCache, setStatusViewedCache] = useState(new Map());
  const [statusCache, setStatusCache] = useState(new Map());
  const searchTimeoutRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const [conversationFilter, setConversationFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const isAllMode = conversationFilter === "all" && unreadOnly === false;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // ✅ 2. FONCTION UTILITAIRE POUR CORRIGER LES URLS
  const getFullUrl = useCallback(
    (path) => {
      if (!path || path.trim() === "") return null;
      let cleanPath = path.replace(/\\/g, "/");
      if (cleanPath.startsWith("http")) return cleanPath;
      return `${API_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
    },
    [API_URL],
  );

  const usersToDisplay = useMemo(() => {
    if (activeTab !== "contacts" || !searchTerm.trim()) {
      return [];
    }
    return searchResults;
  }, [activeTab, searchTerm, searchResults]);

  const broadcastInvitationCount = useCallback((count) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("invitations-count-changed", {
          detail: { count },
        }),
      );
    }
  }, []);

  useEffect(() => {
    broadcastInvitationCount(receivedInvitations.length);
  }, [receivedInvitations, broadcastInvitationCount]);

  // Styles basés sur le thème
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
  const emptyStateBg = isDark
    ? "bg-gradient-to-br from-blue-900/80 to-blue-950/80 border-blue-800/30"
    : "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200";
  const textPrimary = isDark ? "text-blue-50" : "text-slate-900";
  const textSecondary = isDark ? "text-blue-200" : "text-slate-600";
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

  const fetchInvitations = useCallback(async () => {
    try {
      if (activeTab === "invitations" && receivedInvitations.length === 0) {
        setInvitationsLoading(true);
      }

      const [received, sent] = await Promise.all([
        getReceivedInvitations(),
        getSentInvitations(),
      ]);
      setReceivedInvitations(received.data.invitations || []);
      setSentInvitations(sent.data.invitations || []);
    } catch (error) {
      console.error("Erreur chargement invitations:", error);
    } finally {
      setInvitationsLoading(false);
    }
  }, [activeTab, receivedInvitations.length]);

  const fetchConversations = useCallback(async () => {
    try {
      if (isFirstLoadRef.current) {
        setConversationsLoading(true);
      }

      const response = await getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error);
    } finally {
      isFirstLoadRef.current = false;
      setConversationsLoading(false);
      setLoading(false);
    }
  }, []);

  const loadAllStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔍 Chargement des statuts pour sidebar...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const statusMap = new Map();
        const unviewedMap = new Map();

        if (data?.friendsStatuses && Array.isArray(data.friendsStatuses)) {
          data.friendsStatuses.forEach((group) => {
            if (group.user?._id) {
              const userId = group.user._id;
              statusMap.set(userId, true);
              const isUnviewed = Boolean(group.hasUnviewed);
              unviewedMap.set(userId, isUnviewed);
            }
          });
        }

        setStatusCache(statusMap);
        setStatusViewedCache(unviewedMap);
      } else {
        console.error("❌ Erreur API Status");
      }
    } catch (error) {
      console.error("❌ Erreur chargement status:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setTimeout(() => {
        fetchInvitations();
        loadAllStatuses();
      }, 100);

      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchInvitations();
        }
      }, 120000);

      return () => clearInterval(interval);
    }
  }, [user, fetchConversations, fetchInvitations, loadAllStatuses]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;

    if (tab === "chats" || tab === "contacts" || tab === "invitations") {
      setActiveTab(tab);
      if (tab !== "contacts") {
        setSearchTerm("");
        setSearchResults([]);
      }
      if (tab === "invitations") {
        fetchInvitations();
      }
    }
  }, [searchParams, fetchInvitations]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const totalUnread = conversations
      .filter((conv) => {
        if (hiddenConversationIds.has(conv._id)) return false;
        const isArchivedByMe = conv.archivedBy?.some(
          (item) => item.userId?.toString() === currentUserId?.toString(),
        );
        if (isArchivedByMe) return false;
        return true;
      })
      .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

    window.dispatchEvent(
      new CustomEvent("unread-messages-count-changed", {
        detail: { count: totalUnread },
      }),
    );
  }, [conversations, hiddenConversationIds, currentUserId]);

  useEffect(() => {
    if (!user) return;

    const handleInvitationReceived = (invitation) => {
      setReceivedInvitations((prev) => [invitation, ...prev]);
    };

    const handleInvitationAccepted = ({ invitation, conversation }) => {
      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id),
      );
      setConversations((prev) => [conversation, ...prev]);
    };

    const handleInvitationRejected = (invitation) => {
      setSentInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitation._id),
      );
    };

    const handleInvitationCancelled = (invitationId) => {
      setReceivedInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId),
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
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    const socket = getSocket();

    if (socket && user && currentUserId) {
      socket.on("conversation-updated", (updatedConversation) => {
        setConversations((prevConversations) => {
          const existingIndex = prevConversations.findIndex(
            (conv) => conv._id === updatedConversation._id,
          );

          if (existingIndex !== -1) {
            const newConversations = [...prevConversations];
            newConversations[existingIndex] = {
              ...newConversations[existingIndex],
              ...updatedConversation,
              lastMessage: updatedConversation.lastMessage,
              updatedAt: updatedConversation.updatedAt,
              unreadCount:
                updatedConversation.lastMessage?.sender === currentUserId ||
                updatedConversation.lastMessage?.sender?._id === currentUserId
                  ? 0
                  : updatedConversation.unreadCount,
            };
            return newConversations.sort(
              (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
            );
          } else {
            return [updatedConversation, ...prevConversations];
          }
        });
      });

      socket.on(
        "message-status-updated",
        ({ messageIds, status, conversationId }) => {
          setConversations((prev) =>
            prev.map((conv) => {
              if (
                conv._id === conversationId &&
                conv.lastMessage &&
                messageIds.includes(conv.lastMessage._id)
              ) {
                return {
                  ...conv,
                  lastMessage: {
                    ...conv.lastMessage,
                    status: status,
                  },
                };
              }
              return conv;
            }),
          );
        },
      );

      socket.on("conversation-read-update", ({ conversationId, userId }) => {
        if (userId === currentUserId) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
            ),
          );
        }
      });

      socket.on("conversation-status-updated", ({ conversationId, status }) => {
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv._id === conversationId && conv.lastMessage) {
              return {
                ...conv,
                lastMessage: { ...conv.lastMessage, status: status },
              };
            }
            return conv;
          }),
        );
      });

      socket.on("conversation-read", ({ conversationId }) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
      });

      socket.on("group-created", (group) => {
        setConversations((prev) => {
          const exists = prev.some((conv) => conv._id === group._id);
          return exists ? prev : [group, ...prev];
        });
      });

      socket.on("should-refresh-conversations", () => {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
          fetchConversations();
        }, 300);
      });

      return () => {
        socket.off("conversation-updated");
        socket.off("message-status-updated");
        socket.off("conversation-read-update");
        socket.off("conversation-status-updated");
        socket.off("conversation-read");
        socket.off("group-created");
        socket.off("should-refresh-conversations");
        clearTimeout(refreshTimeoutRef.current);
      };
    }
  }, [user, currentUserId, fetchConversations]);

  const handleTabChange = useCallback(
    (tab) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
        if (tab !== "contacts") {
          setSearchTerm("");
          setSearchResults([]);
        } else {
          fetchConversations();
        }
      }
    },
    [activeTab, fetchConversations],
  );

  useEffect(() => {
    const handleSidebarChangeTab = (event) => {
      const { tab } = event.detail || {};
      if (!tab) return;
      if (tab === "chats" || tab === "contacts" || tab === "invitations") {
        handleTabChange(tab);
      }
    };

    window.addEventListener("sidebar-change-tab", handleSidebarChangeTab);
    return () => {
      window.removeEventListener("sidebar-change-tab", handleSidebarChangeTab);
    };
  }, [handleTabChange]);

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
        error.response?.data?.error || "Erreur lors de l'envoi de l'invitation",
      );
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    try {
      setLoading(true);
      const response = await acceptInvitation(invitationId);
      const { invitation, conversation } = response.data || {};

      if (!invitation || invitation.status !== "accepted") {
        throw new Error("Invitation non valide");
      }

      setReceivedInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId),
      );

      if (conversation) {
        setConversations((prev) => {
          const exists = prev.some((conv) => conv._id === conversation._id);
          if (!exists) {
            return [conversation, ...prev];
          }
          return prev;
        });
      }

      if (invitation && conversation) {
        emitInvitationAccepted({
          senderId: invitation.sender._id,
          invitation,
          conversation,
        });
      }

      setTimeout(() => {
        fetchConversations();
      }, 500);
      setActiveTab("chats");
      if (conversation?._id) {
        router.push(`/chat/${conversation._id}`);
      }
      alert("✅ Invitation acceptée avec succès !");
    } catch (error) {
      console.error("Erreur acceptation invitation:", error);
      if (error.response?.status === 409) {
        alert("Cette invitation a déjà été acceptée ou n'est plus valable.");
        await fetchInvitations();
        await fetchConversations();
      } else {
        alert(
          error.response?.data?.error ||
            error.message ||
            "Erreur lors de l'acceptation de l'invitation",
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
        prev.filter((inv) => inv._id !== invitationId),
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
        prev.filter((inv) => inv._id !== invitationId),
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
      const fullUrl = getFullUrl(conv.groupImage);
      return (
        fullUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.groupName || "Groupe")}&background=6366f1&color=fff`
      );
    }
    const contact = getOtherParticipant(conv);
    const profileUrl = getFullUrl(contact?.profilePicture);
    return profileUrl
      ? profileUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || "User")}&background=3b82f6&color=fff&bold=true`;
  };

  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    const participant = conv.participants?.find(
      (p) => (p._id || p.id) !== userId,
    );
    return participant;
  };

  // ✅ FONCTION AJOUTÉE
  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId.toString());
  };

  const getLastMessagePreview = (conv) => {
    const userId = user?._id || user?.id;
    const myDeletion = conv.deletedBy?.find(
      (item) => item.userId?.toString() === userId?.toString(),
    );

    if (!conv.lastMessage) return "Démarrer la conversation";

    if (myDeletion && myDeletion.deletedAt && conv.lastMessage.createdAt) {
      const deletedAt = new Date(myDeletion.deletedAt);
      const lastMsgDate = new Date(conv.lastMessage.createdAt);
      if (lastMsgDate <= deletedAt) return "Démarrer la conversation";
    }

    const lastMsg = conv.lastMessage;

    if (lastMsg.type === "call") {
      const isVideo = lastMsg.callDetails?.type === "video";
      const icon = isVideo ? "📹" : "📞";
      const status = lastMsg.callDetails?.status;
      const amICaller = lastMsg.sender?._id === userId;

      if (status === "missed") {
        if (amICaller) return `${icon} Appel sans réponse`;
        return `${icon} Appel manqué`;
      }
      if (status === "ended") return `${icon} Appel terminé`;
      return `${icon} Appel`;
    }

    if (lastMsg.type === "image") return "🖼️ Image";
    if (lastMsg.type === "video") return "🎬 Vidéo";
    if (lastMsg.type === "file") return `📄 ${lastMsg.fileName || "Fichier"}`;
    if (lastMsg.type === "voice" || lastMsg.type === "audio")
      return "🎤 Message vocal";

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

  const checkContactHasUnviewedStatus = (contactId) => {
    if (!contactId || !statusCache.has(contactId)) return false;
    const hasUnviewed = statusViewedCache.get(contactId);
    return hasUnviewed === true;
  };

  const checkContactHasStatus = (contactId) => {
    return statusCache.has(contactId);
  };

  const markStatusAsViewed = (contactId) => {
    setStatusViewedCache((prev) => {
      const next = new Map(prev);
      next.set(contactId, true);
      return next;
    });
  };

  const handleBlockConversationContact = async (conv) => {
    if (conv.isGroup) return;
    const contact = getOtherParticipant(conv);
    if (!contact?._id) return alert("❌ Contact non défini");

    if (
      !confirm(
        `Êtes-vous sûr de vouloir bloquer ${contact.name} ?\n\n⚠️ Conséquences :\n- ${contact.name} sera RETIRÉ de vos contacts\n- Votre conversation sera MASQUÉE (pas supprimée)\n- Vous ne recevrez plus ses messages\n- Il ne pourra plus vous contacter`,
      )
    ) {
      return;
    }

    try {
      const response = await api.post("/message-settings/block", {
        targetUserId: contact._id,
      });
      if (response.data?.success) {
        window.dispatchEvent(new CustomEvent("block-status-changed"));
        await fetchConversations();
        alert(`🚫 ${contact.name} a été bloqué et retiré de vos contacts`);
      } else {
        throw new Error(response.data?.message || "Erreur inconnue");
      }
    } catch (err) {
      console.error("❌ Erreur blocage (sidebar):", err);
      alert(
        "❌ Erreur lors du blocage: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setMenuOpen(null);
    }
  };

  const visibleConversations = useMemo(
    () =>
      conversations.filter((conv) => {
        if (hiddenConversationIds.has(conv._id)) return false;
        const isArchivedByMe = conv.archivedBy?.some(
          (item) => item.userId?.toString() === currentUserId?.toString(),
        );
        if (isArchivedByMe) return false;
        if (conversationFilter === "private" && conv.isGroup) return false;
        if (conversationFilter === "group" && !conv.isGroup) return false;
        if (unreadOnly && (conv.unreadCount || 0) === 0) return false;
        return true;
      }),
    [
      conversations,
      hiddenConversationIds,
      currentUserId,
      conversationFilter,
      unreadOnly,
    ],
  );

  return (
    <div
      className={`w-full lg:w-96 ${sidebarBg} flex flex-col h-screen shadow-xl relative`}
    >
      <div className={`relative overflow-hidden ${headerBg}`}>
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${isDark ? "opacity-10" : "opacity-20"}`}
        ></div>

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="relative shrink-0 cursor-pointer group"
                onClick={() => router.push("/profile")}
                title="Voir mon profil"
              >
                {user?.profilePicture && user.profilePicture.trim() !== "" ? (
                  <div
                    className={`w-15 h-15 rounded-full overflow-hidden shadow-lg ring-2 ${isDark ? "ring-blue-700/50 group-hover:ring-blue-500/80" : "ring-white/50 group-hover:ring-white/80"} animate-scale-in transition-all`}
                  >
                    <Image
                      src={user.profilePicture}
                      alt={user?.name || "User"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=${isDark ? "0ea5e9" : "ffffff"}&color=${isDark ? "ffffff" : "0ea5e9"}&bold=true`;
                      }}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full ${isDark ? "bg-linear-to-br from-blue-800/50 to-blue-900/30 backdrop-blur-sm" : "bg-linear-to-br from-white/30 to-white/10 backdrop-blur-sm"} flex items-center justify-center ${isDark ? "text-cyan-100" : "text-white"} font-bold text-lg shadow-lg ring-2 ${isDark ? "ring-blue-700/50 group-hover:ring-blue-500/80" : "ring-white/50 group-hover:ring-white/80"} animate-scale-in transition-all`}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-blue-600 shadow-md"></div>
              </div>

              <div className="flex-1 min-w-0">
                <h1
                  className={`text-xl font-bold drop-shadow-lg truncate ${isDark ? "text-cyan-50" : "text-white"}`}
                >
                  {activeTab === "contacts"
                    ? "Contacts"
                    : activeTab === "invitations"
                      ? "Invitations"
                      : "Messages"}
                </h1>
                <p
                  className={`text-xs font-medium truncate ${isDark ? "text-blue-200" : "text-blue-100"}`}
                >
                  {user?.name || "Utilisateur"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className={`p-2.5 rounded-xl transition-all transform hover:scale-110 active:scale-95 backdrop-blur-sm shrink-0 ${isDark ? "hover:bg-blue-800/30 text-cyan-100" : "hover:bg-white/20 text-white"}`}
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {activeTab === "chats" && (
            <div className={`flex gap-2 ${tabBg} p-1.5 rounded-2xl`}>
              <button
                title="Tous"
                onClick={() => {
                  setConversationFilter("all");
                  setUnreadOnly(false);
                }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${conversationFilter === "all" && !unreadOnly ? activeTabStyle : inactiveTabStyle}`}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                title="Non lus"
                onClick={() => {
                  setConversationFilter("all");
                  setUnreadOnly(true);
                }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center relative ${
                  // ✅ Ajout de "relative"
                  unreadOnly ? activeTabStyle : inactiveTabStyle
                }`}
              >
                <Bell className="w-5 h-5" />

                {/* 🔥 BADGE COMPTEUR NON LU */}
                {conversations.reduce(
                  (sum, conv) => sum + (conv.unreadCount || 0),
                  0,
                ) > 0 && (
                  <span className="absolute top-1.5 right-3 min-w-[14px] h-[14px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 border border-white dark:border-slate-900 shadow-sm animate-pulse">
                    {conversations.reduce(
                      (sum, conv) => sum + (conv.unreadCount || 0),
                      0,
                    ) > 99
                      ? "99+"
                      : conversations.reduce(
                          (sum, conv) => sum + (conv.unreadCount || 0),
                          0,
                        )}
                  </span>
                )}
              </button>
              <button
                title="Privés"
                onClick={() => {
                  setConversationFilter("private");
                  setUnreadOnly(false);
                }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${conversationFilter === "private" && !unreadOnly ? activeTabStyle : inactiveTabStyle}`}
              >
                <User className="w-5 h-5" />
              </button>
              <button
                title="Groupes"
                onClick={() => {
                  setConversationFilter("group");
                  setUnreadOnly(false);
                }}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${conversationFilter === "group" && !unreadOnly ? activeTabStyle : inactiveTabStyle}`}
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden">
        {(activeTab === "chats" ? conversationsLoading : loading) &&
        activeTab !== "invitations" ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative">
              <div
                className={`animate-spin rounded-full h-16 w-16 border-4 ${isDark ? "border-blue-800/50 border-t-cyan-400" : "border-blue-100 border-t-blue-600"}`}
              ></div>
              <Sparkles
                className={`w-8 h-8 ${isDark ? "text-cyan-400" : "text-blue-600"} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse`}
              />
            </div>
            <p
              className={`mt-6 text-sm font-semibold ${isDark ? "text-cyan-300" : "text-blue-600"}`}
            >
              Chargement...
            </p>
          </div>
        ) : activeTab === "contacts" ? (
          <div className="animate-fade-in">
            <Contacts />
            {usersToDisplay.length === 0 && searchTerm.trim() && (
              <div className="p-12 text-center">
                <div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}
                >
                  <Users
                    className={`w-12 h-12 ${isDark ? "text-blue-400" : "text-slate-400"}`}
                  />
                </div>
                <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                  Aucun résultat
                </p>
                <p className={`text-sm ${textSecondary}`}>
                  Essayez un autre terme de recherche
                </p>
              </div>
            )}
            {usersToDisplay.length > 0 && (
              <div className="p-3 space-y-2">
                {usersToDisplay.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => handleSendInvitation(contact._id)}
                    className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 group border-2 border-transparent shadow-sm hover:shadow-lg transform hover:scale-[1.02] animate-slide-in-left ${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800 hover:to-blue-900 hover:border-blue-700" : "bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-200"}`}
                  >
                    <div className="flex-1 text-left min-w-0">
                      <h3
                        className={`font-bold truncate transition-colors ${isDark ? "text-cyan-100 group-hover:text-cyan-300" : "text-slate-800 group-hover:text-blue-600"}`}
                      >
                        {contact.name}
                      </h3>
                      <p
                        className={`text-sm truncate ${isDark ? "text-blue-300" : "text-slate-500"}`}
                      >
                        {contact.email}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-blue-800 group-hover:bg-cyan-500" : "bg-blue-100 group-hover:bg-blue-500"}`}
                    >
                      <UserPlus
                        className={`w-5 h-5 transition-colors ${isDark ? "text-cyan-300 group-hover:text-blue-950" : "text-blue-500 group-hover:text-white"}`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "invitations" ? (
          <div className="animate-fade-in">
            <div
              className={`p-4 flex gap-2 sticky top-0 z-10 backdrop-blur-sm ${isDark ? "bg-linear-to-b from-blue-950/50 to-transparent" : "bg-linear-to-b from-blue-50/50 to-transparent"}`}
            >
              <button
                onClick={() => setInvitationTab("received")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all relative flex items-center justify-center gap-2 ${
                  // ✅ Flex et relative ajoutés
                  invitationTab === "received"
                    ? `${buttonStyle} text-white shadow-lg transform scale-[1.02]`
                    : `${
                        isDark
                          ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 text-blue-200 hover:from-blue-800 hover:to-blue-900"
                          : "bg-white text-slate-600 hover:bg-slate-50"
                      } shadow-sm`
                }`}
              >
                <span>Reçues</span>

                {/* 🔥 BADGE COMPTEUR INVITATIONS REÇUES */}
                {receivedInvitations.length > 0 && (
                  <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 shadow-md animate-bounce">
                    {receivedInvitations.length > 99
                      ? "99+"
                      : receivedInvitations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setInvitationTab("sent")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${invitationTab === "sent" ? `${buttonStyle} text-white shadow-lg transform scale-[1.02]` : `${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 text-blue-200 hover:from-blue-800 hover:to-blue-900" : "bg-white text-slate-600 hover:bg-slate-50"} shadow-sm`}`}
              >
                Envoyées{" "}
                {sentInvitations.length > 0 && `(${sentInvitations.length})`}
              </button>
            </div>
            {invitationsLoading ? (
              <div className="flex justify-center py-10">
                <div
                  className={`animate-spin rounded-full h-10 w-10 border-4 ${isDark ? "border-blue-800/50 border-t-cyan-400" : "border-blue-100 border-t-blue-600"}`}
                ></div>
              </div>
            ) : invitationTab === "received" ? (
              receivedInvitations.length === 0 ? (
                <div className="p-12 text-center">
                  <div
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}
                  >
                    <Bell
                      className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                    />
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
                      className={`p-5 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all animate-slide-in-left ${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 border-blue-800" : "bg-white border-blue-100"}`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative shrink-0">
                          <div
                            className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${isDark ? "ring-blue-800" : "ring-blue-100"}`}
                          >
                            <Image
                              src={
                                getFullUrl(invitation.sender?.profilePicture) ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.sender?.name || "User")}&background=0ea5e9&color=fff&bold=true`
                              }
                              alt={invitation.sender?.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
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
                          <p
                            className={`text-xs mt-1 flex items-center gap-1 font-medium ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                          >
                            <Clock className="w-3 h-3" />
                            {formatMessageTime(invitation.createdAt)}
                          </p>
                        </div>
                      </div>
                      {invitation.message && (
                        <p
                          className={`text-sm p-3 rounded-xl mb-4 ${isDark ? "text-blue-200 bg-blue-900/50" : "text-slate-700 bg-blue-50"}`}
                        >
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
                              invitation.sender?._id,
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
                <div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}
                >
                  <Send
                    className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-slate-400"}`}
                  />
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
                    className={`p-5 rounded-2xl border-2 shadow-md hover:shadow-xl transition-all animate-slide-in-left ${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 border-blue-800" : "bg-white border-blue-100"}`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="relative shrink-0">
                        <div
                          className={`w-14 h-14 rounded-full overflow-hidden ring-2 ${isDark ? "ring-blue-800" : "ring-blue-100"}`}
                        >
                          <Image
                            src={
                              getFullUrl(invitation.receiver?.profilePicture) ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.receiver?.name || "User")}&background=0ea5e9&color=fff&bold=true`
                            }
                            alt={invitation.receiver?.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
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
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 font-medium ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                        >
                          <Clock className="w-3 h-3" />
                          {formatMessageTime(invitation.createdAt)}
                        </p>
                      </div>
                    </div>
                    {invitation.message && (
                      <p
                        className={`text-sm p-3 rounded-xl mb-4 ${isDark ? "text-blue-200 bg-blue-900/50" : "text-slate-700 bg-blue-50"}`}
                      >
                        {invitation.message}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        handleCancelInvitation(
                          invitation._id,
                          invitation.receiver?._id,
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
              {visibleConversations.length === 0 ? (
                <div className="p-12 text-center animate-fade-in">
                  <div
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${emptyStateBg}`}
                  >
                    <MessageCircle
                      className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                    />
                  </div>
                  <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                    Aucune conversation
                  </p>
                  <p className={`text-sm mb-6 ${textSecondary}`}>
                    Commencez à discuter avec vos contacts
                  </p>
                  {isAllMode && (
                    <button
                      onClick={() => router.push("/?tab=contacts&subtab=add")}
                      className={`px-8 py-3 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${buttonStyle}`}
                    >
                      Rechercher des contacts
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {visibleConversations.map((conv) => {
                    const isActive = conv._id === activeConversationId;
                    const messageStatus = getMessageStatus(conv);
                    const lastMessageTime = formatMessageTime(conv.updatedAt);
                    const unreadCount = conv.unreadCount || 0;
                    const displayName = getDisplayName(conv);
                    const displayImage = getDisplayImage(conv);
                    const contact = getOtherParticipant(conv);
                    const contactHasStatus = contact
                      ? checkContactHasStatus(contact._id)
                      : false;

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
                            {!conv.isGroup && contact && contactHasStatus && (
                              <div
                                className="absolute -inset-1 rounded-full border-3"
                                style={{
                                  borderColor: checkContactHasUnviewedStatus(
                                    contact._id,
                                  )
                                    ? "#3b82f6"
                                    : "#9ca3af",
                                }}
                              ></div>
                            )}
                            <div
                              className={`relative w-13 h-13 rounded-full overflow-hidden cursor-pointer ${!conv.isGroup && contact && contactHasStatus ? "ring-2 ring-white dark:ring-slate-900" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  !conv.isGroup &&
                                  contact &&
                                  contactHasStatus
                                ) {
                                  markStatusAsViewed(contact._id);
                                  router.push(`/status?open=${contact._id}`);
                                }
                              }}
                            >
                              <Image
                                src={displayImage}
                                alt={displayName}
                                fill
                                sizes="40px"
                                loading="lazy"
                                className="object-cover"
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff&bold=true`;
                                }}
                              />
                            </div>
                            {!conv.isGroup &&
                              contact &&
                              !contactHasStatus &&
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
                            <div className="flex items-center justify-between mb-1 pr-8">
                              <h3
                                className={`font-bold truncate pr-2 ${isActive ? "text-white" : unreadCount > 0 ? (isDark ? "text-cyan-100" : "text-slate-800") : isDark ? "text-blue-200" : "text-slate-700"}`}
                              >
                                {displayName}
                              </h3>
                              {lastMessageTime && (
                                <span
                                  className={`text-xs shrink-0 font-semibold ${isActive ? "text-white/90" : unreadCount > 0 ? (isDark ? "text-cyan-300" : "text-blue-600") : isDark ? "text-blue-300" : "text-slate-400"}`}
                                >
                                  {lastMessageTime}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {messageStatus && renderStatusIcon(messageStatus)}
                              <p
                                className={`text-sm truncate ${isActive ? "text-white/90" : unreadCount > 0 ? (isDark ? "font-semibold text-blue-200" : "font-semibold text-slate-700") : isDark ? "text-blue-300" : "text-slate-500"}`}
                              >
                                {getLastMessagePreview(conv)}
                              </p>
                            </div>
                          </div>
                          {unreadCount > 0 && (
                            <span
                              className={`shrink-0 text-white text-xs font-bold px-3 py-1.5 rounded-full min-w-6 text-center shadow-md ${isDark ? "bg-linear-to-r from-blue-500 to-cyan-500" : "bg-linear-to-r from-blue-500 to-cyan-500"}`}
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(
                              menuOpen === conv._id ? null : conv._id,
                            );
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all ${isDark ? "hover:bg-blue-800/50" : "hover:bg-blue-100"}`}
                        >
                          <MoreVertical
                            className={`w-5 h-5 ${isDark ? "text-cyan-300" : "text-blue-500"}`}
                          />
                        </button>
                        {menuOpen === conv._id && (
                          <div
                            className={`absolute right-2 top-[120%] -translate-y-1/2 rounded-2xl shadow-2xl border-2 py-2 z-20 w-52 animate-scale-in ${isDark ? "bg-linear-to-r from-blue-900 to-blue-800 border-blue-700" : "bg-white border-blue-100"}`}
                          >
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm(`Archiver cette discussion ?`))
                                  return;
                                setHiddenConversationIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(conv._id);
                                  return next;
                                });
                                setMenuOpen(null);
                                try {
                                  await archiveConversation(conv._id);
                                } catch (error) {
                                  console.error("❌ Erreur archivage:", error);
                                  alert("Erreur lors de l'archivage");
                                }
                              }}
                              className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${isDark ? "hover:bg-blue-800/50 text-blue-200" : "hover:bg-blue-50 text-slate-700"}`}
                            >
                              <Archive
                                className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-blue-500"}`}
                              />
                              Archiver
                            </button>
                            {!conv.isGroup && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockConversationContact(conv);
                                }}
                                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${isDark ? "hover:bg-red-900/40 text-red-300 hover:text-red-200" : "hover:bg-red-50 text-red-600 hover:text-red-700"}`}
                              >
                                <Shield className="w-5 h-5" />
                                Bloquer le contact
                              </button>
                            )}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm(`Vider cette discussion ?`))
                                  return;
                                try {
                                  await api.delete(
                                    `/message-settings/conversations/${conv._id}/delete`,
                                  );
                                  setMenuOpen(null);
                                  window.dispatchEvent(
                                    new CustomEvent("conversation-cleared", {
                                      detail: { conversationId: conv._id },
                                    }),
                                  );
                                  await fetchConversations();
                                  alert("✅ Discussion vidée");
                                } catch (error) {
                                  console.error("❌ Erreur:", error);
                                  alert("❌ Erreur lors du vidage");
                                }
                              }}
                              className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 font-medium transition-colors ${isDark ? "hover:bg-red-900/50 text-red-300 hover:text-red-200" : "hover:bg-red-50 text-red-600 hover:text-red-700"}`}
                            >
                              <Trash2 className="w-5 h-5" />
                              Supprimer la discussion
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
                className={`fixed bottom-6 right-6 w-12 h-12 text-white rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center z-50 group ${isDark ? "bg-linear-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-cyan-500/50" : "bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/50"}`}
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
