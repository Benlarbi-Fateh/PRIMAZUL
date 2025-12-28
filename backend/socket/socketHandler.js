// backend/socket/socketHandler.js
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { checkBlockStatusSocket } = require("./blockCheck");

// Stocker les appels actifs
const activeCallsMap = new Map();
const callTimeouts = new Map(); // Pour gérer les timeouts d'appel

const initSocket = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("✅ Socket connecté:", socket.id);

    // ============================================
    // USER ONLINE/OFFLINE
    // ============================================
    socket.on("user-online", (userId) => {
      onlineUsers.set(userId, { socketId: socket.id, lastSeen: Date.now() });
      socket.userId = userId;
      socket.join(userId);

      console.log(`👤 User ${userId} en ligne (${onlineUsers.size} total)`);

      const onlineUserIds = Array.from(onlineUsers.keys());
      io.emit("online-users-update", onlineUserIds);
    });

    socket.on("request-online-users", () => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit("online-users-update", onlineUserIds);
    });

    // ============================================
    // CONVERSATIONS
    // ============================================
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
      socket.currentConversation = conversationId;
      socket.emit("conversation-joined", { conversationId });
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);
      socket.currentConversation = null;
    });

    // ============================================
    // MESSAGES
    // ============================================
    socket.on("send-message", async (data) => {
      try {
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
                socket.emit("message-error", {
                  error: "Message bloqué",
                  blocked: true,
                });
                return;
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
          { lastMessage: message._id, updatedAt: Date.now() },
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

        io.to(conversationId).emit("receive-message", {
          ...message.toObject(),
          conversationId,
          sender: message.sender,
        });

        if (updatedConversation) {
          updatedConversation.participants.forEach((participant) => {
            const participantId = participant._id.toString();
            const userData = onlineUsers.get(participantId);
            if (userData) {
              io.to(userData.socketId).emit(
                "conversation-updated",
                updatedConversation
              );
            }
          });
        }
      } catch (error) {
        console.error("❌ Erreur send-message:", error);
        socket.emit("message-error", { error: error.message });
      }
    });

    // Typing
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("user-typing", { conversationId, userId });
    });

    socket.on("stop-typing", ({ conversationId, userId }) => {
      socket
        .to(conversationId)
        .emit("user-stopped-typing", { conversationId, userId });
    });

    // ============================================
    // 📞 APPELS OPTIMISÉS
    // ============================================

    // Initier un appel
    socket.on("call-initiate", async (data) => {
      const {
        callId,
        conversationId,
        callType,
        isGroup,
        groupName,
        targetUserIds, // C'est un tableau d'IDs
        channelName,
        callerName,
        callerImage,
      } = data;

      const callerId = socket.userId;
      if (!callerId) return;

      console.log(
        `📞 Appel de groupe initié par ${callerId} vers:`,
        targetUserIds
      );

      // Stocker l'appel actif
      activeCallsMap.set(callId, {
        callId,
        conversationId,
        channelName,
        callType,
        isGroup,
        groupName,
        initiator: callerId,
        initiatedAt: Date.now(),
        participants: new Map([
          [callerId, { joinedAt: Date.now(), status: "connected" }],
        ]),
        status: "ringing",
      });

      // Timeout si personne ne répond
      const timeout = setTimeout(async () => {
        const call = activeCallsMap.get(callId);
        if (call && call.status === "ringing") {
          console.log(`⏰ Timeout appel ${callId}`);
          // ✅ IMPORTANT: Mettre à jour la base de données
          const updatedMessage = await Message.findOneAndUpdate(
            { "callDetails.callId": callId },
            {
              "callDetails.status": "missed",
              "callDetails.endedAt": new Date(),
              "callDetails.duration": 0,
            },
            { new: true }
          ).populate("sender", "name profilePicture");
          // ✅ INDISPENSABLE : Envoyer la mise à jour à TOUTE la room
          if (updatedMessage) {
            io.to(call.conversationId).emit("receive-message", updatedMessage);
          }

          io.to(callerId).emit("call-timeout", { callId });

          // Notifier tous les cibles
          targetUserIds.forEach((targetId) => {
            const userIdStr = targetId.toString();
            io.to(userIdStr).emit("call-missed", { callId, callerId });
          });

          activeCallsMap.delete(callId);
          callTimeouts.delete(callId);
        }
      }, 45000);

      callTimeouts.set(callId, timeout);

      // ✅ CORRECTION MAJEURE ICI : Boucle robuste pour envoyer à TOUS
      if (Array.isArray(targetUserIds)) {
        targetUserIds.forEach((rawId) => {
          const userId = rawId.toString(); // Force string pour correspondre aux clés de la Map/Room

          // 1. Vérifier si user est dans la map Online (Optionnel, car socket.join(userId) gère ça)
          const isUserInOnlineMap = onlineUsers.has(userId);
          console.log(
            `📡 Envoi signal d'appel à ${userId} ${
              isUserInOnlineMap ? "(en ligne)" : "(socket peut être connecté)"
            }`
          );

          // 2. Envoyer à la "Room" de l'utilisateur (plus fiable que le socketId direct)
          io.to(userId).emit("call-incoming", {
            callId,
            channelName,
            callType,
            isGroup,
            groupName,
            from: {
              userId: callerId,
              name: callerName,
              profilePicture: callerImage,
            },
            conversationId,
          });
        });
      }
    });

    // Répondre à un appel
    socket.on("call-answer", async (data) => {
      const { callId, channelName } = data;
      const userId = socket.userId;

      const call = activeCallsMap.get(callId);
      if (!call) {
        socket.emit("call-error", { error: "Appel introuvable ou terminé" });
        return;
      }

      // Annuler le timeout
      const timeout = callTimeouts.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        callTimeouts.delete(callId);
      }

      // Mettre à jour le statut
      call.status = "ongoing";
      call.answeredAt = Date.now();
      call.participants.set(userId, {
        joinedAt: Date.now(),
        status: "connected",
      });

      // Mettre à jour le message en base
      await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        {
          "callDetails.status": "ongoing",
          "callDetails.startedAt": new Date(),
          $addToSet: { "callDetails.answeredBy": userId },
        }
      );

      // Notifier l'initiateur
      io.to(call.initiator).emit("call-answered", {
        callId,
        channelName,
        answeredBy: userId,
      });

      console.log(`✅ Appel ${callId} répondu par ${userId}`);
    });

    // Refuser un appel
    socket.on("call-decline", async (data) => {
      const { callId, reason } = data;
      const userId = socket.userId;

      const call = activeCallsMap.get(callId);
      if (!call) return;

      await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        { $addToSet: { "callDetails.declinedBy": userId } }
      );
      if (!call.isGroup) {
        // P2P: terminer l'appel complètement
        call.status = "missed";

        const updatedMessage = await Message.findOneAndUpdate(
          { "callDetails.callId": callId },
          {
            "callDetails.status": "missed",
            "callDetails.endedAt": new Date(),
            "callDetails.duration": 0,
          },
          { new: true }
        ).populate("sender", "name profilePicture");

        if (updatedMessage) {
          io.to(call.conversationId).emit("receive-message", updatedMessage);
        }

        // Notifier les deux participants
        io.to(call.initiator).emit("call-declined", {
          callId,
          declinedBy: userId,
          reason: reason || "declined",
        });

        io.to(userId).emit("call-ended", {
          callId,
          status: "missed",
        });

        const timeout = callTimeouts.get(callId);
        if (timeout) {
          clearTimeout(timeout);
          callTimeouts.delete(callId);
        }

        activeCallsMap.delete(callId);
      } else {
        // GROUPE: Un seul participant refuse, les autres continuent
        // ✅ Notifier SEULEMENT le participant qui refuse
        io.to(userId).emit("call-ended", {
          callId,
          status: "declined",
          reason: reason || "declined",
        });

        console.log(`❌ Appel groupe ${callId} refusé par ${userId}`);
      }
    });

    // Terminer un appel
    socket.on("call-end", async (data) => {
      const { callId } = data;
      const userId = socket.userId;
      const call = activeCallsMap.get(callId);
      if (!call) return;

      const endedAt = Date.now();
      const duration = call.answeredAt
        ? Math.round((endedAt - call.answeredAt) / 1000)
        : 0;

      let finalStatus = "missed"; //par defaut
      if (call.answeredAt) {
        // Si quelqu'un a répondu
        finalStatus = "ended";
      } else if (call.status === "declined") {
        // Si l'appel a été refusé, on le marque comme "missed"
        finalStatus = "missed";
      } else if (call.initiator === userId) {
        // Si c'est l'initiateur qui termine sans réponse = "missed"
        finalStatus = "missed";
      } else {
        // Si c'est le destinataire qui n'a pas répondu = "missed"
        finalStatus = "missed";
      }

      // Mettre à jour le message
      const updatedMessage = await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        {
          "callDetails.status": finalStatus,
          "callDetails.endedAt": new Date(),
          "callDetails.duration": duration,
        },
        { new: true }
      ).populate("sender", "name profilePicture");
      // ✅ On diffuse à toute la conversation
      if (updatedMessage) {
        io.to(call.conversationId).emit("receive-message", updatedMessage);
      }
      // ✅ MODIFICATION: Traiter P2P et groupe différemment
      if (!call.isGroup) {
        // P2P: Notifier les deux participants et terminer l'appel
        call.participants.forEach((_, participantId) => {
          io.to(participantId).emit("call-ended", {
            callId,
            duration,
            status: finalStatus,
            endedBy: userId,
          });
        });
        activeCallsMap.delete(callId);
      } else {
        // Groupe: Une personne quitte, les autres restent
        call.participants.forEach((_, participantId) => {
          if (participantId !== userId) {
            io.to(participantId).emit("call-participant-left", {
              callId,
              userId,
            });
          }
        });
        // ✅ Mettre à jour la BD aussi pour le groupe
        await Message.findOneAndUpdate(
          { "callDetails.callId": callId },
          {
            "callDetails.status": finalStatus,
            "callDetails.endedAt": new Date(),
            "callDetails.duration": duration,
          }
        );

        // Marquer comme "left" en mémoire
        const participant = call.participants.get(userId);
        if (participant) {
          participant.status = "left";
        }
      }

      // Nettoyer
      const timeout = callTimeouts.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        callTimeouts.delete(callId);
      }
      activeCallsMap.delete(callId);

      console.log(
        `🛑 Appel ${callId} terminé - Durée: ${duration}s - Statut: ${finalStatus}`
      );
    });

    // Participant quitte l'appel

    // ✅ APRÈS - Ajouter émission socket
    socket.on("call-leave", async (data) => {
      const { callId } = data;
      const userId = socket.userId;

      const call = activeCallsMap.get(callId);
      if (!call) return;

      const participant = call.participants.get(userId);
      if (participant) {
        participant.leftAt = Date.now();
        participant.status = "left";
      }

      // Notifier les autres
      call.participants.forEach((_, participantId) => {
        if (participantId !== userId) {
          io.to(participantId).emit("call-participant-left", {
            callId,
            userId,
          });
        }
      });

      // Si plus qu'un participant, terminer l'appel
      const activeParticipants = Array.from(call.participants.values()).filter(
        (p) => p.status === "connected"
      );
      // Si plus personne n'est connecté, supprimer l'appel
      if (activeParticipants.length === 0) {
        activeCallsMap.delete(callId);
      }
    });

    // Signaling ICE (pour améliorer la connexion)
    socket.on("ice-candidate", (data) => {
      const { callId, candidate, targetUserId } = data;
      io.to(targetUserId).emit("ice-candidate", {
        callId,
        candidate,
        fromUserId: socket.userId,
      });
    });

    // ============================================
    // RÉACTIONS
    // ============================================
    socket.on("toggle-reaction", async (data) => {
      try {
        const { messageId, emoji, userId, conversationId } = data;
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          (r) => r.userId.toString() === userId
        );

        if (existingIndex > -1) {
          if (message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
          } else {
            message.reactions[existingIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ userId, emoji });
        }

        await message.save();
        await message.populate("reactions.userId", "name profilePicture");

        io.to(conversationId).emit("reaction-updated", {
          messageId: message._id,
          reactions: message.reactions,
        });
      } catch (error) {
        console.error("❌ Erreur reaction:", error);
      }
    });

    // ============================================
    // SUPPRESSION / MODIFICATION
    // ============================================
    socket.on("message-deleted", ({ messageId, conversationId }) => {
      io.to(conversationId).emit("message-deleted", {
        messageId,
        conversationId,
      });
    });

    socket.on("message-edited", ({ messageId, content, conversationId }) => {
      io.to(conversationId).emit("message-edited", {
        messageId,
        content,
        isEdited: true,
        editedAt: new Date(),
      });
    });

    // ============================================
    // INVITATIONS
    // ============================================
    socket.on("invitation-sent", (data) => {
      const { receiverId, invitation } = data;
      const userData = onlineUsers.get(receiverId);
      if (userData) {
        io.to(userData.socketId).emit("invitation-received", invitation);
      }
    });

    socket.on("invitation-accepted", async (data) => {
      const { senderId, invitation, conversation } = data;

      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate("participants", "name email profilePicture isOnline lastSeen")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "name profilePicture" },
        });

      const userData = onlineUsers.get(senderId);
      if (userData) {
        io.to(userData.socketId).emit("invitation-accepted-notification", {
          invitation,
          conversation: populatedConversation || conversation,
        });
      }
    });

    socket.on("invitation-rejected", (data) => {
      const { senderId, invitation } = data;
      const userData = onlineUsers.get(senderId);
      if (userData) {
        io.to(userData.socketId).emit(
          "invitation-rejected-notification",
          invitation
        );
      }
    });

    // ============================================
    // DÉCONNEXION
    // ============================================
    socket.on("disconnect", () => {
      if (socket.userId) {
        // Quitter tous les appels actifs
        activeCallsMap.forEach((call, callId) => {
          if (call.participants.has(socket.userId)) {
            socket.emit("call-leave", { callId });
          }
        });

        onlineUsers.delete(socket.userId);
        console.log(`❌ User ${socket.userId} déconnecté`);

        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online-users-update", onlineUserIds);
      }
    });
  });

  // Heartbeat
  setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 60000;

    onlineUsers.forEach((data, userId) => {
      if (now - data.lastSeen > TIMEOUT) {
        onlineUsers.delete(userId);
        io.emit("online-users-update", Array.from(onlineUsers.keys()));
      }
    });
  }, 30000);
};

module.exports = initSocket;
