require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/host', require('./routes/hosting'));
app.use('/api/share', require('./routes/share'));
app.use('/api/payments', require('./routes/payments'));
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/files', require('./routes/files'));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
