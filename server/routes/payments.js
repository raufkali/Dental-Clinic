const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  voidPayment,
  updatePayment,
  deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPayments)
  .post(createPayment);

router.route('/:id')
  .put(updatePayment)
  .delete(deletePayment);

router.post('/:id/void', voidPayment);

module.exports = router;
