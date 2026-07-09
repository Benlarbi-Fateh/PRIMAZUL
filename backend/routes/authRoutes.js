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
const registrationMiddleware = require("../middleware/registrationMiddleware");
const upload = require("../middleware/upload");
const rateLimit = require("../middleware/rateLimiter");

const router = express.Router();

const authRateLimit = rateLimit({
  scope: "auth",
  windowMs: 15 * 60 * 1000,
  max: 30,
});
const otpRateLimit = rateLimit({
  scope: "otp",
  windowMs: 10 * 60 * 1000,
  max: 10,
});
const passwordResetRateLimit = rateLimit({
  scope: "password-reset",
  windowMs: 15 * 60 * 1000,
  max: 8,
});

// 🆕 ROUTES PUBLIQUES - DOUBLE AUTHENTIFICATION
router.post("/register", authRateLimit, register);
router.post("/verify-registration", otpRateLimit, verifyRegistration);
router.post("/verify-login", otpRateLimit, verifyLogin);
router.post("/login", authRateLimit, login);
router.post("/resend-code", otpRateLimit, resendCode);

// 🆕 ROUTES PHOTO DE PROFIL
router.post(
  "/upload-profile-picture",
  registrationMiddleware,
  upload.single("profilePicture"),
  uploadProfilePicture,
);
router.post("/skip-profile-picture", registrationMiddleware, skipProfilePicture);
router.post("/finalize-registration", registrationMiddleware, finalizeRegistration);

// 🆕 ROUTES RÉINITIALISATION MOT DE PASSE
router.post("/forgot-password", passwordResetRateLimit, forgotPassword);
router.post("/verify-reset-code", passwordResetRateLimit, verifyResetCode);
router.post("/reset-password", passwordResetRateLimit, resetPassword);

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
  otpRateLimit,
  requestPasswordChangeOTP,
);

// 3. Vérification du code OTP et changement effectif du mot de passe
router.put(
  "/settings/verify-change-password",
  authMiddleware,
  otpRateLimit,
  verifyAndChangePassword,
);
//  NOUVELLES ROUTES - Changement d'email
router.post("/request-email-change", authMiddleware, otpRateLimit, requestEmailChange);
router.post("/confirm-email-change", authMiddleware, otpRateLimit, confirmEmailChange);

module.exports = router;
