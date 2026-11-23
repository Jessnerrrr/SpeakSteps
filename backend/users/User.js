const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone_number: { type: String, default: '', trim: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'therapist', 'teacher', 'parent'], default: 'parent', required: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', required: true },
    mfa_enabled: { type: Boolean, default: false },
    totp_enabled: { type: Boolean, default: false },
    totp_secret: { type: String, default: null, select: false },
    totp_pending_secret: { type: String, default: null, select: false },
    password_reset_token_hash: { type: String, default: null, select: false },
    password_reset_expires_at: { type: Date, default: null, select: false },
    password_reset_attempts: { type: Number, default: 0, select: false },
    invitation_token_hash: { type: String, default: null, select: false },
    invitation_expires_at: { type: Date, default: null, select: false },
    invited_by_admin: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },
    archived_by: { type: mongoose.Schema.Types.ObjectId, default: null },
    archive_reason: { type: String, default: null },
    security_question: { type: String, default: null },
    security_answer_hash: { type: String, default: null, select: false },
    last_login_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now, required: true },
    updated_at: { type: Date, default: Date.now },
    profile_image: { type: Buffer, select: false },
    verification_image: { type: Buffer, required() { return this.role === 'parent' && !this.invited_by_admin; }, select: false },
    child_name: { type: String, required() { return this.role === 'parent' && !this.invited_by_admin; }, trim: true },
    child_age: { type: Number, required() { return this.role === 'parent' && !this.invited_by_admin; }, min: 0 },
    starting_level: { type: String, required() { return this.role === 'parent' && !this.invited_by_admin; } },
    student_id: { type: String, required() { return this.role === 'parent' && !this.invited_by_admin; }, trim: true },
  },
  { versionKey: false },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
