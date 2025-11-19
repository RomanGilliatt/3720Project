// server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'http://localhost:3000', // React frontend
    credentials: true,               // allow cookies for JWT
  })
);

// Routes
app.use('/', authRoutes); // mount all auth routes (register, login, logout, /me)

// Optional test route
app.get('/', (req, res) => {
  res.send('User-authentication microservice is running!');
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
