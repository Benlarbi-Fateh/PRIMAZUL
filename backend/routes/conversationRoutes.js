const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  getConversations, 
  getOrCreateConversation,
  getConversationById  // 🆕 AJOUTÉ
} = require('../controllers/conversationController');

router.get('/', authMiddleware, getConversations);
router.post('/get-or-create', authMiddleware, getOrCreateConversation);
router.get('/:id', authMiddleware, getConversationById);  // 🆕 AJOUTÉ

module.exports = router;