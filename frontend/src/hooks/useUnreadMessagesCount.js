"use client";

import { useEffect } from "react";

export function useUnreadMessagesCount({
  conversations,
  currentUserId,
  hiddenConversationIds,
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const totalUnread = conversations
      .filter((conv) => {
        if (hiddenConversationIds.has(conv._id)) return false;
        const isArchivedByMe = conv.archivedBy?.some(
          (item) => item.userId?.toString() === currentUserId?.toString(),
        );
        return !isArchivedByMe;
      })
      .reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

    window.dispatchEvent(
      new CustomEvent("unread-messages-count-changed", {
        detail: { count: totalUnread },
      }),
    );
  }, [conversations, hiddenConversationIds, currentUserId]);
}
