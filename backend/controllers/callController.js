const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

exports.generateAgoraToken = (req, res) => {
  try {
    const { channelName, uid } = req.body;
    const userId = req.user._id;

    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    // 🔥 VÉRIFIER QUE LES CREDENTIALS EXISTENT
    if (!APP_ID || !APP_CERTIFICATE) {
      console.error('❌ Agora credentials manquants');
      return res.status(500).json({ error: 'Configuration Agora manquante' });
    }

    console.log('🔑 Génération token pour:', { channelName, uid, APP_ID });

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Générer le token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid || 0,
      role,
      privilegeExpiredTs
    );

    console.log('✅ Token généré avec succès');

    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid: uid || 0
    });

  } catch (error) {
    console.error('❌ Erreur génération token Agora:', error);
    res.status(500).json({ error: 'Erreur génération token: ' + error.message });
  }
};