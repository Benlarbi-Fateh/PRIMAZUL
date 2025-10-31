// PRIMAZUL/backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Nécessaire pour la communication Front/Back

// Charge les variables d'environnement du fichier .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;

// Middleware pour autoriser les requêtes depuis Next.js
app.use(cors()); 

// 1. Connexion à MongoDB Atlas
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connexion à MongoDB Atlas réussie!'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Route de test simple
app.get('/api/hello', (req, res) => {
  res.json({ 
    message: "Bonjour du Backend Express! Connexion BDA OK.",
    databaseStatus: mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Le serveur Express écoute sur http://localhost:${port}`);
});