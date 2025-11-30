const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  createGroup,
  getGroup,
  addParticipants,
  leaveGroup
} = require('../controllers/groupController');


router.post('/create', authMiddleware, createGroup);
router.get('/:id', authMiddleware, getGroup);
router.post('/add-participants', authMiddleware, addParticipants);
router.delete('/:groupId/leave', authMiddleware, leaveGroup);


module.exports = router;
