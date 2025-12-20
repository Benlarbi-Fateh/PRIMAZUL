const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const BlockedUser = require('../models/BlockedUser'); 


exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ RÉCUPÉRER TOUS MES CONTACTS
    const myContacts = await Contact.find({ owner: userId }).select('contact').lean();
    const contactIds = myContacts.map(c => c.contact.toString());

    console.log(`📇 ${contactIds.length} contacts trouvés pour ${userId}`);

    // 2️⃣ RÉCUPÉRER LES UTILISATEURS BLOQUÉS
    const blockedUsers = await BlockedUser.find({
      $or: [
        { blocker: userId },
        { blocked: userId }
      ]
    }).lean();

    const blockedUserIds = new Set();
    blockedUsers.forEach(block => {
      if (block.blocker.toString() === userId.toString()) {
        blockedUserIds.add(block.blocked.toString());
      } else {
        blockedUserIds.add(block.blocker.toString());
      }
    });

    console.log(`🚫 ${blockedUserIds.size} utilisateurs bloqués`);

    // 3️⃣ CRÉER UNE DISCUSSION VIDE POUR CHAQUE CONTACT (si elle n'existe pas)
    for (const contactId of contactIds) {
      if (blockedUserIds.has(contactId)) {
        console.log(`🚫 Contact ${contactId} ignoré - Bloqué`);
        continue;
      }

      let conversation = await Conversation.findOne({
        participants: { $all: [userId, contactId], $size: 2 },
        isGroup: false
      });

      if (!conversation) {
        console.log(`🆕 Création conversation vide pour contact ${contactId}`);
        conversation = new Conversation({
          participants: [userId, contactId],
          isGroup: false,
          deletedBy: []
        });
        await conversation.save();
      }
    }

    // 4️⃣ RÉCUPÉRER TOUTES LES CONVERSATIONS (MÊME CELLES SUPPRIMÉES)
    // 🔥 CHANGEMENT CRITIQUE : Ne plus filtrer par deletedBy ici
    const allConversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate('groupAdmin', 'name email profilePicture')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ updatedAt: -1 });

    // 5️⃣ FILTRER ET RESTAURER AUTOMATIQUEMENT
    // 5️⃣ FILTRER SANS RESTAURATION AUTOMATIQUE
const contactSet = new Set(contactIds);
const visibleConversations = [];

for (const conv of allConversations) {
  // Garder TOUJOURS les groupes
  if (conv.isGroup) {
    visibleConversations.push(conv);
    continue;
  }
  
  // Pour les conversations 1-1
  const otherParticipant = conv.participants.find(
    p => p._id.toString() !== userId.toString()
  );
  
  if (!otherParticipant) continue;
  
  const otherUserId = otherParticipant._id.toString();
  
  // Exclure si bloqué
  if (blockedUserIds.has(otherUserId)) {
    console.log(`🚫 Conversation ${conv._id} masquée - Utilisateur bloqué`);
    continue;
  }
  
  // Exclure si pas contact
  const isContact = contactSet.has(otherUserId);
  if (!isContact) {
    console.log(`⚠️ Conversation ${conv._id} exclue - Pas un contact actuel`);
    continue;
  }
  
  // 🔥 CORRECTION : NE PLUS RESTAURER AUTOMATIQUEMENT
  // La conversation reste visible même si supprimée
  // Les messages seront filtrés dans getMessages
  
  visibleConversations.push(conv);
}

console.log(`✅ ${visibleConversations.length} conversations visibles trouvées`);

    // 6️⃣ CALCULER LES MESSAGES NON LUS
    const conversationsWithUnread = await Promise.all(
      visibleConversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: userId },
          status: { $ne: 'read' },
          deletedBy: { $ne: userId }
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
// ========================================
// ✅ REMPLACEZ LA FONCTION getOrCreateConversation PAR CELLE-CI
// ========================================
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
     // 🔥 NOUVEAU : VÉRIFIER SI BLOQUÉ
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { blocker: userId, blocked: contactId },
        { blocker: contactId, blocked: userId }
      ]
    });

    if (isBlocked) {
      return res.status(403).json({ 
        error: 'Impossible de créer une conversation avec cet utilisateur'
      });
    }

    // ✅ VÉRIFIER SI C'EST UN CONTACT ACTUEL
    const isContact = await Contact.findOne({
      owner: userId,
      contact: contactId
    });

    if (!isContact) {
      console.log('⚠️ Tentative de créer conversation avec non-contact');
      return res.status(403).json({ 
        error: 'Vous devez d\'abord ajouter cette personne en contact'
      });
    }

    // ✅ CHERCHER UNE CONVERSATION EXISTANTE (MÊME SI SOFT-DELETED)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false
    }).populate('participants', 'name email profilePicture isOnline lastSeen');

    if (conversation) {
      console.log('✅ Conversation trouvée:', conversation._id);
      
      // 🔥 NOUVEAU : RESTAURER AUTOMATIQUEMENT SI SOFT-DELETED
      const wasDeletedByMe = conversation.deletedBy?.some(
        item => item.userId?.toString() === userId.toString()
      );
      
      if (wasDeletedByMe) {
        console.log('🔄 Conversation soft-deleted détectée, restauration...');
        conversation.deletedBy = conversation.deletedBy.filter(
          item => item.userId?.toString() !== userId.toString()
        );
        await conversation.save();
        console.log('✅ Conversation restaurée automatiquement pour:', userId);
      }
      
      return res.json({ 
        success: true, 
        conversation,
        restored: wasDeletedByMe // 🔥 NOUVEAU : Indiquer si restaurée
      });
    }

    // ✅ CRÉER UNE NOUVELLE CONVERSATION VIERGE
    console.log('🆕 Création d\'une nouvelle conversation vierge...');
    conversation = new Conversation({
      participants: [userId, contactId],
      isGroup: false,
      deletedBy: []
    });
    await conversation.save();
    await conversation.populate('participants', 'name email profilePicture isOnline lastSeen');

    console.log('✅ Nouvelle conversation vierge créée:', conversation._id);
    res.json({ 
      success: true, 
      conversation,
      isNew: true // 🔥 NOUVEAU : Indiquer que c'est nouveau
    });
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
      .populate('groupAdmin', 'name email profilePicture')
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

    // 🔥 NOUVEAU : VÉRIFIER SI L'AUTRE PARTICIPANT EST BLOQUÉ
    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      if (otherParticipant) {
        const isBlocked = await BlockedUser.findOne({
          $or: [
            { blocker: userId, blocked: otherParticipant._id },
            { blocker: otherParticipant._id, blocked: userId }
          ]
        });

        if (isBlocked) {
          return res.status(403).json({ 
            error: 'Conversation inaccessible - Utilisateur bloqué',
            blocked: true
          });
        }
      }
    }

    console.log('✅ Conversation récupérée:', conversation._id);
    res.json({ success: true, conversation });
  } catch (error) {
    console.error('❌ Erreur getConversationById:', error);
    res.status(500).json({ error: error.message });
  }
};