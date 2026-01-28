const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const authMiddleware = require("../middleware/authMiddleware");
const fs = require("fs"); // Pour existsSync et mkdirSync (synchrone ok au démarrage)
const fsPromises = require("fs").promises; // ✅ Pour unlink asynchrone
const path = require("path");

const router = express.Router();

// Créer le dossier uploads s'il n'existe pas
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Route POST pour upload générique
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    console.log("📤 Upload fichier:", req.file.originalname);

    let resourceType = "auto";
    if (req.file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (req.file.mimetype.startsWith("audio/")) {
      resourceType = "video"; // Cloudinary traite l'audio comme video
    }

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "whatsapp-clone/messages",
      resource_type: resourceType,
      timeout: 120000, // 2 min timeout pour gros fichiers
    });

    console.log("✅ Upload Cloudinary réussi:", result.secure_url);

    // ✅ Suppression Asynchrone (Non bloquante)
    try {
      await fsPromises.unlink(req.file.path);
    } catch (unlinkError) {
      console.warn("⚠️ Erreur suppression fichier temp:", unlinkError.message);
    }

    res.json({
      success: true,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      cloudinaryId: result.public_id,
      // Infos spécifiques vidéo/audio
      duration: result.duration || 0,
      videoThumbnail:
        resourceType === "video"
          ? result.secure_url.replace(/\.(mp4|webm|avi|mov)$/, ".jpg")
          : null,
    });
  } catch (error) {
    console.error("❌ Erreur upload route:", error);

    // Nettoyage en cas d'erreur
    if (req.file) {
      await fsPromises.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
