const assert = require('node:assert/strict');
const test = require('node:test');
const { hashPassword, verifyPassword } = require('./password');
const { validateRegistration } = require('./validation');

function registration(overrides = {}) {
  return {
    fullName: 'Alex Parent',
    email: 'alex@example.com',
    contactNo: '09123456789',
    password: 'StrongPass1!',
    childName: 'Jamie',
    childAge: '7',
    startingLevel: 'Beginner (Sounds & Words)',
    studentId: '12345',
    verificationImageData: Buffer.from('verification photo').toString('base64'),
    ...overrides,
  };
}

test('registration validation normalizes email and accepts the selected image fields', () => {
  const result = validateRegistration(registration({ email: ' ALEX@Example.com ' }));
  assert.equal(result.email, 'alex@example.com');
  assert.equal(result.childAge, 7);
  assert.equal(result.verificationImage.toString(), 'verification photo');
});

test('registration validation rejects invalid emails and oversized images', () => {
  assert.throws(() => validateRegistration(registration({ email: 'not-an-email' })), /valid email/);
  assert.throws(() => validateRegistration(registration({ contactNo: 'invalid' })), /7 to 15 digits/);
  const oversized = Buffer.alloc(1024 * 1024 + 1).toString('base64');
  assert.throws(() => validateRegistration(registration({ verificationImageData: oversized })), /under 1 MB/);
});

test('password verification only accepts the matching password', async () => {
  const { salt, hash } = await hashPassword('StrongPass1!');
  assert.equal(await verifyPassword('StrongPass1!', salt, hash), true);
  assert.equal(await verifyPassword('WrongPass1!', salt, hash), false);
});

test('user documents satisfy the existing MongoDB users collection validator', () => {
  const User = require('./User');
  const user = new User({
    full_name: 'SpeakSteps Demo Parent',
    email: 'demo@example.com',
    phone_number: '0000000000',
    password_hash: 'salt:hash',
    role: 'parent',
    status: 'pending',
    child_name: 'Demo Child',
    child_age: 7,
    starting_level: 'Beginner (Sounds & Words)',
    student_id: '000001',
    verification_image: Buffer.from('placeholder'),
  });
  assert.equal(user.validateSync(), undefined);
  assert.ok(user.created_at instanceof Date);
});

test('therapist and teacher accounts do not require patient profile fields', () => {
  const User = require('./User');
  for (const role of ['therapist', 'teacher']) {
    const user = new User({
      full_name: 'SpeakSteps Test User',
      email: `${role}@example.com`,
      phone_number: '0000000000',
      password_hash: 'salt:hash',
      role,
      status: 'verified',
    });
    assert.equal(user.validateSync(), undefined);
  }
});

test('registration auto-approval is opt-in and disabled in production', () => {
  const { getRegistrationStatus } = require('./registration-policy');
  assert.equal(getRegistrationStatus('development', 'true'), 'verified');
  assert.equal(getRegistrationStatus('production', 'true'), 'pending');
  assert.equal(getRegistrationStatus('development', 'false'), 'pending');
});

test('patient codes use a UTC MMYYYY suffix and skip codes already in use', async () => {
  const { formatPatientCode, generatePatientCode } = require('../patients/patient-code');
  const date = new Date('2026-11-15T12:00:00Z');
  assert.equal(formatPatientCode(123, date), '123112026');

  const collection = {
    find(filter) {
      assert.equal(filter.patientCode.$in.length, 900);
      return {
        async toArray() {
          return [{ patientCode: '100112026' }, { patientCode: '101112026' }];
        },
      };
    },
  };
  assert.equal(await generatePatientCode(collection, date, () => 0), '102112026');
});

test('patient codes fail explicitly after all monthly code values are used', async () => {
  const { generatePatientCode } = require('../patients/patient-code');
  const date = new Date('2026-11-15T12:00:00Z');
  const collection = {
    find() {
      return {
        async toArray() {
          return Array.from({ length: 900 }, (_, index) => ({
            patientCode: `${100 + index}112026`,
          }));
        },
      };
    },
  };
  await assert.rejects(generatePatientCode(collection, date, () => 0), /No patient codes remain/);
});

test('patient search supports code prefixes and multi-part names', () => {
  const { buildPatientSearchFilter, parseDateOfBirth } = require('../patients/routes');
  assert.deepEqual(buildPatientSearchFilter('12311'), {
    patientCode: { $regex: '^12311' },
  });
  const nameFilter = buildPatientSearchFilter('Jamie Rivera');
  assert.equal(nameFilter.$and.length, 2);
  assert.equal(nameFilter.$and[0].$or[0].first_name.$regex, 'Jamie');
  assert.equal(nameFilter.$and[1].$or[2].last_name.$regex, 'Rivera');
  assert.equal(buildPatientSearchFilter('.*').$and[0].$or[0].first_name.$regex, '\\.\\*');
  assert.equal(parseDateOfBirth('11/18/2020').toISOString(), '2020-11-18T00:00:00.000Z');
  assert.equal(parseDateOfBirth('2020-02-31'), null);
});
