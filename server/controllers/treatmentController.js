const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Installment = require('../models/Installment');
const { nextTreatmentId, nextPaymentId, nextTransactionId } = require('../utils/idGenerator');
const { logAudit } = require('../services/auditService');

// Helper to calculate financials for a treatment
async function getTreatmentFinancials(treatmentId) {
  const treatment = await Treatment.findById(treatmentId)
    .populate('patientId', 'patientId name phone email')
    .populate('serviceId', 'serviceId name type minPrice maxPrice defaultPrice')
    .lean();

  if (!treatment) return null;

  const payments = await Payment.find({ treatmentId, isVoid: false })
    .sort({ paymentDate: -1 })
    .lean();

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = treatment.isSettled ? 0 : Math.max(0, treatment.contractAmount - totalPaid);
  const progressPercent = treatment.isSettled
    ? 100
    : (treatment.contractAmount > 0
        ? Number(((totalPaid / treatment.contractAmount) * 100).toFixed(1))
        : 100);

  const installments = await Installment.find({ treatmentId })
    .sort({ installmentNumber: 1 })
    .lean();

  return {
    ...treatment,
    totalPaid,
    remainingBalance,
    progressPercent,
    payments,
    installments
  };
}

// @desc    Get all treatments
// @route   GET /api/treatments
const getTreatments = async (req, res, next) => {
  try {
    const { patientId, serviceId, status } = req.query;
    let query = {};

    if (patientId) query.patientId = patientId;
    if (serviceId) query.serviceId = serviceId;
    if (status && status !== 'All') query.status = status;

    const treatments = await Treatment.find(query)
      .populate('patientId', 'patientId name phone')
      .populate('serviceId', 'serviceId name type minPrice maxPrice')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch payments to compute balances
    const treatmentIds = treatments.map(t => t._id);
    const payments = await Payment.find({ treatmentId: { $in: treatmentIds }, isVoid: false }).lean();

    const results = treatments.map(t => {
      const tPayments = payments.filter(p => String(p.treatmentId) === String(t._id));
      const totalPaid = tPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = t.isSettled ? 0 : Math.max(0, t.contractAmount - totalPaid);
      const progressPercent = t.isSettled
        ? 100
        : (t.contractAmount > 0
            ? Number(((totalPaid / t.contractAmount) * 100).toFixed(1))
            : 100);

      return {
        ...t,
        totalPaid,
        remainingBalance,
        progressPercent
      };
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single treatment with full ledger & installments
// @route   GET /api/treatments/:id
const getTreatmentById = async (req, res, next) => {
  try {
    const data = await getTreatmentFinancials(req.params.id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Treatment not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new treatment / contract
// @route   POST /api/treatments
const createTreatment = async (req, res, next) => {
  try {
    const {
      patientId,
      serviceId,
      contractAmount,
      initialPaymentAmount = 0,
      monthlyInstallment = 0,
      startDate,
      expectedEndDate,
      durationMonths = 0,
      initialPaymentMethod = 'Cash',
      notes = ''
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const finalAmount = Number(contractAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Contract amount must be a positive number' });
    }

    const initialAmount = Number(initialPaymentAmount) || 0;
    if (initialAmount > finalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Initial payment cannot exceed the total contract amount'
      });
    }

    const treatmentId = await nextTreatmentId();
    const initialNotes = [];
    if (notes && notes.trim()) {
      initialNotes.push({
        note: notes.trim(),
        date: new Date(),
        createdBy: req.user ? req.user.name : 'Staff'
      });
    }

    // 1. Create Treatment
    const treatment = await Treatment.create({
      treatmentId,
      patientId: patient._id,
      serviceId: service._id,
      contractAmount: finalAmount,
      initialPaymentAmount: initialAmount,
      monthlyInstallment: Number(monthlyInstallment) || 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
      durationMonths: Number(durationMonths) || 0,
      status: 'Active',
      notes: initialNotes
    });

    let initialPaymentDoc = null;

    // 2. Section 8: Handle Initial Payment as actual financial record
    if (initialAmount > 0) {
      const paymentId = await nextPaymentId();
      const transactionId = await nextTransactionId();

      initialPaymentDoc = await Payment.create({
        paymentId,
        patientId: patient._id,
        treatmentId: treatment._id,
        amount: initialAmount,
        paymentType: 'Initial / Advance',
        paymentMethod: initialPaymentMethod || 'Cash',
        paymentDate: startDate ? new Date(startDate) : new Date(),
        reference: `Initial advance for ${service.name}`,
        notes: 'Initial / Advance contract payment',
        createdBy: req.user ? req.user.name : 'Staff'
      });

      // Create linked Accounting Income Transaction
      await Transaction.create({
        transactionId,
        type: 'Income',
        category: 'Treatment Payment',
        amount: initialAmount,
        patientId: patient._id,
        treatmentId: treatment._id,
        paymentId: initialPaymentDoc._id,
        paymentMethod: initialPaymentMethod || 'Cash',
        transactionDate: startDate ? new Date(startDate) : new Date(),
        description: `${patient.name} - ${service.name} (Initial Payment)`,
        reference: paymentId,
        createdBy: req.user ? req.user.name : 'Staff'
      });
    }

    // 3. Section 12: Generate Monthly Installment schedule if installment amount is specified
    const monthlyAmount = Number(monthlyInstallment);
    const balanceAfterInitial = finalAmount - initialAmount;

    if (monthlyAmount > 0 && balanceAfterInitial > 0) {
      const installmentsCount = durationMonths > 0
        ? durationMonths
        : Math.ceil(balanceAfterInitial / monthlyAmount);

      const start = startDate ? new Date(startDate) : new Date();

      for (let i = 1; i <= installmentsCount; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Last installment adjusts to remaining balance
        const remainingSchedule = balanceAfterInitial - (i - 1) * monthlyAmount;
        const thisInstallmentAmount = Math.min(monthlyAmount, Math.max(0, remainingSchedule));

        if (thisInstallmentAmount > 0) {
          await Installment.create({
            treatmentId: treatment._id,
            patientId: patient._id,
            installmentNumber: i,
            dueDate,
            expectedAmount: thisInstallmentAmount,
            paidAmount: 0,
            status: 'Due'
          });
        }
      }
    }

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'CREATE_TREATMENT_CONTRACT',
      entity: 'Treatment',
      entityId: treatment.treatmentId,
      details: {
        patient: patient.name,
        service: service.name,
        contractAmount: finalAmount,
        initialPayment: initialAmount
      }
    });

    const fullData = await getTreatmentFinancials(treatment._id);

    res.status(201).json({
      success: true,
      data: fullData,
      initialPayment: initialPaymentDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add clinical note to treatment
// @route   POST /api/treatments/:id/notes
const addTreatmentNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Treatment not found' });
    }

    treatment.notes.push({
      note: note.trim(),
      date: new Date(),
      createdBy: req.user ? req.user.name : 'Staff'
    });

    await treatment.save();

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'ADD_TREATMENT_NOTE',
      entity: 'Treatment',
      entityId: treatment.treatmentId,
      details: { note: note.trim() }
    });

    res.json({
      success: true,
      data: treatment.notes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update treatment status (Active, Completed, Cancelled)
// @route   PATCH /api/treatments/:id/status
const updateTreatmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Treatment not found' });
    }

    treatment.status = status;
    await treatment.save();

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_TREATMENT_STATUS',
      entity: 'Treatment',
      entityId: treatment.treatmentId,
      details: { newStatus: status }
    });

    res.json({
      success: true,
      data: treatment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark treatment as fully settled early (forgive remaining balance, no more payments required)
// @route   PATCH /api/treatments/:id/settle
const settleTreatment = async (req, res, next) => {
  try {
    const { reason = 'Treatment completed early / balance waived by doctor' } = req.body;
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Treatment not found' });
    }

    treatment.isSettled = true;
    treatment.status = 'Settled';
    treatment.settledDate = new Date();
    treatment.settledReason = reason;
    treatment.settledBy = req.user ? req.user.name : 'Staff';

    // Add note
    treatment.notes.push({
      note: `[SETTLED] Treatment marked fully settled early. Reason: ${reason}. Remaining balance waived.`,
      date: new Date(),
      createdBy: req.user ? req.user.name : 'Staff'
    });

    await treatment.save();

    // Mark pending installments as Waived
    await Installment.updateMany(
      { treatmentId: treatment._id, status: { $in: ['Due', 'Overdue'] } },
      { $set: { status: 'Waived', notes: 'Waived due to full early settlement' } }
    );

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'SETTLE_TREATMENT',
      entity: 'Treatment',
      entityId: treatment.treatmentId,
      details: { reason }
    });

    const fullData = await getTreatmentFinancials(treatment._id);

    res.json({
      success: true,
      message: 'Treatment marked as fully settled',
      data: fullData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update treatment contract details
// @route   PUT /api/treatments/:id
const updateTreatment = async (req, res, next) => {
  try {
    const {
      contractAmount,
      monthlyInstallment,
      durationMonths,
      startDate,
      status,
      notes
    } = req.body;

    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Treatment not found' });
    }

    if (contractAmount !== undefined) {
      const numContract = Number(contractAmount);
      if (isNaN(numContract) || numContract <= 0) {
        return res.status(400).json({ success: false, message: 'Contract amount must be a positive number' });
      }
      treatment.contractAmount = numContract;
    }

    if (monthlyInstallment !== undefined) {
      treatment.monthlyInstallment = Math.max(0, Number(monthlyInstallment) || 0);
    }

    if (durationMonths !== undefined) {
      treatment.durationMonths = Math.max(0, Number(durationMonths) || 0);
    }

    if (startDate) {
      treatment.startDate = new Date(startDate);
    }

    if (status && ['Active', 'Completed', 'Settled', 'Cancelled'].includes(status)) {
      treatment.status = status;
      if (status === 'Settled') treatment.isSettled = true;
      if (status === 'Active') treatment.isSettled = false;
    }

    if (notes && typeof notes === 'string' && notes.trim()) {
      treatment.notes.push({
        note: notes.trim(),
        date: new Date(),
        createdBy: req.user ? req.user.name : 'Staff'
      });
    }

    await treatment.save();

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_TREATMENT',
      entity: 'Treatment',
      entityId: treatment.treatmentId,
      details: {
        contractAmount: treatment.contractAmount,
        status: treatment.status
      }
    });

    const fullData = await getTreatmentFinancials(treatment._id);

    res.json({
      success: true,
      message: 'Treatment updated successfully',
      data: fullData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete treatment contract and cascade linked records
// @route   DELETE /api/treatments/:id
const deleteTreatment = async (req, res, next) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) {
      return res.status(404).json({ success: false, message: 'Treatment not found' });
    }

    // Delete associated installments
    await Installment.deleteMany({ treatmentId: treatment._id });

    // Delete associated payments and ledger transactions
    const payments = await Payment.find({ treatmentId: treatment._id });
    const paymentIds = payments.map((p) => p._id);
    await Transaction.deleteMany({
      $or: [
        { treatmentId: treatment._id },
        { paymentId: { $in: paymentIds } }
      ]
    });
    await Payment.deleteMany({ treatmentId: treatment._id });

    // Delete treatment document
    await Treatment.findByIdAndDelete(treatment._id);

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'DELETE_TREATMENT',
      entity: 'Treatment',
      entityId: treatment.treatmentId,
      details: {
        contractAmount: treatment.contractAmount
      }
    });

    res.json({
      success: true,
      message: 'Treatment and linked payments/installments deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTreatments,
  getTreatmentById,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  addTreatmentNote,
  updateTreatmentStatus,
  settleTreatment,
  getTreatmentFinancials
};
