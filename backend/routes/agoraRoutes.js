const express = require("express");
const router = express.Router();
const agoraController = require("../controllers/agoraController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/token", authMiddleware, agoraController.generateToken);

module.exports = router;


