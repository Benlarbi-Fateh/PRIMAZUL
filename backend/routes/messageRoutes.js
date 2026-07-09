const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkBlockStatus = require('../middleware/blockCheck');
const rateLimit = require('../middleware/rateLimiter');
const {
  validateObjectIdParam,
  validatePaginationQuery,
  validateSearchQuery,
  validatePositiveIntegerQuery,
} = require('../middleware/requestValidators');

const { 
  getMessages, 
  sendMessage, 
  markAsDelivered,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  deleteMessageForMe,
  editMessage,
  translateMessage,
  // 🆕 AJOUT DES FONCTIONS MANQUANTES
  toggleReaction,
  getReactions,
  scheduleMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  updateScheduledMessage,
  searchMessages,           // 🆕 AJOUT
  getMessageContext,        // 🆕 AJOUT
  searchAllMessages ,        // 🆕 AJOUT
  getMessageReadBy
} = require('../controllers/messageController');

const messageSendRateLimit = rateLimit({
  scope: 'message-send',
  windowMs: 60 * 1000,
  max: 60,
  message: 'Trop de messages envoyes. Reessayez dans un instant.',
});

const messageSearchRateLimit = rateLimit({
  scope: 'message-search',
  windowMs: 60 * 1000,
  max: 30,
  message: 'Trop de recherches. Reessayez dans un instant.',
});

// Recherche de messages
router.get(
  '/search/:conversationId',
  authMiddleware,
  messageSearchRateLimit,
  validateObjectIdParam('conversationId'),
  validateSearchQuery({ maxLength: 100 }),
  searchMessages,
);
router.get('/read-by/:messageId', authMiddleware, validateObjectIdParam('messageId'), getMessageReadBy);

// Routes pour les statuts
router.post('/mark-delivered', authMiddleware, markAsDelivered);
router.post('/mark-read', authMiddleware, markAsRead);
router.get('/unread/count', authMiddleware, getUnreadCount);

// Routes pour modification/suppression
router.delete('/:messageId', authMiddleware, validateObjectIdParam('messageId'), deleteMessage);
router.delete('/:messageId/for-me', authMiddleware, validateObjectIdParam('messageId'), deleteMessageForMe);
router.put('/:messageId', authMiddleware, validateObjectIdParam('messageId'), editMessage);
router.post('/:messageId/translate', authMiddleware, validateObjectIdParam('messageId'), translateMessage);

// 🆕 ROUTES POUR LES RÉACTIONS
router.post('/:messageId/reactions', authMiddleware, validateObjectIdParam('messageId'), toggleReaction);
router.get('/:messageId/reactions', authMiddleware, validateObjectIdParam('messageId'), getReactions);

// 🆕 ROUTES POUR LA PROGRAMMATION
router.post('/schedule', authMiddleware, scheduleMessage);
router.get('/scheduled/list', authMiddleware, getScheduledMessages);
router.delete('/scheduled/:messageId', authMiddleware, validateObjectIdParam('messageId'), cancelScheduledMessage);
router.put('/scheduled/:messageId', authMiddleware, validateObjectIdParam('messageId'), updateScheduledMessage);

// Obtenir le contexte d'un message (messages avant/après)
router.get(
  '/context/:messageId',
  authMiddleware,
  validateObjectIdParam('messageId'),
  validatePositiveIntegerQuery({ queryParam: 'contextSize', min: 1, max: 50 }),
  getMessageContext,
);

// Recherche globale dans toutes les conversations
router.get(
  '/search-all/global',
  authMiddleware,
  messageSearchRateLimit,
  validateSearchQuery({ maxLength: 100 }),
  searchAllMessages,
);

// Route typing
router.post('/typing', authMiddleware, checkBlockStatus, (req, res) => {
  const { conversationId, isTyping } = req.body;
  const typing = typeof isTyping === 'boolean' ? isTyping : true;
  
  const io = req.app.get('io');
  if (io) {
    io.to(conversationId).emit('user-typing', {
      userId: req.user.id || req.user._id,
      isTyping: typing,
      conversationId
    });
  }
  
  return res.json({ success: true, typing });
});

// Routes de base
router.get(
  '/:conversationId',
  authMiddleware,
  validateObjectIdParam('conversationId'),
  validatePaginationQuery({ maxLimit: 100 }),
  getMessages,
);
router.post('/', authMiddleware, messageSendRateLimit, checkBlockStatus, sendMessage);

module.exports = router;
