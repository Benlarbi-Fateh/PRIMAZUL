const express = require('express');
const router = express.Router();
const { register, verifyCode, resendCode } = require('../controllers/authcontroller');
// Routes d'authentification
router.post('/register', register);
router.post('/verify-code', verifyCode);

router.post('/resend-code', resendCode);
module.exports = router;