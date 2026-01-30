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
  const { mutedSet, isLoaded } = useMute();
  const pathname = usePathname();
  
  const listenerAddedRef = useRef(false);
  const retryIntervalRef = useRef(null);
  
  // ✅ CORRECTION MAJEURE : Mise à jour synchrone des Refs
  // Au lieu d'attendre un useEffect/useLayoutEffect, on met à jour 
  // la référence à chaque cycle de rendu. C'est plus sûr pour les callbacks.
  const stateRef = useRef({ mutedSet, isLoaded });
  stateRef.current = { mutedSet, isLoaded };

  const getCurrentConversationId = useCallback(() => {
    if (pathname?.startsWith("/chat/")) {
      return pathname.split("/chat/")[1]?.split("?")[0];
    }
    return null;
  }, [pathname]);

  const handleNewMessage = useCallback(
    (message) => {
      if (!user || !message) return;

      // 1. Récupération de l'état le plus frais possible
      const { mutedSet: currentMutedSet, isLoaded: currentIsLoaded } = stateRef.current;

      // 🛑 Sécurité : Si la liste des mutes n'est pas chargée, on ne notifie PAS
      // pour éviter de notifier par erreur une conv qui devrait être mute.
      if (!currentIsLoaded) {
        console.log("⏳ MuteContext non chargé, notification ignorée par sécurité.");
        return;
      }

      const currentUserId = user._id || user.id;
      const senderId = message.sender?._id || message.sender?.id || message.sender;

      if (senderId === currentUserId) return;

      // 2. Extraction Robuste de l'ID
      // On gère les objets, les strings et on force en String
      const rawConvId = typeof message.conversationId === "object"
        ? message.conversationId?._id
        : message.conversationId;
        
      const messageConvId = rawConvId?.toString();

      // 🛑 Vérification Mute
      if (messageConvId && currentMutedSet.has(messageConvId)) {
        console.log(`🔕 Notification BLOQUÉE pour ${messageConvId} (Muted)`);
        return; // <-- C'est ici que le message est stoppé
      }

      // 3. Vérification page actuelle
      const currentConvId = getCurrentConversationId();
      if (currentConvId && currentConvId === messageConvId) {
        return;
      }

      // ✅ Si on arrive ici, on notifie
      let notificationBody = "Nouveau message";
      if (message.type === "text") notificationBody = message.content?.slice(0, 50) || "Texte";
      else if (message.type === "image") notificationBody = "📷 Photo";
      else if (message.type === "voice") notificationBody = "🎤 Vocal";
      
      showNotification(message.sender?.name || "Message", {
        body: notificationBody,
        icon: message.sender?.profilePicture,
        tag: messageConvId,
      });
    },
    [user, getCurrentConversationId, showNotification] // stateRef n'a pas besoin d'être ici
  );

  // ... (Le reste du useEffect pour le socket reste identique)
  useEffect(() => {
    if (!user) return;
    const setupListener = () => {
      const socket = getSocket();
      if (!socket || !isSocketConnected()) return false;
      if (listenerAddedRef.current) return true;

      const unsubscribe = addGlobalMessageListener(handleNewMessage);
      listenerAddedRef.current = true;
      return unsubscribe;
    };

    let unsubscribe = setupListener();
    if (!unsubscribe) {
      retryIntervalRef.current = setInterval(() => {
        if (isSocketConnected() && !listenerAddedRef.current) {
          unsubscribe = setupListener();
          if (unsubscribe) clearInterval(retryIntervalRef.current);
        }
      }, 1000);
    }

    return () => {
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
      if (typeof unsubscribe === "function") unsubscribe();
      listenerAddedRef.current = false;
    };
  }, [user, handleNewMessage]);

  return null;
}