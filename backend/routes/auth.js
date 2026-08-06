const router = require('express').Router();
const {
  sendRegisterOtp, verifyRegisterOtp, resendOtp,
  loginUser,
  sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword, resendForgotPasswordOtp,
  getMe, updateProfile, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload      = require('../middleware/upload');

// ── Register (OTP required before account creation) ──────────────────
router.post('/register/send-otp',   sendRegisterOtp);   // Step 1: validate & send OTP
router.post('/register/verify-otp', verifyRegisterOtp); // Step 2: verify OTP & create user
router.post('/resend-otp',          resendOtp);         // Resend OTP for registration

// ── Login (simple email + password, no OTP) ───────────────────────────
router.post('/login', loginUser);

// ── Forgot Password (OTP-based reset) ──────────────────────────────────
router.post('/forgot-password/send-otp',    sendForgotPasswordOtp);    // Step 1: send OTP
router.post('/forgot-password/verify-otp',  verifyForgotPasswordOtp);  // Step 2: verify OTP
router.post('/forgot-password/reset',       resetPassword);            // Step 3: set new password
router.post('/forgot-password/resend-otp',  resendForgotPasswordOtp);  // Resend OTP

// ── Authenticated routes ──────────────────────────────────────────────
router.get('/me',              protect, getMe);
router.put('/profile',         protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
