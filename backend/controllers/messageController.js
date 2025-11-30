const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');


exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type, fileUrl, fileName, fileSize } = req.body;
    const senderId = req.user._id;


        const convCheck = await Conversation.findById(conversationId)
      .populate('participants', '_id')
      .lean();


    if (!convCheck) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }


    // verification de blockage avant envoi
    if (!convCheck.isGroup) {
      const otherParticipant = convCheck.participants.find(
        p => p._id.toString() !== senderId.toString()
      );


      if (otherParticipant) {
        const blockExists = await BlockedUser.findOne({
          $or: [
            { userId: senderId, blockedUserId: otherParticipant._id },
            { userId: otherParticipant._id, blockedUserId: senderId }
          ]
        });


        if (blockExists) {
          console.log('🚫 Message bloqué - relation bloquée détectée');
          return res.status(403).json({
            success: false,
            message: 'Impossible d\'envoyer - Utilisateur bloqué',
            blocked: true
          });
        }
      }
    }


    const message = new Message({
      conversationId,
      sender: senderId,
      content: content || '',
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      status: 'sent'
    });


    await message.save();


    const conversation = await Conversation.findByIdAndUpdate(
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


    await message.populate('sender', 'name profilePicture');


    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive-message', message);
     
      conversation.participants.forEach(participant => {
        const participantId = participant._id.toString();
        io.to(participantId).emit('conversation-updated', conversation);
        io.to(participantId).emit('should-refresh-conversations');
      });
    }


    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('❌ Erreur sendMessage:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.markAsDelivered = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;


    console.log('📬 Marquage comme délivré:', messageIds);


    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        sender: { $ne: userId },
        status: 'sent'
      },
      {
        $set: { status: 'delivered' }
      }
    );


    console.log(`✅ ${result.modifiedCount} messages marqués comme délivrés`);


    const io = req.app.get('io');
    if (io && result.modifiedCount > 0) {
      const updatedMessages = await Message.find({
        _id: { $in: messageIds }
      }).select('sender conversationId').lean();


      const senderIds = new Set();
      const conversationIds = new Set();
     
      updatedMessages.forEach(msg => {
        senderIds.add(msg.sender.toString());
        conversationIds.add(msg.conversationId.toString());
      });


      senderIds.forEach(senderId => {
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'delivered'
        });
      });


      conversationIds.forEach(convId => {
        io.to(convId).emit('conversation-status-updated', {
          conversationId: convId,
          status: 'delivered'
        });
      });
    }


    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('❌ Erreur markAsDelivered:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;


    console.log('👁️ Marquage comme lu pour conversation:', conversationId, 'par user:', userId);


    const messagesToUpdate = await Message.find({
      conversationId,
      sender: { $ne: userId },
      status: { $ne: 'read' }
    }).select('_id sender').lean();


    const messageIds = messagesToUpdate.map(m => m._id);


    if (messageIds.length === 0) {
      console.log('✅ Aucun message à marquer comme lu');
      return res.json({ success: true, modifiedCount: 0 });
    }


    // Vérifier si l'utilisateur est réellement dans la conversation
    const io = req.app.get('io');
    const sockets = await io.in(conversationId).fetchSockets();
    const userIsInConversation = sockets.some(s => s.userId === userId.toString());


    if (!userIsInConversation) {
      console.log('⚠️ User pas dans la conversation, on ne marque PAS comme lu');
      return res.json({ success: true, modifiedCount: 0 });
    }


    const result = await Message.updateMany(
      {
        _id: { $in: messageIds }
      },
      {
        $set: { status: 'read' }
      }
    );


    console.log(`✅ ${result.modifiedCount} messages marqués comme lus`);


    if (io && result.modifiedCount > 0) {
      const senderIds = [...new Set(messagesToUpdate.map(m => m.sender.toString()))];


      senderIds.forEach(senderId => {
        io.to(senderId).emit('message-status-updated', {
          messageIds,
          status: 'read',
          conversationId
        });
        io.to(senderId).emit('should-refresh-conversations');
      });


      io.to(conversationId).emit('conversation-status-updated', {
        conversationId,
        status: 'read'
      });


      // 🆕 ÉVÉNEMENT CRITIQUE : Notifier immédiatement TOUS les participants
      // que cette conversation a été lue par userId
      const conversation = await Conversation.findById(conversationId)
        .select('participants')
        .lean();
     
      if (conversation) {
        conversation.participants.forEach(participantId => {
          const pId = participantId.toString();
          io.to(pId).emit('conversation-read', { conversationId });
          console.log(`✅ Émission conversation-read à ${pId}`);
        });
      }
    }


    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('❌ Erreur markAsRead:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;


    const unreadCounts = await Message.aggregate([
      {
        $match: {
          sender: { $ne: userId },
          status: { $ne: 'read' }
        }
      },
      {
        $group: {
          _id: '$conversationId',
          count: { $sum: 1 }
        }
      }
    ]);


    const result = {};
    unreadCounts.forEach(item => {
      result[item._id] = item.count;
    });


    res.json({ success: true, unreadCounts: result });
  } catch (error) {
    console.error('❌ Erreur getUnreadCount:', error);
    res.status(500).json({ error: error.message });
  }
};
