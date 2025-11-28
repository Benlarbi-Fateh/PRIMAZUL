const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateAgoraToken } = require('../controllers/callController');
// Route de test sans authentification
router.get('/test-token', (req, res) => {
  try {
    const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
    
    const APP_ID = process.env.AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
    
    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ 
        error: 'Credentials manquants',
        APP_ID: !!APP_ID,
        APP_CERTIFICATE: !!APP_CERTIFICATE
      });
    }

    const channelName = 'test-channel';
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      message: 'Token de test généré avec succès'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/generate-token', authMiddleware, generateAgoraToken);

module.exports = router;