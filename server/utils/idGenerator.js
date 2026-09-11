const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Treatment = require('../models/Treatment');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');

async function getNextId(prefix, model, idField) {
  try {
    const lastDoc = await model.findOne({ [idField]: new RegExp(`^${prefix}-`) })
      .sort({ createdAt: -1 })
      .lean();

    if (!lastDoc || !lastDoc[idField]) {
      return `${prefix}-001`;
    }

    const parts = lastDoc[idField].split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (isNaN(lastNum)) {
      return `${prefix}-001`;
    }

    const nextNum = (lastNum + 1).toString().padStart(3, '0');
    return `${prefix}-${nextNum}`;
  } catch (error) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomSuffix}`;
  }
}

module.exports = {
  nextPatientId: () => getNextId('P', Patient, 'patientId'),
  nextServiceId: () => getNextId('SRV', Service, 'serviceId'),
  nextTreatmentId: () => getNextId('TRT', Treatment, 'treatmentId'),
  nextPaymentId: () => getNextId('PAY', Payment, 'paymentId'),
  nextTransactionId: () => getNextId('TXN', Transaction, 'transactionId'),
  nextAppointmentId: () => getNextId('APT', Appointment, 'appointmentId')
};
