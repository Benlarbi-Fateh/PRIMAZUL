const express = require('express');
const { 
  register, 
  login, 
  verifyRegistration,
  verifyLogin,
  resendCode,
  searchUsers, 
  getUsers 
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🆕 ROUTES PUBLIQUES - DOUBLE AUTHENTIFICATION
router.post("/register", register); // Étape 1 : Créer compte et envoyer code
router.post("/verify-registration", verifyRegistration); // Étape 2 : Vérifier code inscription
router.post("/login", login); // Étape 1 : Vérifier credentials et envoyer code
router.post("/verify-login", verifyLogin); // Étape 2 : Vérifier code connexion
router.post("/resend-code", resendCode); // Renvoyer un code

// ROUTES PROTÉGÉES
router.get("/search", authMiddleware, searchUsers);
router.get("/users", authMiddleware, getUsers);

module.exports = router;