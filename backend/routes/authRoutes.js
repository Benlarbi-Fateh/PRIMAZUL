const express = require('express');
const { register, login, searchUsers, getUsers } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Routes publiques
router.post("/register", register);
router.post("/login", login);

// Routes protégées
router.get("/search", authMiddleware, searchUsers);
router.get("/users", authMiddleware, getUsers);

module.exports = router;