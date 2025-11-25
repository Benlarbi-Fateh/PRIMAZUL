const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const { 
  getMessages, 
  sendMessage, 
  markAsDelivered, // 🆕
  markAsRead,      // 🆕
  getUnreadCount ,   // 🆕
  //...p9....
  toggleReaction, 
  forwardMessage
  //............
} = require('../controllers/messageController');

router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);
//...........p9......................
// Réagir à un message
router.post('/:id/reaction', authMiddleware, messagesController.toggleReaction);

// Transférer un message
router.post('/forward', authMiddleware, messagesController.forwardMessage);
//...................................


// 🆕 NOUVELLES ROUTES POUR LES STATUTS
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);

module.exports = router;