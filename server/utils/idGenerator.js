const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Treatment = require('../models/Treatment');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Appointment = require('../models/Appointment');

async function getNextId(prefix, model, idField) {
  try {
    const docs = await model.find(
      { [idField]: new RegExp(`^${prefix}-\\d+`) },
      { [idField]: 1 }
    ).lean();

    let maxNum = 0;
    for (const doc of docs) {
      if (doc && doc[idField]) {
        const parts = doc[idField].split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidate = `${prefix}-${nextNum.toString().padStart(3, '0')}`;

    // Safety guarantee: Ensure candidate does not already exist
    while (await model.exists({ [idField]: candidate })) {
      nextNum += 1;
      candidate = `${prefix}-${nextNum.toString().padStart(3, '0')}`;
    }

    return candidate;
  } catch (error) {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(10 + Math.random() * 90);
    return `${prefix}-${timestamp}${random}`;
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
