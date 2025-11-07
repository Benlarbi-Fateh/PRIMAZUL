// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/register', register); // Pour créer un compte de test
router.post('/login', login);       // Route principale de ta tâche

module.exports = router;
