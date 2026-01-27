// src/components/Notifications/GlobalNotificationListener.jsx
"use client";

import { useEffect, useContext, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/context/AuthProvider";
import { useNotifications } from "@/context/NotificationContext";
import {
  getSocket,
  isSocketConnected,
  addGlobalMessageListener,
} from "@/services/socket";
import { useMute } from "@/context/MuteContext";

export default function GlobalNotificationListener() {
  const { user } = useContext(AuthContext);
  const { showNotification } = useNotifications();
  const { isMuted } = useMute();
  const pathname = usePathname();
  const listenerAddedRef = useRef(false);
  const retryIntervalRef = useRef(null);

  // Extraire l'ID de conversation actuelle depuis l'URL
  const getCurrentConversationId = useCallback(() => {
    if (pathname?.startsWith("/chat/")) {
      return pathname.split("/chat/")[1]?.split("?")[0];
    }
    return null;
  }, [pathname]);

  // Handler pour les nouveaux messages
  const handleNewMessage = useCallback(
    (message) => {
      if (!user || !message) return;

      const currentUserId = user._id || user.id;
      const senderId =
        message.sender?._id || message.sender?.id || message.sender;

      // Ignorer mes propres messages
      if (senderId === currentUserId) {
        return;
      }

      // Vérifier si on est sur cette conversation
      const currentConvId = getCurrentConversationId();
      const messageConvId =
        typeof message.conversationId === "object"
          ? message.conversationId._id?.toString()
          : message.conversationId?.toString();

            // ✅ AJOUT ICI (avant le check "on est sur la conversation")
    if (messageConvId && isMuted(messageConvId)) {
      console.log("🔕 Conversation muted, notification bloquée:", messageConvId);
      return;
    }

      // Si on est sur la conversation, pas de notification (ChatPage gère)
      if (currentConvId && currentConvId === messageConvId) {
        console.log("📍 Sur la conversation, pas de notification globale");
        return;
      }

      // Afficher la notification
      console.log("🔔 Notification globale pour message:", message._id);

      let notificationBody = "";
      switch (message.type) {
        case "text":
          notificationBody = message.content?.slice(0, 50) || "Nouveau message";
          break;
        case "image":
          notificationBody = "📷 Image";
          break;
        case "video":
          notificationBody = "🎬 Vidéo";
          break;
        case "file":
          notificationBody = `📎 ${message.fileName || "Fichier"}`;
          break;
        case "voice":
        case "audio":
          notificationBody = "🎤 Message vocal";
          break;
        case "call":
          notificationBody = "📞 Appel";
          break;
        default:
          notificationBody = "Nouveau message";
      }

      const senderName = message.sender?.name || "Nouveau message";

      showNotification(senderName, {
        body: notificationBody,
        icon: message.sender?.profilePicture || "/default-avatar.png",
        tag: messageConvId,
      });
    },
    [user, getCurrentConversationId, showNotification, isMuted] 
  );

  useEffect(() => {
    if (!user) {
      console.log("⏳ GlobalNotificationListener: User non connecté");
      return;
    }

    const setupListener = () => {
      const socket = getSocket();

      if (!socket || !isSocketConnected()) {
        console.log("⏳ GlobalNotificationListener: Socket non prêt");
        return false;
      }

      if (listenerAddedRef.current) {
        return true;
      }

      console.log("🔔 GlobalNotificationListener: Ajout de l'écouteur global");

      // Ajouter l'écouteur global
      const unsubscribe = addGlobalMessageListener(handleNewMessage);
      listenerAddedRef.current = true;

      // Stocker la fonction de nettoyage
      return unsubscribe;
    };

    // Essayer immédiatement
    let unsubscribe = setupListener();

    // Si échec, réessayer toutes les secondes
    if (!unsubscribe) {
      retryIntervalRef.current = setInterval(() => {
        if (isSocketConnected() && !listenerAddedRef.current) {
          unsubscribe = setupListener();
          if (unsubscribe) {
            clearInterval(retryIntervalRef.current);
          }
        }
      }, 1000);
    }

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
      listenerAddedRef.current = false;
    };
  }, [user, handleNewMessage]);

  return null;
}
