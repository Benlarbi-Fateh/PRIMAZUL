// src/components/Notifications/GlobalNotificationListener.jsx
"use client";

import { useEffect, useLayoutEffect, useContext, useRef, useCallback } from "react";
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
  const { mutedSet, isLoaded } = useMute(); 
  const pathname = usePathname();
  const listenerAddedRef = useRef(false);
  const retryIntervalRef = useRef(null);
   const mutedRef = useRef(mutedSet);
   const isLoadedRef = useRef(isLoaded);


   // 3️⃣ AJOUT ICI : Mettre à jour la référence quand la liste change
  useLayoutEffect(() => {
  mutedRef.current = mutedSet;
  isLoadedRef.current = isLoaded; // 👈 Ligne à ajouter
}, [mutedSet, isLoaded]); 

  // Extraire l'ID de conversation actuelle depuis l'URL
  const getCurrentConversationId = useCallback(() => {
    if (pathname?.startsWith("/chat/")) {
      return pathname.split("/chat/")[1]?.split("?")[0];
    }
    return null;
  }, [pathname]);

  // Handler pour les nouveaux messages
    // Handler pour les nouveaux messages
  const handleNewMessage = useCallback(
    (message) => {
      if (!user || !message) return;

      // 🛑 PROTECTION CRITIQUE
      if (!isLoadedRef.current) {
        console.log("⏳ MuteContext non chargé, notification ignorée par sécurité.");
        return;
      }

      const currentUserId = user._id || user.id;
      const senderId = message.sender?._id || message.sender?.id || message.sender;

      // Ignorer mes propres messages
      if (senderId === currentUserId) {
        return;
      }
      
      const rawConvId = typeof message.conversationId === "object"
        ? message.conversationId._id
        : message.conversationId;

      const messageConvId = rawConvId?.toString();

      // ✅ Mute check
      if (messageConvId && mutedRef.current?.has(messageConvId)) {
        console.log("🔕 Notification bloquée (Conversation muette):", messageConvId);
        return;
      }

      // 🔥 CORRECTION ICI : On définit la variable manquante
      const currentConvId = getCurrentConversationId(); 

      // Si on est sur la conversation, pas de notification (ChatPage gère)
      // Maintenant currentConvId existe, donc plus d'erreur !
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
    [user, getCurrentConversationId, showNotification] 
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
