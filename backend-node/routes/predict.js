const express = require('express');
const router = express.Router();
const axios = require('axios');
const Shipment = require('../models/Shipment');
const { protect } = require('../middleware/authMiddleware');
const { HashMap, PriorityQueue } = require('../utils/dataStructures');
const { sendRiskAlertEmail } = require('../utils/emailService');

// Instantiate our custom HashMap for caching prediction results (key: cache string, value: prediction response)
const predictionCache = new HashMap(101);

// @desc    Submit shipment details for prediction and save to DB
// @route   POST /api/predict
// @access  Private
router.post('/', protect, async (req, res) => {
  const { origin, destination, weight, carrier, weatherScore, trafficScore } = req.body;

  if (!origin || !destination || !weight || !carrier || !weatherScore || !trafficScore) {
    return res.status(400).json({ success: false, message: 'Please provide all shipment details' });
  }

  // Create a unique key for caching based on inputs
  const cacheKey = `${origin.toLowerCase()}-${destination.toLowerCase()}-${weight}-${carrier.toLowerCase()}-${weatherScore}-${trafficScore}`;

  try {
    let predictionResult;

    // Check if result is cached in our custom HashMap
    if (predictionCache.has(cacheKey)) {
      console.log('Prediction cache hit! Returning cached result.');
      predictionResult = predictionCache.get(cacheKey);
    } else {
      console.log('Prediction cache miss! Fetching from Django ML service...');
      
      // Calculate distance (mock calculation or simple formula since we don't have active map API)
      const mockDistance = Math.floor(Math.random() * 1500) + 100; // 100km to 1600km

      // Forward request to Django ML service
      const djangoResponse = await axios.post(`${process.env.DJANGO_ML_URL || 'http://localhost:8000'}/api/predict/`, {
        origin,
        destination,
        weight: Number(weight),
        carrier,
        weatherScore: Number(weatherScore),
        trafficScore: Number(trafficScore),
        distance: mockDistance,
        season: 'Monsoon' // Assuming monsoon season for India logistics delay scenario
      });

      predictionResult = djangoResponse.data;

      // Save result in our cache map
      predictionCache.set(cacheKey, predictionResult);
    }

    // Build the initial tracking notifications. If the AI predicts a delay we
    // add a warning right away, so the Tracking page reflects the AI result.
    const initialNotifications = [{ message: 'Shipment dispatched', type: 'info' }];
    if (predictionResult.prediction === 'Delayed') {
      initialNotifications.push({ message: 'AI predicts this shipment may be delayed', type: 'warning' });
    }

    // Save prediction record to MongoDB (this SAME record is what the Tracking
    // page reads — no separate tracking table is created).
    const shipment = await Shipment.create({
      userId: req.user._id,
      origin,
      destination,
      weight: Number(weight),
      carrier,
      distance: predictionResult.distance || 500,
      weatherScore: Number(weatherScore),
      trafficScore: Number(trafficScore),
      prediction: predictionResult.prediction,
      confidence: predictionResult.confidence,
      riskScore: predictionResult.riskScore,
      predictedDelay: predictionResult.predictedDelay,
      reasons: predictionResult.reasons,
      // ── Tracking init (shipment starts at the first stop of the route) ──
      currentLocation: 'Ahmedabad',
      currentStatus: 'Dispatched',
      progress: 0,
      delivered: false,
      notifications: initialNotifications
    });

    // Fire-and-forget: Send risk alert email if riskScore > 70
    if (predictionResult.riskScore > 70) {
      const userEmail = req.user.email;
      const shipmentData = {
        origin,
        destination,
        weight: Number(weight),
        riskScore: predictionResult.riskScore,
        prediction: predictionResult.prediction,
        predictedDelay: predictionResult.predictedDelay
      };
      // Don't await — send in background so response is not delayed
      sendRiskAlertEmail(userEmail, shipmentData).catch(err =>
        console.error('Failed to send risk alert email:', err.message)
      );
    }

    res.status(201).json({
      success: true,
      data: shipment
    });

  } catch (error) {
    console.error('Prediction error:', error.message);
    
    // If Django returned a specific error (like 400 Validation Error), pass it to the frontend!
    if (error.response && error.response.data) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'AI Validation Error',
        details: error.response.data.details || error.response.data
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to obtain AI prediction. Make sure Django microservice is running.',
      error: error.message
    });
  }
});

// @desc    Get top-5 highest-risk shipments (demonstrates PriorityQueue)
// @route   GET /api/predict/risky
// @access  Private
router.get('/risky', protect, async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.user._id });
    
    // Create priority queue instance
    const pq = new PriorityQueue();

    // Insert all shipments into our Priority Queue with priority = riskScore
    shipments.forEach(shipment => {
      pq.insert(shipment.toObject(), shipment.riskScore);
    });

    // Extract top 5 elements
    const topRisky = [];
    const count = Math.min(pq.size(), 5);
    for (let i = 0; i < count; i++) {
      topRisky.push(pq.extractMax());
    }

    res.json({
      success: true,
      data: topRisky
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
