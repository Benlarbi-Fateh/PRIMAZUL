const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkBlockStatus = require('../middleware/blockCheck');
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
router.post('/', authMiddleware, checkBlockStatus, sendMessage);


// 🆕 NOUVELLES ROUTES POUR LES STATUTS
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);


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
router.delete('/:messageId', authMiddleware, deleteMessage);
router.put('/:messageId', authMiddleware, editMessage);
router.post('/:messageId/translate', authMiddleware, translateMessage );

module.exports = router;
