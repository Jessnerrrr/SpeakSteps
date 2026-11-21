const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'therapist', 'teacher', 'parent'], default: 'parent', required: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', required: true },
    mfa_enabled: { type: Boolean, default: false },
    security_question: { type: String, default: null },
    security_answer_hash: { type: String, default: null, select: false },
    last_login_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now, required: true },
    updated_at: { type: Date, default: Date.now },
    profile_image: { type: Buffer, select: false },
    verification_image: { type: Buffer, required() { return this.role === 'parent'; }, select: false },
    child_name: { type: String, required() { return this.role === 'parent'; }, trim: true },
    child_age: { type: Number, required() { return this.role === 'parent'; }, min: 0 },
    starting_level: { type: String, required() { return this.role === 'parent'; } },
    student_id: { type: String, required() { return this.role === 'parent'; }, trim: true },
  },
  { versionKey: false },
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
