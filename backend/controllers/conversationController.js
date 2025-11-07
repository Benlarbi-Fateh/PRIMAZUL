const Conversation = require('../models/Conversation');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
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

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId] }
    }).populate('participants', 'name email profilePicture isOnline lastSeen');

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, contactId]
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

// 🆕 NOUVELLE FONCTION AJOUTÉE
exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email profilePicture isOnline lastSeen')
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