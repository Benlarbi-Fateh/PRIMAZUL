const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

exports.generateToken = (req, res) => {
  const { channelName, uid } = req.body; // channelName = ID de la conversation ou du groupe
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const role = RtcRole.PUBLISHER;
  
  const expirationTimeInSeconds = 3600; // 1 heure
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  if (!channelName) {
    return res.status(400).json({ error: 'Channel name is required' });
  }

  // Génération du token
  const token = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid || 0, // 0 laisse Agora attribuer un UID, sinon passe l'ID user
    role,
    privilegeExpiredTs
  );

  res.json({ token, channelName, uid });
};