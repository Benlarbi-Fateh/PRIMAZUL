const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Upload de la photo de profil
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId manquant' });
    }

    console.log('📤 Upload en cours pour userId:', userId);
    console.log('📁 Fichier:', req.file.path);

let resourceType = 'auto';
if (req.file.mimetype.startsWith('video/')) {
  resourceType = 'video';
}
    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'whatsapp-clone/profile-pictures',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Upload Cloudinary réussi:', result.secure_url);

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.secure_url },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    console.log('✅ Photo de profil mise à jour pour:', user.email);

    res.json({
      success: true,
      message: 'Photo de profil uploadée avec succès',
      profilePicture: result.secure_url,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('❌ Erreur upload photo:', error);
    
    // Supprimer le fichier temporaire en cas d'erreur
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur suppression fichier temp:', unlinkError);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

// Ignorer la photo de profil (garder les initiales)
exports.skipProfilePicture = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId manquant' });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    console.log('✅ Photo de profil ignorée pour:', user.email);

    res.json({
      success: true,
      message: 'Photo de profil ignorée',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || ""
      }
    });
  } catch (error) {
    console.error('❌ Erreur skip photo:', error);
    res.status(500).json({ error: error.message });
  }
};
// Configuration Multer pour les fichiers de messages
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMessage = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|mp4|webm|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
}).single('file');

// Upload de fichier pour les messages
exports.uploadFile = async (req, res) => {
  try {
    uploadMessage(req, res, async (err) => {
      if (err) {
        console.error('❌ Erreur Multer:', err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé' });
      }

      const file = req.file;
      const filePath = file.path;

      console.log('📁 Fichier reçu:', file.originalname, '| Type:', file.mimetype);

      let resourceType = 'auto';
      if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.mimetype.startsWith('audio/')) {
        resourceType = 'video';
      } else {
        resourceType = 'raw';
      }

      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: 'whatsapp-clone/messages',
        quality: 'auto',
        fetch_format: 'auto'
      });

      console.log('✅ Upload Cloudinary réussi:', result.secure_url);

      fs.unlinkSync(filePath);

      res.json({
        success: true,
        fileUrl: result.secure_url,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        cloudinaryId: result.public_id,
        videoDuration: result.duration || 0,
        videoThumbnail: result.resource_type === 'video' ? result.secure_url.replace(/\.(mp4|webm|avi|mov)$/, '.jpg') : null
      });
    });
  } catch (error) {
    console.error('❌ Erreur uploadFile:', error);
    res.status(500).json({ error: error.message });
  }
};