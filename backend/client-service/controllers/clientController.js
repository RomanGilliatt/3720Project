const Event = require('../models/clientModel');

/**
 * Retrieves all events from the database
 * 
 * @param req request object
 * @param res response object
 * 
 * @return JSON array of events or error response
 */
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Processes a ticket purchase for a specific event
 * 
 * @param req request object
 * @param res response object
 * 
 * @return JSON confirmation or error response
 */
const purchaseTicket = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const ticketsRequested = parseInt(req.body.tickets, 10) || 1; // 👈 read number of tickets

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        // 👇 pass both eventId and ticket count to the model
        const result = await Event.purchaseTicket(eventId, ticketsRequested);
        res.json(result);
    } catch (error) {
        console.error('Error purchasing ticket:', error);

        if (error.message === 'Event not found') {
            res.status(404).json({ error: 'Event not found' });
        } else if (
            error.message === 'No tickets available' ||
            error.message === 'Not enough tickets available'
        ) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = {
    getAllEvents,
    purchaseTicket
};