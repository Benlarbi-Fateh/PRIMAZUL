const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const initSocket = (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('✅ Socket connecté:', socket.id);

    // User se connecte
    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(userId);
      
      console.log(`👤 User ${userId} est en ligne`);
      console.log(`📋 Total utilisateurs en ligne:`, onlineUsers.size);
      
      const onlineUserIds = Array.from(onlineUsers.keys());
      
      // Émettre à tous
      io.emit('online-users-update', onlineUserIds);
      
      // Confirmer individuellement à chaque utilisateur en ligne
      onlineUserIds.forEach(uid => {
        io.to(uid).emit('online-users-update', onlineUserIds);
      });
      
      socket.emit('connection-confirmed', { 
        userId,
        onlineUsers: onlineUserIds
      });
    });

    // Demander la liste des utilisateurs en ligne
    socket.on('request-online-users', () => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('online-users-update', onlineUserIds);
      console.log('📤 Liste des utilisateurs en ligne envoyée:', onlineUserIds);
    });

    // Rejoindre une conversation
    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
      socket.currentConversation = conversationId;
      console.log(`📥 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
      socket.emit('conversation-joined', { conversationId });
    });

    // Quitter une conversation
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
      socket.currentConversation = null;
      console.log(`📤 Socket ${socket.id} a quitté la conversation ${conversationId}`);
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

    // Typing indicators
    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-typing', { conversationId, userId });
    });

    socket.on('stop-typing', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('user-stopped-typing', { conversationId, userId });
    });

    // Refresh conversations
    socket.on('refresh-conversations', (userId) => {
      console.log(`🔄 Demande de refresh conversations pour ${userId}`);
      socket.emit('should-refresh-conversations');
    });

    // ============================================
    // 📨 INVITATIONS - CORRIGÉ POUR INSTANTANÉITÉ
    // ============================================
    
    // Nouvelle invitation envoyée
    socket.on('invitation-sent', (data) => {
      const { receiverId, invitation } = data;
      console.log(`📨 Tentative envoi invitation à ${receiverId}`, onlineUsers);
      
      if (onlineUsers.has(receiverId)) {
        const receiverSocketId = onlineUsers.get(receiverId);
        console.log(`🎯 Utilisateur ${receiverId} trouvé avec socket: ${receiverSocketId}`);
        
        io.to(receiverSocketId).emit('invitation-received', invitation);
        console.log(`📨 Invitation envoyée INSTANTANÉMENT à l'utilisateur ${receiverId}`);
      } else {
        console.log(`⚠️ Utilisateur ${receiverId} hors ligne, invitation stockée seulement`);
      }
    });

    // Invitation acceptée
    socket.on('invitation-accepted', async (data) => {
      try {
        const { senderId, invitation, conversation } = data;
        
        console.log(`✅ Invitation acceptée, envoi à l'expéditeur: ${senderId}`);
        
        // Récupérer la conversation complète avec populate
        const populatedConversation = await Conversation.findById(conversation._id)
          .populate('participants', 'name email profilePicture isOnline lastSeen')
          .populate({
            path: 'lastMessage',
            populate: { path: 'sender', select: 'name profilePicture' }
          });

        console.log('🔥 Conversation peuplée pour envoi:', populatedConversation?._id);

        // Émettre à l'expéditeur SI EN LIGNE
        if (onlineUsers.has(senderId)) {
          const senderSocketId = onlineUsers.get(senderId);
          
          io.to(senderSocketId).emit('invitation-accepted-notification', {
            invitation,
            conversation: populatedConversation || conversation
          });
          
          // Émettre aussi la mise à jour de conversation
          if (populatedConversation) {
            io.to(senderSocketId).emit('conversation-updated', populatedConversation);
          }
          
          console.log(`✅ Notification d'acceptation INSTANTANÉE envoyée à ${senderId}`);
        } else {
          console.log(`⚠️ Expéditeur ${senderId} hors ligne, notification stockée`);
        }

        // Émettre aussi à l'acceptant si en ligne
        const receiverId = invitation.receiver?._id || invitation.receiver;
        if (receiverId && onlineUsers.has(receiverId.toString())) {
          const receiverSocketId = onlineUsers.get(receiverId.toString());
          if (populatedConversation) {
            io.to(receiverSocketId).emit('conversation-updated', populatedConversation);
          }
          console.log(`✅ Conversation ajoutée INSTANTANÉMENT à l'acceptant ${receiverId}`);
        }

      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de la conversation:', error);
      }
    });

    // Invitation refusée
    socket.on('invitation-rejected', (data) => {
      const { senderId, invitation } = data;
      console.log(`❌ Invitation refusée, notification à: ${senderId}`);
      
      if (onlineUsers.has(senderId)) {
        const senderSocketId = onlineUsers.get(senderId);
        io.to(senderSocketId).emit('invitation-rejected-notification', invitation);
        console.log(`❌ Notification de refus INSTANTANÉE envoyée à ${senderId}`);
      } else {
        console.log(`⚠️ Expéditeur ${senderId} hors ligne, notification stockée`);
      }
    });

    // Invitation annulée
    socket.on('invitation-cancelled', (data) => {
      const { receiverId, invitationId } = data;
      console.log(`🗑️ Invitation annulée, notification à: ${receiverId}`);
      
      if (onlineUsers.has(receiverId)) {
        const receiverSocketId = onlineUsers.get(receiverId);
        io.to(receiverSocketId).emit('invitation-cancelled-notification', invitationId);
        console.log(`🗑️ Notification d'annulation INSTANTANÉE envoyée à ${receiverId}`);
      } else {
        console.log(`⚠️ Destinataire ${receiverId} hors ligne, notification stockée`);
      }
    });
    // Dans la connexion Socket.io, ajouter :

