const Setting = require('../models/Setting');
const { logAudit } = require('../services/auditService');

// @desc    Get clinic settings
// @route   GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update clinic settings
// @route   PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    await logAudit({
      user: req.user ? req.user.username : 'Admin',
      action: 'UPDATE_SETTINGS',
      entity: 'Setting',
      details: req.body
    });

    res.json({
      success: true,
      message: 'Clinic settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
