const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint with database readiness check
app.get('/api/health', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (!isDbReady) {
    return res.status(503).json({
      status: 'database_connecting',
      ready: false,
      app: 'DentSuite Management API'
    });
  }
  res.json({
    status: 'ok',
    ready: true,
    app: 'DentSuite Management API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/services', require('./routes/services'));
app.use('/api/treatments', require('./routes/treatments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/audit-logs', require('./routes/audit'));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Server] Database initialization failed:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`[Server] DentSuite Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

startServer();

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err);
});

module.exports = app;
