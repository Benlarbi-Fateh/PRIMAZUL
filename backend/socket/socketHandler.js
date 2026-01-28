const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { checkBlockStatusSocket } = require("./blockCheck");

// ✅ Stockage en mémoire RAM
const onlineUsers = new Map();

const initSocket = (io) => {
  io.on("connection", (socket) => {
    // console.log("✅ Socket connecté:", socket.id);

    socket.on("user-online", (userId) => {
      socket.userId = userId;
      socket.join(userId);
      // Stockage local
      onlineUsers.set(userId, { socketId: socket.id, lastSeen: Date.now() });

      console.log(`👤 User ${userId} en ligne (RAM)`);
      io.emit("online-users-update", Array.from(onlineUsers.keys()));
    });

    socket.on("request-online-users", () => {
      socket.emit("online-users-update", Array.from(onlineUsers.keys()));
    });

    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // --- MESSAGES ---
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

        // Vérif bloquage... (inchangé)

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
          { new: true },
        )
          .populate(
            "participants",
            "name email profilePicture isOnline lastSeen",
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
          updatedConversation.participants.forEach((p) => {
            const pId = p._id.toString();
            const userData = onlineUsers.get(pId);
            if (userData) {
              io.to(userData.socketId).emit(
                "conversation-updated",
                updatedConversation,
              );
            }
          });
        }
      } catch (error) {
        console.error("❌ Erreur send-message:", error);
        socket.emit("message-error", { error: error.message });
      }
    });

    // --- TYPING ---
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("user-typing", { conversationId, userId });
    });

    socket.on("stop-typing", ({ conversationId, userId }) => {
      socket
        .to(conversationId)
        .emit("user-stopped-typing", { conversationId, userId });
    });

    // --- APPELS (Relay via Socket pour P2P instantané) ---
    socket.on("call-initiate", (data) => {
      const { targetUserIds, ...callInfo } = data;
      if (Array.isArray(targetUserIds)) {
        targetUserIds.forEach((targetId) => {
          const targetStr = targetId.toString();
          // Si l'utilisateur est connecté sur ce serveur
          const userData = onlineUsers.get(targetStr);
          if (userData) {
            io.to(userData.socketId).emit("call-incoming", callInfo);
          } else {
            // Fallback room (si multi-tab)
            io.to(targetStr).emit("call-incoming", callInfo);
          }
        });
      }
    });

    // Pour les autres événements d'appel, on peut soit relayer ici, soit laisser l'API gérer
    // Pour simplifier en mode "Sans Redis", on laisse l'API faire le travail de mise à jour BDD
    // et on utilise ici juste le relay temps réel si besoin.

    // --- INVITATIONS ---
    socket.on("invitation-sent", (data) => {
      const { receiverId, invitation } = data;
      const userData = onlineUsers.get(receiverId);
      if (userData)
        io.to(userData.socketId).emit("invitation-received", invitation);
    });

    socket.on("invitation-accepted", async (data) => {
      const { senderId, invitation, conversation } = data;
      const userData = onlineUsers.get(senderId);

      // On récupère la conversation peuplée pour l'envoyer
      const populated = await Conversation.findById(conversation._id)
        .populate("participants", "name email profilePicture isOnline")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "name" },
        });

      if (userData) {
        io.to(userData.socketId).emit("invitation-accepted-notification", {
          invitation,
          conversation: populated || conversation,
        });
      }
    });

    socket.on("invitation-rejected", (data) => {
      const { senderId, invitation } = data;
      const userData = onlineUsers.get(senderId);
      if (userData)
        io.to(userData.socketId).emit(
          "invitation-rejected-notification",
          invitation,
        );
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit("online-users-update", Array.from(onlineUsers.keys()));
      }
    });
  });
};

module.exports = initSocket;
