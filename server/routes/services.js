const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getServices)
  .post(createService);

router.route('/:id')
  .get(getServiceById)
  .put(updateService)
  .delete(deleteService);

router.patch('/:id/toggle-status', toggleServiceStatus);

module.exports = router;
