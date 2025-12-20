// backend/routes/statusRoutes.js
const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");

// ✅ CHANGEMENT : Utilisation de memoryStorage pour Cloudinary
// Cela permet de garder le fichier en mémoire tampon avant l'envoi
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max (Cloudinary gère bien les vidéos)
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|webm/;
    const ext = allowed.test(file.originalname.toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Fichier non supporté"));
  },
});

// Routes
router.get("/", auth, statusController.getAllStatuses);
router.post("/", auth, upload.single("media"), statusController.createStatus);
router.post("/:id/view", auth, statusController.markAsViewed);
router.post("/:id/react", auth, statusController.reactToStatus);
router.post("/:id/reply", auth, statusController.replyToStatus);
router.get("/:id/views", auth, statusController.getStatusViews);
router.delete("/:id", auth, statusController.deleteStatus);

module.exports = router;
