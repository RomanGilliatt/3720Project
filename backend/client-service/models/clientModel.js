const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../shared-db/database.sqlite'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

class Event {
    /**
     * Retrieves all events from database in date order
     * 
     * @returns array of event objects
     * 
     * @throws database errors
     */
    static getAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM events ORDER BY date ASC';
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Processes ticket purchase with transaction safety
     * 
     * @param eventId ID of event to purchase ticket for
     * 
     * @returns object with success message and remaining tickets
     * 
     * @throws error if event not found, no tickets available, or DB error
     */
    static async purchaseTicket(eventId) {
        return new Promise((resolve, reject) => {
            // Start a transaction to ensure atomic update
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Check if tickets are available
                db.get(
                    'SELECT tickets_available FROM events WHERE id = ?',
                    [eventId],
                    (err, row) => {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }

                        if (!row) {
                            db.run('ROLLBACK');
                            reject(new Error('Event not found'));
                            return;
                        }

                        if (row.tickets_available <= 0) {
                            db.run('ROLLBACK');
                            reject(new Error('No tickets available'));
                            return;
                        }

                        // Update ticket count
                        db.run(
                            'UPDATE events SET tickets_available = tickets_available - 1 WHERE id = ? AND tickets_available > 0',
                            [eventId],
                            function(err) {
                                if (err) {
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }

                                if (this.changes === 0) {
                                    db.run('ROLLBACK');
                                    reject(new Error('Failed to update ticket count'));
                                    return;
                                }

                                db.run('COMMIT');
                                resolve({
                                    message: 'Ticket purchased successfully',
                                    remaining_tickets: row.tickets_available - 1
                                });
                            }
                        );
                    }
                );
            });
        });
    }
}

module.exports = Event;