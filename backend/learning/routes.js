const crypto = require('node:crypto');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../users/User');
const { hashPassword, verifyPassword } = require('../users/password');
const Patient = require('../patients/Patient');
const { requireSession } = require('../users/session');
const { logAuditEvent } = require('../utils/auditLogger');
const { generatePatientCode } = require('../patients/patient-code');
const {
  ActivityWord,
  ClinicalReview,
  PatientAccomplishment,
  PatientAssignment,
  PatientSoapNote,
  PracticeItem,
  SpeechCheckinResult,
  Submission,
  SubmissionTargetRating,
  TherapistActivity,
  WordBankEntry,
} = require('./models');

const router = express.Router();
const LEVEL_TO_DB = {
  Isolation: 'isolation',
  Syllables: 'syllable',
  Words: 'word',
  Phrases: 'phrase',
  Sentences: 'sentence',
  Conversation: 'conversation',
};
const LEVEL_FROM_DB = Object.fromEntries(
  Object.entries(LEVEL_TO_DB).map(([label, value]) => [value, label]),
);
const POSITION_TO_DB = { Initial: 'initial', Medial: 'medial', Final: 'final' };
const POSITION_FROM_DB = { initial: 'Initial', medial: 'Medial', final: 'Final' };
const PROFILE_RELATION = {
  parent: 'parent_id',
  therapist: 'primary_therapist_id',
  teacher: 'assigned_teacher_id',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function endpoint(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ success: false, error: error.message });
      }
      if (error && error.code === 11000) {
        return res.status(409).json({ success: false, error: 'This record conflicts with an existing record.' });
      }
      return next(error);
    }
  };
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.session || !roles.includes(req.session.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to perform this action.' });
    }
    return next();
  };
}

function objectId(value, label = 'record ID') {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw new HttpError(400, `A valid ${label} is required.`);
  }
  return new mongoose.Types.ObjectId(value);
}

function temporaryPassword() {
  return [
    crypto.randomBytes(4).toString('hex').toUpperCase(),
    crypto.randomBytes(4).toString('hex'),
    'Aa1!',
  ].join('');
}

async function getSessionUser(req) {
  const user = await User.findById(objectId(req.session.sub, 'session user ID'));
  if (!user || user.status !== 'verified' || user.role !== req.session.role) {
    throw new HttpError(401, 'Your account is no longer available. Please sign in again.');
  }
  return user;
}

async function getProfileId(user) {
  const collectionName = `${user.role}_profiles`;
  const profile = await mongoose.connection.db.collection(collectionName).findOne(
    { user_id: user._id },
    { projection: { _id: 1 } },
  );
  if (!profile) throw new HttpError(403, `A ${user.role} profile is required for this action.`);
  return profile._id;
}

async function getVisiblePatients(user) {
  if (user.role === 'admin') return Patient.find({}).lean();
  const relation = PROFILE_RELATION[user.role];
  if (!relation) return [];
  const profileId = await getProfileId(user);
  return Patient.find({ [relation]: profileId }).sort({ last_name: 1, first_name: 1 }).lean();
}

async function patientDto(patient) {
  const parentProfile = patient.parent_id
    ? await mongoose.connection.db.collection('parent_profiles').findOne(
      { _id: patient.parent_id },
      { projection: { user_id: 1, guardian_name: 1, relationship_to_child: 1 } },
    )
    : null;
  const guardian = parentProfile && parentProfile.user_id
    ? await User.findById(parentProfile.user_id).select('full_name email phone_number child_age').lean()
    : null;
  const birthDate = patient.date_of_birth ? new Date(patient.date_of_birth) : null;
  let age = '';
  if (birthDate && !Number.isNaN(birthDate.getTime())) {
    const now = new Date();
    age = String(now.getFullYear() - birthDate.getFullYear() - (
      now < new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0
    ));
  }
  return {
    id: String(patient._id),
    patientCode: patient.patientCode || '',
    firstName: patient.first_name,
    middleName: patient.middle_name || '',
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth,
    createdAt: patient.created_at,
    schoolStudentId: patient.school_student_id || '',
    school: patient.school || '',
    grade: patient.grade || '',
    section: patient.section || '',
    primaryTherapistId: patient.primary_therapist_id ? String(patient.primary_therapist_id) : '',
    assignedTeacherId: patient.assigned_teacher_id ? String(patient.assigned_teacher_id) : '',
    age: guardian?.child_age != null ? String(guardian.child_age) : age,
    guardianName: parentProfile?.guardian_name || guardian?.full_name || '',
    relationship: parentProfile?.relationship_to_child || '',
    guardianEmail: guardian?.email || '',
    contactNumber: guardian?.phone_number || '',
    diagnosis: patient.diagnosis || '',
    languageProfile: patient.language_profile || '',
    targetSound: patient.target_sound || patient.target_sound_error || '',
    hierarchyLevel: patient.hierarchy_level || '',
    phonemePositions: patient.phoneme_positions || patient.target_positions || [],
    secondaryTargets: patient.secondary_targets || '',
    dominantErrorPattern: patient.dominant_error_pattern || '',
    dominantErrorOther: patient.dominant_error_other || '',
    errorPatternTaxonomy: patient.error_pattern_taxonomy || '',
    clinicalNotation: patient.clinical_notation || '',
  };
}

async function findAccessiblePatient(user, selector) {
  const filter = {};
  if (selector.patientId) filter._id = objectId(selector.patientId, 'patient ID');
  else if (selector.patientCode) filter.patientCode = selector.patientCode;
  else throw new HttpError(400, 'A patient ID or patientCode is required.');

  if (user.role !== 'admin') {
    const relation = PROFILE_RELATION[user.role];
    if (!relation) throw new HttpError(403, 'You do not have access to patient records.');
    filter[relation] = await getProfileId(user);
  }
  const patient = await Patient.findOne(filter).lean();
  if (!patient) throw new HttpError(404, 'Patient record was not found.');
  return patient;
}

function validDate(value, label, optional = false) {
  if ((value === undefined || value === null || value === '') && optional) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new HttpError(400, `${label} must be a valid date.`);
  return date;
}

function boundedString(value, label, maxLength, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `${label} is required.`);
    return undefined;
  }
  if (typeof value !== 'string' || value.length > maxLength || (required && !value.trim())) {
    throw new HttpError(400, `${label} must be a string of 1 to ${maxLength} characters.`);
  }
  return value.trim();
}

function mapActivityLevel(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'A valid activity level is required.');
  const normalized = LEVEL_TO_DB[value] || value.toLowerCase();
  if (!Object.values(LEVEL_TO_DB).includes(normalized)) {
    throw new HttpError(400, 'Activity level must be Isolation, Syllables, Words, Phrases, Sentences, or Conversation.');
  }
  return normalized;
}

function mapPositions(positions) {
  if (!Array.isArray(positions)) return [];
  const mapped = positions.flatMap((position) =>
    String(position).split(',').map((part) => POSITION_TO_DB[part.trim()] || part.trim().toLowerCase()),
  );
  if (mapped.some((position) => !['initial', 'medial', 'final'].includes(position))) {
    throw new HttpError(400, 'Activity positions must be Initial, Medial, or Final.');
  }
  return [...new Set(mapped)];
}

