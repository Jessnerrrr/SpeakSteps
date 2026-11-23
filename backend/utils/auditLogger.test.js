const assert = require('node:assert/strict');
const test = require('node:test');
const { logAuditEvent } = require('./auditLogger');

const event = {
  actorId: '0123456789abcdef01234567',
  actorRole: 'therapist',
  actorName: 'Alex Therapist',
  action: 'Activity created',
  category: 'Activity',
  targetType: 'activity',
  targetId: 'abcdef0123456789abcdef01',
  details: 'Therapist created a practice activity.',
};

test('audit logger inserts a timestamped event into audit_logs', async () => {
  let inserted;
  const db = {
    collection(name) {
      assert.equal(name, 'audit_logs');
      return {
        async insertOne(document) {
          inserted = document;
        },
      };
    },
  };

  assert.equal(await logAuditEvent(db, event), true);
  assert.deepEqual({ ...inserted, createdAt: undefined }, { ...event, createdAt: undefined });
  assert.ok(inserted.createdAt instanceof Date);
});

test('audit logger reports persistence failures without rejecting callers', async () => {
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args.join(' '));
  try {
    const result = await logAuditEvent({
      collection() {
        return { insertOne: async () => { throw new Error('database unavailable'); } };
      },
    }, event);
    assert.equal(result, false);
    assert.match(errors[0], /Failed to write audit event: database unavailable/);
  } finally {
    console.error = originalError;
  }
});
