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
// CALLBACKS POUR LES TÂCHES
// ============================================
let taskCallbacks = {
  created: [],
  updated: [],
  statusChanged: [],
  deleted: [],
  commented: [],
};

let projectCallbacks = {
  created: [],
  deleted: [],
};

// ============================================
// ✅ CALLBACKS POUR LES APPELS (NOUVEAU)
// ============================================
let callCallbacks = {
  activeCallFound: [],
  noActiveCall: [],
  callAlreadyExists: [],
  callJoined: [],
  participantJoined: [],
  participantLeft: [],
  allDeclined: [],
  callCancelled: [],
  callTimeout: [],
  callMissed: [],
  callEnded: [],
  callAnswered: [],
  callDeclined: [],
  callIncoming: [],
  callError: [],
};

// ============================================
// INITIALISATION DU SOCKET
// ============================================

export const initSocket = (userId) => {
  if (typeof window === "undefined") return null;

  if (isInitializing) {
    console.log("⏳ Initialisation déjà en cours...");
    return socket;
  }

  currentUserId = userId;

  if (socket?.connected && currentUserId === userId) {
    console.log("✅ Socket déjà connecté pour cet utilisateur");
    socket.emit("user-online", userId);
    socket.emit("request-online-users");
    return socket;
  }

  if (socket && !socket.connected) {
    console.log("🔄 Socket existe mais déconnecté, reconnexion...");
    socket.connect();
    return socket;
  }

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

    setupGlobalMessageListeners();
    setupTaskListeners();
    setupCallListeners(); // ✅ NOUVEAU
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
    setupTaskListeners();
    setupCallListeners(); // ✅ NOUVEAU
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

    if (reason === "io server disconnect") {
      console.log("🔄 Reconnexion forcée...");
      socket.connect();
    }
  });

  socket.on("update-message", (updatedMessage) => {
    console.log("📡 Message mis à jour reçu:", updatedMessage?._id);
    if (onUpdateMessageCallback) {
      onUpdateMessageCallback(updatedMessage);
    }
  });

  setupGlobalMessageListeners();
  setupTaskListeners();
  setupCallListeners(); // ✅ NOUVEAU

  return socket;
};

// ============================================
// ÉCOUTEURS GLOBAUX DE MESSAGES
// ============================================

const setupGlobalMessageListeners = () => {
  if (!socket) return;

  socket.off("receive-message");
  socket.off("new-message");

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
// ÉCOUTEURS DE TÂCHES
// ============================================

export const setupTaskListeners = () => {
  if (!socket) {
    console.warn("⚠️ Socket non disponible pour les tâches");
    return;
  }

  // Supprimer les anciens écouteurs
  socket.off("task:created");
  socket.off("task:updated");
  socket.off("task:statusChanged");
  socket.off("task:deleted");
  socket.off("task:commented");
  socket.off("project:created");
  socket.off("project:deleted");

  // Tâche créée
  socket.on("task:created", (data) => {
    console.log("📡 [Socket] task:created reçu:", data?.task?._id);
    taskCallbacks.created.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback task:created:", error);
      }
    });
  });

  // Tâche mise à jour
  socket.on("task:updated", (data) => {
    console.log("📡 [Socket] task:updated reçu:", data?.task?._id);
    taskCallbacks.updated.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback task:updated:", error);
      }
    });
  });

  // Statut changé
  socket.on("task:statusChanged", (data) => {
    console.log(
      "📡 [Socket] task:statusChanged reçu:",
      data?.task?._id,
      "→",
      data?.newStatus,
    );
    taskCallbacks.statusChanged.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback task:statusChanged:", error);
      }
    });
  });

  // Tâche supprimée
  socket.on("task:deleted", (data) => {
    console.log("📡 [Socket] task:deleted reçu:", data?.taskId);
    taskCallbacks.deleted.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback task:deleted:", error);
      }
    });
  });

  // Commentaire ajouté
  socket.on("task:commented", (data) => {
    console.log("📡 [Socket] task:commented reçu:", data?.taskId);
    taskCallbacks.commented.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback task:commented:", error);
      }
    });
  });

  // Projet créé
  socket.on("project:created", (data) => {
    console.log("📡 [Socket] project:created reçu:", data?.project?._id);
    projectCallbacks.created.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback project:created:", error);
      }
    });
  });

  // Projet supprimé
  socket.on("project:deleted", (data) => {
    console.log("📡 [Socket] project:deleted reçu:", data?.projectId);
    projectCallbacks.deleted.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback project:deleted:", error);
      }
    });
  });

  console.log("✅ Écouteurs de tâches configurés");
};

