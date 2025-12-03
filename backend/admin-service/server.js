const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
//app.use(cors());
app.use(express.json());

app.use(cors({
  origin: 'https://frontend-lac-one-73.vercel.app', // your Vercel frontend
  credentials: true
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