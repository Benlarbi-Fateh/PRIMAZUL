const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

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

    const message = new Message({
      conversationId,
      sender: senderId,
      content: content || '',
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize
    });

    await message.save();

    // Mettre à jour la conversation
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

    // Populate le sender du message
    await message.populate('sender', 'name profilePicture');

    // 🆕 ÉMETTRE LE MESSAGE VIA SOCKET
    const io = req.app.get('io');
    if (io) {
      // Envoyer le message à la conversation
      io.to(conversationId).emit('receive-message', message);
      
      // 🆕 ÉMETTRE LA MISE À JOUR DE LA CONVERSATION
      conversation.participants.forEach(participant => {
        io.to(participant._id.toString()).emit('conversation-updated', conversation);
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('❌ Erreur sendMessage:', error);
    res.status(500).json({ error: error.message });
  }
};