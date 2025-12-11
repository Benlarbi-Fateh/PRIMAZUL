// 🆕 MODIFIER LA FONCTION reactToStatus POUR CRÉER UN MESSAGE
exports.reactToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    console.log('🎭 Réaction à statut:', { statusId, userId, reactionType });

    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap', null];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ 
        error: "Réaction invalide",
        validReactions: ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap']
      });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    const statusOwnerId = status.userId.toString();
    const isOwner = statusOwnerId === userId;

    // Vérifier que l'utilisateur est autorisé
    if (!isOwner) {
      const isContact = await Contact.exists({
        owner: statusOwnerId,
        contact: userId,
        isBlocked: false
      });

      if (!isContact) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
    }

    // Gérer la réaction
    if (reactionType === null) {
      await status.removeReaction(userId);
    } else {
      await status.addOrUpdateReaction(userId, reactionType);
    }

    const updatedStatus = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture')
      .lean();

    // 🆕 CRÉER UN MESSAGE POUR LA RÉACTION (seulement si ce n'est pas le propriétaire)
    if (!isOwner) {
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, statusOwnerId] },
        isGroup: false
      });

      // Si pas de conversation, en créer une
      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, statusOwnerId],
          isGroup: false
        });
        await conversation.save();
      }

      // Créer le message de réaction
      const reactionMessage = new Message({
        conversationId: conversation._id,
        sender: userId,
        content: reactionType === 'like' ? 'a aimé votre story' : 
                reactionType === 'love' ? 'a aimé votre story ❤️' :
                reactionType === 'haha' ? 'a ri de votre story 😄' :
                reactionType === 'wow' ? 'a été impressionné par votre story 😮' :
                reactionType === 'sad' ? 'a été touché par votre story 😢' :
                reactionType === 'angry' ? 'a réagi à votre story 😠' :
                reactionType === 'fire' ? 'a trouvé votre story 🔥' :
                reactionType === 'clap' ? 'a applaudi votre story 👏' : '',
        type: 'story_reaction',
        isStoryReaction: true,
        storyId: statusId,
        storyType: status.type,
        storyPreview: status.type === 'text' ? 
                     (status.content?.substring(0, 100) || '📝 Statut') : 
                     (status.type === 'image' ? '🖼️ Image' : '🎥 Vidéo'),
        storyReactionType: reactionType
      });
      await reactionMessage.save();

      // Mettre à jour la conversation
      conversation.lastMessage = reactionMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Populate pour l'envoi
      await reactionMessage.populate('sender', 'name profilePicture');
      await conversation.populate('participants', 'name profilePicture');

      // Émettre le message dans la conversation
      const io = req.app.get('io');
      if (io) {
        io.to(conversation._id.toString()).emit('receive-message', reactionMessage);
        io.to(statusOwnerId.toString()).emit('conversation-updated', conversation);
      }
    }

    // Récupérer les réactions
    const reactions = updatedStatus.views
      .filter(view => view.reaction)
      .map(view => ({
        userId: view.userId._id,
        userName: view.userId.name,
        userProfile: view.userId.profilePicture,
        reaction: view.reaction,
        viewedAt: view.viewedAt
      }));

    // Émettre l'événement socket
    const io = req.app.get('io');
    if (io) {
      io.to(`status-${statusId}`).emit('status-reacted', {
        statusId,
        userId,
        reactionType,
        reactionsSummary: updatedStatus.reactionsSummary,
        reactionsCount: reactions.length
      });
      
      if (!isOwner) {
        io.to(statusOwnerId.toString()).emit('status-reaction-notification', {
          statusId,
          userId: req.user.id,
          userName: req.user.name,
          reactionType,
          statusPreview: status.content?.substring(0, 50) || 
                        (status.type === 'image' ? '🖼️ Image' : 
                         status.type === 'video' ? '🎥 Vidéo' : '📝 Statut')
        });
      }
    }

    res.json({
      success: true,
      message: reactionType === null ? "Réaction retirée" : "Réaction ajoutée",
      reactionType,
      reactionsSummary: updatedStatus.reactionsSummary,
      reactions,
      totalReactions: updatedStatus.reactionsSummary.total,
      // 🆕 Retourner l'ID de conversation si un message a été créé
      ...(!isOwner && conversation ? { conversationId: conversation._id } : {})
    });

  } catch (error) {
    console.error('❌ Erreur réaction statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de l'ajout de la réaction",
      details: error.message 
    });
  }
};

