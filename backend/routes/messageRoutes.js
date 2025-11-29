const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

const { 
  getMessages, 
  sendMessage, 
  markAsDelivered, // 🆕
  markAsRead,      // 🆕
  getUnreadCount ,  // 🆕
  deleteMessage,    // 🆕 AJOUT
  editMessage,      // 🆕 AJOUT
  translateMessage  // 🆕 AJOUT
} = require('../controllers/messageController');

router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);

// 🆕 NOUVELLES ROUTES POUR LES STATUTS
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);

router.delete('/:messageId', authMiddleware, deleteMessage);
router.put('/:messageId', authMiddleware, editMessage);
router.post('/:messageId/translate', authMiddleware, translateMessage );

module.exports = router;