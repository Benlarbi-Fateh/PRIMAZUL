// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:5001";

let socket = null;
let currentUserId = null;
let onlineUsersCache = [];
let onlineUsersCallbacks = [];
let isInitializing = false;

// Callbacks pour les différents événements
let onUpdateMessageCallback = null;
let globalMessageCallbacks = [];

// ============================================
// INITIALISATION DU SOCKET
// ============================================

export const initSocket = (userId) => {
  if (typeof window === "undefined") return null;

  // Éviter les doubles initialisations
  if (isInitializing) {
    console.log("⏳ Initialisation déjà en cours...");
    return socket;
  }

  currentUserId = userId;

  // Si socket existe et est connecté avec le même userId
  if (socket?.connected && currentUserId === userId) {
    console.log("✅ Socket déjà connecté pour cet utilisateur");
    socket.emit("user-online", userId);
    socket.emit("request-online-users");
    return socket;
  }

  // Si socket existe mais pas connecté, essayer de reconnecter
  if (socket && !socket.connected) {
    console.log("🔄 Socket existe mais déconnecté, reconnexion...");
    socket.connect();
    return socket;
  }

  // Créer un nouveau socket
  console.log("🔌 Création d'un nouveau socket pour:", userId);
  isInitializing = true;

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    timeout: 20000,
    autoConnect: true,
  });

  // ============================================
  // ÉVÉNEMENTS DE CONNEXION
  // ============================================

  socket.on("connect", () => {
    console.log("✅ Socket connecté:", socket.id);
    isInitializing = false;

    if (currentUserId) {
      socket.emit("user-online", currentUserId);
      socket.emit("request-online-users");
      console.log(`👤 User ${currentUserId} rejoint sa room personnelle`);
    }

    // Réattacher les écouteurs globaux de messages
    setupGlobalMessageListeners();
  });

  socket.on("connection-confirmed", ({ userId, onlineUsers }) => {
    console.log("✅ Connexion confirmée pour:", userId);
    onlineUsersCache = onlineUsers || [];
    onlineUsersCallbacks.forEach((cb) => cb(onlineUsersCache));
  });

  socket.on("online-users-update", (userIds) => {
    console.log("📡 Mise à jour utilisateurs en ligne:", userIds?.length || 0);
    onlineUsersCache = userIds || [];
    onlineUsersCallbacks.forEach((cb) => cb(onlineUsersCache));
  });

  socket.on("conversation-joined", ({ conversationId }) => {
    console.log("✅ Conversation rejointe:", conversationId);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("🔄 Socket reconnecté après", attemptNumber, "tentatives");
    if (currentUserId) {
      socket.emit("user-online", currentUserId);
      socket.emit("request-online-users");
    }
    setupGlobalMessageListeners();
  });

  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log("🔄 Tentative de reconnexion:", attemptNumber);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Erreur de connexion Socket:", error.message);
    isInitializing = false;
  });

  socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket déconnecté:", reason);
    isInitializing = false;

    // Reconnexion automatique si déconnexion par le serveur
    if (reason === "io server disconnect") {
      console.log("🔄 Reconnexion forcée...");
      socket.connect();
    }
  });

  // Message mis à jour (pour les messages programmés)
  socket.on("update-message", (updatedMessage) => {
    console.log("📡 Message mis à jour reçu:", updatedMessage?._id);
    if (onUpdateMessageCallback) {
      onUpdateMessageCallback(updatedMessage);
    }
  });

  // Configurer les écouteurs globaux
  setupGlobalMessageListeners();

  return socket;
};

// ============================================
// ÉCOUTEURS GLOBAUX DE MESSAGES
// ============================================

const setupGlobalMessageListeners = () => {
  if (!socket) return;

  // Supprimer les anciens écouteurs pour éviter les doublons
  socket.off("receive-message");
  socket.off("new-message");

  // Écouteur pour receive-message
  socket.on("receive-message", (message) => {
    console.log("📩 [Global] Message reçu:", message?._id);
    globalMessageCallbacks.forEach((cb) => {
      try {
        cb(message);
      } catch (error) {
        console.error("❌ Erreur dans callback message:", error);
      }
    });
  });

  // Écouteur pour new-message (au cas où le backend utilise cet événement)
  socket.on("new-message", (message) => {
    console.log("📩 [Global] Nouveau message:", message?._id);
    globalMessageCallbacks.forEach((cb) => {
      try {
        cb(message);
      } catch (error) {
        console.error("❌ Erreur dans callback message:", error);
      }
    });
  });

  console.log("✅ Écouteurs globaux de messages configurés");
};

// ============================================
// GETTERS ET UTILITAIRES
// ============================================

export const getSocket = () => socket;

export const isSocketConnected = () => socket?.connected || false;

export const getCurrentUserId = () => currentUserId;

