const Invitation = require('../models/Invitation');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Contact = require('../models/Contact');

// ============================================
// 📤 ENVOYER UNE INVITATION
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

    // ✅ VÉRIFIER si une conversation ACTIVE existe - LOGIQUE SIMPLIFIÉE
    const existingConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
      isGroup: false
    });

    // ✅ NOUVELLE LOGIQUE : Autoriser l'invitation si les deux ont supprimé la conversation
    let canSendInvitation = true;
    
    if (existingConversation) {
      console.log('🔍 Conversation existante trouvée:', existingConversation._id);
      
      // Vérifier si elle est supprimée par les DEUX utilisateurs
      const deletedBy = existingConversation.deletedBy || [];
      
      const deletedBySender = deletedBy.some(
        item => item.userId && item.userId.toString() === senderId.toString()
      );
      
      const deletedByReceiver = deletedBy.some(
        item => item.userId && item.userId.toString() === receiverId.toString()
      );

      console.log('📊 État suppression:', { 
        deletedBySender, 
        deletedByReceiver 
      });

      // ✅ Vérifier si les contacts existent encore
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

      // ✅ RÈGLE CORRIGÉE : Si un des deux a encore le contact, on ne peut pas envoyer d'invitation
      if (senderHasContact || receiverHasContact) {
        console.log('⚠️ Un des utilisateurs a encore le contact - invitation interdite');
        return res.status(400).json({ 
          error: 'Vous avez déjà ce contact dans votre liste',
          conversation: existingConversation 
        });
      }

      // ✅ Si aucun des deux n'a le contact MAIS la conversation n'est pas supprimée par les deux
      if (!deletedBySender || !deletedByReceiver) {
        console.log('⚠️ Conversation non supprimée par les deux - invitation interdite');
        return res.status(400).json({ 
          error: 'Une conversation existe déjà avec cet utilisateur',
          conversation: existingConversation 
        });
      }

      // ✅ Si les deux ont supprimé la conversation ET aucun n'a le contact → invitation AUTORISÉE
      console.log('✅ Conversation supprimée par les deux - invitation autorisée');
    }

    // Vérifier s'il existe déjà une invitation en attente
    const existingInvitation = await Invitation.findOne({
      $or: [
        { sender: senderId, receiver: receiverId, status: 'pending' },
        { sender: receiverId, receiver: senderId, status: 'pending' }
      ]
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Une invitation est déjà en attente' });
    }

    // Créer la nouvelle invitation
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
exports.getSentInvitations = async (req, res) => {  // CHANGEZ LE NOM ICI
  try {
    const userId = req.user._id;

    const invitations = await Invitation.find({
      sender: userId,  // CHANGEMENT ICI : sender au lieu de receiver
      status: 'pending'
    })
      .populate('receiver', 'name email profilePicture isOnline')  // CHANGEMENT ICI : receiver au lieu de sender
      .sort({ createdAt: -1 });

    console.log(`✅ Invitations envoyées par ${userId}:`, invitations.length);
    res.json({ success: true, invitations });
  } catch (error) {
    console.error('❌ Erreur getSentInvitations:', error);
    res.status(500).json({ error: error.message });
  }
};
// ============================================
// ✅ ACCEPTER UNE INVITATION
// ============================================
exports.acceptInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { invitationId } = req.params;

    console.log('✅ Acceptation invitation:', { userId, invitationId });

    // ✅ CORRECTION : Récupérer d'abord l'invitation SANS populate
    const invitation = await Invitation.findById(invitationId);

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
    if (invitation.receiver.toString() !== userId.toString()) {
      console.log('❌ Non autorisé');
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // ✅ CORRECTION : Populate APRÈS les vérifications
    await invitation.populate('sender', 'name email profilePicture');
    await invitation.populate('receiver', 'name email profilePicture');

    // ... le reste du code reste le même ...
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