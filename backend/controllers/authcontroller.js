// backend/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Pour générer le JWT
const createToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email || null,
    phone: user.phone || null,
    name: user.name || null
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// POST /auth/register — pour créer un utilisateur de test
exports.register = async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;
    if (!password) return res.status(400).json({ message: 'Mot de passe requis' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ email, phone, password: hashed, name });
    await user.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /auth/login — ***ta tâche principale***
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifiant = email ou phone
    console.log(req.body);

    if (!identifier || !password)
      return res.status(400).json({ message: 'Champs requis' });

    // Cherche l'utilisateur par email ou téléphone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // Compare mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Mot de passe incorrect' });

    // Génération du token JWT
    const token = createToken(user);

    // Retourner le token au client
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
