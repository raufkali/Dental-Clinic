const express = require('express');
const router = express.Router();
const {
  getTreatments,
  getTreatmentById,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  addTreatmentNote,
  updateTreatmentStatus,
  settleTreatment
} = require('../controllers/treatmentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTreatments)
  .post(createTreatment);

router.route('/:id')
  .get(getTreatmentById)
  .put(updateTreatment)
  .delete(deleteTreatment);

router.post('/:id/notes', addTreatmentNote);
router.patch('/:id/status', updateTreatmentStatus);
router.patch('/:id/settle', settleTreatment);

module.exports = router;
