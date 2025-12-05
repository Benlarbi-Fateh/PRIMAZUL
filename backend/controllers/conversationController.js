const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');
const DeletedConversation = require('../models/DeletedConversation');


exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ RÉCUPÉRER LES IDs DES CONVERSATIONS SUPPRIMÉES
    const deletedConvIds = await DeletedConversation.find({ deletedBy: userId })
      .distinct('originalConversationId');

    const conversations = await Conversation.find({
      participants: userId,
      _id: { $nin: deletedConvIds } // ✅ EXCLURE LES CONVERSATIONS SUPPRIMÉES
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

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID manquant' });
    }

    const contactExists = await User.findById(contactId);
    if (!contactExists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // ✅ Récupérer les IDs des conversations supprimées par cet utilisateur
    const deletedConvIds = await DeletedConversation.find({ deletedBy: userId })
      .distinct('originalConversationId');

    // ✅ CHERCHER UNE CONVERSATION ACTIVE (non supprimée)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false,
      _id: { $nin: deletedConvIds } // ✅ Exclure les conversations supprimées
    }).populate('participants', 'name email profilePicture isOnline lastSeen');

    if (conversation) {
      console.log('✅ Conversation active trouvée:', conversation._id);
      return res.json({ success: true, conversation });
    }

    // ✅ VÉRIFIER S'IL EXISTE UNE ANCIENNE CONVERSATION SUPPRIMÉE
    const oldConversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false,
      _id: { $in: deletedConvIds }
    });

    if (oldConversation) {
      console.log('🔄 Restauration conversation supprimée:', oldConversation._id);
      
      // ✅ SUPPRIMER L'ENREGISTREMENT DE SUPPRESSION
      await DeletedConversation.deleteOne({
        originalConversationId: oldConversation._id,
        deletedBy: userId
      });

      await oldConversation.populate('participants', 'name email profilePicture isOnline lastSeen');
      
      console.log('✅ Conversation restaurée:', oldConversation._id);
      return res.json({ success: true, conversation: oldConversation });
    }

    // ✅ CRÉER UNE NOUVELLE CONVERSATION VIERGE
    conversation = new Conversation({
      participants: [userId, contactId],
      isGroup: false
    });
    await conversation.save();
    await conversation.populate('participants', 'name email profilePicture isOnline lastSeen');

    console.log('✅ Nouvelle conversation créée:', conversation._id);
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