function activityInput(body) {
  const level = mapActivityLevel(body.level);
  const sound = boundedString(body.sound, 'Target sound', 50, true);
  const title = boundedString(body.title, 'Activity title', 120, true);
  const words = Array.isArray(body.words) ? body.words : [];
  if (words.length > 200) throw new HttpError(400, 'An activity cannot contain more than 200 target words.');
  const mappedWords = words.map((word) => ({
    text: boundedString(word && word.text, 'Target word', 100, true),
    sound: boundedString(word && word.sound, 'Word sound', 50),
    position: word && word.position ? mapPositions([word.position])[0] : undefined,
    phrase: boundedString(word && word.phrase, 'Target phrase', 500),
    model_audio_url: boundedString(word && word.modelAudioUrl, 'Model audio URL', 2048),
    word_bank_id: word && typeof word.id === 'string' && !word.id.startsWith('custom-') ? word.id : undefined,
  }));
  const customLines = Array.isArray(body.customLines)
    ? body.customLines.map((line) => boundedString(line, 'Custom practice line', 500, true))
    : [];
  return {
    activity: {
      title,
      sound,
      level,
      target_positions: mapPositions(body.positions),
      language: boundedString(body.language, 'Language', 80) || 'English',
      instructions: boundedString(body.instructions, 'Instructions', 1000),
      visual_guide: boundedString(body.guide, 'Visual guide', 1000),
      visual_asset_name: boundedString(body.visualName, 'Visual asset name', 120),
      custom_lines: customLines,
    },
    words: mappedWords,
  };
}

async function getActivityWords(activityId) {
  return ActivityWord.find({ activity_id: activityId }).sort({ _id: 1 }).lean();
}

async function activityDto(activity, options = {}) {
  const words = await getActivityWords(activity._id);
  return {
    id: String(activity._id),
    title: activity.title,
    sound: activity.sound,
    level: LEVEL_FROM_DB[activity.level] || activity.level,
    positions: (activity.target_positions || []).map((position) => POSITION_FROM_DB[position] || position),
    language: activity.language || 'English',
    instructions: activity.instructions || '',
    guide: activity.visual_guide || '',
    status: options.status || 'Unassigned',
    words: words.map((word) => ({
      id: String(word.word_bank_id || word._id),
      text: word.text,
      sound: word.sound || activity.sound,
      position: POSITION_FROM_DB[word.position] || 'Initial',
      phrase: word.phrase || '',
      modelAudioUrl: word.model_audio_url || '',
    })),
    customLines: activity.custom_lines || [],
    visualName: activity.visual_asset_name || '',
    ...(options.studentName ? { studentName: options.studentName } : {}),
    ...(options.dueDate ? { dueDate: options.dueDate } : {}),
  };
}

async function saveActivityWords(activityId, words, session) {
  await ActivityWord.deleteMany({ activity_id: activityId }, { session });
  if (words.length) {
    await ActivityWord.insertMany(
      words.map((word) => ({ ...word, activity_id: activityId })),
      { session },
    );
  }
}

function patientName(patient) {
  return [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(' ');
}

async function serializeAssignment(assignment, patient, status) {
  const activity = await TherapistActivity.findById(assignment.activity_id).lean();
  if (!activity) return null;
  const mappedActivity = await activityDto(activity, {
    status,
    studentName: patientName(patient),
    dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString() : undefined,
  });
  if (assignment.instructions) mappedActivity.instructions = assignment.instructions;
  return {
    id: String(assignment._id),
    activityId: String(assignment.activity_id),
    patientId: String(assignment.patient_id),
    patientCode: patient.patientCode || '',
    studentName: patientName(patient),
    status,
    assignedAt: assignment.assigned_at,
    dueDate: assignment.due_date || null,
    completedAt: assignment.completed_at || null,
    activity: mappedActivity,
  };
}

function activityStatus(assignment) {
  if (assignment.status === 'completed') return 'Completed';
  return 'Assigned';
}

async function runTransaction(callback) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => callback(session));
  } finally {
    await session.endSession();
  }
}

router.use(requireSession);

router.get('/patients/me', requireRoles('parent'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patients = await getVisiblePatients(user);
  return res.json({ success: true, patients: await Promise.all(patients.map(patientDto)) });
}));

router.patch('/patients/me/profile', requireRoles('parent'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const childName = boundedString(body.childName, 'Child name', 120, true);
  const childAge = Number(body.childAge);
  if (!Number.isInteger(childAge) || childAge < 1 || childAge > 18) {
    throw new HttpError(400, 'Child age must be a whole number from 1 to 18.');
  }
  const patients = await getVisiblePatients(user);
  const patient = patients[0];
  if (!patient) throw new HttpError(404, 'Patient record was not found.');
  const nameParts = childName.split(/\s+/);
  const firstName = nameParts.shift();
  const lastName = nameParts.join(' ') || 'Child';
  await runTransaction(async (session) => {
    await User.updateOne(
      { _id: user._id },
      { $set: { child_name: childName, child_age: childAge, updated_at: new Date() } },
      { session, runValidators: true },
    );
    await Patient.updateOne(
      { _id: patient._id, parent_id: patient.parent_id },
      { $set: { first_name: firstName, middle_name: '', last_name: lastName } },
      { session, runValidators: true },
    );
  });
  return res.json({
    success: true,
    patient: await patientDto({
      ...patient,
      first_name: firstName,
      middle_name: '',
      last_name: lastName,
    }),
  });
}));

router.get('/patients', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patients = await getVisiblePatients(user);
  return res.json({ success: true, patients: await Promise.all(patients.map(patientDto)) });
}));

router.get('/activities', requireRoles('therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  let filter = {};
  let visiblePatientIds = null;
  if (user.role === 'therapist') {
    filter = { author_therapist_id: await getProfileId(user) };
  } else if (user.role === 'teacher') {
    const patients = await getVisiblePatients(user);
    visiblePatientIds = patients.map((patient) => patient._id);
    const therapistIds = [...new Set(
      patients
        .map((patient) => patient.primary_therapist_id)
        .filter(Boolean)
        .map((id) => String(id)),
    )];
    filter = { author_therapist_id: { $in: therapistIds } };
  }
  const activities = await TherapistActivity.find(filter).sort({ created_at: -1 }).lean();
  const assignmentFilter = {
    activity_id: { $in: activities.map((item) => item._id) },
  };
  if (visiblePatientIds) assignmentFilter.patient_id = { $in: visiblePatientIds };
  const assignments = await PatientAssignment.find(assignmentFilter).lean();
  const latestStatus = new Map();
  for (const assignment of assignments) {
    const key = String(assignment.activity_id);
    if (assignment.status !== 'completed') latestStatus.set(key, 'Assigned');
    else if (!latestStatus.has(key)) latestStatus.set(key, 'Completed');
  }
  return res.json({
    success: true,
    activities: await Promise.all(activities.map((activity) =>
      activityDto(activity, { status: latestStatus.get(String(activity._id)) || 'Unassigned' }),
    )),
  });
}));

router.post('/activities', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const authorId = await getProfileId(user);
  const { activity, words } = activityInput(req.body || {});
  const saved = await runTransaction(async (session) => {
    const document = await TherapistActivity.create([{
      ...activity,
      author_therapist_id: authorId,
      created_at: new Date(),
    }], { session });
    await saveActivityWords(document[0]._id, words, session);
    return document[0].toObject();
  });
  void logAuditEvent(mongoose.connection.db, {
    actorId: user._id,
    actorRole: user.role,
    actorName: user.full_name,
    action: 'Activity created',
    category: 'Activity',
    targetType: 'activity',
    targetId: saved._id,
    details: 'Therapist created a practice activity.',
  });
  return res.status(201).json({ success: true, activity: await activityDto(saved) });
}));

router.put('/activities/:activityId', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const authorId = await getProfileId(user);
  const id = objectId(req.params.activityId, 'activity ID');
  const { activity, words } = activityInput(req.body || {});
  const saved = await runTransaction(async (session) => {
    const document = await TherapistActivity.findOneAndUpdate(
      { _id: id, author_therapist_id: authorId },
      activity,
      { new: true, runValidators: true, session },
    ).lean();
    if (!document) throw new HttpError(404, 'Activity was not found.');
    await saveActivityWords(id, words, session);
    return document;
  });
  return res.json({ success: true, activity: await activityDto(saved) });
}));

