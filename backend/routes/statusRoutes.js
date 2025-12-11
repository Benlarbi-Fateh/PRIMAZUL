const express = require("express");
const router = express.Router();
const statusController = require("../controllers/statusController");
const auth = require("../middleware/authMiddleware");

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('📁 Fichier reçu:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  if (file.fieldname === 'video') {
    const allowedVideoTypes = [
      'video/mp4', 
      'video/webm', 
      'video/ogg', 
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('❌ Format vidéo non supporté:', file.mimetype);
      cb(new Error(`Format vidéo non supporté: ${file.mimetype}`), false);
    }
  } else if (file.fieldname === 'image') {
    const allowedImageTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif',
      'image/webp'
    ];
    
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.log('❌ Format image non supporté:', file.mimetype);
      cb(new Error(`Format image non supporté: ${file.mimetype}`), false);
    }
  } else {
    cb(new Error('Champ de fichier non reconnu'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1
  }
});

// Routes existantes
router.post("/", 
  auth, 
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), 
  statusController.createStatus
);

router.get("/friends", auth, statusController.getFriendsStatus);
router.get("/my", auth, statusController.getMyStatus);
router.post("/:id/view", auth, statusController.viewStatus);
router.get("/:id/views", auth, statusController.getStatusViews);
router.delete("/:statusId", auth, statusController.deleteStatus);

// 🆕 NOUVELLES ROUTES POUR RÉACTIONS ET RÉPONSES
router.post("/:statusId/react", auth, statusController.reactToStatus);
router.post("/:statusId/reply", auth, statusController.replyToStatus);
router.get("/:statusId/reactions", auth, statusController.getStatusReactions);
router.get("/:statusId/replies", auth, statusController.getStatusReplies);

module.exports = router;