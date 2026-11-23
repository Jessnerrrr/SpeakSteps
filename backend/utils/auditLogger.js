const { redactUri } = require('../config/db');

function boundedText(value, label, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return value.trim().slice(0, maxLength);
}

function logAuditEvent(db, {
  actorId,
  actorRole,
  actorName,
  action,
  category,
  targetType,
  targetId,
  details,
} = {}) {
  return Promise.resolve()
    .then(() => {
      if (!db || typeof db.collection !== 'function') {
        throw new TypeError('A connected MongoDB database is required to log an audit event.');
      }

      const document = {
        actorId: boundedText(String(actorId || ''), 'actorId', 100),
        actorRole: boundedText(actorRole, 'actorRole', 40),
        actorName: boundedText(actorName, 'actorName', 160),
        action: boundedText(action, 'action', 120),
        category: boundedText(category, 'category', 60),
        targetType: boundedText(targetType, 'targetType', 60),
        targetId: boundedText(String(targetId || ''), 'targetId', 100),
        details: typeof details === 'string' ? details.trim().slice(0, 1000) : '',
        createdAt: new Date(),
      };

      return db.collection('audit_logs').insertOne(document);
    })
    .then(() => true)
    .catch((error) => {
      console.error(`[Audit] Failed to write audit event: ${redactUri(error.message)}`);
      return false;
    });
}

module.exports = { logAuditEvent };
