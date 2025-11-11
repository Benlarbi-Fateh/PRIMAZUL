require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// ✅ CORS Configuration
app.use(cors({
  origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use((req, res, next) => {
  console.log('=== NOUVELLE REQUÊTE ===');
  console.log(`📨 ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  console.log('====================');
  next();
});

app.use(express.json());

// ✅ Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.set('io', io);

connectDB();

// Routes
console.log('🔍 Chargement des routes...');
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/groups', require('./routes/groupRoutes')); // 🆕 AJOUTÉ
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/audio', require('./routes/audioRoutes'));

app.use((error, req, res, next) => {
  console.log('🚨 ERREUR SERVEUR:', error);
  res.status(500).json({ error: error.message });
});

// 🆕 SOCKET.IO EVENTS - VERSION CORRIGÉE
const onlineUsers = new Map(); // userId -> { socketId, lastSeen }

io.on('connection', (socket) => {
  console.log('✅ Socket connecté:', socket.id);

  // User se connecte
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, {
      socketId: socket.id,
      lastSeen: Date.now()
    });
    socket.userId = userId;
    socket.join(userId);
    
    console.log(`👤 User ${userId} est en ligne`);
    console.log(`📋 Total utilisateurs en ligne:`, onlineUsers.size);
    
    const onlineUserIds = Array.from(onlineUsers.keys());
    
    // Émettre à tous
    io.emit('online-users-update', onlineUserIds);
    
    // Confirmer individuellement à chaque utilisateur en ligne
    onlineUserIds.forEach(uid => {
      io.to(uid).emit('online-users-update', onlineUserIds);
    });
    
    socket.emit('connection-confirmed', { 
      userId,
      onlineUsers: onlineUserIds
    });
  });

  // Demander la liste des utilisateurs en ligne
  socket.on('request-online-users', () => {
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online-users-update', onlineUserIds);
    console.log('📤 Liste des utilisateurs en ligne envoyée:', onlineUserIds);
  });

  // Rejoindre une conversation
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    socket.currentConversation = conversationId;
    console.log(`📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
    socket.emit('conversation-joined', { conversationId });
  });

  // Quitter une conversation
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(conversationId);
    socket.currentConversation = null;
    console.log(`📤 Socket ${socket.id} a quitté la conversation ${conversationId}`);
  });

  // Typing indicators
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user-typing', { conversationId, userId });
  });

  socket.on('stop-typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user-stopped-typing', { conversationId, userId });
  });

  // Refresh conversations
  socket.on('refresh-conversations', (userId) => {
    console.log(`🔄 Demande de refresh conversations pour ${userId}`);
    socket.emit('should-refresh-conversations');
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      
      console.log(`❌ User ${socket.userId} déconnecté`);
      console.log(`📋 Utilisateurs restants:`, onlineUsers.size);
      
      const onlineUserIds = Array.from(onlineUsers.keys());
      
      // Émettre à tous
      io.emit('online-users-update', onlineUserIds);
      io.emit('user-disconnected', socket.userId);
      
      // Confirmer individuellement
      onlineUserIds.forEach(uid => {
        io.to(uid).emit('online-users-update', onlineUserIds);
      });
    }
  });
});

// Heartbeat : Nettoyer les utilisateurs inactifs
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 60000; // 60 secondes
  
  onlineUsers.forEach((data, userId) => {
    if (now - data.lastSeen > TIMEOUT) {
      console.log(`⏰ Timeout pour user ${userId}`);
      onlineUsers.delete(userId);
      
      const onlineUserIds = Array.from(onlineUsers.keys());
      io.emit('online-users-update', onlineUserIds);
    }
  });
}, 30000);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
});