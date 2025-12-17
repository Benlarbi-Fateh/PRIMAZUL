// backend/routes/statusRoutes.js
const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration Multer
const uploadDir = "uploads/status";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "status-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
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
