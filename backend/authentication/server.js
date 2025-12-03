// server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

const allowedOrigins = [
  'https://frontend-lac-one-73.vercel.app',
  'https://frontend-git-main-tiger-tix1.vercel.app',
  'https://frontend-4mj8x9uek-tiger-tix1.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Ensure preflight OPTIONS requests succeed
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));


// Middleware
app.use(express.json());
app.use(cookieParser());

/*app.use(
  cors({
    origin: 'http://localhost:3000', // React frontend
    credentials: true,               // allow cookies for JWT
  })
);*/

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
