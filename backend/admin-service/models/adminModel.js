const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../shared-db/database.sqlite'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        // Initialize the database with schema
        const initSql = require('fs').readFileSync(path.join(__dirname, '../../shared-db/init.sql'), 'utf8');
        db.exec(initSql, (err) => {
            if (err) {
                console.error('Error initializing database:', err);
            } else {
                console.log('Database initialized successfully');
            }
        });
    }
});

class Event {
    /**
     * Creates a new event in the database
     * 
     * @param eventData event details
     * @param eventData.name name of the event
     * @param eventData.date - date of event (YYYY-MM-DD format)
     * @param eventData.tickets_available number of available tickets
     * 
     * @returns created event object with ID
     * 
     * @throws error if validation fails or DB error occurs
     */
    static create(eventData) {
        return new Promise((resolve, reject) => {
            const { name, date, tickets_available } = eventData;
            
            // Validate input
            if (!name || !date || !tickets_available) {
                reject(new Error('Missing required fields'));
                return;
            }

            if (tickets_available < 0) {
                reject(new Error('Tickets available must be non-negative'));
                return;
            }

            const sql = `INSERT INTO events (name, date, tickets_available) 
                        VALUES (?, ?, ?)`;
            
            db.run(sql, [name, date, tickets_available], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        name,
                        date,
                        tickets_available
                    });
                }
            });
        });
    }
}

module.exports = Event;