// backend/controllers/authController.js

const Users = require('../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Stock temporaire des codes
const verificationCodes = new Map();

// Génération du token JWT
const createToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    username: user.username || null
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};


// Mot de passe oublié : Envoi du code

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await Users.findOne({ email });
  if (!user) return res.status(404).json({ message: "Aucun compte avec cet email" });

  const code = crypto.randomInt(100000, 999999).toString();
  verificationCodes.set(email, code);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Code de réinitialisation",
      text: `Votre code de réinitialisation est : ${code}`,
    });
    res.json({ message: "Code envoyé à votre email ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
  }
};

// Vérification du code
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const stored = verificationCodes.get(email);
  if (!stored || stored !== code)
    return res.status(400).json({ message: "Code invalide ou expiré" });

  res.json({ message: "Code vérifié ✅" });
};


// Réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email });
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  // Ici, on assigne simplement le nouveau mot de passe
  // Le hook "pre('save')" du modèle s'occupera de le hacher
  user.password = password.trim();
  await user.save();

  verificationCodes.delete(email);

  res.json({ message: "Mot de passe réinitialisé ✅" });
};


// Inscription

exports.register = async (req, res) => {
  try {
    const { email, phoneNumber, password, username } = req.body;

    if (!password) return res.status(400).json({ message: 'Mot de passe requis' });

    // Pas besoin de hacher ici, le modèle le fera automatiquement
    const user = new Users({ email, phoneNumber, password: password.trim(), username });
    await user.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès ✅', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// Connexion (email OU téléphone)

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ message: 'Champs requis' });

    // Rechercher l'utilisateur par email ou téléphone
    const user = await Users.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }]
    });

    if (!user)
      return res.status(401).json({ message: 'Utilisateur introuvable' });

    // Vérifier le mot de passe (bcrypt.compare avec le hash déjà en base)
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Mot de passe incorrect' });

    // Générer le token JWT
    const token = createToken(user);

    // Réponse
    res.json({
      message: 'Connexion réussie ✅',
      token,
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
