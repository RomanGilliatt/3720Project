const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
//app.use(cors());
app.use(express.json());

const allowedOrigins = [
  'https://frontend-lac-one-73.vercel.app',
  'https://frontend-git-main-tiger-tix1.vercel.app',
  'https://frontend-4mj8x9uek-tiger-tix1.vercel.app',
  'https://frontend-7s1e4cx01-tiger-tix1.vercel.app/'
];

// Use cors globally
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // allows cookies
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Routes
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Admin service running on port ${PORT}`);
});