router.get('/word-bank', requireRoles('therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const entries = await WordBankEntry.find({}).sort({ word_text: 1 }).lean();
  return res.json({
    success: true,
    words: entries.map((entry) => ({
      id: entry._id,
      text: entry.word_text,
      sound: entry.sound,
      position: POSITION_FROM_DB[entry.position] || 'Initial',
      language: entry.language,
      isStandard: entry.is_standard,
      modelAudioUrl: entry.model_audio_url || '',
    })),
  });
}));

router.post('/word-bank', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const position = mapPositions([body.position])[0];
  const word = await WordBankEntry.create({
    _id: crypto.randomUUID(),
    word_text: boundedString(body.text, 'Word', 100, true),
    sound: boundedString(body.sound, 'Target sound', 50, true),
    position,
    language: boundedString(body.language, 'Language', 80) || 'English',
    model_audio_url: boundedString(body.modelAudioUrl, 'Model audio URL', 2048),
    is_standard: false,
    created_by_therapist_id: await getProfileId(user),
  });
  return res.status(201).json({
    success: true,
    word: {
      id: word._id,
      text: word.word_text,
      sound: word.sound,
      position: POSITION_FROM_DB[word.position],
      language: word.language,
      isStandard: word.is_standard,
      modelAudioUrl: word.model_audio_url || '',
    },
  });
}));

router.put('/word-bank/:wordId', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const updates = {};
  const unset = {};
  if (Object.prototype.hasOwnProperty.call(body, 'text')) {
    updates.word_text = boundedString(body.text, 'Word', 100, true);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'sound')) {
    updates.sound = boundedString(body.sound, 'Target sound', 50, true);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'position')) {
    updates.position = mapPositions([body.position])[0];
  }
  if (Object.prototype.hasOwnProperty.call(body, 'language')) {
    updates.language = boundedString(body.language, 'Language', 80, true);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'modelAudioUrl')) {
    const modelAudioUrl = boundedString(body.modelAudioUrl, 'Model audio URL', 2048);
    if (modelAudioUrl) updates.model_audio_url = modelAudioUrl;
    else unset.model_audio_url = '';
  }
  if (!Object.keys(updates).length && !Object.keys(unset).length) {
    throw new HttpError(400, 'At least one word field must be provided.');
  }

  const update = {};
  if (Object.keys(updates).length) update.$set = updates;
  if (Object.keys(unset).length) update.$unset = unset;
  const word = await WordBankEntry.findOneAndUpdate(
    {
      _id: req.params.wordId,
      created_by_therapist_id: await getProfileId(user),
      is_standard: false,
    },
    update,
    { new: true, runValidators: true },
  ).lean();
  if (!word) throw new HttpError(404, 'Custom word was not found or cannot be updated.');
  return res.json({
    success: true,
    word: {
      id: word._id,
      text: word.word_text,
      sound: word.sound,
      position: POSITION_FROM_DB[word.position] || 'Initial',
      language: word.language,
      isStandard: word.is_standard,
      modelAudioUrl: word.model_audio_url || '',
    },
  });
}));

router.delete('/word-bank/:wordId', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const result = await WordBankEntry.deleteOne({
    _id: req.params.wordId,
    created_by_therapist_id: await getProfileId(user),
    is_standard: false,
  });
  if (!result.deletedCount) throw new HttpError(404, 'Custom word was not found or cannot be removed.');
  return res.json({ success: true });
}));

router.get('/assignments', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patients = await getVisiblePatients(user);
  const patientIds = patients.map((patient) => patient._id);
  if (!patientIds.length && user.role !== 'therapist' && user.role !== 'admin') {
    return res.json({ success: true, assignments: [], unlockedLevels: [] });
  }
  const filter = user.role === 'admin'
    ? {}
    : user.role === 'therapist'
      ? { therapist_id: await getProfileId(user) }
      : { patient_id: { $in: patientIds } };
  const assignments = await PatientAssignment.find(filter).sort({ assigned_at: -1 }).lean();
  const byPatient = new Map(patients.map((patient) => [String(patient._id), patient]));
  const mapped = [];
  for (const assignment of assignments) {
    const patient = byPatient.get(String(assignment.patient_id)) ||
      await Patient.findById(assignment.patient_id).lean();
    if (!patient) continue;
    const item = await serializeAssignment(assignment, patient, activityStatus(assignment));
    if (item) mapped.push(item);
  }
  const unlockedLevels = [...new Set(mapped.map((item) => item.activity.level))];
  return res.json({ success: true, assignments: mapped, unlockedLevels });
}));

router.post('/assignments', requireRoles('therapist', 'teacher'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const profileId = await getProfileId(user);
  const body = req.body || {};
  const patientCode = boundedString(body.patientCode, 'Patient code', 9, true);
  if (!/^\d{9}$/.test(patientCode)) throw new HttpError(400, 'Patient code must contain exactly 9 digits.');
  const patientFilter = user.role === 'teacher'
    ? { patientCode, assigned_teacher_id: profileId }
    : { patientCode, primary_therapist_id: profileId };
  const patient = await Patient.findOne(patientFilter).lean();
  if (!patient) throw new HttpError(404, 'Patient was not found in your caseload.');
  if (user.role === 'teacher' && !patient.primary_therapist_id) {
    throw new HttpError(409, 'This student needs an assigned therapist before activities can be assigned.');
  }
  const therapistId = patient.primary_therapist_id || profileId;
  const activityId = objectId(body.activityId, 'activity ID');
  const activity = await TherapistActivity.findOne({
    _id: activityId,
    author_therapist_id: therapistId,
  }).lean();
  if (!activity) throw new HttpError(404, 'Activity was not found in your library.');
  const assignment = await PatientAssignment.create({
    activity_id: activityId,
    patient_id: patient._id,
    therapist_id: therapistId,
    assigned_by_teacher_id: user.role === 'teacher' ? profileId : undefined,
    status: 'assigned',
    instructions: boundedString(body.instructions, 'Assignment instructions', 1000),
    due_date: validDate(body.dueDate, 'Due date', true),
    assigned_at: new Date(),
  });
  return res.status(201).json({
    success: true,
    assignment: await serializeAssignment(assignment.toObject(), patient, 'Assigned'),
  });
}));

router.patch('/assignments/:assignmentId', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const therapistId = await getProfileId(user);
  const id = objectId(req.params.assignmentId, 'assignment ID');
  const status = req.body && req.body.status;
  if (!['assigned', 'in_progress', 'completed', 'overdue'].includes(status)) {
    throw new HttpError(400, 'Assignment status is invalid.');
  }
  const assignment = await PatientAssignment.findOneAndUpdate(
    { _id: id, therapist_id: therapistId },
    { status, completed_at: status === 'completed' ? new Date() : null },
    { new: true, runValidators: true },
  ).lean();
  if (!assignment) throw new HttpError(404, 'Assignment was not found.');
  const patient = await Patient.findById(assignment.patient_id).lean();
  return res.json({
    success: true,
    assignment: await serializeAssignment(assignment, patient, activityStatus(assignment)),
  });
}));

