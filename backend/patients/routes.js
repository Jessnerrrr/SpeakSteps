const express = require('express');
const mongoose = require('mongoose');
const User = require('../users/User');
const { requireSession } = require('../users/session');
const { generatePatientCode } = require('./patient-code');

const router = express.Router();
const NAME_FIELDS = ['first_name', 'middle_name', 'last_name'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPatientSearchFilter(query) {
  if (/^\d{1,9}$/.test(query)) {
    return { patientCode: { $regex: `^${escapeRegex(query)}` } };
  }

  const tokens = query.split(/\s+/).filter(Boolean);
  return {
    $and: tokens.map((token) => ({
      $or: NAME_FIELDS.map((field) => ({
        [field]: { $regex: escapeRegex(token), $options: 'i' },
      })),
    })),
  };
}

function parseDateOfBirth(value) {
  if (typeof value !== 'string') return null;
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const localMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const year = Number(isoMatch?.[1] || localMatch?.[3]);
  const month = Number(isoMatch?.[2] || localMatch?.[1]);
  const day = Number(isoMatch?.[3] || localMatch?.[2]);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

router.post('/', requireSession, async (req, res) => {
  const therapist = await User.findById(req.session.sub).select('role status');
  if (!therapist || therapist.status !== 'verified' || therapist.role !== req.session.role) {
    return res.status(401).json({ success: false, error: 'Your account is no longer available. Please sign in again.' });
  }
  if (therapist.role !== 'therapist') {
    return res.status(403).json({ success: false, error: 'Only therapists can create patient records.' });
  }

  const body = req.body || {};
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const middleName = typeof body.middleName === 'string' ? body.middleName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const guardianEmail = typeof body.guardianEmail === 'string' ? body.guardianEmail.trim().toLowerCase() : '';
  const dateOfBirth = parseDateOfBirth(body.dateOfBirth);
  if (!firstName || !lastName || !guardianEmail || !dateOfBirth) {
    return res.status(400).json({ success: false, error: 'Patient first name, last name, valid date of birth, and registered guardian email are required.' });
  }

  const db = mongoose.connection.db;
  const therapistProfile = await db.collection('therapist_profiles').findOne(
    { user_id: therapist._id },
    { projection: { _id: 1 } },
  );
  if (!therapistProfile) {
    return res.status(403).json({ success: false, error: 'A therapist profile is required to create patient records.' });
  }

  const guardian = await User.findOne({ email: guardianEmail, role: 'parent', status: 'verified' }).select('_id');
  if (!guardian) {
    return res.status(404).json({ success: false, error: 'A verified parent account with this guardian email was not found.' });
  }
  const parentProfile = await db.collection('parent_profiles').findOne(
    { user_id: guardian._id },
    { projection: { _id: 1 } },
  );
  if (!parentProfile) {
    return res.status(409).json({ success: false, error: 'The guardian account is missing its parent profile.' });
  }

  const patientsCollection = db.collection('patients');
  let patientCode;
  let patient;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    patientCode = await generatePatientCode(patientsCollection);
    try {
      const result = await patientsCollection.insertOne({
        patientCode,
        parent_id: parentProfile._id,
        primary_therapist_id: therapistProfile._id,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix: typeof body.suffix === 'string' ? body.suffix.trim() : '',
        date_of_birth: dateOfBirth,
        created_at: new Date(),
        language_profile: typeof body.languageProfile === 'string' ? body.languageProfile : '',
        diagnosis: typeof body.diagnosis === 'string' ? body.diagnosis.trim() : '',
        target_sound: typeof body.targetSound === 'string' ? body.targetSound : '',
        hierarchy_level: typeof body.hierarchyLevel === 'string' ? body.hierarchyLevel : '',
        phoneme_positions: Array.isArray(body.phonemePositions) ? body.phonemePositions : [],
        baseline_done: false,
        total_stars: 0,
      });
      patient = {
        id: result.insertedId.toString(),
        patientCode,
        firstName,
        middleName,
        lastName,
        dateOfBirth,
      };
      break;
    } catch (error) {
      const codeConflict = error.code === 11000 && error.keyPattern?.patientCode;
      if (!codeConflict || attempt === 4) throw error;
    }
  }
  if (!patient) throw new Error('Could not allocate a unique patient code after several attempts.');
  return res.status(201).json({ success: true, patient });
});

router.get('/search', requireSession, async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    return res.status(400).json({ success: false, error: 'Search query q is required.' });
  }
  if (query.length > 100) {
    return res.status(400).json({ success: false, error: 'Search query must be 100 characters or fewer.' });
  }

  const user = await User.findById(req.session.sub).select('role status');
  if (!user || user.status !== 'verified' || user.role !== req.session.role) {
    return res.status(401).json({ success: false, error: 'Your account is no longer available. Please sign in again.' });
  }

  const visibilityFilter = {};
  if (user.role !== 'admin') {
    const profileCollectionName = `${user.role}_profiles`;
    const profile = await mongoose.connection.db.collection(profileCollectionName).findOne(
      { user_id: user._id },
      { projection: { _id: 1 } },
    );
    if (!profile) return res.json({ success: true, patients: [] });

    const relationshipField = {
      parent: 'parent_id',
      therapist: 'primary_therapist_id',
      teacher: 'assigned_teacher_id',
    }[user.role];
    visibilityFilter[relationshipField] = profile._id;
  }

  const patients = await mongoose.connection.db.collection('patients')
    .find(
      { ...visibilityFilter, ...buildPatientSearchFilter(query) },
      {
        projection: {
          patientCode: 1,
          first_name: 1,
          middle_name: 1,
          last_name: 1,
          date_of_birth: 1,
        },
      },
    )
    .sort({ last_name: 1, first_name: 1 })
    .limit(50)
    .toArray();

  return res.json({
    success: true,
    patients: patients.map((patient) => ({
      id: patient._id.toString(),
      patientCode: patient.patientCode,
      firstName: patient.first_name,
      middleName: patient.middle_name || '',
      lastName: patient.last_name,
      dateOfBirth: patient.date_of_birth,
    })),
  });
});

module.exports = { patients: router, buildPatientSearchFilter, parseDateOfBirth };
