const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  treatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  installmentNumber: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  expectedAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Due', 'Overdue', 'Not Applicable'],
    default: 'Due'
  },
  paymentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Installment', installmentSchema);
