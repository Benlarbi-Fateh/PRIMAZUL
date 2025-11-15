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
    origin: ["http://localhost:3000", "process.env.FRONTEND_URL"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// 🔴 IMPORTANT: express.json() DOIT ÊTRE AVANT les logs et les routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Logger APRÈS express.json()
// Middleware de logs sécurisé
app.use((req, res, next) => {
  const safeBody = { ...req.body };

  // Masquer les champs sensibles
  const sensitiveFields = ["password", "token", "newPassword"];
  sensitiveFields.forEach((field) => {
    if (safeBody[field]) safeBody[field] = "***";
  });

  // Affichage minimal pour production
  console.log("=== NOUVELLE REQUÊTE (sécurisée) ===");
  console.log(`📨 ${req.method} ${req.url}`);
  console.log("Body:", safeBody);
  console.log("Headers:", req.headers["content-type"]);
  console.log("==============================");

  next();
});

// ✅ Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "process.env.FRONTEND_URL"],
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

connectDB();

// Routes
console.log("🔍 Chargement des routes...");

// 🆕 ROUTE DE SANTÉ
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/audio", require("./routes/audioRoutes"));
app.use("/api/invitations", require("./routes/invitationRoutes"));

// Gestionnaire d'erreurs
app.use((error, req, res, next) => {
  console.log("🚨 ERREUR SERVEUR:", error);
  res.status(500).json({ error: error.message });
});

// ============================================
// 🔥 IMPORT DU SOCKET HANDLER
// ============================================
const initSocket = require("./socket/socketHandler");
initSocket(io);

// ============================================
// 🎯 ÉVÉNEMENTS SOCKET SUPPLEMENTAIRES
// ============================================

// Heartbeat global
setInterval(() => {
  console.log("💓 Heartbeat serveur - " + new Date().toISOString());
}, 30000);

// Gestion des erreurs globales Socket.io
io.engine.on("connection_error", (err) => {
  console.log("🚨 Erreur de connexion Socket.io:", err);
});

// Middleware Socket.io
io.use((socket, next) => {
  console.log(`🔌 Middleware Socket.io - Connexion de: ${socket.id}`);
  next();
});

// Événement ready
io.on("ready", () => {
  console.log("🚀 Socket.IO server ready");
});

// Gestion de la mémoire et nettoyage
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
});

// Export pour les tests
module.exports = { app, server, io };
