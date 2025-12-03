require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
// const userRoutes = require("./routes/userRoutes"); // Tu l'importes plus bas, inutile ici

const app = express();
const server = http.createServer(app);

// ❌ SUPPRIMÉ ICI : const agoraRoutes = require("./routes/agoraRoutes");
// ❌ SUPPRIMÉ ICI : app.use("/api/agora", agoraRoutes);

// ✅ 1. CORS Configuration (DOIT ÊTRE EN PREMIER)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Ajout de OPTIONS pour les preflight requests
    allowedHeaders: ["Content-Type", "Authorization"], // Important pour le header Authorization
  })
);

// ✅ 2. Parsing middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ 3. Logging middleware
app.use((req, res, next) => {
  console.log("=== NOUVELLE REQUÊTE ===");
  console.log(`📨 ${req.method} ${req.url}`);
  // console.log("Body:", req.body); // Décommente si besoin, mais peut polluer
  next();
});

// ✅ Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.1.7:3000"],
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);
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
const profileRoutes = require("./routes/profileRoutes");
const agoraRoutes = require("./routes/agoraRoutes"); // ✅ DÉPLACÉ ICI

// Configuration des routes
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/profile", profileRoutes);

// ✅ AJOUTÉ ICI (APRÈS CORS)
app.use("/api/agora", agoraRoutes);

// ... Le reste de tes routes (doublons nettoyés ci-dessous) ...

// Note: Tu avais beaucoup de doublons dans ton fichier original, je les ai nettoyés :
app.use("/api/users", require("./routes/userRoutes"));
// app.use("/api/upload", ...); // Déjà chargé plus haut
// app.use("/api/auth", ...); // Déjà chargé plus haut
// app.use("/api/conversations", ...); // Déjà chargé plus haut
// app.use("/api/groups", ...); // Déjà chargé plus haut
// app.use("/api/messages", ...); // Déjà chargé plus haut
// app.use("/api/audio", ...); // Déjà chargé plus haut

app.use("/uploads", express.static("uploads"));
app.use("/api/contacts", require("./routes/contactRoutes"));

// Route santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// ... La suite de ton fichier (socketHandler, error handling, listen) reste inchangée ...
const initSocket = require("./socket/socketHandler");
initSocket(io);

// ... (Garde tout le reste de ton code serveur tel quel : gestion erreurs, listen, etc.)
// ...
// ...

// Juste pour être sûr que tu as la fin :
app.use((error, req, res, next) => {
  console.log("🚨 ERREUR SERVEUR:", error);
  res.status(500).json({ error: error.message });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ MongoDB connecté`);
  console.log(`📡 CORS configuré CORRECTEMENT`);
});

module.exports = { app, server, io };
