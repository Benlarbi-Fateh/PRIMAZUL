const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const upload = require("../middleware/upload");

// GET pour récupérer le profil
router.get('/profile', auth, userController.getUserProfile);
// Upload photo de profil
router.post(
  "/uploadProfilePicture",
  auth,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    // URL accessible depuis le frontend
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/temp/${req.file.filename}`;

    res.json({ url: fileUrl });
  }
);

// PUT pour mettre à jour le profil
router.put('/profile', auth, userController.updateUserProfile);

module.exports = router;