router.get('/submissions', requireRoles('therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patients = await getVisiblePatients(user);
  const patientIds = patients.map((patient) => patient._id);
  const submissions = await Submission.find({
    patient_id: user.role === 'admin' ? { $exists: true } : { $in: patientIds },
  }).sort({ submitted_at: -1 }).limit(200).lean();
  const mapped = [];
  for (const submission of submissions) {
    const patient = patients.find((item) => String(item._id) === String(submission.patient_id)) ||
      await Patient.findById(submission.patient_id).lean();
    if (!patient) continue;
    const assignment = submission.assignment_id
      ? await PatientAssignment.findById(submission.assignment_id).lean()
      : null;
    const activity = assignment ? await TherapistActivity.findById(assignment.activity_id).lean() : null;
    const review = await ClinicalReview.findOne({ submission_id: submission._id }).lean();
    mapped.push({
      id: String(submission._id),
      patientId: String(patient._id),
      patientCode: patient.patientCode || '',
      student: patientName(patient),
      initial: `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase(),
      activity: activity ? activity.title : 'Practice submission',
      sound: activity ? activity.sound : '',
      level: activity ? LEVEL_FROM_DB[activity.level] || activity.level : '',
      audioRecordingUrl: submission.audio_recording_url,
      waveformSample: submission.waveform_sample || [],
      durationSeconds: submission.duration_seconds ?? null,
      status: user.role === 'teacher'
        ? (submission.teacher_feedback ? 'Reviewed' : 'Pending')
        : submission.status === 'reviewed' ? 'Reviewed' : 'Pending',
      submittedAt: submission.submitted_at,
      teacherReview: submission.teacher_feedback ? {
        rating: submission.teacher_feedback.rating,
        notes: submission.teacher_feedback.notes || '',
        reviewedAt: submission.teacher_feedback.reviewed_at,
      } : null,
      review: review ? {
        observations: review.observations || '',
        parentFeedback: review.parent_feedback || '',
        homePractice: review.home_practice_instructions || '',
        averageScore: review.average_score ?? null,
      } : null,
    });
  }
  return res.json({ success: true, submissions: mapped });
}));

router.post('/submissions', requireRoles('parent'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const url = boundedString(body.audioRecordingUrl, 'Audio recording URI', 2048, true);
  const duration = body.durationSeconds;
  if (duration !== undefined && duration !== null && (!Number.isFinite(duration) || duration < 0 || duration > 600)) {
    throw new HttpError(400, 'Recording duration must be between 0 and 600 seconds.');
  }
  const waveform = body.waveformSample === undefined ? [] : body.waveformSample;
  if (!Array.isArray(waveform) || waveform.length > 256 || waveform.some((value) => !Number.isFinite(value))) {
    throw new HttpError(400, 'Waveform sample must contain at most 256 numeric values.');
  }
  const assignmentId = body.assignmentId ? objectId(body.assignmentId, 'assignment ID') : null;
  const practiceItemId = body.practiceItemId
    ? boundedString(body.practiceItemId, 'Practice item ID', 200, true)
    : undefined;
  if (!assignmentId && !practiceItemId) {
    throw new HttpError(400, 'An assignment or practice item is required.');
  }
  let created;
  await runTransaction(async (session) => {
    const patient = await findAccessiblePatient(user, {
      patientId: body.patientId,
      patientCode: body.patientCode,
    });
    let assignment = null;
    if (assignmentId) {
      assignment = await PatientAssignment.findOne({
        _id: assignmentId,
        patient_id: patient._id,
      }).session(session).lean();
      if (!assignment) throw new HttpError(404, 'Assignment was not found for this patient.');
    }
    if (practiceItemId && !await PracticeItem.findById(practiceItemId).session(session).lean()) {
      throw new HttpError(404, 'Practice item was not found.');
    }
    const starFilter = assignmentId
      ? { patient_id: patient._id, assignment_id: assignmentId }
      : { patient_id: patient._id, practice_item_id: practiceItemId };
    const alreadyEarned = await Submission.exists(starFilter).session(session);
    const document = await Submission.create([{
      assignment_id: assignmentId,
      patient_id: patient._id,
      practice_item_id: practiceItemId,
      audio_recording_url: url,
      waveform_sample: waveform,
      duration_seconds: duration,
      status: 'pending',
      stars_awarded: alreadyEarned ? 0 : 1,
      submitted_at: new Date(),
    }], { session });
    if (assignment) {
      await PatientAssignment.updateOne(
        { _id: assignmentId },
        { status: 'completed', completed_at: new Date() },
        { session },
      );
    }
    created = document[0].toObject();
  });
  void logAuditEvent(mongoose.connection.db, {
    actorId: user._id,
    actorRole: user.role,
    actorName: user.full_name,
    action: 'Practice submitted',
    category: 'Practice',
    targetType: 'submission',
    targetId: created._id,
    details: 'A practice recording was submitted for review.',
  });
  return res.status(201).json({
    success: true,
    submission: {
      id: String(created._id),
      patientId: String(created.patient_id),
      status: created.status,
      starsAwarded: created.stars_awarded || 0,
    },
  });
}));

router.post('/reviews', requireRoles('therapist', 'teacher'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const submissionId = objectId(body.submissionId, 'submission ID');
  const submission = await Submission.findById(submissionId).lean();
  if (!submission) throw new HttpError(404, 'Submission was not found.');
  if (user.role === 'teacher') {
    const teacherId = await getProfileId(user);
    const patient = await Patient.findOne({
      _id: submission.patient_id,
      assigned_teacher_id: teacherId,
    }).select('_id').lean();
    if (!patient) throw new HttpError(403, 'This submission is not for an assigned student.');
    const rating = body.rating;
    if (!['Correct', 'Approximate', 'Incorrect'].includes(rating)) {
      throw new HttpError(400, 'Choose a supported classroom feedback rating.');
    }
    const feedback = {
      reviewer_role: 'teacher',
      reviewer_teacher_id: teacherId,
      rating,
      notes: boundedString(body.notes, 'Feedback notes', 2000) || '',
      reviewed_at: new Date(),
    };
    await Submission.updateOne(
      { _id: submissionId },
      { $set: { teacher_feedback: feedback } },
      { runValidators: true },
    );
    void logAuditEvent(mongoose.connection.db, {
      actorId: user._id,
      actorRole: user.role,
      actorName: user.full_name,
      action: 'Teacher feedback saved',
      category: 'Practice',
      targetType: 'submission',
      targetId: submissionId,
      details: 'Teacher submitted classroom feedback for an assigned student.',
    });
    return res.json({
      success: true,
      feedback: { submissionId: String(submissionId), reviewerRole: 'teacher', rating, notes: feedback.notes },
    });
  }
  const therapistId = await getProfileId(user);
  const patient = await Patient.findOne({
    _id: submission.patient_id,
    primary_therapist_id: therapistId,
  }).lean();
  if (!patient) throw new HttpError(403, 'This submission is not in your caseload.');
  const targets = Array.isArray(body.targets) ? body.targets : [];
  if (targets.length > 200) throw new HttpError(400, 'A review cannot contain more than 200 target ratings.');
  const ratings = targets.flatMap((target) => {
    if (target && (target.score === null || target.score === undefined)) return [];
    const score = Number(target && target.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new HttpError(400, 'Every target rating must be a whole number from 1 to 5.');
    }
    const position = target.position ? mapPositions([target.position])[0] : undefined;
    return [{
      submission_id: submissionId,
      word_text: boundedString(target.text, 'Rated word', 100, true),
      position,
      score,
      clinician_feedback: boundedString(target.feedback, 'Clinician feedback', 1000),
      remarks: boundedString(target.remarks, 'Clinical remarks', 1000),
    }];
  });
  const averageScore = ratings.length
    ? ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length
    : undefined;
  const review = {
    submission_id: submissionId,
    reviewer_therapist_id: therapistId,
    observations: boundedString(body.observations, 'Observations', 2000),
    parent_feedback: boundedString(body.parentFeedback, 'Parent feedback', 2000),
    home_practice_instructions: boundedString(body.homePractice, 'Home practice instructions', 2000),
    average_score: averageScore,
    reviewed_at: new Date(),
  };
  await runTransaction(async (session) => {
    await ClinicalReview.findOneAndUpdate(
      { submission_id: submissionId },
      review,
      { upsert: true, new: true, runValidators: true, session, setDefaultsOnInsert: true },
    );
    await SubmissionTargetRating.deleteMany({ submission_id: submissionId }, { session });
    if (ratings.length) await SubmissionTargetRating.insertMany(ratings, { session });
    await Submission.updateOne({ _id: submissionId }, { status: 'reviewed' }, { session });
  });
  void logAuditEvent(mongoose.connection.db, {
    actorId: user._id,
    actorRole: user.role,
    actorName: user.full_name,
    action: 'Clinical review saved',
    category: 'Clinical',
    targetType: 'submission',
    targetId: submissionId,
    details: 'Therapist completed a clinical review.',
  });
  return res.json({ success: true, review: { submissionId: String(submissionId), averageScore: averageScore ?? null } });
}));

router.get('/reviews', requireRoles('parent', 'therapist', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  let submissions;
  if (user.role === 'therapist') {
    const therapistId = await getProfileId(user);
    const patients = await Patient.find({ primary_therapist_id: therapistId }).select('_id').lean();
    submissions = await Submission.find({ patient_id: { $in: patients.map((item) => item._id) } }).lean();
  } else if (user.role === 'admin') {
    submissions = await Submission.find({}).sort({ submitted_at: -1 }).limit(200).lean();
  } else {
    const patients = await getVisiblePatients(user);
    submissions = await Submission.find({ patient_id: { $in: patients.map((item) => item._id) } }).lean();
  }
  const result = [];
  for (const submission of submissions) {
    const review = await ClinicalReview.findOne({ submission_id: submission._id }).lean();
    const patient = await Patient.findById(submission.patient_id).lean();
    if (!patient) continue;
    const assignment = submission.assignment_id
      ? await PatientAssignment.findById(submission.assignment_id).lean()
      : null;
    const activity = assignment ? await TherapistActivity.findById(assignment.activity_id).lean() : null;
    const ratings = review
      ? await SubmissionTargetRating.find({ submission_id: submission._id }).lean()
      : [];
    const activityWords = assignment ? await getActivityWords(assignment.activity_id) : [];
    const ratingByWord = new Map(ratings.map((rating) => [
      `${rating.word_text.toLowerCase()}|${rating.position || ''}`,
      rating,
    ]));
    result.push({
      id: String(submission._id),
      submissionId: String(submission._id),
      assignmentId: submission.assignment_id ? String(submission.assignment_id) : '',
      student: patientName(patient),
      initial: `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase(),
      activity: activity ? activity.title : 'Practice submission',
      sound: activity ? activity.sound : '',
      level: activity ? LEVEL_FROM_DB[activity.level] || activity.level : '',
      language: activity ? activity.language || '' : '',
      status: review ? 'Reviewed' : 'Pending',
      observations: review?.observations || '',
      parentFeedback: review?.parent_feedback || '',
      homePractice: review?.home_practice_instructions || '',
      targets: activityWords.map((word) => {
        const rating = ratingByWord.get(`${word.text.toLowerCase()}|${word.position || ''}`);
        return {
          id: String(word._id),
          text: word.text,
          position: POSITION_FROM_DB[word.position] || 'Initial',
          score: rating?.score ?? null,
          feedback: rating?.clinician_feedback || '',
          remarks: rating?.remarks || '',
        };
      }),
      audioRecordingUrl: submission.audio_recording_url,
      submittedAt: submission.submitted_at,
    });
  }
  return res.json({ success: true, reviews: result });
}));

