const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/Users.js");
const verifyToken = require("../middleware/auth.js");
const Message = require("../models/Message.js");
const Conversation = require("../models/Conversation.js");
const router = express.Router();

// 📂 Dossier d’upload des images de profil
const uploadDir = path.join(__dirname, "../uploads/profile_pics");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ⚙️ Configuration de multer pour gérer les fichiers uploadés
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });



// ✅ [PUT] Mettre à jour le profil (nom et statut)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { username, statusMessage } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, statusMessage },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

// ✅ [POST] Upload d’une image de profil
router.post("/upload/:id", verifyToken, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Aucun fichier envoyé" });

    const imagePath = `/uploads/profile_pics/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { profilePicture: imagePath },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de l’upload de la photo :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

 //❌ Supprimer un compte utilisateur
router.delete("/deleteAccount/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

module.exports = router;
