const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');
const Contact = require('../models/Contact');
const axios = require('axios');

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id || req.user._id;

    console.log('📥 getMessages appelé:', { conversationId, userId });

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      console.log('❌ Conversation non trouvée');
      return res.status(404).json({ 
        success: false,
        error: 'Conversation non trouvée' 
      });
    }

    const deletedByUser = conversation.deletedBy?.find(
      item => item.userId?.toString() === userId.toString()
    );

    let messages;

    if (deletedByUser) {
      const deletionDate = deletedByUser.deletedAt;
      
      messages = await Message.find({ 
        conversationId,
        deletedFor: { $ne: userId },
        createdAt: { $gt: deletionDate },
        // ✅ FILTRER LES MESSAGES PROGRAMMÉS NON ENVOYÉS
        $or: [
          { isSent: true },                              // Messages déjà envoyés
          { sender: userId, isScheduled: true }          // Mes messages programmés (seulement pour moi)
        ]
      })
        .populate('sender', 'name profilePicture')
        .populate('reactions.userId', 'name profilePicture')
        .populate('replyToSender', 'name profilePicture')
        .sort({ createdAt: 1 });
    } else {
      messages = await Message.find({ 
        conversationId,
        deletedFor: { $ne: userId },
        // ✅ FILTRER LES MESSAGES PROGRAMMÉS NON ENVOYÉS
        $or: [
          { isSent: true },                              // Messages déjà envoyés
          { sender: userId, isScheduled: true }          // Mes messages programmés (seulement pour moi)
        ]
      })
        .populate('sender', 'name profilePicture')
        .populate('reactions.userId', 'name profilePicture')
        .populate('replyToSender', 'name profilePicture')
        .sort({ createdAt: 1 });
    }

    console.log(`📊 ${messages.length} messages visibles pour ${userId}`);

    res.json({ success: true, messages });
    
  } catch (error) {
    console.error('❌ Erreur getMessages:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { 
      conversationId, 
      content, 
      type, 
      fileUrl, 
      fileName, 
      fileSize,
      videoDuration,
      videoThumbnail,
      replyTo,
      replyToContent,
      replyToSender
    } = req.body;
    
    const senderId = req.user.id || req.user._id;

    const convCheck = await Conversation.findById(conversationId)
      .populate('participants', '_id')
      .lean();

    if (!convCheck) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // ✅ Vérification de blocage AVANT envoi
    if (!convCheck.isGroup) {
      const otherParticipant = convCheck.participants.find(
        p => p._id.toString() !== senderId.toString()
      );

      if (otherParticipant) {
        const blockExists = await BlockedUser.findOne({
          $or: [
            { blocker: senderId, blocked: otherParticipant._id },
            { blocker: otherParticipant._id, blocked: senderId }
          ]
        });

        if (blockExists) {
          console.log('🚫 Message bloqué - relation bloquée détectée');
          return res.status(403).json({
            success: false,
            message: 'Impossible d\'envoyer - Utilisateur bloqué',
            blocked: true
          });
        }
      }
    }

    // ✅ Création du message
    const messageData = {
      conversationId,
      sender: senderId,
      content: content || '',
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      status: 'sent',
      replyTo: replyTo || null,
      replyToContent: replyToContent || null,
      replyToSender: replyToSender || null,
      // 🔥 IMPORTANT : Le nouveau message n'a AUCUN deletedFor
      deletedFor: []
    };

    if (type === 'video') {
      if (videoDuration) messageData.videoDuration = videoDuration;
      if (videoThumbnail) messageData.videoThumbnail = videoThumbnail;
    }

    const message = new Message(messageData);
    await message.save();

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message._id,
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('participants', 'name email profilePicture isOnline lastSeen')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name' }
    });

    await message.populate('sender', 'name profilePicture');
    
    if (message.replyToSender) {
      await message.populate('replyToSender', 'name profilePicture');
    }

    const io = req.app.get('io');
    if (io) {
      // 🔥 IMPORTANT : Émettre le message à TOUS les participants
      conversation.participants.forEach(participant => {
        const participantId = participant._id.toString();
        
        io.to(participantId).emit('receive-message', message);
        io.to(participantId).emit('conversation-updated', conversation);
        io.to(participantId).emit('should-refresh-conversations');
        
        console.log(`📤 Message envoyé à ${participantId}`);
      });
      
      io.to(conversationId).emit('receive-message', message);
    }

    res.status(201).json({ success: true, message, conversationId: conversationId });
    
  } catch (error) {
    console.error('❌ Erreur sendMessage:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('📬 Marquage comme délivré:', messageIds);

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        sender: { $ne: userId },
        status: 'sent'
      },
      {
        $set: { status: 'delivered' }
      }
    );

    console.log(`✅ ${result.modifiedCount} messages marqués comme délivrés`);

    const io = req.app.get('io');
    if (io && result.modifiedCount > 0) {
      const updatedMessages = await Message.find({
        _id: { $in: messageIds }
      }).select('sender conversationId').lean();

      const senderIds = new Set();
      const conversationIds = new Set();
     
      updatedMessages.forEach(msg => {
        senderIds.add(msg.sender.toString());
        conversationIds.add(msg.conversationId.toString());
      });

      senderIds.forEach(senderId => {
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'delivered'
        });
      });

      conversationIds.forEach(convId => {
        io.to(convId).emit('conversation-status-updated', {
          conversationId: convId,
          status: 'delivered'
        });
      });
    }

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('❌ Erreur markAsDelivered:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('👁️ Marquage comme lu pour conversation:', conversationId, 'par user:', userId);

    const messagesToUpdate = await Message.find({
      conversationId,
      sender: { $ne: userId },
      status: { $ne: 'read' }
    }).select('_id sender').lean();

    const messageIds = messagesToUpdate.map(m => m._id);

    if (messageIds.length === 0) {
      console.log('✅ Aucun message à marquer comme lu');
      return res.json({ success: true, modifiedCount: 0 });
    }

    const io = req.app.get('io');
    const sockets = await io.in(conversationId).fetchSockets();
    const userIsInConversation = sockets.some(s => s.userId === userId.toString());

    if (!userIsInConversation) {
      console.log('⚠️ User pas dans la conversation, on ne marque PAS comme lu');
      return res.json({ success: true, modifiedCount: 0 });
    }

    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { status: 'read' } }
    );

    console.log(`✅ ${result.modifiedCount} messages marqués comme lus`);

    if (io && result.modifiedCount > 0) {
      const senderIds = [...new Set(messagesToUpdate.map(m => m.sender.toString()))];

      senderIds.forEach(senderId => {
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'read',
          conversationId
        });
        io.to(senderId).emit('should-refresh-conversations');
      });

      io.to(conversationId).emit('conversation-status-updated', {
        conversationId,
        status: 'read'
      });

      const conversation = await Conversation.findById(conversationId)
        .select('participants')
        .lean();
     
      if (conversation) {
        conversation.participants.forEach(participantId => {
          const pId = participantId.toString();
          io.to(pId).emit('conversation-read', { conversationId });
          console.log(`✅ Émission conversation-read à ${pId}`);
        });
      }
    }

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          sender: { $ne: userId },
          status: { $ne: 'read' }
        }
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    unreadCounts.forEach(item => {
      result[item._id] = item.count;
    });

    res.json({ success: true, unreadCounts: result });
  } catch (error) {
    console.error('❌ Erreur getUnreadCount:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🆕 SUPPRIMER UN MESSAGE POUR TOUS
// ========================================
exports.deleteMessage = async (req, res) => {
  console.log('🔍 ========== DELETE MESSAGE APPELÉ ==========');
  console.log('📋 Params:', req.params);
  console.log('👤 User:', req.user);
  
  try {
    const { messageId } = req.params;
    const userId = req.user._id || req.user.id;

    console.log('🗑️ Tentative suppression message:', messageId, 'par user:', userId);

    const message = await Message.findById(messageId);
    
    if (!message) {
      console.log('❌ Message non trouvé:', messageId);
      return res.status(404).json({ 
        success: false,
        error: 'Message non trouvé' 
      });
    }

    console.log('📨 Message trouvé:', {
      _id: message._id,
      sender: message.sender,
      content: message.content?.substring(0, 50)
    });

    const messageSenderId = message.sender._id || message.sender;
    const currentUserId = userId._id || userId;
    
    if (messageSenderId.toString() !== currentUserId.toString()) {
      console.log('❌ Non autorisé - sender:', messageSenderId, 'user:', currentUserId);
      return res.status(403).json({success: false,
        error: 'Non autorisé à supprimer ce message' 
      });
    }

    const conversationId = message.conversationId.toString();

    await Message.findByIdAndDelete(messageId);
    console.log('✅ Message supprimé de la BDD');

    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Émission message-deleted pour conversation ${conversationId}`);
      
      io.to(conversationId).emit('message-deleted', {
        messageId,
        conversationId
      });
      
      console.log(`✅ Événement message-deleted émis`);
    } else {
      console.warn('⚠️ Socket.io non disponible');
    }

    console.log('✅ Suppression terminée avec succès');
    
    res.json({ 
      success: true, 
      messageId,
      conversationId 
    });
    
  } catch (error) {
    console.error('❌ Erreur deleteMessage:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// ========================================
// 🆕 SUPPRIMER POUR MOI UNIQUEMENT
// ========================================
exports.deleteMessageForMe = async (req, res) => {
  console.log('🔍 ========== DELETE FOR ME APPELÉ ==========');
  
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ Suppression pour moi:', messageId, 'user:', userId);

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    // Ajouter l'utilisateur à la liste deletedFor
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    console.log('✅ Message masqué pour:', userId);

    res.json({ 
      success: true, 
      messageId,
      deletedForMe: true
    });
  } catch (error) {
    console.error('❌ Erreur deleteMessageForMe:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🆕 MODIFIER UN MESSAGE
// ========================================
exports.editMessage = async (req, res) => {
  console.log('🔍 ========== EDIT MESSAGE APPELÉ ==========');
  console.log('📋 Params:', req.params);
  console.log('📦 Body:', req.body);
  console.log('👤 User ID:', req.user?._id);
  
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    console.log('✏️ Modification du message:', messageId);

    if (!content || content.trim() === '') {
      console.log('❌ Contenu vide');
      return res.status(400).json({ error: 'Le contenu ne peut pas être vide' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      console.log('❌ Message non trouvé:', messageId);
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    console.log('📨 Message trouvé, sender:', message.sender.toString());

    if (message.sender.toString() !== userId.toString()) {
      console.log('❌ Non autorisé - sender:', message.sender.toString(), 'user:', userId.toString());
      return res.status(403).json({ error: 'Non autorisé à modifier ce message' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    console.log('✅ Message modifié dans la BDD');

    await message.populate('sender', 'name profilePicture');

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('message-edited', {
        messageId: message._id,
        content: message.content,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        conversationId: message.conversationId
      });
      console.log(`✅ Événement message-edited émis pour conversation ${message.conversationId}`);
    }

    console.log('✅ Message modifié avec succès');
    res.json({ success: true, message });
  } catch (error) {
    console.error('❌ Erreur editMessage:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🆕 TRADUIRE UN MESSAGE AVEC DEEPL
// ========================================
exports.translateMessage = async (req, res) => {
  console.log('🔍 ========== TRANSLATE MESSAGE APPELÉ ==========');
  console.log('📋 Params:', req.params);
  console.log('📦 Body:', req.body);
  console.log('👤 User ID:', req.user?._id);
  
  try {
    const { messageId } = req.params;
    const { targetLang } = req.body;

    console.log('🌍 Message ID:', messageId);
    console.log('🌍 Target Lang:', targetLang);

    if (!targetLang || typeof targetLang !== 'string') {
      console.log('❌ targetLang manquant ou invalide');
      return res.status(400).json({ error: 'targetLang requis' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      console.log('❌ Message non trouvé:', messageId);
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    if (!message.content || message.content.trim() === '') {
      console.log('❌ Aucun contenu à traduire');
      return res.status(400).json({ error: 'Aucun contenu à traduire' });
    }

    console.log('📨 Contenu à traduire:', message.content);

    const apiKey = process.env.DEEPL_API_KEY;
    
    if (!apiKey) {
      console.error('❌ DEEPL_API_KEY manquante dans .env');
      return res.status(500).json({ error: 'API DeepL non configurée' });
    }

    const langMap = {
      'en': 'EN-GB',
      'fr': 'FR',
      'es': 'ES',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT-PT',
      'nl': 'NL',
      'pl': 'PL',
      'ru': 'RU',
      'ja': 'JA',
      'zh': 'ZH',
      'ar': 'AR'
    };

    const deeplLang = langMap[targetLang.toLowerCase()] || targetLang.toUpperCase();
    console.log('🌍 Code DeepL utilisé:', deeplLang);

    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      new URLSearchParams({
        text: message.content,
        target_lang: deeplLang
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `DeepL-Auth-Key ${apiKey}`
        }
      }
    );

    const translatedContent = response.data.translations[0].text;
    const detectedSourceLang = response.data.translations[0].detected_source_language;
    
    console.log('✅ Traduction réussie:', translatedContent);
    console.log('🔍 Langue source détectée:', detectedSourceLang);

    res.json({ 
      success: true, 
      originalContent: message.content,
      translatedContent,
      targetLang,
      messageId: message._id,
      detectedSourceLang
    });

  } catch (error) {
    console.error('❌ Erreur translateMessage:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.error('🚫 Erreur 403: Clé API DeepL invalide');
      return res.status(403).json({ error: 'Clé API DeepL invalide' });
    }
    if (error.response?.status === 456) {
      console.error('📊 Erreur 456: Quota DeepL dépassé');
      return res.status(456).json({ error: 'Quota DeepL dépassé' });
    }
    
    res.status(500).json({ error: 'Erreur lors de la traduction' });
  }
};

// ============================================
// RÉACTIONS
// ============================================

exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      r => r.userId.toString() === userId.toString()
    );

    let action = '';

    if (existingReactionIndex > -1) {
      const existingEmoji = message.reactions[existingReactionIndex].emoji;
      
      if (existingEmoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
        action = 'removed';
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
        action = 'updated';
      }
    } else {
      message.reactions.push({ userId, emoji });
      action = 'added';
    }

    await message.save();
    await message.populate('reactions.userId', 'name profilePicture');

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('reaction-updated', {
        messageId: message._id,
        reactions: message.reactions,
        action,
        userId,
        emoji
      });
    }

    res.json({ 
      success: true, 
      reactions: message.reactions,
      action 
    });

  } catch (error) {
    console.error('❌ Erreur toggleReaction:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getReactions = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId)
      .select('reactions')
      .populate('reactions.userId', 'name profilePicture');

    if (!message) {
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error('❌ Erreur getReactions:', error);
    res.status(500).json({ error: error.message });
  }
};
// ========================================
// 🆕 PROGRAMMER UN MESSAGE
// ========================================
exports.scheduleMessage = async (req, res) => {
  console.log('⏰ ========== SCHEDULE MESSAGE APPELÉ ==========');
  console.log('📦 Body:', req.body);
  
  try {
    const { conversationId, content, scheduledFor, type, fileUrl, fileName, fileSize } = req.body;
    const userId = req.user._id;

    console.log('⏰ Programmation pour:', scheduledFor);

    if (!scheduledFor) {
      return res.status(400).json({ error: 'Date de programmation requise' });
    }

    const scheduledDate = new Date(scheduledFor);
    const now = new Date();

    console.log('🕐 Date programmée:', scheduledDate);
    console.log('🕐 Date actuelle:', now);
    console.log('🕐 Différence (ms):', scheduledDate - now);

    if (scheduledDate <= now) {
      return res.status(400).json({ error: 'La date doit être dans le futur' });
    }

    // ✅ CRÉER LE MESSAGE PROGRAMMÉ (INVISIBLE POUR LES AUTRES)
    const message = new Message({
      conversationId,
      sender: userId,
      content: content || '',
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      isScheduled: true,
      scheduledFor: scheduledDate,
      scheduledBy: userId,
      isSent: false,          // ❌ PAS ENCORE ENVOYÉ
      status: 'scheduled'
    });

    await message.save();
    await message.populate('sender', 'name profilePicture');

    console.log('✅ Message programmé créé:', message._id, 'pour', scheduledDate);

    // ⚠️ NE PAS ÉMETTRE VIA SOCKET.IO ICI
    // Le message sera émis par checkScheduledMessages quand ce sera l'heure

    res.status(201).json({ 
      success: true, 
      message,
      scheduledFor: scheduledDate
    });
  } catch (error) {
    console.error('❌ Erreur scheduleMessage:', error);
    res.status(500).json({ error: error.message });
  }
};
// ========================================
// 🆕 OBTENIR LES MESSAGES PROGRAMMÉS
// ========================================
exports.getScheduledMessages = async (req, res) => {
  console.log('📋 ========== GET SCHEDULED MESSAGES ==========');
  
  try {
    const userId = req.user._id;

    const scheduledMessages = await Message.find({
      scheduledBy: userId,
      isScheduled: true,
      isSent: false
    })
    .populate('sender', 'name profilePicture')
    .populate('conversationId', 'isGroup groupName participants')
    .sort({ scheduledFor: 1 });

    console.log(`✅ ${scheduledMessages.length} messages programmés trouvés`);

    res.json({ 
      success: true, 
      scheduledMessages 
    });
  } catch (error) {
    console.error('❌ Erreur getScheduledMessages:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🆕 ANNULER UN MESSAGE PROGRAMMÉ
// ========================================
exports.cancelScheduledMessage = async (req, res) => {
  console.log('❌ ========== CANCEL SCHEDULED MESSAGE ==========');
  
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      scheduledBy: userId,
      isScheduled: true,
      isSent: false
    });

    if (!message) {
      return res.status(404).json({ error: 'Message programmé non trouvé' });
    }

    await Message.findByIdAndDelete(messageId);

    console.log('✅ Message programmé annulé:', messageId);

    res.json({ 
      success: true, 
      messageId 
    });
  } catch (error) {
    console.error('❌ Erreur cancelScheduledMessage:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🆕 MODIFIER UN MESSAGE PROGRAMMÉ
// ========================================
exports.updateScheduledMessage = async (req, res) => {
  console.log('✏️ ========== UPDATE SCHEDULED MESSAGE ==========');
  
  try {
    const { messageId } = req.params;
    const { content, scheduledFor } = req.body;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      scheduledBy: userId,
      isScheduled: true,
      isSent: false
    });

    if (!message) {
      return res.status(404).json({ error: 'Message programmé non trouvé' });
    }

    if (content) message.content = content;
    if (scheduledFor) {
      const newDate = new Date(scheduledFor);
      if (newDate <= new Date()) {
        return res.status(400).json({ error: 'La date doit être dans le futur' });
      }
      message.scheduledFor = newDate;
    }

    await message.save();
    await message.populate('sender', 'name profilePicture');

    console.log('✅ Message programmé modifié:', messageId);

    res.json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('❌ Erreur updateScheduledMessage:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🤖 TÂCHE CRON : ENVOYER LES MESSAGES PROGRAMMÉS
// ========================================
const checkScheduledMessages = async (io) => {
  try {
    const now = new Date();
    
    const messagesToSend = await Message.find({
      isScheduled: true,
      isSent: false,
      scheduledFor: { $lte: now }
    })
    .populate('sender', 'name profilePicture')
    .populate('conversationId');

    if (messagesToSend.length === 0) {
      return; // Pas de messages à envoyer
    }

    console.log(`⏰ ${messagesToSend.length} messages programmés à envoyer`);

    for (const message of messagesToSend) {
      // ✅ MARQUER COMME ENVOYÉ
      message.isSent = true;
      message.isScheduled = false;
      message.status = 'sent';
      await message.save();

      // ✅ METTRE À JOUR LA CONVERSATION
      await Conversation.findByIdAndUpdate(
        message.conversationId._id,
        {
          lastMessage: message._id,
          updatedAt: Date.now()
        }
      );

      // ✅ ÉMETTRE LE MESSAGE VIA SOCKET.IO
      if (io) {
        io.to(message.conversationId._id.toString()).emit('receive-message', message);
        
        // ✅ NOTIFIER TOUS LES PARTICIPANTS
        message.conversationId.participants.forEach(participant => {
          const participantId = participant._id ? participant._id.toString() : participant.toString();
          io.to(participantId).emit('should-refresh-conversations');
        });
      }

      console.log(`✅ Message programmé envoyé: ${message._id}`);
    }
  } catch (error) {
    console.error('❌ Erreur checkScheduledMessages:', error);
  }
};

module.exports.checkScheduledMessages = checkScheduledMessages;



// ========================================
// 🔍 RECHERCHE DE MESSAGES
// ========================================

exports.searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.query;
    const userId = req.user._id || req.user.id;

    console.log('🔍 Recherche de messages:', { conversationId, query, userId });

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Requête de recherche vide'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log('❌ Conversation introuvable');
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      console.log('❌ Non autorisé');
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const searchRegex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const deletedByUser = conversation.deletedBy?.find(
      item => item.userId?.toString() === userId.toString()
    );

    let dateFilter = {};
    if (deletedByUser) {
      dateFilter = { createdAt: { $gt: deletedByUser.deletedAt } };
      console.log('🗑️ Recherche limitée aux messages après:', deletedByUser.deletedAt);
    }

    const messages = await Message.find({
      conversationId,
      content: searchRegex,
      deletedFor: { $ne: userId }, // ✅ Filtrer deletedFor
      ...dateFilter
    })
      .populate('sender', 'name profilePicture')
      .populate('replyToSender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`✅ ${messages.length} messages trouvés pour "${query}"`);

    res.json({
      success: true,
      messages,
      count: messages.length,
      query: query.trim()
    });

  } catch (error) {
    console.error('❌ Erreur searchMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.getMessageContext = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id || req.user.id;
    const { contextSize = 10 } = req.query;

    console.log('🎯 Récupération du contexte pour message:', messageId);

    const targetMessage = await Message.findById(messageId);
    
    if (!targetMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message introuvable'
      });
    }

    const conversation = await Conversation.findById(targetMessage.conversationId);
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const messagesBefore = await Message.find({
      conversationId: targetMessage.conversationId,
      createdAt: { $lt: targetMessage.createdAt },
      deletedFor: { $ne: userId } // ✅ Filtrer deletedFor
    })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(contextSize));

    const messagesAfter = await Message.find({
      conversationId: targetMessage.conversationId,
      createdAt: { $gt: targetMessage.createdAt },
      deletedFor: { $ne: userId } // ✅ Filtrer deletedFor
    })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 1 })
      .limit(parseInt(contextSize));

    await targetMessage.populate('sender', 'name profilePicture');
    messagesBefore.reverse();

    res.json({
      success: true,
      targetMessage,
      messagesBefore,
      messagesAfter,
      context: {
        before: messagesBefore.length,
        after: messagesAfter.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur getMessageContext:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.searchAllMessages = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user._id || req.user.id;

    console.log('🔍 Recherche globale:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Requête de recherche vide'
      });
    }

    const userConversations = await Conversation.find({
      participants: userId,
      deletedBy: { $ne: userId }
    }).select('_id');

    const conversationIds = userConversations.map(c => c._id);
    const searchRegex = new RegExp(query.trim(), 'i');

    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      content: searchRegex,
      deletedFor: { $ne: userId } // ✅ Filtrer deletedFor
    })
      .populate('sender', 'name profilePicture')
      .populate('conversationId', 'isGroup groupName participants')
      .sort({ createdAt: -1 })
      .limit(100);

    const groupedByConversation = messages.reduce((acc, message) => {
      const convId = message.conversationId._id.toString();
      if (!acc[convId]) {
        acc[convId] = {
          conversation: message.conversationId,
          messages: []
        };
      }
      acc[convId].messages.push(message);
      return acc;
    }, {});

    console.log(`✅ ${messages.length} messages trouvés dans ${Object.keys(groupedByConversation).length} conversations`);

    res.json({
      success: true,
      results: Object.values(groupedByConversation),
      totalMessages: messages.length,
      totalConversations: Object.keys(groupedByConversation).length,
      query: query.trim()
    });

  } catch (error) {
    console.error('❌ Erreur searchAllMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};