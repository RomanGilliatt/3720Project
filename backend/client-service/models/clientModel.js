const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../shared-db/database.sqlite'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    // Avoid noisy logs during tests
    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to SQLite database');
    }
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
    static async purchaseTicket(eventId, ticketsRequested = 1) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Step 1: Check availability
      db.get(
        'SELECT tickets_available, name FROM events WHERE id = ?',
        [eventId],
        (err, row) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }

          if (!row) {
            db.run('ROLLBACK');
            return reject(new Error('Event not found'));
          }

          if (row.tickets_available < ticketsRequested) {
            db.run('ROLLBACK');
            return reject(new Error('Not enough tickets available'));
          }

          // Step 2: Update ticket count dynamically
          db.run(
            'UPDATE events SET tickets_available = tickets_available - ? WHERE id = ? AND tickets_available >= ?',
            [ticketsRequested, eventId, ticketsRequested],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }

              if (this.changes === 0) {
                db.run('ROLLBACK');
                return reject(new Error('Failed to update ticket count'));
              }

              // Step 3: Commit and resolve
              db.run('COMMIT');
              resolve({
                message: `Successfully booked ${ticketsRequested} ticket(s) for "${row.name}".`,
                remaining_tickets: row.tickets_available - ticketsRequested,
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