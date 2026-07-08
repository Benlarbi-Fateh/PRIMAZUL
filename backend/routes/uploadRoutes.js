const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const router = express.Router();

console.log('🔧 uploadRoutes chargé avec succès');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Dossier uploads créé');
}

// Configuration Multer
const upload = multer({ 
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Vérification fichier:', file.originalname);
    console.log('   Type MIME:', file.mimetype);
    cb(null, true); // Accepter tous les fichiers pour l'instant
  }
});

// Route POST pour upload
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📤 UPLOAD: Nouvelle requête');
    console.log('   User ID:', req.user?.userId || 'Non authentifié');
    console.log('   Timestamp:', new Date().toISOString());

    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      console.log('❌ Aucun fichier dans la requête');
      console.log('   Headers:', JSON.stringify(req.headers, null, 2));
      return res.status(400).json({ 
        error: 'Aucun fichier fourni',
        details: 'Le champ "file" est manquant dans le FormData'
      });
    }

    console.log('✅ Fichier reçu par Multer:');
    console.log('   - Nom original:', req.file.originalname);
    console.log('   - Nom temporaire:', req.file.filename);
    console.log('   - Taille:', (req.file.size / 1024).toFixed(2), 'KB');
    console.log('   - Type MIME:', req.file.mimetype);
    console.log('   - Chemin:', req.file.path);

    // Vérifier que le fichier existe bien
    if (!fs.existsSync(req.file.path)) {
      console.error('❌ Le fichier temporaire n\'existe pas:', req.file.path);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde temporaire' });
    }

    console.log('📤 Upload vers Cloudinary en cours...');
    
    let resourceType = 'auto';
    if (req.file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    }

    // Upload vers Cloudinary avec timeout
    const uploadPromise = cloudinary.uploader.upload(req.file.path, {
      folder: 'whatsapp-clone',
      resource_type: resourceType,
      timeout: 60000 // 60 secondes
    });

    const result = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout Cloudinary (60s)')), 60000)
      )
    ]);

    const uploadTime = Date.now() - startTime;
    console.log(`✅ Upload Cloudinary réussi en ${uploadTime}ms`);
    console.log('   - URL:', result.secure_url);
    console.log('   - Public ID:', result.public_id);
    console.log('   - Format:', result.format);

    // Supprimer le fichier temporaire
    try {
      fs.unlinkSync(req.file.path);
      console.log('🧹 Fichier temporaire supprimé');
    } catch (unlinkError) {
      console.warn('⚠️ Impossible de supprimer le fichier temporaire:', unlinkError.message);
    }

    const response = {
      success: true,
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadTime: uploadTime,
      // 🆕 AJOUT pour compatibilité avec les messages
      fileType: req.file.mimetype,
      videoDuration: result.duration || 0,
      videoThumbnail: result.resource_type === 'video' ? result.secure_url.replace(/\.(mp4|webm|avi|mov)$/, '.jpg') : null
    };

    console.log('✅ Réponse envoyée au client');
    console.log('='.repeat(60) + '\n');
    
    res.json(response);

  } catch (error) {
    const uploadTime = Date.now() - startTime;
    console.error('\n' + '❌'.repeat(30));
    console.error('ERREUR UPLOAD après', uploadTime, 'ms');
    console.error('Type d\'erreur:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Fichier temporaire supprimé après erreur');
      } catch (unlinkError) {
        console.error('❌ Impossible de supprimer le fichier:', unlinkError.message);
      }
    }

    console.error('❌'.repeat(30) + '\n');

    // Réponse d'erreur détaillée
    res.status(500).json({ 
      error: "Erreur serveur", uploadTime: uploadTime
    });
  }
});

// Route de test pour vérifier que l'upload fonctionne
router.get('/test', authMiddleware, (req, res) => {
  res.json({
    message: 'Route upload fonctionnelle',
    user: req.user?.userId,
    cloudinaryConfigured: !!cloudinary.config().cloud_name,
    uploadDirExists: fs.existsSync(uploadDir)
  });
});

module.exports = router;