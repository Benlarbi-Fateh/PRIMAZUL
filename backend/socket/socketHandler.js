const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Status = require('../models/Status'); // 🆕 AJOUT


const initSocket = (io) => {
  const onlineUsers = new Map();
  const statusWatchers = new Map(); // 🆕 Suivre qui regarde quelle story

  io.on("connection", (socket) => {
    console.log("✅ Socket connecté:", socket.id);

    
    // User se connecte
    socket.on("user-online", (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);

      console.log(`👤 User ${userId} est en ligne`);
      console.log(`📋 Total utilisateurs en ligne:`, onlineUsers.size);

      const onlineUserIds = Array.from(onlineUsers.keys());

      // Émettre à tous
      io.emit("online-users-update", onlineUserIds);

      // Confirmer individuellement à chaque utilisateur en ligne
      onlineUserIds.forEach((uid) => {
        io.to(uid).emit("online-users-update", onlineUserIds);
      });

      socket.emit("connection-confirmed", {
        userId,
        onlineUsers: onlineUserIds,
      });
    });

// Demander la liste des utilisateurs en ligne
socket.on("request-online-users", () => {
  const onlineUserIds = Array.from(onlineUsers.keys());
  socket.emit("online-users-update", onlineUserIds);
  console.log("📤 Liste des utilisateurs en ligne envoyée:", onlineUserIds);
});

// 🆕 REJOINDRE UNE STORY (pour voir les réactions en temps réel)
socket.on('join-status', (statusId) => {
  socket.join(`status-${statusId}`);
  console.log(`📥 User ${socket.userId} regarde la story ${statusId}`);
  
  // Stocker l'information
  if (!statusWatchers.has(statusId)) {
    statusWatchers.set(statusId, new Set());
  }
  statusWatchers.get(statusId).add(socket.userId);
});

// 🆕 QUITTER UNE STORY
socket.on('leave-status', (statusId) => {
  socket.leave(`status-${statusId}`);
  console.log(`📤 User ${socket.userId} a quitté la story ${statusId}`);
  
  if (statusWatchers.has(statusId)) {
    statusWatchers.get(statusId).delete(socket.userId);
    if (statusWatchers.get(statusId).size === 0) {
      statusWatchers.delete(statusId);
    }
  }
});

// Rejoindre une conversation
socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
      socket.currentConversation = conversationId;
      console.log(
        `📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`
      );
      socket.emit("conversation-joined", { conversationId });
    });


    // Quitter une conversation
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);
      socket.currentConversation = null;
      console.log(
        `📤 Socket ${socket.id} a quitté la conversation ${conversationId}`
      );
    });

    socket.on('send-message', async (data) => {
      try {
        console.log('📤 Réception send-message:', data);
        const { conversationId, sender, content, type, fileUrl, fileName, fileSize, isStoryReply, storyId } = data;

        const message = new Message({
          conversationId,
          sender,
          content: content || '',
          type: type || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          isStoryReply: isStoryReply || false,
          storyId: storyId || null,
          storyType: data.storyType || null,
          storyPreview: data.storyPreview || ''
        });

        await message.save();
        await message.populate('sender', 'name profilePicture');

        const updatedConversation = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            lastMessage: message._id,
            updatedAt: Date.now(),
          },
          { new: true }
        )
          .populate(
            "participants",
            "name email profilePicture isOnline lastSeen"
          )
          .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "name" },
          });

        console.log("💾 Message sauvegardé en base:", message._id);

        // Émettre le message à TOUS les participants de la conversation
        io.to(conversationId).emit("receive-message", {
          ...message.toObject(),
          conversationId,
          sender: message.sender,
        });

        if (updatedConversation) {
          updatedConversation.participants.forEach((participant) => {
            const participantId = participant._id.toString();
            if (onlineUsers.has(participantId)) {
              io.to(onlineUsers.get(participantId)).emit(
                "conversation-updated",
                updatedConversation
              );
            }
          });
        }

        // 🆕 SI C'EST UNE RÉPONSE À UNE STORY, NOTIFIER LE PROPRIÉTAIRE
        if (isStoryReply && storyId) {
          const status = await Status.findById(storyId);
          if (status && status.userId.toString() !== sender.toString()) {
            const statusOwnerId = status.userId.toString();
            if (onlineUsers.has(statusOwnerId)) {
              io.to(onlineUsers.get(statusOwnerId)).emit('story-reply-notification', {
                statusId: storyId,
                senderId: sender,
                message: content,
                storyPreview: data.storyPreview || ''
              });
            }
          }
          console.log("📢 Conversation mise à jour envoyée aux participants");
        }
      } catch (error) {
        console.error("❌ Erreur send-message:", error);
        socket.emit("message-error", { error: error.message });
      }
    });

