// routes/statusRoutes.js - VERSION COMPLETE ET CORRIGÉE
const express = require('express');
const router = express.Router();
const Status = require('../models/Status');
const User = require('../models/User');
const Contact = require('../models/Contact');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads/status';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Dossier créé: ${uploadDir}`);
}

// ✅ Configuration Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = 'status-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

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

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1
  }
});

// ============================================
// 🧪 ROUTES DE TEST
// ============================================

// Route de test publique
router.get('/test', (req, res) => {
  console.log('🧪 Route test appelée');
  res.json({ 
    success: true, 
    message: 'API Status fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Route de test avec auth
router.get('/test-auth', auth, (req, res) => {
  console.log('🧪 Route test-auth appelée pour:', req.user.name);
  res.json({ 
    success: true, 
    user: {
      id: req.user._id,
      name: req.user.name
    },
    message: 'Authentification réussie'
  });
});

// ============================================
// 📤 CRÉATION DE STATUT
// ============================================

router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    console.log('📥 Création statut - Données reçues:');
    console.log('- Body:', req.body);
    console.log('- File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'Aucun fichier');
    console.log('- User:', req.user._id, req.user.name);

    const { type, content } = req.body;
    const userId = req.user._id;

    // Validation du type
    if (!type || !['text', 'image', 'video'].includes(type)) {
      return res.status(400).json({ 
        error: 'Type de statut invalide',
        validTypes: ['text', 'image', 'video']
      });
    }

    let statusData = {
      userId,
      type,
      reactionsSummary: {
        total: 0,
        like: 0, love: 0, haha: 0, wow: 0,
        sad: 0, angry: 0, fire: 0, clap: 0
      },
      repliesCount: 0,
      views: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    };

    // Traitement selon le type
    if (type === 'text') {
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Contenu texte requis' });
      }
      statusData.content = content.trim();
    } 
    else if (type === 'image' || type === 'video') {
      if (!req.file) {
        return res.status(400).json({ error: `${type === 'image' ? 'Image' : 'Vidéo'} requise` });
      }
      
      statusData.mediaUrl = `/uploads/status/${req.file.filename}`;
      statusData.fileSize = req.file.size;
      statusData.mimeType = req.file.mimetype;
      
      if (content && content.trim()) {
        statusData.content = content.trim();
      }
      
      if (type === 'video') {
        statusData.videoDuration = req.body.videoDuration || 0;
      }
    }

    // Créer le statut
    const status = new Status(statusData);
    await status.save();

    // Peupler les données utilisateur
    await status.populate('userId', 'name username profilePicture');
    
    console.log('✅ Statut créé avec succès:', status._id);

    res.status(201).json({
      success: true,
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

// ============================================
// 📊 RÉCUPÉRATION DES STATUTS
// ============================================

router.get('/friends', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`📊 Récupération statuts pour user: ${userId} (${req.user.name})`);

    // Version 1: Récupérer TOUS les statuts non expirés (simplifié pour test)
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name username profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);

    console.log(`✅ ${statuses.length} statuts trouvés`);

    // Version 2: Avec les amis (décommentez quand prêt)
    /*
    // Récupérer les contacts de l'utilisateur
    const contacts = await Contact.find({ 
      owner: userId,
      isBlocked: false 
    }).select('contact');
    
    const contactIds = contacts.map(contact => contact.contact);
    const allUserIds = [...contactIds, userId];
    
    const statuses = await Status.find({ 
      userId: { $in: allUserIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name username profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);
    */

    res.json(statuses);

  } catch (error) {
    console.error('❌ Erreur récupération statuts:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Récupérer mes propres statuts
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const statuses = await Status.find({
      userId,
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name username profilePicture')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      statuses,
      total: statuses.length
    });
  } catch (error) {
    console.error('❌ Erreur mes statuts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// 👁️ VUES DES STATUTS
// ============================================

router.post('/:id/view', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    const userId = req.user._id;
    
    console.log(`👁️ User ${userId} voit le statut ${statusId}`);

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    // Vérifier si déjà vu
    const alreadyViewed = status.views.some(
      view => view.userId && view.userId.toString() === userId.toString()
    );
    
    if (!alreadyViewed) {
      status.views.push({
        userId,
        viewedAt: new Date()
      });
      await status.save();
      console.log(`✅ Vue ajoutée pour le statut ${statusId}`);
    } else {
      console.log(`ℹ️ Déjà vu le statut ${statusId}`);
    }

    res.json({ 
      success: true,
      viewedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Erreur marquage vue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les vues d'un statut
router.get('/:id/views', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    const userId = req.user._id;
    
    const status = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture');
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const views = status.views.map(view => ({
      userId: view.userId?._id,
      userName: view.userId?.name,
      userProfile: view.userId?.profilePicture,
      viewedAt: view.viewedAt,
      reaction: view.reaction
    }));

    res.json({
      success: true,
      views,
      total: views.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération vues:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// 🎭 RÉACTIONS AUX STATUTS
// ============================================

router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const statusId = req.params.id;
    const userId = req.user._id;
    
    console.log(`🎭 Réaction ${reactionType || 'retirée'} au statut ${statusId} par ${userId}`);

    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap', null];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ 
        error: 'Réaction invalide',
        validReactions: ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap']
      });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    // Gérer la réaction
    if (reactionType) {
      await status.addOrUpdateReaction(userId, reactionType);
    } else {
      await status.removeReaction(userId);
    }

    const updatedStatus = await Status.findById(statusId);
    
    res.json({
      success: true,
      reactionType,
      reactionsSummary: updatedStatus.reactionsSummary,
      totalReactions: updatedStatus.reactionsSummary.total
    });
  } catch (error) {
    console.error('❌ Erreur réaction:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les réactions d'un statut
router.get('/:id/reactions', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    
    const status = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture');
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    const reactions = status.views
      .filter(view => view.reaction)
      .map(view => ({
        userId: view.userId?._id,
        userName: view.userId?.name,
        userProfile: view.userId?.profilePicture,
        reaction: view.reaction,
        viewedAt: view.viewedAt
      }));

    res.json({
      success: true,
      reactions,
      total: reactions.length,
      reactionsSummary: status.reactionsSummary
    });
  } catch (error) {
    console.error('❌ Erreur récupération réactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// 💬 RÉPONSES AUX STATUTS
// ============================================

router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const statusId = req.params.id;
    const userId = req.user._id;
    
    console.log(`💬 Réponse au statut ${statusId} par ${userId}:`, message?.substring(0, 50));

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message requis' });
    }

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    // Ajouter la réponse
    await status.addReply(userId, message.trim());
    
    const updatedStatus = await Status.findById(statusId);

    res.json({
      success: true,
      message: 'Réponse envoyée',
      repliesCount: updatedStatus.repliesCount
    });
  } catch (error) {
    console.error('❌ Erreur réponse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les réponses d'un statut
router.get('/:id/replies', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    
    const status = await Status.findById(statusId)
      .populate('views.userId', 'name profilePicture');
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    const replies = status.views
      .filter(view => view.replyMessage)
      .map(view => ({
        userId: view.userId?._id,
        userName: view.userId?.name,
        userProfile: view.userId?.profilePicture,
        message: view.replyMessage,
        viewedAt: view.viewedAt
      }));

    res.json({
      success: true,
      replies,
      total: replies.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// 🗑️ SUPPRESSION DE STATUT
// ============================================

router.delete('/:id', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    const userId = req.user._id;
    
    console.log(`🗑️ Tentative suppression statut ${statusId} par ${userId}`);

    const status = await Status.findById(statusId);
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire
    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    // Supprimer le fichier média s'il existe
    if (status.mediaUrl) {
      const filePath = path.join(__dirname, '..', status.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Fichier supprimé: ${filePath}`);
      }
    }
    
    await status.deleteOne();
    console.log(`✅ Statut ${statusId} supprimé`);

    res.json({ 
      success: true, 
      message: 'Statut supprimé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// 🔍 STATUT SPÉCIFIQUE
// ============================================

router.get('/:id', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    
    const status = await Status.findById(statusId)
      .populate('userId', 'name username profilePicture')
      .populate('views.userId', 'name profilePicture');
    
    if (!status) {
      return res.status(404).json({ error: 'Statut non trouvé' });
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ Erreur récupération statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// 📱 TÉLÉCHARGEMENT TEST
// ============================================

router.post('/test-upload', auth, upload.single('media'), (req, res) => {
  try {
    console.log('🧪 Test upload réussi:');
    console.log('- File:', req.file);
    console.log('- Body:', req.body);
    
    res.json({
      success: true,
      message: 'Upload test réussi',
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      } : null,
      body: req.body
    });
  } catch (error) {
    console.error('❌ Erreur test upload:', error);
    res.status(500).json({ error: 'Erreur test upload' });
  }
});

module.exports = router;