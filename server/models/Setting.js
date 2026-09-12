const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  clinicName: {
    type: String,
    default: 'Dental Clinic'
  },
  doctorName: {
    type: String,
    default: 'Dr. Tariq Khan'
  },
  clinicAddress: {
    type: String,
    default: 'Suite 101, Dental Care Tower, Medical District'
  },
  phone: {
    type: String,
    default: '+92 300 1234567'
  },
  email: {
    type: String,
    default: 'contact@dentalclinic.com'
  },
  currency: {
    type: String,
    default: 'PKR'
  },
  currencySymbol: {
    type: String,
    default: 'Rs.'
  },
  receiptFooter: {
    type: String,
    default: 'Thank you for visiting Dental Clinic. Please keep this receipt for your records.'
  },
  fontTheme: {
    type: String,
    enum: ['classic', 'modern', 'system'],
    default: 'classic'
  },
  doctors: {
    type: [String],
    default: ['Dr. Ahmed', 'Dr. Bilal', 'Dr. Sara']
  },
  expenseCategories: {
    type: [String],
    default: [
      'Dental Materials',
      'Electricity',
      'Rent',
      'Staff Salary',
      'Equipment',
      'Laboratory Charges',
      'Maintenance',
      'Office Supplies',
      'Other'
    ]
  },
  defaultPaymentMethods: {
    type: [String],
    default: ['Cash', 'Bank Transfer', 'Card', 'Other']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
