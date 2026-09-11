const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be positive']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  patientName: {
    type: String,
    trim: true,
    default: ''
  },
  treatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Card', 'Other'],
    default: 'Cash'
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  reference: {
    type: String,
    default: ''
  },
  isVoid: {
    type: Boolean,
    default: false,
    index: true
  },
  voidReason: {
    type: String
  },
  createdBy: {
    type: String,
    default: 'Staff'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
