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