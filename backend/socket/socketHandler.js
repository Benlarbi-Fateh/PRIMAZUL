// backend/socket/socketHandler.js
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { checkBlockStatusSocket } = require("./blockCheck");

// ============================================
// STOCKAGE DES APPELS (Amélioré)
// ============================================
const activeCallsMap = new Map();
const conversationActiveCallsMap = new Map(); // conversationId -> callId
const callTimeouts = new Map();

// Constantes de timeout
const GROUP_CALL_TIMEOUT_MS = 20000; // 20 secondes pour les groupes
const P2P_CALL_TIMEOUT_MS = 45000;   // 45 secondes pour les 1v1

// ============================================
// FONCTION UTILITAIRE - Nettoyer un appel
// ============================================
const cleanupCall = async (callId, status, io) => {
  const call = activeCallsMap.get(callId);
  if (!call) return null;

  // Annuler le timeout
  const timeout = callTimeouts.get(callId);
  if (timeout) {
    clearTimeout(timeout);
    callTimeouts.delete(callId);
  }

  const endedAt = Date.now();
  const duration = call.answeredAt
    ? Math.round((endedAt - call.answeredAt) / 1000)
    : 0;

  // Mettre à jour la base de données
  const updatedMessage = await Message.findOneAndUpdate(
    { "callDetails.callId": callId },
    {
      "callDetails.status": status,
      "callDetails.endedAt": new Date(),
      "callDetails.duration": duration,
    },
    { new: true }
  ).populate("sender", "name profilePicture");

  // Émettre la mise à jour du message
  if (updatedMessage && io) {
    io.to(call.conversationId).emit("receive-message", updatedMessage);
  }

  // Nettoyer les maps
  activeCallsMap.delete(callId);
  
  // Supprimer le lien conversation -> appel
  const currentCallId = conversationActiveCallsMap.get(call.conversationId);
  if (currentCallId === callId) {
    conversationActiveCallsMap.delete(call.conversationId);
  }

  console.log(`🧹 Appel ${callId} nettoyé - Status: ${status}, Durée: ${duration}s`);

  return { duration, status, updatedMessage };
};

