//le seul role de authMiddleware.js est de verifier si le token est present et valide

// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Récupérer le token depuis les headers
  const authHeader = req.headers["authorization"]; // ex: "Bearer eyJhbGciOiJIUzI1NiIs..."
  const token = authHeader && authHeader.split(" ")[1]; // on garde la partie après "Bearer"

  //  Si aucun token n’est fourni → accès refusé
  if (!token) {
    return res.status(401).json({ message: "Accès refusé : token manquant" });
  }

  try {
    // f Vérifier le token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // on stocke les infos du user dans la requête
    next(); // on passe à la route suivante
  } catch (error) {
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = { verifyToken };
