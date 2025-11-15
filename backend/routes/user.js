const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const cloudinary = require("../config/cloudinary");

const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // dossier temporaire




// 🟢 INSCRIPTION
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    // Vérifie si l’utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Création du nouvel utilisateur
    const newUser = new User({
      username,
      email,
      password,
      phoneNumber,
      lastSeen: Date.now(),
      isOnline: true
    });

    await newUser.save();
    res.status(201).json({
      message: "Inscription réussie",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error("Erreur /register :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔵 CONNEXION
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Met à jour le statut et la dernière connexion
    user.isOnline = true;
    user.lastSeen = Date.now();
    await user.save();

    res.json({
      message: "Connexion réussie",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Erreur /login :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔹 Récupérer le dernier utilisateur connecté
router.get("/last", async (req, res) => {
  try {
    // Trie par lastSeen décroissant et prends 1
    const lastUser = await User.findOne().sort({ lastSeen: -1 }).select("-password");
    if (!lastUser) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    res.json(lastUser);
  } catch (error) {
    console.error("Erreur GET /api/user/last :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


module.exports = router;
