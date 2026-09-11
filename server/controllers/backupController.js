const fs = require('fs');
const path = require('path');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Treatment = require('../models/Treatment');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Installment = require('../models/Installment');
const Appointment = require('../models/Appointment');
const Setting = require('../models/Setting');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../services/auditService');

const backupsDir = path.resolve(__dirname, '../../data/backups');

// Ensure directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// @desc    Create database backup
// @route   POST /api/backup/create
const createBackup = async (req, res, next) => {
  try {
    const backupData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      patients: await Patient.find().lean(),
      services: await Service.find().lean(),
      treatments: await Treatment.find().lean(),
      payments: await Payment.find().lean(),
      transactions: await Transaction.find().lean(),
      installments: await Installment.find().lean(),
      appointments: await Appointment.find().lean(),
      settings: await Setting.findOne().lean(),
      users: await User.find().select('-passwordHash').lean()
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dental-backup-${timestamp}.json`;
    const filePath = path.join(backupsDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    await logAudit({
      user: req.user ? req.user.username : 'Admin',
      action: 'CREATE_BACKUP',
      entity: 'Database',
      details: { filename }
    });

    res.json({
      success: true,
      message: 'Backup created successfully',
      filename,
      sizeBytes: fs.statSync(filePath).size,
      records: {
        patients: backupData.patients.length,
        treatments: backupData.treatments.length,
        payments: backupData.payments.length,
        transactions: backupData.transactions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List available backups
// @route   GET /api/backup/list
const listBackups = async (req, res, next) => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(backupsDir)
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        const stats = fs.statSync(path.join(backupsDir, filename));
        return {
          filename,
          sizeBytes: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1),
          createdAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore database from backup
// @route   POST /api/backup/restore
const restoreBackup = async (req, res, next) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Backup filename is required' });
    }

    const filePath = path.join(backupsDir, path.basename(filename));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    // Clear and restore collections safely
    if (Array.isArray(data.patients)) {
      await Patient.deleteMany({});
      if (data.patients.length) await Patient.insertMany(data.patients);
    }

    if (Array.isArray(data.services)) {
      await Service.deleteMany({});
      if (data.services.length) await Service.insertMany(data.services);
    }

    if (Array.isArray(data.treatments)) {
      await Treatment.deleteMany({});
      if (data.treatments.length) await Treatment.insertMany(data.treatments);
    }

    if (Array.isArray(data.payments)) {
      await Payment.deleteMany({});
      if (data.payments.length) await Payment.insertMany(data.payments);
    }

    if (Array.isArray(data.transactions)) {
      await Transaction.deleteMany({});
      if (data.transactions.length) await Transaction.insertMany(data.transactions);
    }

    if (Array.isArray(data.installments)) {
      await Installment.deleteMany({});
      if (data.installments.length) await Installment.insertMany(data.installments);
    }

    if (Array.isArray(data.appointments)) {
      await Appointment.deleteMany({});
      if (data.appointments.length) await Appointment.insertMany(data.appointments);
    }

    if (data.settings) {
      await Setting.deleteMany({});
      await Setting.create(data.settings);
    }

    await logAudit({
      user: req.user ? req.user.username : 'Admin',
      action: 'RESTORE_BACKUP',
      entity: 'Database',
      details: { restoredFrom: filename }
    });

    res.json({
      success: true,
      message: `Database restored successfully from ${filename}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup
};
