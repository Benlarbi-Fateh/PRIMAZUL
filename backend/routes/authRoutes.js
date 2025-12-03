const express = require("express");
const {
  register,
  login,
  verifyRegistration,
  verifyLogin,
  resendCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  finalizeRegistration,
  searchUsers,
  getUsers,
} = require("../controllers/authController");
const {
  uploadProfilePicture,
  skipProfilePicture,
} = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// 🆕 ROUTES PUBLIQUES - DOUBLE AUTHENTIFICATION
router.post("/register", register); // Étape 1 : Créer compte et envoyer code
router.post("/verify-registration", verifyRegistration); // Étape 2 : Vérifier code inscription
router.post("/verify-login", verifyLogin); // Étape 2 : Vérifier code connexion
router.post("/login", login); // Étape 1 : Vérifier credentials et envoyer code
router.post("/resend-code", resendCode); // Renvoyer un code

// 🆕 ROUTES PHOTO DE PROFIL (après inscription)
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  uploadProfilePicture
);
router.post("/skip-profile-picture", skipProfilePicture);
router.post("/finalize-registration", finalizeRegistration); // Étape finale après photo

// 🆕 ROUTES RÉINITIALISATION MOT DE PASSE
router.post("/forgot-password", forgotPassword); // Étape 1 : Demander réinitialisation
router.post("/verify-reset-code", verifyResetCode); // Étape 2 : Vérifier code
router.post("/reset-password", resetPassword); // Étape 3 : Nouveau mot de passe

// ROUTES PROTÉGÉES
router.get("/search", authMiddleware, searchUsers);
router.get("/users", authMiddleware, getUsers);

module.exports = router;
