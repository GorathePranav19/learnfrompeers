require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB, disconnectDB } = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB().catch(err => console.error("Initial DB connection failed:", err));

// ── Security Middleware ──
app.use(helmet());

// ── CORS ──
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ── Request Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Body Parser ──
app.use(express.json({ limit: '10kb' }));

// ── Rate Limiting ──
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// ── Routes Setup ──
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/auth'));
apiRouter.use('/students', require('./routes/students'));
apiRouter.use('/attendance', require('./routes/attendance'));
apiRouter.use('/performance', require('./routes/performance'));
apiRouter.use('/rankings', require('./routes/rankings'));
apiRouter.use('/analytics', require('./routes/analytics'));

// Mount routes on /api (for local dev and standard routing)
app.use('/api', apiRouter);
// Mount routes on root (for Vercel Web Services with routePrefix stripping)
app.use('/', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handling middleware ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Something went wrong!' : err.message
  });
});

// ── Start Server / Export for Serverless ──
const PORT = process.env.PORT || 5000;

// Always listen so Vercel Web Services (which run `node server.js`) stay alive
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ── Graceful Shutdown ──
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
