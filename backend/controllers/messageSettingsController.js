// controllers/messageSettingsController.js
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');
const BlockedUser = require('../models/BlockedUser');


/**
 * Soft delete conversation FOR THE CURRENT USER
 */
exports.deleteConversationForUser = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;


    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }


    if (!Array.isArray(conversation.deletedBy)) {
      conversation.deletedBy = [];
    }
   
    if (!conversation.deletedBy.some(u => u.toString() === userId.toString())) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }


    return res.json({
      success: true,
      message: 'Discussion supprimée',
      conversationId
    });
  } catch (err) {
    console.error('deleteConversationForUser error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};


/**
 * Restore conversation for current user
 */
exports.restoreConversationForUser = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;


    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }


    if (Array.isArray(conversation.deletedBy)) {
      conversation.deletedBy = conversation.deletedBy.filter(
        u => u.toString() !== userId.toString()
      );
      await conversation.save();
    }


    return res.json({
      success: true,
      message: 'Discussion restaurée'
    });
  } catch (err) {
    console.error('restoreConversationForUser error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};


/**
 * Block a user
 */
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId, reason } = req.body;
   
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
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
      userId,
      blockedUserId: targetUserId
    });


    if (existingBlock) {
      return res.json({
        success: true,
        message: 'Utilisateur déjà bloqué',
        alreadyBlocked: true
      });
    }


    const blockedUser = new BlockedUser({
      userId,
      blockedUserId: targetUserId,
      reason: reason || ''
    });


    await blockedUser.save();


    const io = req.app.get('io');
    if (io) {
      io.to(targetUserId.toString()).emit('user-blocked', {
        blockedBy: userId.toString()
      });
    }


    return res.json({
      success: true,
      message: 'Utilisateur bloqué',
      blockedUser: {
        _id: targetUser._id,
        name: targetUser.name,
        profilePicture: targetUser.profilePicture
      }
    });
  } catch (err) {
    console.error('blockUser error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};


/**
 * Unblock a user
 */
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;
   
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
      });
    }


    const result = await BlockedUser.findOneAndDelete({
      userId,
      blockedUserId: targetUserId
    });


    if (!result) {
      return res.json({
        success: true,
        message: 'Utilisateur non bloqué'
      });
    }


    const io = req.app.get('io');
    if (io) {
      io.to(targetUserId.toString()).emit('user-unblocked', {
        unblockedBy: userId.toString()
      });
    }


    return res.json({
      success: true,
      message: 'Utilisateur débloqué'
    });
  } catch (err) {
    console.error('unblockUser error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};


/**
 * Get blocked users
 */
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
   
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


    return res.json({
      success: true,
      blockedUsers: formattedUsers
    });
  } catch (err) {
    console.error('getBlockedUsers error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};


/**
 * Check if user is blocked
 */
exports.checkIfBlocked = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.query;


    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId requis'
      });
    }


    const iBlocked = await BlockedUser.findOne({
      userId,
      blockedUserId: targetUserId
    });


    const blockedMe = await BlockedUser.findOne({
      userId: targetUserId,
      blockedUserId: userId
    });


    return res.json({
      success: true,
      iBlocked: !!iBlocked,
      blockedMe: !!blockedMe,
      isBlocked: !!(iBlocked || blockedMe)
    });
  } catch (err) {
    console.error('checkIfBlocked error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};






/**
 * Mute conversation
 */
exports.muteConversationForUser = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;


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


/**
 * Unmute conversation
 */
exports.unmuteConversationForUser = async (req, res) => {
  try {
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


/**
 * Get media for conversation
 */
exports.getMediaForConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { type } = req.query;


    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 });


    let result = {};


    if (!type || type === 'all' || type === 'images') {
      result.images = messages
        .filter(m => m.type === 'image' && m.fileUrl)
        .map(m => ({
          id: m._id,
          url: m.fileUrl,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }


    if (!type || type === 'all' || type === 'files') {
      result.files = messages
        .filter(m => m.type === 'file' && m.fileUrl)
        .map(m => ({
          id: m._id,
          url: m.fileUrl,
          name: m.fileName,
          size: m.fileSize,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }


    if (!type || type === 'all' || type === 'audio') {
      result.audio = messages
        .filter(m => (m.type === 'audio' || m.type === 'voice') && (m.fileUrl || m.voiceUrl))
        .map(m => ({
          id: m._id,
          url: m.voiceUrl || m.fileUrl,
          duration: m.voiceDuration || 0,
          type: m.type,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }


    if (!type || type === 'all' || type === 'links') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      result.links = messages
        .filter(m => m.content && urlRegex.test(m.content))
        .map(m => ({
          id: m._id,
          links: m.content.match(urlRegex) || [],
          content: m.content,
          sender: {
            _id: m.sender._id,
            name: m.sender.name,
            profilePicture: m.sender.profilePicture
          },
          createdAt: m.createdAt
        }));
    }


    result.stats = {
      totalImages: result.images?.length || 0,
      totalFiles: result.files?.length || 0,
      totalAudio: result.audio?.length || 0,
      totalLinks: result.links?.length || 0
    };


    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('getMediaForConversation error', err);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};


/**
 * Get conversation settings
 */
exports.getConversationSettings = async (req, res) => {
  try {
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
/**
 * Save user theme + wallpaper
 */
exports.saveTheme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { theme, wallpaperUrl } = req.body;


    console.log('✅ saveTheme called with:', { theme, wallpaperUrl, userId });


    if (!theme) {
      return res.status(400).json({
        success: false,
        message: "Theme manquant"
      });
    }


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }


    // Sauvegarde dans User
    user.chatTheme = {
      theme: theme,
      wallpaperUrl: wallpaperUrl || null,
    };


    await user.save();
   
    console.log('✅ Thème sauvegardé pour user:', user._id);


    return res.json({
      success: true,
      message: "Thème sauvegardé",
      theme: user.chatTheme
    });


  } catch (err) {
    console.error('❌ saveTheme error:', err);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};


// 🆕 AJOUT : Mettre à jour le thème d'une conversation
exports.updateConversationTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { theme } = req.body;
    const userId = req.user._id;


    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    });


    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }


    conversation.theme = theme;
    await conversation.save();


    if (req.io) {
      req.io.to(id).emit('theme-updated', {
        conversationId: id,
        theme
      });
    }


    res.json({ success: true, theme });
  } catch (error) {
    console.error('❌ Erreur sauvegarde thème:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
