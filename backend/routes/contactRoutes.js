// routes/contactRoutes.js
const express = require('express');
const {
  getMyContacts,
  addContact,
  deleteContact,
  toggleFavorite,
  updateCustomName,
  blockContact
} = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Toutes les routes sont protégées
router.use(authMiddleware);

// GET /api/contacts - Récupérer tous mes contacts
router.get('/', getMyContacts);

// POST /api/contacts - Ajouter un contact
router.post('/', addContact);

// DELETE /api/contacts/:contactId - Supprimer un contact
router.delete('/:contactId', deleteContact);

// PUT /api/contacts/:contactId/favorite - Marquer comme favori
router.put('/:contactId/favorite', toggleFavorite);

// PUT /api/contacts/:contactId/name - Modifier le nom personnalisé
router.put('/:contactId/name', updateCustomName);

// PUT /api/contacts/:contactId/block - Bloquer un contact
router.put('/:contactId/block', blockContact);

module.exports = router;