// Événements pour les appels
// Dans socketHandler.js - Vérifie call-initiate
// Dans socketHandler.js - call-initiate
socket.on('call-initiate', (data) => {
  const { receiverId, callType, channelName, caller } = data;
  
  console.log(`📞 Appel ${callType} initié vers ${receiverId}`);
  console.log('📞 Données COMPLÈTES reçues:', data); // 🔥 LOG COMPLET
  console.log('📞 Caller reçu:', caller);
  console.log('📞 Caller ID:', caller?.id || caller?._id); // 🔥 Vérifier les deux

  // 🔥 CORRECTION : Vérifier l'ID différemment
  const callerId = caller?.id || caller?._id;
  
  if (!callerId) {
    console.error('❌ ERREUR: Aucun ID trouvé dans caller:', caller);
    // 🔥 ENVOYER QUAND MÊME l'appel sans bloquer
    console.log('⚠️  Envoi quand même l\'appel...');
  }

  if (onlineUsers.has(receiverId)) {
    const receiverSocketId = onlineUsers.get(receiverId);
    
    // 🔥 CORRECTION : Créer un caller complet
    const completeCaller = {
      id: callerId || caller?.id || 'unknown', // 🔥 Toujours avoir un ID
      _id: callerId || caller?._id || 'unknown',
      name: caller?.name || 'Utilisateur',
      profilePicture: caller?.profilePicture || ''
    };
    
    io.to(receiverSocketId).emit('incoming-call', {
      caller: completeCaller, // 🔥 Caller complet
      callType,
      channelName,
      callId: Date.now().toString()
    });
    
    console.log(`📞 Notification d'appel envoyée à ${receiverId}`);
    console.log('📞 Caller envoyé:', completeCaller);
  } else {
    socket.emit('call-receiver-offline', { receiverId });
  }
});
//  Événement call-accepted
socket.on('call-accepted', (data) => {
  const { callerId, channelName, callType } = data;
  
  console.log('🎯 ===== CALL-ACCEPTED REÇU =====');
  console.log('📋 Données:', { callerId, channelName, callType });
  console.log('📋 Utilisateurs en ligne:', Array.from(onlineUsers.keys()));
  console.log('📋 CallerId est en ligne?', onlineUsers.has(callerId));

  if (onlineUsers.has(callerId)) {
    const callerSocketId = onlineUsers.get(callerId);
    console.log('📤 Envoi call-accepted au socket:', callerSocketId);
    
    io.to(callerSocketId).emit('call-accepted', {
      channelName,
      callType,
      acceptedBy: socket.userId
    });
    
    console.log('✅ Notification call-accepted envoyée avec succès');
  } else {
    console.error('❌ ERREUR: Émetteur introuvable dans onlineUsers');
    console.log('❌ CallerId recherché:', callerId);
  }
});
socket.on('call-rejected', (data) => {
  const { callerId } = data;
  console.log(`❌ Appel rejeté, notification à ${callerId}`);

  if (onlineUsers.has(callerId)) {
    const callerSocketId = onlineUsers.get(callerId);
    io.to(callerSocketId).emit('call-rejected');
  }
});

socket.on('call-ended', (data) => {
  const { receiverId, channelName } = data;
  console.log(`📞 Appel terminé sur ${channelName}`);

  if (receiverId && onlineUsers.has(receiverId)) {
    const receiverSocketId = onlineUsers.get(receiverId);
    io.to(receiverSocketId).emit('call-ended');
  }
});

socket.on('call-busy', (data) => {
  const { callerId } = data;
  console.log(`🚗 Utilisateur occupé, notification à ${callerId}`);

  if (onlineUsers.has(callerId)) {
    const callerSocketId = onlineUsers.get(callerId);
    io.to(callerSocketId).emit('call-busy');
  }
});

    // Déconnexion
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        console.log(`❌ User ${socket.userId} déconnecté`);
        console.log(`📋 Utilisateurs restants:`, onlineUsers.size);
        
        const onlineUserIds = Array.from(onlineUsers.keys());
        
        // Émettre à tous
        io.emit('online-users-update', onlineUserIds);
        io.emit('user-disconnected', socket.userId);
        
        // Confirmer individuellement
        onlineUserIds.forEach(uid => {
          io.to(uid).emit('online-users-update', onlineUserIds);
        });
      }
    });
  });

  // Heartbeat : Nettoyer les utilisateurs inactifs
  setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 60000; // 60 secondes
    
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