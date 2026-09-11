const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  treatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than zero']
  },
  paymentType: {
    type: String,
    enum: ['Initial / Advance', 'Monthly Installment', 'Partial Payment', 'Full Payment', 'Other'],
    default: 'Monthly Installment'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Card', 'Other'],
    default: 'Cash'
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  reference: {
    type: String,
    default: ''
  },
  notes: {
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
  voidDate: {
    type: Date
  },
  voidBy: {
    type: String
  },
  createdBy: {
    type: String,
    default: 'Staff'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
