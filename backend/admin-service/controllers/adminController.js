const Event = require('../models/adminModel');
const db = require('../models/adminModel');

/**
 * Creates a new event in the database
 * 
 * @param req request object
 * @param res response object
 * 
 * @returns JSON confirmation or error response
 * 
 * @throws error if event creation fails
 */
const createEvent = async (req, res) => {
    try {
        const eventData = {
            name: req.body.name,
            date: req.body.date,
            tickets_available: parseInt(req.body.tickets_available)
        };

        // Validate input
        if (!eventData.name || typeof eventData.name !== 'string') {
            return res.status(400).json({ error: 'Invalid event name' });
        }

        if (!eventData.date || isNaN(Date.parse(eventData.date))) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        if (isNaN(eventData.tickets_available) || eventData.tickets_available < 0) {
            return res.status(400).json({ error: 'Invalid number of tickets' });
        }

        const event = await Event.create(eventData);
        res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('Error creating event:', error);
        if (error.message === 'Missing required fields' || 
            error.message === 'Tickets available must be non-negative') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// DELETE /api/admin/events/:id
const deleteEvent = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM events WHERE id = ?`;

  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  });
};

module.exports = {
    createEvent,
    deleteEvent
};