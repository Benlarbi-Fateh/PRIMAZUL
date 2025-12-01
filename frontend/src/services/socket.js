import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
let socket = null;
let currentUserId = null;
let onlineUsersCache = [];
let onlineUsersCallbacks = [];

export const initSocket = (userId) => {
  if (typeof window === 'undefined') return null;
    
  currentUserId = userId;

  if (socket?.connected) {
    console.log('✅ Socket déjà connecté');
    socket.emit('user-online', userId);
    socket.emit('request-online-users');
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connecté:', socket.id);
    if (currentUserId) {
      socket.emit('user-online', currentUserId);
      socket.emit('request-online-users');
    }
  });

  socket.on('connection-confirmed', ({ userId, onlineUsers }) => {
    console.log('✅ Connexion confirmée pour:', userId);
    console.log('👥 Utilisateurs en ligne:', onlineUsers);
    onlineUsersCache = onlineUsers;
    onlineUsersCallbacks.forEach(cb => cb(onlineUsers));
  });

  socket.on('online-users-update', (userIds) => {
    console.log('📡 Socket.js - Mise à jour utilisateurs en ligne:', userIds);
    onlineUsersCache = userIds;
    onlineUsersCallbacks.forEach(cb => cb(userIds));
  });

  socket.on('conversation-joined', ({ conversationId }) => {
    console.log('✅ Conversation rejointe:', conversationId);
  });

  socket.on('reconnect', () => {
    console.log('🔄 Socket reconnecté');
    if (currentUserId) {
      socket.emit('user-online', currentUserId);
      socket.emit('request-online-users');
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion Socket:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('⚠️ Socket déconnecté:', reason);
  });

  return socket;
};

export const onOnlineUsersUpdate = (callback) => {
  if (socket) {
    onlineUsersCallbacks.push(callback);
    return () => {
      onlineUsersCallbacks = onlineUsersCallbacks.filter(cb => cb !== callback);
    };
  }
  // Retourner une fonction vide si pas de socket
  return () => {};
};

export const getCurrentOnlineUsers = () => onlineUsersCache;

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
        reject(new Error('Socket connection timeout'));
      }
    }, 100);
  });
};

export const joinConversation = (conversationId) => {
  waitForConnection()
    .then(() => {
      console.log('📥 Rejoindre conversation:', conversationId);
      socket.emit('join-conversation', conversationId);
    })
    .catch((error) => {
      console.error('❌ Impossible de rejoindre:', error);
    });
};

export const leaveConversation = (conversationId) => {
  if (socket?.connected) {
    console.log('📤 Quitter conversation:', conversationId);
    socket.emit('leave-conversation', conversationId);
  }
};

export const requestOnlineUsers = () => {
  if (socket?.connected) {
    console.log('📤 Demande de liste des utilisateurs en ligne');
    socket.emit('request-online-users');
  }
};

export const getOnlineUsersCache = () => onlineUsersCache;

export const sendMessage = (messageData) => {
  waitForConnection()
    .then(() => socket.emit('send-message', messageData))
    .catch((error) => console.error('❌ Impossible d\'envoyer:', error));
};

export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.off('receive-message');
    socket.on('receive-message', (message) => {
      console.log('📩 Message reçu:', message);
      callback(message);
    });
  }
};

export const onMessageStatusUpdated = (callback) => {
  if (socket) {
    socket.off('message-status-updated');
    socket.on('message-status-updated', (data) => {
      console.log('📊 Statut mis à jour:', data);
      callback(data);
    });
  }
};

export const onShouldRefreshConversations = (callback) => {
  if (socket) {
    socket.off('should-refresh-conversations');
    socket.on('should-refresh-conversations', () => {
      console.log('🔄 Demande de refresh des conversations');
      callback();
    });
  }
};

export const onConversationStatusUpdated = (callback) => {
  if (socket) {
    socket.off('conversation-status-updated');
    socket.on('conversation-status-updated', (data) => {
      console.log('📊 Statut conversation mis à jour:', data);
      callback(data);
    });
  }
};

