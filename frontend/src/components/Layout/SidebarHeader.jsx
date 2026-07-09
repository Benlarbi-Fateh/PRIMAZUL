"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";
import SidebarTabs from "./SidebarTabs";

export default function SidebarHeader({
  activeTab,
  activeTabStyle,
  conversationFilter,
  conversations,
  headerBg,
  inactiveTabStyle,
  isDark,
  logout,
  router,
  setConversationFilter,
  setUnreadOnly,
  tabBg,
  unreadOnly,
  user,
}) {
  const title =
    activeTab === "contacts"
      ? "Contacts"
      : activeTab === "invitations"
        ? "Invitations"
        : "Messages";

  return (
    <div className={`relative overflow-hidden ${headerBg}`}>
      <div
        className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iJ2hzbCgyMTAsIDgwJSwgNTAlKSciIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] ${isDark ? "opacity-10" : "opacity-20"}`}
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
                    onError={(event) => {
                      event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=${isDark ? "0ea5e9" : "ffffff"}&color=${isDark ? "ffffff" : "0ea5e9"}&bold=true`;
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
                {title}
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
            title="Deconnexion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <SidebarTabs
          activeTab={activeTab}
          activeTabStyle={activeTabStyle}
          conversationFilter={conversationFilter}
          conversations={conversations}
          inactiveTabStyle={inactiveTabStyle}
          setConversationFilter={setConversationFilter}
          setUnreadOnly={setUnreadOnly}
          tabBg={tabBg}
          unreadOnly={unreadOnly}
        />
      </div>
    </div>
  );
}
