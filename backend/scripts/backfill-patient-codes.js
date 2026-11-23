const { connectDB } = require('../config/db');

const CODE_PATTERN = /^\d{9}$/;

async function backfillPatientCodes(collection, date = new Date()) {
  const records = await collection.find(
    {},
    { projection: { _id: 1, patientCode: 1 } },
  ).toArray();
  const existingCodes = new Set();
  const missing = [];

  for (const record of records) {
    if (record.patientCode === undefined || record.patientCode === null || record.patientCode === '') {
      missing.push(record._id);
      continue;
    }
    if (!CODE_PATTERN.test(record.patientCode)) {
      throw new Error(`Patient ${record._id} has an invalid patientCode; resolve it before migration.`);
    }
    if (existingCodes.has(record.patientCode)) {
      throw new Error(`Duplicate patientCode ${record.patientCode}; resolve it before migration.`);
    }
    existingCodes.add(record.patientCode);
  }

  const { generatePatientCode } = require('../patients/patient-code');
  for (const id of missing) {
    const patientCode = await generatePatientCode(collection, date);
    const result = await collection.updateOne(
      { _id: id, $or: [{ patientCode: { $exists: false } }, { patientCode: null }, { patientCode: '' }] },
      { $set: { patientCode } },
    );
    if (result.modifiedCount !== 1) {
      throw new Error(`Patient ${id} changed during backfill; rerun the migration after inspection.`);
    }
    existingCodes.add(patientCode);
  }

  await collection.createIndex(
    { patientCode: 1 },
    { unique: true, sparse: true, name: 'patientCode_unique_sparse' },
  );

  return { total: records.length, backfilled: missing.length };
}

async function main() {
  await connectDB();
  try {
    const collection = require('mongoose').connection.db.collection('patients');
    const result = await backfillPatientCodes(collection);
    const index = await collection.indexes().then((indexes) =>
      indexes.find((item) => item.name === 'patientCode_unique_sparse'),
    );
    console.log(`[Patient IDs] Backfilled ${result.backfilled} of ${result.total} records.`);
    console.log(`[Patient IDs] Unique sparse index verified: ${Boolean(index && index.unique && index.sparse)}.`);
    if (!index || !index.unique || !index.sparse) {
      throw new Error('The patientCode unique sparse index was not created as expected.');
    }
  } finally {
    await require('mongoose').disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[Patient IDs] Migration failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { backfillPatientCodes };
