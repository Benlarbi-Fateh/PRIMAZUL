const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
router.use(verifyToken);
// ✅ Route protégée
router.get("/", verifyToken, (req, res) => {
  res.json({
    message: "Accès autorisé ✅ (depuis routes/test.js)",
    user: req.user,
  });
});

// ✅ Route publique (pas besoin de token)
router.get("/public", (req, res) => {
  res.json({ message: "Route publique accessible sans token ✅" });
});

module.exports = router;
