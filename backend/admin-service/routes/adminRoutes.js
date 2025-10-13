const express = require('express');
const router = express.Router();
const { createEvent } = require('../controllers/adminController');

// POST /api/admin/events - creates a new event
router.post('/events', createEvent);

module.exports = router;