const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registrationMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token d'inscription manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "registration") {
      return res.status(403).json({ error: "Token d'inscription invalide" });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user || !user.isVerified) {
      return res.status(401).json({ error: "Compte non verifie" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token d'inscription invalide" });
  }
};

module.exports = registrationMiddleware;
