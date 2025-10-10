const Event = require('../models/clientModel');

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.getAll();
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const purchaseTicket = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        
        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const result = await Event.purchaseTicket(eventId);
        res.json(result);
    } catch (error) {
        console.error('Error purchasing ticket:', error);
        
        if (error.message === 'Event not found') {
            res.status(404).json({ error: 'Event not found' });
        } else if (error.message === 'No tickets available') {
            res.status(400).json({ error: 'No tickets available' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = {
    getAllEvents,
    purchaseTicket
};