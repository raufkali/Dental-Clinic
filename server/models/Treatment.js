const mongoose = require('mongoose');

const treatmentNoteSchema = new mongoose.Schema({
  note: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'Doctor'
  }
});

const treatmentSchema = new mongoose.Schema({
  treatmentId: {
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
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  contractAmount: {
    type: Number,
    required: true,
    min: [0, 'Contract amount must be non-negative']
  },
  initialPaymentAmount: {
    type: Number,
    default: 0
  },
  monthlyInstallment: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expectedEndDate: {
    type: Date
  },
  durationMonths: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled', 'Settled'],
    default: 'Active'
  },
  isSettled: {
    type: Boolean,
    default: false
  },
  settledDate: {
    type: Date
  },
  settledReason: {
    type: String,
    default: ''
  },
  settledBy: {
    type: String,
    default: ''
  },
  notes: [treatmentNoteSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Treatment', treatmentSchema);
