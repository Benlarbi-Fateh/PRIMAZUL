// middleware/blockCheck.js
const BlockedUser = require('../models/BlockedUser');
const Conversation = require('../models/Conversation');

const checkBlockStatus = async (req, res, next) => {
  try {
    const senderId = req.user.id; // ✅ CHANGÉ: ._id → .id
    const { conversationId, recipientId } = req.body;

    console.log('🔍 Middleware checkBlockStatus:', { 
      senderId, 
      conversationId, 
      recipientId 
    });

    let targetUserId = null;

    // 1. Si on a un conversationId, chercher l'autre participant
    if (conversationId && !recipientId) {
      console.log('📁 Recherche conversation:', conversationId);
      
      const conversation = await Conversation.findById(conversationId)
        .select('participants isGroup')
        .lean();

      if (conversation && !conversation.isGroup) {
        const otherParticipant = conversation.participants.find(
          p => p.toString() !== senderId.toString()
        );
        
        if (otherParticipant) {
          targetUserId = otherParticipant;
          console.log('👤 Participant trouvé:', targetUserId);
        }
      }
    }

    // 2. Si recipientId est fourni directement
    if (recipientId) {
      targetUserId = recipientId;
      console.log('👤 Recipient direct:', targetUserId);
    }

    // 3. Vérifier le blocage si on a une cible
    if (targetUserId) {
      console.log('🔍 Vérification blocage entre:', { senderId, targetUserId });
      
      // ✅ UTILISEZ LA MÉTHODE DU MODÈLE
      const blockStatus = await BlockedUser.getBlockStatus(senderId, targetUserId);
      
      console.log('📊 Statut blocage:', blockStatus);

      if (blockStatus.isBlocked) {
        console.log('🚫 Message bloqué - Blocage détecté:', {
          iBlocked: blockStatus.iBlocked,
          blockedMe: blockStatus.blockedMe
        });
        
        return res.status(403).json({
          success: false,
          message: 'Impossible d\'envoyer un message à cet utilisateur',
          blocked: true,
          details: blockStatus // ✅ Envoyez les détails au frontend
        });
      }
      
      console.log('✅ Aucun blocage détecté - Message autorisé');
    } else {
      console.log('ℹ️ Aucune cible spécifiée - Vérification bypassée');
    }

    next();
  } catch (error) {
    console.error('❌ Erreur checkBlockStatus middleware:', error);
    // En cas d'erreur, on laisse passer pour ne pas bloquer l'application
    console.warn('⚠️ Erreur middleware, passage au suivant pour éviter blocage');
    next();
  }
};

module.exports = checkBlockStatus;