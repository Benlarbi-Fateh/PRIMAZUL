const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadRateLimit } = require('../middleware/actionRateLimits');
const {
  createGroup,
  getGroup,
  addParticipants,
  leaveGroup, 
  removeParticipant,      // ✅ AJOUTÉ
  promoteToAdmin,         // ✅ AJOUTÉ
  removeAdmin,            // ✅ AJOUTÉ
  updateGroupName,        // ✅ AJOUTÉ
  updateGroupImage        // ✅ AJOUTÉ
} = require('../controllers/groupController');


router.post('/create', authMiddleware, createGroup);
router.get('/:id', authMiddleware, getGroup);
router.post('/add-participants', authMiddleware, addParticipants);
router.delete('/:groupId/leave', authMiddleware, leaveGroup);
// 🆕 Nouvelles routes
router.post('/remove-participant', authMiddleware, removeParticipant);
router.post('/promote-admin', authMiddleware, promoteToAdmin);
router.post('/remove-admin', authMiddleware, removeAdmin);
router.put('/update-name', authMiddleware, updateGroupName);
router.put('/:groupId/update-image', authMiddleware, uploadRateLimit, upload.single('groupImage'), updateGroupImage);


module.exports = router;
