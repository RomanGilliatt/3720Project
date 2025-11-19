-- Initialize events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    tickets_available INTEGER NOT NULL CHECK (tickets_available >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'pending','confirmed','cancelled'
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- store hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);