const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// POST /api/register - Inscription
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    //  Validation des champs requis
    if (!username || !email || !password || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires (username, email, password,phoneNumber)'
      });
    }

    //  Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    //  Validation de la longueur du username
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères'
      });
    }

    //  Validation de la force du mot de passe
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    //  Vérifier si l'email existe déjà
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cet email'
      });
    }

    // verifier si username exist deja 
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
    }
     // verifier si le numer de telephone existe deja
     const existingPhone = await User.findOne({ phoneNumber: phoneNumber.trim() });
     if (existingPhone) {
       return res.status(409).json({
          success: false,
            message: 'Ce numéro de téléphone est déjà utilisé'
       });
    }
    //  Hacher le mot de passe avec Bcrypt
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    //  Créer le nouvel utilisateur
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phoneNumber: phoneNumber.trim()
    
    });

    // 9. Générer un token JWT
    const token = jwt.sign(
      { 
        userId: newUser._id,
        username: newUser.username,
        email: newUser.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 10. Retourner la réponse (SANS le mot de passe!)
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
           phoneNumber: newUser.phoneNumber,
   
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'inscription:', error);
    
    // Gestion des erreurs de duplication MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Ce ${field} est déjà utilisé`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;