const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { register, login, me, updateMe } = require('../controllers/authController');

// Public
router.post('/register', register);
router.post('/login',    login);

// Protected — need a valid JWT
router.get ('/me',   requireAuth, me);
router.patch('/me',  requireAuth, updateMe);

module.exports = router;
