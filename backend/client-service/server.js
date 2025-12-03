const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
const PORT = process.env.PORT || 6001;

// Middleware
//app.use(cors());
app.use(express.json());

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

// Routes
app.use('/api', clientRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Client service running on port ${PORT}`);
});