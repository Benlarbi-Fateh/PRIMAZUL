const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getConversations,
  getOrCreateConversation,
  getConversationById,  // 🆕 AJOUTÉ
  getConversationTheme,      // 🆕 NOUVEAU
  updateConversationTheme    // 🆕 NOUVEAU
} = require('../controllers/conversationController');


router.get('/', authMiddleware, getConversations);
router.post('/get-or-create', authMiddleware, getOrCreateConversation);
router.get('/:id', authMiddleware, getConversationById);  // 🆕 AJOUTÉ


// 🆕 NOUVELLES ROUTES POUR LE THÈME
router.get('/:id/theme', authMiddleware, getConversationTheme);
router.post('/:id/theme', authMiddleware, updateConversationTheme);


module.exports = router;
