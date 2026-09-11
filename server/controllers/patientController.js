const Patient = require('../models/Patient');
const Treatment = require('../models/Treatment');
const Payment = require('../models/Payment');
const { nextPatientId } = require('../utils/idGenerator');
const { logAudit } = require('../services/auditService');

// @desc    Get all patients with search and filters
// @route   GET /api/patients
const getPatients = async (req, res, next) => {
  try {
    const { q, status } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { patientId: searchRegex },
        { fatherName: searchRegex }
      ];
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient by ID with full treatments, payment history & financial summary
// @route   GET /api/patients/:id
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Load treatments with service populated
    const treatments = await Treatment.find({ patientId: patient._id })
      .populate('serviceId', 'name type minPrice maxPrice defaultPrice')
      .sort({ createdAt: -1 })
      .lean();

    // Load non-void payments
    const payments = await Payment.find({ patientId: patient._id })
      .populate('treatmentId', 'treatmentId contractAmount')
      .sort({ paymentDate: -1 })
      .lean();

    // Compute financial totals per treatment and overall
    let totalContractAmount = 0;
    let totalPaid = 0;

    const treatmentSummaries = treatments.map(trt => {
      totalContractAmount += trt.contractAmount;

      const trtPayments = payments.filter(
        p => !p.isVoid && String(p.treatmentId?._id || p.treatmentId) === String(trt._id)
      );
      const trtPaid = trtPayments.reduce((sum, p) => sum + p.amount, 0);
      totalPaid += trtPaid;

      const remaining = Math.max(0, trt.contractAmount - trtPaid);
      const progressPercent = trt.contractAmount > 0 ? ((trtPaid / trt.contractAmount) * 100).toFixed(1) : '100';

      return {
        ...trt,
        totalPaid: trtPaid,
        remainingBalance: remaining,
        progressPercent: Number(progressPercent)
      };
    });

    const overallRemaining = Math.max(0, totalContractAmount - totalPaid);

    res.json({
      success: true,
      data: {
        patient,
        treatments: treatmentSummaries,
        payments,
        financialSummary: {
          totalContractAmount,
          totalPaid,
          totalRemaining: overallRemaining
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
const createPatient = async (req, res, next) => {
  try {
    const {
      name,
      fatherName,
      gender,
      dateOfBirth,
      age,
      phone,
      email,
      address,
      emergencyContact,
      medicalNotes,
      allergies,
      generalNotes,
      status
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Patient name and phone number are required'
      });
    }

    const patientId = await nextPatientId();

    const patient = await Patient.create({
      patientId,
      name,
      fatherName: fatherName || '',
      gender: gender || 'Male',
      dateOfBirth: dateOfBirth || null,
      age: age ? Number(age) : undefined,
      phone,
      email: email || '',
      address: address || '',
      emergencyContact: emergencyContact || {},
      medicalNotes: medicalNotes || '',
      allergies: allergies || 'None',
      generalNotes: generalNotes || '',
      status: status || 'Active'
    });

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'CREATE_PATIENT',
      entity: 'Patient',
      entityId: patient.patientId,
      details: { name: patient.name, phone: patient.phone }
    });

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
const updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_PATIENT',
      entity: 'Patient',
      entityId: patient.patientId,
      details: { name: patient.name }
    });

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or deactivate patient
// @route   DELETE /api/patients/:id
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient has any treatments or payments
    const treatmentCount = await Treatment.countDocuments({ patientId: patient._id });
    if (treatmentCount > 0) {
      // Soft-deactivate if treatments exist
      patient.status = 'Inactive';
      await patient.save();

      await logAudit({
        user: req.user ? req.user.username : 'Staff',
        action: 'DEACTIVATE_PATIENT',
        entity: 'Patient',
        entityId: patient.patientId,
        details: { reason: 'Has existing treatments - marked inactive' }
      });

      return res.json({
        success: true,
        message: 'Patient has existing treatments. Status has been changed to Inactive.',
        data: patient
      });
    }

    await Patient.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'DELETE_PATIENT',
      entity: 'Patient',
      entityId: patient.patientId,
      details: { name: patient.name }
    });

    res.json({
      success: true,
      message: 'Patient removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};