export const emitTyping = (conversationId, userId) => {
  if (socket?.connected) socket.emit('typing', { conversationId, userId });
};

export const emitStopTyping = (conversationId, userId) => {
  if (socket?.connected) socket.emit('stop-typing', { conversationId, userId });
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.off('user-typing');
    socket.on('user-typing', callback);
  }
};

export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.off('user-stopped-typing');
    socket.on('user-stopped-typing', callback);
  }
};

// ============================================
// 📨 INVITATIONS
// ============================================

export const onInvitationReceived = (callback) => {
  if (socket) {
    socket.off('invitation-received');
    socket.on('invitation-received', (invitation) => {
      console.log('📨 Nouvelle invitation reçue:', invitation);
      callback(invitation);
    });
  }
};

export const onInvitationAccepted = (callback) => {
  if (socket) {
    socket.off('invitation-accepted-notification');
    socket.on('invitation-accepted-notification', (data) => {
      console.log('✅ Invitation acceptée par le destinataire:', data);
      callback(data);
    });
  }
};

export const onInvitationRejected = (callback) => {
  if (socket) {
    socket.off('invitation-rejected-notification');
    socket.on('invitation-rejected-notification', (invitation) => {
      console.log('❌ Invitation refusée par le destinataire:', invitation);
      callback(invitation);
    });
  }
};

export const onInvitationCancelled = (callback) => {
  if (socket) {
    socket.off('invitation-cancelled-notification');
    socket.on('invitation-cancelled-notification', (invitationId) => {
      console.log('🗑️ Invitation annulée par l\'expéditeur:', invitationId);
      callback(invitationId);
    });
  }
};

export const emitInvitationSent = (data) => {
  waitForConnection()
    .then(() => {
      console.log('📨 Émission invitation envoyée:', data);
      socket.emit('invitation-sent', data);
    })
    .catch((error) => console.error('❌ Impossible d\'émettre invitation:', error));
};

export const emitInvitationAccepted = (data) => {
  waitForConnection()
    .then(() => {
      console.log('✅ Émission invitation acceptée:', data);
      socket.emit('invitation-accepted', data);
    })
    .catch((error) => console.error('❌ Impossible d\'émettre acceptation:', error));
};

export const emitInvitationRejected = (data) => {
  waitForConnection()
    .then(() => {
      console.log('❌ Émission invitation refusée:', data);
      socket.emit('invitation-rejected', data);
    })
    .catch((error) => console.error('❌ Impossible d\'émettre refus:', error));
};

export const emitInvitationCancelled = (data) => {
  waitForConnection()
    .then(() => {
      console.log('🗑️ Émission invitation annulée:', data);
      socket.emit('invitation-cancelled', data);
    })
    .catch((error) => console.error('❌ Impossible d\'émettre annulation:', error));
};

// ============================================
// 🆕 RÉACTIONS
// ============================================

export const emitToggleReaction = (data) => {
  waitForConnection()
    .then(() => {
      console.log('😊 Émission toggle-reaction:', data);
      socket.emit('toggle-reaction', data);
    })
    .catch((error) => console.error('❌ Impossible d\'émettre réaction:', error));
};

export const onReactionUpdated = (callback) => {
  if (socket) {
    socket.off('reaction-updated');
    socket.on('reaction-updated', (data) => {
      console.log('😊 Réaction mise à jour:', data);
      callback(data);
    });
  }
};

export const onReactionError = (callback) => {
  if (socket) {
    socket.off('reaction-error');
    socket.on('reaction-error', (error) => {
      console.error('❌ Erreur réaction:', error);
      callback(error);
    });
  }
};

// ============================================
// UTILITAIRES
// ============================================

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Déconnexion du socket');
    socket.disconnect();
    socket = null;
    currentUserId = null;
    onlineUsersCache = [];
    onlineUsersCallbacks = [];
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => socket?.connected || false;