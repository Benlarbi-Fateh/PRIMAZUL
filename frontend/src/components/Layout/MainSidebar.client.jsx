"use client";

import { useRouter } from "next/navigation";
import { useContext, useState, useEffect, useMemo } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import {
  MessageCircle,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  CircleDashed,
  UsersRound,
  Bell,
  ListTodo,
} from "lucide-react";
import { getConversations, getReceivedInvitations } from "@/lib/api";

export default function MainSidebar() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Détecter si l'appareil supporte le hover (pas tactile uniquement)
  const [canHover, setCanHover] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(hover: hover)").matches;
    }
    return false;
  });

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [invitationCount, setInvitationCount] = useState(0);

  // ✅ Détecter la capacité de hover au montage
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");

    const handler = (e) => setCanHover(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const sidebarBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 border-blue-800"
    : "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 border-blue-800";

  const toggleButtonBg = isDark
    ? "bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800";

  const menuItemStyle = isDark
    ? "hover:bg-blue-800/50 text-blue-200 hover:text-blue-50"
    : "hover:bg-white/20 text-white/80 hover:text-white";

  const logoutStyle = isDark
    ? "hover:bg-red-700/50 text-blue-200 hover:text-red-100"
    : "hover:bg-red-600 text-white/80 hover:text-white";

  const tooltipBg = isDark
    ? "bg-blue-900/90 backdrop-blur-sm text-blue-100 border-blue-800"
    : "bg-blue-800/90 backdrop-blur-sm text-white border-blue-700";

  const logoutTooltipBg = isDark
    ? "bg-red-800/90 backdrop-blur-sm text-red-100 border-red-800"
    : "bg-red-600/90 backdrop-blur-sm text-white border-red-700";

  const overlayBg = isDark ? "bg-black/60" : "bg-black/50";

  const menuItems = useMemo(() => [
    { label: "Discussions", icon: MessageCircle, href: "/?tab=chats" },
    { label: "Contacts", icon: UsersRound, href: "/?tab=contacts" },
    { label: "Invitations", icon: Bell, href: "/?tab=invitations" },
    { label: "Statuts", icon: CircleDashed, href: "/status" },
    { label: "Mes Taches", icon: ListTodo, href: "/personal-tasks" },
    { label: "Paramètres", icon: Settings, href: "/settings" },
  ], []);

  useEffect(() => {
    menuItems.forEach((item) => router.prefetch(item.href));
  }, [menuItems, router]);

  useEffect(() => {
    const handleUnreadMessages = (event) => {
      setUnreadMessages(event.detail?.count || 0);
    };
    const handleInvitations = (event) => {
      setInvitationCount(event.detail?.count || 0);
    };

    window.addEventListener("unread-messages-count-changed", handleUnreadMessages);
    window.addEventListener("invitations-count-changed", handleInvitations);

    return () => {
      window.removeEventListener("unread-messages-count-changed", handleUnreadMessages);
      window.removeEventListener("invitations-count-changed", handleInvitations);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleMenuClick = (item) => {
    if (item.href) {
      router.push(item.href);
    }
    // ✅ Fermer après clic si on ne peut pas hover (mobile)
    if (!canHover) {
      setIsOpen(false);
    }
  };

  // ✅ Gestionnaires de hover simplifiés
  const handleMouseEnter = () => {
    if (canHover) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (canHover) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const refreshCounts = async () => {
      try {
        const [convRes, invRes] = await Promise.all([
          getConversations(),
          getReceivedInvitations(),
        ]);

        if (cancelled) return;

        const conversations = convRes.data.conversations || [];
        const invitations = invRes.data.invitations || [];

        const totalUnread = conversations.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0,
        );

        setUnreadMessages(totalUnread);
        setInvitationCount(invitations.length);
      } catch (e) {
        console.error("Erreur refresh compteurs MainSidebar:", e);
      }
    };

    refreshCounts();
    const interval = setInterval(refreshCounts, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  if (!user) return null;

  return (
    <>
      {/* Bouton Toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={handleMouseEnter} // ✅ Utilise le nouveau handler
        className={`fixed top-1/2 -translate-y-1/2 z-60 ${toggleButtonBg} text-white p-2 rounded-r-md shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? "left-16" : "-left-2"
        }`}
        title={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Overlay (visible seulement si on ne peut pas hover = mobile) */}
      {isOpen && !canHover && (
        <div
          className={`fixed inset-0 ${overlayBg} z-48`}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-16 ${sidebarBg} flex flex-col items-center py-4 shadow-xl z-49 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseLeave={handleMouseLeave} // ✅ Utilise le nouveau handler
      >
        {/* Pattern de fond */}
        <div
          className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] ${
            isDark ? "opacity-10" : "opacity-20"
          }`}
        />

        {/* Menu */}
        <nav className="flex-1 flex flex-col items-center gap-6 mt-4 relative z-10">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isDiscussionsItem = item.label === "Discussions";
            const isInvitationsItem = item.label === "Invitations";

            return (
              <div key={index} className="relative group">
                <button
                  onClick={() => handleMenuClick(item)}
                  className="flex flex-col items-center gap-1 transition-colors"
                >
                  <div
                    className={`relative p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${menuItemStyle}`}
                  >
                    <IconComponent className="w-6 h-6" />

                    {isDiscussionsItem && unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                        {unreadMessages > 9 ? "9+" : unreadMessages}
                      </span>
                    )}

                    {isInvitationsItem && invitationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-lime-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
                        {invitationCount > 9 ? "9+" : invitationCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-white/80">
                    {item.label}
                  </span>
                </button>

                <span
                  className={`absolute left-20 top-1/2 -translate-y-1/2 ${tooltipBg} text-sm font-medium py-2 px-3 rounded-lg border shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <div className="relative group mt-auto mb-4 z-10">
          <button
            onClick={handleLogout}
            className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${logoutStyle}`}
          >
            <LogOut className="w-6 h-6" />
          </button>
          <span
            className={`absolute left-20 top-1/2 -translate-y-1/2 ${logoutTooltipBg} text-sm font-medium py-2 px-3 rounded-lg border shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50`}
          >
            Déconnexion
          </span>
        </div>
      </aside>
    </>
  );
}