// 🆕 MODIFIER LA FONCTION replyToStatus POUR AMÉLIORER LE MESSAGE
exports.replyToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    console.log('💬 Réponse à statut:', { statusId, userId, message });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Le message est requis" });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    const statusOwnerId = status.userId.toString();
    const isOwner = userId === statusOwnerId;

    // Vérifier que l'utilisateur est autorisé
    if (!isOwner) {
      const isContact = await Contact.exists({
        owner: statusOwnerId,
        contact: userId,
        isBlocked: false
      });

      if (!isContact) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
    }

    // 1. Ajouter la réponse dans le statut
    await status.addReply(userId, message.trim());

    // 2. Créer un message dans le chat (seulement si ce n'est pas le propriétaire)
    let conversation = null;
    let chatMessage = null;

    if (!isOwner) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, statusOwnerId] },
        isGroup: false
      });

      // Si pas de conversation, en créer une
      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, statusOwnerId],
          isGroup: false
        });
        await conversation.save();
      }

      // Créer le message de réponse
      chatMessage = new Message({
        conversationId: conversation._id,
        sender: userId,
        content: message.trim(),
        type: 'story_reply',
        isStoryReply: true,
        storyId: statusId,
        storyType: status.type,
        storyPreview: status.type === 'text' ? 
                     (status.content?.substring(0, 100) || '📝 Statut') : 
                     (status.type === 'image' ? '🖼️ Image' : '🎥 Vidéo')
      });
      await chatMessage.save();

      // Mettre à jour la conversation
      conversation.lastMessage = chatMessage._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Populate pour l'envoi
      await chatMessage.populate('sender', 'name profilePicture');
      await conversation.populate('participants', 'name profilePicture');

      // Émettre le message
      const io = req.app.get('io');
      if (io) {
        io.to(conversation._id.toString()).emit('receive-message', chatMessage);
        conversation.participants.forEach(participant => {
          const participantId = participant._id.toString();
          io.to(participantId).emit('conversation-updated', conversation);
        });
      }
    }

    // Récupérer le statut mis à jour
    const updatedStatus = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture')
      .lean();

    // Émettre les événements socket
    const io = req.app.get('io');
    if (io) {
      io.to(`status-${statusId}`).emit('status-replied', {
        statusId,
        repliesCount: updatedStatus.repliesCount,
        latestReply: {
          userId,
          message: message.trim(),
          userName: req.user.name
        }
      });

      if (!isOwner) {
        io.to(statusOwnerId.toString()).emit('status-reply-notification', {
          statusId,
          senderId: userId,
          senderName: req.user.name,
          message: message.trim(),
          statusPreview: status.type === 'text' ? 
                        (status.content?.substring(0, 50) || '📝 Statut') : 
                        (status.type === 'image' ? '🖼️ Image' : '🎥 Vidéo')
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Réponse envoyée",
      reply: {
        userId,
        message: message.trim(),
        createdAt: new Date()
      },
      chatMessage,
      conversationId: conversation?._id,
      repliesCount: updatedStatus.repliesCount,
      // 🆕 Ajouter une indication que c'est une réponse à une story
      isStoryReply: true
    });

  } catch (error) {
    console.error('❌ Erreur réponse statut:', error);
    res.status(500).json({ 
      error: "Erreur lors de l'envoi de la réponse",
      details: error.message 
    });
  }
};