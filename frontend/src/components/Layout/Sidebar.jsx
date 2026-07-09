"use client";

import {
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useSidebarConversations } from "@/hooks/useSidebarConversations";
import { getSocket } from "@/services/socket";
import {
  Search,
  Pin,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Contacts from "../Contacts/Contacts";
import ContactSearchResults from "./ContactSearchResults";
import ConversationList from "./ConversationList";
import InvitationList from "./InvitationList";
import SidebarHeader from "./SidebarHeader";
import { useInvitations } from "@/hooks/useInvitations";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";
import { useSidebarStatuses } from "@/hooks/useSidebarStatuses";
import { useConversationActions } from "@/hooks/useConversationActions";
import { useContactSearch } from "@/hooks/useContactSearch";
import { useConversationDisplay } from "@/hooks/useConversationDisplay";
import { useSidebarPrefetch } from "@/hooks/useSidebarPrefetch";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

export default function Sidebar({ activeConversationId }) {
  const { user, logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUserId = user?._id || user?.id;

  // 🔥 Optimisation : État de chargement spécifique pour les invitations
  const [activeTab, setActiveTab] = useState("chats");
  const [menuOpen, setMenuOpen] = useState(null);
  const { isUserOnline } = useOnlineUsers(Boolean(user));
  const {
    searchTerm,
    setSearchTerm,
    setSearchResults,
    usersToDisplay,
    resetSearch,
  } = useContactSearch(activeTab);

  const [hiddenConversationIds, setHiddenConversationIds] = useState(new Set());
  const refreshTimeoutRef = useRef(null);
  const [conversationFilter, setConversationFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const isAllMode = conversationFilter === "all" && unreadOnly === false;
  const {
    conversations,
    conversationsLoading,
    initialLoading,
    fetchConversations,
    updateConversations,
  } = useSidebarConversations(currentUserId);
  const {
    invitationsLoading,
    receivedInvitations,
    sentInvitations,
    invitationTab,
    setInvitationTab,
    fetchInvitations,
    handleSendInvitation,
    handleAcceptInvitation,
    handleRejectInvitation,
    handleCancelInvitation,
  } = useInvitations({
    user,
    activeTab,
    setActiveTab,
    setSearchTerm,
    setSearchResults,
    router,
    fetchConversations,
    updateConversations,
  });
  const {
    loadAllStatuses,
    checkContactHasUnviewedStatus,
    checkContactHasStatus,
    markStatusAsViewed,
  } = useSidebarStatuses();

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
  const {
    conversationCard,
    getDisplayName,
    getDisplayImage,
    getOtherParticipant,
    getLastMessagePreview,
    formatMessageTime,
    getMessageStatus,
    renderStatusIcon,
  } = useConversationDisplay({ getFullUrl, isDark, user });
  useSidebarPrefetch(router, conversations);
  useUnreadMessagesCount({
    conversations,
    currentUserId,
    hiddenConversationIds,
  });

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

  useEffect(() => {
    if (user) {
      fetchConversations({ force: false });
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
      const timeoutId = window.setTimeout(() => {
        setActiveTab(tab);
        if (tab !== "contacts") {
          resetSearch();
        }
        if (tab === "invitations") {
          fetchInvitations();
        }
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [searchParams, fetchInvitations, resetSearch]);

  useEffect(() => {
    const socket = getSocket();

    if (socket && user && currentUserId) {
      socket.on("conversation-updated", (updatedConversation) => {
        updateConversations((prevConversations) => {
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
          updateConversations((prev) =>
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
          updateConversations((prev) =>
            prev.map((conv) =>
              conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
            ),
          );
        }
      });

      socket.on("conversation-status-updated", ({ conversationId, status }) => {
        updateConversations((prev) =>
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
        updateConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
      });

      socket.on("group-created", (group) => {
        updateConversations((prev) => {
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
  }, [user, currentUserId, fetchConversations, updateConversations]);

  const handleTabChange = useCallback(
    (tab) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
        if (tab !== "contacts") {
          resetSearch();
        } else {
          fetchConversations();
        }
      }
    },
    [activeTab, fetchConversations, resetSearch],
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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const {
    handleBlockConversationContact,
    handleArchiveConversation,
    handleClearConversation,
  } = useConversationActions({
    fetchConversations,
    getOtherParticipant,
    setHiddenConversationIds,
    setMenuOpen,
  });


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
      <SidebarHeader
        activeTab={activeTab}
        activeTabStyle={activeTabStyle}
        conversationFilter={conversationFilter}
        conversations={conversations}
        headerBg={headerBg}
        inactiveTabStyle={inactiveTabStyle}
        isDark={isDark}
        logout={logout}
        router={router}
        setConversationFilter={setConversationFilter}
        setUnreadOnly={setUnreadOnly}
        tabBg={tabBg}
        unreadOnly={unreadOnly}
        user={user}
      />

      <div className="flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-scrollbar]:hidden">
        {(activeTab === "chats" ? conversationsLoading : initialLoading) &&
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
            <ContactSearchResults
              emptyStateBg={emptyStateBg}
              handleSendInvitation={handleSendInvitation}
              isDark={isDark}
              searchTerm={searchTerm}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              usersToDisplay={usersToDisplay}
            />
          </div>
        ) : activeTab === "invitations" ? (
          <InvitationList
            isDark={isDark}
            buttonStyle={buttonStyle}
            emptyStateBg={emptyStateBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            invitationTab={invitationTab}
            setInvitationTab={setInvitationTab}
            invitationsLoading={invitationsLoading}
            receivedInvitations={receivedInvitations}
            sentInvitations={sentInvitations}
            getFullUrl={getFullUrl}
            isUserOnline={isUserOnline}
            formatMessageTime={formatMessageTime}
            handleAcceptInvitation={handleAcceptInvitation}
            handleRejectInvitation={handleRejectInvitation}
            handleCancelInvitation={handleCancelInvitation}
          />
        ) : (
          <ConversationList
            activeConversationId={activeConversationId}
            buttonStyle={buttonStyle}
            checkContactHasStatus={checkContactHasStatus}
            checkContactHasUnviewedStatus={checkContactHasUnviewedStatus}
            conversationCard={conversationCard}
            emptyStateBg={emptyStateBg}
            formatMessageTime={formatMessageTime}
            getDisplayImage={getDisplayImage}
            getDisplayName={getDisplayName}
            getLastMessagePreview={getLastMessagePreview}
            getMessageStatus={getMessageStatus}
            getOtherParticipant={getOtherParticipant}
            handleArchiveConversation={handleArchiveConversation}
            handleBlockConversationContact={handleBlockConversationContact}
            handleClearConversation={handleClearConversation}
            isAllMode={isAllMode}
            isDark={isDark}
            isUserOnline={isUserOnline}
            markStatusAsViewed={markStatusAsViewed}
            menuOpen={menuOpen}
            renderStatusIcon={renderStatusIcon}
            router={router}
            setMenuOpen={setMenuOpen}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            visibleConversations={visibleConversations}
          />
        )}
      </div>
    </div>
  );
}
