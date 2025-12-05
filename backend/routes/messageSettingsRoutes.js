// routes/messageSettingsRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/messageSettingsController');

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: "Message Settings route fonctionne !" });
});

// Block operations
router.post('/block', auth, ctrl.blockUser);
router.post('/unblock', auth, ctrl.unblockUser);
router.get('/blocked', auth, ctrl.getBlockedUsers);

// ✅ ROUTE CRITIQUE POUR VÉRIFIER LE BLOCAGE
router.get('/check-blocked/:targetUserId', auth, ctrl.checkIfBlocked);

// Conversation operations
router.delete('/conversations/:id/delete', auth, ctrl.deleteConversationForUser);
router.post('/conversations/:id/mute', auth, ctrl.muteConversationForUser);
router.post('/conversations/:id/unmute', auth, ctrl.unmuteConversationForUser);
router.get('/conversations/:id/settings', auth, ctrl.getConversationSettings);
router.get('/conversations/:id/media', auth, ctrl.getMediaForConversation);

// Theme operations
router.post('/theme', auth, ctrl.saveTheme);
router.put('/conversations/:id/theme', auth, ctrl.updateConversationTheme);

module.exports = router;