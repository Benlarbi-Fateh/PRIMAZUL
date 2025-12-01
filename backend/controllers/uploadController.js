const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const fs = require('fs');

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

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'whatsapp-clone/profile-pictures',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Upload Cloudinary réussi:', result.secure_url);

    fs.unlinkSync(req.file.path);

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

// Ignorer la photo de profil
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

// ✅ NOUVEAU : Upload de fichiers génériques (images, audio, vidéos, documents)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    console.log('📤 Upload fichier:', req.file.originalname);
    console.log('📁 Type:', req.file.mimetype);
    console.log('📦 Taille:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');

    const fileType = req.file.mimetype.split('/')[0]; // image, video, audio, application

    let uploadOptions = {
      folder: 'whatsapp-clone/messages',
      resource_type: 'auto',
    };

    // ✅ Configuration spécifique pour les vidéos
    if (fileType === 'video') {
      uploadOptions = {
        ...uploadOptions,
        resource_type: 'video',
        folder: 'whatsapp-clone/videos',
        chunk_size: 6000000, // Upload par morceaux de 6MB
        eager: [
          { 
            format: 'mp4', 
            transformation: [
              { width: 640, height: 480, crop: 'limit', quality: 'auto' }
            ]
          }
        ],
        eager_async: true, // Transformation asynchrone
      };
    } 
    // Configuration pour les images
    else if (fileType === 'image') {
      uploadOptions = {
        ...uploadOptions,
        resource_type: 'image',
        folder: 'whatsapp-clone/images',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      };
    }
    // Configuration pour l'audio
    else if (fileType === 'audio') {
      uploadOptions = {
        ...uploadOptions,
        resource_type: 'video', // Cloudinary utilise 'video' pour l'audio aussi
        folder: 'whatsapp-clone/audio',
      };
    }

    // Upload vers Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, uploadOptions);

    console.log('✅ Upload Cloudinary réussi');
    console.log('🔗 URL:', result.secure_url);

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: fileType,
      cloudinaryId: result.public_id,
      // ✅ Informations spécifiques pour les vidéos
      ...(fileType === 'video' && {
        duration: result.duration, // Durée en secondes
        width: result.width,
        height: result.height,
        format: result.format
      })
    });

  } catch (error) {
    console.error('❌ Erreur upload fichier:', error);
    
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