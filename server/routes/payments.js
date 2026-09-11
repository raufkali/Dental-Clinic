const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  voidPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.post('/:id/void', voidPayment);

module.exports = router;
