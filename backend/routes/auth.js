import express from "express";//es routes http
import User from "../models/Users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";// pour hasher et comparer les mots de passe de manière sécurisée.
const router = express.Router();

// register
router.post("/register", async (req, res) => 
{
  //contient les données envoyées par le frontend
  const { username, email, password, phoneNumber } = req.body;
  try {
    const existUser = await User.findOne({ email });// vérifie si l’utilisateur existe déjà.
    if (existUser) 
      return res.status(400).json({ message: "Email déjà utilisé" });
    const newUser = new User({ username, email, password, phoneNumber });
    await newUser.save();

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

//  login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe incorrect" });

    // Générer le token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});


export const verifyToken = (req, res, next) => 
  {
  const token = req.headers.authorization?.split(" ")[1]; 
  if (!token) return res.status(401).json
  ({ message: "Accès refusé" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
};

export default router;
