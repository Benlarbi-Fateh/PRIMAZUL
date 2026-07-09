"use client";

import { Bell, MessageCircle, User, Users } from "lucide-react";

export default function SidebarTabs({
  activeTab,
  activeTabStyle,
  conversationFilter,
  conversations,
  inactiveTabStyle,
  setConversationFilter,
  setUnreadOnly,
  tabBg,
  unreadOnly,
}) {
  if (activeTab !== "chats") return null;

  const unreadCount = conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0,
  );

  return (
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
        className={`flex-1 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center relative ${unreadOnly ? activeTabStyle : inactiveTabStyle}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-3 min-w-[14px] h-[14px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 border border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <button
        title="Prives"
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
  );
}
