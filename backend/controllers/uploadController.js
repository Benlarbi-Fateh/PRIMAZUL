const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Upload de la photo de profil
// 🖼️ Upload de la photo de profil - VERSION CORRIGÉE
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Aucune image fournie",
      });
    }

    // ✅ CORRECTION: Utiliser req.user._id au lieu de req.body.userId
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur non authentifié",
      });
    }

    console.log("📤 Upload en cours pour userId:", userId);
    console.log("📁 Fichier:", req.file.originalname);
    console.log("📦 Taille:", (req.file.size / 1024 / 1024).toFixed(2), "MB");

    let uploadResult;

    // ✅ Gérer les deux cas : fichier sur disque OU en mémoire (buffer)
    if (req.file.path) {
      // Fichier sur disque (diskStorage)
      console.log("📂 Mode: Fichier sur disque");

      uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "primazul/profile-pictures",
        public_id: `user_${userId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto" },
        ],
      });

      // Supprimer le fichier temporaire
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn(
          "⚠️ Impossible de supprimer le fichier temp:",
          unlinkError.message,
        );
      }
    } else if (req.file.buffer) {
      // Fichier en mémoire (memoryStorage)
      console.log("💾 Mode: Buffer en mémoire");

      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "primazul/profile-pictures",
            public_id: `user_${userId}_${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: "fill", gravity: "face" },
              { quality: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        // Envoyer le buffer
        const streamifier = require("streamifier");
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Format de fichier non supporté",
      });
    }

    console.log("✅ Upload Cloudinary réussi:", uploadResult.secure_url);

    // Récupérer l'utilisateur et supprimer l'ancienne photo
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable",
      });
    }

    // Supprimer l'ancienne image de Cloudinary si elle existe
    if (user.profilePicture && user.profilePicture.includes("cloudinary")) {
      try {
        const urlParts = user.profilePicture.split("/");
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const publicId = `primazul/profile-pictures/${fileNameWithExt.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log("🗑️ Ancienne image supprimée");
      } catch (deleteError) {
        console.warn(
          "⚠️ Impossible de supprimer l'ancienne image:",
          deleteError.message,
        );
      }
    }

    // Mettre à jour l'utilisateur
    user.profilePicture = uploadResult.secure_url;
    await user.save();

    console.log("✅ Photo de profil mise à jour pour:", user.email);

    res.json({
      success: true,
      message: "Photo de profil uploadée avec succès",
      profilePicture: uploadResult.secure_url,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("❌ Erreur upload photo:", error);

    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Erreur suppression fichier temp:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: "Erreur lors de l'upload",
    });
  }
};

// Ignorer la photo de profil
exports.skipProfilePicture = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    console.log("✅ Photo de profil ignorée pour:", user.email);

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
    console.error("❌ Erreur skip photo:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Configuration Multer pour les fichiers de messages
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/temp";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadMessage = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes =
      /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|mp4|webm|avi|mov/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"));
    }
  },
}).single("file");

// ✅ Upload de fichiers génériques (images, audio, vidéos, documents)
exports.uploadFile = async (req, res) => {
  try {
    uploadMessage(req, res, async (err) => {
      if (err) {
        console.error("❌ Erreur Multer:", err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      console.log("📤 Upload fichier:", req.file.originalname);
      console.log("📁 Type:", req.file.mimetype);
      console.log("📦 Taille:", (req.file.size / 1024 / 1024).toFixed(2), "MB");

      const fileType = req.file.mimetype.split("/")[0]; // image, video, audio, application

      let uploadOptions = {
        folder: "whatsapp-clone/messages",
        resource_type: "auto",
      };

      // ✅ Configuration spécifique pour les vidéos
      if (fileType === "video") {
        uploadOptions = {
          ...uploadOptions,
          resource_type: "video",
          folder: "whatsapp-clone/videos",
          chunk_size: 6000000, // Upload par morceaux de 6MB
          eager: [
            {
              format: "mp4",
              transformation: [
                { width: 640, height: 480, crop: "limit", quality: "auto" },
              ],
            },
          ],
          eager_async: true, // Transformation asynchrone
        };
      }
      // Configuration pour les images
      else if (fileType === "image") {
        uploadOptions = {
          ...uploadOptions,
          resource_type: "image",
          folder: "whatsapp-clone/images",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        };
      }
      // Configuration pour l'audio
      else if (fileType === "audio") {
        uploadOptions = {
          ...uploadOptions,
          resource_type: "video", // Cloudinary utilise 'video' pour l'audio aussi
          folder: "whatsapp-clone/audio",
        };
      }

      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(
        req.file.path,
        uploadOptions,
      );

      console.log("✅ Upload Cloudinary réussi");
      console.log("🔗 URL:", result.secure_url);

      // Supprimer le fichier temporaire
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: "Fichier uploadé avec succès",
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileType,
        cloudinaryId: result.public_id,
        // ✅ Informations spécifiques pour les vidéos
        ...(fileType === "video" && {
          duration: result.duration, // Durée en secondes
          width: result.width,
          height: result.height,
          format: result.format,
        }),
      });
    });
  } catch (error) {
    console.error("❌ Erreur upload fichier:", error);

    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Erreur suppression fichier temp:", unlinkError);
      }
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
};
