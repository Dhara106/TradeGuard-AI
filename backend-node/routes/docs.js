const router = require('express').Router();

// GET /api/docs - API Documentation endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'TradeGuard AI API',
    version: '1.0.0',
    description: 'AI-Powered Shipment Risk Intelligence API Gateway',
    baseUrl: 'http://localhost:5000/api',
    endpoints: {
      auth: {
        'POST /api/auth/register': {
          description: 'Register a new user account',
          body: { username: 'string', email: 'string', password: 'string' },
          returns: 'JWT token + user object'
        },
        'POST /api/auth/login': {
          description: 'Login with credentials',
          body: { email: 'string', password: 'string' },
          returns: 'JWT token + user object'
        },
        'GET /api/auth/me': {
          description: 'Get current user profile (requires auth)',
          headers: { Authorization: 'Bearer <token>' },
          returns: 'User object'
        },
        'GET /api/auth/verify-email': {
          description: 'Verify email with token',
          query: { token: 'string' },
          returns: 'Verification status'
        },
        'POST /api/auth/forgot-password': {
          description: 'Request password reset email',
          body: { email: 'string' },
          returns: 'Success message'
        },
        'POST /api/auth/reset-password': {
          description: 'Reset password with token',
          body: { token: 'string', newPassword: 'string' },
          returns: 'Success message'
        }
      },
      shipments: {
        'GET /api/shipments': {
          description: 'Get all shipments for current user',
          headers: { Authorization: 'Bearer <token>' },
          query: { sort: 'riskScore|createdAt|weight', order: 'asc|desc' },
          returns: 'Array of shipment objects'
        },
        'GET /api/shipments/stats': {
          description: 'Get dashboard statistics',
          headers: { Authorization: 'Bearer <token>' },
          returns: '{ total, delayed, onTime, avgRisk }'
        },
        'GET /api/shipments/:id': {
          description: 'Get single shipment by ID',
          headers: { Authorization: 'Bearer <token>' },
          returns: 'Shipment object'
        },
        'DELETE /api/shipments/:id': {
          description: 'Delete a shipment',
          headers: { Authorization: 'Bearer <token>' },
          returns: 'Success message'
        }
      },
      predict: {
        'POST /api/predict': {
          description: 'Submit shipment for AI risk prediction',
          headers: { Authorization: 'Bearer <token>' },
          body: {
            origin: 'string (city name)',
            destination: 'string (city name)',
            weight: 'number (kg)',
            carrier: 'string (BlueDart|DHL|DTDC|Delhivery|FedEx)',
            weatherScore: 'number (1-10)',
            trafficScore: 'number (1-10)'
          },
          returns: '{ prediction, confidence, riskScore, predictedDelay, reasons }'
        }
      },
      system: {
        'GET /api/health': {
          description: 'Health check endpoint',
          returns: '{ status, uptime, timestamp }'
        },
        'GET /api/docs': {
          description: 'This API documentation',
          returns: 'API documentation object'
        }
      }
    }
  });
});

module.exports = router;
