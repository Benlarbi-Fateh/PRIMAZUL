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

// ✅ AUGMENTATION DE LA LIMITE POUR LES IMAGES EN BASE64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log('=== NOUVELLE REQUÊTE ===');
  console.log(`📨 ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  console.log('====================');
  next();
});
//app.use(express.json());

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

// Connexion à la base de données
connectDB();

// ============================================
// 🔗 CHARGEMENT DES ROUTES
// ============================================
console.log('🔍 Chargement des routes...');

// Routes existantes
const authRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const audioRoutes = require('./routes/audioRoutes');
const groupRoutes = require('./routes/groupRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const contactRoutes = require('./routes/contactRoutes');

// 🆕 NOUVELLE ROUTE PROFILE
const profileRoutes = require('./routes/profileRoutes');
const messageSettingsRoutes = require('./routes/messageSettingsRoutes');

// Configuration des routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/message-settings', messageSettingsRoutes);
app.use('/api/contacts', contactRoutes);

// 🆕 AJOUT DE LA ROUTE PROFILE
app.use('/api/profile', profileRoutes);

// 🆕 ROUTE DE SANTÉ
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🔥 CONFIGURATION SOCKET.IO
// ============================================
const initSocket = require('./socket/socketHandler');
initSocket(io);

// Middleware pour logger les événements Socket.io
io.use((socket, next) => {
  console.log(`🔌 Middleware Socket.io - Connexion de: ${socket.id}`);
  next();
});

// Événement quand le serveur Socket.io est prêt
io.on("ready", () => {
  console.log('🚀 Socket.IO server ready');
});

// Gestion des erreurs globales Socket.io
io.engine.on("connection_error", (err) => {
  console.log('🚨 Erreur de connexion Socket.io:', err);
});

// ============================================
// ⚙️ CONFIGURATION DU SERVEUR
// ============================================

// Middleware de gestion d'erreurs
app.use((error, req, res, next) => {
  console.log('🚨 ERREUR SERVEUR:', error);
  res.status(500).json({ error: error.message });
});

// Heartbeat global
setInterval(() => {
  console.log('💓 Heartbeat serveur - ' + new Date().toISOString());
}, 30000);

// Gestion de la mémoire et nettoyage
process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur...');
  io.disconnectSockets();
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Exception non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Rejet non géré:', reason);
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
  console.log(`🌐 Health check disponible sur: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.IO disponible sur: http://localhost:${PORT}`);
  console.log(`📡 CORS autorisé pour: http://localhost:3000, http://192.168.1.7:3000`);
  console.log(`📊 Routes chargées: auth, conversations, messages, upload, audio, groups, invitations, profile`);
});

// Export pour les tests
module.exports = { app, server, io };