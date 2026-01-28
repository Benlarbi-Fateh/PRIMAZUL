const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const fs = require("fs").promises; // ✅ Utilisation de la version Promise
const path = require("path");

// Upload de la photo de profil
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucune image fournie" });
    }

    const userId = req.body.userId;

    if (!userId) {
      // Nettoyage en cas d'erreur
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: "userId manquant" });
    }

    console.log("📤 Upload en cours pour userId:", userId);

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "whatsapp-clone/profile-pictures",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" },
      ],
    });

    // ✅ Suppression Asynchrone (Non bloquante)
    try {
      await fs.unlink(req.file.path);
      console.log("🧹 Fichier temporaire supprimé");
    } catch (err) {
      console.error("⚠️ Erreur suppression fichier temp:", err.message);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.secure_url },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json({
      success: true,
      message: "Photo de profil uploadée avec succès",
      profilePicture: result.secure_url,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("❌ Erreur upload photo:", error);
    // Tentative de nettoyage en cas d'erreur
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: error.message });
  }
};

// Ignorer la photo de profil
exports.skipProfilePicture = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select("-password");
    if (!user)
      return res.status(404).json({ error: "Utilisateur introuvable" });

    res.json({
      success: true,
      message: "Photo de profil ignorée",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload générique (pour les messages, etc. - si utilisé dans ce contrôleur)
exports.uploadFile = async (req, res) => {
  // Cette partie était gérée par uploadRoutes.js dans ta version précédente
  // Si tu utilises ce contrôleur, applique la même logique asynchrone pour fs.unlink
  res
    .status(501)
    .json({ message: "Utiliser uploadRoutes.js pour l'upload générique" });
};
