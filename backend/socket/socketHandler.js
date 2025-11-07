const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const initSocket = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      io.emit('user-status', { userId, isOnline: true });
      console.log(`👤 User ${userId} est en ligne`);
    });

    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
    });

    socket.on('send-message', async (data) => {
      try {
        console.log('📤 Réception send-message:', data);
        const { conversationId, sender, content, type, fileUrl, fileName, fileSize } = data;

        // 🚀 CORRECTION : Créer le message en base de données
        const message = new Message({
          conversationId,
          sender, // 🚀 Utiliser le sender du socket
          content: content || '',
          type: type || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0
        });

        await message.save();
        
        // 🚀 CORRECTION : Populate le sender AVANT d'émettre
        await message.populate('sender', 'name profilePicture');

        // 🚀 CORRECTION : Mettre à jour la conversation
        const updatedConversation = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            lastMessage: message._id,
            updatedAt: Date.now()
          },
          { new: true }
        )
        .populate('participants', 'name email profilePicture isOnline lastSeen')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name' }
        });

        console.log('💾 Message sauvegardé en base:', message._id);

        // 🚀 CORRECTION : Émettre le message à TOUS les participants
        io.to(conversationId).emit('receive-message', {
          ...message.toObject(),
          // S'assurer que toutes les données sont présentes
          conversationId,
          sender: message.sender
        });

        // 🚀 CORRECTION : Émettre la mise à jour de la conversation
        if (updatedConversation) {
          // Émettre à tous les participants en ligne
          updatedConversation.participants.forEach(participant => {
            const participantId = participant._id.toString();
            if (onlineUsers.has(participantId)) {
              io.to(onlineUsers.get(participantId)).emit('conversation-updated', updatedConversation);
            }
          });
          console.log('📢 Conversation mise à jour envoyée aux participants');
        }

      } catch (error) {
        console.error('❌ Erreur send-message:', error);
        socket.emit('message-error', { error: error.message });
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('user-typing', {
        userId: data.userId,
        conversationId: data.conversationId
      });
    });

    socket.on('stop-typing', (data) => {
      socket.to(data.conversationId).emit('user-stopped-typing', {
        userId: data.userId,
        conversationId: data.conversationId
      });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user-status', { userId: socket.userId, isOnline: false });
        console.log(`❌ User ${socket.userId} déconnecté`);
      }
    });
  });
};

module.exports = initSocket;