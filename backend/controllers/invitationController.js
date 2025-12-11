const Invitation = require('../models/Invitation');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Contact = require('../models/Contact');

// ============================================
// 📤 ENVOYER UNE INVITATION - LOGIQUE CORRIGÉE
// ============================================
exports.sendInvitation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, message } = req.body;

    console.log('📤 Envoi invitation:', { senderId, receiverId });

    // Vérifier que le destinataire existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier qu'on ne s'envoie pas une invitation à soi-même
    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer une invitation' });
    }

  // ✅ NOUVELLE LOGIQUE : Vérifier UNIQUEMENT si un contact existe
    const senderHasContact = await Contact.findOne({
      owner: senderId,
      contact: receiverId
    });

    const receiverHasContact = await Contact.findOne({
      owner: receiverId,
      contact: senderId
    });

    console.log('📇 État contacts:', { 
      senderHasContact: !!senderHasContact, 
      receiverHasContact: !!receiverHasContact 
    });

    // ✅ SI UN DES DEUX A LE CONTACT → INTERDIRE l'invitation
    if (senderHasContact || receiverHasContact) {
      console.log('⚠️ Contact existe déjà - invitation interdite');
      return res.status(400).json({ 
        error: 'Vous avez déjà ce contact dans votre liste. Cherchez-le dans vos conversations.'
      });
    }

    // ✅ VÉRIFIER S'IL EXISTE DÉJÀ UNE INVITATION EN ATTENTE
    const existingInvitation = await Invitation.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Une invitation est déjà en attente' });
    }

    // ✅ CRÉER LA NOUVELLE INVITATION
    const invitation = new Invitation({
      sender: senderId,
      receiver: receiverId,
      message: message || `${req.user.name} souhaite commencer une conversation avec vous`
    });

    await invitation.save();
    
    // Populate les infos
    await invitation.populate('sender', 'name email profilePicture');
    await invitation.populate('receiver', 'name email profilePicture');

    console.log('✅ Invitation envoyée:', invitation._id);
    res.json({ success: true, invitation });
  } catch (error) {
    console.error('❌ Erreur sendInvitation:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ✅ ACCEPTER UNE INVITATION - LOGIQUE CORRIGÉE
// ============================================
exports.acceptInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { invitationId } = req.params;

    console.log('✅ Acceptation invitation:', { userId, invitationId });

    // ✅ Récupérer l'invitation AVEC populate
    const invitation = await Invitation.findById(invitationId)
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture');

    if (!invitation) {
      console.log('❌ Invitation non trouvée');
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    // Vérifier le statut AVANT toute opération
    if (invitation.status !== 'pending') {
      console.log('❌ Invitation déjà traitée (statut:', invitation.status, ')');
      return res.status(409).json({ 
        error: 'Invitation déjà traitée',
        currentStatus: invitation.status
      });
    }

    // Vérifier les permissions
    if (invitation.receiver._id.toString() !== userId.toString()) {
      console.log('❌ Non autorisé');
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const senderId = invitation.sender._id;
    const receiverId = invitation.receiver._id;

    // ✅ CHERCHER OU CRÉER LA CONVERSATION
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
      isGroup: false
    });

    if (conversation) {
      console.log('🔄 Conversation existante trouvée:', conversation._id);
      
      // ✅ SI SUPPRIMÉE, ON RESTAURE
      if (conversation.deletedBy && conversation.deletedBy.length > 0) {
        conversation.deletedBy = conversation.deletedBy.filter(
          item => {
            const itemUserId = item.userId?.toString();
            return itemUserId !== senderId.toString() && itemUserId !== receiverId.toString();
          }
        );
        
        await conversation.save();
        console.log('✅ Conversation restaurée');
      }
    } else {
      // ✅ CRÉER UNE NOUVELLE CONVERSATION
      conversation = new Conversation({
        participants: [senderId, receiverId],
        isGroup: false,
        deletedBy: []
      });
      await conversation.save();
      console.log('✅ Nouvelle conversation créée:', conversation._id);
    }

    // ✅ CRÉER OU METTRE À JOUR LES CONTACTS (SANS VÉRIFICATION PRÉALABLE)
    // Contact 1 : sender -> receiver
    await Contact.findOneAndUpdate(
      { owner: senderId, contact: receiverId },
      { 
        conversation: conversation._id,
        isFavorite: false,
        isBlocked: false
      },
      { upsert: true, new: true }
    );
    console.log('✅ Contact créé/mis à jour: sender -> receiver');

    // Contact 2 : receiver -> sender
    await Contact.findOneAndUpdate(
      { owner: receiverId, contact: senderId },
      { 
        conversation: conversation._id,
        isFavorite: false,
        isBlocked: false
      },
      { upsert: true, new: true }
    );
    console.log('✅ Contact créé/mis à jour: receiver -> sender');

    // ✅ MARQUER L'INVITATION COMME ACCEPTÉE
    invitation.status = 'accepted';
    await invitation.save();

    // Populate la conversation pour la réponse
    await conversation.populate('participants', 'name email profilePicture isOnline lastSeen');

    console.log('✅ Invitation acceptée avec succès');

    res.json({
      success: true,
      invitation,
      conversation
    });
  } catch (error) {
    console.error('❌ Erreur acceptInvitation:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
};

// ============================================
// ❌ REFUSER UNE INVITATION
// ============================================
exports.rejectInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    if (invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette invitation a déjà été traitée' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    console.log('❌ Invitation refusée:', invitation._id);
    res.json({ success: true, invitation });
  } catch (error) {
    console.error('❌ Erreur rejectInvitation:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// 🗑️ ANNULER UNE INVITATION ENVOYÉE
// ============================================
exports.cancelInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    if (invitation.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    await invitation.deleteOne();

    console.log('🗑️ Invitation annulée:', invitationId);
    res.json({ success: true, message: 'Invitation annulée' });
  } catch (error) {
    console.error('❌ Erreur cancelInvitation:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// 📥 RÉCUPÉRER LES INVITATIONS REÇUES
// ============================================
exports.getReceivedInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    const invitations = await Invitation.find({
      receiver: userId,
      status: 'pending'
    })
      .populate('sender', 'name email profilePicture isOnline')
      .sort({ createdAt: -1 });

    console.log(`✅ Invitations reçues pour ${userId}:`, invitations.length);
    res.json({ success: true, invitations });
  } catch (error) {
    console.error('❌ Erreur getReceivedInvitations:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// 📤 RÉCUPÉRER LES INVITATIONS ENVOYÉES
// ============================================
exports.getSentInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    const invitations = await Invitation.find({
      sender: userId,
      status: 'pending'
    })
      .populate('receiver', 'name email profilePicture isOnline')
      .sort({ createdAt: -1 });

    console.log(`✅ Invitations envoyées par ${userId}:`, invitations.length);
    res.json({ success: true, invitations });
  } catch (error) {
    console.error('❌ Erreur getSentInvitations:', error);
    res.status(500).json({ error: error.message });
  }
};