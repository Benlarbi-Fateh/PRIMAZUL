const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Dossier spécifique pour les statuts
const uploadDir = "uploads/status";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // On garde l'extension d'origine
    cb(null, "status-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // ✅ Accepte Images ET Vidéos
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Format non supporté (Image ou Vidéo uniquement)"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // ✅ 50MB max pour les vidéos
  fileFilter: fileFilter,
});

module.exports = upload;
