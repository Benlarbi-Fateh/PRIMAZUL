// middleware/blockCheck.js
const BlockedUser = require('../models/BlockedUser');
const Conversation = require('../models/Conversation');


const checkBlockStatus = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { conversationId, recipientId } = req.body;


    // Si on a un conversationId, chercher l'autre participant
    if (conversationId && !recipientId) {
      const conversation = await Conversation.findById(conversationId)
        .select('participants isGroup')
        .lean();


      if (conversation && !conversation.isGroup) {
        const otherParticipant = conversation.participants.find(
          p => p.toString() !== senderId.toString()
        );
       
        if (otherParticipant) {
          const blockExists = await BlockedUser.findOne({
            $or: [
              { userId: senderId, blockedUserId: otherParticipant },
              { userId: otherParticipant, blockedUserId: senderId }
            ]
          });


          if (blockExists) {
            return res.status(403).json({
              success: false,
              message: 'Impossible d\'envoyer - Utilisateur bloqué',
              blocked: true
            });
          }
        }
      }
    }


    // Vérification normale si recipientId est fourni
    if (recipientId) {
      const blockExists = await BlockedUser.findOne({
        $or: [
          { userId: senderId, blockedUserId: recipientId },
          { userId: recipientId, blockedUserId: senderId }
        ]
      });


      if (blockExists) {
        return res.status(403).json({
          success: false,
          message: 'Impossible d\'envoyer - Utilisateur bloqué',
          blocked: true
        });
      }
    }


    next();
  } catch (error) {
    console.error('Erreur vérification blocage:', error);
    // En cas d'erreur, on laisse passer pour ne pas bloquer l'application
    next();
  }
};


module.exports = checkBlockStatus;