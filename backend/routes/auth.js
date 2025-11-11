// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login,forgotPassword, verifyCode,resetPassword} = require ('../controllers/authcontroller');

router.post('/register', register); // Pour créer un compte de test
router.post('/login', login);       // Route principale de ta tâche
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);
module.exports = router;
