const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const router = express.Router();
const { uploadFile, uploadProfilePicture, skipProfilePicture } = require('../controllers/uploadController');

console.log('🔧 uploadRoutes chargé avec succès');

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});


router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 UPLOAD: Route /api/upload appelée');

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    console.log('📁 Fichier reçu:', req.file.originalname);
    

    let resourceType = 'auto';
if (req.file.mimetype.startsWith('video/')) {
  resourceType = 'video';}

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'whatsapp-clone',
      resource_type: resourceType
    });

    console.log('✅ Fichier uploadé vers Cloudinary');

    fs.unlinkSync(req.file.path);

    res.json({
  success: true,
  fileUrl: result.secure_url,
  fileName: req.file.originalname,
  fileSize: req.file.size,
  fileType: req.file.mimetype, // 🆕 AJOUT
  videoDuration: result.duration || 0, // 🆕 AJOUT
  videoThumbnail: result.resource_type === 'video' ? result.secure_url.replace(/\.(mp4|webm|avi|mov)$/, '.jpg') : null // 🆕 AJOUT
});

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: error.message });
  }
});

module.exports = router;