const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 1. If valid JWT provided, verify it
  if (token && token !== 'offline_doctor_token' && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dental_clinic_jwt_secret_super_secure_offline_key_2026'
      );
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.active) {
        req.user = user;
        return next();
      }
    } catch (error) {
      // Continue to local offline fallback
    }
  }

  // 2. Standalone offline mode: auto-assign active clinic doctor / admin
  try {
    let localAdmin = await User.findOne({ role: 'Admin', active: true });
    if (!localAdmin) {
      localAdmin = await User.findOne({ active: true });
    }
    if (!localAdmin) {
      localAdmin = await User.create({
        name: 'Clinic Doctor',
        username: 'admin',
        passwordHash: 'offline_local_admin',
        role: 'Admin',
        active: true
      });
    }
    req.user = localAdmin;
    return next();
  } catch (err) {
    // If DB is initializing or offline, provide fallback doctor object
    req.user = {
      _id: '000000000000000000000001',
      name: 'Clinic Doctor',
      username: 'admin',
      role: 'Admin',
      active: true
    };
    return next();
  }
};

module.exports = { protect };
