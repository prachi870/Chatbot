const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { generalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();
app.set('trust proxy', 1);

// --- Core middleware ---
console.log('CORS configured to accept ALL origins (temporary for debugging)');

// Add request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(
  cors({
    origin: '*', // Allow all origins temporarily
    credentials: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running.' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
