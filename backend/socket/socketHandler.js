// backend/socket/socketHandler.js
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { checkBlockStatusSocket } = require("./blockCheck");

// Stockage mémoire des appels actifs
const activeCallsMap = new Map();
const callTimeouts = new Map();

const initSocket = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("✅ Socket connecté:", socket.id);

    // ============================================
    // 👤 GESTION UTILISATEURS & ROOMS
    // ============================================
    socket.on("user-online", (userId) => {
      if (!userId) return;
      const uidStr = userId.toString();
      onlineUsers.set(uidStr, { socketId: socket.id, lastSeen: Date.now() });
      socket.userId = uidStr;

      // ✅ CRUCIAL : Rejoindre sa room personnelle pour les appels
      socket.join(uidStr);

      console.log(`👤 User ${uidStr} en ligne (${onlineUsers.size} total)`);
      io.emit("online-users-update", Array.from(onlineUsers.keys()));
    });

    socket.on("request-online-users", () => {
      socket.emit("online-users-update", Array.from(onlineUsers.keys()));
    });

    // ============================================
    // 💬 CONVERSATIONS & MESSAGES
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

    socket.on("send-message", async (data) => {
      try {
        const { conversationId, sender } = data;
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

        const message = new Message({ ...data });
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
            if (userData)
              io.to(userData.socketId).emit(
                "conversation-updated",
                updatedConversation
              );
          });
        }
      } catch (error) {
        console.error("❌ Erreur send-message:", error);
        socket.emit("message-error", { error: error.message });
      }
    });

    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("user-typing", { conversationId, userId });
    });

    socket.on("stop-typing", ({ conversationId, userId }) => {
      socket
        .to(conversationId)
        .emit("user-stopped-typing", { conversationId, userId });
    });

    // ============================================
    // 📞 APPELS FUSIONNÉS (STABILITÉ + HISTORIQUE PARFAIT)
    // ============================================

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
      if (!callerId || !Array.isArray(targetUserIds)) return;

      console.log(`📞 Appel ${callId} initié par ${callerId}`);

      // 1. Récupération des données participants (Version 2)
      let allParticipants = [];
      try {
        const User = require("../models/User");
        if (isGroup && conversationId) {
          const conv = await Conversation.findById(conversationId)
            .populate("participants", "_id name profilePicture email")
            .lean();
          if (conv) allParticipants = conv.participants;
        } else {
          const users = await User.find({
            _id: { $in: [callerId, ...targetUserIds] },
          })
            .select("_id name profilePicture email")
            .lean();
          allParticipants = users;
        }
      } catch (err) {
        console.error(err);
      }

      // 2. Stocker en RAM ( Signaling rapide )
      activeCallsMap.set(callId, {
        callId,
        conversationId,
        channelName,
        callType,
        isGroup,
        groupName,
        initiator: callerId,
        initiatedAt: Date.now(),
        participants: new Set([callerId]),
        status: "ringing",
      });

      // 3. Timeout 45s avec mise à jour Historique (Version 1)
      const timeout = setTimeout(async () => {
        const call = activeCallsMap.get(callId);
        if (call && call.status === "ringing") {
          const updatedMessage = await Message.findOneAndUpdate(
            { "callDetails.callId": callId },
            {
              "callDetails.status": "missed",
              "callDetails.endedAt": new Date(),
              "callDetails.duration": 0,
            },
            { new: true }
          ).populate("sender", "name profilePicture");

          if (updatedMessage)
            io.to(conversationId).emit("receive-message", updatedMessage);
          io.to(callerId).emit("call-timeout", { callId });
          targetUserIds.forEach((id) =>
            io.to(id.toString()).emit("call-missed", { callId, callerId })
          );
          activeCallsMap.delete(callId);
        }
      }, 45000);
      callTimeouts.set(callId, timeout);

      // 4. Envoi vers les ROOMS des destinataires (Version 2)
      targetUserIds.forEach((targetId) => {
        const targetIdStr = targetId.toString();
        if (targetIdStr === callerId) return;

        io.to(targetIdStr).emit("call-incoming", {
          ...data,
          from: {
            userId: callerId,
            name: callerName,
            profilePicture: callerImage,
          },
          participants: allParticipants, // UI enrichie
        });
      });
    });

    socket.on("call-answer", async ({ callId, channelName }) => {
      const call = activeCallsMap.get(callId);
      if (!call) return;

      const userId = socket.userId;
      call.participants.add(userId);
      call.status = "ongoing";

      if (callTimeouts.has(callId)) {
        clearTimeout(callTimeouts.get(callId));
        callTimeouts.delete(callId);
      }

      // Notifier les autres du nouveau participant
      const User = require("../models/User");
      const newParticipant = await User.findById(userId)
        .select("_id name profilePicture email")
        .lean();

      call.participants.forEach((pid) => {
        if (pid !== userId) {
          io.to(pid).emit("call-answered", {
            callId,
            newParticipant,
            answeredBy: userId,
          });
        }
      });

      // Update DB
      await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        {
          "callDetails.status": "ongoing",
          "callDetails.startedAt": new Date(),
          $addToSet: { "callDetails.answeredBy": userId },
        }
      );

      io.to(call.initiator).emit("call-answered", {
        callId,
        channelName,
        answeredBy: userId,
      });
    });

    socket.on("call-decline", async ({ callId, reason }) => {
      const call = activeCallsMap.get(callId);
      if (!call) return;

      io.to(call.initiator).emit("call-declined", {
        callId,
        declinedBy: socket.userId,
        reason,
      });

      if (!call.isGroup) {
        const updatedMessage = await Message.findOneAndUpdate(
          { "callDetails.callId": callId },
          {
            "callDetails.status": "missed",
            "callDetails.endedAt": new Date(),
            "callDetails.duration": 0,
          },
          { new: true }
        ).populate("sender", "name profilePicture");

        if (updatedMessage)
          io.to(call.conversationId).emit("receive-message", updatedMessage);
        activeCallsMap.delete(callId);
      }
    });

    socket.on("call-end", async ({ callId }) => {
      const call = activeCallsMap.get(callId);
      if (!call) return;

      const duration = Math.round(
        (Date.now() - (call.initiatedAt || Date.now())) / 1000
      );
      const finalStatus = call.status === "ongoing" ? "ended" : "missed";

      const updatedMessage = await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        {
          "callDetails.status": finalStatus,
          "callDetails.endedAt": new Date(),
          "callDetails.duration": duration,
        },
        { new: true }
      ).populate("sender", "name profilePicture");

      if (updatedMessage)
        io.to(call.conversationId).emit("receive-message", updatedMessage);

      call.participants.forEach((pid) =>
        io.to(pid).emit("call-ended", { callId, status: finalStatus })
      );
      activeCallsMap.delete(callId);
    });

    socket.on("call-leave", async ({ callId }) => {
      const call = activeCallsMap.get(callId);
      if (!call) return;

      const userId = socket.userId;
      call.participants.delete(userId);
      call.participants.forEach((pid) =>
        io.to(pid).emit("call-participant-left", { callId, userId })
      );

      if (call.participants.size <= 1) {
        socket.emit("call-end", { callId });
      }
    });

    // ============================================
    // 😊 RÉACTIONS & 📨 INVITATIONS & 🗑️ ACTIONS
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
          if (message.reactions[existingIndex].emoji === emoji)
            message.reactions.splice(existingIndex, 1);
          else message.reactions[existingIndex].emoji = emoji;
        } else {
          message.reactions.push({ userId, emoji });
        }
        await message.save();
        await message.populate("reactions.userId", "name profilePicture");
        io.to(conversationId).emit("reaction-updated", {
          messageId: message._id,
          reactions: message.reactions,
        });
      } catch (e) {
        console.error(e);
      }
    });

    socket.on("invitation-sent", (data) => {
      const userData = onlineUsers.get(data.receiverId);
      if (userData)
        io.to(userData.socketId).emit("invitation-received", data.invitation);
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
        io.to(userData.socketId).emit(
          "conversation-updated",
          populatedConversation || conversation
        );
      }
    });

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

    socket.on("disconnect", () => {
      if (socket.userId) {
        activeCallsMap.forEach((call, callId) => {
          if (call.participants.has(socket.userId)) {
            io.to(call.initiator).emit("call-participant-left", {
              callId,
              userId: socket.userId,
            });
          }
        });
        onlineUsers.delete(socket.userId);
        io.emit("online-users-update", Array.from(onlineUsers.keys()));
      }
    });
  });

  setInterval(() => {
    const now = Date.now();
    onlineUsers.forEach((data, userId) => {
      if (now - data.lastSeen > 60000) {
        onlineUsers.delete(userId);
        io.emit("online-users-update", Array.from(onlineUsers.keys()));
      }
    });
  }, 30000);
};

module.exports = initSocket;
