const AuditLog = require('../models/AuditLog');

async function logAudit({ user = 'System', action, entity, entityId = '', details = {} }) {
  try {
    await AuditLog.create({
      user,
      action,
      entity,
      entityId: String(entityId),
      timestamp: new Date(),
      details
    });
  } catch (err) {
    console.error('[Audit Log Error]:', err.message);
  }
}

module.exports = { logAudit };
