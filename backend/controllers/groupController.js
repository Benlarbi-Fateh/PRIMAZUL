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


    // Vérifier que l'utilisateur est admin
    if (group.groupAdmin.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Seul l\'admin peut ajouter des participants' });
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
