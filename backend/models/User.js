const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/*
  adminType values & their permissions:
  ─────────────────────────────────────────────────────────────────
  'super_admin'    → full access (all modules incl. elections, users, stats)
  'hostel_warden'  → announcements + complaints ONLY (nothing else)
  'librarian'      → announcements + complaints ONLY (nothing else)
  'union_member'   → announcements + complaints ONLY (nothing else) — same as warden/librarian
  'student' role   → adminType is null

  Note: NO admin type (including super_admin) can cast a vote — voting is
  restricted to students only (see middleware/auth.js studentOnly + routes/elections.js).
  Only super_admin can access/manage the Elections module in the admin panel.
  ─────────────────────────────────────────────────────────────────
*/

const userSchema = new mongoose.Schema({
  // ── Shared fields ──────────────────────────────────────────────
  name:  { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true, lowercase: true,
    validate: {
      validator: (v) => v.endsWith('@tec.rjt.ac.lk'),
      message:   'Only campus email (@tec.rjt.ac.lk) is allowed',
    },
  },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar:     { type: String, default: '' },
  isActive:   { type: Boolean, default: true },

  // ── Temporary block (super_admin can suspend an account for N days) ──
  blockedUntil: { type: Date,   default: null },
  blockReason:  { type: String, default: '' },

  // ── Student-only fields ────────────────────────────────────────
  // registrationNumber: unique per student (e.g. ICT/2022/001)
  registrationNumber: {
    type: String,
    sparse: true,   // allows null for admins but unique among students
    unique: true,
  },
  // indexNumber: university exam index (unique per student)
  indexNumber: {
    type: String,
    sparse: true,
    unique: true,
  },
  department: {
    type: String,
    enum: ['BPT', 'EET', 'FDT', 'ICT', 'MTT', 'ENT', 'BST', ''],
    default: '',
  },
  year: { type: String, default: '' },
  isHosteller: { type: Boolean, default: false },
  hostelName:  { type: String, default: '' },   // required if isHosteller = true

  // ── Admin-only fields ──────────────────────────────────────────
  adminType: {
    type: String,
    enum: ['super_admin', 'hostel_warden', 'union_member', 'librarian', null],
    default: null,
  },

  // Hostel Warden extras
  wardenId:     { type: String, default: '' },   // unique warden ID
  wardenHostel: { type: String, default: '' },   // hostel they manage

  // Union Member extras
  unionId:       { type: String, default: '' },  // unique union member ID
  unionPosition: { type: String, default: '' },  // e.g. President, Secretary

  // Librarian extras
  libraryId: { type: String, default: '' },   // unique librarian ID

  // Super admin has no extra fields beyond email/name

  // ── OTP / Email Verification ───────────────────────────────────
  otp:             { type: String,  default: null },
  otpExpiry:       { type: Date,    default: null },
  isEmailVerified: { type: Boolean, default: false },

}, { timestamps: true });

// ── Permission helpers ─────────────────────────────────────────────
userSchema.virtual('canAccessElections').get(function () {
  if (this.role === 'student') return true; // students vote
  return this.adminType === 'super_admin'; // only super_admin can view/manage elections
});
userSchema.virtual('canAccessAnnouncements').get(function () {
  if (this.role === 'student') return true;
  return ['super_admin', 'hostel_warden', 'librarian', 'union_member'].includes(this.adminType);
});
userSchema.virtual('canAccessComplaints').get(function () {
  if (this.role === 'student') return true;
  return ['super_admin', 'hostel_warden', 'librarian', 'union_member'].includes(this.adminType);
});
userSchema.virtual('canManageElections').get(function () {
  return this.role === 'admin' && this.adminType === 'super_admin';
});
// Users / Elections mgmt / Lost&Found / stats — restricted to super_admin only.
// hostel_warden, librarian and union_member are all limited to
// announcements + complaints and nothing else.
userSchema.virtual('canAccessOtherModules').get(function () {
  return this.role === 'admin' && this.adminType === 'super_admin';
});

// ── Password hashing ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
