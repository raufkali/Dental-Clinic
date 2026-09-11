const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

router.route('/:id')
  .put(updateAppointment)
  .delete(deleteAppointment);

router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
