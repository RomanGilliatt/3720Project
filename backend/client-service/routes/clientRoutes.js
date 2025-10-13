const express = require('express');
const router = express.Router();
const { getAllEvents, purchaseTicket } = require('../controllers/clientController');

// GET /api/events - get all events
router.get('/events', getAllEvents);

// POST /api/events/:id/purchase - purchase a ticket
router.post('/events/:id/purchase', purchaseTicket);

module.exports = router;