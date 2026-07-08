const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose && decoded.purpose !== 'access') {
      return res.status(403).json({ error: 'Token invalide pour cette route' });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // 🆕 METTRE À JOUR lastLogin À CHAQUE REQUÊTE (optionnel)
    // user.lastLogin = new Date();
    // await user.save();

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;
