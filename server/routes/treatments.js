const express = require('express');
const router = express.Router();
const {
  getTreatments,
  getTreatmentById,
  createTreatment,
  addTreatmentNote,
  updateTreatmentStatus
} = require('../controllers/treatmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTreatments)
  .post(createTreatment);

router.route('/:id')
  .get(getTreatmentById);

router.post('/:id/notes', addTreatmentNote);
router.patch('/:id/status', updateTreatmentStatus);

module.exports = router;
