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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ✅ AUGMENTATION DE LA LIMITE POUR LES IMAGES EN BASE64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log('=== NOUVELLE REQUÊTE ===');
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    // ✅ Vérifier si req.body existe avant d'utiliser Object.keys
    if (req.body && typeof req.body === 'object') {
      console.log('Body keys:', Object.keys(req.body));
    }
    if (req.file) console.log('File:', req.file.originalname);
  }
  console.log('====================');
  next();
});

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
// 🔗 CHARGEMENT DES ROUTES (SANS DOUBLONS)
// ============================================
console.log('🔍 Chargement des routes...');

// Servir les fichiers statiques uploadés
app.use("/uploads", express.static("uploads"));

// 🆕 ROUTE DE SANTÉ (avant les autres pour éviter les conflits)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ ROUTES - UNE SEULE FOIS CHACUNE
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes')); // ✅ UNE SEULE FOIS
app.use('/api/audio', require('./routes/audioRoutes'));

console.log('✅ Routes chargées avec succès');

// ============================================
// 🔥 CONFIGURATION SOCKET.IO
// ============================================
const initSocket = require('./socket/socketHandler');
initSocket(io);

// Middleware pour logger les événements Socket.io
io.use((socket, next) => {
  console.log(`🔌 Socket.io - Connexion de: ${socket.id}`);
  next();
});

// Gestion des erreurs globales Socket.io
io.engine.on("connection_error", (err) => {
  console.error('🚨 Erreur de connexion Socket.io:', err);
});

// ============================================
// ⚙️ GESTION DES ERREURS
// ============================================

// Route 404 pour les API non trouvées - doit être APRÈS toutes les routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`❌ Route API non trouvée: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ 
      error: 'Route non trouvée',
      method: req.method,
      path: req.originalUrl
    });
  }
  next();
});

// Middleware de gestion d'erreurs globales
app.use((error, req, res, next) => {
  console.error('🚨 ERREUR SERVEUR:', error);
  res.status(error.status || 500).json({ 
    error: error.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Heartbeat global (optionnel - peut être commenté en production)
setInterval(() => {
  console.log('💓 Heartbeat - ' + new Date().toISOString());
}, 60000); // Toutes les 60 secondes

// ============================================
// 🛡️ GESTION DE L'ARRÊT PROPRE
// ============================================

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
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

// ============================================
// 🚀 DÉMARRAGE DU SERVEUR
// ============================================

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
  console.log(`\n📡 URLs disponibles:`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Socket.IO: http://localhost:${PORT}`);
  console.log(`\n🔐 Routes API montées:`);
  console.log(`   - /api/auth         (Authentification)`);
  console.log(`   - /api/users        (Utilisateurs)`);
  console.log(`   - /api/profile      (Profils)`);
  console.log(`   - /api/contacts     (Contacts)`);
  console.log(`   - /api/conversations (Conversations)`);
  console.log(`   - /api/groups       (Groupes)`);
  console.log(`   - /api/messages     (Messages)`);
  console.log(`   - /api/invitations  (Invitations)`);
  console.log(`   - /api/upload       (Upload fichiers) ⬅️ CAMÉRA`);
  console.log(`   - /api/audio        (Audio)`);
  console.log(`\n📊 CORS autorisé pour:`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - http://192.168.1.7:3000`);
  console.log('='.repeat(60) + '\n');
});

// Export pour les tests
module.exports = { app, server, io };