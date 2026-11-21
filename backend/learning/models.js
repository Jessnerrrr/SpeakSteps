const mongoose = require('mongoose');

const { Schema } = mongoose;
const objectId = Schema.Types.ObjectId;
const int32 = Schema.Types.Int32;

function makeModel(name, definition, collection, indexes = []) {
  const schema = new Schema(definition, {
    collection,
    versionKey: false,
    autoIndex: false,
  });
  for (const [fields, options] of indexes) schema.index(fields, options);
  return mongoose.models[name] || mongoose.model(name, schema);
}

const TherapistActivity = makeModel(
  'TherapistActivity',
  {
    author_therapist_id: { type: objectId, required: true },
    title: { type: String, required: true, trim: true },
    sound: { type: String, required: true },
    level: {
      type: String,
      required: true,
      enum: ['isolation', 'syllable', 'word', 'phrase', 'sentence', 'conversation'],
    },
    target_positions: [{ type: String, enum: ['initial', 'medial', 'final'] }],
    language: String,
    instructions: String,
    visual_guide: String,
    visual_asset_name: String,
    custom_lines: { type: [String], default: [] },
    created_at: { type: Date, required: true, default: Date.now },
  },
  'therapist_activities',
  [[{ author_therapist_id: 1 }, { name: 'author_therapist_id_1' }]],
);

const ActivityWord = makeModel(
  'ActivityWord',
  {
    activity_id: { type: objectId, required: true },
    word_bank_id: String,
    text: { type: String, required: true, trim: true },
    sound: String,
    position: { type: String, enum: ['initial', 'medial', 'final'] },
    phrase: String,
  },
  'activity_words',
  [
    [{ activity_id: 1 }, { name: 'activity_id_1' }],
    [{ word_bank_id: 1 }, { name: 'word_bank_id_1' }],
  ],
);

const WordBankEntry = makeModel(
  'WordBankEntry',
  {
    _id: { type: String, required: true },
    word_text: { type: String, required: true, trim: true },
    sound: { type: String, required: true },
    position: { type: String, required: true, enum: ['initial', 'medial', 'final'] },
    language: { type: String, required: true },
    is_standard: { type: Boolean, required: true, default: false },
    created_by_therapist_id: objectId,
  },
  'word_bank',
  [
    [{ sound: 1, position: 1, language: 1 }, { name: 'sound_1_position_1_language_1' }],
    [{ created_by_therapist_id: 1 }, { name: 'created_by_therapist_id_1' }],
  ],
);

const PatientAssignment = makeModel(
  'PatientAssignment',
  {
    activity_id: { type: objectId, required: true },
    patient_id: { type: objectId, required: true },
    therapist_id: { type: objectId, required: true },
    status: {
      type: String,
      required: true,
      enum: ['assigned', 'in_progress', 'completed', 'overdue'],
      default: 'assigned',
    },
    instructions: String,
    due_date: Date,
    assigned_at: { type: Date, required: true, default: Date.now },
    completed_at: Date,
  },
  'patient_assignments',
  [
    [{ patient_id: 1, status: 1, due_date: 1 }, { name: 'patient_id_1_status_1_due_date_1' }],
    [{ activity_id: 1 }, { name: 'activity_id_1' }],
    [{ therapist_id: 1 }, { name: 'therapist_id_1' }],
  ],
);

const Submission = makeModel(
  'Submission',
  {
    assignment_id: objectId,
    patient_id: { type: objectId, required: true },
    practice_item_id: String,
    audio_recording_url: { type: String, required: true },
    waveform_sample: [Number],
    duration_seconds: Number,
    status: { type: String, required: true, enum: ['pending', 'reviewed'], default: 'pending' },
    stars_awarded: int32,
    submitted_at: { type: Date, required: true, default: Date.now },
    speech_match_score: Number,
    speech_match_provider: String,
  },
  'submissions',
  [
    [{ patient_id: 1, submitted_at: -1 }, { name: 'patient_id_1_submitted_at_-1' }],
    [{ assignment_id: 1 }, { name: 'assignment_id_1' }],
    [{ practice_item_id: 1 }, { name: 'practice_item_id_1' }],
    [{ status: 1 }, { name: 'status_1' }],
  ],
);

const ClinicalReview = makeModel(
  'ClinicalReview',
  {
    submission_id: { type: objectId, required: true },
    reviewer_therapist_id: { type: objectId, required: true },
    observations: String,
    parent_feedback: String,
    home_practice_instructions: String,
    average_score: Number,
    reviewed_at: { type: Date, required: true, default: Date.now },
  },
  'clinical_reviews',
  [
    [{ submission_id: 1 }, { name: 'submission_id_1', unique: true }],
    [{ reviewer_therapist_id: 1 }, { name: 'reviewer_therapist_id_1' }],
  ],
);

const PatientSoapNote = makeModel(
  'PatientSoapNote',
  {
    patient_id: { type: objectId, required: true },
    therapist_id: { type: objectId, required: true },
    session_number: { type: int32, required: true },
    session_date: { type: Date, required: true },
    subjective: String,
    objective: String,
    assessment: String,
    plan: String,
    created_at: { type: Date, required: true, default: Date.now },
  },
  'patient_soap_notes',
  [
    [{ patient_id: 1, session_number: 1 }, { name: 'patient_id_1_session_number_1', unique: true }],
    [{ therapist_id: 1 }, { name: 'therapist_id_1' }],
  ],
);

const PatientAccomplishment = makeModel(
  'PatientAccomplishment',
  {
    patient_id: { type: objectId, required: true },
    title: { type: String, required: true, trim: true },
    achieved_date: { type: Date, required: true },
    target_accuracy: String,
    clinician_notes: String,
    quote: String,
    audio_sample_url: String,
    accent_color: String,
    waveform_data: [Number],
    created_at: { type: Date, required: true, default: Date.now },
  },
  'patient_accomplishments',
  [[{ patient_id: 1, achieved_date: -1 }, { name: 'patient_id_1_achieved_date_-1' }]],
);

const SpeechCheckinResult = makeModel(
  'SpeechCheckinResult',
  {
    patient_id: { type: objectId, required: true },
    question_responses: Schema.Types.Mixed,
    evaluated_sound: String,
    initial_score: Number,
    summary_outcome: String,
    completed_at: { type: Date, required: true, default: Date.now },
  },
  'speech_checkin_results',
  [[{ patient_id: 1, completed_at: -1 }, { name: 'patient_id_1_completed_at_-1' }]],
);

const SubmissionTargetRating = makeModel(
  'SubmissionTargetRating',
  {
    submission_id: { type: objectId, required: true },
    word_text: { type: String, required: true },
    position: { type: String, enum: ['initial', 'medial', 'final'] },
    score: { type: int32, required: true, min: 1, max: 5 },
    clinician_feedback: String,
    remarks: String,
  },
  'submission_target_ratings',
  [[{ submission_id: 1 }, { name: 'submission_id_1' }]],
);

const PracticeItem = makeModel(
  'PracticeItem',
  {
    _id: { type: String, required: true },
    language: { type: String, required: true },
    position: { type: String, required: true, enum: ['initial', 'medial', 'final'] },
    sound: { type: String, required: true },
    syllable: String,
    sentence_text: String,
    video_demo_url: String,
    sample_audio_url: String,
    star_rating_benchmark: int32,
  },
  'practice_items',
  [[{ sound: 1, position: 1, language: 1 }, { name: 'sound_1_position_1_language_1' }]],
);

module.exports = {
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
};
