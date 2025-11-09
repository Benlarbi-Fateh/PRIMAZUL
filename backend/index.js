require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();

// MIDDLEWARES

app.use(cors({
  origin: '*'
}));
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging (utile pour le debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// CONNEXION À MONGODB ATLAS

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connecté à MongoDB Atlas avec succès');
})
.catch((error) => {
  console.error('❌ Erreur de connexion à MongoDB:', error.message);
  process.exit(1);
});

// ROUTES
// ============================================
// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API PRIMAZUL',
    version: '1.0.0',
    status: 'running'
  });
});

// Routes d'authentification
app.use('/api', authRoutes);

// Route 404 - Non trouvée
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// GESTION DES ERREURS GLOBALE
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// DÉMARRAGE DU SERVEUR

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});