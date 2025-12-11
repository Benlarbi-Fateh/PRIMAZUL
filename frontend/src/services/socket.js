import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
let socket = null;
let currentUserId = null;
let onlineUsersCache = [];
let onlineUsersCallbacks = [];
let statusCallbacks = new Map(); // 🆕 Callbacks pour les stories

export const initSocket = (userId) => {
  if (typeof window === 'undefined') {
    return null;
  }
    
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
    onlineUsersCache = onlineUsers;
    onlineUsersCallbacks.forEach(callback => callback(onlineUsers));
  });

  socket.on('online-users-update', (userIds) => {
    console.log('📡 Mise à jour utilisateurs en ligne:', userIds);
    onlineUsersCache = userIds;
    onlineUsersCallbacks.forEach(callback => callback(userIds));
  });

  // 🆕 ÉVÉNEMENTS POUR LES STORIES
  socket.on('status-reacted', (data) => {
    console.log('🎭 Réaction à une story:', data);
    const callbacks = statusCallbacks.get(data.statusId);
    if (callbacks && callbacks.reaction) {
      callbacks.reaction(data);
    }
  });

  socket.on('status-replied', (data) => {
    console.log('💬 Réponse à une story:', data);
    const callbacks = statusCallbacks.get(data.statusId);
    if (callbacks && callbacks.reply) {
      callbacks.reply(data);
    }
  });

  socket.on('status-reaction-update', (data) => {
    console.log('🔄 Mise à jour réaction:', data);
    const callbacks = statusCallbacks.get(data.statusId);
    if (callbacks && callbacks.reactionUpdate) {
      callbacks.reactionUpdate(data);
    }
  });

  socket.on('status-reply-update', (data) => {
    console.log('🔄 Mise à jour réponse:', data);
    const callbacks = statusCallbacks.get(data.statusId);
    if (callbacks && callbacks.replyUpdate) {
      callbacks.replyUpdate(data);
    }
  });

  socket.on('status-reaction-notification', (data) => {
    console.log('📢 Notification réaction:', data);
    // Ici vous pouvez afficher une notification à l'utilisateur
    if (data.userId !== currentUserId) {
      showNotification(`${data.userName} a réagi à votre story`, 'reaction');
    }
  });

  socket.on('status-reply-notification', (data) => {
    console.log('📢 Notification réponse:', data);
    // Ici vous pouvez afficher une notification à l'utilisateur
    if (data.userId !== currentUserId) {
      showNotification(`${data.userName} a répondu à votre story`, 'reply');
    }
  });

  socket.on('story-reply-notification', (data) => {
    console.log('📢 Notification réponse dans le chat:', data);
    // Notification pour les réponses aux stories dans les chats
    showNotification(`Nouvelle réponse à votre story`, 'chat');
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

// 🆕 FONCTIONS POUR LES STORIES
export const joinStatus = (statusId) => {
  if (socket?.connected) {
    console.log('📥 Rejoindre story:', statusId);
    socket.emit('join-status', statusId);
  }
};

export const leaveStatus = (statusId) => {
  if (socket?.connected) {
    console.log('📤 Quitter story:', statusId);
    socket.emit('leave-status', statusId);
  }
};

export const onStatusReaction = (statusId, callback) => {
  if (!statusCallbacks.has(statusId)) {
    statusCallbacks.set(statusId, {});
  }
  statusCallbacks.get(statusId).reaction = callback;
};

export const onStatusReply = (statusId, callback) => {
  if (!statusCallbacks.has(statusId)) {
    statusCallbacks.set(statusId, {});
  }
  statusCallbacks.get(statusId).reply = callback;
};

export const onStatusReactionUpdate = (statusId, callback) => {
  if (!statusCallbacks.has(statusId)) {
    statusCallbacks.set(statusId, {});
  }
  statusCallbacks.get(statusId).reactionUpdate = callback;
};

export const onStatusReplyUpdate = (statusId, callback) => {
  if (!statusCallbacks.has(statusId)) {
    statusCallbacks.set(statusId, {});
  }
  statusCallbacks.get(statusId).replyUpdate = callback;
};

export const removeStatusCallbacks = (statusId) => {
  statusCallbacks.delete(statusId);
};

export const emitStatusReaction = (statusId, userId, reactionType) => {
  if (socket?.connected) {
    socket.emit('status-react', {
      statusId,
      userId,
      reactionType
    });
  }
};

export const emitStatusReply = (statusId, userId, message) => {
  if (socket?.connected) {
    socket.emit('status-reply', {
      statusId,
      userId,
      message
    });
  }
};

// Fonction pour afficher des notifications
const showNotification = (message, type = 'info') => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('PrimAzul', {
        body: message,
        icon: '/favicon.ico',
        tag: type
      });
    }
  }
  
  // Fallback pour les navigateurs sans Notification API
  console.log('📢 Notification:', message);
};

export const onOnlineUsersUpdate = (callback) => {
  if (socket) {
    onlineUsersCallbacks.push(callback);
    
    return () => {
      onlineUsersCallbacks = onlineUsersCallbacks.filter(cb => cb !== callback);
    };
  }
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
    .then(() => {
      socket.emit('send-message', messageData);
    })
    .catch((error) => {
      console.error('❌ Impossible d\'envoyer:', error);
    });
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
  if (socket?.connected) {
    socket.emit('typing', { conversationId, userId });
  }
};

export const emitStopTyping = (conversationId, userId) => {
  if (socket?.connected) {
    socket.emit('stop-typing', { conversationId, userId });
  }
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
    .catch((error) => {
      console.error('❌ Impossible d\'émettre invitation:', error);
    });
};

export const emitInvitationAccepted = (data) => {
  waitForConnection()
    .then(() => {
      console.log('✅ Émission invitation acceptée:', data);
      socket.emit('invitation-accepted', data);
    })
    .catch((error) => {
      console.error('❌ Impossible d\'émettre acceptation:', error);
    });
};

export const emitInvitationRejected = (data) => {
  waitForConnection()
    .then(() => {
      console.log('❌ Émission invitation refusée:', data);
      socket.emit('invitation-rejected', data);
    })
    .catch((error) => {
      console.error('❌ Impossible d\'émettre refus:', error);
    });
};

export const emitInvitationCancelled = (data) => {
  waitForConnection()
    .then(() => {
      console.log('🗑️ Émission invitation annulée:', data);
      socket.emit('invitation-cancelled', data);
    })
    .catch((error) => {
      console.error('❌ Impossible d\'émettre annulation:', error);
    });
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Déconnexion du socket');
    socket.disconnect();
    socket = null;
    currentUserId = null;
    onlineUsersCache = [];
    onlineUsersCallbacks = [];
    statusCallbacks.clear();
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => socket?.connected || false;