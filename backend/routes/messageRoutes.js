const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkBlockStatus = require('../middleware/blockCheck');
const messageController = require('../controllers/messageController');

const { 
  getMessages, 
  sendMessage, 
  markAsDelivered,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  editMessage,
  translateMessage,
  // 🆕 AJOUT DES FONCTIONS MANQUANTES
  toggleReaction,
  getReactions,
  scheduleMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  updateScheduledMessage
} = require('../controllers/messageController');

// Routes de base
router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, checkBlockStatus, sendMessage);

// Routes pour les statuts
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);

// Routes pour modification/suppression
router.delete('/:messageId', authMiddleware, deleteMessage);
router.put('/:messageId', authMiddleware, editMessage);
router.post('/:messageId/translate', authMiddleware, translateMessage);

// 🆕 ROUTES POUR LES RÉACTIONS
router.post('/:messageId/reactions', authMiddleware, toggleReaction);
router.get('/:messageId/reactions', authMiddleware, getReactions);

// 🆕 ROUTES POUR LA PROGRAMMATION
router.post('/schedule', authMiddleware, scheduleMessage);
router.get('/scheduled/list', authMiddleware, getScheduledMessages);
router.delete('/scheduled/:messageId', authMiddleware, cancelScheduledMessage);
router.put('/scheduled/:messageId', authMiddleware, updateScheduledMessage);

// Route typing
router.post('/typing', authMiddleware, checkBlockStatus, (req, res) => {
  const { conversationId, isTyping } = req.body;
  
  const io = req.app.get('io');
  if (io) {
    io.to(conversationId).emit('user-typing', {
      userId: req.user.id || req.user._id,
      isTyping: isTyping || true,
      conversationId
    });
  }
  
  return res.json({ success: true, typing: isTyping || true });
});

module.exports = router;