router.get('/feedback', requireRoles('parent'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patients = await getVisiblePatients(user);
  const submissions = await Submission.find({
    patient_id: { $in: patients.map((patient) => patient._id) },
    status: 'reviewed',
  }).sort({ submitted_at: -1 }).lean();
  const feedback = [];
  for (const submission of submissions) {
    const review = await ClinicalReview.findOne({ submission_id: submission._id }).lean();
    if (review) {
      const assignment = submission.assignment_id
        ? await PatientAssignment.findById(submission.assignment_id).lean()
        : null;
      const activity = assignment
        ? await TherapistActivity.findById(assignment.activity_id).lean()
        : null;
      const therapistProfile = await mongoose.connection.db.collection('therapist_profiles').findOne(
        { _id: review.reviewer_therapist_id },
        { projection: { user_id: 1 } },
      );
      const therapist = therapistProfile
        ? await User.findById(therapistProfile.user_id).select('full_name').lean()
        : null;
      const level = activity ? LEVEL_FROM_DB[activity.level] || activity.level : '';
      feedback.push({
        id: String(review._id),
        submissionId: String(submission._id),
        assignmentId: assignment ? String(assignment._id) : '',
        therapistName: therapist?.full_name || 'Therapist',
        specialty: 'Speech-Language Pathologist',
        title: activity ? activity.title : 'Practice review',
        category: /phrase/i.test(level) ? 'Phrases' : /sentence|conversation/i.test(level) ? 'Sentences' : /word/i.test(level) ? 'Words' : 'Sounds',
        date: review.reviewed_at,
        parentFeedback: review.parent_feedback || '',
        homePractice: review.home_practice_instructions || '',
        observations: review.observations || '',
        reviewedAt: review.reviewed_at,
        averageScore: review.average_score ?? null,
      });
    }
  }
  return res.json({ success: true, feedback });
}));

router.get('/progress', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patient = await findAccessiblePatient(user, {
    patientId: req.query.patientId,
    patientCode: req.query.patientCode,
  });
  const assignments = await PatientAssignment.find({ patient_id: patient._id }).sort({ assigned_at: -1 }).lean();
  const submissions = await Submission.find({ patient_id: patient._id }).sort({ submitted_at: -1 }).lean();
  const groupedLevels = new Map();
  const assignedByLevel = new Map();
  const levelByAssignment = new Map();
  const activityByAssignment = new Map();
  const unlockedLevels = new Set();
  for (const assignment of assignments) {
    const activity = await TherapistActivity.findById(assignment.activity_id).lean();
    if (!activity) continue;
    const level = LEVEL_FROM_DB[activity.level] || activity.level;
    unlockedLevels.add(level);
    levelByAssignment.set(String(assignment._id), level);
    activityByAssignment.set(String(assignment._id), activity);
    assignedByLevel.set(level, (assignedByLevel.get(level) || 0) + 1);
    groupedLevels.set(level, (groupedLevels.get(level) || 0) + (assignment.status === 'completed' ? 1 : 0));
  }
  const attemptsByLevel = new Map();
  for (const submission of submissions) {
    const level = submission.assignment_id
      ? levelByAssignment.get(String(submission.assignment_id))
      : undefined;
    if (level) attemptsByLevel.set(level, (attemptsByLevel.get(level) || 0) + 1);
  }
  return res.json({
    success: true,
    progress: {
      patient: await patientDto(patient),
      assignedCount: assignments.length,
      completedCount: assignments.filter((item) => item.status === 'completed').length,
      submissionCount: submissions.length,
      stars: submissions.reduce((sum, item) => sum + (item.stars_awarded || 0), 0),
      unlockedLevels: [...unlockedLevels],
      completedByLevel: Object.fromEntries(groupedLevels),
      assignedByLevel: Object.fromEntries(assignedByLevel),
      attemptsByLevel: Object.fromEntries(attemptsByLevel),
      recentSubmissions: submissions.slice(0, 10).map((item) => ({
        id: String(item._id),
        assignmentId: item.assignment_id ? String(item.assignment_id) : '',
        status: item.status,
        submittedAt: item.submitted_at,
        practiceItemId: item.practice_item_id || '',
        starsAwarded: item.stars_awarded || 0,
        activityTitle: activityByAssignment.get(String(item.assignment_id))?.title || 'Practice activity',
        level: activityByAssignment.get(String(item.assignment_id))
          ? LEVEL_FROM_DB[activityByAssignment.get(String(item.assignment_id)).level] || activityByAssignment.get(String(item.assignment_id)).level
          : '',
      })),
    },
  });
}));

