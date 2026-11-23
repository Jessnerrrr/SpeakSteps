const crypto = require('node:crypto');

const PATIENT_CODE_COUNT = 900;

function formatPatientCode(number, date = new Date()) {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  return `${number}${month}${year}`;
}

async function generatePatientCode(collection, date = new Date(), randomInt = crypto.randomInt, session) {
  const start = randomInt(PATIENT_CODE_COUNT);
  const candidates = Array.from({ length: PATIENT_CODE_COUNT }, (_, offset) =>
    formatPatientCode(100 + ((start + offset) % PATIENT_CODE_COUNT), date),
  );
  const options = { projection: { patientCode: 1 } };
  if (session) options.session = session;
  const existing = await collection
    .find({ patientCode: { $in: candidates } }, options)
    .toArray();
  const used = new Set(existing.map((patient) => patient.patientCode));

  for (const candidate of candidates) {
    if (!used.has(candidate)) return candidate;
  }
  throw new Error('No patient codes remain for this month and year.');
}

module.exports = { formatPatientCode, generatePatientCode };
