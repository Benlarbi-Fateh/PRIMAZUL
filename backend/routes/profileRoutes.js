const express = require('express');
const {
  getMyProfile,
  getUserProfile,
  updateProfile,
  updatePrivacySettings,
  updatePreferences,
  changePassword,
  searchUsers
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadProfilePicture } = require('../controllers/uploadController');
const rateLimit = require('../middleware/rateLimiter');
const { uploadRateLimit } = require('../middleware/actionRateLimits');

const router = express.Router();

const userSearchRateLimit = rateLimit({
  scope: 'user-search',
  windowMs: 60 * 1000,
  max: 30,
  message: 'Trop de recherches. Reessayez dans un instant.',
});

// Toutes les routes sont protégées
router.use(authMiddleware);

// 📊 Profil
router.get('/me', getMyProfile);
router.get('/search', userSearchRateLimit, searchUsers);
router.get('/:userId', getUserProfile);
router.put('/update', updateProfile);

// 🖼️ Photo de profil
router.put('/picture', uploadRateLimit, upload.single('profilePicture'), uploadProfilePicture);

// 🔐 Confidentialité
router.put('/privacy', updatePrivacySettings);

// ⚙️ Préférences
router.put('/preferences', updatePreferences);

// 🔑 Sécurité
router.put('/change-password', changePassword);

module.exports = router;