router.get('/practice-items', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const filter = {};
  if (typeof req.query.sound === 'string') filter.sound = req.query.sound;
  if (typeof req.query.language === 'string') filter.language = req.query.language;
  if (typeof req.query.position === 'string') {
    const position = POSITION_TO_DB[req.query.position] || req.query.position.toLowerCase();
    if (!['initial', 'medial', 'final'].includes(position)) {
      throw new HttpError(400, 'Position must be Initial, Medial, or Final.');
    }
    filter.position = position;
  }
  const items = await PracticeItem.find(filter).sort({ sound: 1, position: 1 }).limit(200).lean();
  return res.json({
    success: true,
    practiceItems: items.map((item) => ({
      id: item._id,
      language: item.language,
      position: POSITION_FROM_DB[item.position],
      sound: item.sound,
      syllable: item.syllable || '',
      sentenceText: item.sentence_text || '',
      videoDemoUrl: item.video_demo_url || '',
      sampleAudioUrl: item.sample_audio_url || '',
      starRatingBenchmark: item.star_rating_benchmark ?? null,
    })),
  });
}));

router.get('/speech-checkins', requireRoles('parent'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patient = await findAccessiblePatient(user, {
    patientId: req.query.patientId,
    patientCode: req.query.patientCode,
  });
  const results = await SpeechCheckinResult.find({ patient_id: patient._id })
    .sort({ completed_at: -1 })
    .limit(50)
    .lean();
  return res.json({
    success: true,
    results: results.map((item) => ({
      id: String(item._id),
      responses: item.question_responses || {},
      evaluatedSound: item.evaluated_sound || null,
      initialScore: item.initial_score ?? null,
      summaryOutcome: item.summary_outcome || null,
      completedAt: item.completed_at,
    })),
  });
}));

router.post('/speech-checkins', requireRoles('parent'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const responses = body.responses;
  if (!responses || (typeof responses !== 'object' && !Array.isArray(responses))) {
    throw new HttpError(400, 'Question responses are required.');
  }
  if (Array.isArray(responses) && responses.length > 50) {
    throw new HttpError(400, 'A check-in cannot contain more than 50 responses.');
  }
  const patient = await findAccessiblePatient(user, {
    patientId: body.patientId,
    patientCode: body.patientCode,
  });
  const result = await SpeechCheckinResult.create({
    patient_id: patient._id,
    question_responses: responses,
    completed_at: new Date(),
  });
  return res.status(201).json({
    success: true,
    result: { id: String(result._id), completedAt: result.completed_at },
  });
}));

router.get('/patients/:patientId/soap-notes', requireRoles('therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patient = await findAccessiblePatient(user, { patientId: req.params.patientId });
  const filter = { patient_id: patient._id };
  if (user.role === 'therapist') filter.therapist_id = await getProfileId(user);
  const notes = await PatientSoapNote.find(filter).sort({ session_number: 1 }).lean();
  return res.json({
    success: true,
    notes: notes.map((note) => ({
      id: String(note._id),
      number: note.session_number,
      date: note.session_date,
      subjective: note.subjective || '',
      objective: note.objective || '',
      assessment: note.assessment || '',
      plan: note.plan || '',
    })),
  });
}));

router.post('/patients/:patientId/soap-notes', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const therapistId = await getProfileId(user);
  const patient = await findAccessiblePatient(user, { patientId: req.params.patientId });
  const body = req.body || {};
  const sessionNumber = Number(body.sessionNumber);
  if (!Number.isInteger(sessionNumber) || sessionNumber < 1) {
    throw new HttpError(400, 'Session number must be a positive whole number.');
  }
  const note = await PatientSoapNote.create({
    patient_id: patient._id,
    therapist_id: therapistId,
    session_number: sessionNumber,
    session_date: validDate(body.sessionDate || new Date(), 'Session date'),
    subjective: boundedString(body.subjective, 'Subjective note', 5000),
    objective: boundedString(body.objective, 'Objective note', 5000),
    assessment: boundedString(body.assessment, 'Assessment note', 5000),
    plan: boundedString(body.plan, 'Plan note', 5000),
    created_at: new Date(),
  });
  void logAuditEvent(mongoose.connection.db, {
    actorId: user._id,
    actorRole: user.role,
    actorName: user.full_name,
    action: 'SOAP note created',
    category: 'Clinical',
    targetType: 'soap_note',
    targetId: note._id,
    details: 'Therapist added a SOAP note.',
  });
  return res.status(201).json({ success: true, note: { id: String(note._id), number: note.session_number } });
}));

router.get('/patients/:patientId/accomplishments', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patient = await findAccessiblePatient(user, { patientId: req.params.patientId });
  const accomplishments = await PatientAccomplishment.find({ patient_id: patient._id })
    .sort({ achieved_date: -1 })
    .lean();
  return res.json({
    success: true,
    accomplishments: accomplishments.map((item) => ({
      id: String(item._id),
      title: item.title,
      achievedDate: item.achieved_date,
      targetAccuracy: item.target_accuracy || '',
      clinicianNotes: item.clinician_notes || '',
      quote: item.quote || '',
      audioSampleUrl: item.audio_sample_url || '',
      accentColor: item.accent_color || '',
      waveform: item.waveform_data || [],
    })),
  });
}));

router.post('/patients/:patientId/accomplishments', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patient = await findAccessiblePatient(user, { patientId: req.params.patientId });
  const body = req.body || {};
  const waveform = body.waveform;
  if (waveform !== undefined && (!Array.isArray(waveform) || waveform.length > 256 || waveform.some((value) => !Number.isFinite(value)))) {
    throw new HttpError(400, 'Waveform must contain at most 256 numeric values.');
  }
  const accomplishment = await PatientAccomplishment.create({
    patient_id: patient._id,
    title: boundedString(body.title, 'Accomplishment title', 200, true),
    achieved_date: validDate(body.achievedDate || new Date(), 'Achievement date'),
    target_accuracy: boundedString(body.targetAccuracy, 'Target accuracy', 100),
    clinician_notes: boundedString(body.clinicianNotes, 'Clinician notes', 2000),
    quote: boundedString(body.quote, 'Quote', 1000),
    audio_sample_url: boundedString(body.audioSampleUrl, 'Audio sample URI', 2048),
    accent_color: boundedString(body.accentColor, 'Accent color', 40),
    waveform_data: waveform || [],
    created_at: new Date(),
  });
  return res.status(201).json({
    success: true,
    accomplishment: { id: String(accomplishment._id), title: accomplishment.title },
  });
}));

router.get('/notifications', requireRoles('therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const patients = await getVisiblePatients(user);
  const submissions = await Submission.find({
    patient_id: user.role === 'admin' ? { $exists: true } : { $in: patients.map((item) => item._id) },
  }).sort({ submitted_at: -1 }).limit(20).lean();
  const notifications = [];
  for (const submission of submissions) {
    const patient = patients.find((item) => String(item._id) === String(submission.patient_id)) ||
      await Patient.findById(submission.patient_id).lean();
    if (!patient) continue;
    const assignment = submission.assignment_id
      ? await PatientAssignment.findById(submission.assignment_id).lean()
      : null;
    const activity = assignment ? await TherapistActivity.findById(assignment.activity_id).lean() : null;
    notifications.push({
      id: String(submission._id),
      name: patient.first_name,
      action: 'submitted a practice recording',
      detail: activity ? `${activity.sound} · ${LEVEL_FROM_DB[activity.level] || activity.level}` : 'Practice submission',
      time: submission.submitted_at,
      unread: submission.status === 'pending',
    });
  }
  return res.json({ success: true, notifications });
}));

router.get('/account/profile', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  return res.json({
    success: true,
    profile: {
      id: String(user._id),
      fullName: user.full_name,
      email: user.email,
      contact: user.phone_number,
      role: user.role,
      totpEnabled: user.totp_enabled === true,
    },
  });
}));