export const getOnlineUsersCache = () => onlineUsersCache;

export const getCurrentOnlineUsers = () => onlineUsersCache;

export const isUserOnline = (userId) => onlineUsersCache.includes(userId);

// ============================================
// ATTENDRE LA CONNEXION
// ============================================

const waitForConnection = (maxAttempts = 50) => {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve();
      return;
    }

    let attempts = 0;
    const checkConnection = setInterval(() => {
      attempts++;
      if (socket?.connected) {
        clearInterval(checkConnection);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkConnection);
        reject(new Error("Socket connection timeout"));
      }
    }, 100);
  });
};

// ============================================
// CONVERSATIONS
// ============================================

export const joinConversation = (conversationId) => {
  waitForConnection()
    .then(() => {
      console.log("📥 Rejoindre conversation:", conversationId);
      socket.emit("join-conversation", conversationId);
    })
    .catch((error) => {
      console.error("❌ Impossible de rejoindre:", error);
    });
};

export const leaveConversation = (conversationId) => {
  if (socket?.connected) {
    console.log("📤 Quitter conversation:", conversationId);
    socket.emit("leave-conversation", conversationId);
  }
};

// ============================================
// MESSAGES
// ============================================

export const sendMessage = (messageData) => {
  waitForConnection()
    .then(() => socket.emit("send-message", messageData))
    .catch((error) => console.error("❌ Impossible d'envoyer:", error));
};

// ✅ Fonction pour écouter les messages (utilisée par ChatPage)
export const onReceiveMessage = (callback) => {
  if (socket) {
    // Ne pas supprimer les écouteurs globaux, juste ajouter le callback
    if (!globalMessageCallbacks.includes(callback)) {
      globalMessageCallbacks.push(callback);
    }
  }
};

// ✅ Fonction pour ajouter un écouteur global de messages
export const addGlobalMessageListener = (callback) => {
  if (!globalMessageCallbacks.includes(callback)) {
    globalMessageCallbacks.push(callback);
    console.log(
      "➕ Écouteur global ajouté, total:",
      globalMessageCallbacks.length
    );
  }

  // S'assurer que les écouteurs socket sont configurés
  if (socket?.connected) {
    setupGlobalMessageListeners();
  }

  // Retourner une fonction pour se désabonner
  return () => {
    globalMessageCallbacks = globalMessageCallbacks.filter(
      (cb) => cb !== callback
    );
    console.log(
      "➖ Écouteur global retiré, total:",
      globalMessageCallbacks.length
    );
  };
};

// ✅ Fonction pour retirer un écouteur
export const removeMessageListener = (callback) => {
  globalMessageCallbacks = globalMessageCallbacks.filter(
    (cb) => cb !== callback
  );
};

export const onUpdateMessage = (callback) => {
  onUpdateMessageCallback = callback;

  if (socket) {
    socket.off("update-message");
    socket.on("update-message", (updatedMessage) => {
      console.log("📡 Message mis à jour reçu:", updatedMessage);
      onUpdateMessageCallback?.(updatedMessage);
    });
  }

  return () => {
    if (socket) socket.off("update-message");
    onUpdateMessageCallback = null;
  };
};

export const onMessageStatusUpdated = (callback) => {
  if (socket) {
    socket.off("message-status-updated");
    socket.on("message-status-updated", (data) => {
      console.log("📊 Statut mis à jour:", data);
      callback(data);
    });
  }
};

export const onConversationStatusUpdated = (callback) => {
  if (socket) {
    socket.off("conversation-status-updated");
    socket.on("conversation-status-updated", (data) => {
      console.log("📊 Statut conversation mis à jour:", data);
      callback(data);
    });
  }
};

export const onShouldRefreshConversations = (callback) => {
  if (socket) {
    socket.off("should-refresh-conversations");
    socket.on("should-refresh-conversations", () => {
      console.log("🔄 Demande de refresh des conversations");
      callback();
    });
  }
};

// ============================================
// TYPING
// ============================================

export const emitTyping = (conversationId, recipientId) => {
  if (socket?.connected) {
    socket.emit("typing", { conversationId, recipientId });
  }
};

export const emitStopTyping = (conversationId, recipientId) => {
  if (socket?.connected) {
    socket.emit("stop-typing", { conversationId, recipientId });
  }
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.off("user-typing");
    socket.on("user-typing", callback);
  }
};

export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.off("user-stopped-typing");
    socket.on("user-stopped-typing", callback);
  }
};

// ============================================
// BLOCAGE
// ============================================

export const onMessageBlocked = (callback) => {
  if (socket) {
    socket.off("message-error");
    socket.on("message-error", (errorData) => {
      console.log("🚫 Erreur message bloqué:", errorData);
      if (errorData.blocked) {
        callback(errorData);
      }
    });
  }
};