// 🆕 ÉVÉNEMENTS POUR LES RÉACTIONS AUX STORIES
socket.on('status-react', async (data) => {
  try {
    const { statusId, userId, reactionType } = data;
    console.log('🎭 Réaction socket:', { statusId, userId, reactionType });

    io.to(`status-${statusId}`).emit('status-reaction-update', {
      statusId,
      userId,
      reactionType,
      timestamp: new Date()
    });

    const status = await Status.findById(statusId);
    if (status && status.userId.toString() !== userId) {
      const statusOwnerId = status.userId.toString();
      if (onlineUsers.has(statusOwnerId)) {
        io.to(onlineUsers.get(statusOwnerId)).emit('status-reaction-notification', {
          statusId,
          userId,
          reactionType,
          statusPreview: status.content?.substring(0, 50) || 'Story'
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur status-react:', error);
  }
});

// 🆕 ÉVÉNEMENTS POUR LES RÉPONSES AUX STORIES
socket.on('status-reply', async (data) => {
  try {
    const { statusId, userId, message } = data;
    console.log('💬 Réponse socket:', { statusId, userId, message });

    io.to(`status-${statusId}`).emit('status-reply-update', {
      statusId,
      userId,
      message,
      timestamp: new Date()
    });

    const status = await Status.findById(statusId);
    if (status && status.userId.toString() !== userId) {
      const statusOwnerId = status.userId.toString();
      if (onlineUsers.has(statusOwnerId)) {
        io.to(onlineUsers.get(statusOwnerId)).emit('status-reply-notification', {
          statusId,
          userId,
          message,
          statusPreview: status.content?.substring(0, 50) || 'Story'
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur status-reply:', error);
  }
});

// Typing indicators
socket.on("typing", ({ conversationId, userId }) => {
  socket.to(conversationId).emit("user-typing", { conversationId, userId });
});

socket.on("stop-typing", ({ conversationId, userId }) => {
  socket.to(conversationId).emit("user-stopped-typing", { conversationId, userId });
});


    
    // Refresh conversations
    socket.on("refresh-conversations", (userId) => {
      console.log(`🔄 Demande de refresh conversations pour ${userId}`);
      socket.emit("should-refresh-conversations");
    });

// ============================================
// 📨 INVITATIONS
// ============================================

// Nouvelle invitation envoyée
socket.on("invitation-sent", (data) => {
  const { receiverId, invitation } = data;
  console.log(`📨 Tentative envoi invitation à ${receiverId}`, onlineUsers);

  if (onlineUsers.has(receiverId)) {
    const receiverSocketId = onlineUsers.get(receiverId);
    console.log(
      `🎯 Utilisateur ${receiverId} trouvé avec socket: ${receiverSocketId}`
    );

    io.to(receiverSocketId).emit("invitation-received", invitation);
    console.log(
      `📨 Invitation envoyée INSTANTANÉMENT à l'utilisateur ${receiverId}`
    );
  } else {
    console.log(
      `⚠️ Utilisateur ${receiverId} hors ligne, invitation stockée seulement`
    );
  }
});

// Invitation acceptée
socket.on("invitation-accepted", async (data) => {
  try {
    const { senderId, invitation, conversation } = data;

    console.log(
      `✅ Invitation acceptée, envoi à l'expéditeur: ${senderId}`
    );

    // Récupérer la conversation complète avec populate
    const populatedConversation = await Conversation.findById(
      conversation._id
    )
      .populate("participants", "name email profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name profilePicture" },
      });

        
        console.log(
          "🔥 Conversation peuplée pour envoi:",
          populatedConversation?._id
        );

        // Émettre à l'expéditeur SI EN LIGNE
        if (onlineUsers.has(senderId)) {
          const senderSocketId = onlineUsers.get(senderId);

          io.to(senderSocketId).emit("invitation-accepted-notification", {
            invitation,
            conversation: populatedConversation || conversation,
          });
          

          // Émettre aussi la mise à jour de conversation
          if (populatedConversation) {
            io.to(senderSocketId).emit(
              "conversation-updated",
              populatedConversation
            );
          }

          console.log(
            `✅ Notification d'acceptation INSTANTANÉE envoyée à ${senderId}`
          );
        } else {
          console.log(
            `⚠️ Expéditeur ${senderId} hors ligne, notification stockée`
          );
        }

        const receiverId = invitation.receiver?._id || invitation.receiver;
        if (receiverId && onlineUsers.has(receiverId.toString())) {
          const receiverSocketId = onlineUsers.get(receiverId.toString());
          if (populatedConversation) {
            io.to(receiverSocketId).emit(
              "conversation-updated",
              populatedConversation
            );
          }
          console.log(
            `✅ Conversation ajoutée INSTANTANÉMENT à l'acceptant ${receiverId}`
          );
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'envoi de la conversation:", error);
      }
    });

// Invitation refusée
socket.on("invitation-rejected", (data) => {
  const { senderId, invitation } = data;

  // Version HEAD
  if (onlineUsers.has(senderId)) {
    const senderSocketId = onlineUsers.get(senderId);
    io.to(senderSocketId).emit('invitation-rejected-notification', invitation);
  }

  // Version develop
  console.log(`❌ Invitation refusée, notification à: ${senderId}`);
  if (onlineUsers.has(senderId)) {
    const senderSocketId = onlineUsers.get(senderId);
    io.to(senderSocketId).emit(
      "invitation-rejected-notification",
      invitation
    );
    console.log(
      `❌ Notification de refus INSTANTANÉE envoyée à ${senderId}`
    );
  } else {
    console.log(
      `⚠️ Expéditeur ${senderId} hors ligne, notification stockée`
    );
  }
});

// Invitation annulée
socket.on("invitation-cancelled", (data) => {
  const { receiverId, invitationId } = data;

  // Version HEAD
  if (onlineUsers.has(receiverId)) {
    const receiverSocketId = onlineUsers.get(receiverId);
    io.to(receiverSocketId).emit('invitation-cancelled-notification', invitationId);
  }

  // Version develop
  console.log(`🗑️ Invitation annulée, notification à: ${receiverId}`);
  if (onlineUsers.has(receiverId)) {
    const receiverSocketId = onlineUsers.get(receiverId);
    io.to(receiverSocketId).emit(
      "invitation-cancelled-notification",
      invitationId
    );
    console.log(
      `🗑️ Notification d'annulation INSTANTANÉE envoyée à ${receiverId}`
    );
  } else {
    console.log(
      `⚠️ Destinataire ${receiverId} hors ligne, notification stockée`
    );
  }
});

// Déconnexion
socket.on("disconnect", () => {
  if (socket.userId) {
    onlineUsers.delete(socket.userId);
    console.log(`❌ User ${socket.userId} déconnecté`);

    console.log(`📋 Utilisateurs restants:`, onlineUsers.size);

    const onlineUserIds = Array.from(onlineUsers.keys());

    // Émettre à tous
    io.emit("online-users-update", onlineUserIds);
    io.emit("user-disconnected", socket.userId);

    // Confirmer individuellement
    onlineUserIds.forEach((uid) => {
      io.to(uid).emit("online-users-update", onlineUserIds);
    });

    // 🆕 NETTOYER LES WATCHERS DE STORIES
    statusWatchers.forEach((watchers, statusId) => {
      if (watchers.has(socket.userId)) {
        watchers.delete(socket.userId);
        if (watchers.size === 0) {
          statusWatchers.delete(statusId);
        }
      }
    });
  }
});


    // ============================================
    // 📞 APPELS 1-to-1
    // ============================================

    socket.on("call-user", (data) => {
      // data contient : { userToCallId, signalData, fromUserId, fromUserName }
      // On émet vers l'utilisateur cible
      console.log(
        `📞 Appel 1-to-1 : ${data.fromUserId} → ${data.userToCallId} (conv: ${data.conversationId})`
      );
      // ✅ FIX CRUCIAL : Envoie SEULEMENT au socket qui est dans CETTE conversation
      // On cherche le socket du destinataire qui est dans cette conversation

      // ✅ L'utilisateur est dans la bonne conversation, envoie l'appel
      io.to(data.userToCallId).emit("call-made", {
        signal: data.signalData,
        from: data.fromUserId,
        name: data.fromUserName,
        conversationId: data.conversationId,
      });

      console.log(
        `✅ Appel envoyé au socket actif dans conversation ${data.userToCallId}`
      );
    });

    socket.on("answer-call", (data) => {
      io.to(data.to).emit("call-answered", data.signal);
      console.log(`✅ Appel accepté : ${data.to}`);
    });

    socket.on("end-call", (data) => {
      io.to(data.to).emit("call-ended");
      console.log(`📴 Appel terminé : ${data.to}`);
    });

    // ============================================
    // 👥 APPELS GROUPE (✅ DANS LA CONNECTION)
    // ============================================

    // Initiateur lance un appel groupe
    socket.on("group-call-initiated", (data) => {
      const {
        channelName,
        callType,
        initiator,
        initiatorName,
        participantIds,
        groupName,
      } = data;

      console.log(
        `👥 Appel groupe lancé: ${groupName} (${callType}) par ${initiatorName}`
      );
      console.log(
        `📢 Envoi invitation à ${participantIds.length} participants`
      );

      // Envoie l'invitation à TOUS les participants
      participantIds.forEach((participantId) => {
        console.log(`📤 Envoi invitation à ${participantId}`);

        io.to(participantId).emit("group-call-incoming", {
          channelName,
          callType,
          initiator,
          initiatorName,
          groupName,
          participants: [initiator, ...participantIds], // Tous les participants
          isGroupCall: true,
        });
      });
    });

    // Un participant accepte l'appel groupe
    socket.on("group-call-accepted", (data) => {
      const { channelName, userId } = data;

      console.log(`✅ ${userId} a accepté l'appel groupe ${channelName}`);

      // Notifie TOUS les autres participants qu'un nouveau s'est joint
      io.to(channelName).emit("group-participant-joined", {
        userId,
        channelName,
      });
    });

    // Un participant refuse l'appel groupe
    socket.on("group-call-rejected", (data) => {
      const { channelName, userId } = data;

      console.log(`❌ ${userId} a refusé l'appel groupe ${channelName}`);

      // Optionnel : notifier les autres
      io.to(channelName).emit("group-participant-rejected", {
        userId,
        channelName,
      });
    });

    // Un utilisateur quitte le groupe
    socket.on("user-left-group", (data) => {
      const { channelName, userId } = data;

      console.log(`👤 ${userId} a quitté l'appel groupe ${channelName}`);

      // Notifie les autres participants
      io.to(channelName).emit("user-left-group", {
        userId,
        channelName,
      });
    });
  }); // ✅ FIN DE io.on("connection")

  setInterval(() => {
    const now = Date.now();
    
    
    const TIMEOUT = 60000; // 60 secondes

    onlineUsers.forEach((data, userId) => {
      if (now - data.lastSeen > TIMEOUT) {
        console.log(`⏰ Timeout pour user ${userId}`);
        onlineUsers.delete(userId);

        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online-users-update", onlineUserIds);
      }
    });
  }, 30000);
};

module.exports = initSocket;
