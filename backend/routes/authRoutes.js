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
  updateLastLogin,
  requestPasswordChangeOTP,
  verifyAndChangePassword,
  requestEmailChange,
  confirmEmailChange,
} = require("../controllers/authController");
const {
  uploadProfilePicture,
  skipProfilePicture,
} = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// 🆕 ROUTES PUBLIQUES - DOUBLE AUTHENTIFICATION
router.post("/register", register);
router.post("/verify-registration", verifyRegistration);
router.post("/verify-login", verifyLogin);
router.post("/login", login);
router.post("/resend-code", resendCode);

// 🆕 ROUTES PHOTO DE PROFIL
router.post(
  "/upload-profile-picture",
  upload.single("profilePicture"),
  uploadProfilePicture,
);
router.post("/skip-profile-picture", skipProfilePicture);
router.post("/finalize-registration", finalizeRegistration);

// 🆕 ROUTES RÉINITIALISATION MOT DE PASSE
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// 🆕 ROUTE POUR METTRE À JOUR LAST LOGIN
router.put("/update-last-login", authMiddleware, updateLastLogin);

// ROUTES PROTÉGÉES
router.get("/search", authMiddleware, searchUsers);
router.get("/users", authMiddleware, getUsers);

// 🆕 ROUTES POUR LA GESTION DU CHANGEMENT DE MOT DE PASS
// 2. Demande d'envoi du code OTP pour changer le mot de passe
router.post(
  "/settings/send-password-otp",
  authMiddleware,
  requestPasswordChangeOTP,
);

// 3. Vérification du code OTP et changement effectif du mot de passe
router.put(
  "/settings/verify-change-password",
  authMiddleware,
  verifyAndChangePassword,
);
//  NOUVELLES ROUTES - Changement d'email
router.post("/request-email-change", authMiddleware, requestEmailChange);
router.post("/confirm-email-change", authMiddleware, confirmEmailChange);

module.exports = router;
