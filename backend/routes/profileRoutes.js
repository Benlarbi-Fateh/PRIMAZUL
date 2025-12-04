const express = require('express');
const {
  getMyProfile,
  getUserProfile,
  updateProfile,
  updatePrivacySettings,
  updatePreferences,
  changePassword
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadProfilePicture } = require('../controllers/uploadController');

const router = express.Router();

// Toutes les routes sont protégées
router.use(authMiddleware);

// 📊 Profil
router.get('/me', getMyProfile);
router.get('/:userId', getUserProfile);
router.put('/update', updateProfile);

// 🖼️ Photo de profil
router.put('/picture', upload.single('profilePicture'), uploadProfilePicture);

// 🔐 Confidentialité
router.put('/privacy', updatePrivacySettings);

// ⚙️ Préférences
router.put('/preferences', updatePreferences);

// 🔑 Sécurité
router.put('/change-password', changePassword);

module.exports = router;