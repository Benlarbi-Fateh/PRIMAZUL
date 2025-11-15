// backend/routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configuration Multer (stockage en mémoire)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route POST /api/upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Vérifie qu'un fichier est envoyé
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    // Envoi vers Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) {
          console.error("Erreur Cloudinary :", error);
          return res.status(500).json({ error: "Échec de l’upload Cloudinary" });
        }
        // Envoie le lien de l'image au frontend
        res.status(200).json({ imageUrl: result.secure_url });
      }
    );

    // On envoie le fichier à Cloudinary
    stream.end(req.file.buffer);

  } catch (error) {
    console.error("Erreur upload :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

module.exports = router;
