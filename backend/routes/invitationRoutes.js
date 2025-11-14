const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation
} = require('../controllers/invitationController');

// Envoyer une invitation
router.post('/send', authMiddleware, sendInvitation);

// Récupérer les invitations reçues
router.get('/received', authMiddleware, getReceivedInvitations);

// Récupérer les invitations envoyées
router.get('/sent', authMiddleware, getSentInvitations);

// Accepter une invitation
router.post('/:invitationId/accept', authMiddleware, acceptInvitation);

// Refuser une invitation
router.post('/:invitationId/reject', authMiddleware, rejectInvitation);

// Annuler une invitation envoyée
router.delete('/:invitationId/cancel', authMiddleware, cancelInvitation);

module.exports = router;