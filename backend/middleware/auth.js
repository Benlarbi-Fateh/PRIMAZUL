//Les tokens JWT servent à authentifier un utilisateur sans avoir à vérifier ses identifiants à chaque requête.
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => 
{
  const token = req.headers.authorization?.split(" ")[1]; 
  if (!token) return res.status(401).json({ message: "Accès refusé" }); //Si aucun token n’est fourni, on renvoie 401 Unauthorized avec un message d’erreur.

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    //next() Appelle le prochain middleware ou la route. Sans next(), la requête resterait bloquée et le serveur ne répondrait jamais.
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalide" });
  }
};

