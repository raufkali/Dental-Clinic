const Payment = require('../models/Payment');
const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Transaction = require('../models/Transaction');
const Installment = require('../models/Installment');
const Setting = require('../models/Setting');
const { nextPaymentId, nextTransactionId } = require('../utils/idGenerator');
const { logAudit } = require('../services/auditService');

// @desc    Get payments with filters
// @route   GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { patientId, treatmentId, startDate, endDate, isVoid } = req.query;
    let query = {};

    if (patientId) query.patientId = patientId;
    if (treatmentId) query.treatmentId = treatmentId;
    if (isVoid !== undefined) query.isVoid = isVoid === 'true';

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const payments = await Payment.find(query)
      .populate('patientId', 'patientId name phone')
      .populate({
        path: 'treatmentId',
        select: 'treatmentId contractAmount serviceId',
        populate: { path: 'serviceId', select: 'name' }
      })
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new payment (Atomic ledger entry)
// @route   POST /api/payments
const createPayment = async (req, res, next) => {
  try {
    const {
      patientId,
      treatmentId,
      amount,
      paymentType = 'Monthly Installment',
      paymentMethod = 'Cash',
      paymentDate,
      reference = '',
      notes = '',
      allowOverpayment = false
    } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    const treatment = await Treatment.findById(treatmentId).populate('serviceId', 'name');
    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Treatment not found' });
    }

    const patient = await Patient.findById(patientId || treatment.patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Section 10: Validation against remaining balance
    const existingPayments = await Payment.find({ treatmentId: treatment._id, isVoid: false });
    const currentPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentRemaining = Math.max(0, treatment.contractAmount - currentPaid);

    if (numAmount > currentRemaining && !allowOverpayment) {
      return res.status(400).json({
        success: false,
        requiresConfirmation: true,
        message: `Payment of Rs. ${numAmount.toLocaleString()} exceeds the remaining balance of Rs. ${currentRemaining.toLocaleString()}. Please confirm if you wish to record an overpayment/credit.`,
        remainingBalance: currentRemaining
      });
    }

    const pDate = paymentDate ? new Date(paymentDate) : new Date();
    const paymentId = await nextPaymentId();
    const transactionId = await nextTransactionId();
    const staffName = req.user ? req.user.name : 'Staff';

    // 1. Create Payment Document
    const payment = await Payment.create({
      paymentId,
      patientId: patient._id,
      treatmentId: treatment._id,
      amount: numAmount,
      paymentType,
      paymentMethod,
      paymentDate: pDate,
      reference,
      notes,
      isVoid: false,
      createdBy: staffName
    });

    // 2. Create Linked Accounting Income Transaction
    const serviceName = treatment.serviceId?.name || 'Treatment';
    const transaction = await Transaction.create({
      transactionId,
      type: 'Income',
      category: 'Treatment Payment',
      amount: numAmount,
      patientId: patient._id,
      patientName: patient.name,
      treatmentId: treatment._id,
      paymentId: payment._id,
      paymentMethod,
      transactionDate: pDate,
      description: `${patient.name} - ${serviceName} (${paymentType})`,
      reference: paymentId,
      isVoid: false,
      createdBy: staffName
    });

    // 3. Section 12: Associate payment with installment records where appropriate
    let remainingToApply = numAmount;
    const unpaidInstallments = await Installment.find({
      treatmentId: treatment._id,
      status: { $in: ['Due', 'Overdue', 'Partially Paid'] }
    }).sort({ installmentNumber: 1 });

    for (const inst of unpaidInstallments) {
      if (remainingToApply <= 0) break;

      const instRemaining = inst.expectedAmount - inst.paidAmount;
      if (remainingToApply >= instRemaining) {
        inst.paidAmount = inst.expectedAmount;
        inst.status = 'Paid';
        if (!inst.paymentIds.includes(payment._id)) {
          inst.paymentIds.push(payment._id);
        }
        await inst.save();
        remainingToApply -= instRemaining;
      } else {
        inst.paidAmount += remainingToApply;
        inst.status = 'Partially Paid';
        if (!inst.paymentIds.includes(payment._id)) {
          inst.paymentIds.push(payment._id);
        }
        await inst.save();
        remainingToApply = 0;
      }
    }

    const newTotalPaid = currentPaid + numAmount;
    const newRemaining = Math.max(0, treatment.contractAmount - newTotalPaid);

    // If fully paid, optionally update treatment status
    if (newRemaining === 0 && treatment.status === 'Active') {
      treatment.status = 'Completed';
      await treatment.save();
    }

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment.paymentId,
      details: {
        patient: patient.name,
        treatment: serviceName,
        amount: numAmount,
        type: paymentType,
        method: paymentMethod,
        remainingBalance: newRemaining
      }
    });

    // Fetch clinic settings for receipt
    const settings = await Setting.findOne().lean();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        transaction,
        financials: {
          contractAmount: treatment.contractAmount,
          totalPaid: newTotalPaid,
          remainingBalance: newRemaining
        },
        receipt: {
          clinicName: settings?.clinicName || 'Dental Clinic',
          clinicAddress: settings?.clinicAddress || '',
          clinicPhone: settings?.phone || '',
          receiptNumber: paymentId,
          date: pDate,
          patientName: patient.name,
          patientId: patient.patientId,
          serviceName: serviceName,
          paymentType,
          amount: numAmount,
          paymentMethod,
          remainingBalance: newRemaining,
          authorizedStaff: staffName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Void / Reverse Payment (Section 30)
// @route   POST /api/payments/:id/void
const voidPayment = async (req, res, next) => {
  try {
    const { reason = 'Recorded in error' } = req.body;
    const payment = await Payment.findById(req.params.id)
      .populate('patientId', 'name patientId')
      .populate('treatmentId', 'treatmentId contractAmount serviceId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.isVoid) {
      return res.status(400).json({ success: false, message: 'This payment is already voided' });
    }

    const staffName = req.user ? req.user.name : 'Staff';

    // 1. Mark payment as void
    payment.isVoid = true;
    payment.voidReason = reason;
    payment.voidDate = new Date();
    payment.voidBy = staffName;
    await payment.save();

    // 2. Mark original transaction as void
    await Transaction.updateMany(
      { paymentId: payment._id },
      { $set: { isVoid: true, voidReason: reason } }
    );

    // 3. Create a reversal audit transaction
    const reversalTxnId = await nextTransactionId();
    await Transaction.create({
      transactionId: reversalTxnId,
      type: 'Expense',
      category: 'Payment Void / Reversal',
      amount: payment.amount,
      patientId: payment.patientId?._id,
      patientName: payment.patientId?.name || '',
      treatmentId: payment.treatmentId?._id,
      paymentId: payment._id,
      paymentMethod: payment.paymentMethod,
      transactionDate: new Date(),
      description: `[VOID REVERSAL] ${payment.paymentId} - ${reason}`,
      reference: payment.paymentId,
      createdBy: staffName
    });

    // 4. Recalculate installments that referenced this payment
    const affectedInstallments = await Installment.find({ paymentIds: payment._id });
    for (const inst of affectedInstallments) {
      inst.paymentIds = inst.paymentIds.filter(id => String(id) !== String(payment._id));
      // Re-sum payments
      const activePayments = await Payment.find({ _id: { $in: inst.paymentIds }, isVoid: false });
      const newPaid = activePayments.reduce((s, p) => s + p.amount, 0);
      inst.paidAmount = newPaid;
      inst.status = newPaid >= inst.expectedAmount ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Due';
      await inst.save();
    }

    // 5. If treatment was marked Completed, revert to Active if balance remains
    if (payment.treatmentId) {
      const activePayments = await Payment.find({ treatmentId: payment.treatmentId._id, isVoid: false });
      const newPaid = activePayments.reduce((s, p) => s + p.amount, 0);
      const remaining = payment.treatmentId.contractAmount - newPaid;
      if (remaining > 0) {
        await Treatment.findByIdAndUpdate(payment.treatmentId._id, { status: 'Active' });
      }
    }

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'VOID_PAYMENT',
      entity: 'Payment',
      entityId: payment.paymentId,
      details: {
        amount: payment.amount,
        reason,
        patient: payment.patientId?.name
      }
    });

    res.json({
      success: true,
      message: `Payment ${payment.paymentId} has been successfully voided and reversed in the ledger.`,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing payment and sync linked ledger transaction
// @route   PUT /api/payments/:id
const updatePayment = async (req, res, next) => {
  try {
    const {
      amount,
      paymentType,
      paymentMethod,
      paymentDate,
      reference,
      notes
    } = req.body;

    const payment = await Payment.findById(req.params.id)
      .populate('patientId', 'name patientId')
      .populate('treatmentId', 'treatmentId contractAmount serviceId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }
      payment.amount = numAmount;
    }

    if (paymentType) payment.paymentType = paymentType;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (paymentDate) {
      payment.paymentDate = /^\d{4}-\d{2}-\d{2}$/.test(paymentDate)
        ? new Date(`${paymentDate}T12:00:00.000`)
        : new Date(paymentDate);
    }
    if (reference !== undefined) payment.reference = reference;
    if (notes !== undefined) payment.notes = notes;

    await payment.save();

    // Sync linked Transaction
    await Transaction.updateMany(
      { paymentId: payment._id },
      {
        $set: {
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionDate: payment.paymentDate,
          reference: payment.reference || payment.paymentId,
          description: `${payment.patientId?.name || 'Patient'} - Payment (${payment.paymentType})`
        }
      }
    );

    // Re-check treatment status if linked
    if (payment.treatmentId) {
      const activePayments = await Payment.find({ treatmentId: payment.treatmentId._id, isVoid: false });
      const totalPaid = activePayments.reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, payment.treatmentId.contractAmount - totalPaid);
      if (remaining === 0) {
        await Treatment.findByIdAndUpdate(payment.treatmentId._id, { status: 'Completed' });
      } else {
        await Treatment.findByIdAndUpdate(payment.treatmentId._id, { status: 'Active' });
      }
    }

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_PAYMENT',
      entity: 'Payment',
      entityId: payment.paymentId,
      details: {
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod
      }
    });

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a payment and remove its linked ledger transaction
// @route   DELETE /api/payments/:id
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patientId', 'name')
      .populate('treatmentId', 'contractAmount');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // 1. Delete linked Transaction(s)
    await Transaction.deleteMany({ paymentId: payment._id });

    // 2. Clear from Installments
    const installments = await Installment.find({ paymentIds: payment._id });
    for (const inst of installments) {
      inst.paymentIds = inst.paymentIds.filter((pid) => String(pid) !== String(payment._id));
      const remainingPayments = await Payment.find({
        _id: { $in: inst.paymentIds, $ne: payment._id },
        isVoid: false
      });
      const newPaid = remainingPayments.reduce((s, p) => s + p.amount, 0);
      inst.paidAmount = newPaid;
      inst.status = newPaid >= inst.expectedAmount ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Due';
      await inst.save();
    }

    // 3. Recalculate treatment status
    if (payment.treatmentId) {
      const activePayments = await Payment.find({
        treatmentId: payment.treatmentId._id,
        _id: { $ne: payment._id },
        isVoid: false
      });
      const newTotalPaid = activePayments.reduce((s, p) => s + p.amount, 0);
      const remaining = payment.treatmentId.contractAmount - newTotalPaid;
      if (remaining > 0) {
        await Treatment.findByIdAndUpdate(payment.treatmentId._id, { status: 'Active' });
      }
    }

    // 4. Delete the payment document
    await Payment.findByIdAndDelete(payment._id);

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'DELETE_PAYMENT',
      entity: 'Payment',
      entityId: payment.paymentId,
      details: {
        amount: payment.amount,
        patient: payment.patientId?.name
      }
    });

    res.json({
      success: true,
      message: 'Payment and associated ledger transactions deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  createPayment,
  voidPayment,
  updatePayment,
  deletePayment
};
