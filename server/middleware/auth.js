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

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dental_clinic_jwt_secret_super_secure_offline_key_2026'
    );
    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user || !req.user.active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or not found'
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed or expired'
    });
  }
};

module.exports = { protect };
