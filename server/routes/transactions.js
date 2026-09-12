const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  voidTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

router.post('/:id/void', voidTransaction);

module.exports = router;
