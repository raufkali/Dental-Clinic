const express = require('express');
const router = express.Router();
const {
  login,
  register,
  getMe,
  getUsers,
  createUser,
  updateUser,
  recoverPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/login', login);
router.post('/register', register);
router.post('/recover', recoverPassword);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Admin'), getUsers);
router.post('/users', protect, authorize('Admin'), createUser);
router.put('/users/:id', protect, authorize('Admin'), updateUser);

module.exports = router;
