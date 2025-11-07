const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getMessages, sendMessage } = require('../controllers/messageController');

router.get('/:conversationId', authMiddleware, getMessages);
router.post('/', authMiddleware, sendMessage);

module.exports = router;