-- Initialize events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    tickets_available INTEGER NOT NULL CHECK (tickets_available >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);