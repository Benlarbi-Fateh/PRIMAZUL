const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');
const DeletedConversation = require('../models/DeletedConversation'); 


exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id || req.user._id;

    // 🆕 VÉRIFIER à quelle date l'utilisateur a supprimé la conversation
    const deletedRecord = await DeletedConversation.findOne({
      originalConversationId: conversationId,
      deletedBy: userId
    });

    let messages;

    if (deletedRecord) {
      // ✅ Afficher UNIQUEMENT les messages APRÈS la suppression
      console.log(`📅 Conversation supprimée le ${deletedRecord.deletedAt}, filtrage des messages`);
      
      messages = await Message.find({ 
        conversationId,
        createdAt: { $gt: deletedRecord.deletedAt } // Messages après la suppression
      })
        .populate('sender', 'name profilePicture')
        .sort({ createdAt: 1 });
    } else {
      // ✅ Afficher TOUS les messages
      messages = await Message.find({ conversationId })
        .populate('sender', 'name profilePicture')
        .sort({ createdAt: 1 });
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.error('❌ Erreur getMessages:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type, fileUrl, fileName, fileSize } = req.body;
   const senderId = req.user.id || req.user._id;

        const convCheck = await Conversation.findById(conversationId)
      .populate('participants', '_id')
      .lean();


    if (!convCheck) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }


    // verification de blockage avant envoi
    // verification de blockage avant envoi
if (!convCheck.isGroup) {
  const otherParticipant = convCheck.participants.find(
    p => p._id.toString() !== senderId.toString()
  );

  if (otherParticipant) {
    const blockExists = await BlockedUser.findOne({
      $or: [
        { userId: senderId, blockedUserId: otherParticipant._id },
        { userId: otherParticipant._id, blockedUserId: senderId }
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

  // 🆕 VÉRIFIER SI LA CONVERSATION A ÉTÉ SUPPRIMÉE (EN DEHORS DU IF)
  // ✅ CORRECTION : Vérifier dans DeletedConversation
// 🆕 VÉRIFIER SI LA CONVERSATION A ÉTÉ SUPPRIMÉE PAR L'EXPÉDITEUR
      const isDeleted = await DeletedConversation.findOne({
        originalConversationId: conversationId,
        deletedBy: senderId
      });

      if (isDeleted) {
        console.log('🔄 Conversation supprimée détectée - Restauration silencieuse pour l\'expéditeur');
        
        // ✅ SIMPLEMENT SUPPRIMER L'ENREGISTREMENT DE SUPPRESSION
        // La conversation reste la même, mais redevient visible pour l'expéditeur
        await DeletedConversation.deleteOne({
          originalConversationId: conversationId,
          deletedBy: senderId
        });
        
        console.log('✅ Conversation restaurée pour l\'expéditeur, envoi du message dans la conversation existante');
        // Le code continue normalement ci-dessous pour créer le message dans la conversation EXISTANTE
      }
}


    const message = new Message({
      conversationId,
      sender: senderId,
      content: content || '',
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      status: 'sent'
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


    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive-message', message);
     
      conversation.participants.forEach(participant => {
        const participantId = participant._id.toString();
        io.to(participantId).emit('conversation-updated', conversation);
        io.to(participantId).emit('should-refresh-conversations');
      });
    }


    res.status(201).json({ success: true, message,conversationId: conversationId });
    
  } catch (error) {
    console.error('❌ Erreur sendMessage:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.markAsDelivered = async (req, res) => {
  try {
    const { messageIds } = req.body;
   const userId = req.user.id || req.user._id; // ✅ CORRECTION


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
    const userId = req.user.id || req.user._id; // ✅ CORRECTION

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
    const userId = req.user.id || req.user._id; // ✅ CORRECTION

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


