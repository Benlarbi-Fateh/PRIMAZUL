const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Status = require('../models/Status'); // 🆕 AJOUT

const initSocket = (io) => {
  const onlineUsers = new Map();
  const statusWatchers = new Map(); // 🆕 Suivre qui regarde quelle story

  io.on('connection', (socket) => {
    console.log('✅ Socket connecté:', socket.id);

    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);
      
      console.log(`👤 User ${userId} est en ligne`);
      
      const onlineUserIds = Array.from(onlineUsers.keys());
      
      io.emit('online-users-update', onlineUserIds);
      
      onlineUserIds.forEach(uid => {
        io.to(uid).emit('online-users-update', onlineUserIds);
      });
      
      socket.emit('connection-confirmed', { 
        userId,
        onlineUsers: onlineUserIds
      });
    });

    socket.on('request-online-users', () => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('online-users-update', onlineUserIds);
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

    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      socket.currentConversation = conversationId;
      console.log(`📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
      socket.emit('conversation-joined', { conversationId });
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
      socket.currentConversation = null;
      console.log(`📤 Socket ${socket.id} a quitté la conversation ${conversationId}`);
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

        io.to(conversationId).emit('receive-message', {
          ...message.toObject(),
          conversationId,
          sender: message.sender
        });

        if (updatedConversation) {
          updatedConversation.participants.forEach(participant => {
            const participantId = participant._id.toString();
            if (onlineUsers.has(participantId)) {
              io.to(onlineUsers.get(participantId)).emit('conversation-updated', updatedConversation);
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
        }

      } catch (error) {
        console.error('❌ Erreur send-message:', error);
        socket.emit('message-error', { error: error.message });
      }
    });

    // 🆕 ÉVÉNEMENT POUR LES RÉACTIONS AUX STORIES
    socket.on('status-react', async (data) => {
      try {
        const { statusId, userId, reactionType } = data;
        console.log('🎭 Réaction socket:', { statusId, userId, reactionType });

        // Émettre à tous ceux qui regardent cette story
        io.to(`status-${statusId}`).emit('status-reaction-update', {
          statusId,
          userId,
          reactionType,
          timestamp: new Date()
        });

        // Notifier le propriétaire de la story
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

    // 🆕 ÉVÉNEMENT POUR LES RÉPONSES AUX STORIES
    socket.on('status-reply', async (data) => {
      try {
        const { statusId, userId, message } = data;
        console.log('💬 Réponse socket:', { statusId, userId, message });

        // Émettre à tous ceux qui regardent cette story
        io.to(`status-${statusId}`).emit('status-reply-update', {
          statusId,
          userId,
          message,
          timestamp: new Date()
        });

        // Notifier le propriétaire de la story
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

    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-typing', { conversationId, userId });
    });

    socket.on('stop-typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-stopped-typing', { conversationId, userId });
    });

    socket.on('refresh-conversations', (userId) => {
      console.log(`🔄 Demande de refresh conversations pour ${userId}`);
      socket.emit('should-refresh-conversations');
    });

    socket.on('invitation-sent', (data) => {
      const { receiverId, invitation } = data;
      
      if (onlineUsers.has(receiverId)) {
        const receiverSocketId = onlineUsers.get(receiverId);
        io.to(receiverSocketId).emit('invitation-received', invitation);
      }
    });

    socket.on('invitation-accepted', async (data) => {
      try {
        const { senderId, invitation, conversation } = data;
        
        const populatedConversation = await Conversation.findById(conversation._id)
          .populate('participants', 'name email profilePicture isOnline lastSeen')
          .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name profilePicture' }
          });

        if (onlineUsers.has(senderId)) {
          const senderSocketId = onlineUsers.get(senderId);
          io.to(senderSocketId).emit('invitation-accepted-notification', {
            invitation,
            conversation: populatedConversation || conversation
          });
          
          if (populatedConversation) {
            io.to(senderSocketId).emit('conversation-updated', populatedConversation);
          }
        }

        const receiverId = invitation.receiver?._id || invitation.receiver;
        if (receiverId && onlineUsers.has(receiverId.toString())) {
          const receiverSocketId = onlineUsers.get(receiverId.toString());
          if (populatedConversation) {
            io.to(receiverSocketId).emit('conversation-updated', populatedConversation);
          }
        }

      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de la conversation:', error);
      }
    });

    socket.on('invitation-rejected', (data) => {
      const { senderId, invitation } = data;
      
      if (onlineUsers.has(senderId)) {
        const senderSocketId = onlineUsers.get(senderId);
        io.to(senderSocketId).emit('invitation-rejected-notification', invitation);
      }
    });

    socket.on('invitation-cancelled', (data) => {
      const { receiverId, invitationId } = data;
      
      if (onlineUsers.has(receiverId)) {
        const receiverSocketId = onlineUsers.get(receiverId);
        io.to(receiverSocketId).emit('invitation-cancelled-notification', invitationId);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        console.log(`❌ User ${socket.userId} déconnecté`);
        
        const onlineUserIds = Array.from(onlineUsers.keys());
        
        io.emit('online-users-update', onlineUserIds);
        io.emit('user-disconnected', socket.userId);
        
        onlineUserIds.forEach(uid => {
          io.to(uid).emit('online-users-update', onlineUserIds);
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
  });

  setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 60000;
    
    onlineUsers.forEach((data, userId) => {
      if (now - data.lastSeen > TIMEOUT) {
        console.log(`⏰ Timeout pour user ${userId}`);
        onlineUsers.delete(userId);
        
        const onlineUserIds = Array.from(onlineUsers.keys());
        io.emit('online-users-update', onlineUserIds);
      }
    });
  }, 30000);
};

module.exports = initSocket;