// ============================================
// ✅ ÉCOUTEURS D'APPELS (NOUVEAU)
// ============================================

export const setupCallListeners = () => {
  if (!socket) {
    console.warn("⚠️ Socket non disponible pour les appels");
    return;
  }

  // Supprimer les anciens écouteurs
  socket.off("active-call-found");
  socket.off("no-active-call");
  socket.off("call-already-exists");
  socket.off("call-joined");
  socket.off("call-participant-joined");
  socket.off("call-participant-left");
  socket.off("call-all-declined");
  socket.off("call-incoming");
  socket.off("call-answered");
  socket.off("call-declined");
  socket.off("call-cancelled");
  socket.off("call-timeout");
  socket.off("call-missed");
  socket.off("call-ended");
  socket.off("call-error");

  // Appel actif trouvé
  socket.on("active-call-found", (data) => {
    console.log("📞 [Socket] active-call-found:", data?.callId);
    callCallbacks.activeCallFound.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback active-call-found:", error);
      }
    });
  });

  // Pas d'appel actif
  socket.on("no-active-call", (data) => {
    console.log("📞 [Socket] no-active-call:", data?.conversationId);
    callCallbacks.noActiveCall.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback no-active-call:", error);
      }
    });
  });

  // Appel déjà existant
  socket.on("call-already-exists", (data) => {
    console.log("📞 [Socket] call-already-exists:", data?.existingCallId);
    callCallbacks.callAlreadyExists.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-already-exists:", error);
      }
    });
  });

  // Rejoint un appel
  socket.on("call-joined", (data) => {
    console.log("📞 [Socket] call-joined:", data?.callId);
    callCallbacks.callJoined.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-joined:", error);
      }
    });
  });

  // Participant rejoint
  socket.on("call-participant-joined", (data) => {
    console.log("📞 [Socket] call-participant-joined:", data?.oduserId);
    callCallbacks.participantJoined.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-participant-joined:", error);
      }
    });
  });

  // Participant parti
  socket.on("call-participant-left", (data) => {
    console.log("📞 [Socket] call-participant-left:", data?.oduserId);
    callCallbacks.participantLeft.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-participant-left:", error);
      }
    });
  });

  // Tout le monde a refusé (groupe)
  socket.on("call-all-declined", (data) => {
    console.log("📞 [Socket] call-all-declined:", data?.callId);
    callCallbacks.allDeclined.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-all-declined:", error);
      }
    });
  });

  // Appel entrant
  socket.on("call-incoming", (data) => {
    console.log("📞 [Socket] call-incoming:", data?.callId);
    callCallbacks.callIncoming.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-incoming:", error);
      }
    });
  });

  // Appel répondu
  socket.on("call-answered", (data) => {
    console.log("📞 [Socket] call-answered:", data?.callId);
    callCallbacks.callAnswered.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-answered:", error);
      }
    });
  });

  // Appel refusé
  socket.on("call-declined", (data) => {
    console.log("📞 [Socket] call-declined:", data?.callId);
    callCallbacks.callDeclined.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-declined:", error);
      }
    });
  });

  // Appel annulé
  socket.on("call-cancelled", (data) => {
    console.log("📞 [Socket] call-cancelled:", data?.callId);
    callCallbacks.callCancelled.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-cancelled:", error);
      }
    });
  });

  // Timeout appel
  socket.on("call-timeout", (data) => {
    console.log("📞 [Socket] call-timeout:", data?.callId);
    callCallbacks.callTimeout.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-timeout:", error);
      }
    });
  });

  // Appel manqué
  socket.on("call-missed", (data) => {
    console.log("📞 [Socket] call-missed:", data?.callId);
    callCallbacks.callMissed.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-missed:", error);
      }
    });
  });

  // Appel terminé
  socket.on("call-ended", (data) => {
    console.log("📞 [Socket] call-ended:", data?.callId);
    callCallbacks.callEnded.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-ended:", error);
      }
    });
  });

  // Erreur appel
  socket.on("call-error", (data) => {
    console.error("📞 [Socket] call-error:", data);
    callCallbacks.callError.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error("❌ Erreur callback call-error:", error);
      }
    });
  });

  console.log("✅ Écouteurs d'appels configurés");
};

// ============================================
// ✅ ABONNEMENTS AUX APPELS (NOUVEAU)
// ============================================

