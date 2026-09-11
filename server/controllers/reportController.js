const Transaction = require('../models/Transaction');
const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');

// @desc    Get dashboard metrics & chart data matching Section 3
// @route   GET /api/reports/dashboard
const getDashboardData = async (req, res, next) => {
  try {
    const { chartPeriod = '30days', today: clientToday } = req.query; // '7days', '30days', 'month'

    // 1. Total Patients & Active Treatments
    const totalPatients = await Patient.countDocuments();
    const activeTreatments = await Treatment.countDocuments({ status: 'Active' });

    // 2. Today's date range
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

    // 3. Current Month date range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTransactions = await Transaction.find({
      isVoid: false,
      transactionDate: { $gte: monthStart, $lte: monthEnd }
    }).lean();

    const monthlyIncome = monthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 4. Total Outstanding Payments across all treatments
    const allTreatments = await Treatment.find({ status: { $ne: 'Cancelled' } }).lean();
    const allValidPayments = await Payment.find({ isVoid: false }).lean();

    let totalContracted = 0;
    let totalPaymentsReceived = 0;

    allTreatments.forEach(t => {
      totalContracted += t.contractAmount || 0;
      const tPaid = allValidPayments
        .filter(p => String(p.treatmentId) === String(t._id))
        .reduce((sum, p) => sum + p.amount, 0);
      totalPaymentsReceived += tPaid;
    });

    const totalOutstanding = Math.max(0, totalContracted - totalPaymentsReceived);

    // 5. Recent Transactions (last 10)
    const recentTransactions = await Transaction.find({ isVoid: false })
      .populate('patientId', 'name')
      .populate({
        path: 'treatmentId',
        select: 'serviceId',
        populate: { path: 'serviceId', select: 'name' }
      })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(8)
      .lean();

    // 6. Income/Expense chart data based on chartPeriod
    let daysToInclude = 30;
    if (chartPeriod === '7days') daysToInclude = 7;
    else if (chartPeriod === 'month') daysToInclude = now.getDate();

    const chartData = [];
    for (let i = daysToInclude - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTxns = await Transaction.find({
        isVoid: false,
        transactionDate: { $gte: dayStart, $lte: dayEnd }
      }).lean();

      const dayIncome = dayTxns
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);

      const dayExpense = dayTxns
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      chartData.push({
        date: label,
        income: dayIncome,
        expenses: dayExpense,
        net: dayIncome - dayExpense
      });
    }

    // Today's appointments count
    const todayDateStr = (clientToday && /^\d{4}-\d{2}-\d{2}$/.test(clientToday))
      ? clientToday
      : now.toISOString().split('T')[0];
    const todayAppointments = await Appointment.find({ date: todayDateStr }).sort({ time: 1 }).lean();

    res.json({
      success: true,
      data: {
        cards: {
          totalPatients,
          activeTreatments,
          todayIncome,
          todayExpenses,
          todayNet,
          totalOutstanding,
          monthlyIncome,
          monthlyExpenses
        },
        chartData,
        recentTransactions,
        todayAppointments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Financial Report (Daily / Monthly / Custom date range)
// @route   GET /api/reports/financial
const getFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { isVoid: false };
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.transactionDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    const transactions = await Transaction.find(query)
      .populate('patientId', 'name patientId')
      .populate({
        path: 'treatmentId',
        select: 'serviceId',
        populate: { path: 'serviceId', select: 'name' }
      })
      .sort({ transactionDate: 1 })
      .lean();

    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((s, t) => s + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((s, t) => s + t.amount, 0);

    const netIncome = totalIncome - totalExpenses;

    // Breakdown by Category
    const categoryBreakdown = {};
    transactions.forEach(t => {
      const cat = t.category || 'General';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { type: t.type, amount: 0, count: 0 };
      }
      categoryBreakdown[cat].amount += t.amount;
      categoryBreakdown[cat].count += 1;
    });

    // Breakdown by Payment Method
    const methodBreakdown = {};
    transactions.forEach(t => {
      const m = t.paymentMethod || 'Cash';
      if (!methodBreakdown[m]) {
        methodBreakdown[m] = { income: 0, expense: 0 };
      }
      if (t.type === 'Income') methodBreakdown[m].income += t.amount;
      else methodBreakdown[m].expense += t.amount;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netIncome,
          transactionCount: transactions.length
        },
        categoryBreakdown,
        methodBreakdown,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Service Revenue Report (Section 16)
// @route   GET /api/reports/services
const getServiceRevenueReport = async (req, res, next) => {
  try {
    const services = await Service.find().lean();
    const treatments = await Treatment.find().populate('serviceId').lean();
    const payments = await Payment.find({ isVoid: false }).lean();

    const report = services.map(srv => {
      const srvTreatments = treatments.filter(
        t => t.serviceId && String(t.serviceId._id || t.serviceId) === String(srv._id)
      );
      const treatmentIds = srvTreatments.map(t => String(t._id));

      const totalContractValue = srvTreatments.reduce((sum, t) => sum + (t.contractAmount || 0), 0);
      const srvPayments = payments.filter(p => treatmentIds.includes(String(p.treatmentId)));
      const totalRevenue = srvPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = Math.max(0, totalContractValue - totalRevenue);

      return {
        serviceId: srv.serviceId,
        serviceName: srv.name,
        type: srv.type,
        casesCount: srvTreatments.length,
        totalContractValue,
        totalRevenue,
        outstanding
      };
    });

    // Sort by revenue descending
    report.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Patient Payment Report (Section 16)
// @route   GET /api/reports/patient-statement/:patientId
const getPatientStatement = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const treatments = await Treatment.find({ patientId: patient._id })
      .populate('serviceId')
      .lean();

    const payments = await Payment.find({ patientId: patient._id })
      .populate({
        path: 'treatmentId',
        select: 'treatmentId serviceId',
        populate: { path: 'serviceId', select: 'name' }
      })
      .sort({ paymentDate: -1 })
      .lean();

    let totalContracted = 0;
    treatments.forEach(t => {
      totalContracted += t.contractAmount || 0;
    });

    const validPayments = payments.filter(p => !p.isVoid);
    const totalPaid = validPayments.reduce((s, p) => s + p.amount, 0);
    const remainingBalance = Math.max(0, totalContracted - totalPaid);

    res.json({
      success: true,
      data: {
        patient,
        totalContracted,
        totalPaid,
        remainingBalance,
        treatments,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
  getFinancialReport,
  getServiceRevenueReport,
  getPatientStatement
};