router.patch('/account/profile', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const body = req.body || {};
  const fullName = boundedString(body.fullName, 'Full name', 120, true);
  const contact = boundedString(body.contact, 'Contact number', 40, true);
  const updated = await User.findByIdAndUpdate(
    user._id,
    { full_name: fullName, phone_number: contact, updated_at: new Date() },
    { new: true, runValidators: true },
  ).select('full_name email phone_number role totp_enabled').lean();
  return res.json({
    success: true,
    profile: {
      id: String(updated._id),
      fullName: updated.full_name,
      email: updated.email,
      contact: updated.phone_number,
      role: updated.role,
      totpEnabled: updated.totp_enabled === true,
    },
  });
}));

router.get('/therapist/profile', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const therapistId = await getProfileId(user);
  const profile = await mongoose.connection.db.collection('therapist_profiles').findOne({
    _id: therapistId,
    user_id: user._id,
  });
  if (!profile) throw new HttpError(404, 'Therapist profile was not found.');
  return res.json({
    success: true,
    profile: {
      id: String(user._id),
      fullName: user.full_name,
      email: user.email,
      contact: user.phone_number || profile.contact_number || '',
      role: user.role,
      title: profile.professional_title || profile.title || '',
      license: profile.license_number || profile.license || '',
      clinic: profile.clinic_name || profile.clinic || '',
      specializations: Array.isArray(profile.specializations) ? profile.specializations : [],
    },
  });
}));

router.patch('/therapist/profile', requireRoles('therapist'), endpoint(async (req, res) => {
  const user = await getSessionUser(req);
  const therapistId = await getProfileId(user);
  const body = req.body || {};
  const fullName = boundedString(body.fullName, 'Full name', 120, true);
  const contact = boundedString(body.contact, 'Contact number', 40, true);
  const title = boundedString(body.title ?? '', 'Professional title', 120);
  const license = boundedString(body.license ?? '', 'Professional license', 120);
  const clinic = boundedString(body.clinic ?? '', 'Clinic', 160);
  let specializations;
  if (body.specializations !== undefined) {
    if (!Array.isArray(body.specializations) || body.specializations.length > 30) {
      throw new HttpError(400, 'Specializations must be an array with at most 30 entries.');
    }
    specializations = body.specializations.map((item) =>
      boundedString(item, 'Specialization', 80, true),
    );
  }
  const profileCollection = mongoose.connection.db.collection('therapist_profiles');
  await runTransaction(async (session) => {
    const profileUpdate = {
      professional_title: title,
      license_number: license,
      clinic_name: clinic,
      contact_number: contact,
      updated_at: new Date(),
    };
    if (specializations) profileUpdate.specializations = specializations;
    const result = await profileCollection.updateOne(
      { _id: therapistId, user_id: user._id },
      { $set: profileUpdate },
      { session },
    );
    if (!result.matchedCount) throw new HttpError(404, 'Therapist profile was not found.');
    await User.updateOne(
      { _id: user._id },
      { $set: { full_name: fullName, phone_number: contact, updated_at: new Date() } },
      { session, runValidators: true },
    );
  });
  const savedProfile = await profileCollection.findOne({ _id: therapistId, user_id: user._id });
  return res.json({
    success: true,
    profile: {
      id: String(user._id),
      fullName,
      email: user.email,
      contact,
      role: user.role,
      title,
      license,
      clinic,
      specializations: Array.isArray(savedProfile?.specializations) ? savedProfile.specializations : [],
    },
  });
}));

