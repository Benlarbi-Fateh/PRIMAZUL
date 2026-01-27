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

// ✅ Configuration CORS
const corsOptions = {
  origin: ["http://localhost:3000", "http://192.168.1.7:3000", process.env.FRONTEND_URL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// ✅ Limites de taille
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Middleware de logs
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ✅ Configuration Socket.IO
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

// Connexion BDD
connectDB();

// ============================================
// 🔗 CHARGEMENT DES ROUTES
// ============================================
console.log("🔍 Chargement des routes...");

// Chargement direct pour éviter les variables intermédiaires qui peuvent planter
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/audio", require("./routes/audioRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/invitations", require("./routes/invitationRoutes"));
app.use("/api/message-settings", require("./routes/messageSettingsRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/agora", require("./routes/agoraRoutes"));
app.use("/api/status", require("./routes/statusRoutes"));
app.use("/api/personal-tasks", require("./routes/personalTaskRoutes"));
app.use("/api", require("./routes/taskRoutes"));
app.use("/api", require("./routes/projectRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));

// Route de santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// 🔥 CONFIGURATION SOCKET.IO
// ============================================
const initSocket = require("./socket/socketHandler");
try {
    initSocket(io);
    io.on("connection", (socket) => {
        console.log(`🔌 Client connecté: ${socket.id}`);
    });
} catch (e) {
    console.error("⚠️ Erreur initialisation Socket:", e.message);
}

// ============================================
// ⚙️ GESTION ERREURS & DÉMARRAGE
// ============================================

app.use((error, req, res, next) => {
  console.error("🚨 ERREUR SERVEUR:", error);
  res.status(500).json({ error: error.message });
});

process.on("SIGINT", () => {
  console.log("🛑 Arrêt du serveur...");
  io.disconnectSockets();
  server.close(() => {
    console.log("✅ Serveur arrêté proprement");
    process.exit(0);
  });
});

// ============================================
// ⏰ CRON JOB (Avec sécurité)
// ============================================
mongoose.connection.once("open", () => {
  console.log("✅ MongoDB connecté");
  
  // On charge le contrôleur ici pour éviter les erreurs cycliques
  try {
      const { checkScheduledMessages } = require("./controllers/messageController");
      console.log("⏰ CRON Job activé");
      setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          checkScheduledMessages(io);
        }
      }, 30000);
  } catch (e) {
      console.log("⚠️ Impossible de charger le CRON job:", e.message);
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});

module.exports = { app, server, io };