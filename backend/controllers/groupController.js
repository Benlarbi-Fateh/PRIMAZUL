const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Message = require('../models/Message');


// Créer un groupe
exports.createGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupName, participantIds } = req.body;


    // Validation
    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ error: 'Le nom du groupe est requis' });
    }


    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'Au moins un participant est requis' });
    }





    // 🆕 VÉRIFICATION : Minimum 3 personnes (créateur + 2 autres participants)
    const allParticipants = [...new Set([userId.toString(), ...participantIds])];
    
    if (allParticipants.length < 3) {
      return res.status(400).json({ 
        error: 'Un groupe doit contenir au minimum 3 personnes (vous + 2 autres participants)' 
      });
    }

    // Vérifier que tous les participants existent
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({ error: 'Certains utilisateurs n\'existent pas' });
    }


    // Créer le groupe
    const group = new Conversation({
      participants: allParticipants,
      isGroup: true,
      groupName: groupName.trim(),
      groupAdmin: userId
    });


    await group.save();


    // Populate les participants
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');
    await group.populate('groupAdmin', 'name email profilePicture');


    console.log('✅ Groupe créé:', group._id, '- Nom:', groupName, `(${allParticipants.length} participants)`);

    console.log('✅ Groupe créé:', group._id, '- Nom:', groupName, `(${allParticipants.length} participants)`);

    // Émettre un événement Socket pour notifier les participants
    const io = req.app.get('io');
    if (io) {
      allParticipants.forEach(participantId => {
        io.to(participantId).emit('group-created', group);
        io.to(participantId).emit('should-refresh-conversations');
      });
    }


    res.status(201).json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur createGroup:', error);
    res.status(500).json({ error: error.message });
  }
};


// Obtenir les détails d'un groupe
exports.getGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;


    const group = await Conversation.findById(id)
      .populate('participants', 'name email profilePicture isOnline lastSeen')
      .populate('groupAdmin', 'name email profilePicture');


    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }


    if (!group.isGroup) {
      return res.status(400).json({ error: 'Ceci n\'est pas un groupe' });
    }


    // Vérifier que l'utilisateur fait partie du groupe
    const isParticipant = group.participants.some(
      p => p._id.toString() === userId.toString()
    );


    if (!isParticipant) {
      return res.status(403).json({ error: 'Accès refusé' });
    }


    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur getGroup:', error);
    res.status(500).json({ error: error.message });
  }
};


// Ajouter des participants au groupe
exports.addParticipants = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId, participantIds } = req.body;

    const group = await Conversation.findById(groupId);

    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    // 🆕 CORRECTION : Vérifier que l'utilisateur est créateur OU admin
    const isCreator = group.groupAdmin.toString() === userId.toString();
    const isAdmin = group.groupAdmins?.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Seuls les admins peuvent ajouter des participants' });
    }


    // Ajouter les nouveaux participants
    const newParticipants = participantIds.filter(
      id => !group.participants.includes(id)
    );


    group.participants.push(...newParticipants);
    await group.save();


    await group.populate('participants', 'name email profilePicture isOnline lastSeen');


    // Notifier les participants
    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
        io.to(p._id.toString()).emit('should-refresh-conversations');
      });
    }


    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur addParticipants:', error);
    res.status(500).json({ error: error.message });
  }
};


