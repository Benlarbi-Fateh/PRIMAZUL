const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const initSocket = (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // 🆕 Événement pour marquer un utilisateur en ligne
    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // 🆕 AJOUTER CES LOGS POUR VÉRIFIER
      console.log(`📤 Émission user-online à tous les clients: ${userId}`);
      io.emit('user-online', userId);
      
      console.log(`📤 Émission online-users au socket:`, Array.from(onlineUsers.keys()));
      socket.emit('online-users', Array.from(onlineUsers.keys()));
      
      console.log(`👤 User ${userId} est en ligne (Total en ligne: ${onlineUsers.size})`);
    });

    // Rejoindre une conversation
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
    });

    // Envoyer un message
    socket.on('send-message', async (data) => {
      try {
        console.log('📤 Réception send-message:', data);
        const { conversationId, sender, content, type, fileUrl, fileName, fileSize } = data;

        // Créer le message en base de données
        const message = new Message({
          conversationId,
          sender,
          content: content || '',
          type: type || 'text',
          fileUrl: fileUrl || '',
          fileName: fileName || '',
          fileSize: fileSize || 0
        });

        await message.save();
        
        // Populate le sender AVANT d'émettre
        await message.populate('sender', 'name profilePicture');

        // Mettre à jour la conversation
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

        // Émettre le message à TOUS les participants de la conversation
        io.to(conversationId).emit('receive-message', {
          ...message.toObject(),
          conversationId,
          sender: message.sender
        });

        // Émettre la mise à jour de la conversation
        if (updatedConversation) {
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

    // Événement typing
    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('user-typing', {
        userId: data.userId,
        conversationId: data.conversationId
      });
    });

    // Événement stop-typing
    socket.on('stop-typing', (data) => {
      socket.to(data.conversationId).emit('user-stopped-typing', {
        userId: data.userId,
        conversationId: data.conversationId
      });
    });

    // 🆕 Déconnexion améliorée
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        // 🆕 AJOUTER LES LOGS POUR LA DÉCONNEXION
        console.log(`📤 Émission user-offline à tous les clients: ${socket.userId}`);
        io.emit('user-offline', socket.userId);
        
        console.log(`❌ User ${socket.userId} déconnecté (Total en ligne: ${onlineUsers.size})`);
      } else {
        console.log(`❌ Socket ${socket.id} déconnecté (non authentifié)`);
      }
    });
  });
};

module.exports = initSocket;