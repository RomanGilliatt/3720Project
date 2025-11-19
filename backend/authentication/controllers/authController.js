// authController.js
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '30m'; // 30 minutes

// Helper: set JWT cookie
function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // set true in production with HTTPS
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000 // 30 minutes
  });
  return token;
}

/* ------------------- REGISTER ------------------- */
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Missing email or password' });

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(409).json({ error: 'User already exists' });

    // Create user
    const user = await User.create({ email, password });

    // Issue JWT cookie
    //setTokenCookie(res, { id: user.id, email: user.email });

    res.status(201).json({ message: 'Registered successfully', user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email); // log email

    const user = await User.findByEmail(email);
    console.log('User found:', user); // log returned user object

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid?', valid); // log bcrypt result

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Issue JWT cookie
    setTokenCookie(res, { id: user.id, email: user.email });

    res.json({ message: 'Logged in successfully', user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



/* ------------------- LOGOUT ------------------- */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  });
  res.json({ message: 'Logged out successfully' });
};

/* ------------------- GET CURRENT USER ------------------- */
const me = (req, res) => {
  // req.user will be set by JWT middleware
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.user });
};

/* ------------------- GET ALL USERS ------------------- */
const getAllUsers = (req, res) => {
  const sql = `SELECT id, email, created_at FROM users`; // exclude passwords
  const db = require('../models/userModel').db; // make sure db is exported

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ users: rows });
  });
};

/* ------------------- DELETE CURRENT USER ------------------- */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const rowsDeleted = await User.deleteById(userId);
    if (rowsDeleted === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login, logout, me, getAllUsers, deleteUser };
