const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ratingRouter = require("./routes/rating");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const messageRoutes = require("./routes/message");
const contactRoute = require("./routes/contact");
const uploadRoutes = require("./routes/upload");
const userRouter = require("./routes/user");
const reclamationRouter = require("./routes/reclamation");

const cloudinary = require("cloudinary").v2;
dotenv.config();

// 👉 D'abord créer l'app
const app = express();

// 👉 Middleware
app.use(express.json());

/// Autoriser ton frontend
app.use(cors({
  origin: ["http://localhost:3000", "http://192.168.176.1:3000"],
  credentials: true
}));
// 👉 Connexion BD
connectDB();

// 👉 Cloudinary
cloudinary.config({
  cloud_name: "dmwmm9gcw",
  api_key: "554674798949146",
  api_secret: "FNUkVztcyf7F0b8iFcCnH-r0L4Y",
});

// 👉 Routes
app.use("/api/rating", ratingRouter);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/contact", contactRoute);
app.use("/api/upload", uploadRoutes);
app.use("/api/user", userRouter);
app.use("/api/reclamation", reclamationRouter);

// 👉 Lancer serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
