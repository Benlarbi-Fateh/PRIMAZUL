// middleware/blockCheck.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose && decoded.purpose !== 'access') {
      return res.status(403).json({ message: 'Token invalide pour cette route' });
    }

    const user = await User.findById(decoded.userId || decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    // ✅ NORMALISATION CRITIQUE
    req.user = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture
    };

    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};
