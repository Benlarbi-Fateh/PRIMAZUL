//le seul role de authMiddleware.js est de verifier si le token est present et valide
// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken"); //jsonwebtoken est utilisé pour créer envoyer et vérifier les tokens

const verifyToken = (req, res, next) => {
  // Récupérer le token depuis les headers c'est a dire les en-tetes des requetes http
  const authHeader = req.headers["authorization"]; // ex: "Bearer eyJhbGciOiJIUzI1NiIs..."
  const token = authHeader && authHeader.split(" ")[1]; // on garde la partie après "Bearer"

  //  Si aucun token n’est fourni → accès refusé: try...catch c'est la structure de gestion d'erreurs
  if (!token) {
    return res.status(401).json({ message: "Accès refusé : token manquant" });
  }

  try {
    //  Vérifier le token avec la clé secrète qu'on a utilisé pour signer le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //jwt.verify permet de déchiffrer le token, voir si il a été signé avec la meme clé secrete...
    req.user = decoded; // on stocke les infos du user dans la requête
    next(); // on passe à la route suivante "ce middleware est terminé, passe à la suite "
  } catch (error) {
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = { verifyToken }; //exporter la fonction pour qu'on puisse l'utiliser ailleurs