// Quitter un groupe
exports.leaveGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.params;


    const group = await Conversation.findById(groupId);


    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }


    // 🆕 VÉRIFICATION : Impossible de quitter si ça laisse moins de 2 personnes
    const remainingParticipants = group.participants.filter(
      p => p.toString() !== userId.toString()
    );


    if (remainingParticipants.length < 2) {
      return res.status(400).json({
        error: 'Impossible de quitter le groupe : il doit rester au minimum 2 personnes'
      });
    }


    // Retirer l'utilisateur des participants
    group.participants = remainingParticipants;


    if (remainingParticipants.length < 2) {
      return res.status(400).json({ 
        error: 'Impossible de quitter le groupe : il doit rester au minimum 2 personnes' 
      });
    }

    // Retirer l'utilisateur des participants
    group.participants = remainingParticipants;

    // Si c'est l'admin qui part et qu'il reste des participants, transférer l'admin
    if (group.groupAdmin.toString() === userId.toString() && group.participants.length > 0) {
      group.groupAdmin = group.participants[0];
    }


    await group.save();
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');


    // Notifier
    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
      });
      io.to(userId.toString()).emit('should-refresh-conversations');
    }


    res.json({ success: true, message: 'Vous avez quitté le groupe' });
  } catch (error) {
    console.error('❌ Erreur leaveGroup:', error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// 🆕 AJOUTER CES FONCTIONS À LA FIN DU FICHIER
// ========================================

// Retirer un participant
exports.removeParticipant = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId, participantId } = req.body;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    const isCreator = group.groupAdmin.toString() === userId.toString();
    const isAdmin = group.groupAdmins?.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        error: 'Seuls les admins peuvent retirer des participants' 
      });
    }

    if (group.groupAdmin.toString() === participantId) {
      return res.status(400).json({ 
        error: 'Impossible de retirer le créateur du groupe' 
      });
    }

    if (group.participants.length <= 2) {
      return res.status(400).json({
        error: 'Il doit rester au minimum 2 personnes'
      });
    }

    group.participants = group.participants.filter(
      p => p.toString() !== participantId
    );

    if (group.groupAdmins) {
      group.groupAdmins = group.groupAdmins.filter(
        adminId => adminId.toString() !== participantId
      );
    }

    await group.save();
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');
    await group.populate('groupAdmin', 'name email profilePicture');
    await group.populate('groupAdmins', 'name email profilePicture');

    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
      });
      io.to(participantId.toString()).emit('removed-from-group', {
        groupId: group._id,
        groupName: group.groupName
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur removeParticipant:', error);
    res.status(500).json({ error: error.message });
  }
};

// Promouvoir en admin
exports.promoteToAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId, participantId } = req.body;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    if (group.groupAdmin.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'Seul le créateur peut promouvoir des admins' 
      });
    }

    if (!group.groupAdmins) {
      group.groupAdmins = [];
    }

    if (group.groupAdmins.some(adminId => adminId.toString() === participantId)) {
      return res.status(400).json({ 
        error: 'Déjà admin' 
      });
    }

    group.groupAdmins.push(participantId);
    await group.save();
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');
    await group.populate('groupAdmin', 'name email profilePicture');
    await group.populate('groupAdmins', 'name email profilePicture');

    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur promoteToAdmin:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rétrograder un admin
exports.removeAdmin = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId, adminId } = req.body;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    if (group.groupAdmin.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'Seul le créateur peut rétrograder' 
      });
    }

    group.groupAdmins = group.groupAdmins.filter(
      id => id.toString() !== adminId
    );

    await group.save();
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');
    await group.populate('groupAdmin', 'name email profilePicture');
    await group.populate('groupAdmins', 'name email profilePicture');

    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur removeAdmin:', error);
    res.status(500).json({ error: error.message });
  }
};

// Modifier le nom du groupe
exports.updateGroupName = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId, groupName } = req.body;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    const isCreator = group.groupAdmin.toString() === userId.toString();
    const isAdmin = group.groupAdmins?.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        error: 'Seuls les admins peuvent modifier le nom' 
      });
    }

    group.groupName = groupName.trim();
    await group.save();
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');
    await group.populate('groupAdmin', 'name email profilePicture');
    await group.populate('groupAdmins', 'name email profilePicture');

    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur updateGroupName:', error);
    res.status(500).json({ error: error.message });
  }
};

// Modifier l'image du groupe
exports.updateGroupImage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Image requise' });
    }

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Groupe non trouvé' });
    }

    const isCreator = group.groupAdmin.toString() === userId.toString();
    const isAdmin = group.groupAdmins?.some(
      adminId => adminId.toString() === userId.toString()
    );

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ 
        error: 'Seuls les admins peuvent modifier l\'image' 
      });
    }

    group.groupImage = file.path;
    await group.save();
    await group.populate('participants', 'name email profilePicture isOnline lastSeen');
    await group.populate('groupAdmin', 'name email profilePicture');
    await group.populate('groupAdmins', 'name email profilePicture');

    const io = req.app.get('io');
    if (io) {
      group.participants.forEach(p => {
        io.to(p._id.toString()).emit('group-updated', group);
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('❌ Erreur updateGroupImage:', error);
    res.status(500).json({ error: error.message });
  }
};