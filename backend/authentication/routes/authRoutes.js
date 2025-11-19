// authRoutes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected route to get information
router.get('/me', authenticateToken, authController.me);
router.get('/users', authenticateToken, authController.getAllUsers);

// Only for admin/development
router.delete('/users/:id', authenticateToken, authController.deleteUser);


module.exports = router;
