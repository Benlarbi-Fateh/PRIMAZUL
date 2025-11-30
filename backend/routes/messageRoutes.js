const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkBlockStatus = require('../middleware/blockCheck');


const {
  getMessages,
  sendMessage,
  markAsDelivered, // 🆕
  markAsRead,      // 🆕
  getUnreadCount   // 🆕
} = require('../controllers/messageController');


router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, checkBlockStatus, sendMessage);
router.post('/', authMiddleware, sendMessage);


// 🆕 NOUVELLES ROUTES POUR LES STATUTS
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);


router.post('/typing', authMiddleware, checkBlockStatus, (req, res) => {
  // Votre logique typing existante ira ici
  // Pour l'instant, retourner un succès
  return res.json({ success: true, typing: true });
});


module.exports = router;
