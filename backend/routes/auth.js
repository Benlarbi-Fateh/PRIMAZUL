const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../models/Users');

const verificationCodes = new Map();

// Transporter email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Générer code 6 chiffres
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Envoyer email
const sendVerificationEmail = async (email, username, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Code de vérification - PRIMAZUL',
    html: `<h2>Bonjour ${username},</h2><p>Votre code : <b>${code}</b></p><p>Valide 15 minutes</p>`
  };
  await transporter.sendMail(mailOptions);
};

// ============================================
// Route register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    if (!username || !email || !phoneNumber || !password)
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });

    // Vérifier si email existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email déjà utilisé' });

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    verificationCodes.set(email.toLowerCase(), {
      code,
      userData: { username, email: email.toLowerCase(), phoneNumber, password: hashedPassword },
      expiresAt
    });

    await sendVerificationEmail(email, username, code);

    res.status(200).json({ success: true, message: 'Code envoyé', email: email.toLowerCase() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ============================================
// Route verify-code
// ============================================
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, message: 'Email et code requis' });

    const verificationData = verificationCodes.get(email.toLowerCase());
    if (!verificationData) return res.status(400).json({ success: false, message: 'Code non trouvé ou expiré' });
    if (Date.now() > verificationData.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'Code expiré' });
    }
    if (code !== verificationData.code) return res.status(400).json({ success: false, message: 'Code incorrect' });

    // Créer utilisateur
    const { username, email: userEmail, phoneNumber, password } = verificationData.userData;
    const newUser = new User({ username, email: userEmail, phoneNumber, password });
    await newUser.save();

    verificationCodes.delete(email.toLowerCase());
    res.status(201).json({ success: true, message: 'Compte créé avec succès', user: { id: newUser._id, username, email: userEmail, phoneNumber } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

// ============================================
// Route resend-code
// ============================================
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    const verificationData = verificationCodes.get(email.toLowerCase());
    if (!verificationData) return res.status(400).json({ success: false, message: 'Aucune inscription en attente' });

    const newCode = generateVerificationCode();
    verificationData.code = newCode;
    verificationData.expiresAt = Date.now() + 15 * 60 * 1000;
    verificationCodes.set(email.toLowerCase(), verificationData);

    await sendVerificationEmail(email, verificationData.userData.username, newCode);
    res.status(200).json({ success: true, message: 'Nouveau code envoyé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
