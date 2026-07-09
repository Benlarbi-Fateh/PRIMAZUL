const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('../middleware/rateLimiter');
const { 
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation
} = require('../controllers/invitationController');

const invitationActionRateLimit = rateLimit({
  scope: 'invitation-action',
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Trop d'actions sur les invitations. Reessayez plus tard.",
});

// Envoyer une invitation
router.post('/send', authMiddleware, invitationActionRateLimit, sendInvitation);

// Récupérer les invitations reçues
router.get('/received', authMiddleware, getReceivedInvitations);

// Récupérer les invitations envoyées
router.get('/sent', authMiddleware, getSentInvitations);

// Accepter une invitation
router.post('/:invitationId/accept', authMiddleware, invitationActionRateLimit, acceptInvitation);

// Refuser une invitation
router.post('/:invitationId/reject', authMiddleware, invitationActionRateLimit, rejectInvitation);

// Annuler une invitation envoyée
router.delete('/:invitationId/cancel', authMiddleware, invitationActionRateLimit, cancelInvitation);

module.exports = router;
