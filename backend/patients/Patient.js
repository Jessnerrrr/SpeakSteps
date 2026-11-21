const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientCode: { type: String, match: /^\d{9}$/ },
    parent_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    primary_therapist_id: mongoose.Schema.Types.ObjectId,
    assigned_teacher_id: mongoose.Schema.Types.ObjectId,
    first_name: { type: String, required: true, trim: true },
    middle_name: { type: String, trim: true },
    last_name: { type: String, required: true, trim: true },
    suffix: { type: String, trim: true },
    date_of_birth: { type: Date, required: true },
    created_at: { type: Date, required: true, default: Date.now },
    language_profile: String,
    target_positions: [String],
    baseline_done: Boolean,
    total_stars: Number,
  },
  { collection: 'patients', strict: false, versionKey: false },
);

patientSchema.index(
  { patientCode: 1 },
  { unique: true, sparse: true, name: 'patientCode_unique_sparse' },
);

module.exports = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
