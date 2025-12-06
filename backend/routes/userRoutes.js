const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const userController = require("../Controllers/userController");

const User = require("../models/User");
const {
  generateVerificationCode,
  sendVerificationEmail
} = require("../utils/emailService");  


// -----------------------------------------------------
// 🔹 Récupérer le profil utilisateur
// -----------------------------------------------------
router.get("/profile", authMiddleware, userController.getUserProfile);


// -----------------------------------------------------
// 🔹 Upload image de profil
// -----------------------------------------------------
router.post(
  "/uploadProfilePicture",
  authMiddleware,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/temp/${req.file.filename}`;

    res.json({ url: fileUrl });
  }
);


// -----------------------------------------------------
// 🔹 Mettre à jour le profil (name / status / photo)
//   ⚠️ L’email ne doit PAS être modifié ici
// -----------------------------------------------------
router.put("/profile", authMiddleware, userController.updateUserProfile);


// -----------------------------------------------------
// 🔹 Étape 1 — Demander un changement d'email
//      → Code envoyé à l’ANCIEN email
// -----------------------------------------------------
router.post("/request-email-change", authMiddleware, async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail)
      return res.status(400).json({ error: "Nouvel email manquant" });

    // 🔹 Récupérer le user
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ error: "Utilisateur introuvable" });

    // 🔹 Générer code
    const code = generateVerificationCode();

    // 🔹 Enregistrer infos de vérification
    user.pendingEmail = newEmail;
    user.emailVerificationCode = code;
    user.emailCodeExpires = Date.now() + 10 * 60 * 1000; // expire dans 10 min

    await user.save();

    // 🔹 ENVOYER LE CODE À L’ANCIEN EMAIL !!!
    await sendVerificationEmail(
      user.email,   // ✅ ancien email
      user.name,
      code,
      "email-change"
    );

    res.json({ message: "Code envoyé à " + user.email });
  } catch (err) {
    console.error("Erreur request-email-change:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// -----------------------------------------------------
// 🔹 Étape 2 — Confirmer le changement d'email
// -----------------------------------------------------
router.post("/confirm-email-change", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ error: "Utilisateur introuvable" });

    // Vérification existante ?
    if (!user.emailVerificationCode)
      return res.status(400).json({ error: "Aucune vérification en cours" });

    // Mauvais code ?
    if (user.emailVerificationCode !== code)
      return res.status(400).json({ error: "Code incorrect" });

    // Expiré ?
    if (Date.now() > user.emailCodeExpires)
      return res.status(400).json({ error: "Code expiré" });

    // 🔹 Appliquer le nouvel email
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailVerificationCode = null;
    user.emailCodeExpires = null;

    await user.save();

    res.json({ success: true, email: user.email });
  } catch (err) {
    console.error("Erreur confirm-email-change:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


module.exports = router;
