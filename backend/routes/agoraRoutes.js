const express = require("express");
const router = express.Router();
const agoraController = require("../controllers/agoraController");
const authMiddleware = require("../middleware/authMiddleware"); // Protéger la route

router.post("/token", authMiddleware, agoraController.generateToken);

module.exports = router;
