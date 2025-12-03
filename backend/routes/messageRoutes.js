const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMessages,
  sendMessage,
  markAsDelivered, // 🆕
  markAsRead, // 🆕
  getUnreadCount, // 🆕
  saveCallHistory,
} = require("../controllers/messageController");

router.get("/:conversationId", authMiddleware, getMessages);
router.post("/", authMiddleware, sendMessage);

// 🆕 NOUVELLES ROUTES POUR LES STATUTS
router.post("/mark-delivered", authMiddleware, markAsDelivered);
router.post("/mark-read", authMiddleware, markAsRead);
router.get("/unread/count", authMiddleware, getUnreadCount);
router.post("/callhistory", authMiddleware, saveCallHistory); //zaina

module.exports = router;
