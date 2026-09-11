const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getFinancialReport,
  getServiceRevenueReport,
  getPatientStatement
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardData);
router.get('/financial', getFinancialReport);
router.get('/services', getServiceRevenueReport);
router.get('/patient-statement/:patientId', getPatientStatement);

module.exports = router;
