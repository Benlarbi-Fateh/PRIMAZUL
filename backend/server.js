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
  }
});

// 🆕 STOCKER io DANS app
app.set('io', io);

connectDB();

// Routes
console.log('🔍 Chargement des routes...');
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/audio', require('./routes/audioRoutes')); // 🆕 NOUVELLE ROUTE AUDIO

app.use((error, req, res, next) => {
  console.log('🚨 ERREUR SERVEUR:', error);
  res.status(500).json({ error: error.message });
});

// 🆕 SOCKET.IO EVENTS
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ Socket connecté:', socket.id);

  // 🆕 User se connecte
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(userId);
    
    console.log(`👤 User ${userId} est en ligne`);
    console.log(`📋 Utilisateurs actuellement en ligne:`, Array.from(onlineUsers.keys()));
    
    io.emit('online-users-update', Array.from(onlineUsers.keys()));
  });

  // Rejoindre une conversation
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  // 🆕 Typing indicators
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user-typing', { conversationId, userId });
    console.log(`✍️ User ${userId} écrit dans ${conversationId}`);
  });

  socket.on('stop-typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('user-stopped-typing', { conversationId, userId });
    console.log(`✅ User ${userId} a arrêté d'écrire dans ${conversationId}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      
      console.log(`❌ User ${socket.userId} déconnecté`);
      console.log(`📋 Utilisateurs restants en ligne:`, Array.from(onlineUsers.keys()));
      
      io.emit('online-users-update', Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
});