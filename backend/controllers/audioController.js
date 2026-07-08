const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.sendVoiceMessage = async (req, res) => {
  try {
    console.log('🎤 Réception d\'un message vocal');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier audio fourni' });
    }

    const { conversationId, duration } = req.body;
    const senderId = req.user._id;

    // 🎤 Upload vers Cloudinary en tant qu'audio
    console.log('📤 Upload vers Cloudinary...');
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video', // Cloudinary utilise 'video' pour les audios
      folder: 'whatsapp-clone/voice-messages',
      format: 'mp3' // Conversion automatique en MP3
    });

    console.log('✅ Audio uploadé sur Cloudinary:', result.secure_url);

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    // 💾 Créer le message en base de données
    const message = new Message({
      conversationId,
      sender: senderId,
      type: 'voice',
      voiceUrl: result.secure_url,
      voiceDuration: parseInt(duration) || 0,
      cloudinaryId: result.public_id,
      content: '' // Pas de texte pour les messages vocaux
    });

    await message.save();
    await message.populate('sender', 'name profilePicture');

    // 🔄 Mettre à jour la conversation
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

    console.log('💾 Message vocal sauvegardé:', message._id);

    // 📡 ÉMETTRE VIA SOCKET
    const io = req.app.get('io');
    if (io) {
      // Envoyer le message à la conversation
      io.to(conversationId).emit('receive-message', message);
      
      // Mettre à jour la liste des conversations
      conversation.participants.forEach(participant => {
        io.to(participant._id.toString()).emit('conversation-updated', conversation);
      });
      
      console.log('📡 Message vocal émis via socket');
    }

    res.status(201).json({ 
      success: true, 
      message,
      voiceUrl: result.secure_url
    });

  } catch (error) {
    console.error('❌ Erreur sendVoiceMessage:', error);
    
    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: "Erreur serveur" });
  }
};