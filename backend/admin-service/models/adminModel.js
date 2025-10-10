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