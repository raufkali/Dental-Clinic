const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

module.exports = router;
