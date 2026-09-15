const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../services/auditService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'dental_clinic_jwt_secret_super_secure_offline_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Auth user & get token (supports username, email, or phone)
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your email/phone and password'
      });
    }

    const cleanInput = username.trim().toLowerCase();
    let user = await User.findOne({
      $or: [
        { username: cleanInput },
        { email: cleanInput },
        { phone: username.trim() }
      ]
    });

    let passwordMatches = user ? await user.matchPassword(password) : false;

    // If local check failed, attempt to authenticate and sync from Problos server if online
    if (!user || !passwordMatches) {
      try {
        const probosRes = await fetch('http://127.0.0.1:5000/api/licenses/desktop-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanInput,
            password
          })
        });
        const probosData = await probosRes.json();
        if (probosRes.ok && probosData.success && probosData.data?.user) {
          const remoteUser = probosData.data.user;
          const hashedPassword = await User.hashPassword(password);
          if (!user) {
            const desiredUsername = remoteUser.email ? remoteUser.email.split('@')[0] : (remoteUser.phone || 'admin');
            user = await User.create({
              name: remoteUser.name || 'Admin Doctor',
              username: desiredUsername.toLowerCase().trim(),
              email: remoteUser.email ? remoteUser.email.toLowerCase().trim() : null,
              phone: remoteUser.phone ? remoteUser.phone.trim() : null,
              passwordHash: hashedPassword,
              role: 'Admin',
              active: true
            });
          } else {
            user.passwordHash = hashedPassword;
            if (remoteUser.phone) user.phone = remoteUser.phone.trim();
            if (remoteUser.email) user.email = remoteUser.email.toLowerCase().trim();
            await user.save();
          }
          passwordMatches = true;
        }
      } catch (err) {
        // Offline - continue to local validation failure
      }
    }

    if (!user || !passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.'
      });
    }

    await logAudit({
      user: user.username,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      details: { role: user.role }
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role || 'Admin',
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Recover password using registered phone number
// @route   POST /api/auth/recover
const recoverPassword = async (req, res, next) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered phone number and new password'
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 4 characters long'
      });
    }

    const cleanPhone = phone.trim();
    let user = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { username: cleanPhone.toLowerCase() }
      ]
    });

    // Also attempt to notify/sync with Problos server if online
    try {
      const probosRes = await fetch('http://127.0.0.1:5000/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          newPassword
        })
      });
      const probosData = await probosRes.json();
      if (!user && probosRes.ok && probosData.success) {
        const newHash = await User.hashPassword(newPassword);
        user = await User.create({
          name: 'Admin Doctor',
          username: cleanPhone,
          phone: cleanPhone,
          email: probosData.data?.email || null,
          passwordHash: newHash,
          role: 'Admin',
          active: true
        });
      }
    } catch (e) {
      // Offline fallback
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found matching this phone number.'
      });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    await logAudit({
      user: user.username,
      action: 'PASSWORD_RECOVERED',
      entity: 'User',
      entityId: user._id,
      details: { phone: cleanPhone }
    });

    res.json({
      success: true,
      message: 'Password recovered successfully! You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register new user (for testing & onboarding)
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, username, password, role = 'Admin', email, phone } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and password are required'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters long'
      });
    }

    const userExists = await User.findOne({ username: username.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: `Username '${username}' is already taken. Please choose another username.`
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: phone ? phone.trim() : null,
      passwordHash,
      role: 'Admin',
      active: true
    });

    await logAudit({
      user: user.username,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user._id,
      details: { username: user.username, role: user.role }
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all clinic users
// @route   GET /api/auth/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (Admin)
// @route   POST /api/auth/users
const createUser = async (req, res, next) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username, and password are required'
      });
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      passwordHash,
      role: role || 'Receptionist'
    });

    await logAudit({
      user: req.user ? req.user.username : 'Admin',
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      details: { username: user.username, role: user.role }
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (req.body.active !== undefined) user.active = req.body.active;
    if (req.body.password) {
      user.passwordHash = await User.hashPassword(req.body.password);
    }

    await user.save();

    await logAudit({
      user: req.user.username,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id,
      details: { username: user.username }
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  getUsers,
  createUser,
  updateUser,
  recoverPassword
};
