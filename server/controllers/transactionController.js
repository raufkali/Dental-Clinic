const Transaction = require('../models/Transaction');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Setting = require('../models/Setting');
const { nextTransactionId } = require('../utils/idGenerator');
const { logAudit } = require('../services/auditService');

// @desc    Get transactions ledger with summary stats matching screenshot 4
// @route   GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const {
      q,
      type,
      category,
      paymentMethod,
      startDate,
      endDate,
      today: clientToday,
      includeVoid = 'false'
    } = req.query;

    let query = {};

    if (includeVoid !== 'true') {
      query.isVoid = false;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(`${startDate}T00:00:00.000`);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(`${endDate}T23:59:59.999`);
      }
    }

    // Text / search query
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { transactionId: searchRegex },
        { reference: searchRegex },
        { category: searchRegex },
        { patientName: searchRegex }
      ];
    }

    // Populate patient and treatment service
    const transactions = await Transaction.find(query)
      .populate('patientId', 'patientId name phone')
      .populate({
        path: 'treatmentId',
        select: 'treatmentId serviceId',
        populate: { path: 'serviceId', select: 'name' }
      })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();

    // If search text was supplied, also search patient name in populated results if needed
    let filteredTransactions = transactions;
    if (q && q.trim()) {
      const lower = q.trim().toLowerCase();
      filteredTransactions = transactions.filter(t => {
        const patientName = (t.patientName || t.patientId?.name || '').toLowerCase();
        const serviceName = (t.treatmentId?.serviceId?.name || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const txnId = (t.transactionId || '').toLowerCase();
        return patientName.includes(lower) || serviceName.includes(lower) || desc.includes(lower) || txnId.includes(lower);
      });
    }

    // Compute ledger totals for filtered items
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'Income' && !t.isVoid)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'Expense' && !t.isVoid)
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Today stats (independent of filter date range, matching top cards in screenshot 4)
    let todayStart, todayEnd;
    if (clientToday && /^\d{4}-\d{2}-\d{2}$/.test(clientToday)) {
      todayStart = new Date(`${clientToday}T00:00:00.000`);
      todayEnd = new Date(`${clientToday}T23:59:59.999`);
    } else {
      todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
    }

    const todayTransactions = await Transaction.find({
      isVoid: false,
      transactionDate: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    const todayIncome = todayTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayExpenses = todayTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayNet = todayIncome - todayExpenses;

    res.json({
      success: true,
      count: filteredTransactions.length,
      data: filteredTransactions,
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        todayIncome,
        todayExpenses,
        todayNet
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add manual Income or Expense transaction (Section 14)
// @route   POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const {
      type, // 'Income' or 'Expense'
      category,
      amount,
      patientId,
      patientName: manualPatientName,
      serviceId,
      paymentMethod = 'Cash',
      transactionDate,
      description,
      reference = ''
    } = req.body;

    if (!type || !['Income', 'Expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be Income or Expense' });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    let finalPatientName = (manualPatientName || '').trim();
    if (patientId && !finalPatientName) {
      const patient = await Patient.findById(patientId);
      if (patient) finalPatientName = patient.name;
    }

    let txnDateObj;
    if (transactionDate) {
      txnDateObj = /^\d{4}-\d{2}-\d{2}$/.test(transactionDate)
        ? new Date(`${transactionDate}T12:00:00.000`)
        : new Date(transactionDate);
    } else {
      txnDateObj = new Date();
    }

    const transactionId = await nextTransactionId();
    const staffName = req.user ? req.user.name : 'Staff';

    const transaction = await Transaction.create({
      transactionId,
      type,
      category: category.trim(),
      amount: numAmount,
      patientId: patientId || undefined,
      patientName: finalPatientName,
      paymentMethod,
      transactionDate: txnDateObj,
      description: description.trim(),
      reference: reference.trim(),
      createdBy: staffName
    });

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: type === 'Income' ? 'CREATE_INCOME' : 'CREATE_EXPENSE',
      entity: 'Transaction',
      entityId: transaction.transactionId,
      details: {
        category: transaction.category,
        amount: numAmount,
        type,
        description: transaction.description
      }
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('patientId', 'patientId name phone')
      .lean();

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction
};
