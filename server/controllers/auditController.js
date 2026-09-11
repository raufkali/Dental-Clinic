const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs
// @route   GET /api/audit-logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { entity, action, limit = 100 } = req.query;
    let query = {};

    if (entity) query.entity = entity;
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
