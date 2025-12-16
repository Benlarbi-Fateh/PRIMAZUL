const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");
const authMiddleware = require("../middleware/authMiddleware");
const statusUpload = require("../middleware/statusUpload");

// Créer et Lire
router.post(
  "/",
  authMiddleware,
  statusUpload.single("file"),
  statusController.createStatus
);
router.get("/", authMiddleware, statusController.getStatuses);

// ✅ NOUVELLES ROUTES
router.post("/:statusId/reply", authMiddleware, statusController.replyToStatus);
router.delete("/:id", authMiddleware, statusController.deleteStatus);

module.exports = router;
