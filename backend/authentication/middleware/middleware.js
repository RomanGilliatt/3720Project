// authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middleware to protect routes
function authenticateToken(req, res, next) {
  const token = req.cookies.token; // get token from HTTP-only cookie

  if (!token) return res.status(401).json({ error: 'No token, please log in' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });

    req.user = decoded; // attach user info to request
    next();
  });
}

module.exports = { authenticateToken };
