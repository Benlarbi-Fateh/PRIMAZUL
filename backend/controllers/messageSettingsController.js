// controllers/messageSettingsController.js
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');
const BlockedUser = require('../models/BlockedUser');
const Contact = require('../models/Contact');

/**
 * Soft delete conversation FOR THE CURRENT USER
 */
// ✅ FONCTION UTILITAIRE : Vérifier si deux utilisateurs sont contacts
const areContacts = async (userId1, userId2) => {
  const contact1 = await Contact.findOne({
    owner: userId1,
    contact: userId2
  });
  
  const contact2 = await Contact.findOne({
    owner: userId2,
    contact: userId1
  });
  
  return !!(contact1 || contact2);
};

// ✅ Helper : vérifier si un user fait partie d'une conversation
const isUserInConversation = (conversation, userId) => {
  if (!conversation || !Array.isArray(conversation.participants)) return false;

  return conversation.participants.some(p => {
    // p peut être un ObjectId (p.toString()) ou un document (p._id)
    const participantId = p._id ? p._id.toString() : p.toString();
    return participantId === userId.toString();
  });
};

/**
 * 🆕 Soft delete avec régénération automatique pour les contacts
 */
exports.deleteConversationForUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    const conversationId = req.params.id;
    const userId = req.user._id;

    console.log('🗑️ Suppression conversation:', conversationId, 'par user:', userId);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    const isParticipant = isUserInConversation(conversation, userId);

