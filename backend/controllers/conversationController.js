const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');
const Contact = require('../models/Contact');


exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ RÉCUPÉRER TOUS MES CONTACTS D'UN COUP
    const myContacts = await Contact.find({ owner: userId }).select('contact').lean();
    const contactIds = myContacts.map(c => c.contact.toString());

    console.log(`📇 ${contactIds.length} contacts trouvés pour ${userId}`);

    // ✅ RÉCUPÉRER les conversations où deletedBy NE contient PAS mon userId
    const conversations = await Conversation.find({
      participants: userId,
      'deletedBy.userId': { $ne: userId }
    })
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate('groupAdmin', 'name email profilePicture')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    // ✅ FILTRER rapidement avec un Set
    const contactSet = new Set(contactIds);
    
    const filteredConversations = conversations.filter(conv => {
      // Si c'est un groupe, on garde
      if (conv.isGroup) {
        return true;
      }
      
      // Si c'est une conversation 1-1, vérifier si on est contacts
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );
      
      if (otherParticipant) {
        const isContact = contactSet.has(otherParticipant._id.toString());
        
        if (!isContact) {
          console.log(`⚠️ Conversation ${conv._id} ignorée - Pas un contact`);
        }
        
        return isContact;
      }
      
      return false;
    });

    // Calculer les messages non lus
    const conversationsWithUnread = await Promise.all(
      filteredConversations.map(async (conv) => {
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

    console.log(`✅ ${conversationsWithUnread.length} conversations actives trouvées`);

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

    // ✅ CHERCHER UNE CONVERSATION EXISTANTE (même si supprimée par l'un des deux)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false
    }).populate('participants', 'name email profilePicture isOnline lastSeen');

    if (conversation) {
      console.log('✅ Conversation trouvée:', conversation._id);
      
      // ✅ SI l'utilisateur actuel l'avait supprimée, on la restaure pour lui
      if (conversation.deletedBy && conversation.deletedBy.includes(userId)) {
        conversation.deletedBy = conversation.deletedBy.filter(
          id => id.toString() !== userId.toString()
        );
        await conversation.save();
        console.log('🔄 Conversation restaurée pour:', userId);
      }
      
      return res.json({ success: true, conversation });
    }

    // ✅ CRÉER UNE NOUVELLE CONVERSATION
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




