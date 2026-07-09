const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');
const Contact = require('../models/Contact');
const axios = require('axios');


async function recomputeLastMessage(conversationId) {
  // On prend le dernier message encore existant dans la conversation
  const lastMsg = await Message.findOne({
    conversationId,
    // Ne pas prendre en compte les messages programmés PAS encore envoyés
    $or: [
  { isScheduled: { $ne: true } }, // messages normaux
  { isSent: true }                // messages programmés mais déjà envoyés
]
  })
    .sort({ createdAt: -1 })
    .lean();

  const update = lastMsg
    ? { lastMessage: lastMsg._id, updatedAt: lastMsg.createdAt }
    : { lastMessage: null };

  await Conversation.findByIdAndUpdate(conversationId, update);
}

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id || req.user._id;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const beforeDate = req.query.before ? new Date(req.query.before) : null;
    const beforeFilter =
      beforeDate && !Number.isNaN(beforeDate.getTime())
        ? { $lt: beforeDate }
        : null;

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
    createdAt: beforeFilter
      ? { $gt: deletionDate, ...beforeFilter }
      : { $gt: deletionDate },

    // ✅ IMPORTANT : on n'affiche PAS les messages programmés non envoyés
    $or: [
      { isScheduled: { $ne: true } }, // messages normaux
      { isSent: true }                // programmés déjà envoyés
    ]
  })
    .populate('sender', 'name profilePicture')
    .populate('reactions.userId', 'name profilePicture')
    .populate('replyToSender', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit + 1);

} else {

  messages = await Message.find({
    conversationId,
    deletedFor: { $ne: userId },
    ...(beforeFilter ? { createdAt: beforeFilter } : {}),

    // ✅ IMPORTANT : on n'affiche PAS les messages programmés non envoyés
    $or: [
      { isScheduled: { $ne: true } }, // messages normaux
      { isSent: true }                // programmés déjà envoyés
    ]
  })
    .populate('sender', 'name profilePicture')
    .populate('reactions.userId', 'name profilePicture')
    .populate('replyToSender', 'name profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit + 1);
}

    console.log(`📊 ${messages.length} messages visibles pour ${userId}`);

    const hasMore = messages.length > limit;
    messages = messages.slice(0, limit).reverse();
    const nextCursor = hasMore ? messages[0]?.createdAt : null;

    res.json({
      success: true,
      messages,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });
    
  } catch (error) {
    console.error('❌ Erreur getMessages:', error);
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id || req.user._id;

    // 1. On cherche les messages que TU n'as pas encore lus.
    // L'astuce est ici : "readBy.user": { $ne: userId }
    // On enlève "status: { $ne: 'read' }" car ça bloque les groupes.
    const messagesToUpdate = await Message.find({
      conversationId,
      sender: { $ne: userId },        // Ce n'est pas mon message
      "readBy.user": { $ne: userId }, // Je ne suis PAS dans la liste des vus
      deletedFor: { $ne: userId }     // Je n'ai pas supprimé ce message
    }).select('_id sender').lean();

    const messageIds = messagesToUpdate.map(m => m._id);

    if (messageIds.length === 0) {
      return res.json({ success: true, modifiedCount: 0 });
    }

    // 2. Mise à jour atomique : On t'ajoute à la liste ET on met le statut à 'read'
    const result = await Message.updateMany(
      { _id: { $in: messageIds } },
      { 
        $push: { readBy: { user: userId, readAt: new Date() } },
        $set: { status: 'read' } // Même si c'est déjà 'read', ça force le statut pour le 1er lecteur
      }
    );

    console.log(`✅ ${messageIds.length} messages lus par ${userId} dans conv ${conversationId}`);

    // 3. Gestion Socket.io pour le temps réel
    const io = req.app.get('io');
    if (io && messageIds.length > 0) {
      
      // A) Prévenir ceux qui ont envoyé les messages (pour les doubles coches bleues)
      const senderIds = [...new Set(messagesToUpdate.map(m => m.sender.toString()))];
      
      senderIds.forEach(senderId => {
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'read',
          conversationId,
          readByUserId: userId // Info utile : "C'est Untel qui vient de lire"
        });
      });

      // B) Prévenir tout le monde dans la conversation (pour mettre à jour la liste "Vu par" en live)
      io.to(conversationId).emit('conversation-read-update', {
        conversationId,
        userId,
        messageIds
      });
    }

    res.json({ success: true, modifiedCount: result.modifiedCount });

  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getMessageReadBy = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { messageId } = req.params;

    // On récupère le message et on "populate" (remplit) les infos des users dans readBy
    const msg = await Message.findById(messageId)
      .select('conversationId sender readBy createdAt')
      .populate('readBy.user', 'name profilePicture') // IMPORTANT: On veut le nom et la photo
      .lean();

    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }

    // Sécurité : Vérifier qu'on est participant... (ton code actuel le fait déjà, c'est bien)

    // On nettoie la réponse pour le frontend
    const readBy = (msg.readBy || [])
      .filter(r => r.user) // On garde seulement ceux qui ont un user valide
      .map(r => ({
        _id: r.user._id,
        name: r.user.name,
        profilePicture: r.user.profilePicture,
        readAt: r.readAt // La date de lecture
      }))
      // On trie : les plus récents en premier (ou inversement selon ton choix)
      .sort((a, b) => new Date(b.readAt) - new Date(a.readAt));

    return res.json({ success: true, readBy });

  } catch (error) {
    console.error('❌ Erreur getMessageReadBy:', error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à supprimer ce message' 
      });
    }

    const conversationId = message.conversationId.toString();

    // 1️⃣ Supprimer le message
    await Message.findByIdAndDelete(messageId);
    console.log('✅ Message supprimé de la BDD');

    // 2️⃣ Recalculer le lastMessage de la conversation
    await recomputeLastMessage(conversationId);

    // 3️⃣ Récupérer la conversation mise à jour pour l'envoyer au front
    const updatedConversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      });

    const io = req.app.get('io');
    if (io) {
      console.log(`📡 Émission message-deleted pour conversation ${conversationId}`);
      
      // ➜ Pour enlever le message dans la fenêtre de chat
      io.to(conversationId).emit('message-deleted', {
        messageId,
        conversationId
      });

      if (updatedConversation) {
        // ➜ Pour mettre à jour la liste des conversations (sidebar) chez chaque participant
        updatedConversation.participants.forEach(p => {
          const pid = p._id.toString();
          io.to(pid).emit('conversation-updated', updatedConversation);
          io.to(pid).emit('should-refresh-conversations');
        });
      }

      console.log(`✅ Événements de mise à jour émis`);
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
      error: "Erreur serveur"
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

     // 🔔 Demander au client de rafraîchir la liste des conversations
    const io = req.app.get('io');
    if (io) {
      io.to(userId.toString()).emit('should-refresh-conversations');
    }
    
    res.json({ 
      success: true, 
      messageId,
      deletedForMe: true
    });
  } catch (error) {
    console.error('❌ Erreur deleteMessageForMe:', error);
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ========================================
// 🤖 TÂCHE CRON : ENVOYER LES MESSAGES PROGRAMMÉS
// ========================================

// 🔚 Dans messageController.js

const checkScheduledMessages = async (io) => {
  try {
    const now = new Date();

    const messagesToSend = await Message.find({
      isScheduled: true,
      isSent: false,
      scheduledFor: { $lte: now }
    }).populate('conversationId');

    if (!messagesToSend.length) return;

    console.log(`⏰ ${messagesToSend.length} messages programmés à envoyer`);

    for (const sched of messagesToSend) {
      const sendDate = new Date();

      // 1) créer un vrai message "normal"
      const real = await Message.create({
        conversationId: sched.conversationId._id,
        sender: sched.sender,
        content: sched.content || '',
        type: sched.type || 'text',
        fileUrl: sched.fileUrl,
        fileName: sched.fileName,
        fileSize: sched.fileSize,

        status: 'sent',
        deletedFor: [],

        // optionnel: garder trace
        sentAt: sendDate,
        scheduledFor: sched.scheduledFor,
        isScheduled: false,
        isSent: true
      });

      // 2) supprimer l'ancien message programmé (ou le marquer envoyé)
      await Message.findByIdAndDelete(sched._id);

      // 3) update conversation
      await Conversation.findByIdAndUpdate(sched.conversationId._id, {
        lastMessage: real._id,
        updatedAt: sendDate
      });

      // 4) envoyer au front un message propre
      const populatedReal = await Message.findById(real._id)
        .populate('sender', 'name profilePicture')
        .lean();

      if (io) {
        io.to(sched.conversationId._id.toString()).emit('receive-message', populatedReal);

        // sidebar refresh
        sched.conversationId.participants.forEach((p) => {
          io.to(p.toString()).emit('should-refresh-conversations');
        });
      }

      console.log(`✅ Message programmé envoyé (nouveau message): ${real._id}`);
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
      message: 'Erreur serveur'
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
      message: 'Erreur serveur'
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
      message: 'Erreur serveur'
    });
  }
};
