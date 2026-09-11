const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  minPrice: {
    type: Number,
    default: 0
  },
  maxPrice: {
    type: Number,
    default: 0
  },
  defaultPrice: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['One-time', 'Contract'],
    default: 'One-time'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
