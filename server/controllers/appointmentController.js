const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const { nextAppointmentId } = require('../utils/idGenerator');
const { logAudit } = require('../services/auditService');

// @desc    Get appointments by date (matching screenshot 1)
// @route   GET /api/appointments
const getAppointments = async (req, res, next) => {
  try {
    const { date, doctor, status } = req.query;
    let query = {};

    if (date) {
      query.date = date; // Format: YYYY-MM-DD
    }

    if (doctor && doctor !== 'All') {
      query.doctor = doctor;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'patientId name phone')
      .populate('serviceId', 'serviceId name')
      .sort({ time: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
const createAppointment = async (req, res, next) => {
  try {
    const {
      patientId,
      patientName: manualPatientName,
      phone: manualPhone,
      serviceId,
      serviceName: manualServiceName,
      treatmentId,
      date,
      time,
      doctor = '',
      notes = '',
      status = 'Scheduled'
    } = req.body;

    let finalPatientName = (manualPatientName || '').trim();
    let finalPhone = (manualPhone || '').trim();
    let finalPatientId = patientId || undefined;

    if (patientId) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        if (!finalPatientName) finalPatientName = patient.name;
        if (!finalPhone) finalPhone = patient.phone || '';
      }
    }

    if (!finalPatientName) {
      return res.status(400).json({
        success: false,
        message: 'Patient name is required'
      });
    }

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

    let serviceName = manualServiceName || 'General Consultation';
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) serviceName = service.name;
    }

    const staffName = req.user ? req.user.name : 'Staff';

    let appointment = null;
    let attempts = 0;
    while (!appointment && attempts < 5) {
      attempts++;
      const appointmentId = await nextAppointmentId();
      try {
        appointment = await Appointment.create({
          appointmentId,
          patientId: finalPatientId,
          patientName: finalPatientName,
          phone: finalPhone,
          serviceId: serviceId || undefined,
          serviceName,
          treatmentId: treatmentId || undefined,
          date,
          time,
          doctor: doctor || 'General',
          notes,
          status,
          createdBy: staffName
        });
      } catch (createErr) {
        if (createErr.code === 11000 && attempts < 5) {
          continue;
        }
        throw createErr;
      }
    }

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'CREATE_APPOINTMENT',
      entity: 'Appointment',
      entityId: appointment.appointmentId,
      details: {
        patient: finalPatientName,
        date,
        time,
        service: serviceName
      }
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.body.serviceId && req.body.serviceId !== String(appointment.serviceId)) {
      const service = await Service.findById(req.body.serviceId);
      if (service) appointment.serviceName = service.name;
    }

    Object.assign(appointment, req.body);
    await appointment.save();

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_APPOINTMENT',
      entity: 'Appointment',
      entityId: appointment.appointmentId,
      details: { status: appointment.status, date: appointment.date, time: appointment.time }
    });

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Scheduled', 'Completed', 'Cancelled', 'No Show'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'UPDATE_APPOINTMENT_STATUS',
      entity: 'Appointment',
      entityId: appointment.appointmentId,
      details: { status }
    });

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user ? req.user.username : 'Staff',
      action: 'DELETE_APPOINTMENT',
      entity: 'Appointment',
      entityId: appointment.appointmentId,
      details: { patient: appointment.patientName, date: appointment.date }
    });

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment
};
