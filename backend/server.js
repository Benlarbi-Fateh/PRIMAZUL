require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

// ✅ CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ✅ Augmentation de la limite pour les images en Base64
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log("=== NOUVELLE REQUÊTE ===");
  console.log(`📨 ${req.method} ${req.url}`);
  console.log("Body:", req.body);
  console.log("====================");
  next();
});

// Connexion à la base de données
connectDB();

// ============================================
// 🔗 CHARGEMENT DES ROUTES
// ============================================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const audioRoutes = require("./routes/audioRoutes");
const groupRoutes = require("./routes/groupRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const statusRoutes = require("./routes/statusRoutes");
const profileRoutes = require("./routes/profileRoutes");
const agoraRoutes = require("./routes/agoraRoutes");

// Configuration des routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/agora", agoraRoutes);

// Static uploads
app.use("/uploads", express.static("uploads"));

// 🆕 Route de santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// 🔥 CONFIGURATION SOCKET.IO
// ============================================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

// Initialisation Socket.io
const initSocket = require("./socket/socketHandler");
initSocket(io);

// Middleware pour logger les événements Socket.io
io.use((socket, next) => {
  console.log(`🔌 Middleware Socket.io - Connexion de: ${socket.id}`);
  next();
});

// Événement pour chaque nouvelle connexion
io.on("connection", (socket) => {
  console.log(`🔌 Nouvelle connexion Socket.IO: ${socket.id}`);
});

// Gestion des erreurs globales Socket.io
io.engine.on("connection_error", (err) => {
  console.log("🚨 Erreur de connexion Socket.io:", err);
});

// ============================================
// ⚙️ CONFIGURATION DU SERVEUR
// ============================================

// Middleware global pour gérer les erreurs
app.use((error, req, res, next) => {
  console.log("🚨 ERREUR SERVEUR:", error);
  res.status(500).json({ error: error.message });
});

// Heartbeat global
setInterval(() => {
  console.log("💓 Heartbeat serveur - " + new Date().toISOString());
}, 30000);

// Gestion de la mémoire et arrêt propre
process.on("SIGINT", () => {
  console.log("🛑 Arrêt du serveur...");
  io.disconnectSockets();
  server.close(() => {
    console.log("✅ Serveur arrêté proprement");
    process.exit(0);
  });
});

process.on("uncaughtException", (error) => {
  console.error("🚨 Exception non capturée:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Rejet non géré:", reason);
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
  console.log(
    `🌐 Health check disponible sur: http://localhost:${PORT}/api/health`
  );
  console.log(`🔌 Socket.IO disponible sur: http://localhost:${PORT}`);
  console.log(
    `📡 CORS autorisé pour: http://localhost:3000, http://192.168.1.7:3000`
  );
  console.log(
    `📊 Routes chargées: auth, users, conversations, messages, upload, audio, groups, invitations, contacts, status, profile`
  );
});
// Dans server.js, ajoutez une route test globale
app.get("/api/test-simple", (req, res) => {
  console.log("🧪 Route test simple appelée");
  res.json({
    success: true,
    message: "Backend fonctionne!",
    data: [
      { id: 1, text: "Test 1" },
      { id: 2, text: "Test 2" },
    ],
  });
});
// Export pour les tests
module.exports = { app, server, io };
