const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  getMessages, 
  sendMessage, 
  markAsDelivered,
  markAsRead,
  getUnreadCount,
  toggleReaction,  // 🆕
  getReactions     // 🆕
} = require('../controllers/messageController');

router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);

// Statuts
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);

// 🆕 RÉACTIONS
router.post('/:messageId/react', authMiddleware, toggleReaction);
router.get('/:messageId/reactions', authMiddleware, getReactions);

module.exports = router;