const express = require('express');
const router = express.Router();
const { createEvent, deleteEvent } = require('../controllers/adminController');


// POST /api/admin/events - creates a new event
router.post('/events', createEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;