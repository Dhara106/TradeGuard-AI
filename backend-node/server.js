require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Initialize server
const app = express();

// Connect Database
connectDB();

// ─── Security Middleware ────────────────────────────────────────────────────────
// Helmet sets various HTTP headers to help protect the app from well-known web vulnerabilities
app.use(helmet());

// ─── Rate Limiting ──────────────────────────────────────────────────────────────
// Limit each IP to 100 requests per 15-minute window to prevent brute-force/DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP per 15 min
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── HTTP Request Logger ────────────────────────────────────────────────────────
// Morgan logs every incoming request to the console (method, url, status, response time)
app.use(morgan('dev'));

// ─── Core Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// ─── Import Routes ──────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const predictRoutes = require('./routes/predict');
const docsRoutes = require('./routes/docs');

// ─── Health Check Endpoint ──────────────────────────────────────────────────────
// Simple health probe for uptime monitoring / load balancers
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TradeGuard AI API Gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ─── Mount Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/docs', docsRoutes);

// ─── Base Route ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('TradeGuard AI Node.js API Gateway is running...');
});

// ─── Global Error Handler (must be AFTER all routes) ────────────────────────────
app.use(require('./middleware/errorHandler'));

// ─── Port Configuration ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
