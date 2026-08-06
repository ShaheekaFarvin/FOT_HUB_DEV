const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegNumber, validateAdminCount } = require('./regConfigController');
const { sendOtpEmail } = require('../utils/mailer');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── Generate a 6-digit OTP ────────────────────────────────────────────
const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ── Shape the public user object returned in every response ──────────
const formatUser = (user, token) => ({
  _id:                user._id,
  name:               user.name,
  email:              user.email,
  role:               user.role,
  avatar:             user.avatar,
  token,
  registrationNumber: user.registrationNumber || '',
  indexNumber:        user.indexNumber        || '',
  department:         user.department         || '',
  year:               user.year               || '',
  isHosteller:        user.isHosteller        || false,
  hostelName:         user.hostelName         || '',
  adminType:          user.adminType          || null,
  wardenId:           user.wardenId           || '',
  wardenHostel:       user.wardenHostel       || '',
  unionId:            user.unionId            || '',
  unionPosition:      user.unionPosition      || '',
  libraryId:          user.libraryId          || '',
  canManageElections:     user.canManageElections,
  canAccessAnnouncements: user.canAccessAnnouncements,
  canAccessComplaints:    user.canAccessComplaints,
});

// Helper: derive email from an ID like ITT/2023/001 → itt2023001@tec.rjt.ac.lk
const deriveEmail = (id) => id.replace(/\//g, '').toLowerCase() + '@tec.rjt.ac.lk';

// ══════════════════════════════════════════════════════════════════════
// ── REGISTER STEP 1: Validate registration data & send OTP ───────────
// No DB write yet — pending data held in memory keyed by email.
// ══════════════════════════════════════════════════════════════════════
const pendingRegistrations = new Map();

exports.sendRegisterOtp = async (req, res) => {
  let {
    name, email, password, role,
    registrationNumber, indexNumber, department, year, isHosteller, hostelName,
    adminType,
    wardenId, wardenHostel,
    unionId, unionPosition,
    libraryId,
  } = req.body;

  try {
    if (role !== 'admin' && registrationNumber) {
      email = deriveEmail(registrationNumber);
    }
    if (role === 'admin' && adminType === 'hostel_warden' && wardenId) {
      email = deriveEmail(wardenId);
    }
    if (role === 'admin' && adminType === 'librarian' && libraryId) {
      email = deriveEmail(libraryId);
    }

    if (!email || !email.endsWith('@tec.rjt.ac.lk')) {
      return res.status(400).json({ message: 'Only @tec.rjt.ac.lk campus emails are allowed.' });
    }

    const dupQuery = [{ email }];
    if (role !== 'admin') {
      if (registrationNumber) dupQuery.push({ registrationNumber });
      if (indexNumber)        dupQuery.push({ indexNumber });
    }
    if (role === 'admin' && adminType === 'hostel_warden' && wardenId) dupQuery.push({ wardenId });
    if (role === 'admin' && adminType === 'union_member'  && unionId)  dupQuery.push({ unionId });
    if (role === 'admin' && adminType === 'librarian'     && libraryId) dupQuery.push({ libraryId });

    if (await User.findOne({ $or: dupQuery })) {
      return res.status(400).json({
        message: 'A user already exists with this email, registration number, index number, or admin ID.',
      });
    }

    if (role !== 'admin') {
      if (!registrationNumber) return res.status(400).json({ message: 'Registration number is required.' });
      if (!indexNumber)        return res.status(400).json({ message: 'Index number is required.' });
      if (!/^\d{4}$/.test(indexNumber)) return res.status(400).json({ message: 'Index number must be exactly 4 digits.' });
      if (!department) return res.status(400).json({ message: 'Department is required.' });
      if (!year)       return res.status(400).json({ message: 'Academic year is required.' });
      if (isHosteller && !hostelName) return res.status(400).json({ message: 'Hostel name is required for hostellers.' });
      const regErr = await validateRegNumber(registrationNumber, department, year);
      if (regErr) return res.status(400).json({ message: regErr });
    }

    if (role === 'admin') {
      if (!adminType) return res.status(400).json({ message: 'Admin type is required.' });
      if (adminType === 'hostel_warden') {
        if (!wardenId)     return res.status(400).json({ message: 'Warden ID is required.' });
        if (!wardenHostel) return res.status(400).json({ message: 'Managed hostel is required.' });
      }
      if (adminType === 'union_member') {
        if (!unionId)       return res.status(400).json({ message: 'Union ID is required.' });
        if (!unionPosition) return res.status(400).json({ message: 'Union position is required.' });
      }
      if (adminType === 'librarian') {
        if (!libraryId) return res.status(400).json({ message: 'Library ID is required.' });
      }
      const countErr = await validateAdminCount(adminType);
      if (countErr) return res.status(400).json({ message: countErr });
    }

    const otp    = makeOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    pendingRegistrations.set(email, {
      otp, expiry,
      payload: {
        name, email, password, role,
        registrationNumber, indexNumber, department, year,
        isHosteller: isHosteller === true || isHosteller === 'true',
        hostelName,
        adminType, wardenId, wardenHostel, unionId, unionPosition, libraryId,
      },
    });

    await sendOtpEmail(email, otp, 'register');
    res.json({ message: `OTP sent to ${email}. Valid for 10 minutes.`, email });
  } catch (err) {
    console.error('sendRegisterOtp error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Check SMTP configuration.' });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── REGISTER STEP 2: Verify OTP and create user ───────────────────────
// ══════════════════════════════════════════════════════════════════════
exports.verifyRegisterOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const pending = pendingRegistrations.get(email);

    if (!pending) return res.status(400).json({ message: 'No pending registration found. Please start over.' });
    if (new Date() > pending.expiry) {
      pendingRegistrations.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (pending.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });

    pendingRegistrations.delete(email);
    const p = pending.payload;

    const doc = {
      name: p.name, email: p.email, password: p.password,
      role: p.role === 'admin' ? 'admin' : 'student',
      isEmailVerified: true,
    };

    if (p.role !== 'admin') {
      Object.assign(doc, {
        registrationNumber: p.registrationNumber,
        indexNumber:        p.indexNumber,
        department:         p.department || '',
        year:               p.year       || '',
        isHosteller:        p.isHosteller,
        hostelName:         p.isHosteller ? p.hostelName : '',
      });
    } else {
      doc.adminType = p.adminType;
      if (p.adminType === 'hostel_warden') { doc.wardenId = p.wardenId; doc.wardenHostel = p.wardenHostel; }
      if (p.adminType === 'union_member')  { doc.unionId  = p.unionId;  doc.unionPosition = p.unionPosition; }
      if (p.adminType === 'librarian')     { doc.libraryId = p.libraryId; }
    }

    const user = await User.create(doc);
    res.status(201).json(formatUser(user, generateToken(user._id)));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── Resend OTP for registration ───────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════
exports.resendOtp = async (req, res) => {
  const { email, purpose } = req.body; // purpose: 'register' (login no longer uses OTP)
  try {
    const otp    = makeOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const pending = pendingRegistrations.get(email);
    if (!pending) return res.status(400).json({ message: 'No pending registration. Please start over.' });
    pending.otp    = otp;
    pending.expiry = expiry;
    pendingRegistrations.set(email, pending);

    await sendOtpEmail(email, otp, purpose || 'register');
    res.json({ message: `New OTP sent to ${email}.` });
  } catch (err) {
    console.error('resendOtp error:', err);
    res.status(500).json({ message: 'Failed to resend OTP.' });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── LOGIN: simple email + password, no OTP ────────────────────────────
// ══════════════════════════════════════════════════════════════════════
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && await user.matchPassword(password)) {

      // ── Temporary block check ──
      if (user.blockedUntil) {
        if (user.blockedUntil > new Date()) {
          const until = user.blockedUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          return res.status(403).json({
            message: `Your account has been blocked by admin until ${until}. Reason: ${user.blockReason || 'Not specified'}`,
          });
        }
        // Block period has expired — auto-clear it and let them log in.
        user.isActive     = true;
        user.blockedUntil = null;
        user.blockReason  = '';
        await user.save();
      }

      return res.json(formatUser(user, generateToken(user._id)));
    }
    res.status(401).json({ message: 'Invalid email or password' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── FORGOT PASSWORD STEP 1: Send OTP to registered email ─────────────
// ══════════════════════════════════════════════════════════════════════
exports.sendForgotPasswordOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    // Don't reveal whether the email exists, for security —
    // but for a small campus app, a clear message is more helpful:
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const otp    = makeOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp       = otp;
    user.otpExpiry = expiry;
    await user.save();

    await sendOtpEmail(email, otp, 'reset');
    res.json({ message: `OTP sent to ${email}. Valid for 10 minutes.`, email });
  } catch (err) {
    console.error('sendForgotPasswordOtp error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Check SMTP configuration.' });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── FORGOT PASSWORD STEP 2: Verify OTP only (does not reset yet) ─────
// Lets the frontend confirm the OTP before showing the new-password form.
// ══════════════════════════════════════════════════════════════════════
exports.verifyForgotPasswordOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: 'No OTP requested. Please start over.' });
    if (new Date() > user.otpExpiry) {
      user.otp = null; user.otpExpiry = null; await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    res.json({ message: 'OTP verified. You can now set a new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── FORGOT PASSWORD STEP 3: Verify OTP again & set new password ──────
// (OTP re-checked here too, so this endpoint is self-contained/secure)
// ══════════════════════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: 'No OTP requested. Please start over.' });
    if (new Date() > user.otpExpiry) {
      user.otp = null; user.otpExpiry = null; await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    user.password  = newPassword; // pre('save') hook hashes it
    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════
// ── Resend OTP for forgot-password flow ───────────────────────────────
// ══════════════════════════════════════════════════════════════════════
exports.resendForgotPasswordOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const otp    = makeOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = otp; user.otpExpiry = expiry;
    await user.save();

    await sendOtpEmail(email, otp, 'reset');
    res.json({ message: `New OTP sent to ${email}.` });
  } catch (err) {
    console.error('resendForgotPasswordOtp error:', err);
    res.status(500).json({ message: 'Failed to resend OTP.' });
  }
};

// ── Get current user ──────────────────────────────────────────────────
exports.getMe = async (req, res) => res.json(formatUser(req.user, generateToken(req.user._id)));

// ── Update profile ────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, year, isHosteller, hostelName, unionPosition } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name)       user.name       = name;
    if (department) user.department = department;
    if (year)       user.year       = year;
    if (req.file)   user.avatar     = `/uploads/${req.file.filename}`;

    if (user.role === 'student') {
      if (isHosteller !== undefined) {
        user.isHosteller = isHosteller === true || isHosteller === 'true';
        user.hostelName  = user.isHosteller ? (hostelName || user.hostelName) : '';
      }
    }
    if (user.adminType === 'union_member' && unionPosition) user.unionPosition = unionPosition;

    await user.save();
    res.json(formatUser(user, generateToken(user._id)));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ── Change password (while logged in) ─────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!await user.matchPassword(currentPassword)) return res.status(400).json({ message: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Legacy alias (kept for backward compatibility) ─
exports.registerUser = exports.sendRegisterOtp;
