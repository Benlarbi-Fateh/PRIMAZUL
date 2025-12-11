const express = require('express');
const router = express.Router();
const Status = require('../models/Status');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads/status';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Configuration Multer pour stocker les fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ Filtre pour accepter seulement images et vidéos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images et vidéos sont autorisées'));
  }
};

// ✅ Initialiser upload avec limites
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1
  }
});

// ✅ Route pour créer un statut avec upload
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    console.log('📥 Requête création statut reçue:', {
      body: req.body,
      file: req.file,
      user: req.user
    });

    const { type, content } = req.body;
    const user = req.user.id;

    // Validation
    if (!type) {
      return res.status(400).json({ error: 'Type de statut requis' });
    }

    let mediaUrl = null;
    let videoDuration = null;

    // Traitement selon le type
    if (type === 'text') {
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Contenu texte requis' });
      }
    } 
    else if (type === 'image' || type === 'video') {
      if (!req.file) {
        return res.status(400).json({ error: `${type === 'image' ? 'Image' : 'Vidéo'} requise` });
      }
      
      // Construire l'URL du média
      mediaUrl = `/uploads/status/${req.file.filename}`;
      
      // Pour les vidéos, vous pourriez extraire la durée ici
      if (type === 'video') {
        videoDuration = req.body.videoDuration || 0;
      }
    } 
    else {
      return res.status(400).json({ error: 'Type de statut invalide' });
    }

    // Créer le statut
    const status = new Status({
      user,
      type,
      content: type === 'text' ? content.trim() : content || '',
      mediaUrl,
      videoDuration,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });

    await status.save();

    // Populer les données utilisateur
    await status.populate('user', 'name username profilePicture');
    
    console.log('✅ Statut créé avec succès:', status._id);

    res.status(201).json({
      success: true,
      message: 'Statut créé avec succès',
      status: status
    });

  } catch (error) {
    console.error('❌ Erreur création statut:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur suppression fichier:', err);
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la création du statut',
      details: error.message 
    });
  }
});

// ✅ Route pour tester l'upload
router.post('/test-upload', auth, upload.single('media'), (req, res) => {
  console.log('🧪 Test upload:', req.file);
  res.json({
    success: true,
    message: 'Upload test réussi',
    file: req.file
  });
});

// ✅ Route pour récupérer les statuts des amis
router.get('/friends', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer les amis de l'utilisateur
    const user = await User.findById(userId).populate('friends');
    
    const friendIds = user.friends.map(friend => friend._id);
    friendIds.push(userId); // Inclure les propres statuts de l'utilisateur
    
    // Récupérer les statuts non expirés
    const statuses = await Status.find({
      user: { $in: friendIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'name username profilePicture')
    .populate('views.user', 'name username profilePicture')
    .populate('reactions.user', 'name username profilePicture')
    .populate('replies.user', 'name username profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);

    console.log(`📊 ${statuses.length} statuts chargés pour ${req.user.name}`);

    res.json(statuses);
  } catch (error) {
    console.error('❌ Erreur récupération statuts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Route pour marquer un statut comme vu
router.post('/:id/view', auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }
    
    // Vérifier si l'utilisateur a déjà vu ce statut
    const alreadyViewed = status.views.some(
      view => view.user.toString() === req.user.id
    );
    
    if (!alreadyViewed) {
      status.views.push({
        user: req.user.id,
        viewedAt: new Date()
      });
      
      await status.save();
      console.log(`👁️ ${req.user.name} a vu le statut ${status._id}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur marquage vue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Route pour réagir à un statut
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const statusId = req.params.id;
    const userId = req.user.id;
    
    const status = await Status.findById(statusId);
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }
    
    // Supprimer la réaction existante de l'utilisateur
    status.reactions = status.reactions.filter(
      reaction => reaction.user.toString() !== userId
    );
    
    // Ajouter la nouvelle réaction si reactionType n'est pas null
    if (reactionType) {
      status.reactions.push({
        user: userId,
        reaction: reactionType,
        reactedAt: new Date()
      });
    }
    
    await status.save();
    
    // Calculer le résumé des réactions
    const reactionsSummary = {};
    status.reactions.forEach(reaction => {
      reactionsSummary[reaction.reaction] = (reactionsSummary[reaction.reaction] || 0) + 1;
    });
    
    res.json({
      success: true,
      reactionType,
      reactionsSummary,
      totalReactions: status.reactions.length
    });
  } catch (error) {
    console.error('❌ Erreur réaction:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Route pour répondre à un statut
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const statusId = req.params.id;
    const userId = req.user.id;
    
    const status = await Status.findById(statusId);
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }
    
    // Ajouter la réponse
    status.replies.push({
      user: userId,
      message: message.trim(),
      repliedAt: new Date()
    });
    
    await status.save();
    
    // Récupérer l'utilisateur qui a posté le statut
    const statusUser = await User.findById(status.user);
    
    // Créer ou trouver une conversation privée
    let conversation = await Conversation.findOne({
      type: 'private',
      participants: { 
        $all: [userId, status.user],
        $size: 2
      }
    });
    
    // Si pas de conversation, en créer une
    if (!conversation) {
      conversation = new Conversation({
        type: 'private',
        participants: [userId, status.user],
        lastMessage: message,
        lastMessageAt: new Date()
      });
      await conversation.save();
    }
    
    // Mettre à jour la conversation
    conversation.lastMessage = `Réponse à votre statut: ${message}`;
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    res.json({
      success: true,
      repliesCount: status.replies.length,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('❌ Erreur réponse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ✅ Route pour supprimer un statut
router.delete('/:id', auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire
    if (status.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    // Supprimer le fichier média s'il existe
    if (status.mediaUrl) {
      const filePath = path.join(__dirname, '..', status.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await status.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Statut supprimé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;