if (!isParticipant) {
  return res.status(403).json({
    success: false,
    message: 'Vous ne faites pas partie de cette conversation'
  });
}

    // 🔥 CORRECTION : NE PLUS CRÉER DE NOUVELLE CONVERSATION
    // Simplement marquer comme supprimée
    
    if (!conversation.deletedBy) {
      conversation.deletedBy = [];
    }

    const existingDeletion = conversation.deletedBy.find(
      item => item.userId && item.userId.toString() === userId.toString()
    );

    if (!existingDeletion) {
      conversation.deletedBy.push({
        userId: userId,
        deletedAt: new Date()
      });
      await conversation.save();
      console.log('✅ Conversation marquée comme supprimée pour:', userId);
    }

    // ✅ NE PAS ÉMETTRE d'événement pour retirer de la sidebar
    // La conversation reste visible mais vide
    console.log('📊 Conversation soft-deleted, elle reste visible mais vide');

    return res.json({
      success: true,
      message: 'Discussion vidée avec succès',
      conversationId,
      keepInSidebar: true // 🔥 NOUVEAU : Indique de garder dans la sidebar
    });
    
  } catch (err) {
    console.error('❌ deleteConversationForUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};
exports.blockUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const userId = req.user._id;
    const { targetUserId, reason } = req.body;
   
    console.log('🔒 blockUser appelé:', { userId, targetUserId });

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
      });
    }

    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas vous bloquer vous-même"
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    const existingBlock = await BlockedUser.findOne({
      userId: userId,
      blockedUserId: targetUserId
    });

    if (existingBlock) {
      return res.json({
        success: true,
        message: 'Utilisateur déjà bloqué',
        alreadyBlocked: true
      });
    }

    // ✅ CRÉER LE BLOCAGE
    const blockedUser = new BlockedUser({
      userId: userId,
      blockedUserId: targetUserId,
      reason: reason || ''
    });

    await blockedUser.save();

    // ✅ SUPPRIMER LE CONTACT (des deux côtés)
    await Contact.deleteMany({
      $or: [
        { owner: userId, contact: targetUserId },
        { owner: targetUserId, contact: userId }
      ]
    });

    console.log('✅ Utilisateur bloqué ET retiré des contacts:', targetUser.name);

    // 🆕 ARCHIVER AUTOMATIQUEMENT LA CONVERSATION
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, targetUserId], $size: 2 },
      isGroup: false
    });

    if (conversation) {
      console.log('📦 Archivage automatique de la conversation:', conversation._id);
      
      if (!conversation.archivedBy) {
        conversation.archivedBy = [];
      }

      const alreadyArchived = conversation.archivedBy.some(
        item => item.userId && item.userId.toString() === userId.toString()
      );

      if (!alreadyArchived) {
        conversation.archivedBy.push({
          userId: userId,
          archivedAt: new Date()
        });
        await conversation.save();
        console.log('✅ Conversation archivée automatiquement');
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.to(targetUserId.toString()).emit('user-blocked', {
        blockedBy: userId.toString(),
        timestamp: new Date()
      });
      
      // Émettre aussi l'événement d'archivage
      if (conversation) {
        io.to(userId.toString()).emit('conversation-archived', {
          conversationId: conversation._id,
          archivedAt: new Date()
        });
      }
    }

    return res.json({
      success: true,
      message: 'Utilisateur bloqué, retiré des contacts et conversation archivée',
      blockedUser: {
        _id: targetUser._id,
        name: targetUser.name,
        profilePicture: targetUser.profilePicture
      }
    });
  } catch (err) {
    console.error('❌ blockUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const userId = req.user._id;
    const { targetUserId } = req.body;
   
    console.log('🔓 unblockUser appelé:', { userId, targetUserId });

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
      });
    }

    // ✅ SUPPRIMER LE BLOCAGE
    const result = await BlockedUser.findOneAndDelete({
      userId: userId,
      blockedUserId: targetUserId
    });

    if (!result) {
      return res.json({
        success: true,
        message: 'Utilisateur n\'était pas bloqué',
        wasNotBlocked: true
      });
    }

    // ✅ SUPPRIMER LE CONTACT DANS LES DEUX SENS
    await Contact.deleteMany({
      $or: [
        { owner: userId, contact: targetUserId },
        { owner: targetUserId, contact: userId }
      ]
    });

    console.log('✅ Utilisateur débloqué ET retiré des contacts:', targetUserId);

    // 🆕 Désarchiver automatiquement la conversation 1-1 si elle existe
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, targetUserId], $size: 2 },
      isGroup: false
    });

    const io = req.app.get('io');

    if (conversation && Array.isArray(conversation.archivedBy)) {
      const before = conversation.archivedBy.length;
      conversation.archivedBy = conversation.archivedBy.filter(
        item => item.userId && item.userId.toString() !== userId.toString()
      );

      if (conversation.archivedBy.length !== before) {
        await conversation.save();
        console.log('📤 Conversation désarchivée automatiquement lors du déblocage');

        if (io) {
          io.to(userId.toString()).emit('conversation-unarchived', {
            conversationId: conversation._id
          });
        }
      }
    }

    // ✅ Émettre l'événement Socket.io de déblocage
    if (io) {
      io.to(targetUserId.toString()).emit('user-unblocked', {
        unblockedBy: userId.toString(),
        timestamp: new Date()
      });
    }

    return res.json({
      success: true,
      message: 'Utilisateur débloqué. Vous pouvez lui envoyer une invitation pour le rajouter.'
    });
  } catch (err) {
    console.error('❌ unblockUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

exports.checkIfBlocked = async (req, res) => {
  try {
    // ✅ Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      console.error('❌ Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const userId = req.user._id;
    const targetUserId = req.params.targetUserId || req.query.targetUserId;

    console.log('🔍 checkIfBlocked appelé:', { userId, targetUserId });

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
      });
    }
    // ✅ Vérifier si l'utilisateur cible existe
const targetUser = await User.findById(targetUserId);
if (!targetUser) {
  console.warn('⚠️ Utilisateur cible introuvable:', targetUserId);
  return res.status(404).json({
    success: false,
    message: 'Utilisateur introuvable'
  });
}

    const blockStatus = await BlockedUser.getBlockStatus(
      userId.toString(), 
      targetUserId
    );

    console.log('✅ Résultat checkIfBlocked:', blockStatus);

    return res.json({
      success: true,
      iBlocked: blockStatus.iBlocked,
      blockedMe: blockStatus.blockedMe,
      isBlocked: blockStatus.isBlocked
    });
  } catch (err) {
    console.error('❌ checkIfBlocked error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const userId = req.user._id;
    
    console.log('📋 getBlockedUsers appelé pour:', userId);
   
    const blockedUsers = await BlockedUser.find({ userId })
      .populate('blockedUserId', 'name email profilePicture isOnline')
      .sort({ createdAt: -1 });

    const formattedUsers = blockedUsers.map(block => ({
      _id: block.blockedUserId._id,
      name: block.blockedUserId.name,
      email: block.blockedUserId.email,
      profilePicture: block.blockedUserId.profilePicture,
      isOnline: block.blockedUserId.isOnline,
      blockedAt: block.createdAt,
      reason: block.reason
    }));

    console.log('✅ Nombre d\'utilisateurs bloqués:', formattedUsers.length);

    return res.json({
      success: true,
      blockedUsers: formattedUsers
    });
  } catch (err) {
    console.error('❌ getBlockedUsers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

exports.muteConversationForUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
  return res.status(401).json({
    success: false,
    message: 'Non authentifié'
  });
}
    const conversationId = req.params.id;
    const userId = req.user._id;

    // ✅ Fonction utilitaire locale
    const areContacts = async (userId1, userId2) => {
      const contact1 = await Contact.findOne({
        owner: userId1,
        contact: userId2
      });
      
      const contact2 = await Contact.findOne({
        owner: userId2,
        contact: userId1
      });
      
      return !!(contact1 || contact2);
    };
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    if (!Array.isArray(conversation.mutedBy)) {
      conversation.mutedBy = [];
    }
   
    if (!conversation.mutedBy.some(u => u.toString() === userId.toString())) {
      conversation.mutedBy.push(userId);
      await conversation.save();
    }

    return res.json({
      success: true,
      message: 'Notifications désactivées',
      conversationId,
      muted: true
    });
  } catch (err) {
    console.error('muteConversationForUser error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

exports.unmuteConversationForUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
  return res.status(401).json({
    success: false,
    message: 'Non authentifié'
  });
}
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    if (Array.isArray(conversation.mutedBy)) {
      conversation.mutedBy = conversation.mutedBy.filter(
        u => u.toString() !== userId.toString()
      );
      await conversation.save();
    }

    return res.json({
      success: true,
      message: 'Notifications activées',
      conversationId,
      muted: false
    });
  } catch (err) {
    console.error('unmuteConversationForUser error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ✅ FONCTION POUR RÉCUPÉRER LES MÉDIAS
exports.getMediaForConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { type = 'all' } = req.query;

    console.log(`📁 Chargement médias pour conversation ${conversationId}, type: ${type}`);

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 });

    let result = {};

    if (type === 'all' || type === 'images') {
      result.images = messages
        .filter(m => m.type === 'image' && m.fileUrl)
        .map(m => ({
          id: m._id,
          url: m.fileUrl,
          name: `image-${m._id}.jpg`,
          size: m.fileSize || 0,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }

    if (type === 'all' || type === 'files') {
      result.files = messages
        .filter(m => m.type === 'file' && m.fileUrl)
        .map(m => ({
          id: m._id,
          url: m.fileUrl,
          name: m.fileName || `file-${m._id}`,
          size: m.fileSize || 0,
          type: m.fileName?.split('.').pop() || 'file',
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }

    if (type === 'all' || type === 'audio') {
      result.audio = messages
        .filter(m => (m.type === 'audio' || m.type === 'voice') && (m.fileUrl || m.voiceUrl))
        .map(m => ({
          id: m._id,
          url: m.voiceUrl || m.fileUrl,
          name: m.type === 'voice' ? `voice-${m._id}.mp3` : (m.fileName || `audio-${m._id}.mp3`),
          duration: m.voiceDuration || 0,
          size: m.fileSize || 0,
          type: m.type,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }

    // 🆕 AJOUT DES VIDÉOS
    if (type === 'all' || type === 'videos') {
      result.videos = messages
        .filter(m => m.type === 'video' && m.fileUrl)
        .map(m => ({
          id: m._id,
          url: m.fileUrl,
          name: m.fileName || `video-${m._id}.mp4`,
          size: m.fileSize || 0,
          duration: m.videoDuration || 0,
          thumbnail: m.videoThumbnail || null,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }

    if (type === 'all' || type === 'links') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      result.links = messages
        .filter(m => m.content && urlRegex.test(m.content))
        .map(m => {
          const links = m.content.match(urlRegex) || [];
          return {
            id: m._id,
            links: links,
            content: m.content,
            sender: {
              _id: m.sender._id,
              name: m.sender.name,
              profilePicture: m.sender.profilePicture
            },
            createdAt: m.createdAt
          };
        })
        .filter(item => item.links.length > 0);
    }

    result.stats = {
      totalImages: result.images?.length || 0,
      totalFiles: result.files?.length || 0,
      totalAudio: result.audio?.length || 0,
      totalVideos: result.videos?.length || 0, // 🆕 AJOUT
      totalLinks: result.links?.length || 0
    };

    console.log(`✅ Médias chargés:`, result.stats);

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('❌ getMediaForConversation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

exports.getConversationSettings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
  return res.status(401).json({
    success: false,
    message: 'Non authentifié'
  });
}
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email profilePicture');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    let otherParticipant = null;
    let blockStatus = { iBlocked: false, blockedMe: false };

    if (!conversation.isGroup) {
      otherParticipant = conversation.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      if (otherParticipant) {
        const iBlocked = await BlockedUser.findOne({
          userId,
          blockedUserId: otherParticipant._id
        });

        const blockedMe = await BlockedUser.findOne({
          userId: otherParticipant._id,
          blockedUserId: userId
        });

        blockStatus = {
          iBlocked: !!iBlocked,
          blockedMe: !!blockedMe
        };
      }
    }

    const isMuted = conversation.mutedBy?.some(
      u => u.toString() === userId.toString()
    );

    const isDeleted = conversation.deletedBy?.some(
      u => u.toString() === userId.toString()
    );

    return res.json({
      success: true,
      settings: {
        conversationId: conversation._id,
        isMuted,
        isDeleted,
        ...blockStatus,
        isGroup: conversation.isGroup,
        otherParticipant
      }
    });
  } catch (err) {
    console.error('getConversationSettings error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ==========================================
// 🆕 FONCTIONS D'ARCHIVAGE
// ==========================================

/**
 * Archiver une conversation
 */
exports.archiveConversationForUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const conversationId = req.params.id;
    const userId = req.user._id;

    console.log('📦 Archivage conversation:', conversationId, 'par user:', userId);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    // Vérifier que l'utilisateur fait partie de la conversation
const isParticipant = isUserInConversation(conversation, userId);

if (!isParticipant) {
  return res.status(403).json({
    success: false,
    message: 'Vous ne faites pas partie de cette conversation'
  });
}

    // Initialiser archivedBy si nécessaire
    if (!conversation.archivedBy) {
      conversation.archivedBy = [];
    }

    // Vérifier si déjà archivée
    const alreadyArchived = conversation.archivedBy.some(
      item => item.userId && item.userId.toString() === userId.toString()
    );

    if (alreadyArchived) {
      return res.json({
        success: true,
        message: 'Conversation déjà archivée',
        alreadyArchived: true
      });
    }

    // Archiver
    conversation.archivedBy.push({
      userId: userId,
      archivedAt: new Date()
    });

    await conversation.save();

    console.log('✅ Conversation archivée avec succès');

    // Émettre un événement Socket.io pour rafraîchir la sidebar
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('conversation-archived', {
        conversationId,
        archivedAt: new Date()
      });
    }

    return res.json({
      success: true,
      message: 'Conversation archivée',
      conversationId
    });
  } catch (err) {
    console.error('❌ archiveConversationForUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

/**
 * Désarchiver une conversation
 */
exports.unarchiveConversationForUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const conversationId = req.params.id;
    const userId = req.user._id;

    console.log('📤 Désarchivage conversation:', conversationId, 'par user:', userId);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
const isParticipant = isUserInConversation(conversation, userId);

if (!isParticipant) {
  return res.status(403).json({
    success: false,
    message: 'Vous ne faites pas partie de cette conversation'
  });
}

    // Retirer de archivedBy
    if (Array.isArray(conversation.archivedBy)) {
      conversation.archivedBy = conversation.archivedBy.filter(
        item => item.userId && item.userId.toString() !== userId.toString()
      );
      await conversation.save();
    }

    console.log('✅ Conversation désarchivée avec succès');

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('conversation-unarchived', {
        conversationId
      });
    }

    return res.json({
      success: true,
      message: 'Conversation désarchivée',
      conversationId
    });
  } catch (err) {
    console.error('❌ unarchiveConversationForUser error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

/**
 * Récupérer toutes les conversations archivées
 */
exports.getArchivedConversations = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    const userId = req.user._id;

    console.log('📋 getArchivedConversations pour:', userId);

    const conversations = await Conversation.find({
      participants: userId,
      'archivedBy.userId': userId
    })
      .populate('participants', 'name email profilePicture isOnline')
      .populate('groupAdmin', 'name email profilePicture')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ updatedAt: -1 })
      .lean(); // ✅ objets simples

    console.log(`✅ ${conversations.length} conversations archivées trouvées`);

    // 🔹 Récupérer tous les "autres" participants des conversations 1-1
    const dmConversations = conversations.filter(conv => !conv.isGroup);
    const otherUserIds = dmConversations
      .map(conv => {
        const other = (conv.participants || []).find(
          p => p._id.toString() !== userId.toString()
        );
        return other ? other._id.toString() : null;
      })
      .filter(Boolean);

    // 🔹 Trouver tous les utilisateurs que J'AI bloqués parmi ces autres participants
    const blocks = await BlockedUser.find({
      userId,
      blockedUserId: { $in: otherUserIds }
    }).lean();

    const blockedSet = new Set(blocks.map(b => b.blockedUserId.toString()));

    const formattedConversations = conversations.map(conv => {
      const archivedArr = Array.isArray(conv.archivedBy) ? conv.archivedBy : [];
      const archivedInfo = archivedArr.find(
        item => item.userId && item.userId.toString() === userId.toString()
      );

      let isBlockedWithUser = false;

      if (!conv.isGroup) {
        const other = (conv.participants || []).find(
          p => p._id.toString() !== userId.toString()
        );
        if (other) {
          const otherId = other._id.toString();
          // 👉 true si MOI j'ai bloqué cet utilisateur
          isBlockedWithUser = blockedSet.has(otherId);
        }
      }

      return {
        ...conv,
        archivedAt: archivedInfo ? archivedInfo.archivedAt : null,
        isBlockedWithUser
      };
    });

    return res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (err) {
    console.error('❌ getArchivedConversations error:', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: "Erreur serveur"
    });
  }
};

// ✅ Récupérer toutes les conversations mutées par l'utilisateur connecté
exports.getMutedConversations = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Non authentifié" });
    }

    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      mutedBy: userId
    }).select("_id").lean();

    return res.json({
      success: true,
      mutedConversationIds: conversations.map(c => c._id.toString())
    });
  } catch (err) {
    console.error("❌ getMutedConversations error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};