// Vérifier si un appel est actif pour une conversation
export const checkActiveCall = (conversationId) => {
  if (socket?.connected) {
    console.log("📞 Vérification appel actif pour:", conversationId);
    socket.emit("check-active-call", { conversationId });
  }
};

// Rejoindre un appel existant
export const emitJoinCall = (callId) => {
  if (socket?.connected) {
    console.log("📞 Demande de rejoindre l'appel:", callId);
    socket.emit("call-join", { callId });
  }
};

// Annuler un appel
export const emitCancelCall = (callId) => {
  if (socket?.connected) {
    console.log("📞 Annulation de l'appel:", callId);
    socket.emit("call-cancel", { callId });
  }
};

// Écouter appel actif trouvé
export const onActiveCallFound = (callback) => {
  if (!callCallbacks.activeCallFound.includes(callback)) {
    callCallbacks.activeCallFound.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.activeCallFound = callCallbacks.activeCallFound.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter pas d'appel actif
export const onNoActiveCall = (callback) => {
  if (!callCallbacks.noActiveCall.includes(callback)) {
    callCallbacks.noActiveCall.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.noActiveCall = callCallbacks.noActiveCall.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter appel déjà existant
export const onCallAlreadyExists = (callback) => {
  if (!callCallbacks.callAlreadyExists.includes(callback)) {
    callCallbacks.callAlreadyExists.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callAlreadyExists = callCallbacks.callAlreadyExists.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter confirmation de rejoindre
export const onCallJoined = (callback) => {
  if (!callCallbacks.callJoined.includes(callback)) {
    callCallbacks.callJoined.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callJoined = callCallbacks.callJoined.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter participant rejoint
export const onCallParticipantJoined = (callback) => {
  if (!callCallbacks.participantJoined.includes(callback)) {
    callCallbacks.participantJoined.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.participantJoined = callCallbacks.participantJoined.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter participant parti
export const onCallParticipantLeft = (callback) => {
  if (!callCallbacks.participantLeft.includes(callback)) {
    callCallbacks.participantLeft.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.participantLeft = callCallbacks.participantLeft.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter tout le monde a refusé
export const onCallAllDeclined = (callback) => {
  if (!callCallbacks.allDeclined.includes(callback)) {
    callCallbacks.allDeclined.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.allDeclined = callCallbacks.allDeclined.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter appel entrant
export const onCallIncoming = (callback) => {
  if (!callCallbacks.callIncoming.includes(callback)) {
    callCallbacks.callIncoming.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callIncoming = callCallbacks.callIncoming.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter appel répondu
export const onCallAnswered = (callback) => {
  if (!callCallbacks.callAnswered.includes(callback)) {
    callCallbacks.callAnswered.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callAnswered = callCallbacks.callAnswered.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter appel refusé
export const onCallDeclined = (callback) => {
  if (!callCallbacks.callDeclined.includes(callback)) {
    callCallbacks.callDeclined.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callDeclined = callCallbacks.callDeclined.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter appel annulé
export const onCallCancelled = (callback) => {
  if (!callCallbacks.callCancelled.includes(callback)) {
    callCallbacks.callCancelled.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callCancelled = callCallbacks.callCancelled.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter timeout appel
export const onCallTimeout = (callback) => {
  if (!callCallbacks.callTimeout.includes(callback)) {
    callCallbacks.callTimeout.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callTimeout = callCallbacks.callTimeout.filter(
      (cb) => cb !== callback,
    );
  };
};

// Écouter erreur appel
export const onCallError = (callback) => {
  if (!callCallbacks.callError.includes(callback)) {
    callCallbacks.callError.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callError = callCallbacks.callError.filter(
      (cb) => cb !== callback,
    );
  };
};

// Nettoyer les callbacks d'appel
export const clearCallCallbacks = () => {
  callCallbacks = {
    activeCallFound: [],
    noActiveCall: [],
    callAlreadyExists: [],
    callJoined: [],
    participantJoined: [],
    participantLeft: [],
    allDeclined: [],
    callCancelled: [],
    callTimeout: [],
    callMissed: [],
    callEnded: [],
    callAnswered: [],
    callDeclined: [],
    callIncoming: [],
    callError: [],
  };
};

// ============================================
// ABONNEMENTS AUX TÂCHES
// ============================================

export const onTaskCreated = (callback) => {
  if (!taskCallbacks.created.includes(callback)) {
    taskCallbacks.created.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    taskCallbacks.created = taskCallbacks.created.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onTaskUpdated = (callback) => {
  if (!taskCallbacks.updated.includes(callback)) {
    taskCallbacks.updated.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    taskCallbacks.updated = taskCallbacks.updated.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onTaskStatusChanged = (callback) => {
  if (!taskCallbacks.statusChanged.includes(callback)) {
    taskCallbacks.statusChanged.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    taskCallbacks.statusChanged = taskCallbacks.statusChanged.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onTaskDeleted = (callback) => {
  if (!taskCallbacks.deleted.includes(callback)) {
    taskCallbacks.deleted.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    taskCallbacks.deleted = taskCallbacks.deleted.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onTaskCommented = (callback) => {
  if (!taskCallbacks.commented.includes(callback)) {
    taskCallbacks.commented.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    taskCallbacks.commented = taskCallbacks.commented.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onProjectCreated = (callback) => {
  if (!projectCallbacks.created.includes(callback)) {
    projectCallbacks.created.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    projectCallbacks.created = projectCallbacks.created.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onProjectDeleted = (callback) => {
  if (!projectCallbacks.deleted.includes(callback)) {
    projectCallbacks.deleted.push(callback);
  }
  if (socket?.connected) {
    setupTaskListeners();
  }
  return () => {
    projectCallbacks.deleted = projectCallbacks.deleted.filter(
      (cb) => cb !== callback,
    );
  };
};

export const clearTaskCallbacks = () => {
  taskCallbacks = {
    created: [],
    updated: [],
    statusChanged: [],
    deleted: [],
    commented: [],
  };
  projectCallbacks = {
    created: [],
    deleted: [],
  };
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

export const onReceiveMessage = (callback) => {
  if (socket) {
    if (!globalMessageCallbacks.includes(callback)) {
      globalMessageCallbacks.push(callback);
    }
  }
};

export const addGlobalMessageListener = (callback) => {
  if (!globalMessageCallbacks.includes(callback)) {
    globalMessageCallbacks.push(callback);
    console.log(
      "➕ Écouteur global ajouté, total:",
      globalMessageCallbacks.length,
    );
  }

  if (socket?.connected) {
    setupGlobalMessageListeners();
  }

  return () => {
    globalMessageCallbacks = globalMessageCallbacks.filter(
      (cb) => cb !== callback,
    );
    console.log(
      "➖ Écouteur global retiré, total:",
      globalMessageCallbacks.length,
    );
  };
};

export const removeMessageListener = (callback) => {
  globalMessageCallbacks = globalMessageCallbacks.filter(
    (cb) => cb !== callback,
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
      console.error("❌ Impossible d'émettre invitation:", error),
    );
};

export const emitInvitationAccepted = (data) => {
  waitForConnection()
    .then(() => {
      console.log("✅ Émission invitation acceptée:", data);
      socket.emit("invitation-accepted", data);
    })
    .catch((error) =>
      console.error("❌ Impossible d'émettre acceptation:", error),
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
      console.error("❌ Impossible d'émettre annulation:", error),
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
      console.error("❌ Impossible d'émettre réaction:", error),
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
// APPELS (ANCIENNE API - COMPATIBILITÉ)
// ============================================

export const onCallEnded = (callback) => {
  if (!callCallbacks.callEnded.includes(callback)) {
    callCallbacks.callEnded.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callEnded = callCallbacks.callEnded.filter(
      (cb) => cb !== callback,
    );
  };
};

export const onCallMissed = (callback) => {
  if (!callCallbacks.callMissed.includes(callback)) {
    callCallbacks.callMissed.push(callback);
  }
  if (socket?.connected) {
    setupCallListeners();
  }
  return () => {
    callCallbacks.callMissed = callCallbacks.callMissed.filter(
      (cb) => cb !== callback,
    );
  };
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
    clearTaskCallbacks();
    clearCallCallbacks(); // ✅ NOUVEAU
    isInitializing = false;
  }
};

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

const socketService = {
  initSocket,
  getSocket,
  isSocketConnected,
  disconnectSocket,
  joinConversation,
  leaveConversation,
  // Appels
  checkActiveCall,
  emitJoinCall,
  emitCancelCall,
  onActiveCallFound,
  onNoActiveCall,
  onCallAlreadyExists,
  onCallJoined,
  onCallParticipantJoined,
  onCallParticipantLeft,
  onCallAllDeclined,
  onCallIncoming,
  onCallAnswered,
  onCallDeclined,
  onCallCancelled,
  onCallTimeout,
  onCallEnded,
  onCallMissed,
  onCallError,
};

export default socketService;
