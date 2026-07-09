"use client";

import { useCallback } from "react";
import { Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function useConversationDisplay({ getFullUrl, isDark, user }) {
  const getOtherParticipant = useCallback(
    (conv) => {
      const userId = user?._id || user?.id;
      return conv.participants?.find((p) => (p._id || p.id) !== userId);
    },
    [user],
  );

  const conversationCard = useCallback(
    (isActive, hasUnread) => {
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
    },
    [isDark],
  );

  const getDisplayName = useCallback(
    (conv) => {
      if (conv.isGroup) {
        return conv.groupName || "Groupe sans nom";
      }
      const contact = getOtherParticipant(conv);
      return contact?.name || "Utilisateur";
    },
    [getOtherParticipant],
  );

  const getDisplayImage = useCallback(
    (conv) => {
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
    },
    [getFullUrl, getOtherParticipant],
  );

  const getLastMessagePreview = useCallback(
    (conv) => {
      const userId = user?._id || user?.id;
      const myDeletion = conv.deletedBy?.find(
        (item) => item.userId?.toString() === userId?.toString(),
      );

      if (!conv.lastMessage) return "D\u00e9marrer la conversation";

      if (myDeletion && myDeletion.deletedAt && conv.lastMessage.createdAt) {
        const deletedAt = new Date(myDeletion.deletedAt);
        const lastMsgDate = new Date(conv.lastMessage.createdAt);
        if (lastMsgDate <= deletedAt) return "D\u00e9marrer la conversation";
      }

      const lastMsg = conv.lastMessage;

      if (lastMsg.type === "call") {
        const isVideo = lastMsg.callDetails?.type === "video";
        const icon = isVideo ? "\u{1F4F9}" : "\u{1F4DE}";
        const status = lastMsg.callDetails?.status;
        const amICaller = lastMsg.sender?._id === userId;

        if (status === "missed") {
          if (amICaller) return `${icon} Appel sans r\u00e9ponse`;
          return `${icon} Appel manqu\u00e9`;
        }
        if (status === "ended") return `${icon} Appel termin\u00e9`;
        return `${icon} Appel`;
      }

      if (lastMsg.type === "image") return "\u{1F5BC}\uFE0F Image";
      if (lastMsg.type === "video") return "\u{1F3AC} Vid\u00e9o";
      if (lastMsg.type === "file")
        return `\u{1F4C4} ${lastMsg.fileName || "Fichier"}`;
      if (lastMsg.type === "voice" || lastMsg.type === "audio")
        return "\u{1F3A4} Message vocal";

      const preview = lastMsg.content || "";
      return preview.length > 40 ? preview.substring(0, 40) + "..." : preview;
    },
    [user],
  );

  const formatMessageTime = useCallback((date) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: false,
        locale: fr,
      }).replace("environ ", "");
    } catch {
      return "";
    }
  }, []);

  const getMessageStatus = useCallback(
    (conv) => {
      const userId = user?._id || user?.id;
      if (conv.lastMessage?.sender?._id === userId) {
        return conv.lastMessage.status || "sent";
      }
      return null;
    },
    [user],
  );

  const renderStatusIcon = useCallback((status) => {
    if (status === "read")
      return <CheckCheck className="w-4 h-4 text-cyan-400" />;
    if (status === "delivered")
      return <CheckCheck className="w-4 h-4 text-blue-400" />;
    if (status === "sent") return <Check className="w-4 h-4 text-blue-400" />;
    return null;
  }, []);

  return {
    conversationCard,
    getDisplayName,
    getDisplayImage,
    getOtherParticipant,
    getLastMessagePreview,
    formatMessageTime,
    getMessageStatus,
    renderStatusIcon,
  };
}