router.patch('/account/password', requireRoles('parent', 'therapist', 'teacher', 'admin'), endpoint(async (req, res) => {
  const user = await User.findById(objectId(req.session.sub, 'session user ID')).select('+password_hash');
  if (!user || user.status !== 'verified' || user.role !== req.session.role) {
    throw new HttpError(401, 'Your account is no longer available. Please sign in again.');
  }
  const body = req.body || {};
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  const [salt, expectedHash] = user.password_hash ? user.password_hash.split(':') : [];
  if (!currentPassword || !salt || !expectedHash || !(await verifyPassword(currentPassword, salt, expectedHash))) {
    throw new HttpError(400, 'The current password is incorrect.');
  }
  if (
    newPassword.length < 8 ||
    newPassword.length > 20 ||
    !/[a-z]/.test(newPassword) ||
    !/[A-Z]/.test(newPassword) ||
    !/\d/.test(newPassword) ||
    !/[!@#$%^&*(),.?":{}|<>\-_]/.test(newPassword)
  ) {
    throw new HttpError(400, 'Use 8–20 characters with lowercase, uppercase, a number, and a special character.');
  }
  const next = await hashPassword(newPassword);
  user.password_hash = `${next.salt}:${next.hash}`;
  user.updated_at = new Date();
  await user.save();
  return res.json({ success: true, message: 'Password updated successfully.' });
}));

router.get('/admin/users', requireRoles('admin'), endpoint(async (req, res) => {
  await getSessionUser(req);
  const filter = {};
  if (['parent', 'therapist', 'teacher', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  if (['pending', 'verified', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
  const users = await User.find(filter)
    .select('full_name email role status created_at child_name child_age student_id phone_number archived_at archive_reason')
    .sort({ created_at: -1 })
    .limit(200)
    .lean();
  return res.json({
    success: true,
    users: await Promise.all(users.map(async (item) => {
      const profile = ['parent', 'therapist', 'teacher', 'admin'].includes(item.role)
        ? await mongoose.connection.db.collection(`${item.role}_profiles`).findOne(
          { user_id: item._id },
          { projection: { _id: 1 } },
        )
        : null;
      return {
      id: String(item._id),
      profileId: profile ? String(profile._id) : '',
      name: item.full_name,
      email: item.email,
      role: item.role,
      status: item.status,
      createdAt: item.created_at,
      childName: item.child_name || '',
      childAge: item.child_age ?? null,
      studentId: item.student_id || '',
      contact: item.phone_number || '',
      archivedAt: item.archived_at || null,
      archiveReason: item.archive_reason || '',
      };
    })),
  });
}));

router.patch('/admin/users/:userId/status', requireRoles('admin'), endpoint(async (req, res) => {
  const actor = await getSessionUser(req);
  const id = objectId(req.params.userId, 'user ID');
  const status = req.body && req.body.status;
  if (!['verified', 'rejected'].includes(status)) {
    throw new HttpError(400, 'Account status must be verified or rejected.');
  }
  const user = await User.findByIdAndUpdate(
    id,
    { status, updated_at: new Date(), ...(status === 'verified' ? { archived_at: null, archived_by: null, archive_reason: null } : {}) },
    { new: true, runValidators: true },
  ).select('full_name email role status created_at').lean();
  if (!user) throw new HttpError(404, 'Account was not found.');
  if (status === 'rejected') {
    await mongoose.connection.db.collection('user_sessions').updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
  void logAuditEvent(mongoose.connection.db, {
    actorId: actor._id,
    actorRole: actor.role,
    actorName: actor.full_name,
    action: 'Account status updated',
    category: 'Account',
    targetType: 'account',
    targetId: user._id,
    details: `${user.role} account status changed to ${user.status}.`,
  });
  return res.json({
    success: true,
    user: {
      id: String(user._id),
      name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      archivedAt: user.archived_at || null,
      archiveReason: user.archive_reason || '',
    },
  });
}));

router.post('/admin/users', requireRoles('admin'), endpoint(async (req, res) => {
  const actor = await getSessionUser(req);
  const body = req.body || {};
  const role = body.role;
  if (!['therapist', 'teacher', 'parent', 'admin'].includes(role)) {
    throw new HttpError(400, 'Choose a supported account role.');
  }
  const fullName = boundedString(body.fullName, 'Full name', 120, true);
  const email = boundedString(body.email, 'Email', 254, true).toLowerCase();
  const contact = boundedString(body.contact || '', 'Contact number', 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');
  const invitePassword = temporaryPassword();
  const invitationToken = crypto.randomBytes(32).toString('base64url');
  const { salt, hash } = await hashPassword(invitePassword);
  const user = new User({
    full_name: fullName,
    email,
    phone_number: contact || '',
    password_hash: `${salt}:${hash}`,
    role,
    status: 'pending',
    invited_by_admin: true,
    invitation_token_hash: crypto.createHash('sha256').update(invitationToken).digest('hex'),
    invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...(role === 'parent' ? {
      child_name: boundedString(body.childName, 'Student name', 120, true),
      student_id: boundedString(body.studentId, 'Student number', 40, true),
      ...(Number.isInteger(body.childAge) && body.childAge >= 0 && body.childAge <= 18 ? { child_age: body.childAge } : {}),
      ...(typeof body.startingLevel === 'string' ? { starting_level: body.startingLevel } : {}),
    } : {}),
  });
  const db = mongoose.connection.db;
  let patient;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await user.save({ session });
      const profileId = new mongoose.Types.ObjectId();
      const now = new Date();
      const nameFields = {
        _id: profileId,
        user_id: user._id,
        full_name: fullName,
        created_at: now,
      };
      if (role === 'therapist') {
        await db.collection('therapist_profiles').insertOne({
          ...nameFields,
          staff_id: boundedString(body.staffId || '', 'Staff ID', 40),
          professional_title: boundedString(body.professionalTitle || '', 'Professional title', 120),
          specialization: boundedString(body.specialization || '', 'Specialization', 160),
          license_number: boundedString(body.licenseNumber || '', 'License number', 120),
          contact_number: contact,
          clinic_name: boundedString(body.clinic || '', 'Clinic', 160),
        }, { session });
      } else if (role === 'teacher') {
        await db.collection('teacher_profiles').insertOne({
          ...nameFields,
          professional_identifier: boundedString(body.professionalIdentifier || '', 'Professional ID', 40),
          school: boundedString(body.school || '', 'School', 160),
          grade_sections: Array.isArray(body.gradeSections) ? body.gradeSections.map((item) => boundedString(item, 'Grade section', 80)) : [],
        }, { session });
      } else if (role === 'parent') {
        const parentProfile = {
          ...nameFields,
          guardian_name: fullName,
          relationship_to_child: boundedString(body.relationship || 'Parent', 'Relationship', 80),
        };
        await db.collection('parent_profiles').insertOne(parentProfile, { session });
        if (body.primaryTherapistId || body.assignedTeacherId) {
          const therapistId = body.primaryTherapistId ? objectId(body.primaryTherapistId, 'therapist profile ID') : null;
          const teacherId = body.assignedTeacherId ? objectId(body.assignedTeacherId, 'teacher profile ID') : null;
          const [therapistProfile, teacherProfile] = await Promise.all([
            therapistId ? db.collection('therapist_profiles').findOne({ _id: therapistId }, { session, projection: { _id: 1 } }) : null,
            teacherId ? db.collection('teacher_profiles').findOne({ _id: teacherId }, { session, projection: { _id: 1 } }) : null,
          ]);
          if (therapistId && !therapistProfile) throw new HttpError(400, 'The assigned Therapist profile was not found.');
          if (teacherId && !teacherProfile) throw new HttpError(400, 'The assigned Teacher profile was not found.');
          const patientCode = await generatePatientCode(db.collection('patients'), new Date(), undefined, session);
          const childParts = user.child_name.split(/\s+/);
          const patientData = {
            patientCode,
            parent_id: profileId,
            ...(therapistId ? { primary_therapist_id: therapistId } : {}),
            ...(teacherId ? { assigned_teacher_id: teacherId } : {}),
            first_name: childParts[0],
            last_name: childParts.slice(1).join(' ') || 'Child',
            school_student_id: user.student_id,
            school: boundedString(body.school || '', 'School', 160),
            grade: boundedString(body.grade || '', 'Grade', 40),
            section: boundedString(body.section || '', 'Section', 80),
            created_at: now,
            language_profile: '',
            target_positions: [],
            baseline_done: false,
            total_stars: 0,
          };
          if (typeof body.dateOfBirth === 'string' && !Number.isNaN(Date.parse(body.dateOfBirth))) {
            patientData.date_of_birth = new Date(body.dateOfBirth);
          }
          const inserted = await db.collection('patients').insertOne(patientData, { session });
          patient = { id: String(inserted.insertedId), patientCode, firstName: childParts[0], lastName: childParts.slice(1).join(' ') || 'Child' };
        }
      } else {
        await db.collection('admin_profiles').insertOne(nameFields, { session });
      }
      user._adminProfileId = profileId;
    });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, 'An account with this email or student code already exists.');
    throw error;
  } finally {
    await session.endSession();
  }
  void logAuditEvent(db, {
    actorId: actor._id,
    actorRole: actor.role,
    actorName: actor.full_name,
    action: 'Account invitation created',
    category: 'Account',
    targetType: 'account',
    targetId: user._id,
    details: `A ${role} account invitation was created for ${email}.`,
  });
  return res.status(201).json({
    success: true,
    user: {
      id: String(user._id),
      profileId: String(user._adminProfileId),
      name: fullName,
      email,
      role,
      status: user.status,
      createdAt: user.created_at,
      contact,
      archivedAt: null,
      archiveReason: '',
    },
    temporaryPassword: invitePassword,
    invitationToken,
    ...(patient ? { patient } : {}),
  });
}));

router.post('/admin/users/:userId/invitation', requireRoles('admin'), endpoint(async (req, res) => {
  const actor = await getSessionUser(req);
  const id = objectId(req.params.userId, 'user ID');
  const user = await User.findById(id).select('+password_hash');
  if (!user || !user.invited_by_admin || user.status !== 'pending' || user.archived_at) {
    throw new HttpError(409, 'Only pending, active invitations can be resent.');
  }
  const invitePassword = temporaryPassword();
  const invitationToken = crypto.randomBytes(32).toString('base64url');
  const { salt, hash } = await hashPassword(invitePassword);
  user.password_hash = `${salt}:${hash}`;
  user.invitation_token_hash = crypto.createHash('sha256').update(invitationToken).digest('hex');
  user.invitation_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.updated_at = new Date();
  await user.save();
  void logAuditEvent(mongoose.connection.db, {
    actorId: actor._id,
    actorRole: actor.role,
    actorName: actor.full_name,
    action: 'Account invitation resent',
    category: 'Account',
    targetType: 'account',
    targetId: user._id,
    details: `A new setup credential was issued for ${user.email}.`,
  });
  return res.json({ success: true, temporaryPassword: invitePassword, invitationToken });
}));

router.patch('/admin/users/:userId/archive', requireRoles('admin'), endpoint(async (req, res) => {
  const actor = await getSessionUser(req);
  const id = objectId(req.params.userId, 'user ID');
  const archived = req.body?.archived !== false;
  const reason = archived ? boundedString(req.body?.reason, 'Archive reason', 1000, true) : '';
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'Account was not found.');
  if (user.role === 'admin' && archived) throw new HttpError(409, 'Administrator accounts cannot be archived.');
  const now = new Date();
  user.archived_at = archived ? now : null;
  user.archived_by = archived ? actor._id : null;
  user.archive_reason = archived ? reason : null;
  if (archived) user.status = 'rejected';
  else user.status = 'verified';
  user.updated_at = now;
  await user.save();
  if (archived) {
    await mongoose.connection.db.collection('user_sessions').updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: now } },
    );
  }
  void logAuditEvent(mongoose.connection.db, {
    actorId: actor._id,
    actorRole: actor.role,
    actorName: actor.full_name,
    action: archived ? 'Account archived' : 'Account restored',
    category: 'Account',
    targetType: 'account',
    targetId: user._id,
    details: archived ? reason : 'Account membership and sign-in access were restored.',
  });
  return res.json({
    success: true,
    user: {
      id: String(user._id),
      status: user.status,
      archivedAt: user.archived_at,
      archiveReason: user.archive_reason || '',
    },
  });
}));

module.exports = { learning: router };
