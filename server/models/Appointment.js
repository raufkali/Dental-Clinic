const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceName: {
    type: String,
    default: 'General Consultation'
  },
  treatmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment'
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  time: {
    type: String, // e.g. "09:00", "10:30"
    required: true
  },
  doctor: {
    type: String,
    default: 'Dr. Ahmed'
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled',
    index: true
  },
  createdBy: {
    type: String,
    default: 'Staff'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
