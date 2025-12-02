const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type, fileUrl, fileName, fileSize, replyTo, replyToContent, replyToSender } = req.body;
    const senderId = req.user._id;

    const message = new Message({
      conversationId,
      sender: senderId,
      content: content || '',
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      status: 'sent',
      // 🆕 Réponse à un message - AJOUTÉ
      replyTo: replyTo || null,
      replyToContent: replyToContent || null,
      replyToSender: replyToSender || null
    });
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
    // 🆕 Populate aussi les infos du message cité
    if (message.replyToSender) {
      await message.populate('replyToSender', 'name profilePicture');
    }

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive-message', message);
      
      conversation.participants.forEach(participant => {
        const participantId = participant._id.toString();
        io.to(participantId).emit('conversation-updated', conversation);
        io.to(participantId).emit('should-refresh-conversations');
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('❌ Erreur sendMessage:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

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
    const userId = req.user._id;

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

    // Vérifier si l'utilisateur est réellement dans la conversation
    const io = req.app.get('io');
    const sockets = await io.in(conversationId).fetchSockets();
    const userIsInConversation = sockets.some(s => s.userId === userId.toString());

    if (!userIsInConversation) {
      console.log('⚠️ User pas dans la conversation, on ne marque PAS comme lu');
      return res.json({ success: true, modifiedCount: 0 });
    }

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds }
      },
      {
        $set: { status: 'read' }
      }
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

      // 🆕 ÉVÉNEMENT CRITIQUE : Notifier immédiatement TOUS les participants
      // que cette conversation a été lue par userId
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
    const userId = req.user._id;

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
// 🆕 SUPPRIMER UN MESSAGE
// ========================================
exports.deleteMessage = async (req, res) => {
  console.log('🔍 ========== DELETE MESSAGE APPELÉ ==========');
  console.log('📋 Params:', req.params);
  console.log('👤 User ID:', req.user?._id);
  
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    console.log('🗑️ Suppression du message:', messageId, 'par user:', userId);

    // Vérifier que l'utilisateur est bien l'expéditeur
    const message = await Message.findById(messageId);
    
    if (!message) {
      console.log('❌ Message non trouvé:', messageId);
      return res.status(404).json({ error: 'Message non trouvé' });
    }

    console.log('📨 Message trouvé, sender:', message.sender.toString());

    if (message.sender.toString() !== userId.toString()) {
      console.log('❌ Non autorisé - sender:', message.sender.toString(), 'user:', userId.toString());
      return res.status(403).json({ error: 'Non autorisé à supprimer ce message' });
    }

    const conversationId = message.conversationId.toString();

    // Supprimer le message
    await Message.findByIdAndDelete(messageId);
    console.log('✅ Message supprimé de la BDD');

    // 🔥 Émettre un événement Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('message-deleted', {
        messageId,
        conversationId
      });
      console.log(`✅ Événement message-deleted émis pour conversation ${conversationId}`);
    }

    console.log('✅ Message supprimé avec succès');
    res.json({ success: true, messageId });
  } catch (error) {
    console.error('❌ Erreur deleteMessage:', error);
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

    // Vérifier que l'utilisateur est bien l'expéditeur
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

    // Modifier le message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    console.log('✅ Message modifié dans la BDD');

    await message.populate('sender', 'name profilePicture');

    // 🔥 Émettre un événement Socket.IO
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
// 🆕 FONCTION DE TRADUCTION VIA DEEPL
// ========================================
const axios = require('axios');

// ========================================
// 🆕 TRADUIRE UN MESSAGE AVEC DEEPL
// ========================================
// ========================================
// 🆕 TRADUIRE UN MESSAGE AVEC DEEPL
// ========================================
exports.translateMessage = async (req, res) => {
  console.log('🔍 ========== TRANSLATE MESSAGE APPELÉ ==========');
  console.log('📋 Params:', req.params);
  console.log('📦 Body:', req.body);
  console.log('👤 User ID:', req.user?._id); // ✅ CORRECTION ICI
  
  try {
    const { messageId } = req.params;
    const { targetLang } = req.body;

    console.log('🌍 Message ID:', messageId);
    console.log('🌍 Target Lang:', targetLang);

    // Validation
    if (!targetLang || typeof targetLang !== 'string') {
      console.log('❌ targetLang manquant ou invalide');
      return res.status(400).json({ error: 'targetLang requis' });
    }

    // Récupérer le message
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

    // 🌍 TRADUCTION AVEC DEEPL
    const apiKey = process.env.DEEPL_API_KEY;
    
    if (!apiKey) {
      console.error('❌ DEEPL_API_KEY manquante dans .env');
      return res.status(500).json({ error: 'API DeepL non configurée' });
    }

    // Mapping des codes de langue (DeepL utilise des codes spécifiques)
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
      'ar': 'AR' // ✅ Arabe ajouté
    };

    const deeplLang = langMap[targetLang.toLowerCase()] || targetLang.toUpperCase();
    console.log('🌍 Code DeepL utilisé:', deeplLang);

    // Appel à l'API DeepL
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

    // Retourner la traduction SANS modifier le message en base
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
    
    // Gestion des erreurs DeepL spécifiques
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


//ghiles


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

    // Validation
    if (!scheduledFor) {
      return res.status(400).json({ error: 'Date de programmation requise' });
    }

    const scheduledDate = new Date(scheduledFor);
    const now = new Date();

    if (scheduledDate <= now) {
      return res.status(400).json({ error: 'La date doit être dans le futur' });
    }

    // Créer le message programmé
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
      isSent: false, // Pas encore envoyé
      status: 'scheduled'
    });

    await message.save();
    await message.populate('sender', 'name profilePicture');

    console.log('✅ Message programmé créé:', message._id);

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
    
    // Trouver tous les messages programmés dont l'heure est passée
    const messagesToSend = await Message.find({
      isScheduled: true,
      isSent: false,
      scheduledFor: { $lte: now }
    })
    .populate('sender', 'name profilePicture')
    .populate('conversationId');

    if (messagesToSend.length === 0) return;

    console.log(`⏰ ${messagesToSend.length} messages programmés à envoyer`);

    for (const message of messagesToSend) {
      // Marquer comme envoyé
      message.isSent = true;
      message.status = 'sent';
      await message.save();

      // Mettre à jour la conversation
      await Conversation.findByIdAndUpdate(
        message.conversationId._id,
        {
          lastMessage: message._id,
          updatedAt: Date.now()
        }
      );

      // Émettre via Socket.IO
      if (io) {
        io.to(message.conversationId._id.toString()).emit('receive-message', message);
        
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

// Exporter la fonction pour l'utiliser dans server.js
module.exports.checkScheduledMessages = checkScheduledMessages;

