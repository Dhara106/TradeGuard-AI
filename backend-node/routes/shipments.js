const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const { protect } = require('../middleware/authMiddleware');
const { mergeSort } = require('../utils/dataStructures');

// @desc    Get user's shipments with optional custom sorting
// @route   GET /api/shipments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Fetch user shipments
    let shipments = await Shipment.find({ userId: req.user._id });

    const sortKey = req.query.sort || 'createdAt';
    const sortOrder = req.query.order || 'desc';

    // Convert mongoose documents to regular objects for sorting
    let shipmentList = shipments.map(s => s.toObject());

    // Fulfill Data Structures requirement by sorting with our mergeSort utility
    if (shipmentList.length > 0) {
      shipmentList = mergeSort(shipmentList, sortKey, sortOrder);
    }

    res.json({
      success: true,
      count: shipmentList.length,
      data: shipmentList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get dashboard stats (DBMS Aggregation component)
// @route   GET /api/shipments/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Run MongoDB Aggregation Pipeline
    const stats = await Shipment.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          delayedCount: {
            $sum: { $cond: [{ $eq: ['$prediction', 'Delayed'] }, 1, 0] }
          },
          onTimeCount: {
            $sum: { $cond: [{ $eq: ['$prediction', 'On Time'] }, 1, 0] }
          },
          avgRiskScore: { $avg: '$riskScore' }
        }
      }
    ]);

    // Format the response
    const defaultStats = {
      totalShipments: 0,
      delayedCount: 0,
      onTimeCount: 0,
      avgRiskScore: 0
    };

    const finalStats = stats.length > 0 ? {
      totalShipments: stats[0].totalShipments || 0,
      delayedCount: stats[0].delayedCount || 0,
      onTimeCount: stats[0].onTimeCount || 0,
      avgRiskScore: Math.round(stats[0].avgRiskScore || 0)
    } : defaultStats;

    res.json({
      success: true,
      stats: finalStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single shipment
// @route   GET /api/shipments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, userId: req.user._id });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a shipment record
// @route   DELETE /api/shipments/:id
// @access  Private
router.post('/delete/:id', protect, async (req, res) => {
  try {
    // MongoDB delete
    const shipment = await Shipment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({
      success: true,
      message: 'Shipment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// Shipment Tracking (works on the SAME shipment records created by the
// AI Prediction page — no separate table). A shipment simply walks along
// this fixed demo route. All routes are protected.
// ============================================
const ROUTE = ['Ahmedabad', 'Vadodara', 'Surat', 'Mumbai'];

// @desc    Move the shipment to the next stop on the route
// @route   POST /api/shipments/:id/advance
// @access  Private
router.post('/:id/advance', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    if (shipment.delivered) return res.json({ success: true, data: shipment, message: 'Already delivered' });

    // Find where we are on the route (default to the start).
    let index = ROUTE.indexOf(shipment.currentLocation);
    if (index === -1) index = 0;
    const next = Math.min(index + 1, ROUTE.length - 1);

    shipment.currentLocation = ROUTE[next];
    shipment.progress = Math.round((next / (ROUTE.length - 1)) * 100);

    if (next === ROUTE.length - 1) {
      // Reached destination → mark delivered. Final status depends on the AI prediction.
      shipment.delivered = true;
      shipment.deliveryTime = new Date();
      shipment.currentStatus = shipment.prediction === 'Delayed' ? 'Delivered (Delayed)' : 'Delivered On Time';
      shipment.notifications.push({ message: `Shipment delivered at ${ROUTE[next]}`, type: 'success' });
    } else if (shipment.prediction === 'Delayed') {
      // AI said delayed → reflect it in the status + a notification.
      shipment.currentStatus = 'Delayed';
      shipment.notifications.push({ message: `Shipment delayed — now at ${ROUTE[next]}`, type: 'warning' });
    } else {
      shipment.currentStatus = 'In Transit';
      shipment.notifications.push({ message: `In transit — reached ${ROUTE[next]}`, type: 'info' });
    }

    await shipment.save();
    res.json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Simulate a route deviation (off-route + higher risk)
// @route   POST /api/shipments/:id/deviate
// @access  Private
router.post('/:id/deviate', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    shipment.currentLocation = 'Rajkot'; // a city that is NOT on the approved route
    shipment.currentStatus = 'Route Deviation';
    shipment.riskScore = Math.min(100, shipment.riskScore + 20); // AI risk goes up
    shipment.notifications.push({ message: 'Route deviation detected near Rajkot', type: 'error' });

    await shipment.save();
    res.json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reset tracking back to the start (handy for repeat demos)
// @route   POST /api/shipments/:id/reset
// @access  Private
router.post('/:id/reset', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    shipment.currentLocation = ROUTE[0];
    shipment.currentStatus = 'Dispatched';
    shipment.progress = 0;
    shipment.delivered = false;
    shipment.deliveryTime = undefined;
    shipment.notifications = [{ message: 'Shipment dispatched', type: 'info' }];

    await shipment.save();
    res.json({ success: true, data: shipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