// ============================================
// INIT SOCKET
// ============================================
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
    // 📞 APPELS - VERSION AMÉLIORÉE
    // ============================================

    // ✅ VÉRIFIER SI UN APPEL EST ACTIF POUR UNE CONVERSATION
    socket.on("check-active-call", async (data) => {
      const { conversationId } = data;
      
      const activeCallId = conversationActiveCallsMap.get(conversationId);
      
      if (activeCallId) {
        const call = activeCallsMap.get(activeCallId);
        
        if (call && (call.status === "ringing" || call.status === "ongoing")) {
          socket.emit("active-call-found", {
            callId: activeCallId,
            channelName: call.channelName,
            callType: call.callType,
            isGroup: call.isGroup,
            status: call.status,
            participantsCount: call.participants.size,
            initiator: call.initiator,
            conversationId: call.conversationId,
          });
          return;
        }
      }
      
      socket.emit("no-active-call", { conversationId });
    });

    // ✅ INITIER UN APPEL (AMÉLIORÉ)
    socket.on("call-initiate", async (data) => {
      const {
        callId,
        conversationId,
        callType,
        isGroup,
        groupName,
        targetUserIds,
        channelName,
        callerName,
        callerImage,
      } = data;

      const callerId = socket.userId;
      if (!callerId) {
        socket.emit("call-error", { error: "Utilisateur non authentifié" });
        return;
      }

      // ✅ VÉRIFIER SI UN APPEL EST DÉJÀ EN COURS POUR CETTE CONVERSATION
      const existingCallId = conversationActiveCallsMap.get(conversationId);
      if (existingCallId) {
        const existingCall = activeCallsMap.get(existingCallId);
        
        if (existingCall && (existingCall.status === "ringing" || existingCall.status === "ongoing")) {
          console.log(`⚠️ Appel déjà en cours pour ${conversationId}: ${existingCallId}`);
          
          socket.emit("call-already-exists", {
            existingCallId,
            channelName: existingCall.channelName,
            status: existingCall.status,
            isGroup: existingCall.isGroup,
            canJoin: existingCall.status === "ongoing",
          });
          return;
        }
      }

      console.log(`📞 Appel initié par ${callerId} vers:`, targetUserIds);

      // Stocker l'appel actif
      const callData = {
        callId,
        conversationId,
        channelName,
        callType,
        isGroup,
        groupName,
        initiator: callerId,
        initiatedAt: Date.now(),
        targetUserIds: targetUserIds || [],
        participants: new Map([
          [callerId, { joinedAt: Date.now(), status: "connected" }],
        ]),
        status: "ringing",
        answeredAt: null,
      };

      activeCallsMap.set(callId, callData);
      conversationActiveCallsMap.set(conversationId, callId);

      // ✅ TIMEOUT ADAPTÉ (20s groupe, 45s P2P)
      const timeoutDuration = isGroup ? GROUP_CALL_TIMEOUT_MS : P2P_CALL_TIMEOUT_MS;
      
      console.log(`⏰ Timeout configuré: ${timeoutDuration / 1000}s (${isGroup ? 'groupe' : 'P2P'})`);

      const timeout = setTimeout(async () => {
        const call = activeCallsMap.get(callId);
        if (call && call.status === "ringing") {
          console.log(`⏰ Timeout appel ${callId} après ${timeoutDuration / 1000}s`);

          // Nettoyer l'appel
          await cleanupCall(callId, "missed", io);

          // Notifier l'initiateur
          io.to(callerId).emit("call-timeout", { 
            callId, 
            isGroup,
            reason: "no_answer",
            timeout: timeoutDuration,
          });

          // Notifier tous les destinataires
          if (call.targetUserIds) {
            call.targetUserIds.forEach((targetId) => {
              io.to(targetId.toString()).emit("call-missed", { 
                callId, 
                callerId,
                isGroup,
              });
            });
          }
        }
      }, timeoutDuration);

      callTimeouts.set(callId, timeout);

      // Envoyer l'appel entrant à tous les destinataires
      if (Array.isArray(targetUserIds)) {
        targetUserIds.forEach((rawId) => {
          const userId = rawId.toString();
          const isUserInOnlineMap = onlineUsers.has(userId);

          console.log(
            `📡 Envoi signal d'appel à ${userId} ${
              isUserInOnlineMap ? "(en ligne)" : "(peut-être connecté)"
            }`
          );

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
            targetUserIds,
          });
        });
      }
    });

    // ✅ REJOINDRE UN APPEL EXISTANT (NOUVEAU)
    socket.on("call-join", async (data) => {
      const { callId } = data;
      const userId = socket.userId;
      const userName = socket.userName || "Participant";

      const call = activeCallsMap.get(callId);
      
      if (!call) {
        socket.emit("call-error", { error: "Appel introuvable ou terminé" });
        return;
      }

      if (call.status !== "ongoing" && call.status !== "ringing") {
        socket.emit("call-error", { error: "Cet appel n'est plus disponible" });
        return;
      }

      // Ajouter le participant
      call.participants.set(userId, {
        joinedAt: Date.now(),
        status: "connected",
        name: userName,
      });

      // Si c'est le premier à rejoindre, passer à "ongoing"
      if (call.status === "ringing") {
        call.status = "ongoing";
        call.answeredAt = Date.now();
        
        // Annuler le timeout
        const timeout = callTimeouts.get(callId);
        if (timeout) {
          clearTimeout(timeout);
          callTimeouts.delete(callId);
        }

        // Mettre à jour la base
        await Message.findOneAndUpdate(
          { "callDetails.callId": callId },
          {
            "callDetails.status": "ongoing",
            $addToSet: { "callDetails.answeredBy": userId },
          }
        );
      }

      // Notifier l'initiateur
      io.to(call.initiator).emit("call-answered", {
        callId,
        channelName: call.channelName,
        answeredBy: userId,
      });

      // Notifier tous les participants
      call.participants.forEach((_, participantId) => {
        if (participantId !== userId) {
          io.to(participantId).emit("call-participant-joined", {
            callId,
            oduserId: userId,
            userName,
          });
        }
      });

      // Confirmer au participant
      socket.emit("call-joined", {
        callId,
        channelName: call.channelName,
        callType: call.callType,
        isGroup: call.isGroup,
        participantsCount: call.participants.size,
      });

      console.log(`🔗 ${userId} a rejoint l'appel ${callId}`);
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

      // Notifier l'initiateur que l'appel a été répondu
      io.to(call.initiator).emit("call-answered", {
        callId,
        channelName,
        answeredBy: userId,
      });

      // Notifier les autres destinataires (pour les groupes)
      if (call.isGroup && call.targetUserIds) {
        call.targetUserIds.forEach((targetId) => {
          const targetIdStr = targetId.toString();
          if (targetIdStr !== userId && targetIdStr !== call.initiator) {
            io.to(targetIdStr).emit("call-participant-joined", {
              callId,
              oduserId: userId,
            });
          }
        });
      }

      console.log(`✅ Appel ${callId} répondu par ${userId}`);
    });

    // Refuser un appel
    socket.on("call-decline", async (data) => {
      const { callId, reason } = data;
      const userId = socket.userId;

      const call = activeCallsMap.get(callId);
      if (!call) return;

      // Mettre à jour en base
      await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        { $addToSet: { "callDetails.declinedBy": userId } }
      );

      if (!call.isGroup) {
        // P2P: terminer l'appel complètement
        await cleanupCall(callId, "missed", io);

        // Notifier l'initiateur
        io.to(call.initiator).emit("call-declined", {
          callId,
          declinedBy: userId,
          reason: reason || "declined",
        });

        // Notifier celui qui refuse
        io.to(userId).emit("call-ended", {
          callId,
          status: "missed",
        });

        console.log(`❌ Appel P2P ${callId} refusé par ${userId}`);
      } else {
        // GROUPE: Un seul participant refuse
        io.to(userId).emit("call-ended", {
          callId,
          status: "declined",
          reason: reason || "declined",
        });

        // Vérifier si tout le monde a refusé
        const message = await Message.findOne({ "callDetails.callId": callId });
        if (message) {
          const totalTargets = call.targetUserIds?.length || 0;
          const declinedCount = message.callDetails.declinedBy?.length || 0;
          const answeredCount = message.callDetails.answeredBy?.length || 0;

          // Si tous ont refusé et personne n'a répondu
          if (declinedCount >= totalTargets && answeredCount === 0) {
            console.log(`👥 Tout le groupe a refusé l'appel ${callId}`);
            await cleanupCall(callId, "missed", io);
            
            io.to(call.initiator).emit("call-all-declined", {
              callId,
              reason: "all_declined",
            });
          }
        }

        console.log(`❌ Appel groupe ${callId} refusé par ${userId}`);
      }
    });

    // ✅ TERMINER UN APPEL - VERSION AMÉLIORÉE
    socket.on("call-end", async (data) => {
      const { callId } = data;
      const userId = socket.userId;
      const call = activeCallsMap.get(callId);

      if (!call) {
        console.log(`⚠️ Appel ${callId} non trouvé dans activeCallsMap`);
        return;
      }

      const wasRinging = call.status === "ringing";
      const wasOngoing = call.status === "ongoing";
      
      let finalStatus = "missed";
      if (call.answeredAt) {
        finalStatus = "ended";
      }

      if (!call.isGroup) {
        // ===== APPEL P2P =====
        await cleanupCall(callId, finalStatus, io);

        if (wasRinging) {
          // Annuler la sonnerie pour le destinataire
          if (call.targetUserIds) {
            call.targetUserIds.forEach((targetId) => {
              io.to(targetId.toString()).emit("call-cancelled", {
                callId,
                cancelledBy: userId,
                reason: "caller_hangup",
              });
            });
          }

          // Notifier l'initiateur
          io.to(call.initiator).emit("call-ended", {
            callId,
            duration: 0,
            status: "cancelled",
          });
        } else if (wasOngoing) {
          // Notifier tous les participants
          call.participants.forEach((_, participantId) => {
            io.to(participantId).emit("call-ended", {
              callId,
              duration: Math.round((Date.now() - call.answeredAt) / 1000),
              status: finalStatus,
              endedBy: userId,
            });
          });
        }

        console.log(`🛑 Appel P2P ${callId} terminé par ${userId}`);
      } else {
        // ===== APPEL GROUPE =====
        // L'utilisateur quitte mais l'appel continue si d'autres sont présents
        
        const participant = call.participants.get(userId);
        if (participant) {
          participant.status = "left";
          participant.leftAt = Date.now();
          call.participants.delete(userId);
        }

        // Notifier les autres
        call.participants.forEach((_, participantId) => {
          io.to(participantId).emit("call-participant-left", {
            callId,
            oduserId: userId,
          });
        });

        // Compter les participants actifs
        const activeParticipants = Array.from(call.participants.values())
          .filter(p => p.status === "connected");

        console.log(`👥 Participants restants dans ${callId}: ${activeParticipants.length}`);

        // Si plus personne, terminer l'appel
        if (activeParticipants.length === 0) {
          await cleanupCall(callId, finalStatus, io);
          console.log(`🛑 Appel groupe ${callId} terminé - plus de participants`);
        } else {
          // Notifier juste l'utilisateur qui part
          io.to(userId).emit("call-ended", {
            callId,
            status: "left",
            isGroup: true,
          });
        }
      }
    });

    // Participant quitte l'appel (groupe)
    socket.on("call-leave", async (data) => {
      const { callId } = data;
      const userId = socket.userId;

      const call = activeCallsMap.get(callId);
      if (!call) return;

      const participant = call.participants.get(userId);
      if (participant) {
        participant.leftAt = Date.now();
        participant.status = "left";
        call.participants.delete(userId);
      }

      // Notifier les autres
      call.participants.forEach((_, participantId) => {
        io.to(participantId).emit("call-participant-left", {
          callId,
          oduserId: userId,
        });
      });

      // Notifier l'utilisateur qui part
      io.to(userId).emit("call-ended", {
        callId,
        status: "left",
        isGroup: true,
      });

      // Si plus qu'un participant actif, terminer l'appel
      const activeParticipants = Array.from(call.participants.values())
        .filter(p => p.status === "connected");

      if (activeParticipants.length === 0) {
        const duration = call.answeredAt
          ? Math.round((Date.now() - call.answeredAt) / 1000)
          : 0;
          
        await cleanupCall(callId, "ended", io);
        console.log(`🛑 Appel groupe ${callId} terminé - durée: ${duration}s`);
      }
    });

    // ✅ ANNULER UN APPEL (Appelant raccroche avant réponse)
    socket.on("call-cancel", async (data) => {
      const { callId } = data;
      const userId = socket.userId;

      const call = activeCallsMap.get(callId);
      if (!call) return;

      console.log(`📵 Appel ${callId} annulé par ${userId}`);

      // Nettoyer
      await cleanupCall(callId, "cancelled", io);

      // Notifier tous les destinataires
      if (call.targetUserIds) {
        call.targetUserIds.forEach((targetId) => {
          io.to(targetId.toString()).emit("call-cancelled", {
            callId,
            cancelledBy: userId,
            reason: "caller_cancelled",
          });
        });
      }

      // Notifier l'initiateur
      io.to(call.initiator).emit("call-ended", {
        callId,
        status: "cancelled",
        duration: 0,
      });
    });

    // Signaling ICE
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
        activeCallsMap.forEach(async (call, callId) => {
          if (call.participants.has(socket.userId)) {
            const participant = call.participants.get(socket.userId);
            if (participant) {
              participant.status = "disconnected";
              participant.leftAt = Date.now();
            }

            // Notifier les autres participants
            call.participants.forEach((_, participantId) => {
              if (participantId !== socket.userId) {
                io.to(participantId).emit("call-participant-left", {
                  callId,
                  oduserId: socket.userId,
                  reason: "disconnected",
                });
              }
            });

            // Retirer le participant
            call.participants.delete(socket.userId);

            // Si c'était l'initiateur et l'appel sonnait encore
            if (call.initiator === socket.userId && call.status === "ringing") {
              if (call.targetUserIds) {
                call.targetUserIds.forEach((targetId) => {
                  io.to(targetId.toString()).emit("call-cancelled", {
                    callId,
                    cancelledBy: socket.userId,
                    reason: "caller_disconnected",
                  });
                });
              }

              await cleanupCall(callId, "cancelled", io);
            }

            // Si plus personne dans l'appel
            const activeParticipants = Array.from(call.participants.values())
              .filter(p => p.status === "connected");
            
            if (activeParticipants.length === 0 && call.status === "ongoing") {
              await cleanupCall(callId, "ended", io);
            }
          }
        });

        onlineUsers.delete(socket.userId);
        console.log(`❌ User ${socket.userId} déconnecté`);

        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit("online-users-update", onlineUserIds);
      }
    });
  });

  // Heartbeat - Nettoyage des utilisateurs inactifs
  setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 60000;

    onlineUsers.forEach((data, oduserId) => {
      if (now - data.lastSeen > TIMEOUT) {
        onlineUsers.delete(oduserId);
        io.emit("online-users-update", Array.from(onlineUsers.keys()));
      }
    });
  }, 30000);

  // ✅ Nettoyage périodique des appels expirés (sécurité supplémentaire)
  setInterval(() => {
    const now = Date.now();
    
    activeCallsMap.forEach(async (call, callId) => {
      // Appels en sonnerie depuis trop longtemps
      if (call.status === "ringing") {
        const maxTimeout = call.isGroup ? GROUP_CALL_TIMEOUT_MS : P2P_CALL_TIMEOUT_MS;
        if (now - call.initiatedAt > maxTimeout + 5000) { // +5s de marge
          console.log(`🧹 Nettoyage forcé appel expiré: ${callId}`);
          await cleanupCall(callId, "missed", io);
        }
      }
      
      // Appels "ongoing" sans activité depuis 5 minutes
      if (call.status === "ongoing" && call.participants.size === 0) {
        console.log(`🧹 Nettoyage appel vide: ${callId}`);
        await cleanupCall(callId, "ended", io);
      }
    });
  }, 60000);
};

module.exports = initSocket;

// Exporter pour utilisation dans les routes
module.exports.activeCallsMap = activeCallsMap;
module.exports.conversationActiveCallsMap = conversationActiveCallsMap;