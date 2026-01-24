require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

// ✅ CORS Configuration - CORRIGÉE AVEC PATCH
const corsOptions = {
  origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// ❌ SUPPRIMÉ : app.options("*", cors(corsOptions)); - Cause l'erreur avec Express 5

// ✅ AUGMENTATION DE LA LIMITE POUR LES IMAGES EN BASE64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log("=== NOUVELLE REQUÊTE ===");
  console.log(`📨 ${req.method} ${req.url}`);
  console.log("Body:", req.body);
  console.log("====================");
  next();
});

// ✅ Socket.IO Configuration - CORRIGÉE AVEC PATCH
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.7:3000", process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

// Connexion à la base de données
connectDB();
// ============================================
// 🔗 CHARGEMENT DES ROUTES
// ============================================
console.log("🔍 Chargement des routes...");

// Routes existantes
const authRoutes = require("./routes/authRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const audioRoutes = require("./routes/audioRoutes");
const groupRoutes = require("./routes/groupRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const agoraRoutes = require("./routes/agoraRoutes");
const statusRoutes = require("./routes/statusRoutes");
//const personalTaskListRoutes = require("./routes/personalTaskListRoutes");
const personalTaskRoutes = require("./routes/personalTaskRoutes");
const taskRoutes = require("./routes/taskRoutes");
const projectRoutes = require("./routes/projectRoutes");
const profileRoutes = require("./routes/profileRoutes");
const messageSettingsRoutes = require("./routes/messageSettingsRoutes");

// Configuration des routes// ============================================
// 🔗 CONFIGURATION DES ROUTES
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/message-settings", messageSettingsRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/agora", agoraRoutes);
app.use("/api/status", statusRoutes);
//app.use("/api/task-lists", personalTaskListRoutes);

// ✅ CORRIGÉ : Personal tasks sur un chemin différent
app.use("/api/personal-tasks", personalTaskRoutes);

// ✅ Group tasks (DOIT être après personal-tasks)
app.use("/api", taskRoutes);
app.use("/api", projectRoutes);

app.use("/api/profile", profileRoutes);
// Route de santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    cors: "PATCH enabled",
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// 🔥 CONFIGURATION SOCKET.IO
// ============================================
const initSocket = require("./socket/socketHandler");
initSocket(io);

io.use((socket, next) => {
  console.log(`🔌 Middleware Socket.io - Connexion de: ${socket.id}`);
  next();
});

io.on("ready", () => {
  console.log("🚀 Socket.IO server ready");
});

io.engine.on("connection_error", (err) => {
  console.log("🚨 Erreur de connexion Socket.io:", err);
});

// ============================================
// ⚙️ CONFIGURATION DU SERVEUR
// ============================================

app.use((error, req, res, next) => {
  console.log("🚨 ERREUR SERVEUR:", error);
  res.status(500).json({ error: error.message });
});

setInterval(() => {
  console.log("💓 Heartbeat serveur - " + new Date().toISOString());
}, 30000);

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

// ============================================
// ⏰ CRON JOB POUR MESSAGES PROGRAMMÉS
// ============================================
const { checkScheduledMessages } = require("./controllers/messageController");

mongoose.connection.once("open", () => {
  console.log(
    "✅ MongoDB connecté, démarrage du CRON pour messages programmés...",
  );

  setInterval(() => {
    if (mongoose.connection.readyState === 1) {
      checkScheduledMessages(io);
    } else {
      console.log("⚠️ MongoDB non connecté, skip CRON");
    }
  }, 30000);

  console.log("⏰ CRON job activé : vérification toutes les 30 secondes");
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
  console.log(
    `🌐 Health check disponible sur: http://localhost:${PORT}/api/health`,
  );
  console.log(`🔌 Socket.IO disponible sur: http://localhost:${PORT}`);
  console.log(
    `📡 CORS autorisé pour: http://localhost:3000, http://192.168.1.7:3000`,
  );
  console.log(`📡 Méthodes CORS: GET, POST, PUT, PATCH, DELETE, OPTIONS`);
  console.log(
    `📊 Routes chargées: auth, conversations, messages, upload, audio, groups, invitations, profile, tasks, projects`,
  );
});

module.exports = { app, server, io };
