const mongoose = require('mongoose');

// A single tracking notification (e.g. "Shipment In Transit").
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // info | success | warning | error
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    type: String,
    required: [true, 'Please provide origin city']
  },
  destination: {
    type: String,
    required: [true, 'Please provide destination city']
  },
  weight: {
    type: Number,
    required: [true, 'Please provide shipment weight (kg)']
  },
  carrier: {
    type: String,
    required: [true, 'Please provide shipping carrier']
  },
  distance: {
    type: Number,
    required: true
  },
  weatherScore: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  trafficScore: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  prediction: {
    type: String,
    enum: ['Delayed', 'On Time'],
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  predictedDelay: {
    type: Number,
    default: 0
  },
  reasons: {
    type: [String],
    default: []
  },

  // ─── Simple tracking fields (added onto the SAME record created by a
  // prediction, so the Tracking page reuses the AI Prediction data). ───
  currentLocation: { type: String, default: 'Ahmedabad' },
  currentStatus: {
    type: String,
    enum: ['Dispatched', 'In Transit', 'Delayed', 'Route Deviation', 'Delivered On Time', 'Delivered (Delayed)'],
    default: 'Dispatched'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
  delivered: { type: Boolean, default: false },
  deliveryTime: { type: Date },
  notifications: { type: [notificationSchema], default: [] },

  status: {
    type: String,
    enum: ['analyzed', 'dispatched', 'delivered'],
    default: 'analyzed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Shipment', shipmentSchema);
