const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const { sendVoiceMessage } = require('../controllers/audioController');

const router = express.Router();

// Configuration Multer pour les fichiers audio
const upload = multer({ 
  dest: 'uploads/voice/',
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite à 5MB pour les audios
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les fichiers audio
    const allowedMimeTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-m4a'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format audio non supporté. Utilisez webm, ogg, mp3 ou wav'));
    }
  }
});

// 🎤 Route pour envoyer un message vocal
router.post('/', authMiddleware, upload.single('audio'), sendVoiceMessage);

module.exports = router;