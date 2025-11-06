// server/index.js
const express = require("express"); // importer express est créer serveur http
const mongoose = require("mongoose"); // importer mongoose pour interagir avec la bda avec les modeles
const cors = require("cors"); // importer cors pour autoriser les requetes entre front et back

const { verifyToken } = require("./middleware/authMiddleware"); //zaina: sert à importer la fonction verifyToken que tu as créée dans ton fichie; Parce que ton fichier authMiddleware.js contient la logique qui vérifie le token (JWT).
//Mais cette logique doit être utilisée dans ton serveur (index.js), pour protéger des routes.

const authRoutes = require("./routes/auth"); //  importer le fichier des routes d’authentification

require("dotenv").config(); // recuperer les informations sensibles depuis le fichier .env

const app = express(); // initialiser l'application express
app.use(cors()); // activer cors pour toutes les routes
app.use(express.json()); // parser le corps des requetes en json
// Middleware CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
const PORT = process.env.PORT || 5000; // definir le port du serveur

// ✅ Intégrer les routes d’authentification
// toutes les routes commençant par /api/auth seront gérées dans routes/auth.js
app.use("/api/auth", authRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("PrimAzul backend is running"); // route de test pour verifier que le serveur fonctionne
});
app.get("/api/ping", (req, res) => {
  res.json({ message: "Connexion OK ✅" });
});

//ma tache zaina:
// juste pour tester le token; cette partie sera supprimer apres
// ✅ Route protégée (accessible uniquement avec un token valide)
app.get("/api/protected/test", verifyToken, (req, res) => {
  res.json({
    message: "Accès autorisé ✅",
    user: req.user, // infos contenues dans le token (ex: id, email...)
  });
});

// Connecter à MongoDB Atlas et démarrer le serveur
//mongoose
//.connect(process.env.MONGO_URI)
//.then(() => {
// console.log("Connected to MongoDB Atlas");
//app.listen(PORT, () => {
// console.log(`Server running on port ${PORT}`);
//});
// })
// .catch((err) => console.error("MongoDB connection error:", err));

//je dois supprimer ce qui est en dessous apres avoir fait les tests
// 🟡 TEMPORAIRE : Démarrer sans base de données
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (sans MongoDB)`);
});
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn("⚠️  No MongoDB URI found in .env — starting without database");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connection error:", err));
}
