// controllers/statusController.js - COMPLET
const mongoose = require('mongoose');
const Status = require('../models/Status');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const User = require('../models/User');

console.log('✅ StatusController chargé');

// ============================================
// 🆕 FONCTION POUR CRÉER UN STATUT
// ============================================
exports.createStatus = async (req, res) => {
  try {
    console.log('📝 Création de statut - Données reçues:', {
      body: req.body,
      files: req.files,
      user: req.user.id
    });

    const { type, content, textBackground, textColor, textFontSize } = req.body;
    const userId = req.user.id;

    // Validation basique
    if (!type || !['text', 'image', 'video'].includes(type)) {
      return res.status(400).json({ 
        error: "Type de statut invalide", 
        validTypes: ['text', 'image', 'video'] 
      });
    }

    if (type === 'text' && (!content || content.trim() === '')) {
      return res.status(400).json({ error: "Le contenu texte est requis" });
    }

    let mediaData = {
      mediaUrl: '',
      thumbnailUrl: '',
      videoDuration: 0,
      fileSize: 0,
      mimeType: ''
    };

    // Gestion des fichiers uploadés
    if (req.files) {
      console.log('📁 Fichiers reçus:', req.files);

      if (type === 'image' && req.files.image && req.files.image[0]) {
        const image = req.files.image[0];
        mediaData = {
          mediaUrl: `/uploads/${image.filename || image.originalname}`,
          thumbnailUrl: `/uploads/${image.filename || image.originalname}`,
          fileSize: image.size,
          mimeType: image.mimetype
        };
      } else if (type === 'video' && req.files.video && req.files.video[0]) {
        const video = req.files.video[0];
        mediaData = {
          mediaUrl: `/uploads/${video.filename || video.originalname}`,
          thumbnailUrl: '/uploads/video-thumbnail.jpg',
          videoDuration: 0,
          fileSize: video.size,
          mimeType: video.mimetype
        };
      }
    } else if (type !== 'text') {
      return res.status(400).json({ 
        error: `Un fichier est requis pour un statut de type ${type}` 
      });
    }

    // Créer le statut
    const statusData = {
      userId,
      type,
      content: content || '',
      ...mediaData,
      textBackground: textBackground || '',
      textColor: textColor || '',
      textFontSize: textFontSize || '',
      views: [],
      repliesCount: 0,
      reactionsSummary: {
        total: 0,
        like: 0, love: 0, haha: 0, wow: 0,
        sad: 0, angry: 0, fire: 0, clap: 0
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    console.log('📊 Données du statut à sauvegarder:', statusData);

    const newStatus = new Status(statusData);
    await newStatus.save();

    // Populate l'utilisateur pour la réponse
    await newStatus.populate('userId', 'name profilePicture');

    console.log('✅ Statut créé avec succès:', newStatus._id);

    res.status(201).json({
      success: true,
      message: "Statut créé avec succès",
      status: newStatus
    });

  } catch (error) {
    console.error('❌ Erreur création statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de la création du statut",
      details: error.message 
    });
  }
};

// ============================================
// 📊 FONCTION POUR OBTENIR LES STATUTS DES AMIS
// ============================================
exports.getFriendsStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Récupération statuts amis pour user: ${userId}`);

    // Trouver les contacts de l'utilisateur
    const contacts = await Contact.find({ 
      owner: userId,
      isBlocked: false 
    }).select('contact');

    const contactIds = contacts.map(contact => contact.contact);
    
    // Ajouter l'utilisateur lui-même pour voir ses propres statuts
    const allUserIds = [...contactIds, userId];

    console.log(`👥 Utilisateurs à récupérer: ${allUserIds.length}`);

    // Récupérer les statuts
    const statuses = await Status.find({ 
      userId: { $in: allUserIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);

    console.log(`✅ ${statuses.length} statuts trouvés`);

    res.json({
      success: true,
      statuses: statuses,
      total: statuses.length
    });
  } catch (error) {
    console.error('❌ Erreur statuts amis:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des statuts",
      details: error.message 
    });
  }
};

// ============================================
// 👤 FONCTION POUR OBTENIR MES STATUTS
// ============================================
exports.getMyStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const statuses = await Status.find({ 
      userId,
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name profilePicture')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      statuses: statuses || [],
      total: statuses?.length || 0
    });
  } catch (error) {
    console.error('❌ Erreur mes statuts:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération de vos statuts",
      details: error.message 
    });
  }
};

// ============================================
// 👁️ FONCTION POUR MARQUER UN STATUT COMME VU
// ============================================
exports.viewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log(`👁️ User ${userId} voit le statut ${id}`);

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà vu ce statut
    const existingView = status.views.find(
      view => view.userId && view.userId.toString() === userId
    );
    
    if (!existingView) {
      status.views.push({
        userId,
        viewedAt: new Date(),
        reaction: null
      });
      await status.save();
    }

    res.json({
      success: true,
      message: "Statut marqué comme vu",
      statusId: id,
      viewedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Erreur vue statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de la visualisation du statut",
      details: error.message 
    });
  }
};

// ============================================
// 📊 FONCTION POUR OBTENIR LES VUES D'UN STATUT
// ============================================
exports.getStatusViews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const status = await Status.findById(id)
      .populate('views.userId', 'name profilePicture');
    
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }
    
    const views = status.views.map(view => ({
      userId: view.userId?._id,
      userName: view.userId?.name,
      userProfile: view.userId?.profilePicture,
      viewedAt: view.viewedAt,
      reaction: view.reaction
    }));
    
    res.json({
      success: true,
      views,
      totalViews: views.length,
      statusId: id
    });
  } catch (error) {
    console.error('❌ Erreur vues statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des vues",
      details: error.message 
    });
  }
};

// ============================================
// 🗑️ FONCTION POUR SUPPRIMER UN STATUT
// ============================================
exports.deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user.id;
    
    console.log(`🗑️ User ${userId} supprime le statut ${statusId}`);
    
    const status = await Status.findOneAndDelete({
      _id: statusId,
      userId: userId
    });
    
    if (!status) {
      return res.status(404).json({ 
        error: "Statut non trouvé ou non autorisé" 
      });
    }
    
    res.json({
      success: true,
      message: "Statut supprimé",
      statusId
    });
  } catch (error) {
    console.error('❌ Erreur suppression statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de la suppression du statut",
      details: error.message 
    });
  }
};

// ============================================
// 🎭 FONCTION POUR RÉAGIR À UN STATUT
// ============================================
exports.reactToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    console.log('🎭 Réaction à statut:', { statusId, userId, reactionType });

    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap', null];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ 
        error: "Réaction invalide",
        validReactions: ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap']
      });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    const statusOwnerId = status.userId.toString();
    const isOwner = statusOwnerId === userId;

    // Vérifier que l'utilisateur est autorisé
    if (!isOwner) {
      const isContact = await Contact.exists({
        owner: statusOwnerId,
        contact: userId,
        isBlocked: false
      });

      if (!isContact) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
    }

    // Gérer la réaction
    if (reactionType === null) {
      await status.removeReaction(userId);
    } else {
      await status.addOrUpdateReaction(userId, reactionType);
    }

    const updatedStatus = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture')
      .lean();

    // CRÉER UN MESSAGE POUR LA RÉACTION (seulement si ce n'est pas le propriétaire)
    let conversation = null;
    if (!isOwner) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, statusOwnerId] },
        isGroup: false
      });

      // Si pas de conversation, en créer une
      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, statusOwnerId],
          isGroup: false
        });
        await conversation.save();
      }

      // Créer le message de réaction
      const reactionMessage = new Message({
        conversationId: conversation._id,
        sender: userId,
        content: reactionType === 'like' ? 'a aimé votre story' : 
                reactionType === 'love' ? 'a aimé votre story ❤️' :
                reactionType === 'haha' ? 'a ri de votre story 😄' :
                reactionType === 'wow' ? 'a été impressionné par votre story 😮' :
                reactionType === 'sad' ? 'a été touché par votre story 😢' :
                reactionType === 'angry' ? 'a réagi à votre story 😠' :
                reactionType === 'fire' ? 'a trouvé votre story 🔥' :
                reactionType === 'clap' ? 'a applaudi votre story 👏' : '',
        type: 'story_reaction',
        isStoryReaction: true,
        storyId: statusId,
        storyType: status.type,
        storyPreview: status.type === 'text' ? 
                     (status.content?.substring(0, 100) || '📝 Statut') : 
                     (status.type === 'image' ? '🖼️ Image' : '🎥 Vidéo'),
        storyReactionType: reactionType
      });
      await reactionMessage.save();

      // Mettre à jour la conversation
      conversation.lastMessage = reactionMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Populate pour l'envoi
      await reactionMessage.populate('sender', 'name profilePicture');
      await conversation.populate('participants', 'name profilePicture');

      // Émettre le message dans la conversation
      const io = req.app.get('io');
      if (io) {
        io.to(conversation._id.toString()).emit('receive-message', reactionMessage);
        io.to(statusOwnerId.toString()).emit('conversation-updated', conversation);
      }
    }

    // Récupérer les réactions
    const reactions = updatedStatus.views
      .filter(view => view.reaction)
      .map(view => ({
        userId: view.userId._id,
        userName: view.userId.name,
        userProfile: view.userId.profilePicture,
        reaction: view.reaction,
        viewedAt: view.viewedAt
      }));

    // Émettre l'événement socket
    const io = req.app.get('io');
    if (io) {
      io.to(`status-${statusId}`).emit('status-reacted', {
        statusId,
        userId,
        reactionType,
        reactionsSummary: updatedStatus.reactionsSummary,
        reactionsCount: reactions.length
      });
      
      if (!isOwner) {
        io.to(statusOwnerId.toString()).emit('status-reaction-notification', {
          statusId,
          userId: req.user.id,
          userName: req.user.name,
          reactionType,
          statusPreview: status.content?.substring(0, 50) || 
                        (status.type === 'image' ? '🖼️ Image' : 
                         status.type === 'video' ? '🎥 Vidéo' : '📝 Statut')
        });
      }
    }

    res.json({
      success: true,
      message: reactionType === null ? "Réaction retirée" : "Réaction ajoutée",
      reactionType,
      reactionsSummary: updatedStatus.reactionsSummary,
      reactions,
      totalReactions: updatedStatus.reactionsSummary.total,
      // Retourner l'ID de conversation si un message a été créé
      ...(!isOwner && conversation ? { conversationId: conversation._id } : {})
    });

  } catch (error) {
    console.error('❌ Erreur réaction statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de l'ajout de la réaction",
      details: error.message 
    });
  }
};

// ============================================
// 💬 FONCTION POUR RÉPONDRE À UN STATUT
// ============================================
exports.replyToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    console.log('💬 Réponse à statut:', { statusId, userId, message });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Le message est requis" });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    const statusOwnerId = status.userId.toString();
    const isOwner = userId === statusOwnerId;

    // Vérifier que l'utilisateur est autorisé
    if (!isOwner) {
      const isContact = await Contact.exists({
        owner: statusOwnerId,
        contact: userId,
        isBlocked: false
      });

      if (!isContact) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
    }

    // 1. Ajouter la réponse dans le statut
    await status.addReply(userId, message.trim());

    // 2. Créer un message dans le chat (seulement si ce n'est pas le propriétaire)
    let conversation = null;
    let chatMessage = null;

    if (!isOwner) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, statusOwnerId] },
        isGroup: false
      });

      // Si pas de conversation, en créer une
      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, statusOwnerId],
          isGroup: false
        });
        await conversation.save();
      }

      // Créer le message de réponse
      chatMessage = new Message({
        conversationId: conversation._id,
        sender: userId,
        content: message.trim(),
        type: 'story_reply',
        isStoryReply: true,
        storyId: statusId,
        storyType: status.type,
        storyPreview: status.type === 'text' ? 
                     (status.content?.substring(0, 100) || '📝 Statut') : 
                     (status.type === 'image' ? '🖼️ Image' : '🎥 Vidéo')
      });
      await chatMessage.save();

      // Mettre à jour la conversation
      conversation.lastMessage = chatMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Populate pour l'envoi
      await chatMessage.populate('sender', 'name profilePicture');
      await conversation.populate('participants', 'name profilePicture');

      // Émettre le message
      const io = req.app.get('io');
      if (io) {
        io.to(conversation._id.toString()).emit('receive-message', chatMessage);
        conversation.participants.forEach(participant => {
          const participantId = participant._id.toString();
          io.to(participantId).emit('conversation-updated', conversation);
        });
      }
    }

    // Récupérer le statut mis à jour
    const updatedStatus = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture')
      .lean();

    // Émettre les événements socket
    const io = req.app.get('io');
    if (io) {
      io.to(`status-${statusId}`).emit('status-replied', {
        statusId,
        repliesCount: updatedStatus.repliesCount,
        latestReply: {
          userId,
          message: message.trim(),
          userName: req.user.name
        }
      });

      if (!isOwner) {
        io.to(statusOwnerId.toString()).emit('status-reply-notification', {
          statusId,
          senderId: userId,
          senderName: req.user.name,
          message: message.trim(),
          statusPreview: status.type === 'text' ? 
                        (status.content?.substring(0, 50) || '📝 Statut') : 
                        (status.type === 'image' ? '🖼️ Image' : '🎥 Vidéo')
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Réponse envoyée",
      reply: {
        userId,
        message: message.trim(),
        createdAt: new Date()
      },
      chatMessage,
      conversationId: conversation?._id,
      repliesCount: updatedStatus.repliesCount,
      isStoryReply: true
    });

  } catch (error) {
    console.error('❌ Erreur réponse statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de l'envoi de la réponse",
      details: error.message 
    });
  }
};

// ============================================
// 👍 FONCTION POUR OBTENIR LES RÉACTIONS D'UN STATUT
// ============================================
exports.getStatusReactions = async (req, res) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture');

    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    const reactions = status.views
      .filter(view => view.reaction)
      .map(view => ({
        userId: view.userId._id,
        userName: view.userId.name,
        userProfile: view.userId.profilePicture,
        reaction: view.reaction,
        viewedAt: view.viewedAt
      }));

    res.json({
      success: true,
      reactions,
      total: reactions.length,
      reactionsSummary: status.reactionsSummary
    });
  } catch (error) {
    console.error('❌ Erreur récupération réactions:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des réactions",
      details: error.message 
    });
  }
};

// ============================================
// 💭 FONCTION POUR OBTENIR LES RÉPONSES D'UN STATUT
// ============================================
exports.getStatusReplies = async (req, res) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture');

    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    const replies = status.views
      .filter(view => view.replyMessage)
      .map(view => ({
        userId: view.userId._id,
        userName: view.userId.name,
        userProfile: view.userId.profilePicture,
        message: view.replyMessage,
        viewedAt: view.viewedAt
      }));

    res.json({
      success: true,
      replies,
      total: replies.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des réponses",
      details: error.message 
    });
  }
};

console.log('✅ StatusController - Toutes les fonctions exportées');