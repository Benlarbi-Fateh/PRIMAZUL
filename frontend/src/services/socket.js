// frontend/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';
let socket = null;
let currentUserId = null; // 🆕 Stocker l'userId actuel

export const initSocket = (userId) => {
  if (typeof window === 'undefined') {
    return null;
  }

  // 🆕 Stocker l'userId
  currentUserId = userId;

  if (socket?.connected) {
    console.log('✅ Socket déjà connecté');
    // 🆕 Ré-émettre user-online même si déjà connecté
    console.log('🔄 Ré-émission de user-online pour:', userId);
    socket.emit('user-online', userId);
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('✅ Socket connecté:', socket.id);
    if (currentUserId) {
      console.log('📤 Émission user-online pour:', currentUserId);
      socket.emit('user-online', currentUserId);
    }
  });

  // 🆕 Gérer la reconnexion
  socket.on('reconnect', () => {
    console.log('🔄 Socket reconnecté:', socket.id);
    if (currentUserId) {
      console.log('📤 Ré-émission user-online après reconnexion:', currentUserId);
      socket.emit('user-online', currentUserId);
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

export const sendMessage = (messageData) => {
  waitForConnection()
    .then(() => {
      console.log('📤 Envoi message:', messageData);
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

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Déconnexion du socket');
    socket.disconnect();
    socket = null;
    currentUserId = null; // 🆕 Reset l'userId
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => socket?.connected || false;