// ============================================
// ONLINE USERS
// ============================================

export const requestOnlineUsers = () => {
  if (socket?.connected) {
    console.log("📤 Demande de liste des utilisateurs en ligne");
    socket.emit("request-online-users");
  }
};

export const onOnlineUsersUpdate = (callback) => {
  onlineUsersCallbacks.push(callback);

  // Appeler immédiatement avec le cache si disponible
  if (onlineUsersCache.length > 0) {
    callback(onlineUsersCache);
  }

  return () => {
    onlineUsersCallbacks = onlineUsersCallbacks.filter((cb) => cb !== callback);
  };
};

// ============================================
// INVITATIONS
// ============================================

export const onInvitationReceived = (callback) => {
  if (socket) {
    socket.off("invitation-received");
    socket.on("invitation-received", (invitation) => {
      console.log("📨 Nouvelle invitation reçue:", invitation);
      callback(invitation);
    });
  }
};

export const onInvitationAccepted = (callback) => {
  if (socket) {
    socket.off("invitation-accepted-notification");
    socket.on("invitation-accepted-notification", (data) => {
      console.log("✅ Invitation acceptée:", data);
      callback(data);
    });
  }
};

export const onInvitationRejected = (callback) => {
  if (socket) {
    socket.off("invitation-rejected-notification");
    socket.on("invitation-rejected-notification", (invitation) => {
      console.log("❌ Invitation refusée:", invitation);
      callback(invitation);
    });
  }
};

export const onInvitationCancelled = (callback) => {
  if (socket) {
    socket.off("invitation-cancelled-notification");
    socket.on("invitation-cancelled-notification", (invitationId) => {
      console.log("🗑️ Invitation annulée:", invitationId);
      callback(invitationId);
    });
  }
};

export const emitInvitationSent = (data) => {
  waitForConnection()
    .then(() => {
      console.log("📨 Émission invitation envoyée:", data);
      socket.emit("invitation-sent", data);
    })
    .catch((error) =>
      console.error("❌ Impossible d'émettre invitation:", error)
    );
};

export const emitInvitationAccepted = (data) => {
  waitForConnection()
    .then(() => {
      console.log("✅ Émission invitation acceptée:", data);
      socket.emit("invitation-accepted", data);
    })
    .catch((error) =>
      console.error("❌ Impossible d'émettre acceptation:", error)
    );
};

export const emitInvitationRejected = (data) => {
  waitForConnection()
    .then(() => {
      console.log("❌ Émission invitation refusée:", data);
      socket.emit("invitation-rejected", data);
    })
    .catch((error) => console.error("❌ Impossible d'émettre refus:", error));
};

export const emitInvitationCancelled = (data) => {
  waitForConnection()
    .then(() => {
      console.log("🗑️ Émission invitation annulée:", data);
      socket.emit("invitation-cancelled", data);
    })
    .catch((error) =>
      console.error("❌ Impossible d'émettre annulation:", error)
    );
};

// ============================================
// RÉACTIONS
// ============================================

export const emitToggleReaction = (data) => {
  waitForConnection()
    .then(() => {
      console.log("😊 Émission toggle-reaction:", data);
      socket.emit("toggle-reaction", data);
    })
    .catch((error) =>
      console.error("❌ Impossible d'émettre réaction:", error)
    );
};

export const onReactionUpdated = (callback) => {
  if (socket) {
    socket.off("reaction-updated");
    socket.on("reaction-updated", (data) => {
      console.log("😊 Réaction mise à jour:", data);
      callback(data);
    });
  }
};

export const onReactionError = (callback) => {
  if (socket) {
    socket.off("reaction-error");
    socket.on("reaction-error", (error) => {
      console.error("❌ Erreur réaction:", error);
      callback(error);
    });
  }
};

// ============================================
// APPELS
// ============================================

export const onCallEnded = (callback) => {
  if (socket) {
    socket.off("call-ended");
    socket.on("call-ended", (data) => {
      console.log("📞 call-ended reçu:", data);
      callback(data);
    });
  }
};

export const onCallMissed = (callback) => {
  if (socket) {
    socket.off("call-missed");
    socket.on("call-missed", (data) => {
      console.log("📵 call-missed reçu:", data);
      callback(data);
    });
  }
};

// ============================================
// DÉCONNEXION
// ============================================

export const disconnectSocket = () => {
  if (socket) {
    console.log("🔌 Déconnexion du socket");
    socket.disconnect();
    socket = null;
    currentUserId = null;
    onlineUsersCache = [];
    onlineUsersCallbacks = [];
    globalMessageCallbacks = [];
    isInitializing = false;
  }
};

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default {
  initSocket,
  getSocket,
  isSocketConnected,
  disconnectSocket,
  joinConversation,
  leaveConversation,
};
