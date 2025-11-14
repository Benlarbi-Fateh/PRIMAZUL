const Invitation = require('../models/Invitation');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// ============================================
// 📤 ENVOYER UNE INVITATION
// ============================================
exports.sendInvitation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, message } = req.body;

    // Vérifier que le destinataire existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier qu'on ne s'envoie pas une invitation à soi-même
    if (senderId.toString() === receiverId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer une invitation' });
    }

    // Vérifier s'il existe déjà une conversation entre les deux utilisateurs
    const existingConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
      isGroup: false
    });

    if (existingConversation) {
      return res.status(400).json({ 
        error: 'Une conversation existe déjà avec cet utilisateur',
        conversation: existingConversation 
      });
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
    
    // Populate les infos de l'expéditeur
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

// ============================================
// ✅ ACCEPTER UNE INVITATION
// ============================================
exports.acceptInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId)
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture');

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation non trouvée' });
    }

    // Vérifier que l'utilisateur est bien le destinataire
    if (invitation.receiver._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier que l'invitation est en attente
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette invitation a déjà été traitée' });
    }

    // Mettre à jour le statut de l'invitation
    invitation.status = 'accepted';
    await invitation.save();

    // Créer la conversation
    const conversation = new Conversation({
      participants: [invitation.sender._id, invitation.receiver._id],
      isGroup: false
    });

    await conversation.save();
    
    // Populate les participants
    await conversation.populate('participants', 'name email profilePicture isOnline lastSeen');

    console.log('✅ Invitation acceptée, conversation créée:', conversation._id);
    res.json({ success: true, invitation, conversation });
  } catch (error) {
    console.error('❌ Erreur acceptInvitation:', error);
    res.status(500).json({ error: error.message });
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

    // Vérifier que l'utilisateur est bien le destinataire
    if (invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier que l'invitation est en attente
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Cette invitation a déjà été traitée' });
    }

    // Mettre à jour le statut
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

    // Vérifier que l'utilisateur est bien l'expéditeur
    if (invitation.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Supprimer l'invitation
    await invitation.deleteOne();

    console.log('🗑️ Invitation annulée:', invitationId);
    res.json({ success: true, message: 'Invitation annulée' });
  } catch (error) {
    console.error('❌ Erreur cancelInvitation:', error);
    res.status(500).json({ error: error.message });
  }
};