// userModel.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Connect to the shared database
const db = new sqlite3.Database(
  path.join(__dirname, '../../shared-db/database.sqlite'),
  (err) => {
    if (err) console.error('Error connecting to database:', err);
    else console.log('Connected to SQLite database (users)');
  }
);

class User {
  // Create a new user with hashed password
  static create({ email, password }) {
    return new Promise(async (resolve, reject) => {
      if (!email || !password) return reject(new Error('Missing email or password'));

      try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (email, passwordHash) VALUES (?, ?)`;
        db.run(sql, [email.toLowerCase(), passwordHash], function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID, email: email.toLowerCase() });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Find a user by email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      db.get(sql, [email.toLowerCase()], (err, row) => {
        if (err) return reject(err);
        resolve(row); // null if not found
      });
    });
  }

  // Delete a user by ID
  static deleteById(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM users WHERE id = ?`;
      db.run(sql, [id], function(err) {
        if (err) return reject(err);
        resolve(this.changes); // number of rows deleted
      });
    });
  }

}

User.db = db; // export the db connection for direct queries if needed
module.exports = User;
