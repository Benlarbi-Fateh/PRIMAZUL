const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');


exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;


    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate('groupAdmin', 'name email profilePicture') // 🆕 AJOUTÉ
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ updatedAt: -1 });


    // 🆕 CALCULER LE NOMBRE DE MESSAGES NON LUS POUR CHAQUE CONVERSATION
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          status: { $ne: 'read' }
        });


        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );


    res.json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('❌ Erreur getConversations:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.body;


    // 🔧 CORRECTION : Vérifier que contactId existe
    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID manquant' });
    }


    // Vérifier que le contact existe
    const contactExists = await User.findById(contactId);
    if (!contactExists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }


    // 🆕 VÉRIFIER QUE CE N'EST PAS UN GROUPE (chercher conversations 1-1 uniquement)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false // 🆕 AJOUTÉ
    }).populate('participants', 'name email profilePicture isOnline lastSeen');


    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, contactId],
        isGroup: false // 🆕 AJOUTÉ
      });
      await conversation.save();
     
      // 🔧 CORRECTION : Populate APRÈS save
      await conversation.populate('participants', 'name email profilePicture isOnline lastSeen');
    }


    // 🔧 CORRECTION : S'assurer que tous les participants sont chargés
    if (!conversation.participants || conversation.participants.length === 0) {
      await conversation.populate('participants', 'name email profilePicture isOnline lastSeen');
    }


    console.log('✅ Conversation créée/récupérée:', conversation._id);
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('❌ Erreur getOrCreateConversation:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;


    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate('groupAdmin', 'name email profilePicture') // 🆕 AJOUTÉ
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      });


    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }


    // Vérifier que l'utilisateur fait partie de la conversation
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId.toString()
    );


    if (!isParticipant) {
      return res.status(403).json({ error: 'Accès refusé' });
    }


    console.log('✅ Conversation récupérée:', conversation._id);
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('❌ Erreur getConversationById:', error);
    res.status(500).json({ error: error.message });
  }
};
//  FONCTIONS POUR LE THÈME
exports.getConversationTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
   
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }


    // Vérifier que l'utilisateur fait partie de la conversation
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId.toString()
    );


    if (!isParticipant) {
      return res.status(403).json({ error: 'Accès refusé' });
    }


    res.json({
      success: true,
      theme: conversation.theme
    });
  } catch (error) {
    console.error('❌ Erreur getConversationTheme:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.updateConversationTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { theme } = req.body;


    const conversation = await Conversation.findById(id);
   
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }


    // Vérifier que l'utilisateur fait partie de la conversation
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === userId.toString()
    );


    if (!isParticipant) {
      return res.status(403).json({ error: 'Accès refusé' });
    }


    // Mettre à jour le thème
    conversation.theme = theme;
    await conversation.save();


    res.json({
      success: true,
      message: 'Thème mis à jour',
      theme: conversation.theme
    });
  } catch (error) {
    console.error('❌ Erreur updateConversationTheme:', error);
    res.status(500).json({ error: error.message });
  }
};
