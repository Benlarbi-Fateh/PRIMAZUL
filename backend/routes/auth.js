//Le fichier auth.js (dans le dossier routes/) contient toutes les routes liées à l’authentification

// routes/auth.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// ✅ Vérifier le token
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Aucun token fourni" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(403).json({ valid: false, message: "Token invalide ou expiré" });
  }
});

module.exports = router;
