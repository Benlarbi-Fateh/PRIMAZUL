// server/index.js
const express = require("express"); // importer express est créer serveur http
const mongoose = require("mongoose"); // importer mongoose pour interagir avec la bda avec les modeles
const cors = require("cors"); // importer cors pour autoriser les requetes entre front et back
require("dotenv").config(); // recuperer les informations sensibles depuis le fichier .env

const app = express(); // initialiser l'application express
app.use(cors()); // activer cors pour toutes les routes
app.use(express.json()); // parser le corps des requetes en json
// Middleware CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
const PORT = process.env.PORT || 5000; // definir le port du serveur

// Default route
app.get("/", (req, res) => {
  res.send("PrimAzul backend is running"); // route de test pour verifier que le serveur fonctionne
});
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Connexion OK ✅' });
});

// Connecter à MongoDB Atlas et démarrer le serveur
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
