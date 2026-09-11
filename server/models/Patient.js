const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalNotes: {
    type: String,
    default: ''
  },
  allergies: {
    type: String,
    default: 'None'
  },
  generalNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Completed treatment'],
    default: 'Active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Text index for global search
patientSchema.index({ name: 'text', phone: 'text', patientId: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
