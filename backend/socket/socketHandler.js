const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { checkBlockStatusSocket } = require("./blockCheck");

const initSocket = (io) => {
  const onlineUsers = new Map();

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

      io.emit("online-users-update", onlineUserIds);

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

    // Envoyer un message
    socket.on("send-message", async (data) => {
      try {
        console.log("📤 Réception send-message:", data);
        const {
          conversationId,
          sender,
          content,
          type,
          fileUrl,
          fileName,
          fileSize,
        } = data;
        if (conversationId) {
          const conversation = await Conversation.findById(conversationId)
            .select("participants isGroup")
            .lean();

          if (conversation && !conversation.isGroup) {
            const recipientId = conversation.participants.find(
              (p) => p.toString() !== sender.toString()
            );

            if (recipientId) {
              const isBlocked = await checkBlockStatusSocket(
                sender,
                recipientId.toString()
              );

              if (isBlocked) {
                console.log("🚫 Message bloqué par socket");
                socket.emit("message-error", {
                  error: "Message bloqué",
                  blocked: true,
                });
                return; // ✅ IMPORTANT : Arrêter l'exécution ici
              }
            }
          }
        }

        const message = new Message({
          conversationId,
          sender,
          content: content || "",
          type: type || "text",
          fileUrl: fileUrl || "",
          fileName: fileName || "",
          fileSize: fileSize || 0,
        });

        await message.save();
        await message.populate("sender", "name profilePicture");

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
          console.log("📢 Conversation mise à jour envoyée aux participants");
        }
      } catch (error) {
        console.error("❌ Erreur send-message:", error);
        socket.emit("message-error", { error: error.message });
      }
    });

    // Typing indicators
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("user-typing", { conversationId, userId });
    });

    socket.on("stop-typing", ({ conversationId, userId }) => {
      socket
        .to(conversationId)
        .emit("user-stopped-typing", { conversationId, userId });
    });
    // ==========================================
    // ==========================================
    // 📞 LOGIQUE D'APPEL ROBUSTE
    // ==========================================

    socket.on("call-user", (data) => {
      // data.userToCallId DOIT être l'ID string de la cible
      if (!data.userToCallId)
        return console.log("❌ Erreur Call: Pas d'ID cible");

      console.log(`📞 Appel envoyé vers ${data.userToCallId} (Room)`);

      // On envoie à la room spécifique de l'utilisateur
      io.to(data.userToCallId).emit("call-made", {
        signal: data.signalData,
        from: data.fromUserId,
        name: data.fromUserName,
      });
    });

    socket.on("answer-call", (data) => {
      io.to(data.to).emit("call-answered", data.signal);
    });

    socket.on("end-call", (data) => {
      io.to(data.to).emit("call-ended");
    });

    socket.on("answer-call", (data) => {
      console.log(`✅ Appel accepté par ${socket.id}, renvoi vers ${data.to}`);
      io.to(data.to).emit("call-answered", data.signal);
    });

    socket.on("end-call", (data) => {
      console.log(`🛑 Fin d'appel pour ${data.to}`);
      io.to(data.to).emit("call-ended");
    });

    // ============================================
    // 🆕 RÉACTIONS
    // ============================================

    socket.on("toggle-reaction", async (data) => {
      try {
        const { messageId, emoji, userId, conversationId } = data;

        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          (r) => r.userId.toString() === userId
        );

        let action = "";

        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
            action = "removed";
          } else {
            message.reactions[existingIndex].emoji = emoji;
            action = "updated";
          }
        } else {
          message.reactions.push({ userId, emoji });
          action = "added";
        }

        await message.save();
        await message.populate("reactions.userId", "name profilePicture");

        io.to(conversationId).emit("reaction-updated", {
          messageId: message._id,
          reactions: message.reactions,
          action,
          userId,
          emoji,
        });

        console.log(
          `${
            action === "added" ? "➕" : action === "removed" ? "➖" : "🔄"
          } Réaction ${emoji} sur message ${messageId}`
        );
      } catch (error) {
        console.error("❌ Erreur toggle-reaction:", error);
        socket.emit("reaction-error", { error: error.message });
      }
    });

    // Refresh conversations
    socket.on("refresh-conversations", (userId) => {
      console.log(`🔄 Demande de refresh conversations pour ${userId}`);
      socket.emit("should-refresh-conversations");
    });

    // ============================================
    // 📨 INVITATIONS
    // ============================================

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

    socket.on("invitation-accepted", async (data) => {
      try {
        const { senderId, invitation, conversation } = data;

        console.log(
          `✅ Invitation acceptée, envoi à l'expéditeur: ${senderId}`
        );

        const populatedConversation = await Conversation.findById(
          conversation._id
        )
          .populate(
            "participants",
            "name email profilePicture isOnline lastSeen"
          )
          .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "name profilePicture" },
          });

        console.log(
          "🔥 Conversation peuplée pour envoi:",
          populatedConversation?._id
        );

        if (onlineUsers.has(senderId)) {
          const senderSocketId = onlineUsers.get(senderId);

          io.to(senderSocketId).emit("invitation-accepted-notification", {
            invitation,
            conversation: populatedConversation || conversation,
          });

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

    socket.on("invitation-rejected", (data) => {
      const { senderId, invitation } = data;
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

    socket.on("invitation-cancelled", (data) => {
      const { receiverId, invitationId } = data;
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

    // ============================================
    // 🆕 SUPPRESSION DE MESSAGE EN TEMPS RÉEL
    // ============================================
    socket.on("delete-message", async ({ messageId, conversationId }) => {
      try {
        console.log("🗑️ Réception delete-message:", messageId);

        // L'événement sera émis depuis le controller après vérification
        // On peut ajouter une logique supplémentaire ici si nécessaire
      } catch (error) {
        console.error("❌ Erreur delete-message socket:", error);
        socket.emit("message-error", { error: error.message });
      }
    });

    // ============================================
    // 🆕 MODIFICATION DE MESSAGE EN TEMPS RÉEL
    // ============================================
    socket.on(
      "edit-message",
      async ({ messageId, content, conversationId }) => {
        try {
          console.log("✏️ Réception edit-message:", messageId);

          // L'événement sera émis depuis le controller après vérification
          // On peut ajouter une logique supplémentaire ici si nécessaire
        } catch (error) {
          console.error("❌ Erreur edit-message socket:", error);
          socket.emit("message-error", { error: error.message });
        }
      }
    );

    // Déconnexion
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);

        console.log(`❌ User ${socket.userId} déconnecté`);
        console.log(`📋 Utilisateurs restants:`, onlineUsers.size);

        const onlineUserIds = Array.from(onlineUsers.keys());

        io.emit("online-users-update", onlineUserIds);
        io.emit("user-disconnected", socket.userId);

        onlineUserIds.forEach((uid) => {
          io.to(uid).emit("online-users-update", onlineUserIds);
        });
      }
    });
  });

  // Heartbeat
  setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 60000;

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
