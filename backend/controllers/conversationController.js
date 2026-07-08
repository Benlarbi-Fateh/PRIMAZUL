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

    // 4️⃣ RÉCUPÉRER TOUTES LES CONVERSATIONS
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

    // 5️⃣ FILTRER ET CALCULER LES NON-LUS
    const contactSet = new Set(contactIds);
const visibleConversations = [];

for (const conv of allConversations) {
  // 🆕 EXCLURE SI ARCHIVÉE PAR L'UTILISATEUR
  const isArchivedByMe = conv.archivedBy?.some(
    item => item.userId && item.userId.toString() === userId.toString()
  );
  
  if (isArchivedByMe) {
    console.log(`📦 Conversation ${conv._id} archivée - Masquée`);
    continue;
  }
  
  // ✅ Garder les groupes
  if (conv.isGroup) {
    visibleConversations.push(conv);
    continue;
  }
  
  // ✅ Pour les conversations 1-1
  const otherParticipant = conv.participants.find(
    p => p._id.toString() !== userId.toString()
  );
  
  if (!otherParticipant) continue;
  
  const otherUserId = otherParticipant._id.toString();
  
  // ❌ Exclure si bloqué
  if (blockedUserIds.has(otherUserId)) {
    console.log(`🚫 Conversation ${conv._id} masquée - Bloqué`);
    continue;
  }
  
  // ❌ Exclure si pas contact
  if (!contactSet.has(otherUserId)) {
    console.log(`⚠️ Conversation ${conv._id} exclue - Pas contact`);
    continue;
  }
  
  visibleConversations.push(conv);
}

    console.log(`✅ ${visibleConversations.length} conversations visibles`);

// 6️⃣ CALCULER LES NON-LUS + DERNIER MESSAGE VISIBLE POUR L'UTILISATEUR
const conversationsWithUnread = await Promise.all(
  visibleConversations.map(async (conv) => {
    const wasDeletedByMe = conv.deletedBy?.find(
      item => item.userId && item.userId.toString() === userId.toString()
    );

    // ---- 1) Unread count (en tenant compte de "vider la discussion" + "supprimer pour moi") ----
    const unreadFilter = {
      conversationId: conv._id,
      sender: { $ne: userId },
      status: { $ne: 'read' },
      deletedFor: { $nin: [userId] }, // ✅ messages PAS "supprimés pour moi"
    };

    if (wasDeletedByMe) {
      unreadFilter.createdAt = { $gt: wasDeletedByMe.deletedAt };
    }

    const unreadCount = await Message.countDocuments(unreadFilter);

    let conversationObj = conv.toObject();

    // ---- 2) Dernier message VISIBLE pour CET utilisateur ----
    const lastMsgFilter = {
      conversationId: conv._id,
      deletedFor: { $nin: [userId] }, // ✅ pas "supprimé pour moi"
    };

    if (wasDeletedByMe) {
      lastMsgFilter.createdAt = { $gt: wasDeletedByMe.deletedAt };
    }

    // Ne pas prendre les messages programmés non envoyés
    lastMsgFilter.$or = [
      { isSent: { $exists: false } }, // messages normaux
      { isSent: true },               // programmés déjà envoyés
    ];

    // 2.1) Essayer d'abord avec les filtres par utilisateur
    let lastVisibleMessage = await Message.findOne(lastMsgFilter)
      .sort({ createdAt: -1 })
      .populate('sender', 'name profilePicture')
      .lean();

    // 2.2) FALLBACK : si aucun message visible pour cet utilisateur,
    //      on récupère le dernier message GLOBAL de la conversation,
    //      pour éviter d'afficher "Démarrer la conversation" alors que
    //      la conversation n'est pas vraiment vide en BDD.
    if (!lastVisibleMessage) {
      const globalLastMsgFilter = {
        conversationId: conv._id,
        $or: [
          { isSent: { $exists: false } }, // messages normaux
          { isSent: true },               // programmés déjà envoyés
        ],
      };

      lastVisibleMessage = await Message.findOne(globalLastMsgFilter)
        .sort({ createdAt: -1 })
        .populate('sender', 'name profilePicture')
        .lean();
    }

    // 👉 Ce lastMessage sera utilisé par le front pour le preview dans la sidebar
    conversationObj.lastMessage = lastVisibleMessage || null;

    return {
      ...conversationObj,
      unreadCount
    };
  })
);

    console.log(`✅ ${conversationsWithUnread.length} conversations retournées`);

    res.json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('❌ Erreur getConversations:', error);
    res.status(500).json({ error: "Erreur serveur" });
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

    // ✅ CHERCHER UNE CONVERSATION EXISTANTE
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false
    }).populate('participants', 'name email profilePicture isOnline lastSeen');

    // 🔥 CORRECTION : AJOUTER CETTE LIGNE
    let restored = false;
    
    if (conversation) {
      console.log('✅ Conversation trouvée:', conversation._id);
      
      // Vérifier si supprimée par cet utilisateur
      const wasDeletedByMe = conversation.deletedBy?.some(
        item => item.userId && item.userId.toString() === userId.toString()
      );
      
      if (wasDeletedByMe) {
        // Restaurer la conversation
        conversation.deletedBy = conversation.deletedBy.filter(
          item => !item.userId || item.userId.toString() !== userId.toString()
        );
        await conversation.save();
        restored = true;
        console.log('🔄 Conversation restaurée pour l\'utilisateur');
      }
      
      return res.json({ 
        success: true, 
        conversation,
        restored // ✅ CORRECT
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
      isNew: true
    });
  } catch (error) {
    console.error('❌ Erreur getOrCreateConversation:', error);
    res.status(500).json({ error: "Erreur serveur" });
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
    res.status(500).json({ error: "Erreur serveur" });
  }
};