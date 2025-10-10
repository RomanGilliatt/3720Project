const express = require('express');
const cors = require('cors');
const clientRoutes = require('./routes/clientRoutes');

const app = express();
const PORT = 6001;

// Middleware
app.use(cors());
app.use(express.json());

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